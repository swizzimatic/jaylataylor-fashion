#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CLOUDINARY_CLOUD = 'whxy';
const FASHION_WEEK_FILES = [
    'jaylataylor-website/paris-fashion-week.html',
    'jaylataylor-website/nyc-fashion-week.html'
];

// Cloudinary transformation for fashion week images
const TRANSFORMATIONS = {
    gallery: 'f_auto,q_auto:best,c_fill,g_auto:subject,dpr_auto,fl_progressive',
    poster: 'f_auto,q_auto:best,c_fill,w_1920,h_1080,g_auto:subject,dpr_auto,fl_progressive'
};

// Function to create Cloudinary URL from old URL
function createCloudinaryUrl(oldUrl, type = 'gallery') {
    // Extract filename from old URL
    const urlParts = oldUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Clean filename (remove URL encoding if needed)
    const cleanFilename = decodeURIComponent(filename)
        .replace(/\s+/g, '_')  // Replace spaces with underscores
        .replace(/['"]/g, '')  // Remove quotes
        .replace(/\.PNG$/i, '.png')  // Normalize PNG extension
        .replace(/\.JPEG$/i, '.jpg')  // Normalize JPEG extension
        .replace(/\.MOV$/i, '.mov')  // Normalize MOV extension
        .replace(/\.MP4$/i, '.mp4'); // Normalize MP4 extension

    // Determine folder based on content path
    let folder = 'fashion-week';
    if (oldUrl.includes('Paris%20Fashion%20Week')) {
        folder = 'paris-fashion-week-2024';
    } else if (oldUrl.includes('New%20York%20Fashion%20Week')) {
        folder = 'nyc-fashion-week-2023';
    } else if (oldUrl.includes('Magazine%20features')) {
        folder = 'magazine-features';
    }

    // For video files, use minimal transformations
    if (cleanFilename.match(/\.(mp4|mov)$/i)) {
        return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/video/upload/q_auto,f_auto/${folder}/${cleanFilename}`;
    }

    // Build Cloudinary URL for images
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${TRANSFORMATIONS[type]}/${folder}/${cleanFilename}`;
}

// Function to create responsive picture element
function createResponsivePicture(originalImg, cloudinaryUrl) {
    const alt = originalImg.match(/alt="([^"]*)"/)?.[1] || 'Fashion Week Image';
    const style = originalImg.match(/style="([^"]*)"/)?.[1] || '';

    // Extract base filename for different sizes
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    const basePath = urlParts.slice(0, uploadIndex + 1).join('/');
    const fileName = urlParts.slice(uploadIndex + 2).join('/');

    return `<picture>
                    <source media="(max-width: 640px)"
                            srcset="${basePath}/f_auto,q_auto,c_fill,w_640,h_640,g_auto:subject,dpr_auto,fl_progressive/${fileName}">
                    <source media="(max-width: 1024px)"
                            srcset="${basePath}/f_auto,q_auto,c_fill,w_1024,h_768,g_auto:subject,dpr_auto,fl_progressive/${fileName}">
                    <source media="(min-width: 1025px)"
                            srcset="${basePath}/f_auto,q_auto:best,c_fill,w_1920,h_1080,g_auto:subject,dpr_auto,fl_progressive/${fileName}">
                    <img src="${cloudinaryUrl}"
                         alt="${alt}"
                         ${style ? `style="${style}"` : ''}
                         loading="lazy">
                </picture>`;
}

// Process each file
FASHION_WEEK_FILES.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
    }

    console.log(`\n📁 Processing: ${filePath}`);
    let content = fs.readFileSync(fullPath, 'utf8');
    let replaceCount = 0;

    // Replace image tags
    content = content.replace(/<img\s+src="https:\/\/jaylataylor\.com\/[^"]+"\s*[^>]*>/g, (match) => {
        const srcMatch = match.match(/src="([^"]*)"/);
        if (srcMatch) {
            const oldUrl = srcMatch[1];
            const cloudinaryUrl = createCloudinaryUrl(oldUrl);
            const newPicture = createResponsivePicture(match, cloudinaryUrl);
            replaceCount++;
            console.log(`  ✓ Replaced image: ${oldUrl.split('/').pop()}`);
            return newPicture;
        }
        return match;
    });

    // Replace video sources and posters
    content = content.replace(/poster="https:\/\/jaylataylor\.com\/[^"]+"/g, (match) => {
        const urlMatch = match.match(/poster="([^"]*)"/);
        if (urlMatch) {
            const oldUrl = urlMatch[1];
            const cloudinaryUrl = createCloudinaryUrl(oldUrl, 'poster');
            replaceCount++;
            console.log(`  ✓ Replaced video poster: ${oldUrl.split('/').pop()}`);
            return `poster="${cloudinaryUrl}"`;
        }
        return match;
    });

    content = content.replace(/<source\s+src="https:\/\/jaylataylor\.com\/[^"]+"/g, (match) => {
        const urlMatch = match.match(/src="([^"]*)"/);
        if (urlMatch) {
            const oldUrl = urlMatch[1];
            const cloudinaryUrl = createCloudinaryUrl(oldUrl);
            replaceCount++;
            console.log(`  ✓ Replaced video source: ${oldUrl.split('/').pop()}`);
            return `<source src="${cloudinaryUrl}"`;
        }
        return match;
    });

    // Replace download links in video fallback
    content = content.replace(/href="https:\/\/jaylataylor\.com\/[^"]+\.(mp4|mov)"/gi, (match) => {
        const urlMatch = match.match(/href="([^"]*)"/);
        if (urlMatch) {
            const oldUrl = urlMatch[1];
            const cloudinaryUrl = createCloudinaryUrl(oldUrl);
            replaceCount++;
            console.log(`  ✓ Replaced download link: ${oldUrl.split('/').pop()}`);
            return `href="${cloudinaryUrl}"`;
        }
        return match;
    });

    // Write back the file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Total replacements: ${replaceCount}`);
});

console.log('\n✨ Fashion Week pages migration complete!');
console.log('\n⚠️  Note: Make sure to upload the actual images to Cloudinary with matching folder structure:');
console.log('  - paris-fashion-week-2024/');
console.log('  - nyc-fashion-week-2023/');
console.log('  - magazine-features/');
