// Product Detail Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    window.location.href = "shop.html";
    return;
  }

  // State management
  let currentProduct = null;
  let selectedOptions = {
    color: null,
    size: null,
    quantity: 1,
  };

  // Load product data
  async function loadProductData() {
    try {
      const response = await fetch("data/products.json");
      const data = await response.json();

      // Find the product
      currentProduct = data.products.find((p) => p.id === productId);

      if (!currentProduct) {
        window.location.href = "shop.html";
        return;
      }

      // Find category info
      const category = data.categories.find(
        (c) => c.id === currentProduct.category,
      );

      // Populate product details
      populateProductDetails(currentProduct, category);

      // Load related products
      const relatedProducts = data.products
        .filter(
          (p) =>
            p.category === currentProduct.category &&
            p.id !== currentProduct.id,
        )
        .slice(0, 4);
      displayRelatedProducts(relatedProducts);
    } catch (error) {
      console.error("Error loading product data:", error);
    }
  }

  // Populate product details on the page
  function populateProductDetails(product, category) {
    // Breadcrumb
    document.getElementById("breadcrumbCategory").textContent = category.name;
    document.getElementById("breadcrumbProduct").textContent = product.name;

    // Product info
    document.getElementById("productCategory").textContent = category.name;
    document.getElementById("productTitle").textContent = product.name;
    document.getElementById("productPrice").textContent = product.price;
    document.getElementById("productDescription").innerHTML =
      `<p>${product.description}</p>`;

    // Main image
    const fallbackImage =
      "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
    const mainImage = document.getElementById("mainProductImage");
    mainImage.src = product.images[0];
    mainImage.alt = product.name;
    mainImage.onerror = function () {
      this.onerror = null;
      this.src = fallbackImage;
    };

    // Thumbnails (for demo, we'll duplicate the main image)
    const thumbnailContainer = document.getElementById("thumbnailImages");
    product.images.forEach((image, index) => {
      const thumbnail = document.createElement("div");
      thumbnail.className = "thumbnail" + (index === 0 ? " active" : "");
      const fallbackImage =
        "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
      thumbnail.innerHTML = `<img src="${image}" alt="${product.name}" onerror="this.onerror=null; this.src='${fallbackImage}'">`;
      thumbnail.addEventListener("click", () => switchImage(image, index));
      thumbnailContainer.appendChild(thumbnail);
    });

    // Colors - optimized for mobile performance
    if (product.colors && product.colors.length > 0) {
      document.getElementById("colorOption").style.display = "block";
      const colorContainer = document.getElementById("colorOptions");
      colorContainer.innerHTML = "";

      // Use document fragment for efficient DOM operations
      const fragment = document.createDocumentFragment();

      product.colors.forEach((color, index) => {
        const colorOption = document.createElement("div");
        colorOption.className = "color-option";
        colorOption.setAttribute("data-color", color);
        colorOption.setAttribute("title", color);
        colorOption.setAttribute("aria-label", `Select color ${color}`);
        colorOption.setAttribute("role", "button");
        colorOption.setAttribute("tabindex", "0");

        const colorSwatch = document.createElement("div");
        colorSwatch.className = "color-swatch";
        colorSwatch.style.backgroundColor = getColorCode(color);

        colorOption.appendChild(colorSwatch);

        // Use passive event listeners for better performance
        colorOption.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            selectColor(color, this);
          },
          { passive: false },
        );

        // Add keyboard support
        colorOption.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectColor(color, this);
          }
        });

        // Select first color by default with timeout to prevent blocking
        if (index === 0) {
          setTimeout(() => {
            if (!selectedOptions.color) {
              selectColor(color, colorOption);
            }
          }, 50);
        }

        fragment.appendChild(colorOption);
      });

      // Single DOM update
      colorContainer.appendChild(fragment);
    }

    // Sizes - optimized for mobile performance
    if (product.sizes && product.sizes.length > 0) {
      document.getElementById("sizeOption").style.display = "block";
      const sizeContainer = document.getElementById("sizeOptions");
      sizeContainer.innerHTML = "";

      // Use document fragment for efficient DOM operations
      const fragment = document.createDocumentFragment();

      product.sizes.forEach((size, index) => {
        const sizeOption = document.createElement("button");
        sizeOption.className = "size-option";
        sizeOption.textContent = size;
        sizeOption.setAttribute("data-size", size);
        sizeOption.setAttribute("aria-label", `Select size ${size}`);
        sizeOption.setAttribute("type", "button");

        // Use passive event listeners for better performance
        sizeOption.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            selectSize(size, this);
          },
          { passive: false },
        );

        // Add keyboard support
        sizeOption.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectSize(size, this);
          }
        });

        fragment.appendChild(sizeOption);
      });

      // Single DOM update
      sizeContainer.appendChild(fragment);
    }

    // Stock status
    if (!product.inStock) {
      const stockStatus = document.getElementById("stockStatus");
      stockStatus.classList.add("out-of-stock");
      stockStatus.innerHTML =
        '<i class="fas fa-times-circle"></i><span>Out of Stock</span>';
      document.getElementById("addToCartBtn").disabled = true;
      document.getElementById("buyNowBtn").disabled = true;
    }

    // Update Product Details tab with fabric content
    updateProductDetailsTab(product);
  }

  // Update Product Details tab with fabric content
  function updateProductDetailsTab(product) {
    const detailsPane = document.getElementById("details");
    if (detailsPane && product.fabricContent) {
      let detailsHTML = "<h3>Product Details</h3>";
      detailsHTML += "<h4>Materials & Composition</h4>";
      detailsHTML += "<ul>";

      if (product.fabricContent.shell) {
        detailsHTML += `<li><strong>Shell:</strong> ${product.fabricContent.shell}</li>`;
      }
      if (product.fabricContent.lining) {
        detailsHTML += `<li><strong>Lining:</strong> ${product.fabricContent.lining}</li>`;
      }

      detailsHTML += "</ul>";
      detailsHTML += "<h4>Additional Details</h4>";
      detailsHTML += "<ul>";
      detailsHTML += "<li>Handcrafted with attention to detail</li>";
      detailsHTML += "<li>Designed by Jayla Taylor</li>";
      detailsHTML += "<li>Made in USA</li>";
      detailsHTML += "</ul>";

      detailsPane.innerHTML = detailsHTML;
    }
  }

  // Switch main image
  function switchImage(image, index) {
    const fallbackImage =
      "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
    const mainImg = document.getElementById("mainProductImage");
    mainImg.src = image;
    mainImg.onerror = function () {
      this.onerror = null;
      this.src = fallbackImage;
    };

    // Update active thumbnail
    document.querySelectorAll(".thumbnail").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }
  // Color selection with debouncing and error handling
  function selectColor(color, element) {
    try {
      // Prevent rapid clicking
      if (element.dataset.processing) return;
      element.dataset.processing = "true";

      selectedOptions.color = color;

      // Use efficient class toggling
      const activeColor = document.querySelector(".color-option.selected");
      if (activeColor) activeColor.classList.remove("selected");
      element.classList.add("selected");

      // Reset processing flag after short delay
      setTimeout(() => {
        delete element.dataset.processing;
      }, 150);
    } catch (error) {
      console.error("Color selection error:", error);
    }
  }

  // Size selection with debouncing and error handling
  function selectSize(size, element) {
    try {
      // Prevent rapid clicking
      if (element.dataset.processing) return;
      element.dataset.processing = "true";

      selectedOptions.size = size;

      // Use efficient class toggling
      const activeSize = document.querySelector(".size-option.selected");
      if (activeSize) activeSize.classList.remove("selected");
      element.classList.add("selected");

      // Reset processing flag after short delay
      setTimeout(() => {
        delete element.dataset.processing;
      }, 150);
    } catch (error) {
      console.error("Size selection error:", error);
    }
  }

  // Get color code for display
  function getColorCode(colorName) {
    const colorMap = {
      Black: "#000000",
      Champagne: "#F7E7CE",
      "Deep Burgundy": "#800020",
      "Metallic Gold": "#D4AF37",
      "Black Gold": "#1A1A1A",
      White: "#FFFFFF",
      Navy: "#000080",
      Gold: "#FFD700",
      "Rose Gold": "#B76E79",
      "Black/Gold": "linear-gradient(45deg, #000000 50%, #D4AF37 50%)",
      "Cream/Gold": "linear-gradient(45deg, #FFFDD0 50%, #D4AF37 50%)",
      "Midnight Blue": "#191970",
      Ivory: "#FFFFF0",
      Nude: "#F5DEB3",
      "Baby Blue": "#89CFF0",
      "Multi Stripe":
        "linear-gradient(90deg, #FF6B35 20%, #9B59B6 20%, #FF1493 40%, #808000 60%, #90EE90 80%, #D2691E 100%)",
      "Black/Tan/Grey":
        "linear-gradient(120deg, #000000 33%, #D2691E 33%, #D2691E 66%, #808080 66%)",
      "Light Blue/Olive/Tan":
        "linear-gradient(120deg, #ADD8E6 33%, #808000 33%, #808000 66%, #D2691E 66%)",
      "Blue/Gold": "linear-gradient(45deg, #4169E1 50%, #FFD700 50%)",
      "Ocean Obsidian": "#40E0D0",
      "Crimson Noir": "#800020",
      "Midnight Depths": "#000080",
    };

    return colorMap[colorName] || "#CCCCCC";
  }

  // Quantity controls with debouncing
  const quantityInput = document.getElementById("quantityInput");
  const quantityMinus = document.getElementById("quantityMinus");
  const quantityPlus = document.getElementById("quantityPlus");

  let quantityTimeout;

  function updateQuantity(newValue) {
    clearTimeout(quantityTimeout);
    quantityTimeout = setTimeout(() => {
      try {
        let value = parseInt(newValue);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 10) value = 10;
        quantityInput.value = value;
        selectedOptions.quantity = value;
      } catch (error) {
        console.error("Quantity update error:", error);
      }
    }, 100);
  }

  quantityMinus.addEventListener(
    "click",
    function (e) {
      e.preventDefault();
      if (this.dataset.processing) return;
      this.dataset.processing = "true";

      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        updateQuantity(currentValue - 1);
      }

      setTimeout(() => delete this.dataset.processing, 200);
    },
    { passive: false },
  );

  quantityPlus.addEventListener(
    "click",
    function (e) {
      e.preventDefault();
      if (this.dataset.processing) return;
      this.dataset.processing = "true";

      const currentValue = parseInt(quantityInput.value);
      if (currentValue < 10) {
        updateQuantity(currentValue + 1);
      }

      setTimeout(() => delete this.dataset.processing, 200);
    },
    { passive: false },
  );

  quantityInput.addEventListener("change", function () {
    updateQuantity(this.value);
  });

  // Add to cart with error handling and debouncing
  document.getElementById("addToCartBtn").addEventListener(
    "click",
    function (e) {
      e.preventDefault();

      // Prevent double-clicking
      if (this.dataset.processing) return;
      this.dataset.processing = "true";

      try {
        if (!validateSelection()) {
          delete this.dataset.processing;
          return;
        }

        const cartItem = {
          ...currentProduct,
          selectedColor: selectedOptions.color,
          selectedSize: selectedOptions.size,
          quantity: selectedOptions.quantity,
        };

        // Use the cart functionality from main.js
        if (window.jaylaTaylorCart) {
          window.jaylaTaylorCart.addItem(cartItem);
          showNotification("Added to cart successfully!", "success");
        } else {
          showNotification("Cart system not available", "error");
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        showNotification("Error adding to cart", "error");
      } finally {
        setTimeout(() => delete this.dataset.processing, 1000);
      }
    },
    { passive: false },
  );

  // Buy now with error handling and debouncing
  document.getElementById("buyNowBtn").addEventListener(
    "click",
    function (e) {
      e.preventDefault();

      // Prevent double-clicking
      if (this.dataset.processing) return;
      this.dataset.processing = "true";

      try {
        if (!validateSelection()) {
          delete this.dataset.processing;
          return;
        }

        const cartItem = {
          ...currentProduct,
          selectedColor: selectedOptions.color,
          selectedSize: selectedOptions.size,
          quantity: selectedOptions.quantity,
        };

        // Add to cart and redirect to checkout
        if (window.jaylaTaylorCart) {
          window.jaylaTaylorCart.addItem(cartItem);
          // Use timeout to ensure cart is updated before redirect
          setTimeout(() => {
            window.location.href = "checkout.html";
          }, 100);
        } else {
          showNotification("Cart system not available", "error");
          delete this.dataset.processing;
        }
      } catch (error) {
        console.error("Buy now error:", error);
        showNotification("Error processing purchase", "error");
        delete this.dataset.processing;
      }
    },
    { passive: false },
  );

  // Enhanced validation with better user feedback
  function validateSelection() {
    try {
      if (
        currentProduct &&
        currentProduct.colors &&
        currentProduct.colors.length > 0 &&
        !selectedOptions.color
      ) {
        showNotification("Please select a color", "error");
        // Highlight color options
        const colorOptions = document.getElementById("colorOptions");
        if (colorOptions) {
          colorOptions.style.border = "2px solid var(--error)";
          setTimeout(() => {
            colorOptions.style.border = "";
          }, 2000);
        }
        return false;
      }

      if (
        currentProduct &&
        currentProduct.sizes &&
        currentProduct.sizes.length > 0 &&
        !selectedOptions.size
      ) {
        showNotification("Please select a size", "error");
        // Highlight size options
        const sizeOptions = document.getElementById("sizeOptions");
        if (sizeOptions) {
          sizeOptions.style.border = "2px solid var(--error)";
          setTimeout(() => {
            sizeOptions.style.border = "";
          }, 2000);
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }

  // Optimized notification system for mobile
  function showNotification(message, type = "success") {
    try {
      // Remove existing notifications
      const existing = document.querySelectorAll(".notification");
      existing.forEach((n) => n.remove());

      const notification = document.createElement("div");
      notification.className = `notification ${type}`;
      notification.textContent = message;
      notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: ${type === "error" ? "#dc3545" : "#28a745"};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 9999;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideDown 0.3s ease;
                max-width: 90vw;
                text-align: center;
            `;

      // Add animation keyframes if not already added
      if (!document.getElementById("notificationStyles")) {
        const style = document.createElement("style");
        style.id = "notificationStyles";
        style.textContent = `
                    @keyframes slideDown {
                        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                        to { transform: translateX(-50%) translateY(0); opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { transform: translateX(-50%) translateY(0); opacity: 1; }
                        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                    }
                `;
        document.head.appendChild(style);
      }

      document.body.appendChild(notification);

      // Auto remove with slide up animation
      setTimeout(() => {
        notification.style.animation = "slideUp 0.3s ease";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 3000);
    } catch (error) {
      console.error("Notification error:", error);
    }
  }

  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Update active states
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });

  // Size guide modal
  const sizeGuideLink = document.getElementById("sizeGuideLink");
  const sizeGuideModal = document.getElementById("sizeGuideModal");
  const modalClose = document.getElementById("modalClose");

  sizeGuideLink.addEventListener("click", (e) => {
    e.preventDefault();
    sizeGuideModal.classList.add("active");
  });

  modalClose.addEventListener("click", () => {
    sizeGuideModal.classList.remove("active");
  });

  sizeGuideModal.addEventListener("click", (e) => {
    if (e.target === sizeGuideModal) {
      sizeGuideModal.classList.remove("active");
    }
  });

  // Display related products
  function displayRelatedProducts(products) {
    const container = document.getElementById("relatedProducts");

    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.innerHTML = `
                <a href="product-detail.html?id=${product.id}" class="product-link">
                    <div class="product-image">
                        <img src="${product.images[0]}" alt="${product.name}" onerror="this.onerror=null; this.src='https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0'">
                        <div class="product-overlay">
                            <span class="btn btn-outline">View Details</span>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-price">$${product.price}</p>
                    </div>
                </a>
            `;
      container.appendChild(productCard);
    });
  }

  // Share functionality
  const shareButtons = document.querySelectorAll(".share-btn");

  shareButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const platform = button.querySelector("i").classList[1];
      const url = window.location.href;
      const title = currentProduct
        ? currentProduct.name
        : "Jayla Taylor Fashion";

      let shareUrl = "";

      switch (platform) {
        case "fa-facebook-f":
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
          break;
        case "fa-twitter":
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
          break;
        case "fa-pinterest-p":
          shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`;
          break;
        case "fa-envelope":
          shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank");
      }
    });
  });

  // Mobile performance optimizations

  // Throttle function for performance
  function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Debounce function for performance
  function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Prevent rapid consecutive clicks on mobile
  function addSingleClickListener(element, handler, delay = 300) {
    let isProcessing = false;
    element.addEventListener(
      "click",
      function (e) {
        if (isProcessing) {
          e.preventDefault();
          return false;
        }
        isProcessing = true;
        setTimeout(() => {
          isProcessing = false;
        }, delay);
        return handler.call(this, e);
      },
      { passive: false },
    );
  }

  // Enhanced touch handling for mobile
  if ("ontouchstart" in window) {
    document.body.classList.add("touch-device");

    // Optimize touch interactions
    const colorOptions = document.getElementById("colorOptions");
    const sizeOptions = document.getElementById("sizeOptions");

    if (colorOptions) {
      colorOptions.style.touchAction = "manipulation";
    }
    if (sizeOptions) {
      sizeOptions.style.touchAction = "manipulation";
    }
  }

  // Network connectivity handling for mobile
  function handleNetworkStatus() {
    const addToCartBtn = document.getElementById("addToCartBtn");
    const buyNowBtn = document.getElementById("buyNowBtn");

    if (!navigator.onLine) {
      if (addToCartBtn) addToCartBtn.disabled = true;
      if (buyNowBtn) buyNowBtn.disabled = true;
      showNotification(
        "No internet connection. Please check your connection.",
        "error",
      );
    } else {
      if (addToCartBtn) addToCartBtn.disabled = false;
      if (buyNowBtn) buyNowBtn.disabled = false;
    }
  }

  // Monitor network status
  window.addEventListener("online", handleNetworkStatus);
  window.addEventListener("offline", handleNetworkStatus);

  // Initial network check
  handleNetworkStatus();

  // Prevent form submission on network issues
  function checkNetworkBeforeAction(callback) {
    if (!navigator.onLine) {
      showNotification("No internet connection. Please try again.", "error");
      return false;
    }
    return callback();
  }

  // Add loading states to prevent multiple clicks
  function setLoadingState(button, loading = true) {
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Loading...";
      button.disabled = true;
      button.style.opacity = "0.7";
    } else {
      button.textContent =
        button.dataset.originalText ||
        button.textContent.replace("Loading...", "Add to Cart");
      button.disabled = false;
      button.style.opacity = "1";
      delete button.dataset.originalText;
    }
  }

  // Memory cleanup on page unload
  window.addEventListener("beforeunload", function () {
    // Clear any timeouts
    const timeouts = window.productDetailTimeouts || [];
    timeouts.forEach((timeout) => clearTimeout(timeout));

    // Remove event listeners
    document.removeEventListener("click", arguments.callee);
  });

  // Initialize
  loadProductData();
});
