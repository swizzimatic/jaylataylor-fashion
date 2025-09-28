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

// Fetch all resources and organize by folder
async function fetchAndOrganizeResources() {
  console.log("\n📂 Fetching all resources from Cloudinary...");
  console.log("─".repeat(50));

  const allResources = [];
  let nextCursor = null;
  let pageCount = 0;

  try {
    // Paginate through all resources
    do {
      pageCount++;
      console.log(`📄 Fetching page ${pageCount}...`);

      const options = {
        type: "upload",
        prefix: "",
        max_results: 500,
        context: true,
        tags: true,
        metadata: true,
      };

      if (nextCursor) {
        options.next_cursor = nextCursor;
      }

      const response = await cloudinary.api.resources(options);
      allResources.push(...response.resources);
      nextCursor = response.next_cursor;

      console.log(`   Found ${response.resources.length} resources in this page`);
    } while (nextCursor);

    console.log(`\n✅ Total resources fetched: ${allResources.length}`);
    return allResources;
  } catch (error) {
    console.error("❌ Error fetching resources:", error.message);

    // Try Search API as fallback
    console.log("\n🔄 Trying Search API as fallback...");
    try {
      const searchResult = await cloudinary.search
        .expression("resource_type:image")
        .sort_by("created_at", "desc")
        .max_results(500)
        .execute();

      console.log(`✅ Found ${searchResult.resources.length} resources via search`);
      return searchResult.resources;
    } catch (searchError) {
      console.error("❌ Search API also failed:", searchError.message);
      return [];
    }
  }
}

// Organize resources by folder
function organizeByFolder(resources) {
  const folderStructure = {};

  resources.forEach((resource) => {
    // Extract folder path from public_id
    const parts = resource.public_id.split("/");
    let folderPath;

    if (parts.length === 1) {
      folderPath = "root";
    } else {
      // Join all parts except the last one (filename)
      folderPath = parts.slice(0, -1).join("/");
    }

    if (!folderStructure[folderPath]) {
      folderStructure[folderPath] = {
        folder: folderPath,
        itemCount: 0,
        totalSize: 0,
        resources: [],
      };
    }

    // Generate optimized URLs for different use cases
    const optimizedUrls = {
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
      responsive: cloudinary.url(resource.public_id, {
        crop: "scale",
        fetch_format: "auto",
        quality: "auto",
        dpr: "auto",
        responsive: true,
        width: "auto",
      }),
    };

    folderStructure[folderPath].resources.push({
      public_id: resource.public_id,
      filename: parts[parts.length - 1],
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      created_at: resource.created_at,
      urls: optimizedUrls,
      tags: resource.tags || [],
      context: resource.context || {},
    });

    folderStructure[folderPath].itemCount++;
    folderStructure[folderPath].totalSize += resource.bytes;
  });

  return folderStructure;
}

// Export to JSON file
async function exportToJson(folderStructure, filename = "cloudinary-urls-by-folder.json") {
  const outputPath = path.join(process.cwd(), filename);

  try {
    await fs.writeFile(outputPath, JSON.stringify(folderStructure, null, 2));
    console.log(`\n✅ Exported to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("❌ Error writing file:", error.message);
    return null;
  }
}

// Export to CSV file
async function exportToCsv(folderStructure, filename = "cloudinary-urls.csv") {
  const outputPath = path.join(process.cwd(), filename);

  const csvRows = [
    "Folder,Filename,Public ID,Format,Width,Height,Size (KB),Original URL,Thumbnail URL,Small URL,Medium URL,Large URL",
  ];

  Object.values(folderStructure).forEach((folder) => {
    folder.resources.forEach((resource) => {
      const row = [
        folder.folder,
        resource.filename,
        resource.public_id,
        resource.format,
        resource.width,
        resource.height,
        Math.round(resource.bytes / 1024),
        resource.urls.original,
        resource.urls.thumbnail,
        resource.urls.small,
        resource.urls.medium,
        resource.urls.large,
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");

      csvRows.push(row);
    });
  });

  try {
    await fs.writeFile(outputPath, csvRows.join("\n"));
    console.log(`✅ Exported CSV to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("❌ Error writing CSV:", error.message);
    return null;
  }
}

// Display summary
function displaySummary(folderStructure) {
  console.log("\n" + "═".repeat(60));
  console.log("📊 SUMMARY BY FOLDER");
  console.log("═".repeat(60));

  const folders = Object.keys(folderStructure).sort();

  folders.forEach((folderPath) => {
    const folder = folderStructure[folderPath];
    const sizeInMB = (folder.totalSize / (1024 * 1024)).toFixed(2);

    console.log(`\n📁 ${folderPath}`);
    console.log(`   Items: ${folder.itemCount}`);
    console.log(`   Total Size: ${sizeInMB} MB`);

    // Show first 3 items as examples
    const examples = folder.resources.slice(0, 3);
    if (examples.length > 0) {
      console.log(`   Sample URLs:`);
      examples.forEach((resource, index) => {
        console.log(`     ${index + 1}. ${resource.filename}`);
        console.log(`        Small: ${resource.urls.small}`);
      });
    }
  });

  // Overall statistics
  const totalItems = Object.values(folderStructure).reduce((sum, f) => sum + f.itemCount, 0);
  const totalSize = Object.values(folderStructure).reduce((sum, f) => sum + f.totalSize, 0);

  console.log("\n" + "═".repeat(60));
  console.log("📈 OVERALL STATISTICS");
  console.log("═".repeat(60));
  console.log(`Total Folders: ${folders.length}`);
  console.log(`Total Items: ${totalItems}`);
  console.log(`Total Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
}

// Generate HTML preview
async function generateHtmlPreview(folderStructure, filename = "cloudinary-gallery.html") {
  const outputPath = path.join(process.cwd(), filename);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudinary Asset Gallery</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        h1 {
            color: #333;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #ddd;
        }
        .folder {
            background: white;
            border-radius: 8px;
            margin-bottom: 30px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .folder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .folder-title {
            font-size: 20px;
            font-weight: 600;
            color: #444;
        }
        .folder-meta {
            color: #666;
            font-size: 14px;
        }
        .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .image-card {
            background: #fafafa;
            border-radius: 4px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }
        .image-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .image-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
        }
        .image-info {
            padding: 10px;
            font-size: 12px;
            color: #666;
        }
        .image-name {
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            padding: 20px;
        }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .modal img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        }
        .modal-close {
            position: absolute;
            top: 20px;
            right: 30px;
            font-size: 40px;
            color: white;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 Cloudinary Asset Gallery</h1>

        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${Object.keys(folderStructure).length}</div>
                <div class="stat-label">Total Folders</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Object.values(folderStructure).reduce((sum, f) => sum + f.itemCount, 0)}</div>
                <div class="stat-label">Total Assets</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(Object.values(folderStructure).reduce((sum, f) => sum + f.totalSize, 0) / (1024 * 1024)).toFixed(0)} MB</div>
                <div class="stat-label">Total Size</div>
            </div>
        </div>

        ${Object.entries(folderStructure)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([folderPath, folder]) => `
            <div class="folder">
                <div class="folder-header">
                    <div class="folder-title">📁 ${folderPath}</div>
                    <div class="folder-meta">
                        ${folder.itemCount} items • ${(folder.totalSize / (1024 * 1024)).toFixed(2)} MB
                    </div>
                </div>
                <div class="image-grid">
                    ${folder.resources.slice(0, 12).map(resource => `
                        <div class="image-card" onclick="openModal('${resource.urls.large}')">
                            <img src="${resource.urls.thumbnail}" alt="${resource.filename}" loading="lazy">
                            <div class="image-info">
                                <div class="image-name">${resource.filename}</div>
                                <div>${resource.width}×${resource.height} • ${resource.format.toUpperCase()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${folder.resources.length > 12 ? `<div style="text-align: center; margin-top: 15px; color: #666;">... and ${folder.resources.length - 12} more</div>` : ''}
            </div>
        `).join('')}
    </div>

    <div id="modal" class="modal" onclick="closeModal()">
        <span class="modal-close">&times;</span>
        <img id="modal-img" src="" alt="">
    </div>

    <script>
        function openModal(src) {
            document.getElementById('modal').classList.add('active');
            document.getElementById('modal-img').src = src;
        }
        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }
    </script>
</body>
</html>`;

  try {
    await fs.writeFile(outputPath, htmlContent);
    console.log(`✅ Generated HTML gallery: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("❌ Error writing HTML:", error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log("🌟 Cloudinary URL Export Tool - Folder Organization");
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

  // Fetch all resources
  const resources = await fetchAndOrganizeResources();
  if (resources.length === 0) {
    console.log("\n⚠️ No resources found.");
    process.exit(0);
  }

  // Organize by folder
  const folderStructure = organizeByFolder(resources);

  // Display summary
  displaySummary(folderStructure);

  // Export to different formats
  console.log("\n" + "═".repeat(60));
  console.log("📤 EXPORTING DATA");
  console.log("═".repeat(60));

  await exportToJson(folderStructure);
  await exportToCsv(folderStructure);
  await generateHtmlPreview(folderStructure);

  console.log("\n✨ Export complete! Check the generated files:");
  console.log("   • cloudinary-urls-by-folder.json - Full data in JSON format");
  console.log("   • cloudinary-urls.csv - Spreadsheet-friendly format");
  console.log("   • cloudinary-gallery.html - Visual preview gallery");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
