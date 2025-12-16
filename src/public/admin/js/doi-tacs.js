import { Modal, Notification } from "../../utils/modal.js";
import { validateEmail, validatePhoneNumber } from "../../utils/validators.js";

const API_BASE = "/api/doi-tac";

// Biến trạng thái
let currentPage = 1;
let pageSize = 10;
let currentType = "";
let currentStatus = "";
let currentSearch = "";
let totalPartners = 0;

// ===========================
// KHỞI TẠO
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  loadPartners();
  setupEventListeners();
});

function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("statusFilter");
  const partnerForm = document.getElementById("partnerForm");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      currentPage = 1;
      loadPartners();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", (e) => {
      currentType = e.target.value;
      currentPage = 1;
      loadPartners();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      currentStatus = e.target.value;
      currentPage = 1;
      loadPartners();
    });
  }

  if (partnerForm) {
    partnerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handlePartnerFormSubmit();
    });
  }

  // ESC để đóng modal
  document.addEventListener("keydown", (e) => {
    const modal = document.getElementById("partnerModal");
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closePartnerModal();
    }
  });
}

// ===========================
// API CALLS
// ===========================

async function loadPartners() {
  try {
    let url = `${API_BASE}?page=${currentPage}&limit=${pageSize}`;
    if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
    if (currentType) url += `&type=${encodeURIComponent(currentType)}`;
    if (currentStatus) url += `&status=${currentStatus}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      renderPartners(result.data);
      totalPartners = result.pagination.total;
      updatePagination(result.pagination);
    } else {
      Notification.error("Không thể tải danh sách đối tác");
    }
  } catch (error) {
    console.error("Error loading partners:", error);
    Notification.error("Lỗi khi tải danh sách đối tác");
  }
}

// ===========================
// RENDER UI
// ===========================

function renderPartners(partners) {
  const tbody = document.getElementById("partnersList");
  tbody.innerHTML = "";

  if (partners.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-search text-3xl mb-3 block"></i>
          <p>Không có đối tác nào</p>
        </td>
      </tr>`;
    return;
  }

  partners.forEach((partner) => {
    const statusBadge =
      partner.status === "active"
        ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Hoạt động</span>'
        : '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Tạm dừng</span>';

    const statusBtn =
      partner.status === "active"
        ? `<button class="text-orange-600 hover:text-orange-900" onclick="window.toggleStatus('${partner._id}')">Tạm dừng</button>`
        : `<button class="text-green-600 hover:text-green-900" onclick="window.toggleStatus('${partner._id}')">Kích hoạt</button>`;

    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${partner.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${partner.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${partner.phone}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${partner.type}</td>
        <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          <button class="text-blue-600 hover:text-blue-900" onclick="window.editPartner('${partner._id}')">Sửa</button>
          ${statusBtn}
          <button class="text-red-600 hover:text-red-900" onclick="window.deletePartner('${partner._id}')">Xoá</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// ===========================
// PHÂN TRANG
// ===========================

window.goToPage = async function (page) {
  const totalPages = Math.ceil(totalPartners / pageSize);

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  await loadPartners();

  // Scroll to top
  document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
};

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
// VALIDATION
// ===========================

function clearValidationErrors() {
  document.querySelectorAll(".error-message").forEach((el) => el.remove());
  document.querySelectorAll(".border-red-500").forEach((el) => {
    el.classList.remove("border-red-500");
    el.classList.add("border-gray-300");
  });
}

function showValidationError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.remove("border-gray-300");
  field.classList.add("border-red-500");

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);
}

function validatePartnerForm(name, email, phone, type) {
  clearValidationErrors();
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = "Vui lòng nhập tên đối tác";
    showValidationError("partnerName", errors.name);
  } else if (name.trim().length < 3) {
    errors.name = "Tên đối tác phải có ít nhất 3 ký tự";
    showValidationError("partnerName", errors.name);
  }

  if (!email || email.trim().length === 0) {
    errors.email = "Vui lòng nhập email";
    showValidationError("partnerEmail", errors.email);
  } else if (!validateEmail(email)) {
    errors.email = "Email không hợp lệ";
    showValidationError("partnerEmail", errors.email);
  }

  if (!phone || phone.trim().length === 0) {
    errors.phone = "Vui lòng nhập số điện thoại";
    showValidationError("partnerPhone", errors.phone);
  } else if (!validatePhoneNumber(phone)) {
    errors.phone = "Số điện thoại không hợp lệ";
    showValidationError("partnerPhone", errors.phone);
  }

  if (!type || type === "") {
    errors.type = "Vui lòng chọn loại hình";
    showValidationError("partnerType", errors.type);
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ===========================
// MODAL HANDLERS
// ===========================

function openAddPartnerModal() {
  const form = document.getElementById("partnerForm");
  const modal = document.getElementById("partnerModal");
  const title = document.getElementById("modalTitle");

  if (form && modal && title) {
    title.textContent = "Thêm đối tác mới";
    form.reset();
    form.dataset.mode = "add";
    form.dataset.id = "";
    clearValidationErrors();
    modal.classList.remove("hidden");
  } else {
    Notification.error("Lỗi: Không tìm thấy form");
  }
}

function closePartnerModal() {
  const modal = document.getElementById("partnerModal");
  if (modal) {
    modal.classList.add("hidden");
    clearValidationErrors();
  }
}

async function editPartner(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    const result = await response.json();

    if (result.success) {
      const partner = result.data;
      const title = document.getElementById("modalTitle");
      const form = document.getElementById("partnerForm");
      const modal = document.getElementById("partnerModal");

      if (title && form && modal) {
        title.textContent = "Chỉnh sửa đối tác";
        document.getElementById("partnerName").value = partner.name;
        document.getElementById("partnerEmail").value = partner.email;
        document.getElementById("partnerPhone").value = partner.phone || "";
        document.getElementById("partnerType").value = partner.type;
        form.dataset.mode = "edit";
        form.dataset.id = partner._id;
        clearValidationErrors();
        modal.classList.remove("hidden");
      }
    } else {
      Notification.error(result.message || "Không thể tải thông tin đối tác");
    }
  } catch (error) {
    console.error("Error loading partner:", error);
    Notification.error("Không thể tải thông tin đối tác");
  }
}

async function handlePartnerFormSubmit() {
  const partnerForm = document.getElementById("partnerForm");
  const name = document.getElementById("partnerName").value.trim();
  const email = document.getElementById("partnerEmail").value.trim();
  const phone = document.getElementById("partnerPhone").value.trim();
  const type = document.getElementById("partnerType").value;
  const mode = partnerForm.dataset.mode;
  const id = partnerForm.dataset.id;

  // Validate form
  const validation = validatePartnerForm(name, email, phone, type);
  if (!validation.isValid) return;

  try {
    let url = API_BASE;
    let method = "POST";
    const body = { name, email, phone, type };

    if (mode === "edit") {
      url = `${API_BASE}/${id}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (result.success) {
      Notification.success(
        mode === "add"
          ? "Thêm đối tác thành công"
          : "Cập nhật đối tác thành công"
      );
      closePartnerModal();
      currentPage = 1;
      loadPartners();
    } else {
      Notification.error(result.message || "Lỗi khi lưu đối tác");
    }
  } catch (error) {
    console.error("Error saving partner:", error);
    Notification.error("Lỗi khi lưu đối tác");
  }
}

async function deletePartner(id) {
  Modal.confirm({
    title: "Xác nhận xoá",
    message: "Bạn chắc chắn muốn xoá đối tác này?",
    confirmText: "Xoá",
    cancelText: "Hủy",
    confirmColor: "red",
    onConfirm: async () => {
      try {
        const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
        const result = await response.json();

        if (result.success) {
          Notification.success("Xoá đối tác thành công");
          currentPage = 1;
          loadPartners();
        } else {
          Notification.error(result.message || "Lỗi khi xoá đối tác");
        }
      } catch (error) {
        console.error("Error deleting partner:", error);
        Notification.error("Lỗi khi xoá đối tác");
      }
    },
  });
}

async function toggleStatus(id) {
  try {
    const row = event.target.closest("tr");
    const statusCell = row.cells[4];
    const currentStatus = statusCell.textContent.includes("Hoạt động")
      ? "active"
      : "inactive";
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const response = await fetch(`${API_BASE}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await response.json();

    if (result.success) {
      Notification.success("Cập nhật trạng thái thành công");
      loadPartners();
    } else {
      Notification.error(result.message || "Lỗi khi cập nhật trạng thái");
    }
  } catch (error) {
    console.error("Error updating status:", error);
    Notification.error("Lỗi khi cập nhật trạng thái");
  }
}

// Expose functions to global scope
window.openAddPartnerModal = openAddPartnerModal;
window.closePartnerModal = closePartnerModal;
window.editPartner = editPartner;
window.deletePartner = deletePartner;
window.toggleStatus = toggleStatus;
