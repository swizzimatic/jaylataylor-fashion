// Secured Product Display with XSS Prevention
(function() {
    'use strict';

    // Import security utilities
    const { escapeHTML, createSafeElement, sanitizeHTML } = window.SecurityUtils || {};

    // Create product card with XSS protection
    function createSecureProductCard(product) {
        try {
            const card = document.createElement("div");
            card.className = "product-card";
            card.dataset.productId = product.id;
            card.dataset.category = product.category;

            // Create image container
            const imageContainer = createSafeElement('div', null, { class: 'product-image' });

            // Create image with secure attributes
            const img = document.createElement('img');
            const productImage = product.images?.[0] || "/assets/images/placeholder.jpg";
            const fallbackImage = "/assets/images/placeholder.jpg";

            // Set src attribute safely
            img.src = productImage;
            img.alt = escapeHTML(product.name || "Product Image");
            img.onerror = function() {
                this.onerror = null;
                this.src = fallbackImage;
            };

            imageContainer.appendChild(img);

            // Create overlay
            const overlay = createSafeElement('div', null, { class: 'product-overlay' });
            const quickViewBtn = createSafeElement('button',
                product.notForSale ? "View Details" : "Quick View",
                {
                    class: 'btn btn-outline quick-view-btn',
                    'data-product-id': product.id
                }
            );
            overlay.appendChild(quickViewBtn);
            imageContainer.appendChild(overlay);

            // Create product info
            const productInfo = createSafeElement('div', null, { class: 'product-info' });

            // Add product title (escaped)
            const title = createSafeElement('h3', product.name || "Unknown Product", { class: 'product-title' });
            productInfo.appendChild(title);

            // Add price display (escaped)
            const priceDisplay = product.notForSale
                ? "Archive Piece - Not For Sale"
                : (product.price ? `$${product.price}` : "Price on request");
            const price = createSafeElement('p', priceDisplay, { class: 'product-price' });
            productInfo.appendChild(price);

            // Add button if not archive piece
            if (!product.notForSale && product.price) {
                const addToCartBtn = createSafeElement('button', 'Add to Cart', {
                    class: 'btn btn-primary add-to-cart',
                    'data-product-id': product.id
                });

                // Store product data securely
                addToCartBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.images?.[0],
                        category: product.category
                    });
                });

                productInfo.appendChild(addToCartBtn);
            }

            // Assemble card
            card.appendChild(imageContainer);
            card.appendChild(productInfo);

            // Add click event for product details
            imageContainer.addEventListener("click", () => {
                window.location.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
            });

            // Quick view functionality
            quickViewBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                showSecureQuickView(product);
            });

            return card;
        } catch (error) {
            console.error("Error creating secure product card:", error);
            return null;
        }
    }

    // Secure quick view modal
    function showSecureQuickView(product) {
        const modal = document.getElementById('quickViewModal');
        if (!modal) return;

        // Use safe text content instead of innerHTML
        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = product.name || 'Product Details';
        }

        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            // Clear existing content
            modalBody.innerHTML = '';

            // Build modal content safely
            const container = createSafeElement('div', null, { class: 'quick-view-content' });

            // Add image
            const imgContainer = createSafeElement('div', null, { class: 'product-image-container' });
            const img = document.createElement('img');
            img.src = product.images?.[0] || '/assets/images/placeholder.jpg';
            img.alt = escapeHTML(product.name);
            img.className = 'product-image';
            imgContainer.appendChild(img);
            container.appendChild(imgContainer);

            // Add product details
            const details = createSafeElement('div', null, { class: 'product-details' });

            // Price
            const priceElement = createSafeElement('p', null, { class: 'product-price' });
            priceElement.textContent = product.notForSale ? 'Archive Piece - Not For Sale' : `$${product.price}`;
            details.appendChild(priceElement);

            // Description
            if (product.description) {
                const desc = createSafeElement('p', product.description, { class: 'product-description' });
                details.appendChild(desc);
            }

            // Sizes
            if (product.sizes && product.sizes.length > 0) {
                const sizesContainer = createSafeElement('div', null, { class: 'product-sizes' });
                const sizesLabel = createSafeElement('label', 'Sizes: ');
                sizesContainer.appendChild(sizesLabel);

                product.sizes.forEach(size => {
                    const sizeSpan = createSafeElement('span', size, { class: 'size-option' });
                    sizesContainer.appendChild(sizeSpan);
                });

                details.appendChild(sizesContainer);
            }

            // Colors
            if (product.colors && product.colors.length > 0) {
                const colorsContainer = createSafeElement('div', null, { class: 'product-colors' });
                const colorsLabel = createSafeElement('label', 'Colors: ');
                colorsContainer.appendChild(colorsLabel);

                product.colors.forEach(color => {
                    const colorSpan = createSafeElement('span', color, { class: 'color-option' });
                    colorsContainer.appendChild(colorSpan);
                });

                details.appendChild(colorsContainer);
            }

            // Add to cart button
            if (!product.notForSale && product.price) {
                const addToCartBtn = createSafeElement('button', 'Add to Cart', {
                    class: 'btn btn-primary add-to-cart-modal'
                });

                addToCartBtn.addEventListener('click', () => {
                    addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.images?.[0],
                        category: product.category
                    });
                    // Close modal
                    if (modal.classList.contains('show')) {
                        modal.classList.remove('show');
                    }
                });

                details.appendChild(addToCartBtn);
            }

            container.appendChild(details);
            modalBody.appendChild(container);
        }

        // Show modal
        modal.classList.add('show');
    }

    // Secure add to cart function
    function addToCart(product) {
        try {
            // Validate product data
            if (!product.id || !product.name || !product.price) {
                console.error('Invalid product data');
                return;
            }

            // Sanitize product data before storage
            const sanitizedProduct = {
                id: escapeHTML(product.id),
                name: escapeHTML(product.name),
                price: parseFloat(product.price),
                image: product.image,
                category: escapeHTML(product.category),
                quantity: 1
            };

            // Get existing cart
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');

            // Check if product already in cart
            const existingItem = cart.find(item => item.id === sanitizedProduct.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(sanitizedProduct);
            }

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Update cart count
            updateCartCount();

            // Show success message
            showNotification(`${sanitizedProduct.name} added to cart!`, 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Error adding to cart', 'error');
        }
    }

    // Update cart count display
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((total, item) => total + item.quantity, 0);

        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = count;
        });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = createSafeElement('div', message, {
            class: `notification notification-${type}`
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Export secure functions
    window.SecureShop = {
        createSecureProductCard,
        showSecureQuickView,
        addToCart,
        updateCartCount,
        showNotification
    };
})();