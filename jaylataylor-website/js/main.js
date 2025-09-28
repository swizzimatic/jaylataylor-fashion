// Jayla Taylor - Main JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Header scroll effect
  const header = document.getElementById("header");
  let lastScroll = 0;

  if (header) {
    window.addEventListener("scroll", function () {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }

      lastScroll = currentScroll;
    });
  }

  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const navMenu = document.getElementById("navMenu");

  if (mobileMenuToggle && navMenu) {
    // Set initial aria attributes
    mobileMenuToggle.setAttribute("aria-expanded", "false");
    mobileMenuToggle.setAttribute("aria-label", "Toggle navigation menu");

    mobileMenuToggle.addEventListener("click", function (e) {
      e.preventDefault();
      navMenu.classList.toggle("active");
      mobileMenuToggle.classList.toggle("active");

      // Toggle aria-expanded for accessibility
      const isExpanded = navMenu.classList.contains("active");
      mobileMenuToggle.setAttribute("aria-expanded", isExpanded);

      // Prevent body scrolling when menu is open
      if (isExpanded) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove("active");
        mobileMenuToggle.classList.remove("active");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });

    // Close menu when clicking on a nav link
    const navLinks = navMenu.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        navMenu.classList.remove("active");
        mobileMenuToggle.classList.remove("active");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    // Close menu on escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        mobileMenuToggle.classList.remove("active");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  // Enhanced cart functionality with backend integration
  const cart = {
    items: (() => {
      try {
        const stored = localStorage.getItem("jaylaTaylorCart");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.warn(
          "Invalid cart data in localStorage, resetting cart:",
          error,
        );
        localStorage.removeItem("jaylaTaylorCart");
        return [];
      }
    })(),
    sessionId: localStorage.getItem("cartSessionId") || null,
    apiBaseUrl: "https://www.jaylataylor.com/api",

    init: function () {
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
      }
    },

    generateSessionId: function () {
      const sessionId =
        "cart_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("cartSessionId", sessionId);
      return sessionId;
    },

    syncWithBackend: async function () {
      try {
        const response = await fetch(`${this.apiBaseUrl}/cart/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cartItems: this.items,
            sessionId: this.sessionId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Cart synced with backend:", result);
        }
      } catch (error) {
        console.log("Backend sync failed (offline mode):", error.message);
        // Continue with offline functionality
      }
    },

    addItem: async function (product) {
      try {
        // Validate product data
        if (!product || !product.id || !product.name || !product.price) {
          console.error("Invalid product data:", product);
          this.showNotification("Error adding item to cart", "error");
          return false;
        }

        const existingItem = this.items.find(
          (item) =>
            item.id === product.id &&
            item.selectedColor === product.selectedColor &&
            item.selectedSize === product.selectedSize,
        );

        if (existingItem) {
          existingItem.quantity += product.quantity || 1;
        } else {
          this.items.push({
            ...product,
            quantity: product.quantity || 1,
            addedAt: new Date().toISOString(),
          });
        }

        this.saveCart();
        this.updateCartBadge();

        // Try to sync with backend
        try {
          const response = await fetch(
            `${this.apiBaseUrl}/cart/${this.sessionId}/add`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productId: product.id,
                quantity: product.quantity || 1,
                selectedColor: product.selectedColor,
                selectedSize: product.selectedSize,
              }),
            },
          );

          if (response.ok) {
            console.log("Item synced with backend");
          }
        } catch (backendError) {
          console.log(
            "Backend sync failed, continuing offline:",
            backendError.message,
          );
        }

        this.showNotification("Item added to cart", "success");
        return true;
      } catch (error) {
        console.error("Error adding item to cart:", error);
        this.showNotification("Error adding item to cart", "error");
        return false;
      }
    },

    removeItem: function (productId) {
      this.items = this.items.filter((item) => item.id !== productId);
      this.saveCart();
      this.updateCartBadge();
    },

    updateQuantity: function (productId, quantity) {
      try {
        const item = this.items.find((item) => item.id === productId);
        if (item) {
          item.quantity = Math.max(1, quantity);
          this.saveCart();
          this.updateCartBadge();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating quantity:", error);
        return false;
      }
    },

    clearCart: function () {
      try {
        this.items = [];
        this.saveCart();
        this.updateCartBadge();
        this.showNotification("Cart cleared", "success");
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    },

    getCartItems: function () {
      return [...this.items];
    },

    getTotal: function () {
      return this.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
    },

    getItemCount: function () {
      return this.items.reduce((count, item) => count + item.quantity, 0);
    },

    saveCart: function () {
      localStorage.setItem("jaylaTaylorCart", JSON.stringify(this.items));
    },

    updateCartBadge: function () {
      const cartBadge = document.getElementById("cartBadge");
      if (cartBadge) {
        const count = this.getItemCount();
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? "flex" : "none";
      }
    },

    showNotification: function (message, type = "success") {
      try {
        // Remove existing notifications
        const existing = document.querySelectorAll(".cart-notification");
        existing.forEach((n) => n.remove());

        const notification = document.createElement("div");
        notification.className = `cart-notification notification-${type}`;
        notification.textContent = message;

        const bgColor = type === "error" ? "#dc3545" : "#28a745";
        const textColor = "#ffffff";

        notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: ${bgColor};
                    color: ${textColor};
                    padding: 15px 25px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideInRight 0.3s ease;
                    max-width: 300px;
                `;

        // Add animation styles if not present
        if (!document.getElementById("notificationStyles")) {
          const style = document.createElement("style");
          style.id = "notificationStyles";
          style.textContent = `
                        @keyframes slideInRight {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                        @keyframes slideOutRight {
                            from { transform: translateX(0); opacity: 1; }
                            to { transform: translateX(100%); opacity: 0; }
                        }
                    `;
          document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
          notification.style.animation = "slideOutRight 0.3s ease";
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        }, 3000);
      } catch (error) {
        console.error("Notification error:", error);
      }
    },

    // Check backend connection status
    checkBackendConnection: async function () {
      try {
        const response = await fetch(
          `${this.apiBaseUrl}/cart/${this.sessionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          console.log("✅ Cart backend connected");
          this.showConnectionStatus(true);
          return true;
        } else {
          console.log("⚠️ Cart backend connection failed");
          this.showConnectionStatus(false);
          return false;
        }
      } catch (error) {
        console.log("❌ Cart backend offline, using local storage");
        this.showConnectionStatus(false);
        return false;
      }
    },

    showConnectionStatus: function (connected) {
      // Only show status in development or if there's an issue
      if (window.location.hostname === "localhost" || !connected) {
        const statusEl =
          document.getElementById("cart-status") || this.createStatusElement();
        statusEl.textContent = connected ? "🟢 Cart Online" : "🔴 Cart Offline";
        statusEl.className = `cart-status ${connected ? "online" : "offline"}`;
        statusEl.style.display = connected ? "none" : "block"; // Only show when offline
      }
    },

    createStatusElement: function () {
      const statusEl = document.createElement("div");
      statusEl.id = "cart-status";
      statusEl.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 8px 12px;
                background: rgba(0,0,0,0.8);
                color: white;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                display: none;
            `;
      document.body.appendChild(statusEl);
      return statusEl;
    },
  };

  // Make cart globally available
  window.jaylaTaylorCart = cart;

  // Initialize cart
  cart.init();
  cart.updateCartBadge();

  // Check backend connection and sync
  setTimeout(async () => {
    const connected = await cart.checkBackendConnection();
    if (connected) {
      await cart.syncWithBackend();
    }
  }, 1000);

  // Newsletter form
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;

      // Here you would typically send the email to your backend
      console.log("Newsletter signup:", email);

      // Show success message
      cart.showNotification("Thank you for subscribing!");
      this.reset();
    });
  }

  // Scroll progress indicator
  const createScrollProgress = () => {
    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    document.body.appendChild(progressBar);

    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressBar.style.width = scrollPercent + "%";
    };

    window.addEventListener("scroll", updateProgress);
    updateProgress();
  };

  // Enhanced cart badge animation
  const animateCartBadge = () => {
    const cartBadge = document.getElementById("cartBadge");
    if (cartBadge) {
      cartBadge.classList.add("updated");
      setTimeout(() => {
        cartBadge.classList.remove("updated");
      }, 600);
    }
  };

  // Preloader functionality
  const createPreloader = () => {
    const preloader = document.createElement("div");
    preloader.className = "preloader";
    preloader.innerHTML = '<div class="preloader-logo">JAYLA TAYLOR</div>';
    document.body.appendChild(preloader);

    window.addEventListener("load", () => {
      setTimeout(() => {
        preloader.style.opacity = "0";
        setTimeout(() => {
          preloader.remove();
        }, 500);
      }, 1000);
    });
  };

  // Enhanced video controls with smooth transitions
  const enhanceVideoControls = () => {
    const video = document.querySelector(".hero-video");
    const videoToggle = document.getElementById("videoToggle");
    const toggleIcon = videoToggle?.querySelector("i");

    if (video && videoToggle && toggleIcon) {
      // Ensure video starts playing and button shows pause icon
      video.autoplay = true;
      video.muted = true;
      video.loop = true;

      // Force video to play after page load
      video.play().catch((e) => {
        console.log("Autoplay was prevented:", e);
        // If autoplay fails, show play icon
        toggleIcon.className = "fas fa-play";
      });

      // Update button based on video state
      const updateToggleButton = () => {
        if (video.paused) {
          toggleIcon.className = "fas fa-play";
          videoToggle.setAttribute("aria-label", "Play video");
        } else {
          toggleIcon.className = "fas fa-pause";
          videoToggle.setAttribute("aria-label", "Pause video");
        }
      };

      // Listen for video state changes
      video.addEventListener("play", updateToggleButton);
      video.addEventListener("pause", updateToggleButton);

      // Toggle video playback with smooth transition
      videoToggle.addEventListener("click", (e) => {
        e.preventDefault();

        // Add smooth visual feedback
        videoToggle.style.transform = "scale(0.95)";
        setTimeout(() => {
          videoToggle.style.transform = "";
        }, 150);

        if (video.paused) {
          video
            .play()
            .then(() => {
              updateToggleButton();
            })
            .catch((e) => {
              console.log("Play failed:", e);
            });
        } else {
          video.pause();
          updateToggleButton();
        }
      });

      // Initial button state
      updateToggleButton();
    }
  };

  // Smooth scroll for anchor links
  const setupSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });
  };

  // Enhanced newsletter form interaction
  const enhanceNewsletterForm = () => {
    const form = document.getElementById("newsletterForm");
    if (form) {
      const input = form.querySelector('input[type="email"]');
      const button = form.querySelector("button");

      if (input && button) {
        input.addEventListener("focus", () => {
          form.style.transform = "scale(1.02)";
          form.style.boxShadow = "0 10px 30px rgba(212, 175, 55, 0.2)";
        });

        input.addEventListener("blur", () => {
          form.style.transform = "scale(1)";
          form.style.boxShadow = "none";
        });

        form.addEventListener("submit", (e) => {
          e.preventDefault();
          button.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
          button.style.background = "linear-gradient(45deg, #28a745, #20c997)";

          setTimeout(() => {
            button.innerHTML = "Subscribe";
            button.style.background = "";
            input.value = "";
          }, 3000);
        });
      }
    }
  };

  // Initialize all enhancements
  document.addEventListener("DOMContentLoaded", () => {
    createScrollProgress();
    createPreloader();
    enhanceVideoControls();
    setupSmoothScroll();
    enhanceNewsletterForm();

    // Add reveal class to all sections for animation
    document.querySelectorAll("section").forEach((section, index) => {
      section.classList.add("reveal");
      section.style.animationDelay = `${index * 0.1}s`;
    });
  });

  // Export function for cart updates
  window.updateCartBadge = (count) => {
    const badge = document.getElementById("cartBadge");
    if (badge) {
      badge.textContent = count;
      animateCartBadge();
    }
  };

  // Global event delegation for add to cart buttons
  document.addEventListener("click", async function (e) {
    if (e.target.matches(".add-to-cart") || e.target.closest(".add-to-cart")) {
      e.preventDefault();

      const button = e.target.matches(".add-to-cart")
        ? e.target
        : e.target.closest(".add-to-cart");
      const productData = button.dataset.product;

      if (!productData) {
        console.error("No product data found on button");
        return;
      }

      try {
        const product = JSON.parse(productData);

        // Check if cart system is available
        if (window.jaylaTaylorCart) {
          // Add loading state
          const originalText = button.textContent;
          button.textContent = "Adding...";
          button.disabled = true;

          const success = await window.jaylaTaylorCart.addItem(product);

          // Reset button state
          button.textContent = originalText;
          button.disabled = false;

          if (!success) {
            console.error("Failed to add item to cart");
          }
        } else {
          console.error("Cart system not available");
          // Show fallback notification
          const notification = document.createElement("div");
          notification.textContent =
            "Cart system unavailable. Please refresh the page.";
          notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #dc3545;
                        color: white;
                        padding: 12px 20px;
                        border-radius: 4px;
                        z-index: 10000;
                    `;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      } catch (error) {
        console.error("Error parsing product data or adding to cart:", error);
        button.disabled = false;
      }
    }
  });
});

// Add CSS for notifications
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .notification {
        font-family: var(--font-body);
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// Add CSS for scroll progress
const style2 = document.createElement("style");
style2.textContent = `
    .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(45deg, var(--accent-gold-1), var(--accent-gold-2));
        z-index: 9999;
        transition: width 0.2s ease;
    }
`;
document.head.appendChild(style2);

// Add CSS for preloader
const style3 = document.createElement("style");
style3.textContent = `
    .preloader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--primary-dark);
        color: var(--accent-gold-1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        z-index: 9999;
        transition: opacity 0.5s ease;
    }

    .preloader-logo {
        font-weight: 700;
        letter-spacing: 2px;
    }
`;
document.head.appendChild(style3);

// Add CSS for video enhancements
const style4 = document.createElement("style");
style4.textContent = `
    .hero-video {
        width: 100%;
        height: auto;
        object-fit: cover;
        opacity: 0.8;
        transition: opacity 0.3s ease;
    }

    #videoToggle {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        z-index: 10000;
        transition: background 0.3s ease;
    }

    #videoToggle:hover {
        background: rgba(0, 0, 0, 0.7);
    }
`;
document.head.appendChild(style4);

// Add CSS for newsletter form enhancements
const style5 = document.createElement("style");
style5.textContent = `
    #newsletterForm {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    #newsletterForm input[type="email"] {
        padding: 10px 15px;
        border: 1px solid var(--accent-gold-1);
        border-radius: 4px;
        margin-right: 10px;
        width: 250px;
        transition: border-color 0.3s ease;
    }

    #newsletterForm button {
        padding: 10px 15px;
        background: var(--accent-gold-1);
        color: var(--primary-dark);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    #newsletterForm button:hover {
        background: var(--accent-gold-2);
    }
`;
document.head.appendChild(style5);

// Add CSS for cart badge animation
const style6 = document.createElement("style");
style6.textContent = `
    #cartBadge {
        position: relative;
        display: inline-block;
        font-weight: 700;
        color: var(--accent-gold-1);
    }

    #cartBadge.updated {
        animation: bounce 0.6s ease;
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }
`;
document.head.appendChild(style6);
