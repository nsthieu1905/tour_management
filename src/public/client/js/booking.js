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
  departureDate: null,
  departureDatePrice: 0,
  subtotal: 0,
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

const guestCountInput = document.getElementById("guest-count");
const decreaseGuestBtn = document.getElementById("decrease-guest");
const increaseGuestBtn = document.getElementById("increase-guest");
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

const nextStep1Btn = document.getElementById("next-step-1");
const backToStep1Btn = document.getElementById("back-to-step-1");
const confirmPaymentBtn = document.getElementById("confirm-payment");

// Lấy dữ liệu tour từ data attributes
const contentDiv = document.querySelector("[data-tour-id]");
const tourId =
  contentDiv?.dataset.tourId || window.location.pathname.split("/").pop();
const tourPrice = parseInt(contentDiv?.dataset.tourPrice) || 0;
const tourCapacity = parseInt(contentDiv?.dataset.tourCapacity) || 1;

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

  // Cập nhật giá hiển thị
  unitPriceEl.textContent = formatPrice(tourPrice) + "₫";

  // Lấy userId nếu đã đăng nhập
  fetchCurrentUserId();

  setupEventListeners();
  updatePriceSummary();
});

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

  // Điều khiển số lượng khách
  decreaseGuestBtn.addEventListener("click", () => {
    const current = parseInt(guestCountInput.value);
    if (current > 1) {
      guestCountInput.value = current - 1;
      onGuestCountChange();
    }
  });

  increaseGuestBtn.addEventListener("click", () => {
    const current = parseInt(guestCountInput.value);
    const maxGuests = parseInt(guestCountInput.max);
    if (current < maxGuests) {
      guestCountInput.value = current + 1;
      onGuestCountChange();
    }
  });

  guestCountInput.addEventListener("change", onGuestCountChange);

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

// Khi thay đổi số lượng khách
function onGuestCountChange() {
  const guestCount = parseInt(guestCountInput.value);
  bookingState.guestCount = guestCount;
  totalGuestsEl.textContent = guestCount;
  updatePriceSummary();
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
  const subtotal = basePrice * bookingState.guestCount;

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

  bookingState.total = total;

  // Cập nhật UI
  subtotalEl.textContent = formatPrice(subtotal) + "₫";
  discountAmountEl.textContent = formatPrice(bookingState.discountAmount) + "₫";
  finalTotalEl.textContent = formatPrice(total) + "₫";

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
      discountInfo.classList.remove("hidden");

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
