// List of images
const images = [
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0006.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0007.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0008.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0009.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0010.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20250929-WA0004.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20250930-WA0025.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20250930-WA0027.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251001-WA0003.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251015-WA0036.jpg"
];

// Get DOM elements
const container = document.getElementById("slideshow");
const dotsContainer = document.getElementById("slideshow-dots");

let currentIndex = 0;
let slideInterval;

// Helper to encode spaces in file paths
function encodePath(path) {
  return path.replace(/ /g, "%20");
}

// Add images to container
images.forEach(src => {
  const img = document.createElement("img");
  img.src = encodePath(src);
  img.style.display = "none"; // hide initially
  container.appendChild(img);
});

// Add dots
images.forEach((_, index) => {
  const dot = document.createElement("span");
  dot.classList.add("dot"); // optional for styling
  dot.addEventListener("click", () => {
    currentIndex = index;
    showSlide(currentIndex);
    resetInterval();
  });
  dotsContainer.appendChild(dot);
});

// Query slides and dots after creation
let slides = container.querySelectorAll("img");
let dots = dotsContainer.querySelectorAll("span");

// Show a specific slide
function showSlide(index) {
  slides.forEach((img, i) => img.style.display = i === index ? "block" : "none");
  dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
}

// Move to next slide
function nextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}

// Reset interval on manual change
function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 3000);
}

// Start slideshow
showSlide(currentIndex);
slideInterval = setInterval(nextSlide, 3000);
