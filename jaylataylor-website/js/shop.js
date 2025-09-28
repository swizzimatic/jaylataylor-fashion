// Shop Page JavaScript
let cloudinaryReady = false;

// Check if DOM is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initShop);
} else {
  // DOM is already loaded, run immediately
  initShop();
}

async function initShop() {
  console.log("Shop page loading...");

  // Initialize CloudinaryMapper
  if (typeof CloudinaryMapper !== "undefined") {
    try {
      cloudinaryReady = await CloudinaryMapper.init();
      console.log("CloudinaryMapper initialized:", cloudinaryReady);
    } catch (error) {
      console.warn("CloudinaryMapper init failed:", error);
      cloudinaryReady = false;
    }
  }

  // State management
  const shopState = {
    products: [],
    filteredProducts: [],
    selectedCategories: ["all"],
    maxPrice: 1000,
    sortBy: "featured",
  };

  // DOM elements with fallback creation if missing
  let productGrid = document.getElementById("productGrid");
  let productCount = document.getElementById("productCount");
  const categoryFilters = document.getElementById("categoryFilters");
  const priceRange = document.getElementById("priceRange");
  const maxPriceDisplay = document.getElementById("maxPrice");
  const sortSelect = document.getElementById("sortSelect");
  const filterToggle = document.getElementById("filterToggle");
  const sidebar = document.querySelector(".shop-sidebar");

  // Ensure critical DOM elements exist
  if (!productGrid) {
    console.warn("productGrid element not found, looking for fallback");
    const shopMain = document.querySelector(".shop-main");
    if (shopMain) {
      const existingGrid = shopMain.querySelector(".product-grid");
      if (existingGrid) {
        productGrid = existingGrid;
        if (!productGrid.id) {
          productGrid.id = "productGrid";
        }
        console.log("Found productGrid via fallback:", productGrid);
      }
    }
  }

  if (!productCount) {
    console.warn("productCount element not found, creating fallback");
    const countSpan = document.querySelector(".product-count span");
    if (countSpan) {
      productCount = countSpan;
      productCount.id = "productCount";
    }
  }

  // Verify critical elements are available
  if (!productGrid || !productCount) {
    console.error("Critical DOM elements missing:", {
      productGrid: !!productGrid,
      productCount: !!productCount,
    });
  }

  // Load products from JSON
  async function loadProducts() {
    console.log("loadProducts() called");
    try {
      console.log("Fetching data/products.json...");
      const response = await fetch("data/products.json");
      console.log("Fetch response:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.products || !Array.isArray(data.products)) {
        throw new Error("Invalid data structure: products array not found");
      }

      shopState.products = data.products;
      shopState.filteredProducts = [...shopState.products];

      console.log(`Successfully loaded ${data.products.length} products`);

      // Check URL parameters for category filter
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get("category");

      if (categoryParam && categoryParam !== "all") {
        console.log("Category parameter detected:", categoryParam);
        // Uncheck 'all' and check the specific category
        const allCheckbox =
          categoryFilters?.querySelector('input[value="all"]');
        if (allCheckbox) allCheckbox.checked = false;

        const categoryCheckbox = categoryFilters?.querySelector(
          `input[value="${categoryParam}"]`,
        );
        if (categoryCheckbox) {
          categoryCheckbox.checked = true;
          shopState.selectedCategories = [categoryParam];
          console.log("Selected categories:", shopState.selectedCategories);
        } else {
          console.warn(`Category checkbox not found for: ${categoryParam}`);
          // Still apply the filter even if checkbox not found
          shopState.selectedCategories = [categoryParam];
        }
      }

      applyFilters();
      renderProducts();
    } catch (error) {
      console.error("Error loading products:", error);
      showEmptyState("Error loading products. Please try again later.");
    }
  }

  // Render products to grid
  function renderProducts() {
    if (!productGrid) {
      console.error("Product grid element not found!");
      return;
    }

    productGrid.innerHTML = "";

    console.log(
      `Rendering ${shopState.filteredProducts.length} filtered products`,
    );

    if (shopState.filteredProducts.length === 0) {
      showEmptyState("No products found matching your criteria.");
      if (productCount) productCount.textContent = "0";
      return;
    }

    shopState.filteredProducts.forEach((product, index) => {
      try {
        console.log(
          `Creating card for product ${index + 1}:`,
          product.name,
          product.category,
        );
        const productCard = createProductCard(product);
        if (productCard) {
          productGrid.appendChild(productCard);
          console.log(`Successfully added product card ${index + 1}`);
        } else {
          console.warn(
            `Product card creation returned null for product ${index + 1}`,
          );
        }
      } catch (error) {
        console.error(`Error creating product card ${index + 1}:`, error);
      }
    });

    if (productCount) {
      productCount.textContent = shopState.filteredProducts.length;
    }

    console.log(
      `Rendered ${shopState.filteredProducts.length} products successfully`,
    );
  }

  // Create product card element
  function createProductCard(product) {
    if (!product || !product.id) {
      console.error("Invalid product data:", product);
      return null;
    }

    const card = document.createElement("div");
    card.className = "product-card";

    try {
      // Map product images with CloudinaryMapper if available
      let mappedProduct = product;
      console.log(
        `Checking CloudinaryMapper: ready=${cloudinaryReady}, exists=${typeof CloudinaryMapper !== "undefined"}`,
      );
      if (cloudinaryReady && typeof CloudinaryMapper !== "undefined") {
        console.log(`Mapping images for ${product.name}`);
        mappedProduct = CloudinaryMapper.mapProductImages(
          product,
          product.category,
        );
        console.log(`Mapped product:`, mappedProduct.images?.[0]);
      }

      // Safely get product image with proper fallback
      const fallbackImage =
        "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
      const productImage =
        mappedProduct.images?.[0] &&
        !mappedProduct.images[0].includes("placeholder")
          ? mappedProduct.images[0]
          : product.images?.[0] || fallbackImage;

      // Check if product is not for sale
      const priceDisplay = product.notForSale
        ? '<span style="color: var(--accent-gold-2);">Archive Piece - Not for Sale</span>'
        : `$${product.price || 0}`;

      const buttonHTML = product.notForSale
        ? '<button class="btn btn-outline" disabled>View in Gallery</button>'
        : `<button class="btn btn-primary add-to-cart"
                            data-product='${JSON.stringify({
                              id: product.id,
                              name: product.name || "Unknown Product",
                              price: product.price || 0,
                              image: productImage,
                            }).replace(/'/g, "&#39;")}'>
                        Add to Cart
                    </button>`;

      card.innerHTML = `
                <div class="product-image">
                    <img src="${productImage}" alt="${product.name || "Product Image"}"
                         onerror="this.onerror=null; this.src='${fallbackImage}'">
                    <div class="product-overlay">
                        <button class="btn btn-outline quick-view-btn" data-product-id="${product.id}">
                            ${product.notForSale ? "View Details" : "Quick View"}
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name || "Unknown Product"}</h3>
                    <p class="product-price">${priceDisplay}</p>
                    ${buttonHTML}
                </div>
            `;

      console.log(`Card HTML created for ${product.name}`);

      // Add click event for product details (with error handling)
      const productImageEl = card.querySelector(".product-image");
      if (productImageEl) {
        productImageEl.addEventListener("click", () => {
          window.location.href = `product-detail.html?id=${product.id}`;
        });
      }

      // Quick view functionality (with error handling)
      const quickViewBtn = card.querySelector(".quick-view-btn");
      if (quickViewBtn) {
        quickViewBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          showQuickView(product);
        });
      }

      return card;
    } catch (error) {
      console.error("Error creating product card:", error, product);
      return null;
    }
  }

  // Apply all filters
  function applyFilters() {
    let filtered = [...shopState.products];
    console.log(`Starting filter with ${filtered.length} products`);
    console.log("Selected categories:", shopState.selectedCategories);

    // Category filter
    if (!shopState.selectedCategories.includes("all")) {
      filtered = filtered.filter((product) =>
        shopState.selectedCategories.includes(product.category),
      );
      console.log(`After category filter: ${filtered.length} products`);
    }

    // Price filter
    filtered = filtered.filter(
      (product) => product.price <= shopState.maxPrice,
    );
    console.log(`After price filter: ${filtered.length} products`);

    // Sort products
    switch (shopState.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    shopState.filteredProducts = filtered;
    console.log(`Final filtered products: ${filtered.length}`);
  }

  // Show empty state
  function showEmptyState(message) {
    if (!productGrid) {
      console.error("Cannot show empty state - productGrid element not found");
      return;
    }
    productGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Products Found</h3>
                <p>${message}</p>
                <a href="shop.html" class="btn btn-primary">Clear Filters</a>
            </div>
        `;
  }

  // Quick view modal
  function showQuickView(product) {
    // Map product images with CloudinaryMapper if available
    let mappedProduct = product;
    if (cloudinaryReady && typeof CloudinaryMapper !== "undefined") {
      mappedProduct = CloudinaryMapper.mapProductImages(
        product,
        product.category,
      );
    }

    // Use the same fallback image as product cards
    const fallbackImage =
      "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
    const modalImage =
      mappedProduct.images && mappedProduct.images[0]
        ? mappedProduct.images[0]
        : fallbackImage;

    const modal = document.createElement("div");
    modal.className = "quick-view-modal";
    modal.innerHTML = `
            <div class="quick-view-content">
                <button class="close-modal">&times;</button>
                <div class="quick-view-grid">
                    <div class="quick-view-image">
                        <img src="${modalImage}" alt="${product.name}" onerror="this.onerror=null; this.src='${fallbackImage}'">
                    </div>
                    <div class="quick-view-info">
                        <h2>${product.name}</h2>
                        <p class="price">$${product.price}</p>
                        <p class="description">${product.description}</p>

                        <div class="product-options">
                            ${
                              product.sizes && product.sizes.length > 0
                                ? `
                            <div class="size-options">
                                <label>Size:</label>
                                <select class="size-select">
                                    ${product.sizes
                                      .map(
                                        (size) =>
                                          `<option value="${size}">${size}</option>`,
                                      )
                                      .join("")}
                                </select>
                            </div>`
                                : ""
                            }

                            ${
                              product.colors && product.colors.length > 0
                                ? `
                            <div class="color-options">
                                <label>Color:</label>
                                <select class="color-select">
                                    ${product.colors
                                      .map(
                                        (color) =>
                                          `<option value="${color}">${color}</option>`,
                                      )
                                      .join("")}
                                </select>
                            </div>`
                                : ""
                            }
                        </div>

                        <button class="btn btn-primary add-to-cart-modal"
                                data-product='${JSON.stringify({
                                  id: product.id,
                                  name: product.name,
                                  price: product.price,
                                  image: modalImage,
                                })}'>
                            Add to Cart
                        </button>

                        <a href="product-detail.html?id=${product.id}" class="btn btn-outline">
                            View Full Details
                        </a>
                    </div>
                </div>
            </div>
        `;

    // Add modal styles
    const modalStyles = `
            <style>
                .quick-view-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }

                .quick-view-content {
                    background-color: var(--secondary-dark);
                    max-width: 900px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border-radius: 4px;
                    position: relative;
                    animation: slideIn 0.3s ease;
                }

                .close-modal {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: var(--neutral-light);
                    font-size: 2rem;
                    cursor: pointer;
                    z-index: 1;
                }

                .quick-view-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    padding: 40px;
                }

                .quick-view-image img {
                    width: 100%;
                    height: auto;
                    border-radius: 4px;
                }

                .quick-view-info h2 {
                    margin-bottom: 1rem;
                }

                .quick-view-info .price {
                    font-size: 1.5rem;
                    color: var(--accent-gold-2);
                    font-weight: 700;
                    margin-bottom: 1rem;
                }

                .quick-view-info .description {
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }

                .product-options {
                    margin-bottom: 2rem;
                    display: flex;
                    gap: 2rem;
                }

                .product-options label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: var(--accent-gold-2);
                }

                .product-options select {
                    padding: 8px 15px;
                    background-color: var(--primary-dark);
                    border: 1px solid var(--accent-gold-2);
                    color: var(--neutral-light);
                    font-family: var(--font-body);
                    cursor: pointer;
                    min-width: 120px;
                }

                .quick-view-info .btn {
                    width: 100%;
                    margin-bottom: 1rem;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideIn {
                    from {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @media (max-width: 768px) {
                    .quick-view-grid {
                        grid-template-columns: 1fr;
                        padding: 20px;
                    }
                }
            </style>
        `;

    // Add styles if not already present
    if (!document.querySelector("#quick-view-styles")) {
      const styleElement = document.createElement("div");
      styleElement.id = "quick-view-styles";
      styleElement.innerHTML = modalStyles;
      document.head.appendChild(styleElement);
    }

    document.body.appendChild(modal);

    // Close modal events
    modal.querySelector(".close-modal").addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Add to cart from modal
    modal
      .querySelector(".add-to-cart-modal")
      .addEventListener("click", async function () {
        try {
          const productData = JSON.parse(this.dataset.product);

          // Check if cart system is available
          if (window.jaylaTaylorCart) {
            const success = await window.jaylaTaylorCart.addItem(productData);
            if (success) {
              modal.remove();
            }
          } else {
            // Fallback notification if cart system isn't loaded
            console.error("Cart system not available");
            modal.showFallbackNotification(
              "Cart system unavailable. Please refresh the page.",
            );
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          modal.showFallbackNotification("Error adding item to cart");
        }
      });

    // Fallback notification method
    modal.showFallbackNotification = function (message) {
      const notification = document.createElement("div");
      notification.textContent = message;
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
    };
  }

  // Event Listeners

  // Category filters
  if (categoryFilters) {
    categoryFilters.addEventListener("change", (e) => {
      if (e.target.type === "checkbox") {
        const value = e.target.value;

        if (value === "all") {
          // If 'all' is checked, uncheck others
          if (e.target.checked) {
            categoryFilters
              .querySelectorAll('input[type="checkbox"]:not([value="all"])')
              .forEach((cb) => {
                cb.checked = false;
              });
            shopState.selectedCategories = ["all"];
          }
        } else {
          // If a specific category is checked, uncheck 'all'
          const allCheckbox =
            categoryFilters.querySelector('input[value="all"]');
          if (allCheckbox) allCheckbox.checked = false;

          // Update selected categories
          shopState.selectedCategories = Array.from(
            categoryFilters.querySelectorAll(
              'input[type="checkbox"]:checked:not([value="all"])',
            ),
          ).map((cb) => cb.value);

          // If no categories selected, select 'all'
          if (shopState.selectedCategories.length === 0) {
            if (allCheckbox) allCheckbox.checked = true;
            shopState.selectedCategories = ["all"];
          }
        }

        applyFilters();
        renderProducts();
      }
    });
  }

  // Price range filter
  if (priceRange) {
    priceRange.addEventListener("input", (e) => {
      shopState.maxPrice = parseInt(e.target.value);
      if (maxPriceDisplay) {
        maxPriceDisplay.textContent = `$${shopState.maxPrice}`;
      }
      applyFilters();
      renderProducts();
    });
  }

  // Sort select
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      shopState.sortBy = e.target.value;
      applyFilters();
      renderProducts();
    });
  }

  // Mobile filter toggle
  if (filterToggle && sidebar) {
    filterToggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");

      // Create overlay if it doesn't exist
      let overlay = document.querySelector(".sidebar-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);

        overlay.addEventListener("click", () => {
          sidebar.classList.remove("active");
          overlay.classList.remove("active");
        });
      }

      overlay.classList.toggle("active");

      // Add close button to sidebar if not present
      if (!sidebar.querySelector(".sidebar-close")) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "sidebar-close";
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", () => {
          sidebar.classList.remove("active");
          overlay.classList.remove("active");
        });
        sidebar.insertBefore(closeBtn, sidebar.firstChild);
      }
    });
  }

  // Initialize shop
  console.log("About to call loadProducts()");
  loadProducts();
}
