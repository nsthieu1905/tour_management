// ===========================
// QUẢN LÝ BIỂU ĐỒ THỐNG KÊ
// ===========================

/**
 * Khởi tạo các biểu đồ Chart.js
 * Tạo 4 biểu đồ: Doanh thu, Tour phổ biến, Theo mùa, Theo điểm đến
 */
function initCharts() {
  // Biểu đồ Doanh thu
  const revenueCtx = document.getElementById("revenueChart");
  if (revenueCtx) {
    new Chart(revenueCtx.getContext("2d"), {
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
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  // Biểu đồ Tour phổ biến
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
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }

  // Biểu đồ Theo mùa
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
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  // Biểu đồ Điểm đến
  const destinationCtx = document.getElementById("destinationChart");
  if (destinationCtx) {
    new Chart(destinationCtx.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Miền Bắc", "Miền Trung", "Miền Nam", "Quốc tế"],
        datasets: [
          {
            data: [35, 28, 25, 12],
            backgroundColor: ["#667eea", "#10b981", "#f59e0b", "#ef4444"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  }
}
