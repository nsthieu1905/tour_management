import { Modal, Notification } from "../../utils/modal.js";
import {
  apiCall,
  apiGet,
  apiPost,
  apiDelete,
  apiPatch,
} from "../../utils/api.js";

// Global variables
let coupons = [];

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  getCoupons();
  if (document.getElementById("addCouponForm")) {
    createCoupon();
  }
  setupModalHandlers();
});

// Setup modal handlers
function setupModalHandlers() {
  const modal = document.getElementById("addCouponModal");
  if (!modal) return;

  window.showAddCouponModal = function () {
    document.getElementById("addCouponForm").reset();
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  window.hideAddCouponModal = function () {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    document.getElementById("addCouponForm").reset();
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      window.hideAddCouponModal();
    }
  });
}

// Update value label based on coupon type
window.updateValueLabel = function () {
  const type = document.getElementById("couponType").value;
  const label = document.getElementById("valueLabel");
  const maxDiscountField = document.getElementById("maxDiscountField");

  switch (type) {
    case "percentage":
      label.textContent = "Phần trăm (%)";
      maxDiscountField.style.display = "block";
      break;
    case "fixed_amount":
      label.textContent = "Số tiền (VNĐ)";
      maxDiscountField.style.display = "block";
      break;
    case "free_service":
      label.textContent = "Mô tả dịch vụ";
      maxDiscountField.style.display = "none";
      break;
    default:
      label.textContent = "Giá trị";
      maxDiscountField.style.display = "block";
  }
};

// Format price to VND
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

// Format date
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Get coupon type label
function getCouponTypeLabel(type) {
  const types = {
    percentage: "Phần trăm",
    fixed_amount: "Số tiền cố định",
    free_service: "Dịch vụ miễn phí",
  };
  return types[type] || type;
}

// Get status badge
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

// Get coupons
async function getCoupons() {
  try {
    const res = await apiGet("/api/coupons");
    if (!res) return;

    const result = await res.json();
    const container = document.getElementById("coupons-list");
    const emptyContainer = document.getElementById("empty-coupons-list");

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
    container.innerHTML = coupons
      .map((coupon) => {
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
                  <h3 class="text-lg font-semibold text-gray-900">${
                    coupon.code
                  }</h3>
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
                  ${
                    coupon.type === "percentage"
                      ? coupon.value + "%"
                      : coupon.type === "fixed_amount"
                      ? formatPrice(coupon.value) + " VNĐ"
                      : "Miễn phí"
                  }
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

            ${
              coupon.usageLimit > 0
                ? `
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
            `
                : ""
            }

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
      })
      .join("");

    emptyContainer.innerHTML = "";
  } catch (error) {
    console.error("Error:", error);
  }
}

// Create coupon
async function createCoupon() {
  const form = document.getElementById("addCouponForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      Notification.error("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
      return;
    }

    try {
      const res = await apiPost("/api/coupons/add", data);

      if (!res) return;
      const result = await res.json();

      if (res.ok) {
        Notification.success("Thêm mã giảm giá thành công!");
        window.hideAddCouponModal();
        getCoupons();
      } else {
        Notification.error(result.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error("Error:", error);
      Notification.error("Đã xảy ra lỗi khi thêm mã giảm giá!");
    }
  });
}

// Show edit coupon modal
window.showEditCouponModal = async function (couponId) {
  try {
    const res = await apiGet(`/api/coupons/${couponId}`);
    if (!res) return;

    const result = await res.json();
    const coupon = result.data;

    // Populate form
    const form = document.getElementById("addCouponForm");
    form.code.value = coupon.code;
    form.name.value = coupon.name;
    form.description.value = coupon.description || "";
    form.type.value = coupon.type;
    form.value.value = coupon.value;
    form.minPurchase.value = coupon.minPurchase || 0;
    form.maxDiscount.value = coupon.maxDiscount || "";
    form.startDate.value = new Date(coupon.startDate)
      .toISOString()
      .split("T")[0];
    form.endDate.value = new Date(coupon.endDate).toISOString().split("T")[0];
    form.usageLimit.value = coupon.usageLimit || 0;
    form.perUserLimit.value = coupon.perUserLimit || 1;
    form.status.value = coupon.status;

    updateValueLabel();

    // Change form behavior to update instead of create
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "Cập nhật mã";

    // Remove old submit handler and add new one
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(newForm);
      const data = Object.fromEntries(formData);

      try {
        const updateRes = await apiPatch(`/api/coupons/${couponId}`, data);

        if (!updateRes) return;
        const updateResult = await updateRes.json();

        if (updateRes.ok) {
          Notification.success("Cập nhật mã giảm giá thành công!");
          window.hideAddCouponModal();
          getCoupons();
          // Reset form to create mode
          document
            .getElementById("addCouponForm")
            .querySelector('button[type="submit"]').textContent = "Thêm mã";
        } else {
          Notification.error(updateResult.message || "Có lỗi xảy ra!");
        }
      } catch (error) {
        console.error("Error:", error);
        Notification.error("Đã xảy ra lỗi khi cập nhật mã giảm giá!");
      }
    });

    window.showAddCouponModal();
  } catch (error) {
    console.error("Error:", error);
    Notification.error("Không thể tải thông tin mã giảm giá!");
  }
};

// Delete coupon
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
        console.error("Error:", error);
        Notification.error("Đã xảy ra lỗi khi xóa mã giảm giá!");
      }
    },
  });
};
