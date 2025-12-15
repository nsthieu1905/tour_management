import { formatDate, formatPrice } from "../../utils/helpers.js";

// Biến trạng thái
let currentPage = 1;
let pageSize = 10;
let currentSegment = "all";
let currentSearch = "";
let currentDateFilter = "";
let totalCustomers = 0;

// ===========================
// HÀM TIỆN ÍCH
// ===========================

const getInitials = (fullName) =>
  fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 1);

const getAvatarColor = (seed) => {
  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#fa709a",
    "#fee140",
  ];
  const index =
    typeof seed === "string"
      ? seed.charCodeAt(0) + seed.charCodeAt(1 || 0)
      : seed;
  return colors[index % colors.length];
};

const getBadge = (type, value) => {
  const badges = {
    customerType: {
      "Kim cương": "bg-yellow-100 text-yellow-800",
      Vàng: "bg-orange-100 text-orange-800",
      Bạc: "bg-gray-200 text-gray-800",
      "Khách mới": "bg-green-100 text-green-800",
    },
    status: {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      blocked: "bg-red-100 text-red-800",
    },
    bookingStatus: {
      confirmed: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    },
    paymentStatus: {
      pending: "bg-gray-100 text-gray-800",
      partial: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      refunded: "bg-purple-100 text-purple-800",
    },
  };

  const labels = {
    status: { active: "Hoạt động", inactive: "Tạm dừng", blocked: "Bị khóa" },
    bookingStatus: {
      confirmed: "Đã xác nhận",
      pending: "Chờ xác nhận",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
    },
    paymentStatus: {
      pending: "Chưa thanh toán",
      partial: "Thanh toán một phần",
      paid: "Đã thanh toán",
      refunded: "Đã hoàn tiền",
    },
  };

  const badgeClass = badges[type]?.[value] || badges[type]?.["Khách mới"];
  const label = labels[type]?.[value] || value;

  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${badgeClass}">${label}</span>`;
};

const setElementContent = (id, content, isHTML = false) => {
  const el = document.getElementById(id);
  if (el) {
    isHTML ? (el.innerHTML = content) : (el.textContent = content);
  }
};

// ===========================
// TRANG CHI TIẾT KHÁCH HÀNG
// ===========================

const loadCustomerDetail = async () => {
  try {
    const customerId = window.location.pathname.split("/").pop();
    const response = await fetch(
      `/api/users/qly-khach-hang/${customerId}/detail`
    );
    const result = await response.json();

    if (!result.success) {
      document.body.innerHTML =
        '<div class="flex items-center justify-center h-screen"><p class="text-xl text-gray-600">Không tìm thấy khách hàng</p></div>';
      return;
    }

    const c = result.data;

    // Avatar
    const avatarDiv = document.getElementById("avatarDiv");
    avatarDiv.style.backgroundColor = getAvatarColor(c.fullName);
    avatarDiv.textContent = getInitials(c.fullName);

    // Header
    setElementContent("customerName", c.fullName);
    setElementContent("customerEmail", c.email);
    setElementContent("customerPhone", c.phone || "Chưa cập nhật");
    setElementContent(
      "customerTypeBadge",
      getBadge("customerType", c.customerType),
      true
    );
    setElementContent("totalSpent", formatPrice(c.totalSpent) + " đ");

    // Stats
    setElementContent("bookingCount", c.bookingCount);
    setElementContent(
      "returningCustomer",
      c.isReturningCustomer ? "Có" : "Không"
    );
    setElementContent("createdDate", formatDate(c.createdAt));

    // Info
    setElementContent("infoFullName", c.fullName);
    setElementContent("infoEmail", c.email);
    setElementContent("infoPhone", c.phone || "Chưa cập nhật");
    setElementContent(
      "infoGender",
      c.gender
        ? { male: "Nam", female: "Nữ", other: "Khác" }[c.gender] || c.gender
        : "Chưa cập nhật"
    );
    setElementContent(
      "infoDOB",
      c.dateOfBirth ? formatDate(c.dateOfBirth) : "Chưa cập nhật"
    );
    setElementContent("infoStatus", getBadge("status", c.status), true);

    const address = c.address;
    const addressStr = address
      ? [address.street, address.district, address.city, address.country]
          .filter(Boolean)
          .join(", ")
      : "Chưa cập nhật";
    setElementContent("infoAddress", addressStr);

    renderBookings(c.bookings);
  } catch (error) {
    console.error("Error loading customer detail:", error);
    document.body.innerHTML =
      '<div class="flex items-center justify-center h-screen"><p class="text-xl text-red-600">Lỗi khi tải thông tin</p></div>';
  }
};

const renderBookings = (bookings) => {
  const bookingList = document.getElementById("bookingList");

  if (!bookings?.length) {
    bookingList.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-3xl mb-2 block"></i>
          <p>Khách hàng chưa đặt tour nào</p>
        </td>
      </tr>`;
    return;
  }

  bookingList.innerHTML = bookings
    .map(
      (b) => `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${
        b.bookingCode
      }</td>
      <td class="px-6 py-4 text-sm text-gray-900">
        <div>${
          b.tour ? `${b.tour.name} (${b.tour.destination})` : "Tour không có"
        }</div>
        ${
          b.tour
            ? `<div class="text-xs text-gray-500">${b.tour.tourCode}</div>`
            : ""
        }
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
        b.numberOfPeople
      } người</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatPrice(
        b.totalAmount
      )} đ</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${getBadge(
        "bookingStatus",
        b.bookingStatus
      )}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">${getBadge(
        "paymentStatus",
        b.paymentStatus
      )}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(
        b.createdAt
      )}</td>
    </tr>`
    )
    .join("");
};

// ===========================
// TRANG DANH SÁCH KHÁCH HÀNG
// ===========================

const loadStats = async () => {
  try {
    const response = await fetch(`/api/users/qly-khach-hang/stats`);
    const result = await response.json();

    if (result.success) {
      const s = result.data;
      setElementContent("totalCustomers", s.totalCustomers);
      setElementContent("diamondCustomers", s.diamondCustomers);
      setElementContent("newCustomers", s.newCustomers);
      setElementContent("returnRate", s.returnRate + "%");
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
};

const loadCustomers = async () => {
  try {
    let url = `/api/users/qly-khach-hang?page=${currentPage}&limit=${pageSize}`;
    if (currentSegment !== "all") url += `&segment=${currentSegment}`;
    if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
    if (currentDateFilter) url += `&date=${currentDateFilter}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      renderCustomers(result.data);
      totalCustomers = result.pagination.total;
      updatePagination(result.pagination);
    }
  } catch (error) {
    console.error("Error loading customers:", error);
  }
};

const viewCustomerDetail = (customerId) => {
  window.location.href = `/admin/qly-khach-hang/${customerId}`;
};

const renderCustomers = (customers) => {
  const customerList = document.getElementById("customerList");

  if (!customers.length) {
    customerList.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-3xl mb-2 block"></i>
          <p>Không có khách hàng nào</p>
        </td>
      </tr>`;
    return;
  }

  customerList.innerHTML = customers
    .map(
      (c, i) => `
    <tr class="hover:bg-gray-50 cursor-pointer transition" onclick="window.viewCustomerDetail('${
      c._id
    }')">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
               style="background-color: ${getAvatarColor(i)}">
            ${getInitials(c.fullName)}
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${c.fullName}</div>
            <div class="text-sm text-gray-500">${c.email}</div>
            <div class="text-sm text-gray-500">${c.phone || "N/A"}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${getBadge(
        "customerType",
        c.customerType
      )}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
        c.bookingCount
      } tour</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formatPrice(
        c.totalSpent
      )} đ</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatDate(
        c.lastBookingDate
      )}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button 
          class="text-blue-600 hover:text-blue-900" 
          onclick="event.stopPropagation(); window.viewCustomerDetail('${
            c._id
          }')"
        >
          Xem
        </button>
      </td>
    </tr>`
    )
    .join("");
};

// ===========================
// PHÂN TRANG
// ===========================

window.goToPage = async function (page) {
  const totalPages = Math.ceil(totalCustomers / pageSize);

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  await loadCustomers();

  // Scroll to top
  document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
};

window.viewCustomerDetail = viewCustomerDetail;

function updatePagination(pagination) {
  const start = Math.max((pagination.page - 1) * pagination.limit + 1, 0);
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  // Cập nhật text hiển thị
  const recordStart = document.getElementById("recordStart");
  const recordEnd = document.getElementById("recordEnd");
  const recordTotal = document.getElementById("recordTotal");

  if (recordStart) recordStart.textContent = pagination.total > 0 ? start : 0;
  if (recordEnd) recordEnd.textContent = end;
  if (recordTotal) recordTotal.textContent = pagination.total;

  // Cập nhật pagination nav
  const paginationNav = document.getElementById("paginationNav");
  if (!paginationNav) return;

  let html = "";

  // Nút Previous
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

  // Các số trang (hiển thị tối đa 5 trang)
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

  // Nút Next
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
}

// ===========================
// EVENT LISTENERS
// ===========================

const addEventListenerSafe = (id, event, handler) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
};

addEventListenerSafe("segmentFilter", "change", (e) => {
  currentSegment = e.target.value;
  currentPage = 1;
  loadCustomers();
});

addEventListenerSafe("dateFilter", "change", (e) => {
  currentDateFilter = e.target.value;
  currentPage = 1;
  loadCustomers();
});

addEventListenerSafe("searchInput", "input", (e) => {
  currentSearch = e.target.value;
  currentPage = 1;
  loadCustomers();
});

// ===========================
// KHỞI TẠO
// ===========================

const init = () => {
  const isDetailPage =
    document.getElementById("bookingList") &&
    document.getElementById("avatarDiv");
  const isListPage = document.getElementById("customerList");

  if (isDetailPage) {
    loadCustomerDetail();
  } else if (isListPage) {
    loadStats();
    loadCustomers();
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
