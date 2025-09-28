// Gallery JavaScript

// Gallery state
let currentImages = [];
let currentImageIndex = 0;
let loadedImages = 12;
const imagesPerLoad = 6;

// Initialize gallery
document.addEventListener("DOMContentLoaded", function () {
  initializeGalleryFilters();
  initializeLightbox();
  initializeLoadMore();
  initializeCategoryLinks();
  initializeGalleryControls();
});

// Gallery Filtering
function initializeGalleryFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter");

      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // Filter items
      galleryItems.forEach((item) => {
        if (filter === "all" || item.getAttribute("data-category") === filter) {
          item.style.display = "block";
          setTimeout(() => {
            item.style.opacity = "1";
            item.style.transform = "scale(1)";
          }, 10);
        } else {
          item.style.opacity = "0";
          item.style.transform = "scale(0.8)";
          setTimeout(() => {
            item.style.display = "none";
          }, 300);
        }
      });
    });
  });
}

// Lightbox Functionality
function initializeLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxPrev = document.querySelector(".lightbox-prev");
  const lightboxNext = document.querySelector(".lightbox-next");

  // Open lightbox
  document
    .querySelectorAll(".gallery-item, .masonry-item")
    .forEach((item, index) => {
      item.addEventListener("click", function () {
        const img = this.querySelector("img");
        const caption = this.querySelector("h3")?.textContent || "";

        currentImages = Array.from(
          document.querySelectorAll(".gallery-item img, .masonry-item img"),
        );
        currentImageIndex = currentImages.indexOf(img);

        showImageInLightbox(img.src, caption);
        lightbox.style.display = "block";
        document.body.style.overflow = "hidden";
      });
    });

  // Close lightbox
  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", function (e) {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Navigation
  lightboxPrev?.addEventListener("click", showPrevImage);
  lightboxNext?.addEventListener("click", showNextImage);

  // Keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (lightbox?.style.display === "block") {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "ArrowRight") showNextImage();
    }
  });

  function showImageInLightbox(src, caption) {
    lightboxImage.src = src;
    lightboxCaption.textContent = caption;
  }

  function closeLightbox() {
    lightbox.style.display = "none";
    document.body.style.overflow = "";
  }

  function showPrevImage() {
    currentImageIndex =
      (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    const prevImage = currentImages[currentImageIndex];
    const caption =
      prevImage.closest(".gallery-item, .masonry-item")?.querySelector("h3")
        ?.textContent || "";
    showImageInLightbox(prevImage.src, caption);
  }

  function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentImages.length;
    const nextImage = currentImages[currentImageIndex];
    const caption =
      nextImage.closest(".gallery-item, .masonry-item")?.querySelector("h3")
        ?.textContent || "";
    showImageInLightbox(nextImage.src, caption);
  }
}

// Load More Functionality
function initializeLoadMore() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const loadMoreGallery = document.getElementById("loadMoreGallery");

  loadMoreBtn?.addEventListener("click", loadMoreImages);
  loadMoreGallery?.addEventListener("click", loadMoreGalleryImages);
}

function loadMoreImages() {
  const galleryGrid = document.getElementById("galleryGrid");
  const newImages = [
    { category: "runway", title: "Evening Gown", subtitle: "Finale Look" },
    { category: "backstage", title: "Makeup Room", subtitle: "Pre-show Prep" },
    { category: "models", title: "Model Lineup", subtitle: "Final Walk" },
    {
      category: "details",
      title: "Fabric Detail",
      subtitle: "Silk Embroidery",
    },
    { category: "runway", title: "Cocktail Dress", subtitle: "Mid-show Look" },
    {
      category: "backstage",
      title: "Designer Moment",
      subtitle: "Final Adjustments",
    },
  ];

  newImages.forEach((image, index) => {
    setTimeout(() => {
      const item = createGalleryItem(image);
      galleryGrid.appendChild(item);

      // Add click event for lightbox
      item.addEventListener("click", function () {
        const img = this.querySelector("img");
        const caption = this.querySelector("h3")?.textContent || "";

        currentImages = Array.from(
          document.querySelectorAll(".gallery-item img"),
        );
        currentImageIndex = currentImages.indexOf(img);

        document.getElementById("lightbox").style.display = "block";
        document.getElementById("lightboxImage").src = img.src;
        document.getElementById("lightboxCaption").textContent = caption;
        document.body.style.overflow = "hidden";
      });

      // Animate in
      setTimeout(() => {
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, 50);
    }, index * 100);
  });

  loadedImages += imagesPerLoad;

  // Hide button if no more images
  if (loadedImages >= 30) {
    document.getElementById("loadMoreBtn").style.display = "none";
  }
}

function loadMoreGalleryImages() {
  const masonryGrid = document.getElementById("masonryGrid");
  const collections = ["timeless", "collaborative", "editorial", "campaigns"];

  for (let i = 0; i < 8; i++) {
    const collection =
      collections[Math.floor(Math.random() * collections.length)];
    const item = createMasonryItem(collection, i);
    masonryGrid.appendChild(item);

    // Add click event
    item.addEventListener("click", function () {
      const img = this.querySelector("img");
      const caption = this.querySelector("h3")?.textContent || "";

      currentImages = Array.from(
        document.querySelectorAll(".masonry-item img"),
      );
      currentImageIndex = currentImages.indexOf(img);

      document.getElementById("lightbox").style.display = "block";
      document.getElementById("lightboxImage").src = img.src;
      document.getElementById("lightboxCaption").textContent = caption;
      document.body.style.overflow = "hidden";
    });

    // Animate in
    setTimeout(() => {
      item.style.opacity = "1";
      item.style.transform = "translateY(0)";
    }, i * 50);
  }
}

// Create gallery item
function createGalleryItem(data) {
  const item = document.createElement("div");
  item.className = "gallery-item";
  item.setAttribute("data-category", data.category);
  item.style.opacity = "0";
  item.style.transform = "translateY(20px)";
  item.style.transition = "all 0.5s ease";

  // Select appropriate image based on category
  let imageUrl;
  switch (data.category) {
    case "fashion-week":
      imageUrl = getRandomFashionWeekImage();
      break;
    case "editorial":
      imageUrl = getRandomEditorialImage();
      break;
    case "behind-scenes":
      imageUrl = getRandomBehindScenesImage();
      break;
    case "collection":
      imageUrl = getRandomCollectionImage();
      break;
    case "collaborative":
      imageUrl = getRandomCollaborativeImage();
      break;
    case "magazine":
      imageUrl = getRandomMagazineImage();
      break;
    default:
      imageUrl = getRandomCollectionImage();
  }

  const fallbackImage =
    "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
  item.innerHTML = `
        <img src="${imageUrl}" alt="${data.title}" onerror="this.onerror=null; this.src='${fallbackImage}'">
        <div class="gallery-overlay">
            <div class="gallery-info">
                <h3>${data.title}</h3>
                <p>${data.subtitle}</p>
            </div>
        </div>
    `;

  return item;
}

// Create masonry item
function createMasonryItem(collection, index) {
  const item = document.createElement("div");
  item.className = "masonry-item";
  item.setAttribute("data-collection", collection);
  item.style.opacity = "0";
  item.style.transform = "translateY(20px)";
  item.style.transition = "all 0.5s ease";

  // Select appropriate image based on collection
  let imageUrl;
  switch (collection.toLowerCase()) {
    case "timeless":
      imageUrl = getRandomTimelessImage();
      break;
    case "lingerie":
      imageUrl = getRandomLingerieImage();
      break;
    case "swimwear":
      imageUrl = getRandomSwimwearImage();
      break;
    case "accessories":
      imageUrl = getRandomAccessoriesImage();
      break;
    case "fashion week":
      imageUrl = getRandomFashionWeekImage();
      break;
    default:
      imageUrl = getRandomCollectionImage();
  }

  const fallbackImage =
    "https://res.cloudinary.com/whxy/image/upload/c_fill,f_auto,g_auto:subject,h_800,q_auto,w_800/HANGTAG1_dcne9m?_a=BAMAK+cc0";
  item.innerHTML = `
        <img src="${imageUrl}" alt="${collection}" onerror="this.onerror=null; this.src='${fallbackImage}'">
        <div class="masonry-overlay">
            <div class="masonry-info">
                <h3>${collection} Collection ${index + 1}</h3>
                <p>New Addition</p>
            </div>
        </div>
    `;

  return item;
}

// Category Links
function initializeCategoryLinks() {
  const categoryCards = document.querySelectorAll(".category-card");

  categoryCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      const collection = this.getAttribute("data-collection");

      // Scroll to full gallery
      document
        .getElementById("fullGallery")
        .scrollIntoView({ behavior: "smooth" });

      // Filter by collection
      setTimeout(() => {
        filterByCollection(collection);
      }, 500);
    });
  });
}

function filterByCollection(collection) {
  const items = document.querySelectorAll(".masonry-item");

  items.forEach((item) => {
    if (item.getAttribute("data-collection") === collection) {
      item.style.display = "block";
      setTimeout(() => {
        item.style.opacity = "1";
        item.style.transform = "scale(1)";
      }, 10);
    } else {
      item.style.opacity = "0";
      item.style.transform = "scale(0.8)";
      setTimeout(() => {
        item.style.display = "none";
      }, 300);
    }
  });
}

// Gallery Controls
function initializeGalleryControls() {
  const sortSelect = document.getElementById("gallerySort");
  const viewButtons = document.querySelectorAll(".view-btn");
  const masonryGrid = document.getElementById("masonryGrid");

  // Sort functionality
  sortSelect?.addEventListener("change", function () {
    const value = this.value;
    const items = Array.from(document.querySelectorAll(".masonry-item"));

    // Sort items based on selection
    switch (value) {
      case "newest":
        items.reverse();
        break;
      case "oldest":
        // Default order
        break;
      case "collection":
        items.sort((a, b) => {
          const collectionA = a.getAttribute("data-collection");
          const collectionB = b.getAttribute("data-collection");
          return collectionA.localeCompare(collectionB);
        });
        break;
    }

    // Re-append items in new order
    items.forEach((item) => {
      masonryGrid.appendChild(item);
    });
  });

  // View toggle
  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const view = this.getAttribute("data-view");

      viewButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      if (view === "grid") {
        masonryGrid.classList.remove("list-view");
        masonryGrid.classList.add("masonry-grid");
      } else {
        masonryGrid.classList.remove("masonry-grid");
        masonryGrid.classList.add("list-view");
      }
    });
  });
}

// Video placeholder click handler
document.addEventListener("DOMContentLoaded", function () {
  const videoPlaceholder = document.querySelector(".video-placeholder");

  videoPlaceholder?.addEventListener("click", function () {
    // Replace with actual video embed
    const videoContainer = this.parentElement;
    videoContainer.innerHTML = `
            <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            </iframe>
        `;
  });
});

// Image selection helper functions
function getRandomFashionWeekImage() {
  const fashionWeekImages = [
    "https://jaylataylor.com/content/Paris%20Fashion%20Week%2024%E2%80%99/SHOW4-194.JPEG",
    "https://jaylataylor.com/content/Paris%20Fashion%20Week%2024%E2%80%99/SHOW4-196.JPEG",
    "https://jaylataylor.com/content/Paris%20Fashion%20Week%2024%E2%80%99/SHOW4-199.JPEG",
    "https://jaylataylor.com/content/New%20York%20Fashion%20Week%2023%E2%80%99/DSC06138.jpeg",
    "https://jaylataylor.com/content/New%20York%20Fashion%20Week%2023%E2%80%99/DSC06143.jpeg",
    "https://jaylataylor.com/content/New%20York%20Fashion%20Week%2023%E2%80%99/DSC06220.jpeg",
  ];
  return fashionWeekImages[
    Math.floor(Math.random() * fashionWeekImages.length)
  ];
}

function getRandomEditorialImage() {
  const editorialImages = [
    "https://jaylataylor.com/content/Magazine%20features/IMG_1087.jpg",
    "https://jaylataylor.com/content/Magazine%20features/IMG_3996.JPG",
    "https://jaylataylor.com/content/Magazine%20features/SHOW4-207.JPEG",
    "https://jaylataylor.com/content/Magazine%20features/IMG_8713.PNG",
    "https://jaylataylor.com/content/Magazine%20features/IMG_7442.jpeg",
    "https://jaylataylor.com/content/Magazine%20features/IMG_5888.PNG",
  ];
  return editorialImages[Math.floor(Math.random() * editorialImages.length)];
}

function getRandomBehindScenesImage() {
  const behindScenesImages = [
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_1996.JPG",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_1997.JPG",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_4047.JPG",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_4048.JPG",
    "https://jaylataylor.com/content/New%20York%20Fashion%20Week%2023%E2%80%99/IMG_8044.PNG",
    "https://jaylataylor.com/content/New%20York%20Fashion%20Week%2023%E2%80%99/IMG_8045.PNG",
  ];
  return behindScenesImages[
    Math.floor(Math.random() * behindScenesImages.length)
  ];
}

function getRandomCollectionImage() {
  const collectionImages = [
    "https://jaylataylor.com/content/Timeless%20Collection/AV0A1145_1.jpeg",
    "https://jaylataylor.com/content/Timeless%20Collection/Jayla%20Taylor%20High%20Res%20M44B6112.jpeg",
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM08636.jpeg",
    "https://jaylataylor.com/content/Swim%2024%E2%80%99/IMG_1587.JPG",
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2926.jpeg",
    "https://jaylataylor.com/content/Swim%20Collection%2023%E2%80%99/IMG_0141.JPG",
  ];
  return collectionImages[Math.floor(Math.random() * collectionImages.length)];
}

function getRandomTimelessImage() {
  const timelessImages = [
    "https://jaylataylor.com/content/Timeless%20Collection/AV0A1084_1.jpeg",
    "https://jaylataylor.com/content/Timeless%20Collection/AV0A1098_1.jpeg",
    "https://jaylataylor.com/content/Timeless%20Collection/AV0A1124_1.jpeg",
    "https://jaylataylor.com/content/Timeless%20Collection/AV0A1145_1.jpeg",
    "https://jaylataylor.com/content/Timeless%20Collection/Jayla%20Taylor%20High%20Res%20M44B6112.jpeg",
    "https://jaylataylor.com/content/Timeless%20Collection/Jayla%20Taylor%20High%20Res%20M44B6149.jpeg",
  ];
  return timelessImages[Math.floor(Math.random() * timelessImages.length)];
}

function getRandomLingerieImage() {
  const lingerieImages = [
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM01491.jpeg",
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM01518.jpeg",
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM08636.jpeg",
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM08641.jpeg",
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM08674.jpeg",
    "https://jaylataylor.com/content/Lingerie%20Collection/SJM08773.jpeg",
  ];
  return lingerieImages[Math.floor(Math.random() * lingerieImages.length)];
}

function getRandomSwimwearImage() {
  const swimwearImages = [
    "https://jaylataylor.com/content/Swim%2024%E2%80%99/IMG_1536.JPG",
    "https://jaylataylor.com/content/Swim%2024%E2%80%99/IMG_1587.JPG",
    "https://jaylataylor.com/content/Swim%20Collection%2023%E2%80%99/IMG_0141.JPG",
    "https://jaylataylor.com/content/Swim%20Collection%2023%E2%80%99/IMG_0157.JPG",
    "https://jaylataylor.com/content/Swim%20Collection%2023%E2%80%99/IMG_0177.JPG",
    "https://jaylataylor.com/content/Swim%2024%E2%80%99/IMG_1576.JPG",
  ];
  return swimwearImages[Math.floor(Math.random() * swimwearImages.length)];
}

function getRandomAccessoriesImage() {
  const accessoriesImages = [
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2715.jpeg",
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2822.jpeg",
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2857.jpeg",
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2926.jpeg",
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2944.jpeg",
    "https://jaylataylor.com/content/J-T%20Accessories/IMG_2972.jpeg",
  ];
  return accessoriesImages[
    Math.floor(Math.random() * accessoriesImages.length)
  ];
}

// Expand image pools with more variety
function getRandomCollaborativeImage() {
  const collaborativeImages = [
    "https://jaylataylor.com/content/Collaborative%20Work/229F0CE6-96C9-4F9A-B1E5-CB1BB5FFED69.jpg",
    "https://jaylataylor.com/content/Collaborative%20Work/2D379C91-A9ED-43AC-B3B1-048189993EF0.jpg",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_1996.JPG",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_4047.JPG",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_4553.jpeg",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_7598.JPG",
    "https://jaylataylor.com/content/Collaborative%20Work/IMG_9814.JPG",
  ];
  return collaborativeImages[
    Math.floor(Math.random() * collaborativeImages.length)
  ];
}

function getRandomMagazineImage() {
  const magazineImages = [
    "https://jaylataylor.com/content/Magazine%20features/IMG_1087.jpg",
    "https://jaylataylor.com/content/Magazine%20features/IMG_3996.JPG",
    "https://jaylataylor.com/content/Magazine%20features/SHOW4-207.JPEG",
    "https://jaylataylor.com/content/Magazine%20features/IMG_8713.PNG",
    "https://jaylataylor.com/content/Magazine%20features/IMG_7442.jpeg",
    "https://jaylataylor.com/content/Magazine%20features/IMG_5888.PNG",
  ];
  return magazineImages[Math.floor(Math.random() * magazineImages.length)];
}
