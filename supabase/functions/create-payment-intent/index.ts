// Supabase Edge Function: Create Payment Intent
// Handles Stripe payment processing for JaylaTaylor.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
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
    const jaylaStripeAccountId = Deno.env.get('JAYLA_STRIPE_ACCOUNT_ID')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get request data
    const { cartItems, customerEmail, shippingAddress } = await req.json()

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Fetch product details from database
    const productIds = cartItems.map((item: any) => item.id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('sku', productIds)
      .eq('is_available', true)
      .eq('not_for_sale', false)

    if (productsError) {
      throw new Error('Failed to fetch products: ' + productsError.message)
    }

    if (!products || products.length === 0) {
      throw new Error('No valid products found')
    }

    // Calculate totals with server-side validation
    let subtotal = 0
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

    for (const cartItem of cartItems) {
      const product = products.find(p => p.sku === cartItem.id)

      if (!product) {
        throw new Error(`Product ${cartItem.id} not found`)
      }

      if (product.inventory_count < cartItem.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`)
      }

      const price = product.sale_price || product.price
      subtotal += price * cartItem.quantity

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: `${product.category} - Size: ${cartItem.size}, Color: ${cartItem.color}`,
            images: product.images?.length > 0 ? [product.images[0]] : undefined,
            metadata: {
              product_id: product.id,
              sku: product.sku,
              size: cartItem.size,
              color: cartItem.color,
            },
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: cartItem.quantity,
      })
    }

    // Calculate shipping (flat rate for now, can be made dynamic)
    const shippingAmount = subtotal >= 100 ? 0 : 10 // Free shipping over $100
    const taxRate = 0.0875 // 8.75% NYC tax rate
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + shippingAmount + taxAmount

    // Calculate platform fee (PRSM Tech takes 3% platform fee)
    const platformFeeAmount = Math.round(totalAmount * 0.03 * 100) // 3% in cents

    // Create or retrieve customer
    let stripeCustomerId = null
    if (customerEmail) {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      })

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      } else {
        const newCustomer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            source: 'jaylataylor.com',
          },
        })
        stripeCustomerId = newCustomer.id
      }
    }

    // Create payment intent with Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      receipt_email: customerEmail,
      shipping: shippingAddress ? {
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country || 'US',
        },
      } : undefined,
      metadata: {
        order_source: 'jaylataylor.com',
        subtotal: subtotal.toFixed(2),
        shipping: shippingAmount.toFixed(2),
        tax: taxAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        items: JSON.stringify(cartItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        }))),
      },
      // Stripe Connect: Send funds to Jayla's connected account
      transfer_data: jaylaStripeAccountId ? {
        destination: jaylaStripeAccountId,
      } : undefined,
      // Platform fee for PRSM Tech
      application_fee_amount: jaylaStripeAccountId ? platformFeeAmount : undefined,
      // Enable automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create order record in database
    const orderNumber = `JT-${Date.now()}`
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: customerEmail || 'guest@jaylataylor.com',
        items: cartItems,
        subtotal: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        platform_fee: platformFeeAmount / 100, // Convert back from cents
        total_amount: totalAmount,
        payment_status: 'pending',
        fulfillment_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        shipping_address: shippingAddress || {},
        billing_address: shippingAddress || {},
        metadata: {
          stripe_customer_id: stripeCustomerId,
          payment_intent_client_secret: paymentIntent.client_secret,
        },
      })
      .select()
      .single()

    if (orderError) {
      console.error('Failed to create order:', orderError)
      // Don't throw, continue with payment
    }

    // Reserve inventory
    for (const cartItem of cartItems) {
      const product = products.find(p => p.sku === cartItem.id)
      if (product) {
        await supabase
          .from('inventory_transactions')
          .insert({
            product_id: product.id,
            quantity_change: -cartItem.quantity,
            transaction_type: 'reserved',
            order_id: order?.id,
            notes: `Reserved for order ${orderNumber}`,
          })

        // Update product inventory count
        await supabase
          .from('products')
          .update({
            inventory_count: product.inventory_count - cartItem.quantity,
          })
          .eq('id', product.id)
      }
    }

    // Return client secret for frontend to complete payment
    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId: order?.id,
        orderNumber: orderNumber,
        amount: totalAmount,
        currency: 'usd',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error creating payment intent:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create payment intent',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})