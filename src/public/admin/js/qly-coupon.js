import { Modal, Notification } from "../../utils/modal.js";
import { apiGet, apiPost, apiDelete, apiPatch } from "../../utils/api.js";
import { formatPrice, formatDate } from "../../utils/helpers.js";
import { validateCouponInput } from "../../utils/validators.js";

// ============================================================================
// BIẾN TOÀN CỤC
// ============================================================================
let coupons = [];
let allCoupons = [];
let modalMode = "create";
let currentCouponId = null;

// Filter states
let couponFilters = {
  status: "",
  type: "",
  startDate: "",
  endDate: "",
  search: "",
};

// Removed Socket.io - Using middleware auto-update instead

// ============================================================================
// KHỞI TẠO
// ============================================================================
document.addEventListener("DOMContentLoaded", function () {
  getCoupons();
  setupModalHandlers();
  setupFormHandlers();
  setupCouponFilters();
});

// ============================================================================
// XỬ LÝ MODAL
// ============================================================================

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

    modalTitle.textContent = "Chỉnh sửa mã giảm giá";
    submitBtn.textContent = "Cập nhật";

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

    updateValueLabel();

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu mã giảm giá:", error);
    Notification.error("Đã xảy ra lỗi khi tải dữ liệu mã giảm giá!");
  }
};

window.hideAddCouponModal = function () {
  const modal = document.getElementById("addCouponModal");
  const form = document.getElementById("couponForm");

  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  form.reset();

  modalMode = "create";
  currentCouponId = null;
};

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
      label.innerHTML = 'Giá trị (%) <span class="text-red-500">*</span>';
      valueInput.placeholder = "VD: 10, 20, 50";
      valueInput.max = "100";
      maxDiscountField.style.display = "block";
      break;

    case "fixed_amount":
      label.innerHTML = 'Giá trị (VNĐ) <span class="text-red-500">*</span>';
      valueInput.placeholder = "VD: 50000, 100000";
      valueInput.removeAttribute("max");
      maxDiscountField.style.display = "none";
      break;

    default:
      label.innerHTML = 'Giá trị <span class="text-red-500">*</span>';
      valueInput.placeholder = "Nhập giá trị";
      valueInput.removeAttribute("max");
      maxDiscountField.style.display = "none";
  }
};

// ============================================================================
// XỬ LÝ FORM SUBMIT
// ============================================================================
function setupFormHandlers() {
  const form = document.getElementById("couponForm");

  // Clear errors on input change
  form.querySelectorAll("input, select, textarea").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("border-red-500");
      const errorDiv = input.parentElement.querySelector(".error-message");
      if (errorDiv) errorDiv.remove();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll(".border-red-500").forEach((el) => {
      el.classList.remove("border-red-500");
    });
    form.querySelectorAll(".error-message").forEach((el) => el.remove());

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Client-side validation
    const validation = validateCouponInput(data);
    if (!validation.isValid) {
      // Hiển thị tất cả lỗi
      Object.keys(validation.errors).forEach((fieldName) => {
        const input = form.elements[fieldName];
        if (input) {
          input.classList.add("border-red-500");

          // Thêm error message dưới input
          const errorDiv = document.createElement("div");
          errorDiv.className = "error-message text-red-500 text-sm mt-1";
          errorDiv.textContent = validation.errors[fieldName];
          input.parentElement.appendChild(errorDiv);
        }
      });

      // Scroll to first error
      const firstError = form.querySelector(".border-red-500");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        firstError.focus();
      }

      // Không hiển thị toast, chỉ show error trong form
      return;
    }

    try {
      let res, result;

      if (modalMode === "create") {
        res = await apiPost("/api/coupons/add", JSON.stringify(data));
        if (!res) return;

        result = await res.json();

        if (res.ok) {
          Notification.success("Thêm mã giảm giá thành công!");
          window.hideAddCouponModal();
          getCoupons();
        } else {
          if (result.errors) {
            // Hiển thị lỗi từ server
            Object.keys(result.errors).forEach((fieldName) => {
              const input = form.elements[fieldName];
              if (input) {
                input.classList.add("border-red-500");
                const errorDiv = document.createElement("div");
                errorDiv.className = "error-message text-red-500 text-sm mt-1";
                errorDiv.textContent = result.errors[fieldName];
                input.parentElement.appendChild(errorDiv);
              }
            });
          } else {
            Notification.error(result.message || "Có lỗi xảy ra!");
          }
        }
      } else if (modalMode === "edit") {
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
          if (result.errors) {
            Object.keys(result.errors).forEach((fieldName) => {
              const input = form.elements[fieldName];
              if (input) {
                input.classList.add("border-red-500");
                const errorDiv = document.createElement("div");
                errorDiv.className = "error-message text-red-500 text-sm mt-1";
                errorDiv.textContent = result.errors[fieldName];
                input.parentElement.appendChild(errorDiv);
              }
            });
          } else {
            Notification.error(result.message || "Có lỗi xảy ra!");
          }
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

    allCoupons = result.data || [];
    coupons = [...allCoupons];

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

    applyCouponFilters();
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mã giảm giá:", error);
  }
}

// ============================================================================
// RENDER CARD MÃ GIẢM GIÁ
// ============================================================================
function renderCouponCard(coupon) {
  const now = new Date();
  const endDate = new Date(coupon.endDate);
  const isExpired = now > endDate;
  const isUsageLimitReached =
    coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit;

  const actualStatus =
    isExpired || isUsageLimitReached ? "inactive" : coupon.status;

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
            ${getStatusBadge(actualStatus, isExpired, isUsageLimitReached)}
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
          <p class="font-medium text-gray-900">${coupon.usageCount || 0}/${
    coupon.usageLimit === 0 ? "∞" : coupon.usageLimit
  }</p>
        </div>
      </div>

      ${renderUsageProgress(
        coupon.usageLimit,
        coupon.usageCount,
        usagePercentage
      )}

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

function getCouponTypeLabel(type) {
  const types = {
    percentage: "Phần trăm",
    fixed_amount: "Số tiền cố định",
  };
  return types[type] || type;
}

function getStatusBadge(status, isExpired, isUsageLimitReached) {
  if (isExpired) {
    return '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Hết hạn</span>';
  }
  if (isUsageLimitReached) {
    return '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Hết lượt</span>';
  }

  const badges = {
    active:
      '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Hoạt động</span>',
    inactive:
      '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">Không hoạt động</span>',
  };
  return badges[status] || status;
}

function formatCouponValue(coupon) {
  if (coupon.type === "percentage") {
    return coupon.value + "%";
  } else if (coupon.type === "fixed_amount") {
    return formatPrice(coupon.value) + " VNĐ";
  }
  return "N/A";
}

function renderUsageProgress(usageLimit, usageCount, usagePercentage) {
  if (usageLimit === 0) return "";

  const count = usageCount || 0;
  const percentage = Math.round(usagePercentage);

  let barColor = "bg-blue-500";
  if (percentage >= 90) {
    barColor = "bg-red-500";
  } else if (percentage >= 70) {
    barColor = "bg-orange-500";
  } else if (percentage >= 50) {
    barColor = "bg-yellow-500";
  }

  return `
    <div class="mb-4">
      <div class="flex justify-between items-center text-sm mb-2">
        <span class="text-gray-600">Đã sử dụng: ${count}/${usageLimit}</span>
        <span class="font-medium ${
          percentage >= 90 ? "text-red-600" : "text-gray-900"
        }">
          ${percentage}%
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div class="${barColor} h-2.5 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
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

// ============================================================================
// FILTER VÀ TÌM KIẾM MÃ GIẢM GIÁ
// ============================================================================

function setupCouponFilters() {
  const filterStatus = document.getElementById("filterCouponStatus");
  const filterType = document.getElementById("filterCouponType");
  const filterStartDate = document.getElementById("filterStartDate");
  const filterEndDate = document.getElementById("filterEndDate");
  const filterSearch = document.getElementById("filterSearch");

  if (filterStatus) filterStatus.addEventListener("change", applyCouponFilters);
  if (filterType) filterType.addEventListener("change", applyCouponFilters);
  if (filterStartDate)
    filterStartDate.addEventListener("change", applyCouponFilters);
  if (filterEndDate)
    filterEndDate.addEventListener("change", applyCouponFilters);
  if (filterSearch) filterSearch.addEventListener("input", applyCouponFilters);
}

function applyCouponFilters() {
  couponFilters.status =
    document.getElementById("filterCouponStatus")?.value || "";
  couponFilters.type = document.getElementById("filterCouponType")?.value || "";
  couponFilters.startDate =
    document.getElementById("filterStartDate")?.value || "";
  couponFilters.endDate = document.getElementById("filterEndDate")?.value || "";
  couponFilters.search =
    document.getElementById("filterSearch")?.value.toLowerCase().trim() || "";

  const now = new Date();

  let filtered = allCoupons.filter((coupon) => {
    const endDate = new Date(coupon.endDate);
    const startDate = new Date(coupon.startDate);
    const isExpired = now > endDate;
    const isUsageLimitReached =
      coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit;

    const actualStatus =
      isExpired || isUsageLimitReached ? "inactive" : coupon.status;

    const matchStatus =
      !couponFilters.status || actualStatus === couponFilters.status;
    const matchType = !couponFilters.type || coupon.type === couponFilters.type;

    let matchDate = true;
    if (couponFilters.startDate && couponFilters.endDate) {
      const filterStart = new Date(couponFilters.startDate);
      const filterEnd = new Date(couponFilters.endDate);
      matchDate = !(endDate < filterStart || startDate > filterEnd);
    } else if (couponFilters.startDate) {
      const filterStart = new Date(couponFilters.startDate);
      matchDate = endDate >= filterStart;
    } else if (couponFilters.endDate) {
      const filterEnd = new Date(couponFilters.endDate);
      matchDate = startDate <= filterEnd;
    }

    const matchSearch =
      !couponFilters.search ||
      coupon.code.toLowerCase().includes(couponFilters.search) ||
      coupon.name.toLowerCase().includes(couponFilters.search) ||
      (coupon.description &&
        coupon.description.toLowerCase().includes(couponFilters.search));

    return matchStatus && matchType && matchDate && matchSearch;
  });

  renderFilteredCoupons(filtered);
}

function renderFilteredCoupons(filteredCoupons) {
  const container = document.getElementById("coupons-list");
  const emptyContainer = document.getElementById("empty-coupons-list");

  if (filteredCoupons.length === 0) {
    container.innerHTML = "";
    emptyContainer.innerHTML = `
      <div class="text-center py-20 bg-white rounded-xl shadow-sm">
        <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">
          Không tìm thấy mã giảm giá phù hợp
        </h3>
        <p class="text-gray-500 mb-6">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
        </p>
      </div>
    `;
    return;
  }

  const sorted = [...filteredCoupons].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  container.innerHTML = sorted
    .map((coupon) => renderCouponCard(coupon))
    .join("");
  emptyContainer.innerHTML = "";
}
