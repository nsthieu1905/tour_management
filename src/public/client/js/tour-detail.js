// Global variables
let currentImageIndex = 0;
let guestCount = 2;
let isWishlisted = false;
let currentMonthDisplay = null; // Track current month in calendar display
let departureDates = []; // Will be populated from template

// Initialize departure dates from tour data (populated by template)
function initializeDepartureDates() {
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) {
    console.warn("calendar-grid not found");
    return;
  }

  let departureDatesData = calendarGrid.dataset.departures;

  // Try to parse data attribute
  if (!departureDatesData) {
    console.warn("No departure dates data attribute found");
    return;
  }

  try {
    let parsed = JSON.parse(departureDatesData);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn("Departure dates is not a valid array");
      return;
    }

    // Normalize data - handle both cases:
    // 1. Array of date strings: ["2025-12-07", "2025-12-10"]
    // 2. Array of objects: [{date: "2025-12-07", price: 5390000}]
    departureDates = parsed
      .map((item, idx) => {
        if (typeof item === "string") {
          // Case 1: date string only
          return {
            date: item,
            price: 0, // Will show 0K
          };
        } else if (typeof item === "object" && item.date) {
          // Case 2: object with date and price
          return {
            date: item.date,
            price: item.price || 0,
          };
        }
        return null;
      })
      .filter((d) => d !== null);

    if (departureDates.length === 0) {
      console.warn("No valid departure dates after normalization");
      return;
    }

    // Get unique months
    const uniqueMonths = [];
    const seenMonths = new Set();

    departureDates.forEach((dept) => {
      const date = new Date(dept.date);
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dept.date);
        return;
      }

      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthKey = `${month}/${year}`;

      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        uniqueMonths.push({
          monthKey,
          date,
          label: `Tháng ${month}/${year}`,
        });
      }
    });

    if (uniqueMonths.length === 0) {
      console.warn("No valid months found");
      return;
    }

    // Render month picker
    renderMonthPicker(uniqueMonths);

    // Set first month as default
    currentMonthDisplay = {
      month: uniqueMonths[0].date.getMonth(),
      year: uniqueMonths[0].date.getFullYear(),
    };
    renderCalendar();
  } catch (error) {
    console.error(error);
  }
} // Render month picker buttons
function renderMonthPicker(months) {
  const monthList = document.getElementById("month-list");
  if (!monthList) return;

  monthList.innerHTML = "";

  months.forEach((monthData, index) => {
    const btn = document.createElement("button");
    btn.className = `month-picker-btn w-full text-left px-4 py-3 rounded-lg border-2 transition duration-200 ${
      index === 0
        ? "border-blue-500 bg-blue-50"
        : "border-gray-300 hover:border-blue-500"
    }`;
    btn.textContent = monthData.label;
    btn.setAttribute("data-month", monthData.monthKey);
    btn.onclick = () => selectMonth(monthData.monthKey);

    monthList.appendChild(btn);
  });
}

// Render calendar for current month
function renderCalendar() {
  if (!currentMonthDisplay) return;

  const calendarGrid = document.getElementById("calendar-grid");
  calendarGrid.innerHTML = "";

  const { month, year } = currentMonthDisplay;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

  // Update month title
  const monthTitle = document.getElementById("current-month");
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  monthTitle.textContent = `${monthNames[month]}/${year}`;

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "text-center py-3 text-gray-400";
    calendarGrid.appendChild(emptyCell);
  }

  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    // Find departure for this day
    // Handle different date formats: ISO string or plain date string
    const departure = departureDates.find((d) => {
      const dDate = new Date(d.date);
      const dDateStr = `${dDate.getUTCFullYear()}-${String(
        dDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(dDate.getUTCDate()).padStart(2, "0")}`;
      return dDateStr === dateStr;
    });

    const dayCell = document.createElement("div");

    if (departure) {
      dayCell.className =
        "bg-blue-500 text-white rounded-lg py-3 text-center cursor-pointer hover:bg-blue-600 transition duration-200";
      const priceDisplay =
        departure.price > 0
          ? `<div class="text-xs">${formatPrice(departure.price)}</div>`
          : "";
      dayCell.innerHTML = `
        <div class="font-semibold">${day}</div>
        ${priceDisplay}
      `;
      dayCell.onclick = () => selectDepartureDate(departure);
    } else {
      dayCell.className = "text-center py-3 text-gray-400";
      dayCell.textContent = day;
    }

    calendarGrid.appendChild(dayCell);
  }
}

// Format price to K
function formatPrice(price) {
  if (!price) return "0";
  return (Math.floor(price / 1000) + "k").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Select departure month
function selectMonth(monthYear) {
  const [month, year] = monthYear.split("/");
  currentMonthDisplay = {
    month: parseInt(month) - 1,
    year: parseInt(year),
  };

  // Update active button
  document.querySelectorAll(".month-picker-btn").forEach((btn) => {
    btn.classList.remove("border-blue-500", "bg-blue-50");
    btn.classList.add("border-gray-300");
    if (btn.dataset.month === monthYear) {
      btn.classList.add("border-blue-500", "bg-blue-50");
      btn.classList.remove("border-gray-300");
    }
  });

  renderCalendar();
}

// Navigate months
function prevMonth() {
  if (!currentMonthDisplay) return;
  if (currentMonthDisplay.month === 0) {
    currentMonthDisplay.month = 11;
    currentMonthDisplay.year--;
  } else {
    currentMonthDisplay.month--;
  }

  // Update active month button
  updateActiveMonthButton();
  renderCalendar();
}

function nextMonth() {
  if (!currentMonthDisplay) return;
  if (currentMonthDisplay.month === 11) {
    currentMonthDisplay.month = 0;
    currentMonthDisplay.year++;
  } else {
    currentMonthDisplay.month++;
  }

  // Update active month button
  updateActiveMonthButton();
  renderCalendar();
}

// Update active month button highlight
function updateActiveMonthButton() {
  const month = currentMonthDisplay.month + 1;
  const year = currentMonthDisplay.year;
  const monthKey = `${month}/${year}`;

  document.querySelectorAll(".month-picker-btn").forEach((btn) => {
    btn.classList.remove("border-blue-500", "bg-blue-50");
    btn.classList.add("border-gray-300");
    if (btn.dataset.month === monthKey) {
      btn.classList.add("border-blue-500", "bg-blue-50");
      btn.classList.remove("border-gray-300");
    }
  });
}

// Select departure date
function selectDepartureDate(departure) {
  console.log("Selected departure:", departure);
  // Store selected date and show in booking form if needed
  localStorage.setItem("selectedDepartureDate", JSON.stringify(departure));
}

// Initialize page - populate lightbox thumbnails
function initializeLightboxThumbnails() {
  const container = document.getElementById("lightbox-thumbnails");
  if (!container || !images || images.length === 0) return;

  container.innerHTML = ""; // Clear placeholder

  images.forEach((image, idx) => {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.caption;
    img.className =
      "h-20 w-24 object-cover rounded cursor-pointer hover:opacity-75 transition duration-200 border-2 border-white flex-shrink-0 lightbox-thumb";
    img.setAttribute("data-original-index", idx);
    img.onclick = (e) => {
      e.stopPropagation();
      openLightbox(idx);
    };
    container.appendChild(img);
  });
}

// Initialize calendar on page load
// (handled in DOMContentLoaded event below)

// Keyboard navigation for lightbox
document.addEventListener("keydown", function (event) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox.classList.contains("hidden")) return;

  if (event.key === "ArrowRight") {
    nextImage();
  } else if (event.key === "ArrowLeft") {
    prevImage();
  } else if (event.key === "Escape") {
    closeLightbox();
  }
});

// Progress bar on scroll
window.addEventListener("scroll", function () {
  const progressBar = document.getElementById("progress-bar");
  if (!progressBar) return; // Skip if progress bar doesn't exist

  const scrollTop = window.pageYOffset;
  const docHeight = document.body.offsetHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrollPercent + "%";

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

// Initialize wishlist - check if tour is already favorited
async function initializeWishlist() {
  try {
    // Get tour ID from button
    const btn = document.querySelector('[onclick*="addToWishlist"]');
    if (!btn) return;

    // Extract tour ID from onclick attribute
    const onclickAttr = btn.getAttribute("onclick");
    const tourIdMatch = onclickAttr.match(/addToWishlist\('([^']+)'\)/);
    if (!tourIdMatch) return;

    const tourId = tourIdMatch[1];

    // Check if tour is favorited
    const isFavorited = await favoriteHelper.checkIsFavorited(tourId);

    if (isFavorited) {
      isWishlisted = true;
      const icon = document.getElementById("wishlist-icon");
      const text = document.getElementById("wishlist-text");

      if (icon && text) {
        icon.setAttribute("fill", "currentColor");
        icon.setAttribute("stroke", "currentColor");
        icon.classList.add("text-red-500");
        icon.classList.remove("text-gray-600");
        text.textContent = "Đã yêu thích";
      }
    }
  } catch (error) {
    console.error("Initialize wishlist error:", error);
  }
}

// Wishlist functionality
function addToWishlist(tourId) {
  // Toggle favorite via API
  favoriteHelper
    .toggleFavorite(tourId)
    .then((result) => {
      const icon = document.getElementById("wishlist-icon");
      const text = document.getElementById("wishlist-text");

      if (result.success) {
        isWishlisted = result.isFavorited;

        if (isWishlisted) {
          // Fill the heart with red color
          icon.setAttribute("fill", "currentColor");
          icon.setAttribute("stroke", "currentColor");
          icon.classList.add("text-red-500");
          icon.classList.remove("text-gray-600");
          text.textContent = "Đã yêu thích";
          showNotification("Đã thêm vào danh sách yêu thích! 💖", "success");
        } else {
          // Outline heart with gray color
          icon.setAttribute("fill", "none");
          icon.setAttribute("stroke", "currentColor");
          icon.classList.remove("text-red-500");
          icon.classList.add("text-gray-600");
          text.textContent = "Yêu thích";
          showNotification("Đã xóa khỏi danh sách yêu thích", "info");
        }
      } else {
        showNotification("Lỗi: " + result.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error toggling favorite:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích", "error");
    });
}

// Lightbox functionality
function openLightbox(index) {
  // Ensure index is valid
  if (!images || index < 0 || index >= images.length) return;

  currentImageIndex = index;
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Update display
  updateLightboxDisplay();
}

function closeLightbox() {
  document.getElementById("lightbox").classList.add("hidden");
  document.body.style.overflow = "auto";
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  updateLightboxDisplay();
}

function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  updateLightboxDisplay();
}

function updateLightboxDisplay() {
  if (!images || !images[currentImageIndex]) return;

  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  const counter = document.getElementById("lightbox-counter");

  img.src = images[currentImageIndex].src;
  img.alt = images[currentImageIndex].caption;
  caption.textContent = images[currentImageIndex].caption;
  counter.textContent = currentImageIndex + 1 + " / " + images.length;

  // Highlight active thumbnail
  const allThumbs = document.querySelectorAll(".lightbox-thumb");
  allThumbs.forEach((thumb, idx) => {
    if (idx === currentImageIndex) {
      thumb.classList.add("ring-2", "ring-yellow-400");
    } else {
      thumb.classList.remove("ring-2", "ring-yellow-400");
    }
  });

  // Scroll thumbnail into view
  if (allThumbs.length > currentImageIndex) {
    allThumbs[currentImageIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }
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
  initializeDepartureDates();
  initializeLightboxThumbnails();
  initializeWishlist(); // Check if tour is already favorited

  // Show welcome message
  setTimeout(() => {
    showNotification("Chào mừng bạn đến với VietTravel! 🌏", "info");
  }, 1000);

  // Initialize guest count display
  changeGuests(0);
});
