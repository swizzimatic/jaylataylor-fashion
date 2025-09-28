#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the cloudinary organized data
const cloudinaryData = JSON.parse(
  fs.readFileSync('jaylataylor-website/backend/cloudinary-folders-organized.json', 'utf8')
);

// Create a mapping function from jaylataylor.com URL to Cloudinary URL
function mapUrlToCloudinary(originalUrl) {
  // Extract the path from the jaylataylor.com URL
  const match = originalUrl.match(/jaylataylor\.com\/(.*)/);
  if (!match) return null;

  const fullPath = decodeURIComponent(match[1]);
  console.log(`Processing: ${fullPath}`);

  // Extract filename from the path
  const filename = path.basename(fullPath).toLowerCase();
  const filenameNoExt = filename.replace(/\.[^.]+$/, '');

  // Map folder names from jaylataylor.com to Cloudinary folders
  const folderMappings = {
    'assets/images/Logos': 'logos',
    'content/Collaborative Work': 'collaborative-work',
    'content/New York Fashion Week 23'': 'newyork-fashion',
    'content/Paris Fashion Week 24'': 'paris-fashion-week',
    'content/Lingerie Collection': 'lingerie-collection',
    'content/Swim 24'': 'swim24',
    'content/J-T Accessories': 'j-t-accessories',
    'content/Timeless Collection': 'timeless-collection',
    'content/Magazine features': 'magazine-features'
  };

  // Find the matching folder
  let cloudinaryFolder = null;
  for (const [jaylaTaylorPath, cloudinaryPath] of Object.entries(folderMappings)) {
    if (fullPath.toLowerCase().includes(jaylaTaylorPath.toLowerCase())) {
      cloudinaryFolder = cloudinaryPath;
      break;
    }
  }

  if (!cloudinaryFolder) {
    console.log(`No folder mapping found for: ${fullPath}`);
    return null;
  }

  // Search for the file in the Cloudinary data
  const folderData = cloudinaryData[cloudinaryFolder];
  if (!folderData) {
    console.log(`Cloudinary folder not found: ${cloudinaryFolder}`);
    return null;
  }

  // Look for matching resource by filename
  const resource = folderData.resources.find(r => {
    const cloudinaryFilename = r.filename.toLowerCase();
    const cloudinaryFilenameNoExt = cloudinaryFilename.replace(/\.[^.]+$/, '');

    // Try multiple matching strategies
    return cloudinaryFilename === filename ||
           cloudinaryFilenameNoExt === filenameNoExt ||
           cloudinaryFilename.includes(filenameNoExt) ||
           filenameNoExt.includes(cloudinaryFilenameNoExt);
  });

  if (!resource) {
    console.log(`No matching resource found for ${filename} in ${cloudinaryFolder}`);
    // List available resources for debugging
    console.log('Available resources:', folderData.resources.map(r => r.filename).slice(0, 5));
    return null;
  }

  // Return the appropriate Cloudinary URL (using medium size for most images)
  const url = resource.urls.medium || resource.urls.original;
  console.log(`Mapped to: ${url}`);
  return url;
}

// Process HTML files
function updateHtmlFile(filePath) {
  console.log(`\n=== Processing ${filePath} ===`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updateCount = 0;

  // Find all jaylataylor.com URLs
  const urlPattern = /https?:\/\/jaylataylor\.com\/[^"'\s]*/g;
  const matches = content.match(urlPattern);

  if (!matches) {
    console.log('No jaylataylor.com URLs found');
    return;
  }

  console.log(`Found ${matches.length} jaylataylor.com URLs`);

  // Replace each URL
  for (const originalUrl of matches) {
    const cloudinaryUrl = mapUrlToCloudinary(originalUrl);
    if (cloudinaryUrl) {
      content = content.replace(originalUrl, cloudinaryUrl);
      updateCount++;
    } else {
      console.warn(`Could not map URL: ${originalUrl}`);
    }
  }

  // Write back the updated content
  if (updateCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${updateCount} URLs in ${filePath}`);
  } else {
    console.log(`⚠️  No URLs were updated in ${filePath}`);
  }
}

// Main execution
const htmlFiles = [
  'jaylataylor-website/index.html',
  'jaylataylor-website/cart.html',
  'jaylataylor-website/shop.html',
  'jaylataylor-website/gallery.html',
  'jaylataylor-website/product-detail.html',
  'jaylataylor-website/about.html',
  'jaylataylor-website/contact.html',
  'jaylataylor-website/checkout.html',
  'jaylataylor-website/nyc-fashion-week.html',
  'jaylataylor-website/paris-fashion-week.html',
  'jaylataylor-website/seller-dashboard.html',
  'jaylataylor-website/terms-of-service.html',
  'jaylataylor-website/privacy-policy.html',
  'jaylataylor-website/shipping-returns.html',
  'jaylataylor-website/size-guide.html',
  'jaylataylor-website/faq.html'
];

console.log('Starting URL migration to Cloudinary...\n');

htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    updateHtmlFile(file);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('\n✅ Migration complete!');
