// Cloudinary Image Mapper for Dynamic Category Loading
const CloudinaryMapper = {
  // Category to Cloudinary folder mapping
  categoryFolderMap: {
    "bucket-hats": "j-t-accessories",
    swim: "swim24",
    lingerie: "lingerie-collection",
    timeless: "timeless-collection",
    accessories: "j-t-accessories",
    swim24: "swim24",
    "swim-collection": "swim24",
  },

  // Cache for cloudinary data
  cloudinaryData: null,

  // Initialize and load Cloudinary data
  async init() {
    try {
      const response = await fetch("backend/cloudinary-folders-organized.json");
      if (!response.ok) {
        console.warn(
          `Could not load Cloudinary data (HTTP ${response.status}), falling back to original URLs`,
        );
        return false;
      }
      this.cloudinaryData = await response.json();

      // Validate data structure
      if (!this.cloudinaryData || typeof this.cloudinaryData !== "object") {
        console.error("Invalid Cloudinary data structure");
        this.cloudinaryData = null;
        return false;
      }

      console.log(
        "Cloudinary data loaded successfully with folders:",
        Object.keys(this.cloudinaryData),
      );
      return true;
    } catch (error) {
      console.error("Error loading Cloudinary data:", error);
      this.cloudinaryData = null;
      return false;
    }
  },

  // Map a jaylataylor.com URL to Cloudinary URL based on category
  mapImageUrl(originalUrl, category) {
    if (!this.cloudinaryData || !originalUrl) {
      return originalUrl;
    }

    // Get the Cloudinary folder for this category
    const cloudinaryFolder = this.categoryFolderMap[category];
    if (!cloudinaryFolder || !this.cloudinaryData[cloudinaryFolder]) {
      console.log(`No Cloudinary folder mapping for category: ${category}`);
      return this.findBestMatch(originalUrl) || originalUrl;
    }

    // Extract filename from original URL
    const filename = this.extractFilename(originalUrl);
    if (!filename) return originalUrl;

    // Look for matching resource in the category folder
    const folderData = this.cloudinaryData[cloudinaryFolder];
    const resource = this.findMatchingResource(filename, folderData.resources);

    if (resource) {
      // Use medium size for product cards
      return (
        resource.urls.medium || resource.urls.large || resource.urls.original
      );
    }

    // If not found in category folder, search all folders
    return this.findBestMatch(originalUrl) || originalUrl;
  },

  // Extract filename from URL
  extractFilename(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const filename = path.split("/").pop();
      return decodeURIComponent(filename);
    } catch {
      // Fallback for relative URLs
      const parts = url.split("/");
      return decodeURIComponent(parts[parts.length - 1]);
    }
  },

  // Find matching resource in array
  findMatchingResource(filename, resources) {
    if (!resources || !Array.isArray(resources)) return null;

    const baseFilename = filename
      .toLowerCase()
      .replace(/\.(jpeg|jpg|png)$/i, "")
      .replace(/[\s_-]+/g, "");

    // Try exact match first
    let match = resources.find((r) => {
      const cloudinaryBase = r.filename
        .toLowerCase()
        .replace(/_[a-z0-9]+$/, "")
        .replace(/[\s_-]+/g, "");
      return cloudinaryBase === baseFilename;
    });

    // Try partial match if no exact match
    if (!match) {
      match = resources.find((r) => {
        const cloudinaryBase = r.filename
          .toLowerCase()
          .replace(/_[a-z0-9]+$/, "")
          .replace(/[\s_-]+/g, "");
        return (
          cloudinaryBase.includes(baseFilename) ||
          baseFilename.includes(cloudinaryBase)
        );
      });
    }

    return match;
  },

  // Search all folders for best match
  findBestMatch(originalUrl) {
    if (!this.cloudinaryData) return null;

    const filename = this.extractFilename(originalUrl);
    if (!filename) return null;

    // Search through all folders
    for (const [folderName, folderData] of Object.entries(
      this.cloudinaryData,
    )) {
      if (!folderData.resources) continue;

      const resource = this.findMatchingResource(
        filename,
        folderData.resources,
      );
      if (resource) {
        console.log(`Found ${filename} in ${folderName}`);
        return (
          resource.urls.medium || resource.urls.large || resource.urls.original
        );
      }
    }

    return null;
  },

  // Get random images from a category folder
  getCategoryImages(category, count = 10) {
    if (!this.cloudinaryData) return [];

    const cloudinaryFolder = this.categoryFolderMap[category];
    if (!cloudinaryFolder || !this.cloudinaryData[cloudinaryFolder]) {
      return [];
    }

    const resources = this.cloudinaryData[cloudinaryFolder].resources || [];
    const images = resources
      .filter(
        (r) =>
          r.format && ["jpg", "jpeg", "png"].includes(r.format.toLowerCase()),
      )
      .slice(0, count)
      .map((r) => r.urls.medium || r.urls.large || r.urls.original);

    return images;
  },

  // Map product data with Cloudinary URLs
  mapProductImages(product, category) {
    if (!product.images || !Array.isArray(product.images)) {
      // If no images array, create one with default
      const categoryImages = this.getCategoryImages(
        category || product.category,
        1,
      );
      return {
        ...product,
        images: categoryImages.length > 0 ? categoryImages : [],
      };
    }

    const mappedProduct = { ...product };
    mappedProduct.images = product.images.map((imageUrl) =>
      this.mapImageUrl(imageUrl, category || product.category),
    );

    // If no images were successfully mapped and we have Cloudinary data,
    // try to get some default images from the category
    if (
      mappedProduct.images.every(
        (url) => url && url.includes("jaylataylor.com"),
      ) &&
      this.cloudinaryData
    ) {
      const categoryImages = this.getCategoryImages(
        category || product.category,
        1,
      );
      if (categoryImages.length > 0) {
        console.log(`Using default Cloudinary image for ${product.name}`);
        mappedProduct.images = categoryImages;
      }
    }

    // Filter out any null/undefined URLs
    mappedProduct.images = mappedProduct.images.filter(
      (url) => url && url.length > 0,
    );

    return mappedProduct;
  },
};

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = CloudinaryMapper;
}
