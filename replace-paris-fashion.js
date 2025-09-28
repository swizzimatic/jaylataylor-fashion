#!/usr/bin/env node

const fs = require('fs');

// Load the cloudinary organized data
const cloudinaryData = JSON.parse(
  fs.readFileSync('jaylataylor-website/backend/cloudinary-folders-organized.json', 'utf8')
);

const parisResources = cloudinaryData['paris-fashion-week'].resources;

// Create a mapping function
function findCloudinaryMatch(filename) {
  const baseFilename = filename.toLowerCase()
    .replace(/\.(jpeg|jpg|png)$/i, '')
    .replace(/[\(\)]/g, '') // Remove parentheses
    .replace(/_/g, '');  // Remove underscores for better matching

  // Look for exact match or similar match
  const resource = parisResources.find(r => {
    const cloudinaryBase = r.filename.toLowerCase()
      .replace(/_[a-z0-9]+$/, '')
      .replace(/_/g, '');
    return cloudinaryBase.includes(baseFilename) || baseFilename.includes(cloudinaryBase);
  });

  if (resource) {
    return resource.urls.medium || resource.urls.large;
  }
  return null;
}

// Read the Paris Fashion Week HTML file
let content = fs.readFileSync('jaylataylor-website/paris-fashion-week.html', 'utf8');

// Extract all Paris Fashion Week image URLs (including video source and poster)
const urlPattern = /https:\/\/jaylataylor\.com\/content\/Paris%20Fashion%20Week%2024[^"'\s]*/g;
const matches = content.match(urlPattern) || [];

console.log(`Found ${matches.length} Paris Fashion Week URLs to replace`);

// Create unique set of URLs
const uniqueUrls = [...new Set(matches)];
let replacedCount = 0;
let notFoundList = [];

for (const url of uniqueUrls) {
  const filename = decodeURIComponent(url.split('/').pop());
  console.log(`Looking for replacement for: ${filename}`);

  // Skip video files (we'll handle them separately if needed)
  if (filename.endsWith('.mp4')) {
    console.log(`⏭️  Skipping video file: ${filename}`);
    continue;
  }

  const cloudinaryUrl = findCloudinaryMatch(filename);
  if (cloudinaryUrl) {
    content = content.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cloudinaryUrl);
    console.log(`✅ Replaced ${filename}`);
    replacedCount++;
  } else {
    console.log(`⚠️  No match found for ${filename}`);
    notFoundList.push(filename);
  }
}

// Write back the updated content
fs.writeFileSync('jaylataylor-website/paris-fashion-week.html', content, 'utf8');
console.log(`\n✅ Replaced ${replacedCount} out of ${uniqueUrls.length} unique URLs`);

if (notFoundList.length > 0) {
  console.log('\nNot found:');
  notFoundList.forEach(f => console.log(`  - ${f}`));
}
