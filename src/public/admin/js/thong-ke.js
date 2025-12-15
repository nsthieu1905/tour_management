// ===========================
// GLOBAL CHART CONFIG
// ===========================

Chart.defaults.animation = false;
Chart.defaults.animations = false;
Chart.defaults.transitions.active.animation.duration = 0;

// ===========================
// COLOR PALETTE
// ===========================

const CHART_COLORS = {
  primary: [
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#15C739",
    "#06B6D4",
    "#3B82F6",
    "#EF4444",
    "#6366F1",
  ],
  status: {
    cancelled: "#EF4444",
    refunded: "#FACC15",
    completed: "#1D4ED8",
  },
};

// ===========================
// CHART INSTANCES
// ===========================

const chartInstances = {
  seasonalTrends: null,
  tourType: null,
  bookingStatus: null,
};

// ===========================
// MAIN INIT
// ===========================

function initStatisticsCharts() {
  const data = window.statisticsData;
  if (!data) return;

  displayKPIs(data.kpis);

  initSeasonalTrendsChart(data.seasonalTrends);
  initTourTypeChart(data.tourTypes);
  initBookingStatusChart(data.bookingStatus);

  populatePerformanceTable(data.topTours);
  setupResizeListener();
  handleTimeRangeChange();
}

// ===========================
// KPI DISPLAY
// ===========================

function displayKPIs(kpis) {
  if (!kpis) return;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText(
    "avgDailyRevenue",
    `${(kpis.avgDailyRevenue / 1_000_000).toFixed(1)}M VNĐ`
  );
  setText(
    "avgOrderValue",
    `${(kpis.avgOrderValue / 1_000_000).toFixed(1)}M VNĐ`
  );
  setText("totalRevenue", `${(kpis.totalRevenue / 1_000_000).toFixed(1)}M VNĐ`);
  setText("repeatRate", `${kpis.repeatRate}%`);
}

// ===========================
// CHART: SEASONAL TRENDS (BAR)
// ===========================

function initSeasonalTrendsChart(seasonalData) {
  const ctx = document.getElementById("bookingTrendsChart");
  if (!ctx || !seasonalData) return;

  chartInstances.seasonalTrends?.destroy();

  chartInstances.seasonalTrends = new Chart(ctx, {
    type: "bar",
    data: {
      labels: seasonalData.labels,
      datasets: [
        {
          data: seasonalData.percentages,
          backgroundColor: CHART_COLORS.primary.slice(0, 4),
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const value = ctx.parsed.y;
              const count = seasonalData.tourCounts?.[ctx.dataIndex] ?? 0;
              return [`${value}%`, `${count} tour`];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 10,
            callback: (v) => `${v}%`,
          },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

// ===========================
// CHART: TOUR TYPE (DOUGHNUT)
// ===========================

function initTourTypeChart(tourTypes) {
  const ctx = document.getElementById("tourTypeChart");
  if (!ctx || !tourTypes?.length) return;

  chartInstances.tourType?.destroy();

  chartInstances.tourType = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: tourTypes.map((t) => t.label || "Chưa phân loại"),
      datasets: [
        {
          data: tourTypes.map((t) => t.count),
          backgroundColor: CHART_COLORS.primary,
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const t = tourTypes[ctx.dataIndex];
              return `${ctx.label}: ${t.count} (${t.percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// ===========================
// CHART: BOOKING STATUS (DOUGHNUT)
// ===========================

function initBookingStatusChart(bookingStatus) {
  const ctx = document.getElementById("bookingStatusChart");
  if (!ctx || !bookingStatus?.length) return;

  chartInstances.bookingStatus?.destroy();

  const statusLabels = {
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
    completed: "Đã hoàn thành",
  };

  chartInstances.bookingStatus = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: bookingStatus.map((b) => statusLabels[b.label] || b.label),
      datasets: [
        {
          data: bookingStatus.map((b) => b.count),
          backgroundColor: bookingStatus.map(
            (b) => CHART_COLORS.status[b.label] || "#9CA3AF"
          ),
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const b = bookingStatus[ctx.dataIndex];
              return `${ctx.label}: ${b.count} (${b.percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// ===========================
// PERFORMANCE TABLE
// ===========================

function populatePerformanceTable(tours) {
  const tbody = document.getElementById("tourPerformanceTable");
  if (!tbody || !tours?.length) return;

  tbody.innerHTML = "";

  tours.slice(0, 5).forEach((tour) => {
    const isUp = tour.trendDirection === "up";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-4 py-4 text-sm font-medium text-gray-900">
        ${tour.tourName}
      </td>
      <td class="px-4 py-4 text-sm text-gray-900">
        ${tour.bookingCount} chỗ
      </td>
      <td class="px-4 py-4 text-sm text-gray-900">
        ${(tour.totalRevenue / 1_000_000).toFixed(1)}M VNĐ
      </td>
      <td class="px-4 py-4 text-sm text-gray-900">
        ${tour.capacityRate}%
      </td>
      <td class="px-4 py-4 text-sm ${isUp ? "text-green-600" : "text-red-600"}">
        ${isUp ? "↗ +" : "↘ -"}${tour.trendPercent}%
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ===========================
// RESIZE HANDLER
// ===========================

function setupResizeListener() {
  window.addEventListener("resize", () => {
    Object.values(chartInstances).forEach((chart) => chart?.resize());
  });
}

// ===========================
// TIME RANGE HANDLER
// ===========================

function handleTimeRangeChange() {
  const select = document.querySelector('select[name="timeRange"]');
  if (!select) return;

  select.addEventListener("change", function () {
    window.location.href = `/admin/thong-ke?days=${this.value}`;
  });
}

// ===========================
// DOM READY
// ===========================

document.addEventListener("DOMContentLoaded", initStatisticsCharts);
