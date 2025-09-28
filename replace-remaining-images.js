#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the cloudinary organized data
const cloudinaryData = JSON.parse(
  fs.readFileSync('jaylataylor-website/backend/cloudinary-folders-organized.json', 'utf8')
);

// Function to find best match from any folder
function findBestCloudinaryMatch(originalUrl) {
  const filename = path.basename(decodeURIComponent(originalUrl));
  const baseFilename = filename.toLowerCase()
    .replace(/\.(jpeg|jpg|png)$/i, '')
    .replace(/[\(\)]/g, '')
    .replace(/\s+/g, '')
    .replace(/_/g, '');

  // Try to find in the appropriate folder first
  let folderName = null;
  if (originalUrl.includes('Timeless%20Collection')) folderName = 'timeless-collection';
  else if (originalUrl.includes('Collaborative%20Work')) folderName = 'collaborative-work';
  else if (originalUrl.includes('Magazine%20features')) folderName = 'magazine-features';
  else if (originalUrl.includes('Lingerie%20Collection')) folderName = 'lingerie-collection';
  else if (originalUrl.includes('Swim%20Collection') || originalUrl.includes('Swim%2024')) folderName = 'swim24';
  else if (originalUrl.includes('J-T%20Accessories')) folderName = 'j-t-accessories';

  if (folderName && cloudinaryData[folderName]) {
    const resources = cloudinaryData[folderName].resources;
    const resource = resources.find(r => {
      const cloudinaryBase = r.filename.toLowerCase()
        .replace(/_[a-z0-9]+$/, '')
        .replace(/\s+/g, '')
        .replace(/_/g, '');
      return cloudinaryBase.includes(baseFilename) || baseFilename.includes(cloudinaryBase);
    });

    if (resource) {
      return resource.urls.medium || resource.urls.large;
    }
  }

  // If not found in expected folder, search all folders
  for (const [folder, data] of Object.entries(cloudinaryData)) {
    if (!data.resources) continue;

    const resource = data.resources.find(r => {
      const cloudinaryBase = r.filename.toLowerCase()
        .replace(/_[a-z0-9]+$/, '')
        .replace(/\s+/g, '')
        .replace(/_/g, '');
      return cloudinaryBase.includes(baseFilename) || baseFilename.includes(cloudinaryBase);
    });

    if (resource) {
      console.log(`Found ${filename} in ${folder}`);
      return resource.urls.medium || resource.urls.large;
    }
  }

  return null;
}

// Process multiple HTML files
const htmlFiles = [
  'jaylataylor-website/gallery.html',
  'jaylataylor-website/checkout.html',
  'jaylataylor-website/shipping-returns.html',
  'jaylataylor-website/size-guide.html',
  'jaylataylor-website/terms-of-service.html'
];

let totalReplaced = 0;
let totalNotFound = 0;

htmlFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`\n=== Processing ${path.basename(filePath)} ===`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all jaylataylor.com image URLs
  const urlPattern = /https:\/\/jaylataylor\.com\/[^"'\s@]*/g;
  const matches = content.match(urlPattern) || [];

  const imageUrls = matches.filter(url =>
    /\.(jpeg|jpg|png|JPEG|JPG|PNG)$/i.test(url)
  );

  if (imageUrls.length === 0) {
    console.log('No image URLs to replace');
    return;
  }

  console.log(`Found ${imageUrls.length} image URLs`);

  const uniqueUrls = [...new Set(imageUrls)];
  let fileReplaced = 0;

  uniqueUrls.forEach(url => {
    const cloudinaryUrl = findBestCloudinaryMatch(url);
    if (cloudinaryUrl) {
      content = content.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cloudinaryUrl);
      console.log(`✅ Replaced: ${path.basename(decodeURIComponent(url))}`);
      fileReplaced++;
      totalReplaced++;
    } else {
      console.log(`⚠️  Not found: ${path.basename(decodeURIComponent(url))}`);
      totalNotFound++;
    }
  });

  if (fileReplaced > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${fileReplaced} URLs in ${path.basename(filePath)}`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Total replaced: ${totalReplaced}`);
console.log(`Total not found: ${totalNotFound}`);
