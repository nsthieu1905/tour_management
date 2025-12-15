import { formatDate, formatPrice } from "../../utils/helpers.js";

// Biến trạng thái
let currentPage = 1;
let currentSegment = "all";
let currentSearch = "";
let currentDateFilter = "";

// ============================================
// HÀM TIỆN ÍCH
// ============================================

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

// ============================================
// TRANG CHI TIẾT KHÁCH HÀNG
// ============================================

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
          .join(" ")
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
          <i class="fas fa-inbox text-3xl mb-2"></i>
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

// ============================================
// TRANG DANH SÁCH KHÁCH HÀNG
// ============================================

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

const loadCustomers = async (page = 1, segment = "all", search = "") => {
  try {
    let url = `/api/users/qly-khach-hang?page=${page}&limit=10`;
    if (segment !== "all") url += `&segment=${segment}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      let customers = result.data;

      // Lọc theo tìm kiếm
      if (search) {
        customers = customers.filter(
          (c) =>
            c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            (c.phone && c.phone.includes(search))
        );
      }

      // Lọc theo ngày
      if (currentDateFilter) {
        const filterDate = new Date(currentDateFilter).setHours(0, 0, 0, 0);
        customers = customers.filter((c) => {
          if (!c.lastBookingDate) return false;
          return (
            new Date(c.lastBookingDate).setHours(0, 0, 0, 0) === filterDate
          );
        });
      }

      renderCustomers(customers);
      renderPagination(
        result.pagination.page,
        result.pagination.pages,
        result.pagination.total
      );
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
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>Không có khách hàng nào</p>
        </td>
      </tr>`;
    return;
  }

  customerList.innerHTML = customers
    .map(
      (c, i) => `
    <tr class="hover:bg-gray-50 cursor-pointer transition" data-customer-id="${
      c._id
    }">
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
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button class="view-customer-btn text-blue-600 hover:text-blue-900" data-customer-id="${
          c._id
        }">
          Xem
        </button>
      </td>
    </tr>`
    )
    .join("");

  // Gắn event listener cho các row
  customerList.querySelectorAll("tr[data-customer-id]").forEach((row) => {
    row.addEventListener("click", (e) => {
      // Không chuyển trang nếu click vào button
      if (e.target.classList.contains("view-customer-btn")) return;
      const customerId = row.dataset.customerId;
      viewCustomerDetail(customerId);
    });
  });

  // Gắn event listener cho các nút Xem
  customerList.querySelectorAll(".view-customer-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const customerId = btn.dataset.customerId;
      viewCustomerDetail(customerId);
    });
  });
};

const renderPagination = (page, pages, total) => {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (pages <= 1) return;

  const createBtn = (content, onClick, isCurrent = false) => {
    const btn = document.createElement("button");
    btn.className = isCurrent
      ? "px-3 py-2 rounded-lg bg-blue-600 text-white"
      : "px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50";
    btn.innerHTML = content;
    btn.onclick = onClick;
    return btn;
  };

  // Previous
  if (page > 1) {
    pagination.appendChild(
      createBtn('<i class="fas fa-chevron-left"></i>', () => {
        currentPage = page - 1;
        loadCustomers(currentPage, currentSegment, currentSearch);
      })
    );
  }

  // Pages
  for (let i = 1; i <= pages; i++) {
    pagination.appendChild(
      createBtn(
        i,
        () => {
          currentPage = i;
          loadCustomers(currentPage, currentSegment, currentSearch);
          window.scrollTo(0, 0);
        },
        i === page
      )
    );
  }

  // Next
  if (page < pages) {
    pagination.appendChild(
      createBtn('<i class="fas fa-chevron-right"></i>', () => {
        currentPage = page + 1;
        loadCustomers(currentPage, currentSegment, currentSearch);
      })
    );
  }
};

// ============================================
// EVENT LISTENERS
// ============================================

const addEventListenerSafe = (id, event, handler) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
};

addEventListenerSafe("segmentFilter", "change", (e) => {
  currentSegment = e.target.value;
  currentPage = 1;
  loadCustomers(currentPage, currentSegment, currentSearch);
});

addEventListenerSafe("dateFilter", "change", (e) => {
  currentDateFilter = e.target.value;
  currentPage = 1;
  loadCustomers(currentPage, currentSegment, currentSearch);
});

addEventListenerSafe("searchInput", "input", (e) => {
  currentSearch = e.target.value;
  currentPage = 1;
  loadCustomers(currentPage, currentSegment, currentSearch);
});

// ============================================
// KHỞI TẠO
// ============================================

const init = () => {
  const isDetailPage =
    document.getElementById("bookingList") &&
    document.getElementById("avatarDiv");
  const isListPage = document.getElementById("customerList");

  if (isDetailPage) {
    loadCustomerDetail();
  } else if (isListPage) {
    loadStats();
    loadCustomers(currentPage, currentSegment, currentSearch);
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
