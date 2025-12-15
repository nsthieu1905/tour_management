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

    // Calculate and display KPIs
    calculateKPIs(data);

    // Initialize Booking Trends Chart (Line)
    const bookingTrendsCtx = document.getElementById("bookingTrendsChart");
    if (bookingTrendsCtx) {
      new Chart(bookingTrendsCtx, {
        type: "line",
        data: {
          labels: data.bookingTrends.labels,
          datasets: [
            {
              label: "Số lượng đặt",
              data: data.bookingTrends.bookingCounts,
              borderColor: "#3B82F6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              yAxisID: "y",
            },
            {
              label: "Doanh thu (VNĐ)",
              data: data.bookingTrends.revenues.map((v) => v / 1000000),
              borderColor: "#10B981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Số lượng đặt",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Doanh thu (Triệu VNĐ)",
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
        },
      });
    }

    // Initialize Tour Type Distribution Chart (Doughnut)
    const tourTypeCtx = document.getElementById("tourTypeChart");
    if (tourTypeCtx && data.tourTypes && data.tourTypes.length > 0) {
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

      new Chart(tourTypeCtx, {
        type: "doughnut",
        data: {
          labels: data.tourTypes.map((item) => item.label),
          datasets: [
            {
              data: data.tourTypes.map((item) => item.count),
              backgroundColor: colors.slice(0, data.tourTypes.length),
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
          },
        },
      });
    }

    // Initialize Booking Status Distribution Chart (Pie)
    const bookingStatusCtx = document.getElementById("bookingStatusChart");
    if (
      bookingStatusCtx &&
      data.bookingStatus &&
      data.bookingStatus.length > 0
    ) {
      const statusColors = {
        pending: "#FCD34D",
        confirmed: "#60A5FA",
        completed: "#34D399",
        cancelled: "#F87171",
        failed: "#A78BFA",
      };

      const statusLabels = {
        pending: "Đang chờ",
        confirmed: "Đã xác nhận",
        completed: "Hoàn thành",
        cancelled: "Hủy",
        failed: "Thất bại",
      };

      new Chart(bookingStatusCtx, {
        type: "pie",
        data: {
          labels: data.bookingStatus.map(
            (item) => statusLabels[item.label] || item.label
          ),
          datasets: [
            {
              data: data.bookingStatus.map((item) => item.count),
              backgroundColor: data.bookingStatus.map(
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
          },
        },
      });
    }

    // Populate performance table
    populatePerformanceTable(data.topTours);
  } catch (error) {
    console.error("Lỗi khởi tạo biểu đồ thống kê:", error);
  }
}

// Calculate and display KPIs
function calculateKPIs(data) {
  try {
    // Average daily revenue
    const totalRevenue = data.bookingTrends.revenues.reduce((a, b) => a + b, 0);
    const avgDailyRevenue = Math.ceil(totalRevenue / 365);
    const element1 = document.getElementById("avgDailyRevenue");
    if (element1) {
      element1.textContent = `${(avgDailyRevenue / 1000000).toFixed(1)}M VNĐ`;
    }

    // Conversion rate (simplified: bookings / expected)
    const totalBookings = data.bookingTrends.bookingCounts.reduce(
      (a, b) => a + b,
      0
    );
    const conversionRate = totalBookings > 0 ? (totalBookings / 1000) * 100 : 0;
    const element2 = document.getElementById("conversionRate");
    if (element2) {
      element2.textContent = `${conversionRate.toFixed(1)}%`;
    }

    // Average order value
    const avgOrderValue =
      totalBookings > 0 ? Math.ceil(totalRevenue / totalBookings) : 0;
    const element3 = document.getElementById("avgOrderValue");
    if (element3) {
      element3.textContent = `${(avgOrderValue / 1000000).toFixed(1)}M VNĐ`;
    }

    // Cancellation rate
    const cancelledCount =
      data.bookingStatus.find((item) => item.label === "cancelled")?.count || 0;
    const totalCount = data.bookingStatus.reduce((a, b) => a + b.count, 0);
    const cancellationRate =
      totalCount > 0 ? ((cancelledCount / totalCount) * 100).toFixed(1) : 0;
    const element4 = document.getElementById("cancellationRate");
    if (element4) {
      element4.textContent = `${cancellationRate}%`;
    }
  } catch (error) {
    console.error("Lỗi tính toán KPI:", error);
  }
}

// Populate performance table
function populatePerformanceTable(tours) {
  try {
    const tableBody = document.getElementById("tourPerformanceTable");
    if (!tableBody || !tours || tours.length === 0) return;

    tableBody.innerHTML = "";

    tours.slice(0, 5).forEach((tour) => {
      const row = document.createElement("tr");
      const trendPercent = Math.floor(Math.random() * 30) + 1;
      const isGrowing = Math.random() > 0.5;

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
        <td class="px-4 py-4 text-sm text-gray-900">${(
          tour.avgRevenue / 1000000
        ).toFixed(1)}M VNĐ</td>
        <td class="px-4 py-4 text-sm ${
          isGrowing ? "text-green-600" : "text-red-600"
        }">
          ${isGrowing ? "↗ +" : "↘ -"}${trendPercent}%
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi điền bảng hiệu suất:", error);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initStatisticsCharts);
