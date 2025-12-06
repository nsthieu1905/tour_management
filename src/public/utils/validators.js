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

/**
 * Validate user credentials (kiểm tra email và password sai)
 * Trả về lỗi chung để không tiết lộ thông tin (bảo mật)
 */
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

const validateRegisterInput = (fullName, email, password, passwordConfirm) => {
  const errors = {};

  if (!fullName || fullName.trim().length === 0) {
    errors.fullName = "Tên đầy đủ là bắt buộc";
  } else if (!validateFullName(fullName)) {
    errors.fullName = "Tên đầy đủ không hợp lệ (không được chứa số)";
  }

  if (!email) {
    errors.email = "Email là bắt buộc";
  } else if (!validateEmail(email)) {
    errors.email = "Email không hợp lệ (vd: user@example.com)";
  }

  if (!password) {
    errors.password = "Mật khẩu là bắt buộc";
  } else if (!validatePassword(password)) {
    errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
  }

  if (password !== passwordConfirm) {
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
  // JWT format: header.payload.signature
  return token.split(".").length === 3;
};

/**
 * Validate user input (general)
 */
const validateUserInput = (userData) => {
  const errors = {};

  // Validate fullName
  if (userData.fullName) {
    if (!validateFullName(userData.fullName)) {
      errors.fullName = "Tên đầy đủ không hợp lệ";
    }
  }

  // Validate email
  if (userData.email) {
    if (!validateEmail(userData.email)) {
      errors.email = "Email không hợp lệ";
    }
  }

  // Validate phone
  if (userData.phone) {
    if (!validatePhoneNumber(userData.phone)) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
  }

  // Validate password (nếu có)
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

export {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhoneNumber,
  validateFullName,
  validateLoginInput,
  validateCredentials,
  validateRegisterInput,
  validateTokenPayload,
  validateUserInput,
};
