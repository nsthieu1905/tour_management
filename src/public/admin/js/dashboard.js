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
    const embeddedRevenueData = window.dashboardData?.revenueData;
    const embeddedPopularTours = window.dashboardData?.popularTours;

    if (!embeddedRevenueData || !embeddedPopularTours) {
      console.warn("Dashboard data not found in page");
      return;
    }

    const revenueCtx = document.getElementById("revenueChart");
    if (revenueCtx) {
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
  } catch (error) {
    console.error("Lỗi khởi tạo biểu đồ dashboard:", error);
  }
}

document.addEventListener("DOMContentLoaded", initDashboardCharts);
