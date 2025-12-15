// API Base URL
export const API_BASE_URL = window.location.origin;

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

export { initCharts };
