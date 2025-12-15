const CHART_COLORS = {
  primary: [
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#15c739ff",
    "#06B6D4",
    "#3B82F6",
    "#EF4444",
    "#6366F1",
  ],
  status: {
    cancelled: "#EF4444",
    refunded: "#f0e516f8",
    completed: "#2138ceff",
  },
};

async function initStatisticsCharts() {
  try {
    const data = window.statisticsData;

    if (!data) {
      console.error("Statistics data not found in window object");
      return;
    }

    displayKPIs(data.kpis);
    initSeasonalTrendsChart(data.seasonalTrends);
    initTourTypeChart(data.tourTypes);
    initBookingStatusChart(data.bookingStatus);
    populatePerformanceTable(data.topTours);
  } catch (error) {
    console.error("Lỗi khởi tạo biểu đồ thống kê:", error);
  }
}

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

function initSeasonalTrendsChart(seasonalData) {
  const ctx = document.getElementById("bookingTrendsChart");
  if (!ctx) return;

  const seasonColors = CHART_COLORS.primary.slice(0, 4);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: seasonalData.labels,
      datasets: [
        {
          label: "Phần trăm (%)",
          data: seasonalData.percentages,
          backgroundColor: seasonColors,
          borderColor: seasonColors,
          borderWidth: 0,
          borderRadius: {
            topLeft: 6,
            topRight: 6,
          },
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
              const percentage = context.parsed.y.toFixed(1);
              const tourCount = seasonalData.tourCounts
                ? seasonalData.tourCounts[context.dataIndex]
                : 0;
              return [`${percentage}%`, `${tourCount} tour`];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            display: false,
          },
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
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

function initTourTypeChart(tourTypes) {
  const ctx = document.getElementById("tourTypeChart");
  if (!ctx || !tourTypes || tourTypes.length === 0) return;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: tourTypes.map((item) => item.label || "Chưa phân loại"),
      datasets: [
        {
          data: tourTypes.map((item) => item.count),
          backgroundColor: CHART_COLORS.primary.slice(0, tourTypes.length),
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

function initBookingStatusChart(bookingStatus) {
  const ctx = document.getElementById("bookingStatusChart");
  if (!ctx || !bookingStatus || bookingStatus.length === 0) return;

  const statusLabels = {
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
    completed: "Đã hoàn thành",
  };

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: bookingStatus.map(
        (item) => statusLabels[item.label] || item.label
      ),
      datasets: [
        {
          data: bookingStatus.map((item) => item.count),
          backgroundColor: bookingStatus.map(
            (item) => CHART_COLORS.status[item.label] || "#9CA3AF"
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

function handleTimeRangeChange() {
  const selectElement = document.querySelector('select[name="timeRange"]');
  if (selectElement) {
    selectElement.addEventListener("change", function () {
      const days = this.value;
      window.location.href = `/admin/thong-ke?days=${days}`;
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initStatisticsCharts();
  handleTimeRangeChange();
});
