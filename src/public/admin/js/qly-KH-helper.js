// API helper
const API_BASE = "/api/users";

/**
 * Get all customers with stats
 * @param {number} page - Page number
 * @param {string} segment - Customer segment (all, Kim cương, Vàng, Bạc, Khách mới)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>}
 */
async function fetchCustomers(page = 1, segment = "all", limit = 10) {
  try {
    let url = `${API_BASE}/customers?page=${page}&limit=${limit}`;
    if (segment && segment !== "all") {
      url += `&segment=${encodeURIComponent(segment)}`;
    }

    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
}

/**
 * Get customer statistics
 * @returns {Promise<Object>}
 */
async function fetchCustomerStats() {
  try {
    const response = await fetch(`${API_BASE}/customers/stats`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    throw error;
  }
}

/**
 * Get customer detail
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>}
 */
async function fetchCustomerDetail(customerId) {
  try {
    const response = await fetch(`${API_BASE}/customers/${customerId}/detail`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching customer detail:", error);
    throw error;
  }
}

/**
 * Format currency to VND
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (!amount) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to DD/MM/YYYY
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return "Chưa có";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return "Không hợp lệ";
  }
}

/**
 * Format date time to DD/MM/YYYY HH:MM
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date time string
 */
function formatDateTime(dateString) {
  if (!dateString) return "Chưa có";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Không hợp lệ";
  }
}

/**
 * Get customer type badge HTML
 * @param {string} type - Customer type (Kim cương, Vàng, Bạc, Khách mới)
 * @returns {string} HTML badge
 */
function getCustomerTypeBadge(type) {
  const badgeConfig = {
    "Kim cương": {
      class: "bg-yellow-100 text-yellow-800",
      icon: "fas fa-crown",
    },
    Vàng: {
      class: "bg-orange-100 text-orange-800",
      icon: "fas fa-gem",
    },
    Bạc: {
      class: "bg-gray-200 text-gray-800",
      icon: "fas fa-coins",
    },
    "Khách mới": {
      class: "bg-green-100 text-green-800",
      icon: "fas fa-star",
    },
  };

  const config = badgeConfig[type] || badgeConfig["Khách mới"];
  return `
    <span class="px-2 py-1 text-xs font-medium rounded-full ${config.class}">
      <i class="${config.icon} mr-1"></i>${type}
    </span>
  `;
}

/**
 * Get status badge HTML
 * @param {string} status - Status (active, inactive, blocked)
 * @returns {string} HTML badge
 */
function getStatusBadge(status) {
  const statusConfig = {
    active: { class: "bg-green-100 text-green-800", text: "Hoạt động" },
    inactive: { class: "bg-gray-100 text-gray-800", text: "Tạm dừng" },
    blocked: { class: "bg-red-100 text-red-800", text: "Bị khóa" },
  };

  const config = statusConfig[status] || statusConfig.inactive;
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${config.class}">${config.text}</span>`;
}

/**
 * Get booking status badge HTML
 * @param {string} status - Booking status
 * @returns {string} HTML badge
 */
function getBookingStatusBadge(status) {
  const statusConfig = {
    confirmed: { class: "bg-blue-100 text-blue-800", text: "Đã xác nhận" },
    pending: { class: "bg-yellow-100 text-yellow-800", text: "Chờ xác nhận" },
    completed: { class: "bg-green-100 text-green-800", text: "Hoàn tất" },
    cancelled: { class: "bg-red-100 text-red-800", text: "Đã hủy" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${config.class}">${config.text}</span>`;
}

/**
 * Get payment status badge HTML
 * @param {string} status - Payment status
 * @returns {string} HTML badge
 */
function getPaymentStatusBadge(status) {
  const statusConfig = {
    pending: { class: "bg-gray-100 text-gray-800", text: "Chưa thanh toán" },
    partial: {
      class: "bg-yellow-100 text-yellow-800",
      text: "Thanh toán một phần",
    },
    paid: { class: "bg-green-100 text-green-800", text: "Đã thanh toán" },
    refunded: { class: "bg-purple-100 text-purple-800", text: "Đã hoàn tiền" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${config.class}">${config.text}</span>`;
}

/**
 * Get initials from full name
 * @param {string} fullName - Full name
 * @returns {string} Initials (max 2 characters)
 */
function getInitials(fullName) {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get avatar color based on name
 * @param {string} name - Name to generate color from
 * @returns {string} Hex color code
 */
function getAvatarColor(name) {
  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#fa709a",
    "#fee140",
    "#f8b500",
    "#ff6b6b",
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Create initials avatar HTML
 * @param {string} fullName - Full name
 * @returns {string} HTML avatar element
 */
function createInitialsAvatar(fullName) {
  const initials = getInitials(fullName);
  const color = getAvatarColor(fullName);

  return `
    <div
      class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style="background-color: ${color}"
      title="${fullName}"
    >
      ${initials}
    </div>
  `;
}

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {number} duration - Duration in milliseconds
 */
function showSuccess(message, duration = 3000) {
  // You can implement a toast notification here
  console.log("Success:", message);
  alert(message);
}

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {number} duration - Duration in milliseconds
 */
function showError(message, duration = 3000) {
  // You can implement a toast notification here
  console.error("Error:", message);
  alert("Lỗi: " + message);
}

/**
 * Classify customer type based on booking count and total spent
 * @param {number} bookingCount - Number of bookings
 * @param {number} totalSpent - Total amount spent
 * @returns {string} Customer type
 */
function classifyCustomer(bookingCount, totalSpent) {
  if (bookingCount === 0) {
    return "Khách mới";
  } else if (totalSpent >= 100000000) {
    return "Kim cương";
  } else if (totalSpent >= 25000000) {
    return "Vàng";
  } else {
    return "Bạc";
  }
}

/**
 * Check if customer is returning customer
 * @param {number} bookingCount - Number of bookings
 * @returns {boolean} True if returning customer
 */
function isReturningCustomer(bookingCount) {
  return bookingCount >= 2;
}

/**
 * Calculate return rate
 * @param {number} returningCustomers - Number of returning customers
 * @param {number} totalCustomers - Total number of customers
 * @returns {number} Return rate percentage
 */
function calculateReturnRate(returningCustomers, totalCustomers) {
  if (totalCustomers === 0) return 0;
  return Math.round((returningCustomers / totalCustomers) * 100 * 10) / 10;
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fetchCustomers,
    fetchCustomerStats,
    fetchCustomerDetail,
    formatCurrency,
    formatDate,
    formatDateTime,
    getCustomerTypeBadge,
    getStatusBadge,
    getBookingStatusBadge,
    getPaymentStatusBadge,
    getInitials,
    getAvatarColor,
    createInitialsAvatar,
    showSuccess,
    showError,
    classifyCustomer,
    isReturningCustomer,
    calculateReturnRate,
  };
}
