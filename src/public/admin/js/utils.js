// ===========================
// KHỞI TẠO ỨNG DỤNG
// ===========================

/**
 * Khởi tạo ứng dụng khi trang được load
 * - Khởi tạo biểu đồ thống kê
 * - Render bảng nhân viên (nếu có)
 * - Gán sự kiện cho sidebar và search
 */
document.addEventListener("DOMContentLoaded", function () {
  // Khởi tạo biểu đồ ngay khi load trang
  const statsSection = document.getElementById("statistics");
  const wasHidden = statsSection && statsSection.classList.contains("hidden");

  // Tạm thời hiện section thống kê để khởi tạo biểu đồ
  if (wasHidden) {
    statsSection.classList.remove("hidden");
  }

  // Ẩn lại section nếu ban đầu nó bị ẩn
  if (wasHidden) {
    statsSection.classList.add("hidden");
  }

  // Khởi tạo phần quản lý nhân viên (nếu có)
  const staffTableBody = document.getElementById("staffTableBody");
  if (staffTableBody) {
    renderStaffTable();
    updateStaffStats();
  }

  // Thêm sự kiện click cho các item sidebar
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      const onclickAttr = this.getAttribute("onclick");
      if (onclickAttr) {
        const match = onclickAttr.match(/showSection\('(.+)'\)/);
        if (match) {
          e.preventDefault();
          const sectionId = match[1];
          showSection(sectionId);
        }
      }
    });
  });

  // Thêm chức năng tìm kiếm nhân viên
  const staffSearchInput = document.getElementById("staffSearchInput");
  if (staffSearchInput) {
    staffSearchInput.addEventListener("input", function (e) {
      searchStaff(e.target.value);
    });
  }

  // Xử lý submit form thêm nhân viên
  const addStaffForm = document.getElementById("addStaffForm");
  if (addStaffForm) {
    addStaffForm.addEventListener("submit", function (e) {
      e.preventDefault();
      addNewStaff();
    });
  }
});

/**
 * Thêm các tính năng tương tác
 * - Mô phỏng thông báo real-time
 * - Hiệu ứng hover cho các card
 */
document.addEventListener("DOMContentLoaded", function () {
  // Mô phỏng thông báo real-time
  setInterval(() => {
    const badge = document.querySelector(".notification-badge");
    if (badge) {
      const currentCount = parseInt(badge.textContent) || 0;
      if (Math.random() > 0.95) {
        // 5% xác suất mỗi giây
        badge.textContent = currentCount + 1;
      }
    }
  }, 1000);

  // Thêm hiệu ứng hover cho các card
  const cards = document.querySelectorAll(".card-hover");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-4px)";
      this.style.transition = "transform 0.3s ease";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });
});

/**
 * Khởi tạo các biểu đồ Chart.js
 * Tạo 4 biểu đồ: Doanh thu, Tour phổ biến, Theo mùa, Theo điểm đến
 */
function initCharts() {
  // ============================================
  // 1. BIỂU ĐỒ DOANH THU (LINE CHART)
  // ============================================
  const revenueCtx = document.getElementById("revenueChart");
  if (revenueCtx) {
    const ctx = revenueCtx.getContext("2d");
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, "rgba(102, 126, 234, 0.4)");
    gradientFill.addColorStop(0.5, "rgba(102, 126, 234, 0.15)");
    gradientFill.addColorStop(1, "rgba(102, 126, 234, 0)");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: [
          "T1",
          "T2",
          "T3",
          "T4",
          "T5",
          "T6",
          "T7",
          "T8",
          "T9",
          "T10",
          "T11",
          "T12",
        ],
        datasets: [
          {
            label: "Doanh thu (tỷ VNĐ)",
            data: [1.2, 1.8, 2.1, 1.9, 2.4, 2.8, 3.1, 2.9, 2.6, 2.3, 2.7, 2.4],
            borderColor: "#667eea",
            backgroundColor: gradientFill,
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: "#667eea",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverBackgroundColor: "#667eea",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
          // Đẩy từ dưới lên mượt mà
          y: {
            duration: 1500,
            from: (ctx) => {
              if (ctx.chart.scales && ctx.chart.scales.y) {
                return ctx.chart.scales.y.getPixelForValue(0);
              }
              return 400;
            },
            easing: "easeOutQuart",
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 15,
            cornerRadius: 10,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            displayColors: false,
            callbacks: {
              title: (context) => `Tháng ${context[0].label}`,
              label: (context) =>
                `Doanh thu: ${context.parsed.y.toFixed(1)} tỷ VNĐ`,
              afterLabel: (context) => {
                const idx = context.dataIndex;
                if (idx > 0) {
                  const curr = context.parsed.y;
                  const prev = context.dataset.data[idx - 1];
                  const change = ((curr - prev) / prev) * 100;
                  const arrow = change >= 0 ? "↑" : "↓";
                  const text = change >= 0 ? "Tăng" : "Giảm";
                  return `${text} ${Math.abs(change).toFixed(1)}% ${arrow}`;
                }
                return "";
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0, 0, 0, 0.05)", drawBorder: false },
            ticks: {
              font: { size: 12 },
              color: "#6b7280",
              padding: 10,
              callback: (value) => value.toFixed(1) + " tỷ",
            },
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              font: { size: 12, weight: "500" },
              color: "#6b7280",
              padding: 8,
            },
          },
        },
        layout: { padding: { top: 10, right: 15, bottom: 10, left: 5 } },
      },
    });
  }

  // ============================================
  // 2. BIỂU ĐỒ TOUR PHỔ BIẾN (DOUGHNUT CHART)
  // ============================================
  const popularCtx = document.getElementById("popularToursChart");
  if (popularCtx) {
    new Chart(popularCtx.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: [
          "Hạ Long - Sapa",
          "Phú Quốc",
          "Đà Nẵng - Hội An",
          "Nha Trang",
          "Khác",
        ],
        datasets: [
          {
            data: [30, 25, 20, 15, 10],
            backgroundColor: [
              "#667eea",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
            ],
            hoverBackgroundColor: [
              "#5568d3",
              "#059669",
              "#d97706",
              "#dc2626",
              "#7c3aed",
            ],
            borderWidth: 5, // Tăng từ 3 lên 5
            borderColor: "#ffffff",
            hoverBorderWidth: 7, // Tăng từ 5 lên 7
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1800,
          easing: "easeOutCubic",
        },
        interaction: {
          mode: "nearest",
          intersect: true,
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 15,
              font: {
                size: 13,
                family: "'Inter', 'Segoe UI', sans-serif",
                weight: "500",
              },
              usePointStyle: true,
              pointStyle: "circle",
              color: "#374151",
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} tours (${percentage}%)`;
              },
            },
          },
        },
        layout: { padding: { top: 10, bottom: 10 } },
        cutout: "50%", // Giảm xuống 50% để phần trắng lớn hơn (bé hơn 1/2 so với 77%)
      },
    });
  }

  // ============================================
  // 3. BIỂU ĐỒ THEO MÙA (BAR CHART)
  // ============================================
  const seasonalCtx = document.getElementById("seasonalChart");
  if (seasonalCtx) {
    new Chart(seasonalCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Xuân", "Hạ", "Thu", "Đông"],
        datasets: [
          {
            label: "Số lượng đặt tour",
            data: [450, 680, 520, 380],
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"],
            borderRadius: 8,
            borderSkipped: false,
            hoverBackgroundColor: ["#059669", "#d97706", "#dc2626", "#2563eb"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 1500,
          easing: "easeOutQuart",
          // Animation từ dưới lên
          y: {
            duration: 1500,
            from: (ctx) => ctx.chart.scales.y.getPixelForValue(0),
            easing: "easeOutQuart",
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 15,
            cornerRadius: 10,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            displayColors: false,
            callbacks: {
              title: (context) => `Mùa ${context[0].label}`,
              label: (context) => `Số lượng: ${context.parsed.y} tours`,
              afterLabel: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed.y / total) * 100).toFixed(
                  1
                );
                return `Chiếm ${percentage}% tổng số`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0, 0, 0, 0.05)", drawBorder: false },
            ticks: {
              font: { size: 12 },
              color: "#6b7280",
              padding: 10,
              callback: (value) => value + " tours",
            },
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              font: { size: 12, weight: "500" },
              color: "#6b7280",
              padding: 8,
            },
          },
        },
        layout: { padding: { top: 10, right: 10, bottom: 10, left: 5 } },
      },
    });
  }

  // ============================================
  // 4. BIỂU ĐỒ ĐIỂM ĐẾN (DOUGHNUT CHART - Đổi từ PIE)
  // ============================================
  const destinationCtx = document.getElementById("destinationChart");
  if (destinationCtx) {
    new Chart(destinationCtx.getContext("2d"), {
      type: "doughnut", // Đổi từ pie sang doughnut
      data: {
        labels: ["Miền Bắc", "Miền Trung", "Miền Nam", "Quốc tế"],
        datasets: [
          {
            data: [35, 28, 25, 12],
            backgroundColor: ["#667eea", "#10b981", "#f59e0b", "#ef4444"],
            hoverBackgroundColor: ["#5568d3", "#059669", "#d97706", "#dc2626"],
            borderWidth: 5, // Tăng từ 3 lên 5
            borderColor: "#ffffff",
            hoverBorderWidth: 7, // Tăng từ 5 lên 7
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1800,
          easing: "easeOutCubic",
        },
        interaction: {
          mode: "nearest",
          intersect: true,
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 15,
              font: {
                size: 13,
                family: "'Inter', 'Segoe UI', sans-serif",
                weight: "500",
              },
              usePointStyle: true,
              pointStyle: "circle",
              color: "#374151",
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value}% (${percentage}% tổng)`;
              },
            },
          },
        },
        layout: { padding: { top: 10, bottom: 10 } },
        cutout: "50%", // Thêm lỗ giữa 50% giống Tour phổ biến
      },
    });
  }
}
// ===========================
// QUẢN LÝ NAVIGATION & LAYOUT
// ===========================

// Highlight khi load trang lần đầu
document.addEventListener("DOMContentLoaded", highlightCurrentPage);

// Highlight khi Turbo load trang mới (không reload)
document.addEventListener("turbo:load", highlightCurrentPage);

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll(".sidebar-item");

  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href");

    // Xóa highlight cũ
    link.classList.remove(
      "bg-gradient-to-r",
      "from-blue-500",
      "to-purple-600",
      "text-white"
    );
    link.classList.add("text-gray-700");

    // Thêm highlight cho trang hiện tại
    if (currentPath === href || currentPath.startsWith(href + "/")) {
      link.classList.add(
        "bg-gradient-to-r",
        "from-blue-500",
        "to-purple-600",
        "text-white"
      );
      link.classList.remove("text-gray-700");
    }
  });
  // Khởi tạo lại charts nếu có
  if (typeof initCharts === "function") {
    setTimeout(initCharts, 100);
  }
}

/**
 * Chuyển đổi chế độ sáng/tối (Dark mode)
 * Thay đổi icon và class của body
 */
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle("dark-mode");

  const icon = document.querySelector(".fa-moon");
  if (icon) {
    if (isDarkMode) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
  }
}

/**
 * Đăng xuất khỏi hệ thống
 */
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    alert("Đăng xuất thành công!");
    // Có thể redirect về trang login: window.location.href = '/login';
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Lấy chữ cái đầu của tên để làm avatar
 * @param {string} name - Tên đầy đủ
 * @returns {string} Chữ cái đầu (tối đa 2 ký tự)
 */
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Lấy mã màu ngẫu nhiên cho avatar
 * @returns {string} Mã màu hex (không có #)
 */
function getRandomColor() {
  const colors = ["667eea", "10b981", "f59e0b", "ef4444", "8b5cf6", "06b6d4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Lấy class CSS tương ứng với trạng thái nhân viên
 * @param {string} status - Trạng thái nhân viên
 * @returns {string} Class CSS
 */
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "leave":
      return "bg-yellow-100 text-yellow-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Chuyển đổi mã trạng thái sang text hiển thị
 * @param {string} status - Mã trạng thái
 * @returns {string} Text hiển thị
 */
function getStatusText(status) {
  switch (status) {
    case "active":
      return "Đang làm việc";
    case "leave":
      return "Nghỉ phép";
    case "inactive":
      return "Nghỉ việc";
    default:
      return "Không xác định";
  }
}

/**
 * Định dạng ngày theo chuẩn Việt Nam
 * @param {string} dateString - Chuỗi ngày định dạng ISO
 * @returns {string} Ngày định dạng dd/mm/yyyy
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

/**
 * Định dạng số tiền theo chuẩn Việt Nam
 * @param {number} amount - Số tiền
 * @returns {string} Số tiền đã định dạng (VD: 25.000.000 ₫)
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// ===========================
// XỬ LÝ MODAL TOUR
// ===========================

function modalHandlers(onCloseCallback = null) {
  const modal = document.getElementById("addTourModal");
  if (!modal) return;

  // Hiển thị modal
  window.showAddTourModal = function () {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  window.hideAddTourModal = function () {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";

    // Reset form
    const form = modal.querySelector("form");
    if (form) form.reset();

    // Clear previews
    const preview = document.getElementById("imagePreview");
    if (preview) preview.innerHTML = "";

    const departureList = document.getElementById("departureList");
    if (departureList) departureList.innerHTML = "";

    // Gọi callback để reset dữ liệu từ file gọi
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  // Đóng modal khi nhấn ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      window.hideAddTourModal();
    }
  });
}
// ===========================
// CONFIRM THÔNG BÁO
// ===========================
// const Modal = {
//   // Modal xác nhận
//   confirm({
//     title = "Xác nhận",
//     message = "Bạn có chắc chắn?",
//     icon = "fa-exclamation-triangle",
//     iconColor = "red",
//     confirmText = "Xác nhận",
//     cancelText = "Hủy",
//     confirmColor = "red",
//     onConfirm = () => {},
//     onCancel = () => {},
//   }) {
//     const modal = document.createElement("div");
//     modal.id = "reusable-modal";
//     modal.className =
//       "fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50";

//     const colorClasses = {
//       red: {
//         bg: "bg-red-100",
//         text: "text-red-600",
//         btn: "bg-red-500 hover:bg-red-600",
//       },
//       blue: {
//         bg: "bg-blue-100",
//         text: "text-blue-600",
//         btn: "bg-blue-500 hover:bg-blue-600",
//       },
//       green: {
//         bg: "bg-green-100",
//         text: "text-green-600",
//         btn: "bg-green-500 hover:bg-green-600",
//       },
//       yellow: {
//         bg: "bg-yellow-100",
//         text: "text-yellow-600",
//         btn: "bg-yellow-500 hover:bg-yellow-600",
//       },
//     };

//     const colors = colorClasses[iconColor] || colorClasses.red;
//     const btnColors = colorClasses[confirmColor] || colorClasses.red;

//     modal.innerHTML = `
//     <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 mt-20 animate-fade-in">
//       <div class="p-6">
//         <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 ${colors.bg} rounded-full">
//           <i class="fas ${icon} text-3xl ${colors.text}"></i>
//         </div>
//         <h3 class="text-xl font-bold text-center text-gray-800 mb-2">${title}</h3>
//         <div class="text-gray-600 text-center mb-6">${message}</div>
//         <div class="flex space-x-3">
//           <button
//             id="modal-cancel-btn"
//             class="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//           >
//             <i class="fas fa-times mr-2"></i>${cancelText}
//           </button>
//           <button
//             id="modal-confirm-btn"
//             class="flex-1 px-4 py-3 ${btnColors.btn} text-white rounded-lg transition-colors font-medium"
//           >
//             <i class="fas fa-check mr-2"></i>${confirmText}
//           </button>
//         </div>
//       </div>
//     </div>
//   `;

//     document.body.appendChild(modal);

//     const cancelBtn = document.getElementById("modal-cancel-btn");
//     const confirmBtn = document.getElementById("modal-confirm-btn");

//     cancelBtn.onclick = () => {
//       this.close();
//       onCancel();
//     };

//     confirmBtn.onclick = async () => {
//       confirmBtn.innerHTML =
//         '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
//       confirmBtn.disabled = true;
//       try {
//         await onConfirm();
//         this.close();
//       } catch (err) {
//         confirmBtn.disabled = false;
//         confirmBtn.innerHTML = `<i class="fas fa-check mr-2"></i>${confirmText}`;
//       }
//     };

//     // Click outside để đóng
//     modal.onclick = (e) => {
//       if (e.target === modal) {
//         this.close();
//         onCancel();
//       }
//     };

//     const keyHandler = (e) => {
//       if (e.key === "Enter") {
//         e.preventDefault();
//         confirmBtn.click();
//       } else if (e.key === "Escape") {
//         e.preventDefault();
//         cancelBtn.click();
//       }
//     };

//     document.addEventListener("keydown", keyHandler);

//     // Khi modal đóng, xoá event listener để tránh rò rỉ
//     this._keyHandler = keyHandler;
//   },

//   // Đóng modal
//   close() {
//     const modal = document.getElementById("reusable-modal");
//     if (modal) modal.remove();
//     if (this._keyHandler) {
//       document.removeEventListener("keydown", this._keyHandler);
//       this._keyHandler = null;
//     }
//   },

//   // Modal thông báo chỉ có 1 nút OK
//   alert({
//     title = "Thông báo",
//     message = "",
//     icon = "fa-info-circle",
//     iconColor = "blue",
//     buttonText = "OK",
//     onClose = () => {},
//   }) {
//     const modal = document.createElement("div");
//     modal.id = "reusable-modal";
//     modal.className =
//       "fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50";

//     const colorClasses = {
//       blue: {
//         bg: "bg-blue-100",
//         text: "text-blue-600",
//         btn: "bg-blue-500 hover:bg-blue-600",
//       },
//       red: {
//         bg: "bg-red-100",
//         text: "text-red-600",
//         btn: "bg-red-500 hover:bg-red-600",
//       },
//       green: {
//         bg: "bg-green-100",
//         text: "text-green-600",
//         btn: "bg-green-500 hover:bg-green-600",
//       },
//       yellow: {
//         bg: "bg-yellow-100",
//         text: "text-yellow-600",
//         btn: "bg-yellow-500 hover:bg-yellow-600",
//       },
//     };

//     const colors = colorClasses[iconColor] || colorClasses.blue;

//     modal.innerHTML = `
//       <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 mt-20 animate-fade-in">
//         <div class="p-6">
//           <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 ${colors.bg} rounded-full">
//             <i class="fas ${icon} text-3xl ${colors.text}"></i>
//           </div>
//           <h3 class="text-xl font-bold text-center text-gray-800 mb-2">${title}</h3>
//           <div class="text-gray-600 text-center mb-6">${message}</div>
//           <div class="flex justify-center">
//             <button
//               id="modal-ok-btn"
//               class="px-6 py-3 ${colors.btn} text-white rounded-lg transition-colors font-medium"
//             >
//               <i class="fas fa-check mr-2"></i>${buttonText}
//             </button>
//           </div>
//         </div>
//       </div>
//     `;

//     document.body.appendChild(modal);

//     // Chỉ có một nút OK
//     document.getElementById("modal-ok-btn").onclick = () => {
//       this.close();
//       onClose();
//     };

//     // Click ra ngoài để đóng
//     modal.onclick = (e) => {
//       if (e.target === modal) {
//         this.close();
//         onClose();
//       }
//     };

//     const keyHandler = (e) => {
//       if (e.key === "Enter") {
//         e.preventDefault();
//         confirmBtn.click();
//       } else if (e.key === "Escape") {
//         e.preventDefault();
//         cancelBtn.click();
//       }
//     };

//     document.addEventListener("keydown", keyHandler);

//     // Khi modal đóng, xoá event listener để tránh rò rỉ
//     this._keyHandler = keyHandler;
//   },
// };

// // ===========================
// // TOAST
// // ===========================
// const Notification = {
//   show(message, type = "success", duration = 3000) {
//     const configs = {
//       success: { bg: "bg-green-500", icon: "fa-check-circle" },
//       error: { bg: "bg-red-500", icon: "fa-times-circle" },
//       warning: { bg: "bg-yellow-500", icon: "fa-exclamation-triangle" },
//       info: { bg: "bg-blue-500", icon: "fa-info-circle" },
//     };

//     const config = configs[type] || configs.success;

//     let container = document.getElementById("notification-container");
//     if (!container) {
//       container = document.createElement("div");
//       container.id = "notification-container";
//       container.className =
//         "fixed top-4 right-4 flex flex-col items-end space-y-3 z-50";
//       document.body.appendChild(container);
//     }

//     const notification = document.createElement("div");
//     notification.className = `px-6 py-4 rounded-lg shadow-lg animate-slide-in ${config.bg} text-white w-max max-w-sm`;
//     notification.innerHTML = `
//       <div class="flex items-center">
//         <i class="fas ${config.icon} mr-3"></i>
//         <span>${message}</span>
//       </div>
//     `;

//     container.appendChild(notification);

//     setTimeout(() => {
//       notification.style.animation = "slide-out 0.3s ease-out forwards";
//       setTimeout(() => notification.remove(), 300);
//     }, duration);
//   },

//   success(message, duration) {
//     this.show(message, "success", duration);
//   },

//   error(message, duration) {
//     this.show(message, "error", duration);
//   },

//   warning(message, duration) {
//     this.show(message, "warning", duration);
//   },

//   info(message, duration) {
//     this.show(message, "info", duration);
//   },
// };

export { modalHandlers, initCharts };
