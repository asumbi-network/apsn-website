const images = [
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0006.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0007.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0008.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0009.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0006.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0007.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0008.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0009.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA00010.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20250929-WA0004.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20250930-WA00025.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20250930-WA00027.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251001-WA0003.jpg"
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251015-WA0036.jpg"  
];

const container = document.getElementById("slideshow");
const dotsContainer = document.getElementById("slideshow-dots");

// Add images
images.forEach((src) => {
  const img = document.createElement("img");
  img.src = src;
  container.insertBefore(img, dotsContainer);
});

// Add dots
images.forEach((_, index) => {
  const dot = document.createElement("span");
  dot.addEventListener("click", () => {
    currentIndex = index;
    showSlide(currentIndex);
    resetInterval();
  });
  dotsContainer.appendChild(dot);
});

let slides = container.querySelectorAll("img");
let dots = dotsContainer.querySelectorAll("span");
let currentIndex = 0;

function showSlide(index) {
  slides.forEach((img, i) => img.style.display = i === index ? "block" : "none");
  dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}

let slideInterval = setInterval(nextSlide, 3000);
function resetInterval() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 3000);
}

showSlide(currentIndex);
