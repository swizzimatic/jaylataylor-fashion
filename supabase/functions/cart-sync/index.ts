// Supabase Edge Function: Cart Sync
// Manages persistent cart sessions across devices

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get session ID from header
    const sessionId = req.headers.get('x-session-id')
    if (!sessionId) {
      throw new Error('Session ID required')
    }

    // Parse URL to get the action
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const action = pathSegments[pathSegments.length - 1]

    // Get authenticated user if available
    const authHeader = req.headers.get('authorization')
    let userId = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
    }

    switch (req.method) {
      case 'GET': {
        // Get cart session
        const { data: cart, error } = await supabase
          .from('cart_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (error && error.code !== 'PGRST116') { // Not found is OK
          throw error
        }

        if (!cart) {
          // Create new cart session
          const newCart = {
            session_id: sessionId,
            customer_id: userId,
            items: [],
            subtotal: 0,
            total_amount: 0,
          }

          const { data: createdCart, error: createError } = await supabase
            .from('cart_sessions')
            .insert(newCart)
            .select()
            .single()

          if (createError) {
            throw createError
          }

          return new Response(
            JSON.stringify(createdCart),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // If user logged in, associate cart with user
        if (userId && !cart.customer_id) {
          await supabase
            .from('cart_sessions')
            .update({ customer_id: userId })
            .eq('session_id', sessionId)
        }

        return new Response(
          JSON.stringify(cart),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'POST': {
        // Add item to cart
        const { productId, quantity, size, color } = await req.json()

        // Validate product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('sku', productId)
          .eq('is_available', true)
          .eq('not_for_sale', false)
          .single()

        if (productError || !product) {
          throw new Error('Product not available')
        }

        if (product.inventory_count < quantity) {
          throw new Error('Insufficient inventory')
        }

        // Get current cart
        const { data: cart, error: cartError } = await supabase
          .from('cart_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .single()

        if (cartError) {
          throw cartError
        }

        // Update cart items
        const items = cart.items || []
        const existingItemIndex = items.findIndex(
          (item: any) => item.id === productId && item.size === size && item.color === color
        )

        if (existingItemIndex >= 0) {
          items[existingItemIndex].quantity += quantity
        } else {
          items.push({
            id: productId,
            name: product.name,
            price: product.sale_price || product.price,
            quantity,
            size,
            color,
            image: product.images?.[0] || '',
          })
        }

        // Calculate new totals
        const subtotal = items.reduce((sum: number, item: any) =>
          sum + (item.price * item.quantity), 0
        )
        const shipping = subtotal >= 100 ? 0 : 10
        const tax = subtotal * 0.0875
        const total = subtotal + shipping + tax

        // Update cart
        const { data: updatedCart, error: updateError } = await supabase
          .from('cart_sessions')
          .update({
            items,
            subtotal,
            shipping_amount: shipping,
            tax_amount: tax,
            total_amount: total,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify(updatedCart),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'PUT': {
        // Update cart items (full replacement)
        const { items } = await req.json()

        // Validate all products
        const productIds = items.map((item: any) => item.id)
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('sku', productIds)

        if (productsError) {
          throw productsError
        }

        // Validate inventory for all items
        for (const item of items) {
          const product = products.find(p => p.sku === item.id)
          if (!product) {
            throw new Error(`Product ${item.id} not found`)
          }
          if (product.inventory_count < item.quantity) {
            throw new Error(`Insufficient inventory for ${product.name}`)
          }
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) =>
          sum + (item.price * item.quantity), 0
        )
        const shipping = subtotal >= 100 ? 0 : 10
        const tax = subtotal * 0.0875
        const total = subtotal + shipping + tax

        // Update cart
        const { data: updatedCart, error: updateError } = await supabase
          .from('cart_sessions')
          .update({
            items,
            subtotal,
            shipping_amount: shipping,
            tax_amount: tax,
            total_amount: total,
            customer_id: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify(updatedCart),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'DELETE': {
        // Clear cart or remove specific item
        if (action === 'clear') {
          // Clear entire cart
          const { data: clearedCart, error } = await supabase
            .from('cart_sessions')
            .update({
              items: [],
              subtotal: 0,
              shipping_amount: 0,
              tax_amount: 0,
              total_amount: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .select()
            .single()

          if (error) {
            throw error
          }

          return new Response(
            JSON.stringify(clearedCart),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Remove specific item
          const { productId, size, color } = await req.json()

          const { data: cart, error: cartError } = await supabase
            .from('cart_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single()

          if (cartError) {
            throw cartError
          }

          // Filter out the item
          const items = (cart.items || []).filter((item: any) =>
            !(item.id === productId && item.size === size && item.color === color)
          )

          // Recalculate totals
          const subtotal = items.reduce((sum: number, item: any) =>
            sum + (item.price * item.quantity), 0
          )
          const shipping = subtotal >= 100 ? 0 : 10
          const tax = subtotal * 0.0875
          const total = subtotal + shipping + tax

          // Update cart
          const { data: updatedCart, error: updateError } = await supabase
            .from('cart_sessions')
            .update({
              items,
              subtotal,
              shipping_amount: shipping,
              tax_amount: tax,
              total_amount: total,
              updated_at: new Date().toISOString(),
            })
            .eq('session_id', sessionId)
            .select()
            .single()

          if (updateError) {
            throw updateError
          }

          return new Response(
            JSON.stringify(updatedCart),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Cart sync error:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})