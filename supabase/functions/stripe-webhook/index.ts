// Supabase Edge Function: Stripe Webhook Handler
// Processes Stripe webhook events for order fulfillment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get the signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe signature')
    }

    // Get the raw body
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log event
    console.log(`Processing webhook event: ${event.type}`)

    // Process event based on type
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update order status
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            payment_status: 'succeeded',
            stripe_charge_id: paymentIntent.latest_charge as string,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .select()
          .single()

        if (orderError) {
          console.error('Failed to update order:', orderError)
          throw orderError
        }

        // Create order event
        await supabase
          .from('order_events')
          .insert({
            order_id: order.id,
            event_type: 'payment_succeeded',
            event_data: {
              payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
            },
            created_by: 'stripe_webhook',
          })

        // Convert reserved inventory to sold
        await supabase
          .from('inventory_transactions')
          .update({
            transaction_type: 'sale',
            notes: `Confirmed sale for order ${order.order_number}`,
          })
          .eq('order_id', order.id)
          .eq('transaction_type', 'reserved')

        // Send confirmation email (implement email service)
        await sendOrderConfirmationEmail(order, supabase)

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Update order status
        const { data: order } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .select()
          .single()

        if (order) {
          // Create order event
          await supabase
            .from('order_events')
            .insert({
              order_id: order.id,
              event_type: 'payment_failed',
              event_data: {
                payment_intent_id: paymentIntent.id,
                error: paymentIntent.last_payment_error,
              },
              created_by: 'stripe_webhook',
            })

          // Release reserved inventory
          await releaseInventory(order.id, supabase)
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        // Find order by charge ID
        const { data: order } = await supabase
          .from('orders')
          .update({
            payment_status: charge.refunded ? 'refunded' : 'partially_refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_charge_id', charge.id)
          .select()
          .single()

        if (order) {
          // Create order event
          await supabase
            .from('order_events')
            .insert({
              order_id: order.id,
              event_type: 'payment_refunded',
              event_data: {
                charge_id: charge.id,
                amount_refunded: charge.amount_refunded / 100,
                reason: charge.refunds?.data[0]?.reason,
              },
              created_by: 'stripe_webhook',
            })

          // Handle inventory return if full refund
          if (charge.refunded) {
            await returnInventory(order, supabase)
          }
        }

        break
      }

      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer

        // Update or create customer in database
        const { error } = await supabase
          .from('customers')
          .upsert({
            stripe_customer_id: customer.id,
            email: customer.email!,
            first_name: customer.name?.split(' ')[0],
            last_name: customer.name?.split(' ').slice(1).join(' '),
            phone: customer.phone || null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_customer_id',
          })

        if (error) {
          console.error('Failed to upsert customer:', error)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to send order confirmation email
async function sendOrderConfirmationEmail(order: any, supabase: any) {
  // This would integrate with your email service (SendGrid, Postmark, etc.)
  // For now, just log
  console.log(`Sending order confirmation email for order ${order.order_number} to ${order.customer_email}`)

  // You can use Supabase's email auth or integrate with an email service
  // Example with SendGrid:
  // const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
  // await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${sendgridApiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{
  //       to: [{ email: order.customer_email }],
  //     }],
  //     from: { email: 'orders@jaylataylor.com', name: 'Jayla Taylor Fashion' },
  //     subject: `Order Confirmation - ${order.order_number}`,
  //     content: [{
  //       type: 'text/html',
  //       value: generateOrderConfirmationHTML(order),
  //     }],
  //   }),
  // })
}

// Helper function to release inventory
async function releaseInventory(orderId: string, supabase: any) {
  // Get inventory transactions for this order
  const { data: transactions } = await supabase
    .from('inventory_transactions')
    .select('*, products(*)')
    .eq('order_id', orderId)
    .eq('transaction_type', 'reserved')

  if (transactions) {
    for (const transaction of transactions) {
      // Return inventory to product
      await supabase
        .from('products')
        .update({
          inventory_count: transaction.products.inventory_count + Math.abs(transaction.quantity_change),
        })
        .eq('id', transaction.product_id)

      // Mark transaction as cancelled
      await supabase
        .from('inventory_transactions')
        .update({
          transaction_type: 'adjustment',
          notes: 'Released due to payment failure',
        })
        .eq('id', transaction.id)
    }
  }
}

// Helper function to return inventory for refunds
async function returnInventory(order: any, supabase: any) {
  // Get all items from the order
  const items = order.items || []

  for (const item of items) {
    // Find the product
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('sku', item.id)
      .single()

    if (product) {
      // Create return transaction
      await supabase
        .from('inventory_transactions')
        .insert({
          product_id: product.id,
          quantity_change: item.quantity,
          transaction_type: 'return',
          order_id: order.id,
          notes: `Returned from order ${order.order_number}`,
        })

      // Update product inventory
      await supabase
        .from('products')
        .update({
          inventory_count: product.inventory_count + item.quantity,
        })
        .eq('id', product.id)
    }
  }
}