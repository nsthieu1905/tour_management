// ============================================================================
// USER VALIDATION
// ============================================================================

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  return username && username.trim().length >= 3;
};

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(?:\+84|0|84)[1-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

const validateFullName = (fullName) => {
  if (!fullName || fullName.trim().length === 0) return false;
  if (fullName.trim().length < 3) return false;
  return /^[a-zA-ZÀ-ỿ\s\-]+$/.test(fullName);
};

const validateLoginInput = (email, password) => {
  const errors = {};

  if (!email) {
    errors.username = "Email là bắt buộc";
  } else if (!validateEmail(email)) {
    errors.username = "Email không hợp lệ";
  }

  if (!password) {
    errors.password = "Mật khẩu là bắt buộc";
  } else if (!validatePassword(password)) {
    errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateCredentials = (email, password, user, isPasswordValid) => {
  const isValid = user && isPasswordValid && user.status === "active";

  if (!isValid) {
    return {
      isValid: false,
      hasError: true,
    };
  }

  return {
    isValid: true,
    hasError: false,
  };
};

const validateRegisterInput = (
  fullName,
  email,
  phone,
  password,
  passwordConfirm
) => {
  const errors = {};

  if (!fullName || fullName.trim().length === 0) {
    errors.fullName = "Vui lòng nhập tên nguời dùng";
  }

  if (!email) {
    errors.email = "Vui lòng nhập email";
  } else if (!validateEmail(email)) {
    errors.email = "Email không hợp lệ";
  }

  if (!phone) {
    errors.phone = "Vui lòng nhập số điện thoại";
  } else if (!validatePhoneNumber(phone)) {
    errors.phone = "Số điện thoại không hợp lệ";
  }

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

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateTokenPayload = (token) => {
  if (!token || typeof token !== "string") {
    return false;
  }
  return token.split(".").length === 3;
};

const validateUserInput = (userData) => {
  const errors = {};

  if (userData.fullName) {
    if (!validateFullName(userData.fullName)) {
      errors.fullName = "Tên người dùng không hợp lệ";
    }
  }

  if (userData.email) {
    if (!validateEmail(userData.email)) {
      errors.email = "Email không hợp lệ";
    }
  }

  if (userData.phone) {
    if (!validatePhoneNumber(userData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
  }

  if (userData.password) {
    if (!validatePassword(userData.password)) {
      errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================================================
// COUPON VALIDATION
// ============================================================================

/**
 * Validate coupon code format
 * - Chỉ cho phép chữ hoa, số và dấu gạch ngang
 * - Độ dài từ 3-20 ký tự
 */
const validateCouponCode = (code) => {
  if (!code || typeof code !== "string") return false;
  const trimmedCode = code.trim();
  if (trimmedCode.length < 3 || trimmedCode.length > 20) return false;
  return /^[A-Z0-9\-]+$/.test(trimmedCode);
};

/**
 * Validate coupon name
 * - Không được để trống
 * - Độ dài từ 3-100 ký tự
 */
const validateCouponName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmedName = name.trim();
  return trimmedName.length >= 3 && trimmedName.length <= 100;
};

/**
 * Validate coupon type
 */
const validateCouponType = (type) => {
  const validTypes = ["percentage", "fixed_amount"];
  return validTypes.includes(type);
};

/**
 * Validate coupon value based on type
 */
const validateCouponValue = (value, type) => {
  const numValue = Number(value);

  if (isNaN(numValue) || numValue <= 0) return false;

  if (type === "percentage") {
    // Phần trăm phải từ 1-100
    return numValue >= 1 && numValue <= 100;
  } else if (type === "fixed_amount") {
    // Số tiền phải >= 1000 VNĐ
    return numValue >= 1000;
  }

  return false;
};

/**
 * Validate minimum purchase amount
 */
const validateMinPurchase = (minPurchase) => {
  const numValue = Number(minPurchase);
  // Cho phép 0 hoặc số dương
  return !isNaN(numValue) && numValue >= 0;
};

/**
 * Validate max discount (cho loại percentage)
 */
const validateMaxDiscount = (maxDiscount, type) => {
  // Nếu không phải percentage thì không cần check
  if (type !== "percentage") return true;

  // Cho phép null/undefined (không giới hạn)
  if (!maxDiscount) return true;

  const numValue = Number(maxDiscount);
  return !isNaN(numValue) && numValue > 0;
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check valid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  // End date must be after start date
  return end > start;
};

/**
 * Validate usage limit
 */
const validateUsageLimit = (usageLimit) => {
  const numValue = Number(usageLimit);
  // Cho phép 0 (không giới hạn) hoặc số dương
  return !isNaN(numValue) && numValue >= 0 && Number.isInteger(numValue);
};

/**
 * Validate per user limit
 */
const validatePerUserLimit = (perUserLimit) => {
  const numValue = Number(perUserLimit);
  // Phải >= 1
  return !isNaN(numValue) && numValue >= 1 && Number.isInteger(numValue);
};

/**
 * Validate coupon status
 */
const validateCouponStatus = (status) => {
  const validStatuses = ["active", "inactive"];
  return validStatuses.includes(status);
};

/**
 * Main coupon validation function
 */
const validateCouponInput = (couponData) => {
  const errors = {};

  // Validate code
  if (!couponData.code) {
    errors.code = "Mã code là bắt buộc";
  } else if (!validateCouponCode(couponData.code)) {
    errors.code = "Mã code không hợp lệ (3-20 ký tự, chỉ chữ hoa, số và dấu -)";
  }

  // Validate name
  if (!couponData.name) {
    errors.name = "Tên mã giảm giá là bắt buộc";
  } else if (!validateCouponName(couponData.name)) {
    errors.name = "Tên phải từ 3-100 ký tự";
  }

  // Validate type
  if (!couponData.type) {
    errors.type = "Loại giảm giá là bắt buộc";
  } else if (!validateCouponType(couponData.type)) {
    errors.type = "Loại giảm giá không hợp lệ";
  }

  // Validate value
  if (!couponData.value && couponData.value !== 0) {
    errors.value = "Giá trị là bắt buộc";
  } else if (!validateCouponValue(couponData.value, couponData.type)) {
    if (couponData.type === "percentage") {
      errors.value = "Giá trị phần trăm phải từ 1-100";
    } else {
      errors.value = "Giá trị phải lớn hơn hoặc bằng 1.000 VNĐ";
    }
  }

  // Validate minPurchase (bắt buộc)
  if (!couponData.minPurchase && couponData.minPurchase !== 0) {
    errors.minPurchase = "Đơn tối thiểu là bắt buộc";
  } else if (!validateMinPurchase(couponData.minPurchase)) {
    errors.minPurchase = "Đơn tối thiểu không hợp lệ";
  }

  // Validate maxDiscount (chỉ cho percentage)
  if (couponData.type === "percentage" && couponData.maxDiscount) {
    if (!validateMaxDiscount(couponData.maxDiscount, couponData.type)) {
      errors.maxDiscount = "Giảm tối đa không hợp lệ";
    }
  }

  // Validate dates
  if (!couponData.startDate) {
    errors.startDate = "Ngày bắt đầu là bắt buộc";
  }
  if (!couponData.endDate) {
    errors.endDate = "Ngày kết thúc là bắt buộc";
  }
  if (couponData.startDate && couponData.endDate) {
    if (!validateDateRange(couponData.startDate, couponData.endDate)) {
      errors.dateRange = "Ngày kết thúc phải lớn hơn ngày bắt đầu";
    }
  }

  // Validate usageLimit
  if (couponData.usageLimit !== undefined && couponData.usageLimit !== null) {
    if (!validateUsageLimit(couponData.usageLimit)) {
      errors.usageLimit = "Giới hạn sử dụng không hợp lệ";
    }
  }

  // Validate perUserLimit
  if (!couponData.perUserLimit && couponData.perUserLimit !== 0) {
    errors.perUserLimit = "Giới hạn mỗi người là bắt buộc";
  } else if (!validatePerUserLimit(couponData.perUserLimit)) {
    errors.perUserLimit = "Giới hạn mỗi người phải >= 1";
  }

  // Validate status
  if (couponData.status && !validateCouponStatus(couponData.status)) {
    errors.status = "Trạng thái không hợp lệ";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate coupon for applying (user side)
 */
const validateApplyCoupon = (couponCode, tourId, originalPrice) => {
  const errors = {};

  if (
    !couponCode ||
    typeof couponCode !== "string" ||
    couponCode.trim().length === 0
  ) {
    errors.couponCode = "Vui lòng nhập mã giảm giá";
  }

  if (!tourId) {
    errors.tourId = "Tour ID không hợp lệ";
  }

  if (!originalPrice || originalPrice <= 0) {
    errors.originalPrice = "Giá tour không hợp lệ";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // User validations
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validateFullName,
  validateCredentials,
  validateTokenPayload,
  validateLoginInput,
  validateRegisterInput,
  validateUserInput,

  // Coupon validations
  validateCouponCode,
  validateCouponName,
  validateCouponType,
  validateCouponValue,
  validateMinPurchase,
  validateMaxDiscount,
  validateDateRange,
  validateUsageLimit,
  validatePerUserLimit,
  validateCouponStatus,
  validateCouponInput,
  validateApplyCoupon,
};
