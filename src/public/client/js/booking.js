import { Notification } from "../../utils/modal.js";
import { apiPost } from "../../utils/api.js";
import { formatPrice } from "../../utils/helpers.js";
import {
  validateEmail,
  validatePhoneNumber,
  validateFullName,
} from "../../utils/validators.js";

// State management
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
};

// DOM Elements
const step1Content = document.getElementById("step-1-content");
const step2Content = document.getElementById("step-2-content");
const step3Content = document.getElementById("step-3-content");

const step1Circle = document.getElementById("step-1-circle");
const step2Circle = document.getElementById("step-2-circle");
const step3Circle = document.getElementById("step-3-circle");

const line1 = document.getElementById("line-1");
const line2 = document.getElementById("line-2");

// Customer info inputs
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

// Get tour data from data attributes
const contentDiv = document.querySelector("[data-tour-id]");
const tourId =
  contentDiv?.dataset.tourId || window.location.pathname.split("/").pop();
const tourPrice = parseInt(contentDiv?.dataset.tourPrice) || 0;
const tourCapacity = parseInt(contentDiv?.dataset.tourCapacity) || 1;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  bookingState.tourId = tourId;
  bookingState.subtotal = tourPrice;
  bookingState.total = tourPrice;

  // Update unit price display
  unitPriceEl.textContent = formatPrice(tourPrice) + "₫";

  setupEventListeners();
  updatePriceSummary();
});

function setupEventListeners() {
  // Customer name validation
  customerNameInput.addEventListener("blur", () => {
    validateCustomerName();
  });
  customerNameInput.addEventListener("input", () => {
    clearFieldError("customer-name");
  });

  // Customer email validation
  customerEmailInput.addEventListener("blur", () => {
    validateCustomerEmail();
  });
  customerEmailInput.addEventListener("input", () => {
    clearFieldError("customer-email");
  });

  // Customer phone validation
  customerPhoneInput.addEventListener("blur", () => {
    validateCustomerPhone();
  });
  customerPhoneInput.addEventListener("input", () => {
    clearFieldError("customer-phone");
  });

  // Guest count controls
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

  // Coupon
  applyCouponBtn.addEventListener("click", applyCoupon);
  couponCodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") applyCoupon();
  });
  couponCodeInput.addEventListener("input", () => {
    applyCouponBtn.disabled = false;
    couponMessage.classList.add("hidden");
  });

  // Step navigation
  nextStep1Btn.addEventListener("click", goToStep2);
  backToStep1Btn.addEventListener("click", goToStep1);
  confirmPaymentBtn.addEventListener("click", confirmPayment);

  // Payment method
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      bookingState.paymentMethod = e.target.value;
    });
  });

  // Departure date validation
  departureDateSelect.addEventListener("blur", () => {
    validateDepartureDate();
  });
  departureDateSelect.addEventListener("change", () => {
    clearFieldError("departure-date");
    onDepartureDateChange();
  });
}

function onGuestCountChange() {
  const guestCount = parseInt(guestCountInput.value);
  bookingState.guestCount = guestCount;
  totalGuestsEl.textContent = guestCount;
  updatePriceSummary();
}

function onDepartureDateChange() {
  const selected =
    departureDateSelect.options[departureDateSelect.selectedIndex];
  if (selected.value) {
    bookingState.departureDate = selected.value;

    // Extract price from text like "09/12/2025 - 123.213.213₫/người"
    // Get the text and extract numbers after " - " and before "₫"
    const text = selected.textContent;
    const priceMatch = text.match(/[\d.]+(?=₫)/);
    const priceText = priceMatch ? priceMatch[0].replace(/\./g, "") : "";

    bookingState.departureDatePrice = parseInt(priceText) || tourPrice;
    updatePriceSummary();
  }
}

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

  // Update UI
  subtotalEl.textContent = formatPrice(subtotal) + "₫";
  discountAmountEl.textContent = formatPrice(bookingState.discountAmount) + "₫";
  finalTotalEl.textContent = formatPrice(total) + "₫";

  // Update step 2 summary
  document.getElementById("summary-subtotal").textContent =
    formatPrice(subtotal) + "₫";
  document.getElementById("summary-total").textContent =
    formatPrice(total) + "₫";
  document.getElementById("summary-guests").textContent =
    bookingState.guestCount + " người";

  if (bookingState.departureDate) {
    const dateText =
      departureDateSelect.options[departureDateSelect.selectedIndex].dataset
        .date;
    document.getElementById("summary-date").textContent = dateText;
    document.getElementById("booking-date").textContent = dateText;
  }
}

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

      // Populate coupon details in step 1
      const couponCodeDisplay = document.getElementById("coupon-code-display");
      if (couponCodeDisplay) {
        couponCodeDisplay.textContent = result.data.couponCode;
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

      // Show discount info in step 2
      const summaryDiscount = document.getElementById("summary-discount");
      if (summaryDiscount) {
        summaryDiscount.classList.remove("hidden");
      }
      const couponCodeEl = document.getElementById("summary-coupon-code");
      if (couponCodeEl) {
        couponCodeEl.textContent = result.data.couponCode;
      }
      const summaryDiscountAmountEl = document.querySelector(
        "#summary-discount-amount"
      );
      if (summaryDiscountAmountEl) {
        summaryDiscountAmountEl.textContent =
          formatPrice(result.data.discountAmount) + "₫";
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
    console.error("Error:", error);
    showCouponMessage("Có lỗi xảy ra, vui lòng thử lại", "error");
    applyCouponBtn.disabled = false;
  }
}

function showCouponMessage(message, type) {
  couponMessage.textContent = message;
  couponMessage.className = `text-sm mt-2 ${
    type === "success" ? "text-green-600" : "text-red-600"
  }`;
  couponMessage.classList.remove("hidden");
}

function goToStep(step) {
  // Hide all steps
  step1Content.classList.add("hidden");
  step2Content.classList.add("hidden");
  step3Content.classList.add("hidden");

  // Reset circle colors
  step1Circle.className =
    "w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-gray-400 transition";
  step2Circle.className =
    "w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-gray-400 transition";
  step3Circle.className =
    "w-12 h-12 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-gray-400 transition";

  line1.className = "flex-1 h-1 bg-gray-300 mx-2 mb-8";
  line2.className = "flex-1 h-1 bg-gray-300 mx-2 mb-8";

  if (step === 1) {
    step1Content.classList.remove("hidden");
    step1Circle.className =
      "w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-blue-600 transition";
  } else if (step === 2) {
    step2Content.classList.remove("hidden");

    // Highlight step 1 and 2
    step1Circle.className =
      "w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer transition";
    step1Circle.innerHTML = "<span>✓</span>";
    line1.className = "flex-1 h-1 bg-green-500 mx-2 mb-8";

    step2Circle.className =
      "w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-blue-600 transition";
  } else if (step === 3) {
    step3Content.classList.remove("hidden");

    // Highlight all steps
    step1Circle.className =
      "w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer transition";
    step1Circle.innerHTML = "<span>✓</span>";
    line1.className = "flex-1 h-1 bg-green-500 mx-2 mb-8";

    step2Circle.className =
      "w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer transition";
    step2Circle.innerHTML = "<span>✓</span>";
    line2.className = "flex-1 h-1 bg-green-500 mx-2 mb-8";

    step3Circle.className =
      "w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2 cursor-pointer hover:bg-blue-600 transition";
  }
}

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

function validateDepartureDate() {
  if (!departureDateSelect.value) {
    showFieldError("departure-date", "Vui lòng chọn ngày khởi hành");
    return false;
  }

  clearFieldError("departure-date");
  return true;
}

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

function showFieldError(fieldId, message) {
  const errorDiv = getOrCreateErrorDiv(fieldId);
  const input = document.getElementById(fieldId);
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  input.classList.add("border-red-500");
  input.classList.remove("border-gray-300");
}

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

function validateStep1() {
  const nameValid = validateCustomerName();
  const emailValid = validateCustomerEmail();
  const phoneValid = validateCustomerPhone();
  const dateValid = validateDepartureDate();

  return nameValid && emailValid && phoneValid && dateValid;
}

function goToStep1() {
  goToStep(1);
}

function goToStep2() {
  if (!validateStep1()) {
    return;
  }
  goToStep(2);
}

async function confirmPayment() {
  try {
    confirmPaymentBtn.disabled = true;
    confirmPaymentBtn.textContent = "Đang xử lý...";

    const name = customerNameInput.value.trim();
    const email = customerEmailInput.value.trim();
    const phone = customerPhoneInput.value.trim();

    // Booking data from form inputs
    const bookingData = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      tourId: bookingState.tourId,
      guestCount: bookingState.guestCount,
      departureDate: bookingState.departureDate,
      paymentMethod: bookingState.paymentMethod,
      couponCode: bookingState.coupon?.code || null,
      total: bookingState.total,
    };

    // In real app, call API to create booking
    // const res = await apiPost("/api/bookings", JSON.stringify(bookingData));

    // Simulate success
    setTimeout(() => {
      document.getElementById("booking-code").textContent = `BK${Date.now()}`;
      document.getElementById("booking-total").textContent =
        formatPrice(bookingState.total) + "₫";
      goToStep(3);
      confirmPaymentBtn.disabled = false;
      confirmPaymentBtn.textContent = "Xác nhận thanh toán";
    }, 1000);
  } catch (error) {
    console.error("Error:", error);
    Notification.error("Có lỗi xảy ra, vui lòng thử lại");
    confirmPaymentBtn.disabled = false;
    confirmPaymentBtn.textContent = "Xác nhận thanh toán";
  }
}
