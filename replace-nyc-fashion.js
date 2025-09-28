#!/usr/bin/env node

const fs = require('fs');

// Load the cloudinary organized data
const cloudinaryData = JSON.parse(
  fs.readFileSync('jaylataylor-website/backend/cloudinary-folders-organized.json', 'utf8')
);

const nycResources = cloudinaryData['newyork-fashion'].resources;

// Create a mapping function
function findCloudinaryMatch(filename) {
  const baseFilename = filename.toLowerCase().replace(/\.(jpeg|jpg|png)$/i, '');

  // Look for exact match or similar match
  const resource = nycResources.find(r => {
    const cloudinaryBase = r.filename.toLowerCase().replace(/_[a-z0-9]+$/, '');
    return cloudinaryBase.includes(baseFilename) || baseFilename.includes(cloudinaryBase);
  });

  if (resource) {
    return resource.urls.medium || resource.urls.large;
  }
  return null;
}

// Read the NYC Fashion Week HTML file
let content = fs.readFileSync('jaylataylor-website/nyc-fashion-week.html', 'utf8');

// Extract all NYC Fashion Week image URLs
const urlPattern = /https:\/\/jaylataylor\.com\/content\/New%20York%20Fashion%20Week%2023[^"'\s]*/g;
const matches = content.match(urlPattern) || [];

console.log(`Found ${matches.length} NYC Fashion Week URLs to replace`);

// Create unique set of URLs
const uniqueUrls = [...new Set(matches)];
let replacedCount = 0;

for (const url of uniqueUrls) {
  const filename = url.split('/').pop().replace(/%20/g, ' ');
  console.log(`Looking for replacement for: ${filename}`);

  const cloudinaryUrl = findCloudinaryMatch(filename);
  if (cloudinaryUrl) {
    content = content.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cloudinaryUrl);
    console.log(`✅ Replaced ${filename}`);
    replacedCount++;
  } else {
    console.log(`⚠️  No match found for ${filename}`);
  }
}

// Write back the updated content
fs.writeFileSync('jaylataylor-website/nyc-fashion-week.html', content, 'utf8');
console.log(`\n✅ Replaced ${replacedCount} out of ${uniqueUrls.length} unique URLs`);
