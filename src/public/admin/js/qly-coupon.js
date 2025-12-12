import { Modal, Notification } from "../../utils/modal.js";
import { apiGet, apiPost, apiDelete, apiPatch } from "../../utils/api.js";
import { formatPrice, formatDate } from "../../utils/helpers.js";

// ============================================================================
// BIẾN TOÀN CỤC
// ============================================================================
let coupons = [];
let modalMode = "create"; // 'create' hoặc 'edit'
let currentCouponId = null;

// Socket.io initialization for coupons
let couponSocket = null;
function initCouponSocket() {
  if (couponSocket) return;
  couponSocket = io();

  // Listen for coupon updates
  couponSocket.on("coupon:updated", (data) => {
    console.log("🔄 [Coupon] Received coupon update:", data);
    getCoupons();
  });

  // Listen for coupon deletions
  couponSocket.on("coupon:deleted", (data) => {
    console.log("🗑️ [Coupon] Received coupon delete:", data);
    getCoupons();
  });

  // Listen for coupon creation
  couponSocket.on("coupon:created", (data) => {
    console.log("✨ [Coupon] Received coupon creation:", data);
    getCoupons();
  });
}

// ============================================================================
// KHỞI TẠO
// ============================================================================
document.addEventListener("DOMContentLoaded", function () {
  getCoupons();
  initCouponSocket();
  setupModalHandlers();
  setupFormHandlers();
});

// ============================================================================
// XỬ LÝ MODAL
// ============================================================================

// Mở modal ở chế độ thêm mới
window.showAddCouponModal = function () {
  modalMode = "create";
  currentCouponId = null;

  const modal = document.getElementById("addCouponModal");
  const form = document.getElementById("couponForm");
  const modalTitle = document.getElementById("modalTitle");
  const submitBtn = document.getElementById("submitBtn");

  modalTitle.textContent = "Thêm mã giảm giá";
  submitBtn.textContent = "Thêm mã";
  form.reset();

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
};

// Mở modal ở chế độ chỉnh sửa
window.showEditCouponModal = async function (couponId) {
  try {
    const res = await apiGet(`/api/coupons/${couponId}`);
    if (!res) return;

    const result = await res.json();

    if (!result.success || !result.data) {
      Notification.error("Không tìm thấy mã giảm giá!");
      return;
    }

    const coupon = result.data;
    modalMode = "edit";
    currentCouponId = couponId;

    const modal = document.getElementById("addCouponModal");
    const form = document.getElementById("couponForm");
    const modalTitle = document.getElementById("modalTitle");
    const submitBtn = document.getElementById("submitBtn");

    // Cập nhật UI
    modalTitle.textContent = "Chỉnh sửa mã giảm giá";
    submitBtn.textContent = "Cập nhật mã";

    // Điền dữ liệu vào form
    form.elements["code"].value = coupon.code || "";
    form.elements["name"].value = coupon.name || "";
    form.elements["description"].value = coupon.description || "";
    form.elements["type"].value = coupon.type || "";
    form.elements["value"].value = coupon.value || 0;
    form.elements["minPurchase"].value = coupon.minPurchase || 0;
    form.elements["maxDiscount"].value = coupon.maxDiscount || 0;
    form.elements["startDate"].value = coupon.startDate
      ? new Date(coupon.startDate).toISOString().split("T")[0]
      : "";
    form.elements["endDate"].value = coupon.endDate
      ? new Date(coupon.endDate).toISOString().split("T")[0]
      : "";
    form.elements["usageLimit"].value = coupon.usageLimit || 0;
    form.elements["perUserLimit"].value = coupon.perUserLimit || 1;
    form.elements["status"].value = coupon.status || "active";

    // Cập nhật label dựa trên loại giảm giá
    updateValueLabel();

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu mã giảm giá:", error);
    Notification.error("Đã xảy ra lỗi khi tải dữ liệu mã giảm giá!");
  }
};

// Đóng modal
window.hideAddCouponModal = function () {
  const modal = document.getElementById("addCouponModal");
  const form = document.getElementById("couponForm");

  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  form.reset();

  modalMode = "create";
  currentCouponId = null;
};

// Đóng modal khi nhấn ESC
function setupModalHandlers() {
  document.addEventListener("keydown", function (e) {
    const modal = document.getElementById("addCouponModal");
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      window.hideAddCouponModal();
    }
  });
}

// ============================================================================
// CẬP NHẬT LABEL DỰA TRÊN LOẠI GIẢM GIÁ
// ============================================================================
window.updateValueLabel = function () {
  const type = document.getElementById("couponType").value;
  const label = document.getElementById("valueLabel");
  const valueInput = document.getElementById("couponValue");
  const maxDiscountField = document.getElementById("maxDiscountField");

  switch (type) {
    case "percentage":
      label.innerHTML =
        'Phần trăm giảm (%) <span class="text-red-500">*</span>';
      valueInput.placeholder = "VD: 10, 20, 50";
      valueInput.max = "100";
      maxDiscountField.style.display = "block";
      break;

    case "fixed_amount":
      label.innerHTML =
        'Số tiền giảm (VNĐ) <span class="text-red-500">*</span>';
      valueInput.placeholder = "VD: 50000, 100000";
      valueInput.removeAttribute("max");
      maxDiscountField.style.display = "none";
      break;

    case "free_service":
      label.innerHTML =
        'ID dịch vụ miễn phí <span class="text-red-500">*</span>';
      valueInput.placeholder = "VD: 1, 2, 3";
      valueInput.removeAttribute("max");
      maxDiscountField.style.display = "none";
      break;

    default:
      label.innerHTML = 'Giá trị <span class="text-red-500">*</span>';
      valueInput.placeholder = "Nhập giá trị";
      valueInput.removeAttribute("max");
      maxDiscountField.style.display = "block";
  }
};

// ============================================================================
// XỬ LÝ FORM SUBMIT
// ============================================================================
function setupFormHandlers() {
  const form = document.getElementById("couponForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate ngày tháng
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      Notification.error("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
      return;
    }

    try {
      let res, result;

      if (modalMode === "create") {
        // Tạo mới mã giảm giá
        res = await apiPost("/api/coupons/add", JSON.stringify(data));
        if (!res) return;

        result = await res.json();

        if (res.ok) {
          Notification.success("Thêm mã giảm giá thành công!");
          window.hideAddCouponModal();
          getCoupons();
        } else {
          Notification.error(result.message || "Có lỗi xảy ra!");
        }
      } else if (modalMode === "edit") {
        // Cập nhật mã giảm giá
        if (!currentCouponId) {
          Notification.error("Không tìm thấy ID mã giảm giá!");
          return;
        }

        res = await apiPatch(
          `/api/coupons/${currentCouponId}`,
          JSON.stringify(data)
        );
        if (!res) return;

        result = await res.json();

        if (res.ok) {
          Notification.success("Cập nhật mã giảm giá thành công!");
          window.hideAddCouponModal();
          getCoupons();
        } else {
          Notification.error(result.message || "Có lỗi xảy ra!");
        }
      }
    } catch (error) {
      console.error("Lỗi khi xử lý form:", error);
      Notification.error(
        `Đã xảy ra lỗi khi ${
          modalMode === "create" ? "thêm" : "cập nhật"
        } mã giảm giá!`
      );
    }
  });
}

// ============================================================================
// LẤY DANH SÁCH MÃ GIẢM GIÁ
// ============================================================================
async function getCoupons() {
  try {
    const res = await apiGet("/api/coupons");
    if (!res) return;

    const result = await res.json();
    const container = document.getElementById("coupons-list");
    const emptyContainer = document.getElementById("empty-coupons-list");

    // Nếu không có mã giảm giá nào
    if (result.data.length === 0) {
      container.innerHTML = "";
      emptyContainer.innerHTML = `
        <div class="text-center py-20 bg-white rounded-xl shadow-sm">
          <i class="fas fa-tags text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">
            Chưa có mã giảm giá nào
          </h3>
          <p class="text-gray-500 mb-6">
            Hãy tạo mã giảm giá đầu tiên để tăng doanh số bán hàng.
          </p>
          <button
            onclick="showAddCouponModal()"
            class="gradient-bg text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <i class="fas fa-plus mr-2"></i>Thêm mã mới
          </button>
        </div>
      `;
      return;
    }

    coupons = result.data;

    // Sắp xếp theo ngày tạo (mới nhất trước)
    coupons.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    // Render danh sách mã giảm giá
    container.innerHTML = coupons
      .map((coupon) => renderCouponCard(coupon))
      .join("");
    emptyContainer.innerHTML = "";
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mã giảm giá:", error);
  }
}

// ============================================================================
// RENDER CARD MÃ GIẢM GIÁ
// ============================================================================
function renderCouponCard(coupon) {
  const isExpired = new Date(coupon.endDate) < new Date();
  const usagePercentage =
    coupon.usageLimit > 0
      ? Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)
      : 0;

  return `
    <div class="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-gray-900">${coupon.code}</h3>
            ${getStatusBadge(isExpired ? "expired" : coupon.status)}
          </div>
          <p class="text-gray-600 text-sm">${coupon.name}</p>
          ${
            coupon.description
              ? `<p class="text-gray-500 text-sm mt-1">${coupon.description}</p>`
              : ""
          }
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-blue-600">
            ${formatCouponValue(coupon)}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-100">
        <div>
          <p class="text-xs text-gray-500 mb-1">Loại giảm</p>
          <p class="font-medium text-gray-900">${getCouponTypeLabel(
            coupon.type
          )}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Đơn tối thiểu</p>
          <p class="font-medium text-gray-900">${formatPrice(
            coupon.minPurchase
          )} VNĐ</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Thời hạn</p>
          <p class="font-medium text-gray-900">${formatDate(
            coupon.startDate
          )} - ${formatDate(coupon.endDate)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-1">Giới hạn sử dụng</p>
          <p class="font-medium text-gray-900">${coupon.usageCount}/${
    coupon.usageLimit === 0 ? "∞" : coupon.usageLimit
  }</p>
        </div>
      </div>

      ${renderUsageProgress(coupon.usageLimit, usagePercentage)}

      <div class="flex gap-2">
        <button
          onclick="showEditCouponModal('${coupon._id}')"
          class="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
        >
          <i class="fas fa-edit mr-1"></i>Chỉnh sửa
        </button>
        <button
          onclick="deleteCouponConfirm('${coupon._id}')"
          class="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
        >
          <i class="fas fa-trash mr-1"></i>Xóa
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// HÀM HỖ TRỢ HIỂN THỊ
// ============================================================================

// Lấy label loại mã giảm giá
function getCouponTypeLabel(type) {
  const types = {
    percentage: "Phần trăm",
    fixed_amount: "Số tiền cố định",
    free_service: "Dịch vụ miễn phí",
  };
  return types[type] || type;
}

// Lấy badge trạng thái
function getStatusBadge(status) {
  const badges = {
    active:
      '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Hoạt động</span>',
    inactive:
      '<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Không hoạt động</span>',
    expired:
      '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Hết hạn</span>',
  };
  return badges[status] || status;
}

// Format giá trị mã giảm giá
function formatCouponValue(coupon) {
  if (coupon.type === "percentage") {
    return coupon.value + "%";
  } else if (coupon.type === "fixed_amount") {
    return formatPrice(coupon.value) + " VNĐ";
  } else {
    return "Miễn phí";
  }
}

// Render thanh tiến trình sử dụng
function renderUsageProgress(usageLimit, usagePercentage) {
  if (usageLimit === 0) return "";

  return `
    <div class="mb-4">
      <div class="flex justify-between items-center text-sm mb-2">
        <span class="text-gray-600">Sử dụng</span>
        <span class="font-medium text-gray-900">${Math.round(
          usagePercentage
        )}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${usagePercentage}%"></div>
      </div>
    </div>
  `;
}

// ============================================================================
// XÓA MÃ GIẢM GIÁ
// ============================================================================
window.deleteCouponConfirm = function (couponId) {
  Modal.confirm({
    title: "Xóa mã giảm giá",
    message: "Bạn có chắc chắn muốn xóa mã giảm giá này không?",
    icon: "fa-trash",
    iconColor: "red",
    confirmText: "Xóa",
    confirmColor: "red",
    onConfirm: async () => {
      try {
        const res = await apiDelete(`/api/coupons/${couponId}`);
        if (!res) return;

        if (res.ok) {
          Notification.success("Xóa mã giảm giá thành công!");
          getCoupons();
        } else {
          Notification.error("Có lỗi xảy ra!");
        }
      } catch (error) {
        console.error("Lỗi khi xóa mã giảm giá:", error);
        Notification.error("Đã xảy ra lỗi khi xóa mã giảm giá!");
      }
    },
  });
};
