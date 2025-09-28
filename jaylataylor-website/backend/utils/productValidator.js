// Product Validation Utility
const fs = require('fs');
const path = require('path');

// Load products from backend's authoritative source
const productsPath = path.join(__dirname, '../data/products.json');
const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Map categories to collection names as they appear in requirements
const CATEGORY_TO_COLLECTION = {
    'lingerie': 'Lingerie',
    'accessories': 'Accessories',
    'swim': 'Swim 2023',
    'timeless': 'Timeless',
    // Frontend category used for hats
    'bucket-hats': 'Bucket Hats'
};

// Define purchasable collections
// Timeless (archive) remains non-purchasable
const PURCHASABLE_COLLECTIONS = ['Lingerie', 'Accessories', 'Swim 2023', 'Bucket Hats'];

/**
 * Get product by ID from backend data
 * @param {string} productId - Product ID
 * @returns {Object|null} Product object or null if not found
 */
function getProduct(productId) {
    return productsData.products.find(p => p.id === productId) || null;
}

/**
 * Map category to collection name
 * @param {string} category - Product category
 * @returns {string} Collection name
 */
function mapCategoryToCollection(category) {
    return CATEGORY_TO_COLLECTION[category] || category;
}

/**
 * Check if a collection is purchasable
 * @param {string} collection - Collection name
 * @returns {boolean} True if purchasable
 */
function isCollectionPurchasable(collection) {
    return PURCHASABLE_COLLECTIONS.includes(collection);
}

/**
 * Validate cart items and calculate total
 * @param {Array} cartItems - Array of cart items with id and quantity
 * @returns {Object} Validation result with total, valid items, and errors
 */
function validateCartItems(cartItems) {
    const result = {
        success: true,
        total: 0,
        validItems: [],
        invalidItems: [],
        errors: []
    };

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        result.success = false;
        result.errors.push('Cart is empty or invalid');
        return result;
    }

    for (const item of cartItems) {
        // Validate item structure
        if (!item.id || !item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
            result.success = false;
            result.errors.push(`Invalid item format: ${JSON.stringify(item)}`);
            continue;
        }

        // Get product from backend data
        const product = getProduct(item.id);
        
        if (!product) {
            result.success = false;
            result.errors.push(`Product not found: ${item.id}`);
            continue;
        }

        // Map category to collection and check if purchasable
        const collection = mapCategoryToCollection(product.category);
        
        if (!isCollectionPurchasable(collection)) {
            result.success = false;
            result.invalidItems.push({
                id: product.id,
                name: product.name,
                collection: collection
            });
            result.errors.push(`Product "${product.name}" from ${collection} collection is for display only and cannot be purchased`);
            continue;
        }

        // Add to valid items and calculate price
        result.validItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            total: product.price * item.quantity
        });
        
        result.total += product.price * item.quantity;
    }

    // If there are any invalid items, the entire order should fail
    if (result.invalidItems.length > 0) {
        result.success = false;
    }

    return result;
}

/**
 * Get all products (for potential future use)
 * @returns {Array} All products
 */
function getAllProducts() {
    return productsData.products;
}

/**
 * Get products by category
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered products
 */
function getProductsByCategory(category) {
    return productsData.products.filter(p => p.category === category);
}

module.exports = {
    getProduct,
    mapCategoryToCollection,
    isCollectionPurchasable,
    validateCartItems,
    getAllProducts,
    getProductsByCategory,
    PURCHASABLE_COLLECTIONS,
    CATEGORY_TO_COLLECTION
};
