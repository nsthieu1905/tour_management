// ============================================
// STATE MANAGEMENT
// ============================================
let currentPage = 1;
let totalPages = 1;
let pageSize = 10;
let currentStatus = "pre_pending";
let currentFilters = {
  startDate: "",
  endDate: "",
  tour: "",
  search: "",
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format date
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateStr).toLocaleDateString("vi-VN", options);
}

// Format price
function formatPrice(price) {
  if (!price) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN").format(Math.round(price)) + " VNĐ";
}

// Get status badge
function getStatusBadge(status) {
  const badges = {
    pre_pending:
      '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full">Chờ thanh toán</span>',
    pending:
      '<span class="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">Chờ xác nhận</span>',
    confirmed:
      '<span class="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">Đã xác nhận</span>',
    refund_requested:
      '<span class="bg-orange-100 text-orange-800 px-2 py-1 text-xs font-medium rounded-full">Yêu cầu hoàn tiền</span>',
    refunded:
      '<span class="bg-purple-100 text-purple-800 px-2 py-1 text-xs font-medium rounded-full">Đã hoàn tiền</span>',
    completed:
      '<span class="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">Hoàn thành</span>',
    cancelled:
      '<span class="bg-red-100 text-red-800 px-2 py-1 text-xs font-medium rounded-full">Đã hủy</span>',
  };
  return badges[status] || status;
}

// Show loading state
function showLoading() {
  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="8" class="px-6 py-8 text-center">
        <div class="flex items-center justify-center">
          <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="ml-2 text-gray-600">Đang tải...</span>
        </div>
      </td>
    </tr>
  `;
}

// ============================================
// API FUNCTIONS
// ============================================

// Fetch bookings with filters
async function fetchBookings(page = 1, status = currentStatus) {
  try {
    showLoading();

    // Build query params
    const params = new URLSearchParams({
      page: page,
      limit: pageSize,
      status: status,
    });

    // Add filters if they exist
    if (currentFilters.search) {
      params.append("search", currentFilters.search);
    }
    if (currentFilters.startDate) {
      params.append("startDate", currentFilters.startDate);
    }
    if (currentFilters.endDate) {
      params.append("endDate", currentFilters.endDate);
    }
    if (currentFilters.tour) {
      params.append("tour", currentFilters.tour);
    }

    const response = await fetch(`/api/admin/bookings/all?${params}`);
    const result = await response.json();

    if (result.success) {
      renderBookings(result.data);
      currentPage = result.pagination.page;
      totalPages = result.pagination.pages;
      updatePagination(result.pagination);
    } else {
      throw new Error(result.message || "Không thể tải dữ liệu");
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    const tbody = document.getElementById("bookingsTableBody");
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-4 text-center text-red-600">
          Lỗi: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Fetch all counts for badge updates
async function fetchAllCounts() {
  try {
    const statuses = [
      "pre_pending",
      "pending",
      "confirmed",
      "refund_requested",
      "refunded",
      "completed",
      "cancelled",
    ];

    for (const status of statuses) {
      const response = await fetch(
        `/api/admin/bookings/all?page=1&limit=1&status=${status}`
      );
      const result = await response.json();

      if (result.success) {
        updateBadgeCount(status, result.pagination.total);
      }
    }
  } catch (error) {
    console.error("Error fetching counts:", error);
  }
}

// Update badge count
function updateBadgeCount(status, count) {
  const tab = document.querySelector(`[data-status="${status}"]`);
  if (tab) {
    const badge = tab.querySelector("span");
    if (badge) {
      badge.textContent = count;
      // Highlight refund_requested if count > 0
      if (status === "refund_requested" && count > 0) {
        badge.classList.remove("bg-gray-200", "text-gray-700");
        badge.classList.add("bg-red-200", "text-red-700", "font-bold");
      }
    }
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

// Render bookings table
function renderBookings(bookings) {
  const tbody = document.getElementById("bookingsTableBody");

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-4 text-center text-gray-500">
          Không có đơn đặt tour nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = bookings
    .map(
      (booking) => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${booking.bookingCode || "N/A"}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div>
            <div class="text-sm font-medium text-gray-900">
              ${booking.contactInfo?.name || "N/A"}
            </div>
            <div class="text-sm text-gray-500">
              ${booking.contactInfo?.phone || "N/A"}
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${booking.tourId?.name || "N/A"}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${formatDate(booking.departureDate)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${booking.numberOfPeople || 0} người
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${formatPrice(booking.totalAmount)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${getStatusBadge(booking.bookingStatus)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          ${renderActions(booking)}
        </td>
      </tr>
    `
    )
    .join("");
}

// Render action buttons based on status
function renderActions(booking) {
  const id = booking._id;
  let actions = "";

  switch (booking.bookingStatus) {
    case "pre_pending":
      actions += `<button class="text-green-600 hover:text-green-900 text-xs" onclick="confirmPayment('${id}')">Thanh toán</button>`;
      actions += `<button class="text-red-600 hover:text-red-900 text-xs ml-2" onclick="cancelBooking('${id}')">Hủy</button>`;
      break;

    case "pending":
      actions += `<button class="text-green-600 hover:text-green-900 text-xs" onclick="confirmBooking('${id}')">Xác nhận</button>`;
      actions += `<button class="text-red-600 hover:text-red-900 text-xs ml-2" onclick="cancelBooking('${id}')">Hủy</button>`;
      break;

    case "confirmed":
      actions += `<button class="text-blue-600 hover:text-blue-900 text-xs" onclick="completeBooking('${id}')">Hoàn thành</button>`;
      break;

    case "refund_requested":
      actions += `<button class="text-green-600 hover:text-green-900 text-xs" onclick="approveRefund('${id}')">Duyệt</button>`;
      actions += `<button class="text-red-600 hover:text-red-900 text-xs ml-2" onclick="rejectRefund('${id}')">Từ chối</button>`;
      break;

    case "completed":
    case "refunded":
    case "cancelled":
      actions += `<button class="text-blue-600 hover:text-blue-900 text-xs" onclick="viewBooking('${id}')">Xem</button>`;
      break;

    default:
      actions += `<span class="text-gray-600 text-xs">-</span>`;
  }

  return actions;
}

// Update pagination
function updatePagination(pagination) {
  const start = Math.max((pagination.page - 1) * pagination.limit + 1, 0);
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  document.getElementById("recordStart").textContent =
    pagination.total > 0 ? start : 0;
  document.getElementById("recordEnd").textContent = end;
  document.getElementById("recordTotal").textContent = pagination.total;

  // Update pagination nav
  const paginationNav = document.getElementById("paginationNav");
  let html = "";

  // Previous button
  html += `
    <button
      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
        pagination.page === 1 ? "opacity-50 cursor-not-allowed" : ""
      }"
      onclick="goToPage(${pagination.page - 1})"
      ${pagination.page === 1 ? "disabled" : ""}
    >
      ←
    </button>
  `;

  // Page numbers (show max 5 pages)
  const maxPages = 5;
  let startPage = Math.max(1, pagination.page - Math.floor(maxPages / 2));
  let endPage = Math.min(pagination.pages, startPage + maxPages - 1);

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  if (startPage > 1) {
    html += `
      <button
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        onclick="goToPage(1)"
      >
        1
      </button>
    `;
    if (startPage > 2) {
      html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === pagination.page) {
      html += `
        <button
          class="relative inline-flex items-center px-4 py-2 border border-blue-300 bg-blue-50 text-sm font-medium text-blue-600"
        >
          ${i}
        </button>
      `;
    } else {
      html += `
        <button
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          onclick="goToPage(${i})"
        >
          ${i}
        </button>
      `;
    }
  }

  if (endPage < pagination.pages) {
    if (endPage < pagination.pages - 1) {
      html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
    }
    html += `
      <button
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        onclick="goToPage(${pagination.pages})"
      >
        ${pagination.pages}
      </button>
    `;
  }

  // Next button
  html += `
    <button
      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
        pagination.page === pagination.pages
          ? "opacity-50 cursor-not-allowed"
          : ""
      }"
      onclick="goToPage(${pagination.page + 1})"
      ${pagination.page === pagination.pages ? "disabled" : ""}
    >
      →
    </button>
  `;

  paginationNav.innerHTML = html;

  // Update mobile buttons
  const prevBtnMobile = document.getElementById("prevBtnMobile");
  const nextBtnMobile = document.getElementById("nextBtnMobile");

  if (prevBtnMobile) prevBtnMobile.disabled = pagination.page === 1;
  if (nextBtnMobile)
    nextBtnMobile.disabled = pagination.page === pagination.pages;
}

// ============================================
// ACTION HANDLERS
// ============================================

function confirmPayment(bookingId) {
  if (confirm("Xác nhận thanh toán tại quầy cho đơn này?")) {
    fetch(`/api/admin/bookings/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert("Xác nhận thanh toán thành công!");
          fetchBookings(currentPage, currentStatus);
          fetchAllCounts();
        } else {
          alert("Lỗi: " + res.message);
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối: " + err.message);
      });
  }
}

function confirmBooking(bookingId) {
  if (confirm("Xác nhận đơn đặt tour này?")) {
    fetch(`/api/admin/bookings/confirm-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert("Xác nhận đơn thành công! Email đã được gửi.");
          fetchBookings(currentPage, currentStatus);
          fetchAllCounts();
        } else {
          alert("Lỗi: " + res.message);
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối: " + err.message);
      });
  }
}

function completeBooking(bookingId) {
  if (confirm("Hoàn thành tour này?")) {
    fetch(`/api/admin/bookings/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert("Hoàn thành tour! Email cảm ơn đã được gửi.");
          fetchBookings(currentPage, currentStatus);
          fetchAllCounts();
        } else {
          alert("Lỗi: " + res.message);
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối: " + err.message);
      });
  }
}

function approveRefund(bookingId) {
  const refundPercentage = prompt("Nhập % hoàn tiền (0-100):", "50");
  if (refundPercentage !== null && refundPercentage !== "") {
    const percentage = parseInt(refundPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert("Vui lòng nhập số hợp lệ từ 0-100");
      return;
    }

    fetch(`/api/admin/bookings/approve-refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        refundPercentage: percentage,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert("Duyệt hoàn tiền thành công! Email đã được gửi.");
          fetchBookings(currentPage, currentStatus);
          fetchAllCounts();
        } else {
          alert("Lỗi: " + res.message);
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối: " + err.message);
      });
  }
}

function rejectRefund(bookingId) {
  const reason = prompt("Nhập lý do từ chối:");
  if (reason !== null && reason.trim() !== "") {
    fetch(`/api/admin/bookings/reject-refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rejectionReason: reason }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert("Từ chối hoàn tiền! Email đã được gửi.");
          fetchBookings(currentPage, currentStatus);
          fetchAllCounts();
        } else {
          alert("Lỗi: " + res.message);
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối: " + err.message);
      });
  }
}

function cancelBooking(bookingId) {
  const reason = prompt("Nhập lý do hủy:");
  if (reason !== null && reason.trim() !== "") {
    fetch(`/api/admin/bookings/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, reason }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          alert("Hủy đơn thành công!");
          fetchBookings(currentPage, currentStatus);
          fetchAllCounts();
        } else {
          alert("Lỗi: " + res.message);
        }
      })
      .catch((err) => {
        alert("Lỗi kết nối: " + err.message);
      });
  }
}

function viewBooking(bookingId) {
  window.location.href = `/api/bookings/${bookingId}`;
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function goToPage(page) {
  if (page > 0 && page <= totalPages) {
    fetchBookings(page, currentStatus);
  }
}

function switchTab(status) {
  currentStatus = status;
  currentPage = 1;

  // Update tab styles
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    if (btn.getAttribute("data-status") === status) {
      btn.classList.add("border-blue-600", "text-blue-600");
      btn.classList.remove("text-gray-600", "border-transparent");
    } else {
      btn.classList.remove("border-blue-600", "text-blue-600");
      btn.classList.add("text-gray-600", "border-transparent");
    }
  });

  fetchBookings(1, status);
}

function applyFilters() {
  currentPage = 1;
  currentFilters.startDate =
    document.getElementById("filterStartDate")?.value || "";
  currentFilters.endDate =
    document.getElementById("filterEndDate")?.value || "";
  currentFilters.tour = document.getElementById("filterTour")?.value || "";
  currentFilters.search = document.getElementById("filterSearch")?.value || "";

  fetchBookings(1, currentStatus);
}

function resetFilters() {
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  document.getElementById("filterTour").value = "";
  document.getElementById("filterSearch").value = "";

  currentFilters = {
    startDate: "",
    endDate: "",
    tour: "",
    search: "",
  };

  fetchBookings(1, currentStatus);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Page size change
document.getElementById("pageSizeSelect")?.addEventListener("change", (e) => {
  pageSize = parseInt(e.target.value);
  currentPage = 1;
  fetchBookings(1, currentStatus);
});

// Tab clicks
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const status = btn.getAttribute("data-status");
    switchTab(status);
  });
});

// Mobile pagination
document.getElementById("prevBtnMobile")?.addEventListener("click", () => {
  if (currentPage > 1) goToPage(currentPage - 1);
});

document.getElementById("nextBtnMobile")?.addEventListener("click", () => {
  if (currentPage < totalPages) goToPage(currentPage + 1);
});

// Filter inputs - debounce search
let searchTimeout;
document.getElementById("filterSearch")?.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
});

// Date filters
document
  .getElementById("filterStartDate")
  ?.addEventListener("change", applyFilters);
document
  .getElementById("filterEndDate")
  ?.addEventListener("change", applyFilters);
document.getElementById("filterTour")?.addEventListener("change", applyFilters);

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  // Set initial active tab
  const initialTab = document.querySelector('[data-status="pre_pending"]');
  if (initialTab) {
    initialTab.classList.add("border-blue-600", "text-blue-600");
    initialTab.classList.remove("text-gray-600", "border-transparent");
  }

  // Initial data load
  fetchBookings(1, currentStatus);
  fetchAllCounts();
});
