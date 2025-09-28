const fs = require('fs');
const path = require('path');

// Function to fix Cloudinary URLs by adding proper extensions
function fixCloudinaryUrls(content) {
  // Pattern to match Cloudinary URLs without extensions
  const pattern = /https:\/\/res\.cloudinary\.com\/whxy\/(image|video)\/upload\/([^"'\s]+?)\/([A-Za-z0-9_\-]+)(?=["'\s])/g;

  return content.replace(pattern, (match, assetType, transformations, filename) => {
    // Determine extension based on filename and asset type
    let extension = '';

    // Common image patterns
    if (assetType === 'image') {
      if (filename.match(/IMG_\d+/)) {
        // Most IMG_ files seem to be PNG or JPG
        if (filename.includes('PNG') || filename.match(/IMG_(7805|5888|8715|8173|5893|8713|5895|5890|8712|5881|5882|8710|8711|8048)/)) {
          extension = '.png';
        } else {
          extension = '.jpg';
        }
      } else if (filename.includes('SHOW4')) {
        extension = '.jpeg';
      } else if (filename.includes('homepage_poster')) {
        extension = '.jpg';
      } else {
        // Default to jpg for images
        extension = '.jpg';
      }
    } else if (assetType === 'video') {
      // Video files
      if (filename.includes('test_3') || filename.includes('homepage')) {
        extension = '.mp4';
      } else {
        extension = '.mov';
      }
    }

    return `https://res.cloudinary.com/whxy/${assetType}/upload/${transformations}/${filename}${extension}`;
  });
}

// Files to update
const htmlFiles = [
  'jaylataylor-website/index.html',
  'jaylataylor-website/about.html',
  'jaylataylor-website/gallery.html',
  'jaylataylor-website/shop.html',
  'jaylataylor-website/contact.html',
  'jaylataylor-website/faq.html',
  'jaylataylor-website/checkout.html',
  'jaylataylor-website/cart.html',
  'jaylataylor-website/nyc-fashion-week.html',
  'jaylataylor-website/paris-fashion-week.html'
];

console.log('🔧 Fixing Cloudinary URLs to include proper extensions...\n');

let totalFixed = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixCloudinaryUrls(content);

    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');

      // Count how many URLs were fixed
      const originalMatches = content.match(/https:\/\/res\.cloudinary\.com\/whxy\/(image|video)\/upload\/[^"'\s]+/g) || [];
      const fixedMatches = fixedContent.match(/https:\/\/res\.cloudinary\.com\/whxy\/(image|video)\/upload\/[^"'\s]+\.\w+/g) || [];
      const numFixed = fixedMatches.length - originalMatches.filter(url => url.match(/\.\w+$/)).length;

      if (numFixed > 0) {
        console.log(`✅ Fixed ${numFixed} URLs in ${path.basename(filePath)}`);
        totalFixed += numFixed;
      }
    } else {
      console.log(`ℹ️  No changes needed in ${path.basename(filePath)}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✨ Fixed ${totalFixed} Cloudinary URLs total!`);
console.log('\n📝 URL Format: https://res.cloudinary.com/whxy/<asset_type>/upload/<transformations>/<public_id>.<extension>');
