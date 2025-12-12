// ===========================
// QUẢN LÝ NHÂN VIÊN - ADMIN
// ===========================

// Global variables
let staffData = []; // Danh sách nhân viên

/**
 * Khởi tạo trang quản lý nhân viên
 * - Lấy danh sách nhân viên từ API
 * - Render bảng nhân viên
 * - Gán sự kiện cho các nút và form
 */
document.addEventListener("DOMContentLoaded", async function () {
  console.log("🔧 Initializing staff management page...");

  // Lấy danh sách nhân viên từ API
  await loadStaffList();

  // Render bảng nhân viên
  const staffTableBody = document.getElementById("staffTableBody");
  if (staffTableBody) {
    renderStaffTable();
    // Remove: updateStaffStats() - không cần vì bỏ stats khỏi view
  }

  // Gán sự kiện tìm kiếm
  const staffSearchInput = document.getElementById("staffSearchInput");
  if (staffSearchInput) {
    staffSearchInput.addEventListener("input", function (e) {
      searchStaff(e.target.value);
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

      if (viewBtn) {
        const staffId = viewBtn.getAttribute("data-staff-id");
        viewStaffDetail(staffId);
      } else if (editBtn) {
        const staffId = editBtn.getAttribute("data-staff-id");
        editStaff(staffId);
      } else if (deleteBtn) {
        const staffId = deleteBtn.getAttribute("data-staff-id");
        confirmDelete(staffId);
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
    console.log("✅ Add staff button listener attached");
  }

  // Gán sự kiện nút Hủy đóng modal
  const closeModalBtn = document.getElementById("closeModalBtn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", hideAddStaffModal);
  }

  // Gán sự kiện nút Hủy form
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", hideAddStaffModal);
  }

  console.log("✅ Staff management page initialized successfully!");
});

// ===========================
// QUẢN LÝ DỮ LIỆU - CỘNG GIAO VỚI API
// ===========================

/**
 * Lấy danh sách nhân viên từ API
 * Gọi endpoint GET /api/admin/staff để lấy danh sách tất cả admin users
 */
async function loadStaffList() {
  try {
    console.log("📡 Loading staff list from API...");

    const response = await fetch("/api/admin/staff", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Nếu endpoint chưa tồn tại, dùng dữ liệu trống
      console.warn(
        "⚠️ Staff API endpoint not found, using empty data",
        response.status
      );
      staffData = [];
      return;
    }

    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      staffData = result.data;
      console.log(
        `✅ Loaded ${staffData.length} staff members from API`,
        staffData
      );
    } else {
      staffData = [];
      console.log("📋 No staff data returned from API");
    }
  } catch (error) {
    console.error("❌ Error loading staff list:", error);
    staffData = [];
  }
}

/**
 * Thêm nhân viên mới thông qua API
 * Gửi request POST tới /auth/add-staff
 * @param {FormData} formData - Dữ liệu form
 * @returns {Promise<boolean>} - Kết quả thêm nhân viên
 */
async function addStaffViaAPI(formData) {
  try {
    console.log("📤 Sending add staff request to API...");

    const payload = {
      fullName: formData.get("staffName"),
      email: formData.get("staffEmail"),
      phone: formData.get("staffPhone"),
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
    };

    console.log("📋 Payload:", payload);

    const response = await fetch("/auth/add-staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", result);
      return {
        success: false,
        message: result.message || "Có lỗi xảy ra khi thêm nhân viên",
        errors: result.errors || {},
      };
    }

    console.log("✅ Staff added successfully:", result.data);
    return {
      success: true,
      message: result.message,
      data: result.data.user,
    };
  } catch (error) {
    console.error("❌ Network error:", error);
    return {
      success: false,
      message: "Lỗi kết nối server, vui lòng thử lại",
      errors: {},
    };
  }
}

/**
 * Xóa nhân viên qua API
 * Gửi request DELETE tới /api/admin/staff/:id
 * @param {string} staffId - ID của nhân viên
 * @returns {Promise<boolean>} - Kết quả xóa
 */
async function deleteStaffViaAPI(staffId) {
  try {
    console.log(`🗑️ Deleting staff ${staffId}...`);

    const response = await fetch(`/api/admin/staff/${staffId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Delete Error:", result);
      return {
        success: false,
        message: result.message || "Có lỗi xảy ra khi xóa nhân viên",
      };
    }

    console.log("✅ Staff deleted successfully");
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("❌ Network error:", error);
    return {
      success: false,
      message: "Lỗi kết nối server, vui lòng thử lại",
    };
  }
}

// ===========================
// RENDER & HIỂN THỊ DỮ LIỆU
// ===========================

/**
 * Render bảng danh sách nhân viên
 */
function renderStaffTable() {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) {
    console.warn("⚠️ Staff table body not found");
    return;
  }

  console.log(`📊 Rendering ${staffData.length} staff members...`);

  let filteredData = [...staffData];

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center">
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

  console.log(`✅ Rendered ${filteredData.length} staff rows`);
}

/**
 * Render một dòng nhân viên trong bảng
 * @param {Object} staff - Thông tin nhân viên
 * @returns {string} - HTML của một dòng nhân viên
 */
function renderStaffRow(staff) {
  const status = staff.status || "active";
  const joinDate = staff.createdAt || new Date().toISOString();
  const statusText = getStatusText(status);
  const statusClass = getStatusClass(status);

  return `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <img 
            class="h-10 w-10 rounded-full" 
            src="https://ui-avatars.com/api/?name=${encodeURIComponent(
              staff.fullName
            )}&background=random" 
            alt="${staff.fullName}"
          >
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${
              staff.fullName
            }</div>
            <div class="text-sm text-gray-500">${staff.email}</div>
            <div class="text-sm text-gray-500">${staff.phone || "N/A"}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${
          staff.role || "admin"
        }</div>
        <div class="text-sm text-gray-500">${
          staff.department || "Quản trị"
        }</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${statusClass}">
          ${statusText}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${formatDate(joinDate)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button 
          class="staff-view-btn text-blue-600 hover:text-blue-900 mr-3 transition" 
          data-staff-id="${staff._id}"
          title="Xem chi tiết"
        >
          <i class="fas fa-eye"></i> Xem
        </button>
        <button 
          class="staff-edit-btn text-green-600 hover:text-green-900 mr-3 transition" 
          data-staff-id="${staff._id}"
          title="Chỉnh sửa"
        >
          <i class="fas fa-edit"></i> Sửa
        </button>
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

/**
 * Cập nhật các thống kê nhân viên
 * Hàm này không dùng vì đã bỏ stats khỏi view
 */
function updateStaffStats() {
  // Removed - stats section removed from view
}

// ===========================
// LỌC & TÌM KIẾM
// ===========================

// ===========================
// TÌM KIẾM
// ===========================

/**
 * Tìm kiếm nhân viên theo từ khóa
 * Tìm trong tên, email, phone
 * @param {string} query - Từ khóa tìm kiếm
 */
function searchStaff(query) {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  console.log(`🔎 Searching for: "${query}"`);

  const searchQuery = query.toLowerCase();
  let filteredData = staffData.filter(
    (staff) =>
      (staff.fullName || "").toLowerCase().includes(searchQuery) ||
      (staff.email || "").toLowerCase().includes(searchQuery) ||
      (staff.phone || "").includes(query)
  );

  tbody.innerHTML =
    filteredData.length > 0
      ? filteredData.map((staff) => renderStaffRow(staff)).join("")
      : `
    <tr>
      <td colspan="6" class="px-6 py-8 text-center">
        <div class="text-gray-500">
          <i class="fas fa-search text-3xl mb-3 block"></i>
          <p>Không tìm thấy nhân viên phù hợp</p>
        </div>
      </td>
    </tr>
  `;

  console.log(`✅ Found ${filteredData.length} matching staff`);
}

// ===========================
// QUẢN LÝ HÀNH ĐỘNG
// ===========================

/**
 * Hiển thị modal thêm nhân viên
 */
function showAddStaffModal() {
  const modal = document.getElementById("addStaffModal");
  if (modal) {
    modal.classList.remove("hidden");
    console.log("📝 Add staff modal opened");
  }
}

/**
 * Ẩn modal thêm nhân viên
 */
function hideAddStaffModal() {
  const modal = document.getElementById("addStaffModal");
  if (modal) {
    modal.classList.add("hidden");
    const form = document.getElementById("addStaffForm");
    if (form) form.reset();
    console.log("📝 Add staff modal closed");
  }
}

/**
 * Xử lý sự kiện thêm nhân viên mới
 * @param {Event} e - Sự kiện submit form
 */
async function handleAddStaff(e) {
  e.preventDefault();
  console.log("➕ Adding new staff member...");

  const form = e.target;
  const formData = new FormData(form);

  // Validation dữ liệu form
  const fullName = formData.get("staffName");
  const email = formData.get("staffEmail");
  const phone = formData.get("staffPhone");
  const password = formData.get("password");
  const passwordConfirm = formData.get("passwordConfirm");

  const errors = {};

  if (!fullName || fullName.trim().length === 0) {
    errors.staffName = "Vui lòng nhập tên nhân viên";
  }

  if (!email) {
    errors.staffEmail = "Vui lòng nhập email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.staffEmail = "Email không hợp lệ";
  }

  if (!phone) {
    errors.staffPhone = "Vui lòng nhập số điện thoại";
  } else if (!/^(?:\+84|0|84)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
    errors.staffPhone = "Số điện thoại không hợp lệ";
  }

  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu";
  } else if (password.length < 6) {
    errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
  }

  // Hiển thị lỗi nếu có
  if (Object.keys(errors).length > 0) {
    console.warn("❌ Validation errors:", errors);
    alert(
      "Vui lòng điền đầy đủ và chính xác thông tin:\n" +
        Object.values(errors).join("\n")
    );
    return;
  }

  // Gọi API thêm nhân viên
  const result = await addStaffViaAPI(formData);

  if (result.success) {
    console.log("✅ Staff added successfully!");
    alert(result.message);

    // Tải lại danh sách nhân viên
    await loadStaffList();
    renderStaffTable();
    updateStaffStats();
    hideAddStaffModal();
  } else {
    console.error("❌ Error adding staff:", result.errors);
    const errorMsg =
      Object.values(result.errors || {}).join("\n") ||
      result.message ||
      "Có lỗi xảy ra";
    alert("❌ Lỗi:\n" + errorMsg);
  }
}

/**
 * Xem chi tiết thông tin nhân viên
 * @param {string} staffId - ID của nhân viên
 */
function viewStaffDetail(staffId) {
  const staff = staffData.find((s) => s._id === staffId);
  if (!staff) {
    alert("Không tìm thấy nhân viên");
    return;
  }

  console.log("👁️ Viewing staff details:", staff);

  const details = `
  👤 THÔNG TIN NHÂN VIÊN
  ━━━━━━━━━━━━━━━━━━━━
  
  📛 Tên: ${staff.fullName}
  📧 Email: ${staff.email}
  📱 Điện thoại: ${staff.phone || "N/A"}
  
  👔 THÔNG TIN CÔNG VIỆC
  ━━━━━━━━━━━━━━━━━━━━
  
  Chức vụ: ${staff.role || "admin"}
  Phòng ban: ${staff.department || "Quản trị"}
  Trạng thái: ${getStatusText(staff.status || "active")}
  
  📅 Ngày tạo: ${formatDate(staff.createdAt || new Date().toISOString())}
  `;

  alert(details);
}

/**
 * Chỉnh sửa thông tin nhân viên
 * @param {string} staffId - ID của nhân viên
 */
function editStaff(staffId) {
  const staff = staffData.find((s) => s._id === staffId);
  if (!staff) {
    alert("Không tìm thấy nhân viên");
    return;
  }

  console.log("✏️ Editing staff:", staff);

  // Hiển thị prompt để chỉnh sửa tên
  const newName = prompt("Nhập tên mới:", staff.fullName);
  if (newName && newName !== staff.fullName) {
    alert("Chức năng chỉnh sửa đang được phát triển!");
    console.log(`📝 Would update ${staff.fullName} to ${newName}`);
  }
}

/**
 * Xác nhận xóa nhân viên
 * @param {string} staffId - ID của nhân viên
 */
function confirmDelete(staffId) {
  const staff = staffData.find((s) => s._id === staffId);
  if (!staff) {
    alert("Không tìm thấy nhân viên");
    return;
  }

  console.log("🗑️ Confirming delete for staff:", staff);

  const confirmed = confirm(
    `Bạn có chắc chắn muốn xóa nhân viên ${staff.fullName}?\n\nHành động này không thể hoàn tác!`
  );

  if (confirmed) {
    deleteStaffConfirmed(staffId);
  }
}

/**
 * Xóa nhân viên sau khi được xác nhận
 * @param {string} staffId - ID của nhân viên
 */
async function deleteStaffConfirmed(staffId) {
  const result = await deleteStaffViaAPI(staffId);

  if (result.success) {
    console.log("✅ Staff deleted successfully!");
    alert(result.message);

    // Xóa khỏi mảng local
    staffData = staffData.filter((s) => s._id !== staffId);

    // Render lại bảng
    renderStaffTable();
    updateStaffStats();
  } else {
    console.error("❌ Error deleting staff:", result);
    alert("❌ " + result.message);
  }
}

/**
 * Xuất danh sách nhân viên ra file Excel
 */
async function exportStaffData() {
  try {
    console.log("📥 Exporting staff data to Excel...");

    if (staffData.length === 0) {
      alert("Không có dữ liệu nhân viên để xuất");
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

    console.log("✅ Export completed successfully!");
    alert("✅ Xuất dữ liệu thành công!");
  } catch (error) {
    console.error("❌ Export error:", error);
    alert("❌ Có lỗi xảy ra khi xuất dữ liệu");
  }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Lấy class CSS tương ứng với trạng thái nhân viên
 * @param {string} status - Trạng thái nhân viên
 * @returns {string} - Class CSS
 */
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    case "leave":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Chuyển đổi mã trạng thái sang text hiển thị
 * @param {string} status - Mã trạng thái
 * @returns {string} - Text hiển thị
 */
function getStatusText(status) {
  switch (status) {
    case "active":
      return "Đang làm việc";
    case "inactive":
      return "Nghỉ việc";
    case "leave":
      return "Nghỉ phép";
    default:
      return "Đang làm việc";
  }
}

/**
 * Định dạng ngày theo chuẩn Việt Nam
 * @param {string} dateString - Chuỗi ngày định dạng ISO
 * @returns {string} - Ngày định dạng dd/mm/yyyy
 */
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

/**
 * Định dạng số tiền theo chuẩn Việt Nam
 * @param {number} amount - Số tiền
 * @returns {string} - Số tiền đã định dạng
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

console.log(
  "✅ Staff management module (qly-nhan-viens.js) loaded successfully!"
);
