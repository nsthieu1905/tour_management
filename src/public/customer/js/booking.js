import { Notification } from "../../utils/modal.js";
import { apiGet, apiPost } from "../../utils/api.js";
import { formatPrice } from "../../utils/helpers.js";
import {
  validateEmail,
  validatePhoneNumber,
  validateFullName,
} from "../../utils/validators.js";

// Định dạng ngày sang dd/mm/yyyy
function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Quản lý trạng thái đặt tour
let bookingState = {
  tourId: null,
  guestCount: 1,
  adultCount: 1,
  childCount: 0,
  infantCount: 0,
  departureDate: null,
  departureDatePrice: 0,
  subtotal: 0,
  extrasTotal: 0,
  extraServices: [],
  coupon: null,
  discountAmount: 0,
  total: 0,
  paymentMethod: "momo",
  userId: null,
};

// Các phần tử DOM
const step1Content = document.getElementById("step-1-content");
const step2Content = document.getElementById("step-2-content");

const step1Circle = document.getElementById("step-1-circle");
const step2Circle = document.getElementById("step-2-circle");

const line1 = document.getElementById("line-1");

// Input thông tin khách hàng
const customerNameInput = document.getElementById("customer-name");
const customerEmailInput = document.getElementById("customer-email");
const customerPhoneInput = document.getElementById("customer-phone");

const adultDecreaseBtn = document.getElementById("adult-decrease");
const adultIncreaseBtn = document.getElementById("adult-increase");
const childDecreaseBtn = document.getElementById("child-decrease");
const childIncreaseBtn = document.getElementById("child-increase");
const infantDecreaseBtn = document.getElementById("infant-decrease");
const infantIncreaseBtn = document.getElementById("infant-increase");

const adultCountEl = document.getElementById("adult-count");
const childCountEl = document.getElementById("child-count");
const infantCountEl = document.getElementById("infant-count");
const seatsRemainingEl = document.getElementById("seats-remaining");
const departureDateSelect = document.getElementById("departure-date");

const couponCodeInput = document.getElementById("coupon-code");
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponMessage = document.getElementById("coupon-message");
const discountInfo = document.getElementById("discount-info");

const subtotalEl = document.getElementById("subtotal");
const totalGuestsEl = document.getElementById("total-guests");
const unitPriceEl = document.getElementById("unit-price");
const discountAmountEl = document.getElementById("discount-amount");
const finalTotalEl = document.getElementById("final-total");
const extrasTotalEl = document.getElementById("extras-total");

const servicesBreakdownEl = document.getElementById("services-breakdown");
const discountSummaryRow = document.getElementById("discount-summary-row");
const discountSummaryAmountEl = document.getElementById(
  "discount-summary-amount"
);

const includedServicesMeta = Array.from(
  document.querySelectorAll(".included-service-item")
).map((el) => ({
  partnerName: el.dataset.partnerName || "",
  serviceName: el.dataset.serviceName || "",
}));

const extraServiceMetaById = new Map(
  Array.from(document.querySelectorAll(".extra-service-checkbox")).map((cb) => [
    String(cb.dataset.serviceId),
    {
      partnerName: cb.dataset.partnerName || "",
      serviceName: cb.dataset.serviceName || "",
    },
  ])
);

const nextStep1Btn = document.getElementById("next-step-1");
const backToStep1Btn = document.getElementById("back-to-step-1");
const confirmPaymentBtn = document.getElementById("confirm-payment");

// Lấy dữ liệu tour từ data attributes
const contentDiv = document.querySelector("[data-tour-id]");
const tourId =
  contentDiv?.dataset.tourId || window.location.pathname.split("/").pop();
const tourPrice = parseInt(contentDiv?.dataset.tourPrice) || 0;
const tourCapacity = parseInt(contentDiv?.dataset.tourCapacity) || 1;
const tourAvailableSeats = parseInt(contentDiv?.dataset.tourAvailable) || 1;

// Thông tin ngân hàng
const BANK_CONFIG = {
  bankName: "Ngân hàng Quân Đội (MB Bank)",
  accountNumber: "0001242921822",
  accountName: "NGUYEN SY TRUNG HIEU",
  bankCode: "MBB",
};

// Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  bookingState.tourId = tourId;
  bookingState.subtotal = tourPrice;
  bookingState.total = tourPrice;

  if (seatsRemainingEl) {
    seatsRemainingEl.textContent = String(
      Math.max(0, tourAvailableSeats - bookingState.guestCount)
    );
  }

  // Cập nhật giá hiển thị
  unitPriceEl.textContent = formatPrice(tourPrice) + "₫";

  // Lấy userId nếu đã đăng nhập
  fetchCurrentUserId();

  setupEventListeners();
  setupExtraServices();
  updatePriceSummary();
});

function setupExtraServices() {
  const checkboxes = document.querySelectorAll(".extra-service-checkbox");
  const extrasEmpty = document.getElementById("extras-empty");

  if (!checkboxes || checkboxes.length === 0) {
    if (extrasEmpty) extrasEmpty.classList.remove("hidden");
    return;
  }

  if (extrasEmpty) {
    const anyExtras = Array.from(checkboxes).length > 0;
    if (!anyExtras) extrasEmpty.classList.remove("hidden");
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.serviceId;
      const qtyBox = document.querySelector(
        `.extra-service-qty[data-for="${id}"]`
      );
      if (cb.checked) {
        if (qtyBox) qtyBox.classList.remove("hidden");
      } else {
        if (qtyBox) qtyBox.classList.add("hidden");
      }
      recomputeExtras();
    });
  });

  document.querySelectorAll(".extra-service-qty-decrease").forEach((btn) => {
    btn.addEventListener("click", () => {
      const serviceId = btn.dataset.serviceId;
      const input = document.querySelector(
        `.extra-service-qty-input[data-service-id="${serviceId}"]`
      );
      if (!input) return;
      const min = Number(input.min) || 1;
      const current = Number(input.value) || 1;
      const next = Math.max(min, current - 1);
      input.value = String(next);
      recomputeExtras();
    });
  });

  document.querySelectorAll(".extra-service-qty-increase").forEach((btn) => {
    btn.addEventListener("click", () => {
      const serviceId = btn.dataset.serviceId;
      const input = document.querySelector(
        `.extra-service-qty-input[data-service-id="${serviceId}"]`
      );
      if (!input) return;
      const max = Number(input.max) || 1;
      const current = Number(input.value) || 1;
      const next = Math.min(max, current + 1);
      input.value = String(next);
      recomputeExtras();
    });
  });

  document.querySelectorAll(".extra-service-qty-input").forEach((input) => {
    input.setAttribute("inputmode", "none");
    input.readOnly = true;

    const prevent = (e) => {
      e.preventDefault();
    };

    input.addEventListener("keydown", prevent);
    input.addEventListener("paste", prevent);
    input.addEventListener("drop", prevent);
    input.addEventListener(
      "wheel",
      (e) => {
        prevent(e);
        input.blur();
      },
      { passive: false }
    );

    input.addEventListener("change", () => {
      const max = Number(input.max) || 1;
      const min = Number(input.min) || 1;
      let val = Number(input.value) || 1;
      if (val < min) val = min;
      if (val > max) val = max;
      input.value = String(val);
      recomputeExtras();
    });
  });

  recomputeExtras();
}

function renderServicesBreakdown() {
  if (!servicesBreakdownEl) return;

  const items = [];

  includedServicesMeta.forEach((s) => {
    const label = `${s.partnerName} - ${s.serviceName}`.trim();
    if (label) items.push({ label, amount: 0 });
  });

  (bookingState.extraServices || []).forEach((s) => {
    const meta = extraServiceMetaById.get(String(s.serviceId));
    const label = `${meta?.partnerName || ""} - ${
      meta?.serviceName || ""
    }`.trim();
    items.push({
      label: label || String(s.serviceId),
      amount: (Number(s.unitPrice) || 0) * (Number(s.quantity) || 1),
    });
  });

  if (items.length === 0) {
    servicesBreakdownEl.innerHTML = "";
    return;
  }

  servicesBreakdownEl.innerHTML = `
    <ul class="mt-2 list-disc pl-5 space-y-1">
      ${items
        .map(
          (x) =>
            `<li class="flex justify-between gap-3"><span class="truncate">${String(
              x.label || ""
            )}</span><span class="font-medium">${formatPrice(
              Number(x.amount) || 0
            )}₫</span></li>`
        )
        .join("")}
    </ul>
  `;
}

function recomputeExtras() {
  let total = 0;
  const selected = [];

  document.querySelectorAll(".extra-service-checkbox:checked").forEach((cb) => {
    const serviceId = cb.dataset.serviceId;
    const unitPrice = Number(cb.dataset.price) || 0;
    const qtyInput = document.querySelector(
      `.extra-service-qty-input[data-service-id="${serviceId}"]`
    );
    const quantity = Math.max(1, Number(qtyInput?.value) || 1);
    selected.push({ serviceId, quantity, unitPrice });
    total += unitPrice * quantity;
  });

  bookingState.extraServices = selected;
  bookingState.extrasTotal = total;

  if (extrasTotalEl) {
    extrasTotalEl.textContent = formatPrice(total) + "₫";
  }

  const summaryRow = document.getElementById("summary-extras-row");
  const summaryExtras = document.getElementById("summary-extras");
  if (summaryRow && summaryExtras) {
    if (total > 0) {
      summaryRow.classList.remove("hidden");
      summaryExtras.textContent = formatPrice(total) + "₫";
    } else {
      summaryRow.classList.add("hidden");
      summaryExtras.textContent = "0₫";
    }
  }

  renderServicesBreakdown();

  updatePriceSummary();
}

// Lấy userId hiện tại từ API
async function fetchCurrentUserId() {
  try {
    const res = await apiGet("/api/users/current-user");
    const result = await res.json();
    if (res.ok && result.success && result.data?._id) {
      bookingState.userId = result.data._id;
    } else {
      bookingState.userId = null;
    }
  } catch (error) {
    bookingState.userId = null;
  }
}

// Gắn các sự kiện
function setupEventListeners() {
  // Validate tên khách hàng
  customerNameInput.addEventListener("blur", () => {
    validateCustomerName();
  });
  customerNameInput.addEventListener("input", () => {
    clearFieldError("customer-name");
  });

  // Validate email
  customerEmailInput.addEventListener("blur", () => {
    validateCustomerEmail();
  });
  customerEmailInput.addEventListener("input", () => {
    clearFieldError("customer-email");
  });

  // Validate số điện thoại
  customerPhoneInput.addEventListener("blur", () => {
    validateCustomerPhone();
  });
  customerPhoneInput.addEventListener("input", () => {
    clearFieldError("customer-phone");
  });

  const syncGuestUI = () => {
    if (adultCountEl)
      adultCountEl.textContent = String(bookingState.adultCount);
    if (childCountEl)
      childCountEl.textContent = String(bookingState.childCount);
    if (infantCountEl)
      infantCountEl.textContent = String(bookingState.infantCount);

    const total =
      (bookingState.adultCount || 0) +
      (bookingState.childCount || 0) +
      (bookingState.infantCount || 0);
    bookingState.guestCount = total;
    if (totalGuestsEl) totalGuestsEl.textContent = String(total);

    if (seatsRemainingEl) {
      seatsRemainingEl.textContent = String(
        Math.max(0, tourAvailableSeats - total)
      );
    }
  };

  const showCapacityWarning = () => {
    Notification.error(
      `Rất tiếc, tour hiện tại chỉ còn ${Math.max(0, tourAvailableSeats)} chỗ.`
    );
  };

  const tryIncrease = (key) => {
    const total =
      bookingState.adultCount +
      bookingState.childCount +
      bookingState.infantCount;
    if (total >= tourAvailableSeats) {
      showCapacityWarning();
      return;
    }
    bookingState[key] += 1;
    syncGuestUI();
    updatePriceSummary();
  };

  const tryDecrease = (key, min) => {
    bookingState[key] = Math.max(min, bookingState[key] - 1);
    syncGuestUI();
    updatePriceSummary();
  };

  if (adultIncreaseBtn)
    adultIncreaseBtn.addEventListener("click", () => tryIncrease("adultCount"));
  if (adultDecreaseBtn)
    adultDecreaseBtn.addEventListener("click", () =>
      tryDecrease("adultCount", 1)
    );
  if (childIncreaseBtn)
    childIncreaseBtn.addEventListener("click", () => tryIncrease("childCount"));
  if (childDecreaseBtn)
    childDecreaseBtn.addEventListener("click", () =>
      tryDecrease("childCount", 0)
    );
  if (infantIncreaseBtn)
    infantIncreaseBtn.addEventListener("click", () =>
      tryIncrease("infantCount")
    );
  if (infantDecreaseBtn)
    infantDecreaseBtn.addEventListener("click", () =>
      tryDecrease("infantCount", 0)
    );

  syncGuestUI();

  // Mã giảm giá
  applyCouponBtn.addEventListener("click", applyCoupon);
  couponCodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") applyCoupon();
  });
  couponCodeInput.addEventListener("input", () => {
    applyCouponBtn.disabled = false;
    couponMessage.classList.add("hidden");
  });

  // Điều hướng các bước
  nextStep1Btn.addEventListener("click", goToStep2);
  backToStep1Btn.addEventListener("click", goToStep1);
  confirmPaymentBtn.addEventListener("click", confirmPayment);

  // Phương thức thanh toán
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      bookingState.paymentMethod = e.target.value;
      updatePaymentMethodUI();
    });
  });

  // Validate ngày khởi hành
  departureDateSelect.addEventListener("blur", () => {
    validateDepartureDate();
  });
  departureDateSelect.addEventListener("change", () => {
    clearFieldError("departure-date");
    onDepartureDateChange();
  });
}

// Khi thay đổi ngày khởi hành
function onDepartureDateChange() {
  const selected =
    departureDateSelect.options[departureDateSelect.selectedIndex];
  if (selected.value) {
    // Lưu ObjectId cho API
    bookingState.departureDateId = selected.value;

    // Lấy ngày thực từ data-date attribute
    const dateStr = selected.getAttribute("data-date");
    bookingState.departureDate = dateStr;

    // Trích xuất giá từ text như "09/12/2025 - 123.213.213₫/người"
    const text = selected.textContent;
    const priceMatch = text.match(/[\d.]+(?=₫)/);
    const priceText = priceMatch ? priceMatch[0].replace(/\./g, "") : "";

    bookingState.departureDatePrice = parseInt(priceText) || tourPrice;
    updatePriceSummary();
  }
}

// Cập nhật tóm tắt giá
function updatePriceSummary() {
  const basePrice = bookingState.departureDatePrice || tourPrice;
  const subtotal = Math.round(
    basePrice * (bookingState.adultCount || 0) +
      basePrice * 0.5 * (bookingState.childCount || 0) +
      basePrice * 0.25 * (bookingState.infantCount || 0)
  );

  bookingState.subtotal = subtotal;

  let total = subtotal;
  if (bookingState.coupon) {
    let discount = 0;
    if (bookingState.coupon.type === "percentage") {
      discount = Math.floor(subtotal * (bookingState.coupon.value / 100));
      if (bookingState.coupon.maxDiscount) {
        discount = Math.min(discount, bookingState.coupon.maxDiscount);
      }
    } else if (bookingState.coupon.type === "fixed_amount") {
      discount = bookingState.coupon.value;
    }
    bookingState.discountAmount = discount;
    total = subtotal - discount;
  }

  total = total + (bookingState.extrasTotal || 0);
  bookingState.total = total;

  // Cập nhật UI
  subtotalEl.textContent = formatPrice(total) + "₫";
  if (discountAmountEl) {
    discountAmountEl.textContent =
      formatPrice(bookingState.discountAmount) + "₫";
  }
  if (finalTotalEl) {
    finalTotalEl.textContent = formatPrice(total) + "₫";
  }
  if (extrasTotalEl) {
    extrasTotalEl.textContent =
      formatPrice(bookingState.extrasTotal || 0) + "₫";
  }

  if (discountSummaryRow && discountSummaryAmountEl) {
    if (bookingState.discountAmount > 0) {
      discountSummaryRow.classList.remove("hidden");
      discountSummaryAmountEl.textContent =
        "-" + formatPrice(bookingState.discountAmount) + "₫";
    } else {
      discountSummaryRow.classList.add("hidden");
      discountSummaryAmountEl.textContent = "0₫";
    }
  }

  // Cập nhật tóm tắt ở bước 2
  document.getElementById("summary-subtotal").textContent =
    formatPrice(subtotal) + "₫";
  document.getElementById("summary-discount-amount").textContent =
    formatPrice(bookingState.discountAmount) + "₫";
  document.getElementById("summary-total").textContent =
    formatPrice(total) + "₫";
  document.getElementById("summary-guests").textContent =
    bookingState.guestCount + " người";

  if (bookingState.departureDate) {
    const dateText = formatDateToDDMMYYYY(bookingState.departureDate);
    document.getElementById("summary-date").textContent = dateText;
  }
}

// Áp dụng mã giảm giá
async function applyCoupon() {
  const code = couponCodeInput.value.trim();
  if (!code) {
    showCouponMessage("Vui lòng nhập mã giảm giá", "error");
    return;
  }

  if (!bookingState.departureDate) {
    showCouponMessage("Vui lòng chọn ngày khởi hành trước", "error");
    return;
  }

  try {
    applyCouponBtn.disabled = true;

    const res = await apiPost(
      "/api/coupons/applyCoupon",
      JSON.stringify({
        couponCode: code,
        tourId: bookingState.tourId,
        originalPrice: bookingState.subtotal,
        departureDate: bookingState.departureDate,
      })
    );

    if (!res) {
      applyCouponBtn.disabled = false;
      return;
    }

    const result = await res.json();

    if (result.success) {
      bookingState.coupon = {
        code: result.data.couponCode,
        name: result.data.couponName,
        type: result.data.type,
        value: result.data.value,
        discountAmount: result.data.discountAmount,
        maxDiscount: result.data.maxDiscount,
      };

      updatePriceSummary();

      if (discountInfo) {
        discountInfo.classList.remove("hidden");
      }

      const discountDescription = document.getElementById(
        "discount-description"
      );
      if (discountDescription) {
        let description = "";
        if (result.data.type === "percentage") {
          description = `Giảm ${result.data.value}%`;
        } else if (result.data.type === "fixed_amount") {
          description = `Giảm ${formatPrice(result.data.value)}`;
        }
        discountDescription.textContent = description;
      }

      const couponCodeEl = document.getElementById("summary-coupon-code");
      if (couponCodeEl) {
        couponCodeEl.textContent = result.data.couponCode;
      }

      const summaryDiscount = document.getElementById("summary-discount");
      if (summaryDiscount) {
        summaryDiscount.classList.remove("hidden");
      }

      showCouponMessage(
        `Áp dụng thành công mã ${result.data.couponCode}`,
        "success"
      );
      applyCouponBtn.disabled = false;
    } else {
      showCouponMessage(result.message || "Mã giảm giá không hợp lệ", "error");
      applyCouponBtn.disabled = false;
    }
  } catch (error) {
    showCouponMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
    applyCouponBtn.disabled = false;
  }
}

// Hiển thị thông báo mã giảm giá
function showCouponMessage(message, type) {
  couponMessage.textContent = message;
  couponMessage.className = `text-sm mt-2 ${
    type === "success" ? "text-green-600" : "text-red-600"
  }`;
  couponMessage.classList.remove("hidden");
}

// Chuyển bước
function goToStep(step) {
  // Ẩn tất cả các bước
  step1Content.classList.add("hidden");
  step2Content.classList.add("hidden");

  // Reset màu các vòng tròn
  step1Circle.className =
    "w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-gray-400 transition";
  step2Circle.className =
    "w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-gray-400 transition";

  line1.className = "flex-1 h-1 bg-gray-300 mx-2 mb-8";

  if (step === 1) {
    step1Content.classList.remove("hidden");
    step1Circle.className =
      "w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-blue-600 transition";
  } else if (step === 2) {
    step2Content.classList.remove("hidden");

    // Đánh dấu hoàn thành bước 1 và 2
    step1Circle.className =
      "w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer transition";
    step1Circle.innerHTML = "<span>✓</span>";
    line1.className = "flex-1 h-1 bg-green-500 mx-2 mb-8";

    step2Circle.className =
      "w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-blue-600 transition";
  }
}

// Validate tên khách hàng
function validateCustomerName() {
  const name = customerNameInput.value.trim();

  if (!name) {
    showFieldError("customer-name", "Vui lòng nhập tên");
    return false;
  }

  if (!validateFullName(name)) {
    showFieldError("customer-name", "Tên phải từ 3 ký tự trở lên");
    return false;
  }

  clearFieldError("customer-name");
  return true;
}

// Validate email
function validateCustomerEmail() {
  const email = customerEmailInput.value.trim();

  if (!email) {
    showFieldError("customer-email", "Vui lòng nhập email");
    return false;
  }

  if (!validateEmail(email)) {
    showFieldError("customer-email", "Email không hợp lệ");
    return false;
  }

  clearFieldError("customer-email");
  return true;
}

// Validate số điện thoại
function validateCustomerPhone() {
  const phone = customerPhoneInput.value.trim();

  if (!phone) {
    showFieldError("customer-phone", "Vui lòng nhập số điện thoại");
    return false;
  }

  if (!validatePhoneNumber(phone)) {
    showFieldError(
      "customer-phone",
      "Số điện thoại không hợp lệ (VN: 09xx xxx xxxx)"
    );
    return false;
  }

  clearFieldError("customer-phone");
  return true;
}

// Validate ngày khởi hành
function validateDepartureDate() {
  if (!departureDateSelect.value) {
    showFieldError("departure-date", "Vui lòng chọn ngày khởi hành");
    return false;
  }

  clearFieldError("departure-date");
  return true;
}

// Lấy hoặc tạo div hiển thị lỗi
function getOrCreateErrorDiv(fieldId) {
  const input = document.getElementById(fieldId);
  const parent = input.parentElement;
  let errorDiv = parent.querySelector(".field-error");

  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "field-error text-red-600 text-sm mt-1";
    parent.appendChild(errorDiv);
  }

  return errorDiv;
}

// Hiển thị lỗi field
function showFieldError(fieldId, message) {
  const errorDiv = getOrCreateErrorDiv(fieldId);
  const input = document.getElementById(fieldId);
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  input.classList.add("border-red-500");
  input.classList.remove("border-gray-300");
}

// Xóa lỗi field
function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const parent = input.parentElement;
  const errorDiv = parent.querySelector(".field-error");

  if (errorDiv) {
    errorDiv.textContent = "";
    errorDiv.classList.add("hidden");
  }

  input.classList.remove("border-red-500");
  input.classList.add("border-gray-300");
}

// Validate tất cả các trường ở bước 1
function validateStep1() {
  const nameValid = validateCustomerName();
  const emailValid = validateCustomerEmail();
  const phoneValid = validateCustomerPhone();
  const dateValid = validateDepartureDate();

  return nameValid && emailValid && phoneValid && dateValid;
}

// Quay về bước 1
function goToStep1() {
  goToStep(1);
}

// Sang bước 2
function goToStep2() {
  if (!validateStep1()) {
    return;
  }
  goToStep(2);
}

// Cập nhật UI phương thức thanh toán
function updatePaymentMethodUI() {
  const bankSection = document.getElementById("bank-transfer-section");
  const confirmCheckbox = document.getElementById("bank-transfer-confirm");

  if (bookingState.paymentMethod === "bank_transfer") {
    bankSection.classList.remove("hidden");
    updateBankTransferInfo();
  } else {
    bankSection.classList.add("hidden");
    confirmCheckbox.checked = false;
  }
}

// Cập nhật thông tin chuyển khoản
function updateBankTransferInfo() {
  const qrImg = document.getElementById("qr-code-img");
  qrImg.src = "/images/QR.jpg";
  qrImg.alt = `QR Code chuyển ${Math.round(bookingState.total)}₫ tới ${
    BANK_CONFIG.accountNumber
  }`;

  document.getElementById("bank-name").textContent = BANK_CONFIG.bankName;
  document.getElementById("account-number").textContent =
    BANK_CONFIG.accountNumber;
  document.getElementById("account-name").textContent = BANK_CONFIG.accountName;
  document.getElementById("transfer-amount").textContent =
    formatPrice(bookingState.total) + "₫";
}

// Xác nhận thanh toán
async function confirmPayment() {
  try {
    // Xử lý chuyển khoản ngân hàng
    if (bookingState.paymentMethod === "bank_transfer") {
      const confirmCheckbox = document.getElementById("bank-transfer-confirm");
      if (!confirmCheckbox.checked) {
        Notification.error("Vui lòng xác nhận đã chuyển khoản");
        return;
      }

      const bookingData = {
        customerName: customerNameInput.value.trim(),
        customerEmail: customerEmailInput.value.trim(),
        customerPhone: customerPhoneInput.value.trim(),
        tourId: bookingState.tourId,
        guestCount: bookingState.guestCount,
        departureDate: bookingState.departureDate,
        paymentMethod: "bank_transfer",
        couponCode: bookingState.coupon?.code || null,
        subtotal: bookingState.subtotal,
        total: bookingState.total,
        extraServices: bookingState.extraServices,
        userId: bookingState.userId,
      };

      const res = await apiPost(
        "/api/bookings/create-bank-payment",
        JSON.stringify(bookingData)
      );

      if (!res) {
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = "Xác nhận thanh toán";
        return;
      }

      const result = await res.json();

      if (result.success) {
        sessionStorage.setItem("bookingId", result.data.bookingId);
        sessionStorage.setItem("bookingCode", result.data.bookingCode);
        sessionStorage.setItem("bookingTotal", bookingState.total);
        sessionStorage.setItem("paymentMethod", "bank_transfer");

        // Lưu vào localStorage để tồn tại sau khi F5
        localStorage.setItem("bookingId", result.data.bookingId);
        localStorage.setItem("bookingCode", result.data.bookingCode);
        localStorage.setItem("bookingTotal", bookingState.total);
        localStorage.setItem("paymentMethod", "bank_transfer");
        localStorage.setItem("lastBookingTime", new Date().getTime());

        window.location.href = "/booking-success";
      } else {
        Notification.error(result.message || "Có lỗi xảy ra, vui lòng thử lại");
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = "Xác nhận thanh toán";
      }
      return;
    }

    // Xử lý thanh toán tiền mặt
    if (bookingState.paymentMethod === "cash") {
      const bookingData = {
        customerName: customerNameInput.value.trim(),
        customerEmail: customerEmailInput.value.trim(),
        customerPhone: customerPhoneInput.value.trim(),
        tourId: bookingState.tourId,
        guestCount: bookingState.guestCount,
        departureDate: bookingState.departureDate,
        paymentMethod: "cash",
        couponCode: bookingState.coupon?.code || null,
        subtotal: bookingState.subtotal,
        total: bookingState.total,
        extraServices: bookingState.extraServices,
        userId: bookingState.userId,
      };

      const res = await apiPost(
        "/api/bookings/create-bank-payment",
        JSON.stringify(bookingData)
      );

      if (!res) {
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = "Xác nhận thanh toán";
        return;
      }

      const result = await res.json();

      if (result.success) {
        sessionStorage.setItem("bookingId", result.data.bookingId);
        sessionStorage.setItem("bookingCode", result.data.bookingCode);
        sessionStorage.setItem("bookingTotal", bookingState.total);
        sessionStorage.setItem("paymentMethod", "cash");

        // Lưu vào localStorage để tồn tại sau khi F5
        localStorage.setItem("bookingId", result.data.bookingId);
        localStorage.setItem("bookingCode", result.data.bookingCode);
        localStorage.setItem("bookingTotal", bookingState.total);
        localStorage.setItem("paymentMethod", "cash");
        localStorage.setItem("lastBookingTime", new Date().getTime());

        window.location.href = "/booking-success";
      } else {
        Notification.error(result.message || "Có lỗi xảy ra, vui lòng thử lại");
        confirmPaymentBtn.disabled = false;
        confirmPaymentBtn.textContent = "Xác nhận thanh toán";
      }
      return;
    }

    // Xử lý thanh toán MoMo
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = "Đang xử lý...";

    const bookingData = {
      customerName: customerNameInput.value.trim(),
      customerEmail: customerEmailInput.value.trim(),
      customerPhone: customerPhoneInput.value.trim(),
      tourId: bookingState.tourId,
      guestCount: bookingState.guestCount,
      departureDate: bookingState.departureDate,
      paymentMethod: bookingState.paymentMethod,
      couponCode: bookingState.coupon?.code || null,
      subtotal: bookingState.subtotal,
      total: bookingState.total,
      extraServices: bookingState.extraServices,
      userId: bookingState.userId,
    };

    const res = await apiPost(
      "/api/bookings/create-momo-payment",
      JSON.stringify(bookingData)
    );

    if (!res) {
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.textContent = "Xác nhận thanh toán";
      return;
    }

    const result = await res.json();

    if (result.success && result.data.payUrl) {
      sessionStorage.setItem("bookingId", result.data.bookingId);
      sessionStorage.setItem("bookingCode", result.data.bookingCode);
      sessionStorage.setItem("bookingTotal", bookingState.total);
      sessionStorage.setItem("paymentMethod", "momo");

      // Lưu vào localStorage để tồn tại sau khi F5
      localStorage.setItem("bookingId", result.data.bookingId);
      localStorage.setItem("bookingCode", result.data.bookingCode);
      localStorage.setItem("bookingTotal", bookingState.total);
      localStorage.setItem("paymentMethod", "momo");
      localStorage.setItem("lastBookingTime", new Date().getTime());

      window.location.href = result.data.payUrl;
    } else {
      Notification.error(result.message || "Có lỗi xảy ra, vui lòng thử lại");
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.textContent = "Xác nhận thanh toán";
    }
  } catch (error) {
    Notification.error("Có lỗi xảy ra, vui lòng thử lại");
    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.textContent = "Xác nhận thanh toán";
  }
}
