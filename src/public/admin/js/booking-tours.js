import { Notification, Modal } from "../../utils/modal.js";

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
  search: "",
};

// ============================================
// SOCKET.IO REAL-TIME UPDATES
// ============================================
let bookingSocket = null;

function initBookingSocket() {
  if (bookingSocket) return;
  bookingSocket = io();

  bookingSocket.on("booking:payment-confirmed", (data) => {
    if (document.getElementById("bookingsTableBody")) {
      fetchBookings(currentPage, currentStatus);
      fetchAllCounts();
    }
  });

  bookingSocket.on("booking:confirmed", (data) => {
    if (document.getElementById("bookingsTableBody")) {
      fetchBookings(currentPage, currentStatus);
      fetchAllCounts();
    }
  });

  bookingSocket.on("booking:completed", (data) => {
    if (document.getElementById("bookingsTableBody")) {
      fetchBookings(currentPage, currentStatus);
      fetchAllCounts();
    }
  });

  bookingSocket.on("booking:refund-requested", (data) => {
    if (document.getElementById("bookingsTableBody")) {
      fetchBookings(currentPage, currentStatus);
      fetchAllCounts();
    }
  });

  bookingSocket.on("booking:refund-approved", (data) => {
    if (document.getElementById("bookingsTableBody")) {
      fetchBookings(currentPage, currentStatus);
      fetchAllCounts();
    }
  });

  bookingSocket.on("booking:cancelled", (data) => {
    if (document.getElementById("bookingsTableBody")) {
      fetchBookings(currentPage, currentStatus);
      fetchAllCounts();
    }
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateStr).toLocaleDateString("vi-VN", options);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price) {
  if (!price) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN").format(Math.round(price)) + " VNĐ";
}

function getStatusBadge(bookingStatus, paymentStatus) {
  if (bookingStatus === "pending" && paymentStatus === "pending") {
    return '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full">Chờ thanh toán</span>';
  } else if (bookingStatus === "pending" && paymentStatus === "paid") {
    return '<span class="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">Chờ xác nhận</span>';
  } else if (bookingStatus === "confirmed") {
    return '<span class="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">Đã xác nhận</span>';
  } else if (bookingStatus === "completed") {
    return '<span class="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">Hoàn thành</span>';
  } else if (bookingStatus === "refund_requested") {
    return '<span class="bg-orange-100 text-orange-800 px-2 py-1 text-xs font-medium rounded-full">Chờ hoàn tiền</span>';
  } else if (bookingStatus === "refunded") {
    return '<span class="bg-yellow-600 text-white px-2 py-1 text-xs font-medium rounded-full">Đã hoàn tiền</span>';
  } else if (bookingStatus === "cancelled") {
    return '<span class="bg-red-100 text-red-800 px-2 py-1 text-xs font-medium rounded-full">Đã hủy</span>';
  }
  return `<span class="bg-gray-100 text-gray-800 px-2 py-1 text-xs font-medium rounded-full">${bookingStatus}</span>`;
}

function calculateRefundInfo(departureDate, totalAmount) {
  if (!departureDate || !totalAmount) {
    return {
      daysUntilDeparture: 0,
      cancellationFeePercent: 100,
      cancellationFee: totalAmount || 0,
      refundAmount: 0,
    };
  }

  const now = new Date();
  const departure = new Date(departureDate);

  if (isNaN(departure.getTime())) {
    return {
      daysUntilDeparture: 0,
      cancellationFeePercent: 100,
      cancellationFee: totalAmount,
      refundAmount: 0,
    };
  }

  const daysUntilDeparture = Math.ceil(
    (departure - now) / (1000 * 60 * 60 * 24),
  );

  let cancellationFeePercent = 0;

  if (daysUntilDeparture >= 30 && daysUntilDeparture <= 45) {
    cancellationFeePercent = 10;
  } else if (daysUntilDeparture >= 20 && daysUntilDeparture < 30) {
    cancellationFeePercent = 20;
  } else if (daysUntilDeparture >= 15 && daysUntilDeparture < 20) {
    cancellationFeePercent = 30;
  } else if (daysUntilDeparture >= 7 && daysUntilDeparture < 15) {
    cancellationFeePercent = 40;
  } else if (daysUntilDeparture >= 3 && daysUntilDeparture < 7) {
    cancellationFeePercent = 75;
  } else if (daysUntilDeparture < 3) {
    cancellationFeePercent = 100;
  } else if (daysUntilDeparture > 45) {
    cancellationFeePercent = 0;
  }

  const total = Number(totalAmount) || 0;
  const cancellationFee = Math.round((total * cancellationFeePercent) / 100);
  const refundAmount = total - cancellationFee;

  return {
    daysUntilDeparture,
    cancellationFeePercent,
    cancellationFee,
    refundAmount,
  };
}

function showLoading() {
  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="9" class="px-6 py-8 text-center">
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

async function fetchBookings(page = 1, status = currentStatus) {
  try {
    showLoading();

    const params = new URLSearchParams({
      page: page,
      limit: pageSize,
      status: status,
    });

    if (currentFilters.search) {
      params.append("search", currentFilters.search);
    }
    if (currentFilters.startDate) {
      params.append("startDate", currentFilters.startDate);
    }
    if (currentFilters.endDate) {
      params.append("endDate", currentFilters.endDate);
    }

    const response = await fetch(`/api/bookings/all?${params}`);
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
    const tbody = document.getElementById("bookingsTableBody");
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-6 py-4 text-center text-red-600">
          Lỗi: ${error.message}
        </td>
      </tr>
    `;
  }
}

async function fetchAllCounts() {
  try {
    const statuses = [
      "pre_pending",
      "pending",
      "confirmed",
      "completed",
      "refund_requested",
      "refunded_cancelled",
    ];

    for (const status of statuses) {
      const response = await fetch(
        `/api/bookings/all?page=1&limit=1&status=${status}`,
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

function updateBadgeCount(status, count) {
  const tab = document.querySelector(`[data-status="${status}"]`);
  if (tab) {
    const badge = tab.querySelector("span");
    if (badge) {
      badge.textContent = count;
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

function renderBookings(bookings) {
  const tbody = document.getElementById("bookingsTableBody");

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-6 py-4 text-center text-gray-500">
        <i class="fas fa-search text-3xl mb-3 block"></i>
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
          ${formatDateTime(booking.createdAt)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${booking.numberOfPeople || 0} người
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${formatPrice(booking.totalAmount)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${getStatusBadge(booking.bookingStatus, booking.paymentStatus)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          ${renderActions(booking)}
        </td>
      </tr>
    `,
    )
    .join("");
}

function renderActions(booking) {
  const id = booking._id;
  const bookingStatus = booking.bookingStatus;
  const paymentStatus = booking.paymentStatus;
  let actions = "";

  if (bookingStatus === "pending" && paymentStatus === "pending") {
    actions += `<button class="text-green-600 hover:text-green-900 text-xs" onclick="confirmPayment('${id}')">Thanh toán</button>`;
    actions += `<button class="text-red-600 hover:text-red-900 text-xs ml-2" onclick="cancelBooking('${id}')">Hủy</button>`;
  } else if (bookingStatus === "pending" && paymentStatus === "paid") {
    actions += `<button class="text-green-600 hover:text-green-900 text-xs" onclick="confirmBooking('${id}')">Xác nhận</button>`;
    actions += `<button class="text-orange-600 hover:text-orange-900 text-xs ml-2" onclick="requestRefund('${id}')">Hoàn tiền</button>`;
    actions += `<button class="text-blue-600 hover:text-blue-900 text-xs ml-2" onclick="viewBooking('${id}')">Xem</button>`;
  } else if (bookingStatus === "confirmed") {
    actions += `<button class="text-blue-600 hover:text-blue-900 text-xs" onclick="completeBooking('${id}')">Hoàn thành</button>`;
    actions += `<button class="text-orange-600 hover:text-orange-900 text-xs ml-2" onclick="requestRefund('${id}')">Hoàn tiền</button>`;
    actions += `<button class="text-blue-600 hover:text-blue-900 text-xs ml-2" onclick="viewBooking('${id}')">Xem</button>`;
  } else if (bookingStatus === "completed") {
    actions += `<button class="text-blue-600 hover:text-blue-900 text-xs" onclick="viewBooking('${id}')">Xem</button>`;
  } else if (bookingStatus === "refund_requested") {
    actions += `<button class="text-green-600 hover:text-green-900 text-xs" onclick="approveRefund('${id}', ${booking.totalAmount}, '${booking.departureDate}')">Xác nhận hoàn tiền</button>`;
    actions += `<button class="text-blue-600 hover:text-blue-900 text-xs ml-2" onclick="viewBooking('${id}')">Xem</button>`;
  } else if (bookingStatus === "refunded" || bookingStatus === "cancelled") {
    actions += `<button class="text-blue-600 hover:text-blue-900 text-xs" onclick="viewBooking('${id}')">Xem</button>`;
  } else {
    actions += `<span class="text-gray-600 text-xs">-</span>`;
  }

  return actions;
}

function updatePagination(pagination) {
  const start = Math.max((pagination.page - 1) * pagination.limit + 1, 0);
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  document.getElementById("recordStart").textContent =
    pagination.total > 0 ? start : 0;
  document.getElementById("recordEnd").textContent = end;
  document.getElementById("recordTotal").textContent = pagination.total;

  const paginationNav = document.getElementById("paginationNav");
  let html = "";

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
  Modal.confirm({
    title: "Xác nhận thanh toán",
    message: "Xác nhận thanh toán tại quầy cho đơn này?",
    icon: "fa-credit-card",
    iconColor: "green",
    confirmText: "Xác nhận",
    confirmColor: "green",
    onConfirm: async () => {
      const response = await fetch(`/api/bookings/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const res = await response.json();

      if (res.success) {
        Notification.show("Xác nhận thanh toán thành công!", "success");
        fetchBookings(currentPage, currentStatus);
        fetchAllCounts();
      } else {
        Notification.show("Lỗi: " + res.message, "error");
      }
    },
  });
}

function confirmBooking(bookingId) {
  Modal.confirm({
    title: "Xác nhận đơn đặt tour",
    message: "Xác nhận đơn đặt tour này?",
    icon: "fa-check",
    iconColor: "green",
    confirmText: "Xác nhận",
    confirmColor: "green",
    onConfirm: async () => {
      const response = await fetch(`/api/bookings/confirm-booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const res = await response.json();

      if (res.success) {
        Notification.show(
          "Xác nhận đơn thành công! Email đã được gửi.",
          "success",
        );
        fetchBookings(currentPage, currentStatus);
        fetchAllCounts();
      } else {
        Notification.show("Lỗi: " + res.message, "error");
      }
    },
  });
}

function completeBooking(bookingId) {
  Modal.confirm({
    title: "Hoàn thành tour",
    message: "Hoàn thành tour này?",
    icon: "fa-check",
    iconColor: "green",
    confirmText: "Hoàn thành",
    confirmColor: "green",
    onConfirm: async () => {
      const response = await fetch(`/api/bookings/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const res = await response.json();

      if (res.success) {
        Notification.show(
          "Hoàn thành tour! Email cảm ơn đã được gửi.",
          "success",
        );
        fetchBookings(currentPage, currentStatus);
        fetchAllCounts();
      } else {
        Notification.show("Lỗi: " + res.message, "error");
      }
    },
  });
}

function requestRefund(bookingId) {
  Modal.confirm({
    title: "Yêu cầu hoàn tiền",
    message: "Yêu cầu hoàn tiền cho đơn này?",
    icon: "fa-undo",
    iconColor: "yellow",
    confirmText: "Yêu cầu",
    confirmColor: "yellow",
    onConfirm: async () => {
      const response = await fetch(`/api/bookings/request-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: "Admin requested" }),
      });
      const res = await response.json();

      if (res.success) {
        Notification.show("Yêu cầu hoàn tiền đã được ghi nhận!", "success");
        fetchBookings(currentPage, currentStatus);
        fetchAllCounts();
      } else {
        Notification.show("Lỗi: " + res.message, "error");
      }
    },
  });
}

function approveRefund(bookingId, totalAmount, departureDate) {
  const refundInfo = calculateRefundInfo(departureDate, totalAmount);

  if (isNaN(refundInfo.refundAmount) || isNaN(refundInfo.cancellationFee)) {
    Notification.show(
      "Lỗi: Không thể tính toán số tiền hoàn lại. Vui lòng kiểm tra lại thông tin.",
      "error",
    );
    return;
  }

  const message = `
<div class="text-left">
  <p class="font-semibold mb-2">Thông tin hoàn tiền</p>
  <p>Số ngày còn lại: <strong>${refundInfo.daysUntilDeparture}</strong> ngày</p>
  <p>Phí hủy: <strong>${
    refundInfo.cancellationFeePercent
  }%</strong> (${formatPrice(refundInfo.cancellationFee)})</p>
  <p>Số tiền hoàn lại: <strong>${formatPrice(
    refundInfo.refundAmount,
  )}</strong></p>
</div>
  `.trim();

  Modal.confirm({
    title: "Xác nhận hoàn tiền",
    message: message,
    icon: "fa-money-bill",
    iconColor: "green",
    confirmText: "Xác nhận",
    confirmColor: "green",
    onConfirm: async () => {
      const response = await fetch(`/api/bookings/approve-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          refundAmount: Number(refundInfo.refundAmount),
          cancellationFeePercent: Number(refundInfo.cancellationFeePercent),
        }),
      });
      const res = await response.json();

      if (res.success) {
        Notification.show("Xác nhận hoàn tiền thành công!", "success");
        fetchBookings(currentPage, currentStatus);
        fetchAllCounts();
      } else {
        Notification.show("Lỗi: " + res.message, "error");
      }
    },
  });
}

function cancelBooking(bookingId) {
  Modal.confirm({
    title: "Hủy đơn đặt tour",
    message: "Hủy đơn này? Không thể hoàn tác hành động này.",
    icon: "fa-trash",
    iconColor: "red",
    confirmText: "Hủy",
    confirmColor: "red",
    onConfirm: async () => {
      const response = await fetch(`/api/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: "Admin cancelled" }),
      });
      const res = await response.json();

      if (res.success) {
        Notification.show("Hủy đơn thành công!", "success");
        fetchBookings(currentPage, currentStatus);
        fetchAllCounts();
      } else {
        Notification.show("Lỗi: " + res.message, "error");
      }
    },
  });
}

function viewBooking(bookingId) {
  window.location.href = `/admin/bookings/${bookingId}`;
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
  currentFilters.search = document.getElementById("filterSearch")?.value || "";

  console.log("🔧 Applying filters:", currentFilters);
  fetchBookings(1, currentStatus);
}

// ============================================
// EVENT LISTENERS
// ============================================

document.getElementById("pageSizeSelect")?.addEventListener("change", (e) => {
  pageSize = parseInt(e.target.value);
  currentPage = 1;
  fetchBookings(1, currentStatus);
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const status = btn.getAttribute("data-status");
    switchTab(status);
  });
});

document.getElementById("prevBtnMobile")?.addEventListener("click", () => {
  if (currentPage > 1) goToPage(currentPage - 1);
});

document.getElementById("nextBtnMobile")?.addEventListener("click", () => {
  if (currentPage < totalPages) goToPage(currentPage + 1);
});

document.getElementById("filterSearch")?.addEventListener("input", (e) => {
  applyFilters();
});

document
  .getElementById("filterStartDate")
  ?.addEventListener("change", applyFilters);
document
  .getElementById("filterEndDate")
  ?.addEventListener("change", applyFilters);

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Booking Tours page initialized");

  initBookingSocket();

  const initialTab = document.querySelector('[data-status="pre_pending"]');
  if (initialTab) {
    initialTab.classList.add("border-blue-600", "text-blue-600");
    initialTab.classList.remove("text-gray-600", "border-transparent");
  }

  fetchBookings(1, currentStatus);
  fetchAllCounts();
});

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.confirmPayment = confirmPayment;
window.confirmBooking = confirmBooking;
window.completeBooking = completeBooking;
window.requestRefund = requestRefund;
window.approveRefund = approveRefund;
window.cancelBooking = cancelBooking;
window.viewBooking = viewBooking;
window.goToPage = goToPage;
