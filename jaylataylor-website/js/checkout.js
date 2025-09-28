// Checkout Page JavaScript with Stripe Integration
document.addEventListener('DOMContentLoaded', async function() {
    
    // Backend API URL - Using custom domain
    const backendUrl = 'https://jaylataylor.com';
    
    // Initialize Stripe dynamically from backend config
    let stripe;
    let elements;
    try {
        const configRes = await fetch(`${backendUrl}/api/config`);
        const config = await configRes.json();
        const publishableKey = config.stripePublishableKey;
        if (!publishableKey || publishableKey === 'pk_test_placeholder') {
            throw new Error('Stripe publishable key not configured');
        }
        stripe = Stripe(publishableKey);
        elements = stripe.elements();
    } catch (e) {
        console.error('Stripe initialization failed:', e);
        const errorElement = document.getElementById('card-errors');
        if (errorElement) {
            errorElement.textContent = 'Payment configuration error. Please try again later.';
            errorElement.classList.add('visible');
        }
        return;
    }
    
    // Custom styling for Stripe card element
    const cardStyle = {
        style: {
            base: {
                color: '#F5F5F5',
                fontFamily: '"Lato", sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#999999'
                }
            },
            invalid: {
                color: '#DC3545',
                iconColor: '#DC3545'
            }
        }
    };
    
    // Create card element
    const cardElement = elements.create('card', cardStyle);
    cardElement.mount('#card-element');
    
    // Handle card element errors
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
            displayError.classList.add('visible');
        } else {
            displayError.textContent = '';
            displayError.classList.remove('visible');
        }
    });
    
    // Get cart data
    const cart = window.jaylaTaylorCart;
    const items = cart.items;
    
    // Shipping prices
    const shippingPrices = {
        standard: 25,
        express: 45,
        overnight: 75
    };
    
    let selectedShipping = 'standard';
    
    // Calculate totals
    function calculateTotals() {
        const subtotal = cart.getTotal();
        const shipping = subtotal > 500 ? 0 : shippingPrices[selectedShipping];
        const tax = subtotal * 0.08;
        const total = subtotal + shipping + tax;
        
        return { subtotal, shipping, tax, total };
    }
    
    // Display order items
    function displayOrderItems() {
        const orderItemsContainer = document.getElementById('orderItems');
        
        if (items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }
        
        orderItemsContainer.innerHTML = items.map(item => `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="order-item-details">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-quantity">Qty: ${item.quantity}</div>
                </div>
                <div class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');
    }
    
    // Update order summary
    function updateOrderSummary() {
        const { subtotal, shipping, tax, total } = calculateTotals();
        
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    }
    
    // Handle shipping method change
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', function() {
            selectedShipping = this.value;
            updateOrderSummary();
        });
    });
    
    // Initialize order display
    displayOrderItems();
    updateOrderSummary();
    
    // Form submission
    const form = document.getElementById('checkoutForm');
    const submitButton = document.getElementById('submitButton');
    const buttonText = document.getElementById('buttonText');
    const spinner = document.getElementById('spinner');
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Disable submit button
        submitButton.disabled = true;
        buttonText.textContent = 'Processing...';
        spinner.classList.remove('hidden');
        
        // Collect form data
        const formData = new FormData(form);
        const { total } = calculateTotals();
        
        // Create payment intent on your server
        try {
            // Create payment intent
            const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cartItems: items.map(item => ({
                        id: item.id,
                        quantity: item.quantity
                    }))
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                const message = data && (data.error || (data.details && data.details.errors && data.details.errors[0])) || 'Failed to create payment intent';
                // Surface restricted items if present
                if (data && data.details && data.details.restrictedItems && data.details.restrictedItems.length) {
                    throw new Error(`Cannot purchase: ${data.details.restrictedItems.join(', ')}`);
                }
                throw new Error(message);
            }
            
            const { clientSecret } = data;
            
            // Confirm payment with Stripe
            const { error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: `${formData.get('firstName')} ${formData.get('lastName')}`,
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        address: {
                            line1: formData.get('address'),
                            city: formData.get('city'),
                            state: formData.get('state'),
                            postal_code: formData.get('zipCode'),
                            country: 'US'
                        }
                    }
                }
            });
            
            if (error) {
                // Show error to customer
                const errorElement = document.getElementById('card-errors');
                errorElement.textContent = error.message;
                errorElement.classList.add('visible');
                
                // Re-enable submit button
                submitButton.disabled = false;
                buttonText.textContent = 'Complete Order';
                spinner.classList.add('hidden');
            } else {
                // Payment succeeded
                // Clear cart
                cart.items = [];
                cart.saveCart();
                
                // Show success message
                showSuccessMessage();
            }
            
        } catch (error) {
            console.error('Error:', error);
            
            // Show error message
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = error && error.message ? error.message : 'An error occurred. Please try again.';
            errorElement.classList.add('visible');
            
            // Re-enable submit button
            submitButton.disabled = false;
            buttonText.textContent = 'Complete Order';
            spinner.classList.add('hidden');
        }
    });
    
    // Success message
    function showSuccessMessage() {
        const container = document.querySelector('.checkout-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px; background-color: var(--secondary-dark); border-radius: 4px; grid-column: 1 / -1;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--accent-gold-2); margin-bottom: 1.5rem;"></i>
                <h2 style="margin-bottom: 1rem; color: var(--accent-gold-2);">Order Confirmed!</h2>
                <p style="margin-bottom: 2rem;">Thank you for your purchase. You will receive an order confirmation email shortly.</p>
                <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
            </div>
        `;
        
        // Update checkout steps
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.add('active');
        });
    }
    
    // Form validation
    form.addEventListener('input', function(event) {
        const input = event.target;
        
        // Phone number formatting
        if (input.id === 'phone') {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            input.value = value;
        }
        
        // ZIP code validation
        if (input.id === 'zipCode') {
            input.value = input.value.replace(/\D/g, '').slice(0, 5);
        }
    });
});

// Note: This is a simplified checkout implementation for demonstration purposes.
// In a production environment, you would need to:
// 1. Set up a backend server to handle payment processing
// 2. Create payment intents on the server
// 3. Use your actual Stripe publishable key
// 4. Implement proper error handling and validation
// 5. Add order confirmation emails
// 6. Store order information in a database
// 7. Implement proper security measures
