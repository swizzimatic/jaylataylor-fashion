// Email Service for JayLaTaylor & PRSM Tech Marketplace
// Handles order confirmations, seller notifications, and automated emails

const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
        user: process.env.EMAIL_USER || 'noreply@jaylataylor.com',
        pass: process.env.EMAIL_PASSWORD || ''
    }
};

// Create transporter
let transporter = null;

// Initialize email service
function initializeEmailService() {
    try {
        transporter = nodemailer.createTransport(emailConfig);
        
        // Verify connection
        transporter.verify(function(error, success) {
            if (error) {
                console.error('Email service verification failed:', error);
                console.log('Email notifications will be disabled');
            } else {
                console.log('✅ Email service is ready');
            }
        });
    } catch (error) {
        console.error('Failed to initialize email service:', error);
    }
}

// Initialize on module load
initializeEmailService();

/**
 * Send order confirmation email to customer
 */
async function sendOrderConfirmation(orderData) {
    const {
        customerEmail,
        customerName,
        orderId,
        items,
        totalAmount,
        shippingAddress,
        estimatedDelivery
    } = orderData;

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                <strong>${item.name}</strong><br>
                Size: ${item.selectedSize || 'N/A'} | Color: ${item.selectedColor || 'N/A'}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                ${item.quantity}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                $${(item.price * item.quantity).toFixed(2)}
            </td>
        </tr>
    `).join('');

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Order Confirmation - Jayla Taylor</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">JAYLA TAYLOR</h1>
                <p style="color: #fff; margin-top: 10px;">Order Confirmation</p>
            </div>
            
            <div style="padding: 30px; background-color: #fff;">
                <h2 style="color: #1A1A1A; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">
                    Thank you for your order, ${customerName || 'Valued Customer'}!
                </h2>
                
                <p>Your order has been confirmed and is being processed. We'll send you another email when your items ship.</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderId}</p>
                    <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                    <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery || '5-7 business days'}</p>
                </div>
                
                <h3 style="color: #1A1A1A; margin-top: 30px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">
                                Total:
                            </td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; color: #D4AF37; font-size: 18px;">
                                $${totalAmount.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                
                ${shippingAddress ? `
                <h3 style="color: #1A1A1A; margin-top: 30px;">Shipping Address</h3>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p style="margin: 5px 0;">${shippingAddress.name || ''}</p>
                    <p style="margin: 5px 0;">${shippingAddress.line1 || ''}</p>
                    ${shippingAddress.line2 ? `<p style="margin: 5px 0;">${shippingAddress.line2}</p>` : ''}
                    <p style="margin: 5px 0;">${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.postal_code || ''}</p>
                    <p style="margin: 5px 0;">${shippingAddress.country || ''}</p>
                </div>
                ` : ''}
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 14px;">
                        If you have any questions about your order, please contact us at 
                        <a href="mailto:support@jaylataylor.com" style="color: #D4AF37;">support@jaylataylor.com</a>
                    </p>
                </div>
            </div>
            
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
                <p style="margin: 5px 0;">Follow us on social media</p>
                <p style="margin: 10px 0;">
                    <a href="#" style="color: #D4AF37; text-decoration: none; margin: 0 10px;">Instagram</a>
                    <a href="#" style="color: #D4AF37; text-decoration: none; margin: 0 10px;">Facebook</a>
                    <a href="#" style="color: #D4AF37; text-decoration: none; margin: 0 10px;">Twitter</a>
                </p>
                <p style="margin: 15px 0 5px; font-size: 12px; color: #999;">
                    © 2025 Jayla Taylor. All rights reserved.
                </p>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"Jayla Taylor" <${emailConfig.auth.user}>`,
        to: customerEmail,
        subject: `Order Confirmation - #${orderId}`,
        html: emailHtml
    };

    return sendEmail(mailOptions);
}

/**
 * Send seller notification for new order
 */
async function sendSellerNotification(orderData) {
    const {
        sellerEmail,
        sellerName,
        orderId,
        items,
        totalAmount,
        platformFee,
        sellerPayout,
        customerEmail
    } = orderData;

    const itemsList = items.map(item => 
        `• ${item.name} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Order - PRSM Tech Marketplace</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">PRSM TECH MARKETPLACE</h1>
                <p style="color: #fff; margin-top: 10px;">New Order Received!</p>
            </div>
            
            <div style="padding: 30px; background-color: #fff;">
                <h2 style="color: #1A1A1A;">Congratulations, ${sellerName || 'Seller'}!</h2>
                <p>You have received a new order through PRSM Tech Marketplace.</p>
                
                <div style="background-color: #d4f4dd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #1e7e34;">
                    <h3 style="margin-top: 0; color: #1e7e34;">Order Summary</h3>
                    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                    <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerEmail}</p>
                    <p style="margin: 5px 0;"><strong>Order Total:</strong> $${totalAmount.toFixed(2)}</p>
                </div>
                
                <h3>Items Ordered:</h3>
                <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${itemsList}</pre>
                
                <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0;">Payment Breakdown</h3>
                    <table style="width: 100%;">
                        <tr>
                            <td>Order Total:</td>
                            <td style="text-align: right;">$${totalAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Platform Fee (10%):</td>
                            <td style="text-align: right; color: #dc3545;">-$${platformFee.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Stripe Processing (2.9% + $0.30):</td>
                            <td style="text-align: right; color: #dc3545;">-$${((totalAmount * 0.029) + 0.30).toFixed(2)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #333;">
                            <td><strong>Your Payout:</strong></td>
                            <td style="text-align: right;"><strong style="color: #1e7e34; font-size: 18px;">$${sellerPayout.toFixed(2)}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #856404;">
                    <h4 style="margin-top: 0; color: #856404;">Next Steps:</h4>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Prepare the order for shipping</li>
                        <li>Ship within 2 business days</li>
                        <li>Update tracking information in your dashboard</li>
                        <li>Payout will be transferred to your bank account within 2-3 business days</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL}/seller-dashboard.html" style="display: inline-block; padding: 12px 30px; background-color: #D4AF37; color: #1A1A1A; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
                </div>
            </div>
            
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
                <p style="margin: 5px 0;">PRSM Tech Marketplace</p>
                <p style="margin: 5px 0; font-size: 12px;">Empowering sellers with seamless payments</p>
                <p style="margin: 15px 0 5px; font-size: 12px; color: #999;">
                    © 2025 PRSM Tech. All rights reserved.
                </p>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"PRSM Tech Marketplace" <${emailConfig.auth.user}>`,
        to: sellerEmail,
        subject: `New Order Received - #${orderId}`,
        html: emailHtml
    };

    return sendEmail(mailOptions);
}

/**
 * Send shipping notification to customer
 */
async function sendShippingNotification(shippingData) {
    const {
        customerEmail,
        customerName,
        orderId,
        trackingNumber,
        carrier,
        estimatedDelivery
    } = shippingData;

    const trackingUrl = getTrackingUrl(carrier, trackingNumber);

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Your Order Has Shipped - Jayla Taylor</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">JAYLA TAYLOR</h1>
                <p style="color: #fff; margin-top: 10px;">Your Order Has Shipped!</p>
            </div>
            
            <div style="padding: 30px; background-color: #fff;">
                <h2 style="color: #1A1A1A;">Great news, ${customerName || 'Valued Customer'}!</h2>
                <p>Your order #${orderId} has been shipped and is on its way to you.</p>
                
                <div style="background-color: #d4f4dd; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center;">
                    <h3 style="margin-top: 0; color: #1e7e34;">Tracking Information</h3>
                    <p style="margin: 10px 0;"><strong>Carrier:</strong> ${carrier}</p>
                    <p style="margin: 10px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
                    <p style="margin: 10px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
                    ${trackingUrl ? `
                    <a href="${trackingUrl}" style="display: inline-block; margin-top: 15px; padding: 12px 30px; background-color: #D4AF37; color: #1A1A1A; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Track Your Package
                    </a>
                    ` : ''}
                </div>
                
                <div style="margin-top: 30px;">
                    <h3 style="color: #1A1A1A;">Delivery Tips:</h3>
                    <ul style="color: #666;">
                        <li>Make sure someone is available to receive the package</li>
                        <li>Check your tracking regularly for updates</li>
                        <li>Contact us if you have any delivery concerns</li>
                    </ul>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; font-size: 14px;">
                        If you have any questions about your shipment, please contact us at 
                        <a href="mailto:support@jaylataylor.com" style="color: #D4AF37;">support@jaylataylor.com</a>
                    </p>
                </div>
            </div>
            
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
                <p style="margin: 5px 0;">Thank you for shopping with Jayla Taylor</p>
                <p style="margin: 15px 0 5px; font-size: 12px; color: #999;">
                    © 2025 Jayla Taylor. All rights reserved.
                </p>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"Jayla Taylor" <${emailConfig.auth.user}>`,
        to: customerEmail,
        subject: `Your Order Has Shipped - #${orderId}`,
        html: emailHtml
    };

    return sendEmail(mailOptions);
}

/**
 * Send seller onboarding welcome email
 */
async function sendSellerWelcome(sellerData) {
    const { email, businessName } = sellerData;

    const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Welcome to PRSM Tech Marketplace</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1A1A1A; padding: 30px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">PRSM TECH MARKETPLACE</h1>
                <p style="color: #fff; margin-top: 10px;">Welcome Aboard!</p>
            </div>
            
            <div style="padding: 30px; background-color: #fff;">
                <h2 style="color: #1A1A1A;">Welcome to PRSM Tech Marketplace${businessName ? `, ${businessName}` : ''}!</h2>
                
                <p>Congratulations on completing your seller account setup! You're now ready to start selling on our platform.</p>
                
                <div style="background-color: #d4f4dd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #1e7e34;">Your Account is Active!</h3>
                    <p>You can now:</p>
                    <ul>
                        <li>List and manage products</li>
                        <li>Process payments securely through Stripe</li>
                        <li>Track your sales and analytics</li>
                        <li>Receive automatic daily payouts</li>
                    </ul>
                </div>
                
                <h3>Platform Information:</h3>
                <table style="width: 100%; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <tr>
                        <td><strong>Platform Fee:</strong></td>
                        <td>10% per transaction</td>
                    </tr>
                    <tr>
                        <td><strong>Payment Processing:</strong></td>
                        <td>2.9% + $0.30 (Stripe fees)</td>
                    </tr>
                    <tr>
                        <td><strong>Payout Schedule:</strong></td>
                        <td>Daily automatic transfers</td>
                    </tr>
                    <tr>
                        <td><strong>Minimum Payout:</strong></td>
                        <td>$1.00</td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/seller-dashboard.html" style="display: inline-block; padding: 12px 30px; background-color: #D4AF37; color: #1A1A1A; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Go to Dashboard
                    </a>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h4 style="margin-top: 0; color: #856404;">Quick Start Guide:</h4>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Add your products with clear photos and descriptions</li>
                        <li>Set competitive prices (remember the 10% platform fee)</li>
                        <li>Respond to orders promptly</li>
                        <li>Ship within 2 business days</li>
                        <li>Maintain high customer satisfaction</li>
                    </ol>
                </div>
                
                <p style="color: #666;">
                    If you need any assistance, our support team is here to help at 
                    <a href="mailto:sellers@prsmtech.com" style="color: #D4AF37;">sellers@prsmtech.com</a>
                </p>
            </div>
            
            <div style="background-color: #333; color: #fff; padding: 20px; text-align: center;">
                <p style="margin: 5px 0;">PRSM Tech Marketplace</p>
                <p style="margin: 5px 0; font-size: 12px;">Empowering sellers with seamless payments</p>
                <p style="margin: 15px 0 5px; font-size: 12px; color: #999;">
                    © 2025 PRSM Tech. All rights reserved.
                </p>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"PRSM Tech Marketplace" <${emailConfig.auth.user}>`,
        to: email,
        subject: 'Welcome to PRSM Tech Marketplace!',
        html: emailHtml
    };

    return sendEmail(mailOptions);
}

/**
 * Generic email sending function
 */
async function sendEmail(mailOptions) {
    if (!transporter) {
        console.log('Email service not configured. Email not sent:', mailOptions.subject);
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            messageId: info.messageId
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get tracking URL based on carrier
 */
function getTrackingUrl(carrier, trackingNumber) {
    const carriers = {
        'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
        'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
        'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
        'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    };

    return carriers[carrier.toLowerCase()] || null;
}

// Export functions
module.exports = {
    sendOrderConfirmation,
    sendSellerNotification,
    sendShippingNotification,
    sendSellerWelcome,
    sendEmail,
    initializeEmailService
};