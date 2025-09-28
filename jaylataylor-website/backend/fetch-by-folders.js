#!/usr/bin/env node

const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "whxy",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Known folders based on your products.json patterns
const KNOWN_FOLDERS = [
  "collaborative-Work",
  "Collaborative_Work",
  "swim24",
  "Swim_24",
  "Swim 24",
  "Lingerie Collection",
  "Bucket Hats",
  "Timeless Collection",
  "NYC Fashion Week",
  "Paris Fashion Week",
  // Add variations
  "collaborative",
  "swim",
  "lingerie",
  "bucket-hats",
  "timeless",
  "fashion-week"
];

// Test connection
async function testConnection() {
  try {
    console.log("🔍 Testing Cloudinary connection...");
    const result = await cloudinary.api.ping();
    console.log("✅ Connection successful");
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

// List actual folders from Cloudinary
async function discoverFolders() {
  console.log("\n📂 Discovering folders in Cloudinary...");
  console.log("─".repeat(50));

  const discoveredFolders = [];

  try {
    // Method 1: Try root_folders API
    try {
      const rootFolders = await cloudinary.api.root_folders();
      if (rootFolders.folders && rootFolders.folders.length > 0) {
        console.log("✅ Found root folders via API:");
        rootFolders.folders.forEach(folder => {
          console.log(`   📁 ${folder.name} (${folder.path})`);
          discoveredFolders.push(folder.path || folder.name);
        });
      }
    } catch (err) {
      console.log("⚠️  root_folders API not available");
    }

    // Method 2: Fetch all resources and extract folder patterns
    console.log("\n🔄 Analyzing resource paths for folder structure...");
    const resources = await cloudinary.api.resources({
      type: "upload",
      max_results: 500,
      prefix: ""
    });

    const folderSet = new Set();
    resources.resources.forEach(resource => {
      const parts = resource.public_id.split("/");
      if (parts.length > 1) {
        // Add all folder levels
        for (let i = 1; i <= parts.length - 1; i++) {
          const folderPath = parts.slice(0, i).join("/");
          folderSet.add(folderPath);
        }
      }
    });

    if (folderSet.size > 0) {
      console.log("✅ Discovered folder paths from resources:");
      Array.from(folderSet).sort().forEach(folder => {
        console.log(`   📁 ${folder}`);
        if (!discoveredFolders.includes(folder)) {
          discoveredFolders.push(folder);
        }
      });
    }

  } catch (error) {
    console.error("⚠️  Error discovering folders:", error.message);
  }

  // Combine with known folders
  const allFolders = [...new Set([...discoveredFolders, ...KNOWN_FOLDERS])];
  console.log(`\n📊 Total folders to check: ${allFolders.length}`);

  return allFolders;
}

// Fetch resources by folder
async function fetchResourcesByFolder(folderPrefix) {
  console.log(`\n🔍 Fetching resources from: ${folderPrefix || 'root'}`);

  const allResources = [];
  let nextCursor = null;

  try {
    do {
      const options = {
        type: "upload",
        prefix: folderPrefix,
        max_results: 500,
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const response = await cloudinary.api.resources_by_asset_folder(folderPrefix, options).catch(() => null);

      // If asset folder API doesn't work, try regular resources API
      if (!response) {
        const regularResponse = await cloudinary.api.resources({
          ...options,
          prefix: folderPrefix
        });

        if (regularResponse.resources && regularResponse.resources.length > 0) {
          allResources.push(...regularResponse.resources);
          nextCursor = regularResponse.next_cursor;
        } else {
          break;
        }
      } else {
        if (response.resources && response.resources.length > 0) {
          allResources.push(...response.resources);
          nextCursor = response.next_cursor;
        } else {
          break;
        }
      }
    } while (nextCursor);

    console.log(`   ✅ Found ${allResources.length} resources`);
    return allResources;

  } catch (error) {
    console.log(`   ⚠️  No resources found or error: ${error.message}`);
    return [];
  }
}

// Fetch all resources including root
async function fetchAllResourcesWithFolders(folders) {
  console.log("\n" + "═".repeat(60));
  console.log("📂 FETCHING RESOURCES BY FOLDER");
  console.log("═".repeat(60));

  const folderData = {};

  // Fetch root level resources (no prefix)
  const rootResources = await fetchResourcesByFolder("");
  if (rootResources.length > 0) {
    // Filter to only include actual root resources (no "/" in public_id)
    const actualRootResources = rootResources.filter(r => !r.public_id.includes("/"));
    if (actualRootResources.length > 0) {
      folderData["root"] = {
        folder: "root",
        path: "",
        resources: actualRootResources,
        itemCount: actualRootResources.length,
        totalSize: actualRootResources.reduce((sum, r) => sum + (r.bytes || 0), 0)
      };
    }
  }

  // Fetch resources for each discovered folder
  for (const folder of folders) {
    const resources = await fetchResourcesByFolder(folder);
    if (resources.length > 0) {
      folderData[folder] = {
        folder: folder,
        path: folder,
        resources: resources,
        itemCount: resources.length,
        totalSize: resources.reduce((sum, r) => sum + (r.bytes || 0), 0)
      };
    }
  }

  return folderData;
}

// Process resources and add optimized URLs
function processResources(folderData) {
  const processedData = {};

  Object.entries(folderData).forEach(([folderName, folder]) => {
    processedData[folderName] = {
      ...folder,
      resources: folder.resources.map(resource => {
        const parts = resource.public_id.split("/");
        const filename = parts[parts.length - 1];

        return {
          public_id: resource.public_id,
          filename: filename,
          format: resource.format,
          width: resource.width,
          height: resource.height,
          bytes: resource.bytes,
          created_at: resource.created_at,
          urls: {
            original: resource.secure_url,
            thumbnail: cloudinary.url(resource.public_id, {
              width: 150,
              height: 150,
              crop: "fill",
              gravity: "auto:subject",
              fetch_format: "auto",
              quality: "auto",
            }),
            small: cloudinary.url(resource.public_id, {
              width: 400,
              height: 400,
              crop: "fill",
              gravity: "auto:subject",
              fetch_format: "auto",
              quality: "auto",
            }),
            medium: cloudinary.url(resource.public_id, {
              width: 800,
              height: 800,
              crop: "fill",
              gravity: "auto:subject",
              fetch_format: "auto",
              quality: "auto",
            }),
            large: cloudinary.url(resource.public_id, {
              width: 1200,
              height: 1200,
              crop: "fit",
              fetch_format: "auto",
              quality: "auto",
            }),
            // Product-specific optimized URL (for e-commerce)
            product: cloudinary.url(resource.public_id, {
              width: 800,
              height: 800,
              crop: "fill",
              gravity: "auto:subject",
              fetch_format: "auto",
              quality: "auto",
            }),
          },
        };
      })
    };
  });

  return processedData;
}

// Export to JSON
async function exportToJson(data, filename = "cloudinary-folders-organized.json") {
  const outputPath = path.join(process.cwd(), filename);

  try {
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Exported to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("❌ Error writing file:", error.message);
    return null;
  }
}

// Generate summary report
async function generateReport(data, filename = "cloudinary-folder-report.txt") {
  const outputPath = path.join(process.cwd(), filename);

  let report = "CLOUDINARY ASSET REPORT BY FOLDER\n";
  report += "═".repeat(60) + "\n";
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Cloud Name: ${cloudinary.config().cloud_name}\n\n`;

  const folders = Object.keys(data).sort();

  // Summary statistics
  const totalItems = Object.values(data).reduce((sum, f) => sum + f.itemCount, 0);
  const totalSize = Object.values(data).reduce((sum, f) => sum + f.totalSize, 0);

  report += "OVERALL STATISTICS\n";
  report += "─".repeat(40) + "\n";
  report += `Total Folders: ${folders.length}\n`;
  report += `Total Items: ${totalItems}\n`;
  report += `Total Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB\n\n`;

  // Folder details
  report += "FOLDER BREAKDOWN\n";
  report += "─".repeat(40) + "\n\n";

  folders.forEach(folderName => {
    const folder = data[folderName];
    report += `📁 ${folderName}\n`;
    report += `   Path: ${folder.path || 'root'}\n`;
    report += `   Items: ${folder.itemCount}\n`;
    report += `   Size: ${(folder.totalSize / (1024 * 1024)).toFixed(2)} MB\n`;

    // Show first 5 files
    report += `   Sample files:\n`;
    folder.resources.slice(0, 5).forEach((resource, index) => {
      report += `     ${index + 1}. ${resource.filename}\n`;
      report += `        - Format: ${resource.format}\n`;
      report += `        - Dimensions: ${resource.width}x${resource.height}\n`;
      report += `        - Product URL: ${resource.urls.product}\n`;
    });

    if (folder.resources.length > 5) {
      report += `     ... and ${folder.resources.length - 5} more files\n`;
    }

    report += "\n";
  });

  try {
    await fs.writeFile(outputPath, report);
    console.log(`✅ Report saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("❌ Error writing report:", error.message);
    return null;
  }
}

// Display summary
function displaySummary(data) {
  console.log("\n" + "═".repeat(60));
  console.log("📊 FOLDER SUMMARY");
  console.log("═".repeat(60));

  const folders = Object.keys(data).sort();

  if (folders.length === 0) {
    console.log("⚠️  No folders with resources found");
    return;
  }

  folders.forEach(folderName => {
    const folder = data[folderName];
    const sizeInMB = (folder.totalSize / (1024 * 1024)).toFixed(2);

    console.log(`\n📁 ${folderName}`);
    console.log(`   Items: ${folder.itemCount}`);
    console.log(`   Size: ${sizeInMB} MB`);

    // Show first 3 items
    const examples = folder.resources.slice(0, 3);
    if (examples.length > 0) {
      console.log(`   First items:`);
      examples.forEach((resource, index) => {
        console.log(`     ${index + 1}. ${resource.filename} (${resource.format})`);
      });
    }
  });

  // Overall statistics
  const totalItems = Object.values(data).reduce((sum, f) => sum + f.itemCount, 0);
  const totalSize = Object.values(data).reduce((sum, f) => sum + f.totalSize, 0);

  console.log("\n" + "─".repeat(60));
  console.log(`TOTAL: ${folders.length} folders, ${totalItems} items, ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
}

// Main function
async function main() {
  console.log("🌟 Cloudinary Folder-Based Asset Fetcher");
  console.log("═".repeat(60));
  console.log(`Cloud Name: ${cloudinary.config().cloud_name}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Check credentials
  if (!cloudinary.config().api_key || !cloudinary.config().api_secret) {
    console.log("\n⚠️  API credentials not configured!");
    console.log("\nPlease create a .env file with:");
    console.log("CLOUDINARY_CLOUD_NAME=whxy");
    console.log("CLOUDINARY_API_KEY=your_api_key");
    console.log("CLOUDINARY_API_SECRET=your_api_secret");
    process.exit(1);
  }

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Discover folders
  const folders = await discoverFolders();

  // Fetch resources by folder
  const folderData = await fetchAllResourcesWithFolders(folders);

  // Process and add optimized URLs
  const processedData = processResources(folderData);

  // Display summary
  displaySummary(processedData);

  // Export results
  console.log("\n" + "═".repeat(60));
  console.log("📤 EXPORTING RESULTS");
  console.log("═".repeat(60));

  await exportToJson(processedData);
  await generateReport(processedData);

  console.log("\n✨ Complete! Check the generated files:");
  console.log("   • cloudinary-folders-organized.json - Full folder structure with URLs");
  console.log("   • cloudinary-folder-report.txt - Human-readable report");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
