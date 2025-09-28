// Contact Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    initializeNewsletterForm();
});

// Contact Form Handling
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    contactForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous messages
        formMessage.className = 'form-message';
        formMessage.textContent = '';
        
        // Validate form
        if (!validateContactForm()) {
            showFormMessage('Please fill in all required fields correctly.', 'error');
            return;
        }
        
        // Disable submit button
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Collect form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            inquiryType: document.getElementById('inquiryType').value,
            message: document.getElementById('message').value.trim(),
            newsletter: document.getElementById('newsletter').checked,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Send to backend
            const response = await fetch('https://www.jaylataylor.com/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showFormMessage('Thank you for your message! We\'ll get back to you within 2-3 business days.', 'success');
                contactForm.reset();
                
                // If newsletter was checked, subscribe
                if (formData.newsletter) {
                    subscribeToNewsletter(formData.email);
                }
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            showFormMessage('Sorry, there was an error sending your message. Please try again later.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Real-time validation
    const requiredFields = contactForm?.querySelectorAll('[required]');
    requiredFields?.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

// Form Validation
function validateContactForm() {
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const inquiryType = document.getElementById('inquiryType');
    const message = document.getElementById('message');
    
    let isValid = true;
    
    // Validate each field
    if (!validateField(firstName)) isValid = false;
    if (!validateField(lastName)) isValid = false;
    if (!validateField(email)) isValid = false;
    if (!validateField(inquiryType)) isValid = false;
    if (!validateField(message)) isValid = false;
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    
    // Remove previous error state
    field.classList.remove('error');
    const errorMsg = field.parentElement.querySelector('.field-error');
    if (errorMsg) errorMsg.remove();
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        isValid = false;
    }
    // Email validation
    else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            isValid = false;
        }
    }
    // Phone validation (optional field)
    else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value) || value.length < 10) {
            showFieldError(field, 'Please enter a valid phone number');
            isValid = false;
        }
    }
    // Select validation
    else if (field.tagName === 'SELECT' && field.hasAttribute('required') && !value) {
        showFieldError(field, 'Please select an option');
        isValid = false;
    }
    // Message length validation
    else if (field.id === 'message' && value && value.length < 10) {
        showFieldError(field, 'Please enter at least 10 characters');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    field.parentElement.appendChild(errorDiv);
}

function showFormMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Newsletter Subscription
function initializeNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const submitBtn = this.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            
            if (!email) return;
            
            // Disable form
            emailInput.disabled = true;
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Subscribing...';
            
            try {
                const success = await subscribeToNewsletter(email);
                
                if (success) {
                    emailInput.value = '';
                    showNewsletterMessage(form, 'Successfully subscribed!', 'success');
                } else {
                    throw new Error('Subscription failed');
                }
            } catch (error) {
                showNewsletterMessage(form, 'Failed to subscribe. Please try again.', 'error');
            } finally {
                // Re-enable form
                emailInput.disabled = false;
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    });
}

async function subscribeToNewsletter(email) {
    try {
        const response = await fetch('https://www.jaylataylor.com/api/newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return false;
    }
}

function showNewsletterMessage(form, message, type) {
    // Remove existing message
    const existingMsg = form.parentElement.querySelector('.newsletter-message');
    if (existingMsg) existingMsg.remove();
    
    // Create new message
    const msgDiv = document.createElement('div');
    msgDiv.className = 'newsletter-message';
    msgDiv.textContent = message;
    msgDiv.style.marginTop = '0.5rem';
    msgDiv.style.fontSize = '0.875rem';
    msgDiv.style.color = type === 'success' ? 'var(--gold-primary)' : '#dc3545';
    
    form.parentElement.appendChild(msgDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        msgDiv.remove();
    }, 5000);
}

// Phone number formatting
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('phone');
    
    phoneInput?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else if (value.length <= 10) {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        
        e.target.value = value;
    });
});

// Character counter for message field
document.addEventListener('DOMContentLoaded', function() {
    const messageField = document.getElementById('message');
    
    if (messageField) {
        // Create character counter
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.style.fontSize = '0.875rem';
        counter.style.color = 'var(--text-secondary)';
        counter.style.marginTop = '0.25rem';
        counter.style.textAlign = 'right';
        messageField.parentElement.appendChild(counter);
        
        // Update counter
        function updateCounter() {
            const length = messageField.value.length;
            const maxLength = 1000;
            counter.textContent = `${length} / ${maxLength} characters`;
            
            if (length > maxLength * 0.9) {
                counter.style.color = '#dc3545';
            } else {
                counter.style.color = 'var(--text-secondary)';
            }
        }
        
        messageField.addEventListener('input', updateCounter);
        updateCounter();
    }
});

// Initialize map (placeholder functionality)
document.addEventListener('DOMContentLoaded', function() {
    const mapOverlay = document.querySelector('.map-overlay a');
    
    mapOverlay?.addEventListener('click', function(e) {
        e.preventDefault();
        // Open Google Maps with the studio location
        const address = '123 Fashion Avenue, SoHo, New York, NY 10013';
        const encodedAddress = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    });
});

// Add CSS for error states dynamically
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .form-group input.error,
        .form-group select.error,
        .form-group textarea.error {
            border-color: #dc3545 !important;
        }
        
        .newsletter-message {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});
