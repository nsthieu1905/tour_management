// ===========================
// BIẾN TOÀN CỤC
// ===========================
// let isDarkMode = false;
let currentFilter = "all";
let currentDepartmentFilter = "all";

// Dữ liệu nhân viên
let staffData = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "nguyenvanan@company.com",
    phone: "0901234567",
    position: "Trưởng phòng Kinh doanh",
    department: "Kinh doanh",
    joinDate: "2020-03-15",
    salary: 25000000,
    status: "active",
    performance: 95,
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "tranthibinh@company.com",
    phone: "0912345678",
    position: "Nhân viên Marketing",
    department: "Marketing",
    joinDate: "2021-07-20",
    salary: 15000000,
    status: "leave",
    performance: 88,
  },
  {
    id: 3,
    name: "Lê Minh Cường",
    email: "leminhcuong@company.com",
    phone: "0923456789",
    position: "Nhân viên Vận hành",
    department: "Vận hành",
    joinDate: "2022-01-10",
    salary: 18000000,
    status: "active",
    performance: 92,
  },
  {
    id: 4,
    name: "Phạm Thị Hoa",
    email: "phamthihoa@company.com",
    phone: "0934567890",
    position: "Kế toán trưởng",
    department: "Tài chính",
    joinDate: "2019-11-05",
    salary: 22000000,
    status: "active",
    performance: 90,
  },
  {
    id: 5,
    name: "Vũ Minh Đức",
    email: "vuminhduc@company.com",
    phone: "0945678901",
    position: "Chuyên viên Nhân sự",
    department: "Nhân sự",
    joinDate: "2021-09-12",
    salary: 16000000,
    status: "leave",
    performance: 85,
  },
];

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

  // Khởi tạo các biểu đồ
  initCharts();

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

// ===========================
// QUẢN LÝ BIỂU ĐỒ THỐNG KÊ
// ===========================

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
// function toggleDarkMode() {
//   isDarkMode = !isDarkMode;
//   document.body.classList.toggle("dark-mode");

//   const icon = document.querySelector(".fa-moon");
//   if (icon) {
//     if (isDarkMode) {
//       icon.classList.remove("fa-moon");
//       icon.classList.add("fa-sun");
//     } else {
//       icon.classList.remove("fa-sun");
//       icon.classList.add("fa-moon");
//     }
//   }
// }

/**
 * Đăng xuất khỏi hệ thống
 * Delegates to auth-helper.js for centralized logout logic
 */
function logout() {
  logoutHelper.logout();
}

// ===========================
// QUẢN LÝ MODAL
// ===========================

// Hiển thị modal thêm tour
function showAddTourModal() {
  const modal = document.getElementById("addTourModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Ngăn scroll trang chính
}

// Ẩn modal thêm tour
function hideAddTourModal() {
  const modal = document.getElementById("addTourModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";

  // Reset form khi đóng modal
  const form = modal.querySelector("form");
  if (form) {
    form.reset();
  }
}
// Reset form khi submit
document
  .getElementById("addTourForm")
  ?.addEventListener("submit", function (e) {
    // Nếu bạn đang gửi form qua AJAX thì nên gọi preventDefault()
    e.preventDefault();

    // Giả sử submit xong (hoặc khi nhận response OK)
    this.reset(); // Reset form
    hideAddTourModal(); // Ẩn modal luôn
  });

// Đóng modal khi click bên ngoài
document
  .getElementById("addTourModal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) {
      hideAddTourModal();
    }
  });

// Đóng modal khi nhấn phím ESC
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    const modal = document.getElementById("addTourModal");
    if (modal && !modal.classList.contains("hidden")) {
      hideAddTourModal();
    }
  }
});

// Xử lý chọn nhiều ngày khởi hành
// const departureInput = document.getElementById("departureInput");
// const departureList = document.getElementById("departureList");
// const departuresData = document.getElementById("departuresData");

// let departures = [];

// departureInput.addEventListener("change", () => {
//   const date = departureInput.value;
//   if (date && !departures.includes(date)) {
//     departures.push(date);
//     departures.sort((a, b) => new Date(a) - new Date(b)); // Sắp xếp ngày tháng
//     renderDepartures();
//   }
//   departureInput.value = "";
// });

// function renderDepartures() {
//   departureList.innerHTML = "";
//   departures.forEach((date, index) => {
//     // Format lại ngày kiểu: dd/mm/yyyy
//     const formatted = new Date(date).toLocaleDateString("vi-VN");
//     const item = document.createElement("div");
//     item.className = "departure-item";
//     item.innerHTML = `
//       <span>${formatted}</span>
//       <button type="button" onclick="removeDeparture(${index})">✕</button>
//     `;
//     departureList.appendChild(item);
//   });

//   departuresData.value = JSON.stringify(departures);
// }

// function removeDeparture(index) {
//   departures.splice(index, 1);
//   renderDepartures();
// }

// // Xử lý hiển thị ảnh
// const tourImagesInput = document.getElementById("tourImages");
// const imagePreview = document.getElementById("imagePreview");
// const imagesData = document.getElementById("imagesData");
// const thumbnailData = document.getElementById("thumbnailData");

// let imagesArray = [];

// tourImagesInput.addEventListener("change", () => {
//   const files = Array.from(tourImagesInput.files);
//   files.forEach((file) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       imagesArray.push(e.target.result);
//       renderPreview();
//     };
//     reader.readAsDataURL(file);
//   });
// });

// function renderPreview() {
//   imagePreview.innerHTML = "";
//   imagesArray.forEach((src, index) => {
//     const wrapper = document.createElement("div");
//     wrapper.className = "image-preview-item";
//     if (index === 0) wrapper.classList.add("thumbnail");

//     const img = document.createElement("img");
//     img.src = src;

//     const removeBtn = document.createElement("button");
//     removeBtn.innerHTML = "✕";
//     removeBtn.onclick = () => {
//       imagesArray.splice(index, 1);
//       renderPreview();
//     };

//     wrapper.appendChild(img);
//     wrapper.appendChild(removeBtn);
//     imagePreview.appendChild(wrapper);
//   });

//   // Gán dữ liệu vào input hidden để gửi về server
//   imagesData.value = JSON.stringify(imagesArray);
//   thumbnailData.value = imagesArray.length > 0 ? imagesArray[0] : "";
// }

// // Tùy chọn: hỗ trợ kéo thả ảnh
// const uploadContainer = document.getElementById("uploadContainer");
// uploadContainer.addEventListener("dragover", (e) => {
//   e.preventDefault();
//   uploadContainer.style.background =
//     "linear-gradient(135deg, #eef2ff, #e0e7ff)";
// });

// uploadContainer.addEventListener("dragleave", () => {
//   uploadContainer.style.background = "#f9fafb";
// });

// uploadContainer.addEventListener("drop", (e) => {
//   e.preventDefault();
//   uploadContainer.style.background = "#f9fafb";

//   const files = Array.from(e.dataTransfer.files);
//   files.forEach((file) => {
//     const reader = new FileReader();
//     reader.onload = (ev) => {
//       imagesArray.push(ev.target.result);
//       renderPreview();
//     };
//     reader.readAsDataURL(file);
//   });
// });

// ===========================
// QUẢN LÝ NHÂN VIÊN
// ===========================

/**
 * Render bảng danh sách nhân viên
 * Áp dụng các bộ lọc (trạng thái, phòng ban) trước khi hiển thị
 */
function renderStaffTable() {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  let filteredData = staffData;

  // Áp dụng bộ lọc trạng thái
  if (currentFilter !== "all") {
    filteredData = filteredData.filter(
      (staff) => staff.status === currentFilter
    );
  }

  // Áp dụng bộ lọc phòng ban
  if (currentDepartmentFilter !== "all") {
    filteredData = filteredData.filter(
      (staff) => staff.department === currentDepartmentFilter
    );
  }

  tbody.innerHTML = filteredData
    .map(
      (staff) => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23${getRandomColor()}'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3E${getInitials(
        staff.name
      )}%3C/text%3E%3C/svg%3E" alt="">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${
                              staff.name
                            }</div>
                            <div class="text-sm text-gray-500">${
                              staff.email
                            }</div>
                            <div class="text-sm text-gray-500">${
                              staff.phone
                            }</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${
                      staff.position
                    }</div>
                    <div class="text-sm text-gray-500">${staff.department}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                      staff.status
                    )}">
                        ${getStatusText(staff.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(
                  staff.joinDate
                )}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatCurrency(
                  staff.salary
                )}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">${
                          staff.performance
                        }%</div>
                        <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${
                              staff.performance
                            }%"></div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="viewStaff(${
                      staff.id
                    })" class="text-blue-600 hover:text-blue-900">Xem</button>
                    <button onclick="editStaff(${
                      staff.id
                    })" class="text-green-600 hover:text-green-900">Sửa</button>
                    <button onclick="deleteStaff(${
                      staff.id
                    })" class="text-red-600 hover:text-red-900">Xóa</button>
                </td>
            </tr>
        `
    )
    .join("");
}

/**
 * Cập nhật các thống kê nhân viên
 * Hiển thị tổng số, số đang làm, số nghỉ phép và hiệu suất trung bình
 */
function updateStaffStats() {
  const total = staffData.length;
  const active = staffData.filter((s) => s.status === "active").length;
  const onLeave = staffData.filter((s) => s.status === "leave").length;
  const avgPerformance = Math.round(
    staffData.reduce((sum, s) => sum + s.performance, 0) / total
  );

  const totalEl = document.getElementById("totalStaffCount");
  const activeEl = document.getElementById("activeStaffCount");
  const leaveEl = document.getElementById("onLeaveCount");
  const perfEl = document.getElementById("avgPerformanceCount");

  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (leaveEl) leaveEl.textContent = onLeave;
  if (perfEl) perfEl.textContent = avgPerformance + "%";
}

/**
 * Lọc nhân viên theo trạng thái (active, leave, all)
 * @param {string} status - Trạng thái cần lọc
 */
function filterStaffByStatus(status) {
  currentFilter = status;

  // Cập nhật trạng thái các nút lọc
  document.querySelectorAll(".status-filter").forEach((btn) => {
    btn.classList.remove("active");
    btn.classList.add("bg-gray-200", "text-gray-700");
  });

  if (event && event.target) {
    event.target.classList.add("active");
    event.target.classList.remove("bg-gray-200", "text-gray-700");
  }

  renderStaffTable();
}

/**
 * Lọc nhân viên theo phòng ban
 * @param {string} department - Tên phòng ban cần lọc
 */
function filterStaffByDepartment(department) {
  currentDepartmentFilter = department;
  renderStaffTable();
}

/**
 * Tìm kiếm nhân viên theo từ khóa
 * Tìm trong tên, email, chức vụ và phòng ban
 * @param {string} query - Từ khóa tìm kiếm
 */
function searchStaff(query) {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  let filteredData = staffData.filter(
    (staff) =>
      staff.name.toLowerCase().includes(query.toLowerCase()) ||
      staff.email.toLowerCase().includes(query.toLowerCase()) ||
      staff.position.toLowerCase().includes(query.toLowerCase()) ||
      staff.department.toLowerCase().includes(query.toLowerCase())
  );

  // Áp dụng các bộ lọc khác
  if (currentFilter !== "all") {
    filteredData = filteredData.filter(
      (staff) => staff.status === currentFilter
    );
  }
  if (currentDepartmentFilter !== "all") {
    filteredData = filteredData.filter(
      (staff) => staff.department === currentDepartmentFilter
    );
  }

  tbody.innerHTML = filteredData
    .map(
      (staff) => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23${getRandomColor()}'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3E${getInitials(
        staff.name
      )}%3C/text%3E%3C/svg%3E" alt="">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${
                              staff.name
                            }</div>
                            <div class="text-sm text-gray-500">${
                              staff.email
                            }</div>
                            <div class="text-sm text-gray-500">${
                              staff.phone
                            }</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${
                      staff.position
                    }</div>
                    <div class="text-sm text-gray-500">${staff.department}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                      staff.status
                    )}">
                        ${getStatusText(staff.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(
                  staff.joinDate
                )}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatCurrency(
                  staff.salary
                )}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">${
                          staff.performance
                        }%</div>
                        <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${
                              staff.performance
                            }%"></div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="viewStaff(${
                      staff.id
                    })" class="text-blue-600 hover:text-blue-900">Xem</button>
                    <button onclick="editStaff(${
                      staff.id
                    })" class="text-green-600 hover:text-green-900">Sửa</button>
                    <button onclick="deleteStaff(${
                      staff.id
                    })" class="text-red-600 hover:text-red-900">Xóa</button>
                </td>
            </tr>
        `
    )
    .join("");
}

/**
 * Thêm nhân viên mới vào danh sách
 * Lấy dữ liệu từ form và thêm vào mảng staffData
 */
function addNewStaff() {
  const form = document.getElementById("addStaffForm");
  if (!form) return;

  const formData = new FormData(form);
  const newStaff = {
    id: staffData.length + 1,
    name: formData.get("staffName"),
    email: formData.get("staffEmail"),
    phone: formData.get("staffPhone"),
    position: formData.get("staffPosition"),
    department: formData.get("staffDepartment"),
    joinDate: formData.get("joinDate"),
    salary: parseInt(formData.get("salary")),
    status: "active",
    performance: Math.floor(Math.random() * 20) + 80, // Hiệu suất ngẫu nhiên 80-100%
  };

  staffData.push(newStaff);
  renderStaffTable();
  updateStaffStats();
  hideAddStaffModal();

  alert("Thêm nhân viên thành công!");
}

/**
 * Xem chi tiết thông tin nhân viên
 * @param {number} id - ID của nhân viên
 */
function viewStaff(id) {
  const staff = staffData.find((s) => s.id === id);
  if (staff) {
    alert(
      `Xem chi tiết nhân viên: ${staff.name}\nChức vụ: ${staff.position}\nPhòng ban: ${staff.department}`
    );
  }
}

/**
 * Chỉnh sửa thông tin nhân viên
 * @param {number} id - ID của nhân viên
 */
function editStaff(id) {
  const staff = staffData.find((s) => s.id === id);
  if (staff) {
    const newName = prompt("Nhập tên mới:", staff.name);
    if (newName && newName !== staff.name) {
      staff.name = newName;
      renderStaffTable();
      alert("Cập nhật thông tin thành công!");
    }
  }
}

/**
 * Xóa nhân viên khỏi danh sách
 * @param {number} id - ID của nhân viên
 */
function deleteStaff(id) {
  if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
    staffData = staffData.filter((s) => s.id !== id);
    renderStaffTable();
    updateStaffStats();
    alert("Xóa nhân viên thành công!");
  }
}

/**
 * Xuất dữ liệu nhân viên ra file Excel
 */
function exportStaffData() {
  alert("Chức năng xuất Excel đang được phát triển!");
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
// CLOUDFLARE SECURITY SCRIPT
// ===========================

/**
 * Script tự động load của Cloudflare Challenge Platform
 * Tạo iframe ẩn để load script bảo mật của Cloudflare
 */
// (function () {
//   function c() {
//     var b = a.contentDocument || a.contentWindow.document;
//     if (b) {
//       var d = b.createElement("script");
//       d.innerHTML =
//         "window.__CF$cv$params={r:'9654bd9971420387',t:'MTc1MzU0MTc1NC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
//       b.getElementsByTagName("head")[0].appendChild(d);
//     }
//   }
//   if (document.body) {
//     var a = document.createElement("iframe");
//     a.height = 1;
//     a.width = 1;
//     a.style.position = "absolute";
//     a.style.top = 0;
//     a.style.left = 0;
//     a.style.border = "none";
//     a.style.visibility = "hidden";
//     document.body.appendChild(a);
//     if ("loading" !== document.readyState) c();
//     else if (window.addEventListener)
//       document.addEventListener("DOMContentLoaded", c);
//     else {
//       var e = document.onreadystatechange || function () {};
//       document.onreadystatechange = function (b) {
//         e(b);
//         "loading" !== document.readyState &&
//           ((document.onreadystatechange = e), c());
//       };
//     }
//   }
// })();

// ===========================
// XOÁ TOUR
// ===========================
document.addEventListener("DOMContentLoaded", function () {
  const deleteButtons = document.querySelectorAll(".delete-tour-btn");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", async function () {
      const tourId = this.dataset.id;
      const confirmed = confirm("Bạn có chắc muốn xoá tour này không?");
      if (!confirmed) return;

      try {
        const res = await fetch(`/admin/qly-tour/${tourId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          alert("Xoá tour thành công!");
          window.location.reload();
        } else {
          const err = await res.text();
          alert("Lỗi khi xoá tour: " + err);
        }
      } catch (err) {
        console.error(err);
        alert("Đã có lỗi xảy ra!");
      }
    });
  });
});
