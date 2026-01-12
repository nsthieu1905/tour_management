const CHART_COLORS = {
  primary: [
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
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
  revenue: "#8B5CF6",
  revenueLight: "rgba(139, 92, 246, 0.1)",
};

const chartInstances = {
  seasonalTrends: null,
  tourType: null,
  bookingStatus: null,
};

function initStatisticsCharts() {
  setupResizeListener();
  handleTimeRangeChange();

  loadStatisticsData();
}

async function loadStatisticsData() {
  try {
    const startInput = document.querySelector('input[name="startDate"]');
    const endInput = document.querySelector('input[name="endDate"]');

    const params = new URLSearchParams();
    if (startInput?.value) params.set("startDate", startInput.value);
    if (endInput?.value) params.set("endDate", endInput.value);

    const url = params.toString()
      ? `/api/statistics/thong-ke?${params.toString()}`
      : `/api/statistics/thong-ke`;

    const res = await fetch(url, { credentials: "include" });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || "Không thể tải dữ liệu thống kê");
    }

    const data = payload.data;
    if (!data) return;

    displayKPIs(data.kpis);
    initSeasonalTrendsChart(data.seasonalTrends);
    initTourTypeChart(data.tourTypes);
    initBookingStatusChart(data.bookingStatus);
    populatePerformanceTable(data.topTours);
  } catch (error) {
    console.error("Load statistics data error:", error);
  }
}

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
          label: "Phần trăm đặt tour",
          data: seasonalData.labels.map(() => 0),
          backgroundColor: CHART_COLORS.primary.slice(0, 4),
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        delay: (context) => {
          let delay = 0;
          if (context.type === "data" && context.mode === "default") {
            delay = context.dataIndex * 150;
          }
          return delay;
        },
        duration: 800,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (context) => {
              return context[0].label;
            },
            label: (ctx) => {
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

  chartInstances.seasonalTrends.data.datasets[0].data =
    seasonalData.percentages;
  chartInstances.seasonalTrends.update();
}

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
          data: tourTypes.map(() => 0),
          backgroundColor: CHART_COLORS.primary,
          borderWidth: 4,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (context) => {
              return context[0].label;
            },
            label: (ctx) => {
              const t = tourTypes[ctx.dataIndex];
              return `Số lượng: ${t.count} (${t.percentage}%)`;
            },
          },
        },
      },
    },
  });

  setTimeout(() => {
    chartInstances.tourType.data.datasets[0].data = tourTypes.map(
      (t) => t.count
    );
    chartInstances.tourType.update();
  }, 100);
}

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
          data: bookingStatus.map(() => 0),
          backgroundColor: bookingStatus.map(
            (b) => CHART_COLORS.status[b.label] || "#9CA3AF"
          ),
          borderWidth: 4,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (context) => {
              return context[0].label;
            },
            label: (ctx) => {
              const b = bookingStatus[ctx.dataIndex];
              return `Số lượng: ${b.count} (${b.percentage}%)`;
            },
          },
        },
      },
    },
  });

  chartInstances.bookingStatus.data.datasets[0].data = bookingStatus.map(
    (b) => b.count
  );
  chartInstances.bookingStatus.update();
}

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

function setupResizeListener() {
  window.addEventListener("resize", () => {
    Object.values(chartInstances).forEach((chart) => chart?.resize());
  });
}

function handleTimeRangeChange() {
  const startInput = document.querySelector('input[name="startDate"]');
  const endInput = document.querySelector('input[name="endDate"]');
  const applyBtn = document.getElementById("applyDateRange");
  if (!startInput || !endInput || !applyBtn) return;

  applyBtn.addEventListener("click", () => {
    const startDate = startInput.value;
    const endDate = endInput.value;

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const query = params.toString();
    window.location.href = query
      ? `/admin/thong-ke?${query}`
      : `/admin/thong-ke`;
  });
}

document.addEventListener("DOMContentLoaded", initStatisticsCharts);
