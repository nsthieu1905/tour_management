import { Modal, Notification } from "../../utils/modal.js";
import { apiGet } from "../../utils/api.js";

// ============================================
// BIẾN TOÀN CỤC
// ============================================
let selectedTours = [];

// ============================================
// CHỨC NĂNG SO SÁNH TOUR
// ============================================

/**
 * Bật/tắt chọn tour để so sánh
 */
function toggleCompare(button, tourId) {
  const checkbox = button.parentElement.querySelector(".compare-checkbox");
  const isSelected = checkbox.checked;

  if (!isSelected && selectedTours.length >= 3) {
    Notification.error("Chỉ có thể so sánh tối đa 3 tours");
    return;
  }

  checkbox.checked = !isSelected;

  if (!isSelected) {
    selectedTours.push(tourId);
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add("bg-green-500", "text-white");
    button.classList.remove("bg-white", "text-gray-700");
  } else {
    selectedTours = selectedTours.filter((id) => id !== tourId);
    button.innerHTML = '<i class="fas fa-plus"></i>';
    button.classList.remove("bg-green-500", "text-white");
    button.classList.add("bg-white", "text-gray-700");
  }

  updateCompareButton();
}

/**
 * Cập nhật trạng thái và số lượng tour được chọn trên nút so sánh
 */
function updateCompareButton() {
  const compareBtn = document.getElementById("compareBtn");
  if (!compareBtn) return;

  compareBtn.innerHTML = `<i class="fas fa-balance-scale mr-2"></i>So sánh (${selectedTours.length})`;

  if (selectedTours.length > 0) {
    compareBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
    compareBtn.classList.add("bg-green-600", "hover:bg-green-700");
  } else {
    compareBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
    compareBtn.classList.remove("bg-green-600", "hover:bg-green-700");
  }
}

/**
 * Hiển thị modal so sánh tour
 */
async function showComparison() {
  const modal = document.getElementById("comparisonModal");
  const content = document.getElementById("comparisonContent");

  if (!modal || !content) return;

  // Load dữ liệu tours từ API
  try {
    const responses = await Promise.all(
      selectedTours.map((id) => apiGet(`/api/tours/${id}`))
    );
    const payloads = await Promise.all(responses.map((r) => r.json()));
    const tours = payloads
      .map((p) => (p && p.success ? p.data : null))
      .filter(Boolean);

    if (tours.length < 2) {
      Notification.error("Vui lòng chọn ít nhất 2 tour hợp lệ để so sánh.");
      return;
    }

    content.innerHTML = tours
      .map((t) => {
        const priceDisplay =
          typeof t.price === "number"
            ? t.price.toLocaleString("vi-VN") + " VND"
            : "-";
        const img = t.thumbnail || (t.images && t.images[0]) || "/images/no-image.png";
        const ratingAvg = t?.rating?.average ?? 0;
        const ratingCount = t?.rating?.count ?? 0;
        const duration = t?.duration
          ? `${t.duration.days || 0} ngày ${t.duration.nights || 0} đêm`
          : "-";
        const destination = t?.destination || "-";
        const tourType = t?.tourType || "-";

        return `
          <div class="border rounded-xl overflow-hidden bg-white shadow-sm">
            <div class="h-40 bg-gray-100 overflow-hidden">
              <img src="${img}" alt="${t.name}" class="w-full h-full object-cover" />
            </div>
            <div class="p-4">
              <h3 class="font-bold text-lg mb-2 line-clamp-2">${t.name}</h3>
              <div class="space-y-2 text-sm text-gray-700">
                <div class="flex justify-between">
                  <span>Giá</span>
                  <span class="font-semibold text-indigo-600">${priceDisplay}</span>
                </div>
                <div class="flex justify-between">
                  <span>Thời lượng</span>
                  <span>${duration}</span>
                </div>
                <div class="flex justify-between">
                  <span>Điểm đến</span>
                  <span>${destination}</span>
                </div>
                <div class="flex justify-between">
                  <span>Hạng tour</span>
                  <span>${tourType}</span>
                </div>
                <div class="flex justify-between">
                  <span>Đánh giá</span>
                  <span><i class="fas fa-star text-yellow-400"></i> ${ratingAvg} (${ratingCount})</span>
                </div>
              </div>
              <button class="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors" onclick="window.location.href='/tours/${t.slug}'">
                Xem chi tiết
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    modal.classList.add("active");
  } catch (err) {
    console.error("Lỗi tải dữ liệu so sánh:", err);
    Notification.error("Không thể tải dữ liệu tour để so sánh. Vui lòng thử lại.");
  }
}

/**
 * Đóng modal so sánh tour
 */
function closeComparison() {
  const modal = document.getElementById("comparisonModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// ============================================
// ĐỊNH GIÁ ĐỘNG THEO NHU CẦU
// ============================================

/**
 * Khởi tạo hệ thống định giá động
 */
function initDynamicPricing() {
  const priceElements = document.querySelectorAll(
    ".text-2xl.font-bold.text-indigo-600"
  );

  // Có thể thêm tooltip hoặc hiệu ứng cho giá
  // Code đã được comment vì có thể gây ảnh hưởng đến UX
}

// ============================================
// XỬ LÝ ĐÓNG MODAL
// ============================================

// Đóng modal khi click bên ngoài
document.addEventListener("click", function (e) {
  // Chỉ đóng modal so sánh, không ảnh hưởng đến các modal khác
  if (e.target.id === "comparisonModal") {
    closeComparison();
  }
});

// ============================================
// KHỞI TẠO TRANG
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // Thêm hiệu ứng tương tác cho các card
  const cards = document.querySelectorAll(".card-hover");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });

  // Lắng nghe sự kiện click nút so sánh
  const compareBtn = document.getElementById("compareBtn");
  if (compareBtn) {
    compareBtn.addEventListener("click", function () {
      if (selectedTours.length < 2) {
        Notification.error("Vui lòng chọn ít nhất 2 tours để so sánh");
        return;
      }
      showComparison();
    });
  }

  // Khởi tạo các tính năng nâng cao
  initDynamicPricing();

  // KHÔNG XỬ LÝ FLOATING BUTTONS Ở ĐÂY
  // Đã được xử lý trong floating-buttons.js
});

// Expose functions for inline onclick handlers
window.toggleCompare = toggleCompare;
window.showComparison = showComparison;
window.closeComparison = closeComparison;
