// ===========================
// THỐNG KÊ CHARTS INITIALIZATION
// ===========================

async function initStatisticsCharts() {
  try {
    const data = window.statisticsData;

    if (!data) {
      console.error("Statistics data not found in window object");
      return;
    }

    // Hiển thị các KPI
    displayKPIs(data.kpis);

    // Khởi tạo biểu đồ xu hướng theo mùa (Bar Chart)
    initSeasonalTrendsChart(data.seasonalTrends);

    // Khởi tạo biểu đồ phân loại tour (Doughnut)
    initTourTypeChart(data.tourTypes);

    // Khởi tạo biểu đồ trạng thái đơn (Pie)
    initBookingStatusChart(data.bookingStatus);

    // Hiển thị bảng hiệu suất tour
    populatePerformanceTable(data.topTours);
  } catch (error) {
    console.error("Lỗi khởi tạo biểu đồ thống kê:", error);
  }
}

// Hiển thị các KPI
function displayKPIs(kpis) {
  try {
    const avgDailyEl = document.getElementById("avgDailyRevenue");
    if (avgDailyEl) {
      avgDailyEl.textContent = `${(kpis.avgDailyRevenue / 1000000).toFixed(
        1
      )}M VNĐ`;
    }

    const avgOrderEl = document.getElementById("avgOrderValue");
    if (avgOrderEl) {
      avgOrderEl.textContent = `${(kpis.avgOrderValue / 1000000).toFixed(
        1
      )}M VNĐ`;
    }

    const totalRevenueEl = document.getElementById("totalRevenue");
    if (totalRevenueEl) {
      totalRevenueEl.textContent = `${(kpis.totalRevenue / 1000000).toFixed(
        1
      )}M VNĐ`;
    }

    const repeatRateEl = document.getElementById("repeatRate");
    if (repeatRateEl) {
      repeatRateEl.textContent = `${kpis.repeatRate}%`;
    }
  } catch (error) {
    console.error("Lỗi hiển thị KPI:", error);
  }
}

// Biểu đồ xu hướng theo mùa (Bar Chart)
function initSeasonalTrendsChart(seasonalData) {
  const ctx = document.getElementById("bookingTrendsChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: seasonalData.labels,
      datasets: [
        {
          label: "Phần trăm (%)",
          data: seasonalData.percentages,
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // Xuân - Xanh dương
            "rgba(249, 115, 22, 0.8)", // Hạ - Cam
            "rgba(234, 179, 8, 0.8)", // Thu - Vàng
            "rgba(147, 197, 253, 0.8)", // Đông - Xanh nhạt
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(249, 115, 22)",
            "rgb(234, 179, 8)",
            "rgb(147, 197, 253)",
          ],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.parsed.y.toFixed(1) + "%";
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
          title: {
            display: true,
            text: "Tỷ lệ (%)",
          },
        },
      },
    },
  });
}

// Biểu đồ phân loại tour (Doughnut)
function initTourTypeChart(tourTypes) {
  const ctx = document.getElementById("tourTypeChart");
  if (!ctx || !tourTypes || tourTypes.length === 0) return;

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#6366F1",
  ];

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: tourTypes.map((item) => item.label || "Chưa phân loại"),
      datasets: [
        {
          data: tourTypes.map((item) => item.count),
          backgroundColor: colors.slice(0, tourTypes.length),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = tourTypes[context.dataIndex].percentage;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// Biểu đồ trạng thái đơn (Pie)
function initBookingStatusChart(bookingStatus) {
  const ctx = document.getElementById("bookingStatusChart");
  if (!ctx || !bookingStatus || bookingStatus.length === 0) return;

  const statusColors = {
    cancelled: "#F87171",
    refunded: "#FCD34D",
    completed: "#34D399",
  };

  const statusLabels = {
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
    completed: "Đã hoàn thành",
  };

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: bookingStatus.map(
        (item) => statusLabels[item.label] || item.label
      ),
      datasets: [
        {
          data: bookingStatus.map((item) => item.count),
          backgroundColor: bookingStatus.map(
            (item) => statusColors[item.label] || "#9CA3AF"
          ),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = bookingStatus[context.dataIndex].percentage;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// Hiển thị bảng hiệu suất tour
function populatePerformanceTable(tours) {
  try {
    const tableBody = document.getElementById("tourPerformanceTable");
    if (!tableBody || !tours || tours.length === 0) return;

    tableBody.innerHTML = "";

    tours.slice(0, 5).forEach((tour) => {
      const row = document.createElement("tr");
      const isGrowing = tour.trendDirection === "up";
      const trendColor = isGrowing ? "text-green-600" : "text-red-600";
      const trendIcon = isGrowing ? "↗ +" : "↘ -";

      row.innerHTML = `
        <td class="px-4 py-4 text-sm font-medium text-gray-900">
          ${tour.tourName}
        </td>
        <td class="px-4 py-4 text-sm text-gray-900">${
          tour.bookingCount
        } chỗ</td>
        <td class="px-4 py-4 text-sm text-gray-900">${(
          tour.totalRevenue / 1000000
        ).toFixed(1)}M VNĐ</td>
        <td class="px-4 py-4 text-sm text-gray-900">${tour.capacityRate}%</td>
        <td class="px-4 py-4 text-sm ${trendColor}">
          ${trendIcon}${tour.trendPercent}%
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi điền bảng hiệu suất:", error);
  }
}

// Xử lý thay đổi khoảng thời gian
function handleTimeRangeChange() {
  const selectElement = document.querySelector('select[name="timeRange"]');
  if (selectElement) {
    selectElement.addEventListener("change", function () {
      const days = this.value;
      window.location.href = `/admin/thong-ke?days=${days}`;
    });
  }
}

// Khởi tạo khi DOM ready
document.addEventListener("DOMContentLoaded", function () {
  initStatisticsCharts();
  handleTimeRangeChange();
});
