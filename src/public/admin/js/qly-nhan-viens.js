import { Modal, Notification } from "../../utils/modal.js";
import { validateRegisterInput } from "../../utils/validators.js";

// Biến toàn cục
let staffData = [];
let modalMode = "create";
let currentStaffId = null;
let currentStatusFilter = "";

// ===========================
// KHỞI TẠO
// ===========================

document.addEventListener("DOMContentLoaded", async function () {
  await loadStaffList();
  renderStaffTable();
  initializeEventListeners();
});

function initializeEventListeners() {
  // Tìm kiếm
  const staffSearchInput = document.getElementById("staffSearchInput");
  if (staffSearchInput) {
    staffSearchInput.addEventListener("input", (e) =>
      searchStaff(e.target.value)
    );
  }

  // Filter trạng thái
  const statusFilter = document.getElementById("staffStatusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      currentStatusFilter = e.target.value;
      renderStaffTable();
    });
  }

  // Form validation
  const addStaffForm = document.getElementById("addStaffForm");
  if (addStaffForm) {
    addStaffForm.addEventListener("submit", handleAddStaff);

    const inputs = addStaffForm.querySelectorAll("input, select");
    inputs.forEach((input) => {
      input.addEventListener("blur", () => validateFormField(input));
      input.addEventListener("input", () => clearFieldError(input));
    });
  }

  // Action buttons (event delegation)
  const staffTableBody = document.getElementById("staffTableBody");
  if (staffTableBody) {
    staffTableBody.addEventListener("click", handleTableActions);
  }

  // Xuất Excel
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportStaffData);
  }

  // Thêm nhân viên
  const addStaffBtn = document.getElementById("addStaffBtn");
  if (addStaffBtn) {
    addStaffBtn.addEventListener("click", showAddStaffModal);
  }

  // ESC để đóng modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("addStaffModal");
      if (modal && !modal.classList.contains("hidden")) {
        hideAddStaffModal();
      }
    }
  });
}

function handleTableActions(e) {
  const viewBtn = e.target.closest(".staff-view-btn");
  const editBtn = e.target.closest(".staff-edit-btn");
  const deleteBtn = e.target.closest(".staff-delete-btn");
  const suspendBtn = e.target.closest(".staff-suspend-btn");
  const activateBtn = e.target.closest(".staff-activate-btn");

  if (viewBtn) {
    viewStaffDetail(viewBtn.getAttribute("data-staff-id"));
  } else if (editBtn) {
    editStaff(editBtn.getAttribute("data-staff-id"));
  } else if (deleteBtn) {
    confirmDelete(deleteBtn.getAttribute("data-staff-id"));
  } else if (suspendBtn) {
    toggleStaffStatus(suspendBtn.getAttribute("data-staff-id"), "inactive");
  } else if (activateBtn) {
    toggleStaffStatus(activateBtn.getAttribute("data-staff-id"), "active");
  }
}

// ===========================
// API CALLS
// ===========================

async function loadStaffList() {
  try {
    const response = await fetch("/api/staffs", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      staffData = [];
      return;
    }

    const result = await response.json();
    staffData = result.success && Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("Error loading staff list:", error);
    staffData = [];
  }
}

async function addStaffViaAPI(staffData) {
  try {
    const response = await fetch("/api/staffs/add-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding staff:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi thêm nhân viên",
      errors: {},
    };
  }
}

async function updateStaffViaAPI(staffId, staffData) {
  try {
    const response = await fetch(`/api/staffs/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating staff:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật nhân viên",
      errors: {},
    };
  }
}

// ===========================
// RENDER UI
// ===========================

function renderStaffTable() {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  let filteredData = [...staffData];

  if (currentStatusFilter) {
    filteredData = filteredData.filter(
      (staff) => staff.status === currentStatusFilter
    );
  }

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center">
          <div class="text-gray-500">
            <i class="fas fa-inbox text-3xl mb-3 block"></i>
            <p>Không có dữ liệu nhân viên</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredData.map((staff) => renderStaffRow(staff)).join("");
}

function renderStaffRow(staff) {
  const status = staff.status || "active";
  const statusText = getStatusText(status);
  const statusClass = getStatusClass(status);
  const isActive = status === "active";

  const dateOfBirth = staff.dateOfBirth
    ? new Date(staff.dateOfBirth).toLocaleDateString("vi-VN")
    : "";

  const avatarLetter = staff.fullName.split(" ").pop()[0].toUpperCase();

  return `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4 whitespace-nowrap" data-label="Nhân viên">
        <div class="flex items-center">
          <img 
            class="h-10 w-10 rounded-full" 
            src="https://ui-avatars.com/api/?name=${encodeURIComponent(
              avatarLetter
            )}&background=random" 
            alt="${staff.fullName}"
          >
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${
              staff.fullName
            }</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Giới tính">
        <div class="text-sm text-gray-900">${staff.gender || ""}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Ngày sinh">
        <div class="text-sm text-gray-900">${dateOfBirth}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Email">
        <div class="text-sm text-gray-900">${staff.email || "N/A"}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Số điện thoại">
        <div class="text-sm text-gray-900">${staff.phone || "N/A"}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Trạng thái">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
          ${statusText}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" data-label="Thao tác">
        <button 
          class="staff-edit-btn text-blue-600 hover:text-blue-900 transition" 
          data-staff-id="${staff._id}"
          title="Chỉnh sửa"
        >
          <i class="fas fa-edit"></i> Sửa
        </button>
        ${
          isActive
            ? `<button 
          class="staff-suspend-btn text-orange-600 hover:text-orange-900 transition" 
          data-staff-id="${staff._id}"
          title="Tạm dừng"
        >
          <i class="fas fa-pause-circle"></i> Tạm dừng
        </button>`
            : `<button 
          class="staff-activate-btn text-green-600 hover:text-green-900 transition" 
          data-staff-id="${staff._id}"
          title="Kích hoạt"
        >
          <i class="fas fa-check-circle"></i> Kích hoạt
        </button>`
        }
        <button 
          class="staff-delete-btn text-red-600 hover:text-red-900 transition" 
          data-staff-id="${staff._id}"
          title="Xóa"
        >
          <i class="fas fa-trash"></i> Xóa
        </button>
      </td>
    </tr>
  `;
}

// ===========================
// TÌM KIẾM
// ===========================

function searchStaff(query) {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  const searchQuery = query.toLowerCase();
  const filteredData = staffData.filter((staff) => {
    const matchesSearch =
      (staff.fullName || "").toLowerCase().includes(searchQuery) ||
      (staff.email || "").toLowerCase().includes(searchQuery) ||
      (staff.phone || "").includes(query);

    const matchesStatus =
      !currentStatusFilter || staff.status === currentStatusFilter;

    return matchesSearch && matchesStatus;
  });

  tbody.innerHTML =
    filteredData.length > 0
      ? filteredData.map((staff) => renderStaffRow(staff)).join("")
      : `
    <tr>
      <td colspan="7" class="px-6 py-8 text-center">
        <div class="text-gray-500">
          <i class="fas fa-search text-3xl mb-3 block"></i>
          <p>Không tìm thấy nhân viên phù hợp</p>
        </div>
      </td>
    </tr>
  `;
}

// ===========================
// XỬ LÝ FORM
// ===========================

async function handleAddStaff(e) {
  e.preventDefault();

  const form = e.target;
  clearAllErrors(form);

  // Lấy dữ liệu từ form
  const formData = getFormData(form);

  // Validation
  let errors = {};

  if (modalMode === "create") {
    // Dùng validateRegisterInput cho create mode
    const validation = validateRegisterInput(
      formData.fullName,
      formData.email,
      formData.phone,
      formData.password,
      formData.passwordConfirm
    );

    if (!validation.isValid) {
      errors = validation.errors;
    }
  } else if (modalMode === "edit") {
    // Validation riêng cho edit mode
    const validation = validateRegisterInput(
      formData.fullName,
      formData.email,
      formData.phone,
      formData.password || "123456", // Dummy password để pass validation
      formData.passwordConfirm || "123456"
    );

    // Lọc lỗi - chỉ giữ lỗi của fullName, email, phone
    if (!validation.isValid) {
      const { fullName, email, phone } = validation.errors;
      if (fullName) errors.fullName = fullName;
      if (email) errors.email = email;
      if (phone) errors.phone = phone;
    }

    // Validation password riêng cho edit mode
    if (formData.password || formData.passwordConfirm) {
      if (formData.password && formData.password.length < 6) {
        errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
      }
      if (formData.password !== formData.passwordConfirm) {
        errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
      }
    }
  }

  // Hiển thị lỗi nếu có
  if (Object.keys(errors).length > 0) {
    displayFormErrors(form, errors);
    return;
  }

  // Chuẩn bị dữ liệu gửi API
  const staffDataToSend = {
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    gender: formData.gender || null,
    dateOfBirth: formData.dateOfBirth || null,
  };

  // Chỉ thêm password nếu có giá trị
  if (formData.password) {
    staffDataToSend.password = formData.password;
    staffDataToSend.passwordConfirm = formData.passwordConfirm;
  }

  // Gọi API
  const result =
    modalMode === "create"
      ? await addStaffViaAPI(staffDataToSend)
      : await updateStaffViaAPI(currentStaffId, staffDataToSend);

  // Xử lý kết quả
  if (result.success) {
    const successMsg =
      modalMode === "create"
        ? "Thêm nhân viên thành công"
        : "Cập nhật nhân viên thành công";
    Notification.success(result.message || successMsg);

    await loadStaffList();
    renderStaffTable();
    hideAddStaffModal();
  } else {
    if (result.errors && Object.keys(result.errors).length > 0) {
      displayFormErrors(form, result.errors);
    } else {
      Notification.error(result.message || "Có lỗi xảy ra");
    }
  }
}

function getFormData(form) {
  return {
    fullName: form.querySelector('input[name="staffName"]')?.value.trim() || "",
    email: form.querySelector('input[name="staffEmail"]')?.value.trim() || "",
    phone: form.querySelector('input[name="staffPhone"]')?.value.trim() || "",
    password: form.querySelector('input[name="password"]')?.value || "",
    passwordConfirm:
      form.querySelector('input[name="passwordConfirm"]')?.value || "",
    gender: form.querySelector('select[name="gender"]')?.value || "",
    dateOfBirth: form.querySelector('input[name="dateOfBirth"]')?.value || "",
  };
}

// ===========================
// MODAL
// ===========================

window.showAddStaffModal = function () {
  modalMode = "create";
  currentStaffId = null;

  const modal = document.getElementById("addStaffModal");
  const form = document.getElementById("addStaffForm");
  const modalTitle = document.getElementById("staffModalTitle");
  const submitBtn = form?.querySelector("button[type='submit']");

  if (modal && form && modalTitle) {
    modalTitle.textContent = "Thêm nhân viên";
    if (submitBtn) submitBtn.textContent = "Thêm nhân viên";

    const passwordInput = form.querySelector('input[name="password"]');
    const passwordConfirmInput = form.querySelector(
      'input[name="passwordConfirm"]'
    );
    if (passwordInput) passwordInput.placeholder = "Nhập mật khẩu";
    if (passwordConfirmInput)
      passwordConfirmInput.placeholder = "Xác nhận mật khẩu";

    form.reset();
    clearAllErrors(form);
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
};

window.hideAddStaffModal = function () {
  const modal = document.getElementById("addStaffModal");
  const form = document.getElementById("addStaffForm");

  if (modal && form) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    form.reset();
    clearAllErrors(form);
    modalMode = "create";
    currentStaffId = null;
  }
};

async function editStaff(staffId) {
  try {
    const staff = staffData.find((s) => s._id === staffId);
    if (!staff) {
      Notification.error("Không tìm thấy nhân viên");
      return;
    }

    modalMode = "edit";
    currentStaffId = staffId;

    const modal = document.getElementById("addStaffModal");
    const form = document.getElementById("addStaffForm");
    const modalTitle = document.getElementById("staffModalTitle");
    const submitBtn = form?.querySelector("button[type='submit']");

    if (!modal || !form || !modalTitle) {
      Notification.error("Lỗi: Modal không tìm thấy");
      return;
    }

    modalTitle.textContent = "Chỉnh sửa nhân viên";
    if (submitBtn) submitBtn.textContent = "Cập nhật nhân viên";

    // Điền dữ liệu
    form.querySelector('input[name="staffName"]').value = staff.fullName || "";
    form.querySelector('input[name="staffEmail"]').value = staff.email || "";
    form.querySelector('input[name="staffPhone"]').value = staff.phone || "";
    form.querySelector('select[name="gender"]').value = staff.gender || "";

    const dateInput = form.querySelector('input[name="dateOfBirth"]');
    if (dateInput && staff.dateOfBirth) {
      dateInput.value = new Date(staff.dateOfBirth).toISOString().split("T")[0];
    }

    // Clear password fields
    const passwordInput = form.querySelector('input[name="password"]');
    const passwordConfirmInput = form.querySelector(
      'input[name="passwordConfirm"]'
    );
    if (passwordInput) {
      passwordInput.value = "";
      passwordInput.placeholder = "Để trống nếu không muốn thay đổi";
    }
    if (passwordConfirmInput) {
      passwordConfirmInput.value = "";
      passwordConfirmInput.placeholder = "Để trống nếu không muốn thay đổi";
    }

    clearAllErrors(form);
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error editing staff:", error);
    Notification.error("Có lỗi xảy ra khi chỉnh sửa nhân viên");
  }
}

// ===========================
// DELETE & STATUS
// ===========================

async function confirmDelete(staffId) {
  const staff = staffData.find((s) => s._id === staffId);
  if (!staff) {
    Notification.error("Không tìm thấy nhân viên");
    return;
  }

  Modal.confirm({
    title: "Xóa nhân viên",
    message: `Bạn có chắc chắn muốn xóa nhân viên ${staff.fullName}?<br/><span class="text-red-600 text-sm">Hành động này không thể hoàn tác!</span>`,
    icon: "fa-trash",
    iconColor: "red",
    confirmText: "Xóa",
    confirmColor: "red",
    onConfirm: async () => {
      try {
        const response = await fetch(`/api/staffs/${staffId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        if (result.success) {
          staffData = staffData.filter((s) => s._id !== staffId);
          renderStaffTable();
          Notification.success("Xóa nhân viên thành công");
        } else {
          Notification.error(
            result.message || "Có lỗi xảy ra khi xóa nhân viên"
          );
        }
      } catch (error) {
        console.error("Error deleting staff:", error);
        Notification.error("Có lỗi xảy ra khi xóa nhân viên");
      }
    },
  });
}

async function toggleStaffStatus(staffId, newStatus) {
  const staff = staffData.find((s) => s._id === staffId);
  if (!staff) {
    Notification.error("Không tìm thấy nhân viên");
    return;
  }

  const statusText = newStatus === "active" ? "kích hoạt" : "tạm dừng";
  const isActivating = newStatus === "active";

  Modal.confirm({
    title: isActivating ? "Kích hoạt nhân viên" : "Tạm dừng nhân viên",
    message: `Bạn có chắc chắn muốn ${statusText} tài khoản của ${staff.fullName}?`,
    icon: "fa-exclamation-circle",
    iconColor: isActivating ? "green" : "orange",
    confirmText: isActivating ? "Kích hoạt" : "Tạm dừng",
    confirmColor: isActivating ? "green" : "orange",
    onConfirm: async () => {
      try {
        const response = await fetch(`/api/staffs/${staffId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();

        if (result.success) {
          const staffIndex = staffData.findIndex((s) => s._id === staffId);
          if (staffIndex !== -1) {
            staffData[staffIndex].status = newStatus;
          }
          renderStaffTable();
          Notification.success(
            result.message ||
              `${
                statusText.charAt(0).toUpperCase() + statusText.slice(1)
              } thành công`
          );
        } else {
          Notification.error(result.message || "Có lỗi xảy ra");
        }
      } catch (error) {
        console.error("Error toggling status:", error);
        Notification.error("Có lỗi xảy ra khi cập nhật trạng thái");
      }
    },
  });
}

// ===========================
// EXPORT
// ===========================

async function exportStaffData() {
  if (staffData.length === 0) {
    Notification.warning("Không có dữ liệu nhân viên để xuất");
    return;
  }

  try {
    const headers = [
      "STT",
      "Tên nhân viên",
      "Email",
      "Điện thoại",
      "Giới tính",
      "Trạng thái",
      "Ngày tạo",
    ];

    const rows = staffData.map((staff, index) => [
      index + 1,
      staff.fullName,
      staff.email,
      staff.phone || "N/A",
      staff.gender || "N/A",
      getStatusText(staff.status || "active"),
      formatDate(staff.createdAt || new Date().toISOString()),
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", `nhan-vien-${Date.now()}.csv`);
    element.style.display = "none";

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    Notification.success("Xuất dữ liệu thành công!");
  } catch (error) {
    console.error("Error exporting data:", error);
    Notification.error("Có lỗi xảy ra khi xuất dữ liệu");
  }
}

// ===========================
// VALIDATION HELPERS
// ===========================

function displayFormErrors(form, errors) {
  clearAllErrors(form);

  for (const [fieldName, errorMessage] of Object.entries(errors)) {
    let inputName = fieldName;
    if (fieldName === "fullName") inputName = "staffName";
    if (fieldName === "email") inputName = "staffEmail";
    if (fieldName === "phone") inputName = "staffPhone";

    const input = form.querySelector(
      `input[name="${inputName}"], select[name="${inputName}"]`
    );
    if (input) {
      let errorContainer = input.parentElement.querySelector(".error-message");
      if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.className = "error-message text-red-500 text-sm mt-1";
        input.parentElement.appendChild(errorContainer);
      }
      errorContainer.textContent = errorMessage;
      input.classList.add("border-red-500", "focus:ring-red-500");
    }
  }
}

function clearAllErrors(form) {
  form.querySelectorAll(".error-message").forEach((el) => el.remove());
  form.querySelectorAll("input, select").forEach((input) => {
    input.classList.remove("border-red-500", "focus:ring-red-500");
  });
}

function clearFieldError(input) {
  input.classList.remove("border-red-500", "focus:ring-red-500");
  const errorContainer = input.parentElement.querySelector(".error-message");
  if (errorContainer) errorContainer.remove();
}

function validateFormField(input) {
  const form = input.closest("form");
  if (!form) return;

  const fieldValue = input.value.trim();
  const formData = getFormData(form);

  // Dùng validateRegisterInput để validate
  const validation = validateRegisterInput(
    formData.fullName || "abc", // Dummy nếu empty
    formData.email || "test@test.com",
    formData.phone || "0123456789",
    formData.password || "123456",
    formData.passwordConfirm || "123456"
  );

  let errorMessage = "";
  const fieldName = input.name;

  // Map lỗi từ validation
  if (fieldName === "staffName" && validation.errors.fullName) {
    if (!fieldValue) {
      errorMessage = "Vui lòng nhập tên nhân viên";
    } else {
      errorMessage = validation.errors.fullName;
    }
  } else if (fieldName === "staffEmail" && validation.errors.email) {
    if (!fieldValue) {
      errorMessage = "Vui lòng nhập email";
    } else {
      errorMessage = validation.errors.email;
    }
  } else if (fieldName === "staffPhone" && validation.errors.phone) {
    if (!fieldValue) {
      errorMessage = "Vui lòng nhập số điện thoại";
    } else {
      errorMessage = validation.errors.phone;
    }
  } else if (fieldName === "password") {
    if (modalMode === "create" && !fieldValue) {
      errorMessage = "Vui lòng nhập mật khẩu";
    } else if (fieldValue && fieldValue.length < 6) {
      errorMessage = "Mật khẩu phải tối thiểu 6 ký tự";
    }
  } else if (fieldName === "passwordConfirm") {
    const passwordInput = form.querySelector('input[name="password"]');
    if (modalMode === "create" && !fieldValue) {
      errorMessage = "Vui lòng xác nhận mật khẩu";
    } else if (
      fieldValue &&
      passwordInput &&
      passwordInput.value !== fieldValue
    ) {
      errorMessage = "Mật khẩu xác nhận không khớp";
    }
  }

  if (errorMessage) {
    input.classList.add("border-red-500", "focus:ring-red-500");
    let errorContainer = input.parentElement.querySelector(".error-message");
    if (!errorContainer) {
      errorContainer = document.createElement("div");
      errorContainer.className = "error-message text-red-500 text-sm mt-1";
      input.parentElement.appendChild(errorContainer);
    }
    errorContainer.textContent = errorMessage;
  } else {
    clearFieldError(input);
  }
}

// ===========================
// UTILITY
// ===========================

function getStatusClass(status) {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
}

function getStatusText(status) {
  return status === "active" ? "Hoạt động" : "Tạm dừng";
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "N/A";
  }
}

function viewStaffDetail(staffId) {
  // TODO: Implement view detail
  console.log("View staff detail:", staffId);
}
