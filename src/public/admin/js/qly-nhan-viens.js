import { Modal, Notification } from "../../utils/modal.js";
import { apiGet, apiPost, apiDelete, apiPatch } from "../../utils/api.js";
import { validateRegisterInput } from "../../utils/validators.js";

// Biến toàn cục
let staffData = [];
let modalMode = "create"; // 'create' hoặc 'edit'
let currentStaffId = null;
let currentStatusFilter = ""; // Biến lưu filter trạng thái

// Khởi tạo trang quản lý nhân viên
document.addEventListener("DOMContentLoaded", async function () {
  // Lấy danh sách nhân viên từ API
  await loadStaffList();

  // Render bảng nhân viên
  const staffTableBody = document.getElementById("staffTableBody");
  if (staffTableBody) {
    renderStaffTable();
  }

  // Gán sự kiện tìm kiếm
  const staffSearchInput = document.getElementById("staffSearchInput");
  if (staffSearchInput) {
    staffSearchInput.addEventListener("input", function (e) {
      searchStaff(e.target.value);
    });
  }

  // Gán sự kiện filter trạng thái
  const statusFilter = document.getElementById("staffStatusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", function (e) {
      currentStatusFilter = e.target.value;
      renderStaffTable();
    });
  }

  // Gán sự kiện form thêm nhân viên
  const addStaffForm = document.getElementById("addStaffForm");
  if (addStaffForm) {
    addStaffForm.addEventListener("submit", handleAddStaff);
  }

  // Gán sự kiện cho action buttons sử dụng event delegation
  const actionTableBody = document.getElementById("staffTableBody");
  if (actionTableBody) {
    actionTableBody.addEventListener("click", function (e) {
      const viewBtn = e.target.closest(".staff-view-btn");
      const editBtn = e.target.closest(".staff-edit-btn");
      const deleteBtn = e.target.closest(".staff-delete-btn");
      const suspendBtn = e.target.closest(".staff-suspend-btn");
      const activateBtn = e.target.closest(".staff-activate-btn");

      if (viewBtn) {
        const staffId = viewBtn.getAttribute("data-staff-id");
        viewStaffDetail(staffId);
      } else if (editBtn) {
        const staffId = editBtn.getAttribute("data-staff-id");
        editStaff(staffId);
      } else if (deleteBtn) {
        const staffId = deleteBtn.getAttribute("data-staff-id");
        confirmDelete(staffId);
      } else if (suspendBtn) {
        const staffId = suspendBtn.getAttribute("data-staff-id");
        toggleStaffStatus(staffId, "inactive");
      } else if (activateBtn) {
        const staffId = activateBtn.getAttribute("data-staff-id");
        toggleStaffStatus(staffId, "active");
      }
    });
  }

  // Gán sự kiện nút Xuất Excel
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportStaffData);
  }

  // Gán sự kiện nút Thêm nhân viên
  const addStaffBtn = document.getElementById("addStaffBtn");
  if (addStaffBtn) {
    addStaffBtn.addEventListener("click", showAddStaffModal);
  }

  // Gán sự kiện ESC để đóng modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = document.getElementById("addStaffModal");
      if (modal && !modal.classList.contains("hidden")) {
        hideAddStaffModal();
      }
    }
  });
});

// ===========================
// QUẢN LÝ DỮ LIỆU - API
// ===========================

// Lấy danh sách nhân viên từ API
async function loadStaffList() {
  try {
    const response = await fetch("/api/staffs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      staffData = [];
      return;
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      staffData = result.data;
    } else {
      staffData = [];
    }
  } catch (error) {
    staffData = [];
  }
}

// ===========================
// RENDER & HIỂN THỊ DỮ LIỆU
// ===========================

// Render bảng danh sách nhân viên
function renderStaffTable() {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) {
    return;
  }

  let filteredData = [...staffData];

  // Apply status filter
  if (currentStatusFilter) {
    filteredData = filteredData.filter(
      (staff) => staff.status === currentStatusFilter
    );
  }

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center">
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

// Render một dòng nhân viên trong bảng
function renderStaffRow(staff) {
  const status = staff.status || "active";
  const statusText = getStatusText(status);
  const statusClass = getStatusClass(status);
  const isActive = status === "active";

  // Format date of birth
  const dateOfBirth = staff.dateOfBirth
    ? new Date(staff.dateOfBirth).toLocaleDateString("vi-VN")
    : "N/A";

  return `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4 whitespace-nowrap" data-label="Nhân viên">
        <div class="flex items-center">
          <img 
            class="h-10 w-10 rounded-full" 
            src="https://ui-avatars.com/api/?name=${encodeURIComponent(
              staff.fullName.split(" ").pop()[0].toUpperCase()
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
        <div class="text-sm text-gray-900">${staff.gender || "N/A"}</div>
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

// Tìm kiếm nhân viên theo từ khóa (tên, email, phone)
function searchStaff(query) {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  const searchQuery = query.toLowerCase();
  let filteredData = staffData.filter((staff) => {
    // Filter by search query
    const matchesSearch =
      (staff.fullName || "").toLowerCase().includes(searchQuery) ||
      (staff.email || "").toLowerCase().includes(searchQuery) ||
      (staff.phone || "").includes(query);

    // Filter by status
    const matchesStatus =
      !currentStatusFilter || staff.status === currentStatusFilter;

    return matchesSearch && matchesStatus;
  });

  tbody.innerHTML =
    filteredData.length > 0
      ? filteredData.map((staff) => renderStaffRow(staff)).join("")
      : `
    <tr>
      <td colspan="5" class="px-6 py-8 text-center">
        <div class="text-gray-500">
          <i class="fas fa-search text-3xl mb-3 block"></i>
          <p>Không tìm thấy nhân viên phù hợp</p>
        </div>
      </td>
    </tr>
  `;
}

// ===========================
// QUẢN LÝ HÀNH ĐỘNG
// ===========================

// Xử lý sự kiện thêm/chỉnh sửa nhân viên
async function handleAddStaff(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Lấy dữ liệu từ form
  const fullName = formData.get("staffName");
  const email = formData.get("staffEmail");
  const phone = formData.get("staffPhone");
  const gender = formData.get("gender");
  const dateOfBirth = formData.get("dateOfBirth");
  const password = formData.get("password");
  const passwordConfirm = formData.get("passwordConfirm");

  // Xóa tất cả error messages trước
  clearAllErrors(form);

  const errors = {};

  // Validation dữ liệu form
  if (!fullName || fullName.trim().length === 0) {
    errors.staffName = "Vui lòng nhập tên nhân viên";
  } else if (fullName.trim().length < 3) {
    errors.staffName = "Tên nhân viên phải tối thiểu 3 ký tự";
  }

  if (!email) {
    errors.staffEmail = "Vui lòng nhập email";
  } else if (!validateEmail(email)) {
    errors.staffEmail = "Email không hợp lệ";
  }

  if (!phone) {
    errors.staffPhone = "Vui lòng nhập số điện thoại";
  } else if (!validatePhoneNumber(phone)) {
    errors.staffPhone = "Số điện thoại không hợp lệ";
  }

  // Mode-specific validation
  if (modalMode === "create") {
    // Khi thêm mới, password bắt buộc
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (!validatePassword(password)) {
      errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    }
  } else if (modalMode === "edit") {
    // Khi sửa, password không bắt buộc nhưng nếu nhập thì phải match
    if (password && !validatePassword(password)) {
      errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
    }

    if (password && passwordConfirm && password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    } else if (
      (password && !passwordConfirm) ||
      (!password && passwordConfirm)
    ) {
      errors.password =
        "Mật khẩu và xác nhận mật khẩu phải cùng được điền hoặc bỏ trống";
    }
  }

  // Hiển thị lỗi nếu có
  if (Object.keys(errors).length > 0) {
    displayFormErrors(form, errors);
    return;
  }

  // Chuẩn bị dữ liệu
  const staffDataToSend = {
    fullName: fullName,
    email: email,
    phone: phone,
    gender: gender || null,
    dateOfBirth: dateOfBirth || null,
  };

  // Thêm password nếu có
  if (password) {
    staffDataToSend.password = password;
    staffDataToSend.passwordConfirm = passwordConfirm;
  }

  // Gọi API thêm hoặc sửa nhân viên
  let result;
  if (modalMode === "create") {
    result = await addStaffViaAPI(staffDataToSend);
  } else if (modalMode === "edit") {
    result = await updateStaffViaAPI(currentStaffId, staffDataToSend);
  }

  // Chỉ dùng notification cho trạng thái thành công/thất bại cuối cùng
  if (result.success) {
    const successMsg =
      modalMode === "create"
        ? "Thêm nhân viên thành công"
        : "Cập nhật nhân viên thành công";
    Notification.success(result.message || successMsg);

    // Tải lại danh sách nhân viên
    await loadStaffList();
    renderStaffTable();
    hideAddStaffModal();
  } else {
    // Nếu API trả lỗi validation, hiển thị lỗi từng trường
    if (result.errors && Object.keys(result.errors).length > 0) {
      displayFormErrors(form, result.errors);
    } else {
      // Nếu là lỗi chung, dùng notification
      Notification.error(result.message || "Có lỗi xảy ra");
    }
  }
}

// Xuất danh sách nhân viên ra file Excel
async function exportStaffData() {
  try {
    if (staffData.length === 0) {
      Notification.warning("Không có dữ liệu nhân viên để xuất");
      return;
    }

    // Tạo dữ liệu CSV
    const headers = [
      "STT",
      "Tên nhân viên",
      "Email",
      "Điện thoại",
      "Chức vụ",
      "Trạng thái",
      "Ngày tạo",
    ];

    const rows = staffData.map((staff, index) => [
      index + 1,
      staff.fullName,
      staff.email,
      staff.phone || "N/A",
      staff.role || "admin",
      getStatusText(staff.status || "active"),
      formatDate(staff.createdAt || new Date().toISOString()),
    ]);

    // Tạo CSV content
    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    // Tải file
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
    Notification.error("Có lỗi xảy ra khi xuất dữ liệu");
  }
}

// Thay đổi trạng thái nhân viên (tạm dừng/kích hoạt)
async function toggleStaffStatus(staffId, newStatus) {
  try {
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
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          });

          const result = await response.json();

          if (result.success) {
            // Cập nhật trạng thái trong mảy dữ liệu
            const staffIndex = staffData.findIndex((s) => s._id === staffId);
            if (staffIndex !== -1) {
              staffData[staffIndex].status = newStatus;
            }

            // Render lại bảng
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
  } catch (error) {
    console.error("Error toggling status:", error);
    Notification.error("Có lỗi xảy ra khi cập nhật trạng thái");
  }
}

// Chỉnh sửa thông tin nhân viên
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

    // Cập nhật UI
    modalTitle.textContent = "Chỉnh sửa nhân viên";
    if (submitBtn) submitBtn.textContent = "Cập nhật nhân viên";

    // Điền dữ liệu vào form
    form.elements["staffName"].value = staff.fullName || "";
    form.elements["staffEmail"].value = staff.email || "";
    form.elements["staffPhone"].value = staff.phone || "";
    form.elements["gender"].value = staff.gender || "";

    // Format date for input type="date"
    if (staff.dateOfBirth) {
      const date = new Date(staff.dateOfBirth);
      const dateString = date.toISOString().split("T")[0];
      form.elements["dateOfBirth"].value = dateString;
    } else {
      form.elements["dateOfBirth"].value = "";
    }

    // Clear password fields khi sửa
    form.elements["password"].value = "";
    form.elements["passwordConfirm"].value = "";
    form.elements["password"].placeholder = "Để trống nếu không muốn thay đổi";
    form.elements["passwordConfirm"].placeholder =
      "Để trống nếu không muốn thay đổi";

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Error editing staff:", error);
    Notification.error("Có lỗi xảy ra khi chỉnh sửa nhân viên");
  }
}

// Xác nhận xóa nhân viên
async function confirmDelete(staffId) {
  try {
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
            headers: {
              "Content-Type": "application/json",
            },
          });

          const result = await response.json();

          if (result.success) {
            // Cập nhật dữ liệu
            staffData = staffData.filter((s) => s._id !== staffId);

            // Render lại bảng
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
  } catch (error) {
    console.error("Error deleting staff:", error);
    Notification.error("Có lỗi xảy ra khi xóa nhân viên");
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Lấy class CSS tương ứng với trạng thái nhân viên
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-green-100 text-green-800";
  }
}

// Chuyển đổi mã trạng thái sang text hiển thị
function getStatusText(status) {
  switch (status) {
    case "active":
      return "Hoạt động";
    case "inactive":
      return "Tạm dừng";
    default:
      return "Hoạt động";
  }
}

// Định dạng ngày theo chuẩn Việt Nam (dd/mm/yyyy)
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "N/A";
  }
}
// ===========================
// XỬ LÝ MODAL
// ===========================

// Mở modal thêm nhân viên
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

    // Reset password field placeholders
    form.elements["password"].placeholder = "Nhập mật khẩu";
    form.elements["passwordConfirm"].placeholder = "Xác nhận mật khẩu";

    form.reset();
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    console.error("Modal elements not found:", { modal, form, modalTitle });
  }
};

// Đóng modal
window.hideAddStaffModal = function () {
  const modal = document.getElementById("addStaffModal");
  const form = document.getElementById("addStaffForm");

  if (modal && form) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    form.reset();

    modalMode = "create";
    currentStaffId = null;
  }
};

// Thêm nhân viên qua API
async function addStaffViaAPI(staffData) {
  try {
    const response = await fetch("/api/staffs/add-staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(staffData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error adding staff:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi thêm nhân viên",
      errors: {},
    };
  }
}

// Cập nhật thông tin nhân viên qua API
async function updateStaffViaAPI(staffId, staffData) {
  try {
    const response = await fetch(`/api/staffs/${staffId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(staffData),
    });

    const result = await response.json();
    return result;
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
// VALIDATION HELPER FUNCTIONS
// ===========================

// Validate email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password
function validatePassword(password) {
  return password && password.length >= 6;
}

// Validate phone number
function validatePhoneNumber(phone) {
  const phoneRegex = /^(?:\+84|0|84)[1-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// Hiển thị lỗi từng trường
function displayFormErrors(form, errors) {
  // Xóa tất cả error messages cũ
  clearAllErrors(form);

  // Hiển thị lỗi từng trường
  for (const [fieldName, errorMessage] of Object.entries(errors)) {
    // Map field names từ API sang HTML input names
    let inputName = fieldName;
    if (fieldName === "fullName") inputName = "staffName";
    if (fieldName === "email") inputName = "staffEmail";
    if (fieldName === "phone") inputName = "staffPhone";

    const input = form.elements[inputName];
    if (input) {
      // Tìm hoặc tạo error container
      let errorContainer = input.parentElement.querySelector(".error-message");
      if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.className = "error-message text-red-500 text-sm mt-1";
        input.parentElement.appendChild(errorContainer);
      }
      errorContainer.textContent = errorMessage;
      errorContainer.classList.remove("hidden");

      // Thêm red border vào input
      input.classList.add("border-red-500", "focus:ring-red-500");
    }
  }
}

// Xóa tất cả error messages
function clearAllErrors(form) {
  // Xóa tất cả error message divs
  const errorMessages = form.querySelectorAll(".error-message");
  errorMessages.forEach((el) => {
    el.remove();
  });

  // Xóa red border khỏi inputs
  const inputs = form.querySelectorAll("input");
  inputs.forEach((input) => {
    input.classList.remove("border-red-500", "focus:ring-red-500");
  });
}
