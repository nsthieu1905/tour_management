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
  // Kiểm tra user tồn tại và password đúng
  if (!user || !isPasswordValid) {
    return {
      isValid: false,
      hasError: true,
      errorType: "invalid_credentials",
    };
  }

  // Kiểm tra trạng thái tài khoản
  if (user.status === "inactive" || user.status === "blocked") {
    return {
      isValid: false,
      hasError: true,
      errorType: "account_locked",
    };
  }

  // Kiểm tra xem status có phải "active" không
  if (user.status !== "active") {
    return {
      isValid: false,
      hasError: true,
      errorType: "invalid_account_status",
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

/**
 * Validate user input (general)
 */
const validateUserInput = (userData) => {
  const errors = {};

  // Validate fullName
  if (userData.fullName) {
    if (!validateFullName(userData.fullName)) {
      errors.fullName = "Tên người dùng không hợp lệ";
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
  validateCredentials,
  validateTokenPayload,
  validateLoginInput,
  validateRegisterInput,
  validateUserInput,
};
