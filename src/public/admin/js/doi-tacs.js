import { Modal, Notification } from "../../utils/modal.js";
import { validateEmail, validatePhoneNumber } from "../../utils/validators.js";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "../../utils/api.js";

const API_BASE = "/api/doi-tac";

// Partner services state
let currentServicePartnerId = null;
let currentEditingServiceId = null;

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
  loadPartnerTypes();
  setupEventListeners();
  setupPartnerServicesEventListeners();
});

async function loadPartnerTypes() {
  const typeFilter = document.getElementById("typeFilter");
  if (!typeFilter) return;

  try {
    const res = await apiGet(`${API_BASE}/types`);
    if (!res) return;
    const result = await res.json();
    if (!result?.success) return;

    const types = Array.isArray(result.data) ? result.data : [];
    const opts = types
      .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
      .join("");
    typeFilter.innerHTML = `<option value="">-- Tất cả --</option>${opts}`;
  } catch (err) {
    console.error("Error loading partner types:", err);
  }
}

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

    const servicesModal = document.getElementById("partnerServicesModal");
    if (
      e.key === "Escape" &&
      servicesModal &&
      !servicesModal.classList.contains("hidden")
    ) {
      closePartnerServicesModal();
    }
  });
}

function setupPartnerServicesEventListeners() {
  const form = document.getElementById("partnerServiceForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handlePartnerServiceSubmit();
    });
  }
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

    const response = await apiGet(url);
    if (!response) return;
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
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
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
        ? `<button class="text-orange-600 hover:text-orange-900" onclick="window.toggleStatus(event, '${partner._id}')">Tạm dừng</button>`
        : `<button class="text-green-600 hover:text-green-900" onclick="window.toggleStatus(event, '${partner._id}')">Kích hoạt</button>`;

    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${partner.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${escapeHtml(
          partner.destination || ""
        )}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${
          partner.email
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${
          partner.phone
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
          partner.type
        }</td>
        <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          <button class="text-blue-600 hover:text-blue-900" onclick="window.editPartner('${
            partner._id
          }')">Sửa</button>
          <button class="text-indigo-600 hover:text-indigo-900" onclick="window.openPartnerServicesModal('${
            partner._id
          }', '${escapeHtml(partner.name)}')">Dịch vụ</button>
          ${statusBtn}
          <button class="text-red-600 hover:text-red-900" onclick="window.deletePartner('${
            partner._id
          }')">Xoá</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function validatePartnerForm(name, destination, email, phone, type) {
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

  if (!destination || destination.trim().length === 0) {
    errors.destination = "Vui lòng nhập điểm đến";
    showValidationError("partnerDestination", errors.destination);
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
    const response = await apiGet(`${API_BASE}/${id}`);
    if (!response) return;
    const result = await response.json();

    if (result.success) {
      const partner = result.data;
      const title = document.getElementById("modalTitle");
      const form = document.getElementById("partnerForm");
      const modal = document.getElementById("partnerModal");

      if (title && form && modal) {
        title.textContent = "Chỉnh sửa đối tác";
        document.getElementById("partnerName").value = partner.name;
        document.getElementById("partnerDestination").value =
          partner.destination || "";
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
  const destination = document
    .getElementById("partnerDestination")
    .value.trim();
  const email = document.getElementById("partnerEmail").value.trim();
  const phone = document.getElementById("partnerPhone").value.trim();
  const type = document.getElementById("partnerType").value.trim();
  const mode = partnerForm.dataset.mode;
  const id = partnerForm.dataset.id;

  // Validate form
  const validation = validatePartnerForm(name, destination, email, phone, type);
  if (!validation.isValid) return;

  try {
    let url = API_BASE;
    let method = "POST";
    const body = { name, destination, email, phone, type };

    if (mode === "edit") {
      url = `${API_BASE}/${id}`;
      method = "PUT";
    }

    const response =
      method === "POST" ? await apiPost(url, body) : await apiPut(url, body);
    if (!response) return;
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
        const response = await apiDelete(`${API_BASE}/${id}`);
        if (!response) return;
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

async function toggleStatus(evt, id) {
  try {
    const row = evt?.target?.closest("tr");
    if (!row) return;
    const statusCell = row.cells[5];
    const currentStatus = statusCell.textContent.includes("Hoạt động")
      ? "active"
      : "inactive";
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const response = await apiPatch(`${API_BASE}/${id}/status`, {
      status: newStatus,
    });
    if (!response) return;
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

// ===========================
// PARTNER SERVICES MODAL
// ===========================

async function openPartnerServicesModal(partnerId, partnerName) {
  currentServicePartnerId = partnerId;
  currentEditingServiceId = null;

  const modal = document.getElementById("partnerServicesModal");
  const title = document.getElementById("servicesModalTitle");
  if (!modal || !title) {
    Notification.error("Không tìm thấy modal dịch vụ");
    return;
  }

  title.textContent = `Quản lý dịch vụ - ${partnerName || ""}`;
  resetPartnerServiceForm();
  modal.classList.remove("hidden");
  await loadPartnerServices();
}

function closePartnerServicesModal() {
  const modal = document.getElementById("partnerServicesModal");
  if (modal) modal.classList.add("hidden");
  currentServicePartnerId = null;
  currentEditingServiceId = null;
}

async function loadPartnerServices() {
  if (!currentServicePartnerId) return;
  try {
    const res = await apiGet(`${API_BASE}/${currentServicePartnerId}/services`);
    if (!res) return;
    const result = await res.json();

    if (result.success) {
      renderPartnerServices(result.data || []);
    } else {
      Notification.error(result.message || "Không thể tải danh sách dịch vụ");
    }
  } catch (err) {
    console.error(err);
    Notification.error("Lỗi khi tải danh sách dịch vụ");
  }
}

function renderPartnerServices(services) {
  const tbody = document.getElementById("partnerServicesList");
  if (!tbody) return;

  if (!Array.isArray(services) || services.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-box-open text-3xl mb-3 block"></i>
          <p>Chưa có dịch vụ nào</p>
        </td>
      </tr>`;
    return;
  }

  const formatCurrency = (n) => {
    const num = Number(n) || 0;
    return num.toLocaleString("vi-VN");
  };

  const badge = (status) =>
    status === "active"
      ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Hoạt động</span>'
      : '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Tạm dừng</span>';

  tbody.innerHTML = services
    .map(
      (s) => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${escapeHtml(
            s.name
          )}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${formatCurrency(
          s.price
        )}</td>
        <td class="px-6 py-4 whitespace-nowrap">${badge(s.status)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          <button class="text-blue-600 hover:text-blue-900" onclick="window.editPartnerService('$
            s._id
          }')">Sửa</button>
          <button class="text-red-600 hover:text-red-900" onclick="window.deletePartnerService('${
            s._id
          }')">Xoá</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function resetPartnerServiceForm() {
  currentEditingServiceId = null;
  const name = document.getElementById("serviceName");
  const price = document.getElementById("servicePrice");
  const status = document.getElementById("serviceStatus");
  const submitBtn = document.getElementById("serviceFormSubmitBtn");
  const cancelBtn = document.getElementById("serviceFormCancelBtn");

  if (name) name.value = "";
  if (price) price.value = "";
  if (status) status.value = "active";
  if (submitBtn) submitBtn.textContent = "Thêm dịch vụ";
  if (cancelBtn) cancelBtn.classList.add("hidden");
}

async function handlePartnerServiceSubmit() {
  if (!currentServicePartnerId) return;

  const name = document.getElementById("serviceName")?.value?.trim() || "";
  const price = document.getElementById("servicePrice")?.value || 0;
  const status = document.getElementById("serviceStatus")?.value || "active";

  if (!name) {
    Notification.error("Vui lòng nhập tên dịch vụ");
    return;
  }

  try {
    let res;
    if (currentEditingServiceId) {
      res = await apiPut(`${API_BASE}/services/${currentEditingServiceId}`, {
        name,
        unit: "per_booking",
        price,
        status,
      });
    } else {
      res = await apiPost(`${API_BASE}/${currentServicePartnerId}/services`, {
        name,
        unit: "per_booking",
        price,
      });
    }
    if (!res) return;
    const result = await res.json();

    if (result.success) {
      Notification.success(
        currentEditingServiceId
          ? "Cập nhật dịch vụ thành công"
          : "Thêm dịch vụ thành công"
      );
      resetPartnerServiceForm();
      await loadPartnerServices();
    } else {
      Notification.error(result.message || "Có lỗi xảy ra");
    }
  } catch (err) {
    console.error(err);
    Notification.error("Lỗi khi lưu dịch vụ");
  }
}

async function editPartnerService(serviceId) {
  const row = document
    .querySelector(
      `#partnerServicesList button[onclick="window.editPartnerService('${serviceId}')"]`
    )
    ?.closest("tr");

  currentEditingServiceId = serviceId;
  const submitBtn = document.getElementById("serviceFormSubmitBtn");
  const cancelBtn = document.getElementById("serviceFormCancelBtn");

  if (submitBtn) submitBtn.textContent = "Cập nhật";
  if (cancelBtn) cancelBtn.classList.remove("hidden");

  if (!row) {
    // Fallback: just keep edit mode, user can retype
    return;
  }

  const name = row.querySelector("td:nth-child(1) .text-sm")?.textContent || "";
  const price = row.querySelector("td:nth-child(2)")?.textContent || "0";

  const nameInput = document.getElementById("serviceName");
  const priceInput = document.getElementById("servicePrice");

  if (nameInput) nameInput.value = name.trim();
  if (priceInput)
    priceInput.value =
      Number(price.replaceAll(".", "").replaceAll(",", "")) || 0;
}

async function deletePartnerService(serviceId) {
  Modal.confirm({
    title: "Xác nhận xoá",
    message: "Bạn chắc chắn muốn xoá dịch vụ này?",
    confirmText: "Xoá",
    cancelText: "Hủy",
    confirmColor: "red",
    onConfirm: async () => {
      try {
        const res = await apiDelete(`${API_BASE}/services/${serviceId}`);
        if (!res) return;
        const result = await res.json();

        if (result.success) {
          Notification.success("Xoá dịch vụ thành công");
          if (currentEditingServiceId === serviceId) {
            resetPartnerServiceForm();
          }
          await loadPartnerServices();
        } else {
          Notification.error(result.message || "Lỗi khi xoá dịch vụ");
        }
      } catch (err) {
        console.error(err);
        Notification.error("Lỗi khi xoá dịch vụ");
      }
    },
  });
}

window.openPartnerServicesModal = openPartnerServicesModal;
window.closePartnerServicesModal = closePartnerServicesModal;
window.resetPartnerServiceForm = resetPartnerServiceForm;
window.editPartnerService = editPartnerService;
window.deletePartnerService = deletePartnerService;
