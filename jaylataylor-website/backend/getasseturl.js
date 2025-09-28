#!/usr/bin/env node

const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary credentials from environment
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "whxy",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Test basic API access first
async function testConnection() {
  try {
    console.log("🔍 Testing Cloudinary connection...");
    const result = await cloudinary.api.ping();
    console.log("✅ Connection successful:", result);
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    return false;
  }
}

// List all resources with different approaches
async function listAllResources() {
  console.log("\n📂 Attempting to list ALL resources in account...");
  console.log("─".repeat(50));

  try {
    // Method 1: Using Admin API to list resources
    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: "", // Get everything
      max_results: 500,
      context: true,
      tags: true,
      metadata: true,
    });

    if (resources.resources && resources.resources.length > 0) {
      console.log(\nFound ${resources.resources.length} total resources\n);

      // Group by folder
      const folders = {};
      resources.resources.forEach((resource) => {
        const parts = resource.public_id.split("/");
        const folder = parts.length > 1 ? parts[0] : "root";

        if (!folders[folder]) {
          folders[folder] = [];
        }
        folders[folder].push(resource);
      });

      // Display by folder
      Object.keys(folders)
        .sort()
        .forEach((folder) => {
          console.log(\n📁 ${folder} (${folders[folder].length} items));
          console.log("─".repeat(30));

          folders[folder].forEach((resource) => {
            console.log(  • ${resource.public_id});
            console.log(
                  Format: ${resource.format}, Size: ${(resource.bytes / 1024).toFixed(0)} KB,
            );
            console.log(    URL: ${resource.secure_url});
          });
        });
    } else {
      console.log("No resources found.");
    }
  } catch (error) {
    console.error("Error listing resources:", error.message);

    // Try Search API as fallback
    console.log("\n🔄 Trying Search API instead...");
    try {
      const searchResult = await cloudinary.search
        .expression("resource_type:image")
        .sort_by("created_at", "desc")
        .max_results(500)
        .execute();

      console.log(Found ${searchResult.total_count} total images);

      if (searchResult.resources && searchResult.resources.length > 0) {
        // Group by folder
        const folders = {};
        searchResult.resources.forEach((resource) => {
          const parts = resource.public_id.split("/");
          const folder = parts.length > 1 ? parts[0] : "root";

          if (!folders[folder]) {
            folders[folder] = [];
          }
          folders[folder].push(resource);
        });

        // Display by folder
        Object.keys(folders)
          .sort()
          .forEach((folder) => {
            console.log(\n📁 ${folder} (${folders[folder].length} items));
            folders[folder].slice(0, 3).forEach((resource) => {
              console.log(  • ${resource.public_id});
              console.log(    URL: ${resource.secure_url});
            });
          });
      }
    } catch (searchError) {
      console.error("Search API also failed:", searchError.message);
    }
  }
}

// Get specific folder contents

// List folders
async function listFolders() {
  console.log("\n📂 Listing all folders...");
  console.log("─".repeat(40));

  try {
    const folders = await cloudinary.api.root_folders();
    console.log("Root folders found:", folders.folders);

    for (const folder of folders.folders) {
      console.log(\n📁 ${folder.name});
      try {
        const subfolders = await cloudinary.api.sub_folders(folder.name);
        if (subfolders.folders && subfolders.folders.length > 0) {
          subfolders.folders.forEach((sf) => {
            console.log(  └── ${sf.name});
          });
        }
      } catch (err) {
        // Subfolder access might fail, that's ok
      }
    }
  } catch (error) {
    console.error("Error listing folders:", error.message);
  }
}

// Export URLs for products
async function exportProductUrls() {
  console.log("\n\n📦 Generating optimized URLs for products");
  console.log("═".repeat(50));

  // Sample URLs based on what we've seen in the products.json
  const sampleUrls = [
    {
      original: "v1758215132/Jayla_Taylor_Low_Res_M44B6352_1_grc8ek",
      optimized:
        "https://res.cloudinary.com/whxy/image/upload/f_auto,q_auto,c_fill,w_800,h_800,g_auto:subject/v1758215132/Jayla_Taylor_Low_Res_M44B6352_1_grc8ek.jpg",
    },
    {
      original: "collaborative-Work/IMG_1999",
      optimized:
        "https://res.cloudinary.com/whxy/image/upload/f_auto,q_auto,c_fill,w_800,h_800,g_auto:subject/Collaborative_Work/IMG_1999.jpg",
    },
    {
      original: "swim24/IMG_1587",
      optimized:
        "https://res.cloudinary.com/whxy/image/upload/f_auto,q_auto,c_fill,w_800,h_800,g_auto:subject/Swim_24/IMG_1587.jpg",
    },
  ];

  console.log("\nOptimized URL pattern for products:");
  console.log(
    `https://res.cloudinary.com/${cloudinary.config().cloud_name}/image/upload/`,
  );
  console.log("  f_auto,q_auto,c_fill,w_800,h_800,g_auto:subject/");
  console.log("  {public_id}.{format}");

  console.log("\n\nExample URLs:");
  sampleUrls.forEach((url) => {
    console.log(\n${url.original});
    console.log(  → ${url.optimized});
  });
}

// Main function
async function main() {
  console.log("🌟 Cloudinary Asset Discovery Tool");
  console.log("═".repeat(50));
  console.log(Cloud Name: ${cloudinary.config().cloud_name});
  console.log(
    API Key: ${cloudinary.config().api_key ? "***" + cloudinary.config().api_key.slice(-4) : "NOT SET"},
  );
  console.log(Timestamp: ${new Date().toISOString()});
  console.log("");

  // Check credentials
  if (!cloudinary.config().api_key || !cloudinary.config().api_secret) {
    console.log("⚠️  API credentials not configured!");
    console.log("\nPlease create a .env file with:");
    console.log("CLOUDINARY_CLOUD_NAME=whxy");
    console.log("CLOUDINARY_API_KEY=your_api_key");
    console.log("CLOUDINARY_API_SECRET=your_api_secret");
    console.log("\nOr set them as environment variables.");
    process.exit(1);
  }

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log("\n❌ Cannot connect to Cloudinary. Check your credentials.");
    process.exit(1);
  }

  // Try different methods to list assets
  await listFolders();
  await listAllResources();

  await exportProductUrls();
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
