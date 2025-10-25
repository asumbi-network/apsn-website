// List of images in the folder (update automatically via sync)
const images = [
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0006.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0007.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0008.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0009.jpg",
  "drive_backup/Events/Photos & Media/2025_Test/IMG-20251025-WA0010.jpg"
];

const container = document.getElementById("slideshow");
images.forEach(src => {
  const img = document.createElement("img");
  img.src = src;
  container.appendChild(img);
});

let currentIndex = 0;
const slides = container.querySelectorAll("img");

function showSlide(index) {
  slides.forEach((img, i) => img.style.display = i === index ? "block" : "none");
}

// Initial display
showSlide(currentIndex);

// Auto-play every 3 seconds
setInterval(() => {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}, 3000);
