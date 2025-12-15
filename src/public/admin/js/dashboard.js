import { API_BASE_URL } from "./utils.js";

// ===========================
// DASHBOARD CHARTS INITIALIZATION
// ===========================

async function initDashboardCharts() {
  try {
    // Check if data is embedded in page (from server)
    const embeddedRevenueData = window.dashboardData?.revenueData;
    const embeddedPopularTours = window.dashboardData?.popularTours;

    if (!embeddedRevenueData || !embeddedPopularTours) {
      console.warn("Dashboard data not found in page");
      return;
    }

    // Initialize Revenue Chart
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
              borderColor: "#3B82F6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: "#3B82F6",
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

    // Initialize Popular Tours Chart
    const popularCtx = document.getElementById("popularToursChart");
    if (popularCtx && embeddedPopularTours.length > 0) {
      const topTours = embeddedPopularTours.slice(0, 8);

      new Chart(popularCtx, {
        type: "bar",
        data: {
          labels: topTours.map((tour) => tour.name),
          datasets: [
            {
              label: "Số lượng đặt tour",
              data: topTours.map((tour) => tour.bookingCount),
              backgroundColor: [
                "#FCD34D",
                "#C084FC",
                "#60A5FA",
                "#34D399",
                "#F87171",
                "#FBBF24",
                "#818CF8",
                "#14B8A6",
              ],
              borderRadius: 8,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            x: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Lỗi khởi tạo biểu đồ dashboard:", error);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initDashboardCharts);
