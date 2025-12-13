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
    alert("Chỉ có thể so sánh tối đa 3 tours");
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
function showComparison() {
  const modal = document.getElementById("comparisonModal");
  const content = document.getElementById("comparisonContent");

  if (!modal || !content) return;

  // Dữ liệu mẫu cho các tour
  const tourData = {
    sapa: {
      name: "Tour Sapa 3N2Đ",
      price: "2.890.000đ",
      rating: "4.8",
      carbon: "2.1 tấn",
    },
    phuquoc: {
      name: "Phú Quốc 4N3Đ",
      price: "4.590.000đ",
      rating: "4.9",
      carbon: "3.5 tấn",
    },
    japan: {
      name: "Nhật Bản 6N5Đ",
      price: "28.900.000đ",
      rating: "4.7",
      carbon: "8.2 tấn",
    },
  };

  content.innerHTML = "";

  selectedTours.forEach((tourId) => {
    const tour = tourData[tourId];
    if (tour) {
      content.innerHTML += `
        <div class="border rounded-lg p-4">
          <h3 class="font-bold text-lg mb-2">${tour.name}</h3>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Giá:</span>
              <span class="font-semibold text-indigo-600">${tour.price}</span>
            </div>
            <div class="flex justify-between">
              <span>Đánh giá:</span>
              <span class="font-semibold">${tour.rating}/5</span>
            </div>
            <div class="flex justify-between">
              <span>Carbon:</span>
              <span class="font-semibold">${tour.carbon}</span>
            </div>
          </div>
          <button class="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Chọn tour này
          </button>
        </div>
      `;
    }
  });

  modal.classList.add("active");
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
        alert("Vui lòng chọn ít nhất 2 tours để so sánh");
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
