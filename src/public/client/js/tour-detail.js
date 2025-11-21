// Global variables
let currentImageIndex = 0;
let guestCount = 2;
let isWishlisted = false;

// Progress bar on scroll
window.addEventListener("scroll", function () {
  const scrollTop = window.pageYOffset;
  const docHeight = document.body.offsetHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  document.getElementById("progress-bar").style.width = scrollPercent + "%";

  // Show/hide mini tour info in header
  const miniInfo = document.getElementById("mini-tour-info");
  if (scrollTop > 300) {
    miniInfo.classList.remove("hidden");
    document.getElementById("main-header").classList.add("sticky-header");
  } else {
    miniInfo.classList.add("hidden");
    document.getElementById("main-header").classList.remove("sticky-header");
  }
});

// Accordion functionality
function toggleAccordion(id) {
  const element = document.getElementById(id);
  const icon = document.getElementById(id + "-icon");

  if (element.classList.contains("hidden")) {
    element.classList.remove("hidden");
    icon.style.transform = "rotate(180deg)";
  } else {
    element.classList.add("hidden");
    icon.style.transform = "rotate(0deg)";
  }
}

// Guest counter
function changeGuests(change) {
  guestCount = Math.max(1, Math.min(10, guestCount + change));
  document.getElementById("guest-count").textContent = guestCount;
  document.getElementById("modal-guest-count").textContent = guestCount;

  const basePrice = 6390000;
  const totalPrice = (basePrice * guestCount).toLocaleString("vi-VN");
  document.getElementById("total-price").textContent = totalPrice + "đ";
  document.getElementById("modal-total-price").textContent = totalPrice + "đ";
}

// Wishlist functionality
function addToWishlist() {
  isWishlisted = !isWishlisted;
  const icon = document.getElementById("wishlist-icon");
  const text = document.getElementById("wishlist-text");

  if (isWishlisted) {
    icon.textContent = "❤️";
    text.textContent = "Đã yêu thích";
    showNotification("Đã thêm vào danh sách yêu thích! 💖", "success");
  } else {
    icon.textContent = "🤍";
    text.textContent = "Yêu thích";
    showNotification("Đã xóa khỏi danh sách yêu thích", "info");
  }
}

// Lightbox functionality
function openLightbox(index) {
  currentImageIndex = index;
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");

  img.src = images[index].src;
  img.alt = images[index].caption;
  caption.textContent = images[index].caption;
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  openLightbox(currentImageIndex);
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  openLightbox(currentImageIndex);
}

// Modal functionality
function openBookingModal() {
  document.getElementById("booking-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function openContactModal() {
  document.getElementById("contact-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeContactModal() {
  document.getElementById("contact-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

// Form submission
function submitBooking(event) {
  event.preventDefault();

  const name = document.getElementById("customer-name").value;
  const phone = document.getElementById("customer-phone").value;
  const email = document.getElementById("customer-email").value;
  const date = document.getElementById("departure-date").value;

  if (name && phone && email && date) {
    showNotification(
      `Cảm ơn ${name}! Chúng tôi sẽ liên hệ với bạn trong 24h để xác nhận đặt tour. 🎉`,
      "success"
    );
    closeBookingModal();

    // Reset form
    document.getElementById("customer-name").value = "";
    document.getElementById("customer-phone").value = "";
    document.getElementById("customer-email").value = "";
    document.getElementById("departure-date").value = "";
  }
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  notification.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in max-w-sm`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Calendar interaction
document.querySelectorAll(".calendar-day").forEach((day) => {
  day.addEventListener("click", function () {
    if (
      this.classList.contains("bg-blue-500") ||
      this.classList.contains("bg-orange-500")
    ) {
      const price = this.querySelector(".text-xs")?.textContent || "";
      const date = this.querySelector(".font-semibold")?.textContent || "";

      // Remove previous selections
      document.querySelectorAll(".calendar-day").forEach((d) => {
        d.classList.remove("ring-4", "ring-yellow-400");
      });

      // Add selection ring
      this.classList.add("ring-4", "ring-yellow-400");

      showNotification(`Đã chọn ngày ${date} - Giá: ${price} 📅`, "success");
    }
  });
});

// Keyboard navigation for lightbox
document.addEventListener("keydown", function (e) {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox.classList.contains("hidden")) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "ArrowRight") nextImage();
  }
});

// Close modals when clicking outside
document.addEventListener("click", function (e) {
  const bookingModal = document.getElementById("booking-modal");
  const contactModal = document.getElementById("contact-modal");
  const lightbox = document.getElementById("lightbox");

  if (e.target === bookingModal) closeBookingModal();
  if (e.target === contactModal) closeContactModal();
  if (e.target === lightbox) closeLightbox();
});

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Show welcome message
  setTimeout(() => {
    showNotification("Chào mừng bạn đến với VietTravel! 🌏", "info");
  }, 1000);

  // Initialize guest count display
  changeGuests(0);
});
