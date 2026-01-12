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
  revenue: "#8B5CF6",
  revenueLight: "rgba(139, 92, 246, 0.1)",
};

async function initDashboardCharts() {
  try {
    const startInput = document.querySelector('input[name="startDate"]');
    const endInput = document.querySelector('input[name="endDate"]');

    const params = new URLSearchParams();
    if (startInput?.value) params.set("startDate", startInput.value);
    if (endInput?.value) params.set("endDate", endInput.value);

    const url = params.toString()
      ? `/api/statistics/dashboard?${params.toString()}`
      : `/api/statistics/dashboard`;

    const res = await fetch(url, { credentials: "include" });
    const payload = await res.json();
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || "Không thể tải dữ liệu dashboard");
    }

    const data = payload.data;
    if (!data) return;

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setText(
      "monthlyRevenue",
      (data.metrics?.monthlyRevenue || 0).toLocaleString("vi-VN")
    );
    setText("totalBookings", data.metrics?.totalBookings || 0);
    setText("avgCapacity", `${data.metrics?.avgCapacity ?? 0}%`);
    setText("newCustomers", data.metrics?.newCustomers || 0);

    const embeddedRevenueData = data.charts?.revenue;
    const embeddedPopularTours = data.charts?.popularTours || [];

    const revenueCtx = document.getElementById("revenueChart");
    if (revenueCtx && embeddedRevenueData) {
      new Chart(revenueCtx, {
        type: "line",
        data: {
          labels: embeddedRevenueData.labels,
          datasets: [
            {
              label: "Doanh thu (VNĐ)",
              data: embeddedRevenueData.revenues,
              borderColor: CHART_COLORS.revenue,
              backgroundColor: CHART_COLORS.revenueLight,
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: CHART_COLORS.revenue,
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return (value / 1000000).toFixed(0) + "M";
                },
              },
            },
          },
        },
      });
    }

    const popularCtx = document.getElementById("popularToursChart");
    if (popularCtx && embeddedPopularTours.length > 0) {
      const topTours = embeddedPopularTours.slice(0, 5);

      new Chart(popularCtx, {
        type: "bar",
        data: {
          labels: topTours.map((tour) => tour.name),
          datasets: [
            {
              label: "Số lượng đặt tour",
              data: topTours.map((tour) => tour.bookingCount),
              backgroundColor: CHART_COLORS.primary.slice(0, topTours.length),
              borderRadius: 8,
            },
          ],
        },
        options: {
          indexAxis: "x",
          responsive: true,
          maintainAspectRatio: false,
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
                label: (context) => {
                  return `Số lượng: ${context.parsed.y}`;
                },
              },
            },
          },
          scales: {
            x: {
              display: false,
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      });
    }

    renderTopTours(data.lists?.topTours || []);
    renderTopVIPCustomers(data.lists?.topVIPCustomers || []);
  } catch (error) {
    console.error("Lỗi khởi tạo biểu đồ dashboard:", error);
  }
}

function renderTopTours(tours) {
  const container = document.getElementById("topExpensiveTours");
  if (!container) return;
  container.innerHTML = "";

  tours.slice(0, 10).forEach((tour, index) => {
    const isTopThree = index < 3;

    let rankColor = "gray";
    let bgColor = "white";
    let borderColor = "gray-100";
    if (index === 0) {
      rankColor = "yellow";
      bgColor = "yellow-50";
      borderColor = "yellow-500";
    } else if (index === 1) {
      rankColor = "purple";
      bgColor = "purple-50";
      borderColor = "purple-400";
    } else if (index === 2) {
      rankColor = "blue";
      bgColor = "blue-50";
      borderColor = "blue-500";
    }

    const div = document.createElement("div");
    div.className = `flex items-center ${
      isTopThree
        ? `p-4 bg-${bgColor} rounded-lg border-l-4 border-${borderColor}`
        : "p-3 bg-white rounded-lg hover:bg-gray-50 transition border border-gray-100"
    }`;

    const totalRevenue = (tour.totalRevenue || 0).toLocaleString("vi-VN");

    div.innerHTML = `
      <div class="flex-shrink-0 w-12">
        <span class="${
          isTopThree ? "text-xl" : "text-sm"
        } font-bold text-${rankColor}-600">#${index + 1}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-${
          isTopThree ? "semibold" : "medium"
        } text-gray-900 truncate">
          ${tour.tourName || ""}
        </p>
      </div>
      <div class="flex-shrink-0 text-right ml-4">
        <p class="text-sm font-bold text-gray-900">
          ${totalRevenue} VNĐ
        </p>
        <p class="text-xs text-gray-500">${tour.bookingCount || 0} tour</p>
      </div>
    `;

    container.appendChild(div);
  });
}

function renderTopVIPCustomers(customers) {
  const container = document.getElementById("topVIPCustomers");
  if (!container) return;
  container.innerHTML = "";

  customers.slice(0, 10).forEach((customer, index) => {
    const isTopThree = index < 3;

    let rankColor = "gray";
    let bgColor = "white";
    let borderColor = "gray-100";
    if (index === 0) {
      rankColor = "yellow";
      bgColor = "yellow-50";
      borderColor = "yellow-500";
    } else if (index === 1) {
      rankColor = "purple";
      bgColor = "purple-50";
      borderColor = "purple-400";
    } else if (index === 2) {
      rankColor = "blue";
      bgColor = "blue-50";
      borderColor = "blue-500";
    }

    const div = document.createElement("div");
    div.className = `flex items-center ${
      isTopThree
        ? `p-4 bg-${bgColor} rounded-lg border-l-4 border-${borderColor}`
        : "p-3 bg-white rounded-lg hover:bg-gray-50 transition border border-gray-100"
    }`;

    const totalSpent = (customer.totalSpent || 0).toLocaleString("vi-VN");

    div.innerHTML = `
      <div class="flex-shrink-0 w-12">
        <span class="${
          isTopThree ? "text-xl" : "text-sm"
        } font-bold text-${rankColor}-600">#${index + 1}</span>
      </div>
      <div class="flex items-center flex-1 min-w-0 ml-3">
        <div class="ml-3 flex-1 min-w-0">
          <p class="text-sm font-${
            isTopThree ? "semibold" : "medium"
          } text-gray-900 truncate">
            ${customer.userName || ""}
          </p>
        </div>
      </div>
      <div class="flex-shrink-0 text-right ml-4">
        <p class="text-sm font-bold text-gray-900">
          ${totalSpent} VNĐ
        </p>
        <p class="text-xs text-gray-500">${customer.bookingCount || 0} đơn</p>
      </div>
    `;

    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", initDashboardCharts);

document.addEventListener("DOMContentLoaded", () => {
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
      ? `/admin/dashboard?${query}`
      : `/admin/dashboard`;
  });
});
