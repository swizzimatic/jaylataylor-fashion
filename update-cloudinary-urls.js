const fs = require("fs");
const path = require("path");

// Cloudinary base URL with your cloud name
const CLOUDINARY_BASE = "https://res.cloudinary.com/whxy";

// Function to transform jaylataylor.com URLs to Cloudinary URLs
function transformToCloudinaryUrl(url) {
  // Match jaylataylor.com content URLs
  const contentMatch = url.match(
    /https:\/\/jaylataylor\.com\/content\/([^"'\s]+)/,
  );
  if (!contentMatch) return null;

  let contentPath = decodeURIComponent(contentMatch[1]);

  // Map folder names to exact Cloudinary folder names (from your screenshot)
  const folderMappings = {
    "Collaborative%20Work": "collaborative-work",
    "Collaborative Work": "collaborative-work",
    "Magazine%20features": "magazine-features",
    "Magazine features": "magazine-features",
    "New%20York%20Fashion%20Week%2023'": "newyork-fashion",
    "New York Fashion Week 23'": "newyork-fashion",
    "Paris%20Fashion%20Week%2024'": "paris-fashion-week",
    "Paris Fashion Week 24'": "paris-fashion-week",
    "Swim%20Collection%2023'": "swim-collection",
    "Swim Collection 23'": "swim-collection",
    "Swim%2024'": "swim24",
    "Swim 24'": "swim24",
    "Lingerie%20Collection": "lingerie-collection",
    "Lingerie Collection": "lingerie-collection",
    "Timeless%20Collection": "timeless-collection",
    "Timeless Collection": "timeless-collection",
    "J-T%20Accessories": "j-t-accessories",
    "J-T Accessories": "j-t-accessories",
    "Info-For-Shop": "info-for-shop",
    Logos: "logos",
    "Extra%20Content": "extra-content",
    "Extra Content": "extra-content",
  };

  // Replace folder names
  for (const [oldName, newName] of Object.entries(folderMappings)) {
    if (contentPath.startsWith(oldName + "/")) {
      contentPath = contentPath.replace(oldName + "/", newName + "/");
      break;
    }
  }

  // Remove file extension for Cloudinary
  const pathWithoutExt = contentPath.replace(
    /\.(jpg|jpeg|png|gif|webp|mov|mp4)$/i,
    "",
  );

  // Clean up special characters in filename
  const cleanPath = pathWithoutExt
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[()]/g, "") // Remove parentheses
    .replace(/'|'/g, ""); // Remove apostrophes

  // Determine if it's a video or image
  const isVideo = /\.(mov|mp4)$/i.test(contentPath);
  const assetType = isVideo ? "video" : "image";

  // Build Cloudinary URL with auto format and quality
  const transformations = isVideo ? "f_auto" : "f_auto,q_auto";

  return `${CLOUDINARY_BASE}/${assetType}/upload/${transformations}/${cleanPath}`;
}

// Function to update HTML file
function updateHtmlFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, "utf8");
  let updateCount = 0;

  // Find all jaylataylor.com URLs
  const urlPattern = /https:\/\/jaylataylor\.com\/content\/[^"'\s]+/g;
  const matches = content.match(urlPattern) || [];

  for (const oldUrl of matches) {
    const newUrl = transformToCloudinaryUrl(oldUrl);
    if (newUrl) {
      // Replace all occurrences
      content = content.split(oldUrl).join(newUrl);
      updateCount++;
      console.log(`  Replaced: ${oldUrl}`);
      console.log(`      With: ${newUrl}`);
    }
  }

  // Also find and replace any jaylataylor.com/assets URLs
  const assetsPattern = /https:\/\/jaylataylor\.com\/assets\/[^"'\s]+/g;
  const assetMatches = content.match(assetsPattern) || [];

  for (const oldUrl of assetMatches) {
    // Extract path after /assets/
    const assetPath = oldUrl.replace("https://jaylataylor.com/assets/", "");
    const isVideo = /\.(mov|mp4)$/i.test(assetPath);
    const assetType = isVideo ? "video" : "image";
    const transformations = isVideo ? "f_auto" : "f_auto,q_auto";

    // Clean up the path
    const cleanPath = assetPath
      .replace(/\.(jpg|jpeg|png|gif|webp|mov|mp4)$/i, "")
      .replace(/\s+/g, "_");

    const newUrl = `${CLOUDINARY_BASE}/${assetType}/upload/${transformations}/${cleanPath}`;

    content = content.split(oldUrl).join(newUrl);
    updateCount++;
    console.log(`  Replaced: ${oldUrl}`);
    console.log(`      With: ${newUrl}`);
  }

  if (updateCount > 0) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(
      `✅ Updated ${updateCount} URLs in ${path.basename(filePath)}\n`,
    );
  } else {
    console.log(
      `ℹ️ No jaylataylor.com URLs found in ${path.basename(filePath)}\n`,
    );
  }

  return updateCount;
}

// Main execution
console.log("🚀 Starting Cloudinary URL migration...\n");
console.log("Cloud Name: whxy");
console.log("================================\n");

// List of HTML files to update
const htmlFiles = [
  "jaylataylor-website/index.html",
  "jaylataylor-website/about.html",
  "jaylataylor-website/gallery.html",
  "jaylataylor-website/shop.html",
  "jaylataylor-website/contact.html",
  "jaylataylor-website/faq.html",
  "jaylataylor-website/checkout.html",
  "jaylataylor-website/cart.html",
  "jaylataylor-website/product-detail.html",
  "jaylataylor-website/nyc-fashion-week.html",
  "jaylataylor-website/paris-fashion-week.html",
  "jaylataylor-website/shipping-returns.html",
  "jaylataylor-website/size-guide.html",
  "jaylataylor-website/privacy-policy.html",
  "jaylataylor-website/terms-of-service.html",
  "jaylataylor-website/seller-dashboard.html",
];

let totalUpdates = 0;

for (const file of htmlFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    totalUpdates += updateHtmlFile(filePath);
  } else {
    console.log(`⚠️ File not found: ${file}\n`);
  }
}

// Also check for JavaScript files that might contain image URLs
console.log("\n🔍 Checking JavaScript files...\n");

const jsFiles = [
  "jaylataylor-website/js/gallery.js",
  "jaylataylor-website/js/shop.js",
  "jaylataylor-website/data/products.json",
  "jaylataylor-website/backend/data/products.json",
];

for (const file of jsFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    if (ext === ".json") {
      // Handle JSON files differently
      console.log(`Processing JSON: ${filePath}`);
      let content = fs.readFileSync(filePath, "utf8");
      let data = JSON.parse(content);
      let updated = false;

      // Recursively update URLs in JSON
      function updateUrls(obj) {
        for (let key in obj) {
          if (
            typeof obj[key] === "string" &&
            obj[key].includes("jaylataylor.com")
          ) {
            const newUrl = transformToCloudinaryUrl(obj[key]);
            if (newUrl) {
              obj[key] = newUrl;
              updated = true;
              console.log(`  Replaced: ${obj[key]}`);
              console.log(`      With: ${newUrl}`);
            }
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            updateUrls(obj[key]);
          }
        }
      }

      updateUrls(data);

      if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
        console.log(`✅ Updated JSON file: ${path.basename(filePath)}\n`);
        totalUpdates++;
      }
    } else {
      totalUpdates += updateHtmlFile(filePath);
    }
  }
}

console.log("================================");
console.log(`✨ Migration complete! Updated ${totalUpdates} files total.`);
console.log("\n📝 Cloudinary folder structure used:");
console.log("   - collaborative-work");
console.log("   - extra-content");
console.log("   - info-for-shop");
console.log("   - j-t-accessories");
console.log("   - lingerie-collection");
console.log("   - logos");
console.log("   - magazine-features");
console.log("   - newyork-fashion");
console.log("   - paris-fashion-week");
console.log("   - swim-collection");
console.log("   - swim24");
console.log("   - timeless-collection");
