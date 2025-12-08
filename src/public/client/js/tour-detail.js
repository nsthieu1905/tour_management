// Global variables
let currentImageIndex = 0; // Index ảnh hiện tại trong lightbox
let guestCount = 1; // Số lượng khách (mặc định 1)
let isWishlisted = false; // Trạng thái yêu thích của tour
let currentMonthDisplay = null; // Tháng đang hiển thị tron lịch
let departureDates = []; // Danh sách ngày khởi hành từ server
let selectedDeparture = null; // Ngày khởi hành được chọn {date, price}
let appliedCoupon = null; // Coupon được áp dụng {couponCode, discountAmount, finalPrice}

// ============================================
// KHỞI TẠO NGÀY KHỞI HÀNH
// ============================================
/**
 * Khởi tạo danh sách ngày khởi hành từ data attribute
 * - Đọc dữ liệu từ #calendar-grid data-departures
 * - Parse JSON và chuẩn hóa format
 * - Render month picker và calendar
 */
function initializeDepartureDates() {
  const calendarGrid = document.getElementById("calendar-grid");
  if (!calendarGrid) {
    console.warn("Không tìm thấy calendar-grid");
    return;
  }

  let departureDatesData = calendarGrid.dataset.departures;

  // Kiểm tra data attribute có tồn tại không
  if (!departureDatesData) {
    console.warn("Không tìm thấy dữ liệu ngày khởi hành");
    return;
  }

  try {
    let parsed = JSON.parse(departureDatesData);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn("Dữ liệu ngày khởi hành không hợp lệ");
      return;
    }

    // Chuẩn hóa dữ liệu - xử lý 2 trường hợp:
    // 1. Mảng string: ["2025-12-07", "2025-12-10"]
    // 2. Mảng object: [{date: "2025-12-07", price: 5390000}]
    departureDates = parsed
      .map((item, idx) => {
        if (typeof item === "string") {
          // Trường hợp 1: chỉ có ngày
          return {
            date: item,
            price: 0, // Hiển thị 0K
          };
        } else if (typeof item === "object" && item.date) {
          // Trường hợp 2: có cả ngày và giá
          return {
            date: item.date,
            price: item.price || 0,
          };
        }
        return null;
      })
      .filter((d) => d !== null);

    if (departureDates.length === 0) {
      console.warn("Không có ngày khởi hành hợp lệ sau khi chuẩn hóa");
      return;
    }

    // Lấy danh sách các tháng duy nhất từ ngày khởi hành
    const uniqueMonths = [];
    const seenMonths = new Set();

    departureDates.forEach((dept) => {
      const date = new Date(dept.date);
      if (isNaN(date.getTime())) {
        console.warn("Ngày không hợp lệ:", dept.date);
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
      console.warn("Không tìm thấy tháng hợp lệ");
      return;
    }

    // Render danh sách tháng
    renderMonthPicker(uniqueMonths);

    // Đặt tháng đầu tiên làm mặc định
    currentMonthDisplay = {
      month: uniqueMonths[0].date.getMonth(),
      year: uniqueMonths[0].date.getFullYear(),
    };
    renderCalendar();
  } catch (error) {
    console.error("Lỗi khởi tạo ngày khởi hành:", error);
  }
}

// ============================================
// RENDER MONTH PICKER
// ============================================
/**
 * Render danh sách các nút chọn tháng
 * @param {Array} months - Mảng các tháng duy nhất [{monthKey, date, label}]
 */
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

// ============================================
// RENDER CALENDAR
// ============================================
/**
 * Render lịch cho tháng hiện tại
 * - Tạo lưới lịch với các ngày trong tháng
 * - Highlight các ngày có tour khởi hành
 * - Hiển thị giá trên từng ngày
 */
function renderCalendar() {
  if (!currentMonthDisplay) return;

  const calendarGrid = document.getElementById("calendar-grid");
  calendarGrid.innerHTML = "";

  const { month, year } = currentMonthDisplay;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Thứ 2 = 0

  // Cập nhật tiêu đề tháng
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

  // Thêm ô trống cho các ngày trước khi tháng bắt đầu
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "text-center py-3 text-gray-400";
    calendarGrid.appendChild(emptyCell);
  }

  // Thêm các ô ngày trong tháng
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    // Tìm ngày khởi hành cho ngày này
    // Xử lý nhiều format ngày: ISO string hoặc plain date string
    const departure = departureDates.find((d) => {
      const dDate = new Date(d.date);
      const dDateStr = `${dDate.getUTCFullYear()}-${String(
        dDate.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(dDate.getUTCDate()).padStart(2, "0")}`;
      return dDateStr === dateStr;
    });

    const dayCell = document.createElement("div");

    if (departure) {
      // Ngày có tour khởi hành
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
      // Ngày không có tour
      dayCell.className = "text-center py-3 text-gray-400";
      dayCell.textContent = day;
    }

    calendarGrid.appendChild(dayCell);
  }
}

// ============================================
// FORMAT PRICE
// ============================================
/**
 * Format giá tiền thành dạng "K" (ngàn)
 * @param {Number} price - Giá tiền
 * @returns {String} - Giá đã format (vd: "5.390k")
 */
function formatPrice(price) {
  if (!price) return "0";
  return (Math.floor(price / 1000) + "k").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ============================================
// SELECT MONTH
// ============================================
/**
 * Chọn tháng để hiển thị trên lịch
 * @param {String} monthYear - Tháng/năm dạng "12/2025"
 */
function selectMonth(monthYear) {
  const [month, year] = monthYear.split("/");
  currentMonthDisplay = {
    month: parseInt(month) - 1,
    year: parseInt(year),
  };

  // Cập nhật nút active
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

// ============================================
// ĐIỀU HƯỚNG THÁNG
// ============================================
/**
 * Chuyển sang tháng trước
 */
function prevMonth() {
  if (!currentMonthDisplay) return;
  if (currentMonthDisplay.month === 0) {
    currentMonthDisplay.month = 11;
    currentMonthDisplay.year--;
  } else {
    currentMonthDisplay.month--;
  }

  updateActiveMonthButton();
  renderCalendar();
}

/**
 * Chuyển sang tháng sau
 */
function nextMonth() {
  if (!currentMonthDisplay) return;
  if (currentMonthDisplay.month === 11) {
    currentMonthDisplay.month = 0;
    currentMonthDisplay.year++;
  } else {
    currentMonthDisplay.month++;
  }

  updateActiveMonthButton();
  renderCalendar();
}

/**
 * Cập nhật highlight cho nút tháng đang active
 */
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

// ============================================
// SELECT DEPARTURE DATE
// ============================================
/**
 * Chọn ngày khởi hành
 * @param {Object} departure - Thông tin ngày khởi hành {date, price}
 */
function selectDepartureDate(departure) {
  console.log("Đã chọn ngày khởi hành:", departure);
  // Lưu ngày đã chọn vào global variable và localStorage
  selectedDeparture = departure;
  localStorage.setItem("selectedDepartureDate", JSON.stringify(departure));

  // Cập nhật lại tổng giá với giá của ngày được chọn
  changeGuests(0);
}

// ============================================
// KHỞI TẠO DROPDOWN NGÀY KHỞI HÀNH
// ============================================
/**
 * Khởi tạo dropdown "Ngày khởi hành" trong modal đặt tour
 * - Populate dropdown từ departureDates
 * - Format: "DD/MM/YYYY - GIÁ VND"
 * - Lưu giá vào data attribute của option
 */
function initializeDepartureDateDropdown() {
  const dropdown = document.getElementById("departure-date");
  if (!dropdown || departureDates.length === 0) return;

  departureDates.forEach((dept) => {
    const date = new Date(dept.date);
    if (isNaN(date.getTime())) return;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    const priceDisplay =
      dept.price > 0 ? ` - ${dept.price.toLocaleString("vi-VN")}đ` : "";

    const option = document.createElement("option");
    option.value = dept.date;
    option.textContent = `${dateStr}${priceDisplay}`;
    option.setAttribute("data-price", dept.price);
    dropdown.appendChild(option);
  });

  // Xử lý sự kiện thay đổi dropdown
  dropdown.addEventListener("change", function () {
    if (this.value) {
      const selectedOption = this.options[this.selectedIndex];
      const price = parseInt(selectedOption.getAttribute("data-price"), 10);
      const date = this.value;

      // Cập nhật selectedDeparture
      selectedDeparture = { date, price };

      // Cập nhật tổng giá
      changeGuests(0);
    }
  });
}

// ============================================
// KHỞI TẠO LIGHTBOX THUMBNAILS
// ============================================
/**
 * Khởi tạo các thumbnail ảnh trong lightbox
 * - Tạo danh sách ảnh nhỏ dưới lightbox
 * - Gắn sự kiện click để mở ảnh tương ứng
 */
function initializeLightboxThumbnails() {
  const container = document.getElementById("lightbox-thumbnails");
  if (!container || !images || images.length === 0) return;

  container.innerHTML = ""; // Xóa placeholder

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

// ============================================
// KEYBOARD NAVIGATION (LIGHTBOX)
// ============================================
// Điều khiển lightbox bằng phím
document.addEventListener("keydown", function (event) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox.classList.contains("hidden")) return;

  if (event.key === "ArrowRight") {
    nextImage(); // Mũi tên phải
  } else if (event.key === "ArrowLeft") {
    prevImage(); // Mũi tên trái
  } else if (event.key === "Escape") {
    closeLightbox(); // ESC đóng lightbox
  }
});

// ============================================
// PROGRESS BAR ON SCROLL
// ============================================
/**
 * Cập nhật thanh tiến độ khi scroll trang
 * - Tính % scroll
 * - Hiển thị/ẩn mini tour info trong header
 */
window.addEventListener("scroll", function () {
  const progressBar = document.getElementById("progress-bar");
  if (!progressBar) return;

  const scrollTop = window.pageYOffset;
  const docHeight = document.body.offsetHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;
  progressBar.style.width = scrollPercent + "%";

  // Hiển thị/ẩn thông tin tour mini trong header
  const miniInfo = document.getElementById("mini-tour-info");
  if (scrollTop > 300) {
    miniInfo.classList.remove("hidden");
    document.getElementById("main-header").classList.add("sticky-header");
  } else {
    miniInfo.classList.add("hidden");
    document.getElementById("main-header").classList.remove("sticky-header");
  }
});

// ============================================
// ACCORDION FUNCTIONALITY
// ============================================
/**
 * Bật/tắt accordion (mở rộng/thu gọn)
 * @param {String} id - ID của element accordion
 */
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

// ============================================
// GUEST COUNTER
// ============================================
/**
 * Thay đổi số lượng khách
 * @param {Number} change - Số lượng thay đổi (+1 hoặc -1)
 */
function changeGuests(change) {
  guestCount = Math.max(1, Math.min(10, guestCount + change));
  document.getElementById("guest-count").textContent = guestCount;
  document.getElementById("modal-guest-count").textContent = guestCount;

  // Lấy giá: ưu tiên giá ngày khởi hành được chọn, nếu không thì lấy giá mặc định của tour
  let basePrice = 0;

  if (selectedDeparture && selectedDeparture.price > 0) {
    // Sử dụng giá của ngày khởi hành được chọn
    basePrice = selectedDeparture.price;
  } else {
    // Fallback: lấy giá gốc từ #original-price element
    const priceElement = document.getElementById("original-price");
    if (priceElement) {
      basePrice = parseInt(priceElement.textContent.replace(/\D/g, ""), 10);
    }
  }

  if (isNaN(basePrice) || basePrice === 0) {
    console.warn("Không thể lấy giá tour");
    return;
  }

  // Tính tổng giá trước coupon
  const totalBeforeCoupon = basePrice * guestCount;

  // Tính giá cuối cùng sau coupon
  let finalPrice = totalBeforeCoupon;
  if (appliedCoupon) {
    // Coupon đã lưu giá discount cho 1 khách, nhân với số khách
    finalPrice = totalBeforeCoupon - appliedCoupon.discountAmount * guestCount;
    finalPrice = Math.max(0, finalPrice);
  }

  // Cập nhật hiển thị
  document.getElementById("modal-guest-count").textContent = guestCount;
  document.getElementById("guest-count").textContent = guestCount;

  // Update cả 2 chỗ hiển thị tổng giá (detail + modal)
  const priceDisplay = finalPrice.toLocaleString("vi-VN") + "đ";
  const totalPriceEl = document.getElementById("total-price");
  if (totalPriceEl) totalPriceEl.textContent = priceDisplay;

  const modalTotalPriceEl = document.getElementById("modal-total-price");
  if (modalTotalPriceEl) modalTotalPriceEl.textContent = priceDisplay;

  // Hiển thị/ẩn discount info
  if (appliedCoupon) {
    document.getElementById("original-total").classList.remove("hidden");
    document.getElementById("discount-info").classList.remove("hidden");
    document.getElementById("original-total-price").textContent =
      totalBeforeCoupon.toLocaleString("vi-VN") + "đ";
    document.getElementById("discount-amount").textContent =
      (appliedCoupon.discountAmount * guestCount).toLocaleString("vi-VN") + "đ";
  } else {
    document.getElementById("original-total").classList.add("hidden");
    document.getElementById("discount-info").classList.add("hidden");
  }
}

// ============================================
// INITIALIZE WISHLIST
// ============================================
/**
 * Khởi tạo trạng thái yêu thích
 * - Kiểm tra tour đã được yêu thích chưa
 * - Cập nhật UI (icon trái tim)
 */
async function initializeWishlist() {
  try {
    // Lấy tour ID từ button
    const btn = document.querySelector('[onclick*="addToWishlist"]');
    if (!btn) return;

    // Extract tour ID từ onclick attribute
    const onclickAttr = btn.getAttribute("onclick");
    const tourIdMatch = onclickAttr.match(/addToWishlist\('([^']+)'\)/);
    if (!tourIdMatch) return;

    const tourId = tourIdMatch[1];

    // Kiểm tra tour đã được yêu thích chưa
    const isFavorited = await favoriteHelper.checkIsFavorited(tourId);

    if (isFavorited) {
      isWishlisted = true;
      const icon = document.getElementById("wishlist-icon");
      const text = document.getElementById("wishlist-text");

      if (icon && text) {
        // Tô đỏ trái tim
        icon.setAttribute("fill", "currentColor");
        icon.setAttribute("stroke", "currentColor");
        icon.classList.add("text-red-500");
        icon.classList.remove("text-gray-600");
        text.textContent = "Đã yêu thích";
      }
    }
  } catch (error) {
    console.error("Lỗi khởi tạo wishlist:", error);
  }
}

// ============================================
// APPLY COUPON CODE
// ============================================
/**
 * Áp dụng mã coupon
 */
async function applyCouponCode() {
  const couponInput = document.getElementById("coupon-code");
  const couponCode = couponInput.value.trim().toUpperCase();
  const messageEl = document.getElementById("coupon-message");

  if (!couponCode) {
    messageEl.classList.remove("hidden", "text-green-600");
    messageEl.classList.add("text-red-600");
    messageEl.textContent = "Vui lòng nhập mã giảm giá";
    return;
  }

  // Lấy tour ID
  const tourIdBtn = document.querySelector('[onclick*="addToWishlist"]');
  if (!tourIdBtn) {
    messageEl.classList.remove("hidden", "text-green-600");
    messageEl.classList.add("text-red-600");
    messageEl.textContent = "Không tìm thấy thông tin tour";
    return;
  }

  const onclickAttr = tourIdBtn.getAttribute("onclick");
  const tourIdMatch = onclickAttr.match(/addToWishlist\('([^']+)'\)/);
  if (!tourIdMatch) {
    messageEl.classList.remove("hidden", "text-green-600");
    messageEl.classList.add("text-red-600");
    messageEl.textContent = "Không tìm thấy thông tin tour";
    return;
  }

  const tourId = tourIdMatch[1];

  // Lấy giá gốc (không coupon)
  let basePrice = 0;
  if (selectedDeparture && selectedDeparture.price > 0) {
    basePrice = selectedDeparture.price;
  } else {
    const priceElement = document.getElementById("original-price");
    if (priceElement) {
      basePrice = parseInt(priceElement.textContent.replace(/\D/g, ""), 10);
    }
  }

  if (basePrice === 0) {
    messageEl.classList.remove("hidden", "text-green-600");
    messageEl.classList.add("text-red-600");
    messageEl.textContent = "Vui lòng chọn ngày khởi hành trước";
    return;
  }

  try {
    const response = await fetch("/api/coupons/applyCoupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        couponCode: couponCode,
        tourId: tourId,
        originalPrice: basePrice,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Lưu coupon thành công
      appliedCoupon = {
        couponCode: result.data.couponCode,
        couponName: result.data.couponName,
        discountAmount: Math.floor(result.data.discountAmount / guestCount), // Lưu discount per guest
        savings: result.data.savings,
      };

      messageEl.classList.remove("hidden", "text-red-600");
      messageEl.classList.add("text-green-600");
      messageEl.textContent = `✓ Áp dụng mã ${
        result.data.couponCode
      } thành công! Tiết kiệm ${result.data.savings.toLocaleString("vi-VN")}đ`;

      // Cập nhật hiển thị giá
      changeGuests(0);

      // Disable nút áp dụng
      document.getElementById("apply-coupon-btn").disabled = true;
      document.getElementById("apply-coupon-btn").classList.add("opacity-50");
    } else {
      messageEl.classList.remove("hidden", "text-green-600");
      messageEl.classList.add("text-red-600");
      messageEl.textContent = result.message || "Không thể áp dụng mã này";
    }
  } catch (error) {
    console.error("Lỗi apply coupon:", error);
    messageEl.classList.remove("hidden", "text-green-600");
    messageEl.classList.add("text-red-600");
    messageEl.textContent = "Có lỗi xảy ra. Vui lòng thử lại";
  }
}

// ============================================
// RESET BOOKING FORM
// ============================================
/**
 * Reset form đặt tour khi đóng modal
 */
function resetBookingForm() {
  // Reset input fields
  document.getElementById("customer-name").value = "";
  document.getElementById("customer-phone").value = "";
  document.getElementById("customer-email").value = "";
  document.getElementById("departure-date").value = "";
  document.getElementById("coupon-code").value = "";

  // Reset coupon
  appliedCoupon = null;
  const messageEl = document.getElementById("coupon-message");
  if (messageEl) {
    messageEl.classList.add("hidden");
    messageEl.textContent = "";
  }

  // Enable nút áp dụng coupon
  const applyBtn = document.getElementById("apply-coupon-btn");
  if (applyBtn) {
    applyBtn.disabled = false;
    applyBtn.classList.remove("opacity-50");
  }

  // Reset guest count
  guestCount = 1;
  changeGuests(0);

  // Reset departure date
  selectedDeparture = null;
}

// ============================================
// WISHLIST FUNCTIONALITY
// ============================================
/**
 * Thêm/xóa tour khỏi danh sách yêu thích
 * @param {String} tourId - ID của tour
 */
function addToWishlist(tourId) {
  // Toggle favorite qua API
  favoriteHelper
    .toggleFavorite(tourId)
    .then((result) => {
      const icon = document.getElementById("wishlist-icon");
      const text = document.getElementById("wishlist-text");

      if (result.success) {
        isWishlisted = result.isFavorited;

        if (isWishlisted) {
          // Tô đỏ trái tim (đã yêu thích)
          icon.setAttribute("fill", "currentColor");
          icon.setAttribute("stroke", "currentColor");
          icon.classList.add("text-red-500");
          icon.classList.remove("text-gray-600");
          text.textContent = "Đã yêu thích";
          showNotification("Đã thêm vào danh sách yêu thích! 💖", "success");
        } else {
          // Outline trái tim (chưa yêu thích)
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
      console.error("Lỗi toggle favorite:", error);
      showNotification("Có lỗi xảy ra khi cập nhật yêu thích", "error");
    });
}

// ============================================
// LIGHTBOX FUNCTIONALITY
// ============================================
/**
 * Mở lightbox với ảnh tại index
 * @param {Number} index - Index của ảnh cần hiển thị
 */
function openLightbox(index) {
  // Đảm bảo index hợp lệ
  if (!images || index < 0 || index >= images.length) return;

  currentImageIndex = index;
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Không cho scroll body

  // Cập nhật hiển thị
  updateLightboxDisplay();
}

/**
 * Đóng lightbox
 */
function closeLightbox() {
  document.getElementById("lightbox").classList.add("hidden");
  document.body.style.overflow = "auto";
}

/**
 * Chuyển sang ảnh tiếp theo
 */
function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % images.length;
  updateLightboxDisplay();
}

/**
 * Quay lại ảnh trước đó
 */
function prevImage() {
  currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
  updateLightboxDisplay();
}

/**
 * Cập nhật hiển thị lightbox
 * - Đổi ảnh chính
 * - Cập nhật caption và counter
 * - Highlight thumbnail đang active
 */
function updateLightboxDisplay() {
  if (!images || !images[currentImageIndex]) return;

  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  const counter = document.getElementById("lightbox-counter");

  img.src = images[currentImageIndex].src;
  img.alt = images[currentImageIndex].caption;
  caption.textContent = images[currentImageIndex].caption;
  counter.textContent = currentImageIndex + 1 + " / " + images.length;

  // Highlight thumbnail đang active
  const allThumbs = document.querySelectorAll(".lightbox-thumb");
  allThumbs.forEach((thumb, idx) => {
    if (idx === currentImageIndex) {
      thumb.classList.add("ring-2", "ring-yellow-400");
    } else {
      thumb.classList.remove("ring-2", "ring-yellow-400");
    }
  });

  // Scroll thumbnail vào viewport
  if (allThumbs.length > currentImageIndex) {
    allThumbs[currentImageIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }
}

// ============================================
// MODAL FUNCTIONALITY
// ============================================
/**
 * Mở modal đặt tour
 */
function openBookingModal() {
  document.getElementById("booking-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

/**
 * Đóng modal đặt tour
 */
function closeBookingModal() {
  document.getElementById("booking-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
  resetBookingForm(); // Reset form khi đóng modal
}

/**
 * Mở modal liên hệ
 */
function openContactModal() {
  document.getElementById("contact-modal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

/**
 * Đóng modal liên hệ
 */
function closeContactModal() {
  document.getElementById("contact-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

// ============================================
// FORM SUBMISSION
// ============================================
/**
 * Xử lý submit form đặt tour
 * @param {Event} event - Event submit
 */
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

// ============================================
// NOTIFICATION SYSTEM
// ============================================
/**
 * Hiển thị thông báo popup
 * @param {String} message - Nội dung thông báo
 * @param {String} type - Loại thông báo (success/error/info)
 */
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

  // Tự động ẩn sau 4 giây
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// ============================================
// CALENDAR INTERACTION
// ============================================
// Xử lý click vào ngày trên lịch
document.querySelectorAll(".calendar-day").forEach((day) => {
  day.addEventListener("click", function () {
    if (
      this.classList.contains("bg-blue-500") ||
      this.classList.contains("bg-orange-500")
    ) {
      const price = this.querySelector(".text-xs")?.textContent || "";
      const date = this.querySelector(".font-semibold")?.textContent || "";

      // Xóa selection trước đó
      document.querySelectorAll(".calendar-day").forEach((d) => {
        d.classList.remove("ring-4", "ring-yellow-400");
      });

      // Thêm ring highlight
      this.classList.add("ring-4", "ring-yellow-400");

      showNotification(`Đã chọn ngày ${date} - Giá: ${price} 📅`, "success");
    }
  });
});

// ============================================
// CLOSE MODALS ON OUTSIDE CLICK
// ============================================
// Đóng modal khi ấn esc
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const bookingModal = document.getElementById("booking-modal");
    const contactModal = document.getElementById("contact-modal");

    if (!bookingModal.classList.contains("hidden")) {
      closeBookingModal();
    }

    if (!contactModal.classList.contains("hidden")) {
      closeContactModal();
    }
  }
});

// ============================================
// INITIALIZE PAGE
// ============================================
/**
 * Khởi tạo trang khi DOM đã load
 * - Khởi tạo lịch và ngày khởi hành
 * - Khởi tạo lightbox thumbnails
 * - Kiểm tra trạng thái yêu thích
 * - Hiển thị thông báo chào mừng
 */
document.addEventListener("DOMContentLoaded", function () {
  initializeDepartureDates();
  initializeLightboxThumbnails();
  initializeDepartureDateDropdown(); // Populate dropdown ngày khởi hành
  initializeWishlist(); // Kiểm tra tour đã được yêu thích chưa

  // Khởi tạo hiển thị số lượng khách
  changeGuests(0);

  // Khởi tạo event listener cho coupon input
  const couponInput = document.getElementById("coupon-code");
  if (couponInput) {
    couponInput.addEventListener("input", function () {
      // Enable nút áp dụng khi user thay đổi mã
      const applyBtn = document.getElementById("apply-coupon-btn");
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.classList.remove("opacity-50");
      }
      // Xóa thông báo cũ
      const messageEl = document.getElementById("coupon-message");
      if (messageEl) {
        messageEl.classList.add("hidden");
        messageEl.textContent = "";
      }
    });
  }
});
