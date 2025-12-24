import {
  validateLoginInput,
  validateRegisterInput,
} from "../../utils/validators.js";
import { Notification } from "../../utils/modal.js";

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const FORM_CONFIGS = {
  login: {
    fields: ["username", "password"],
    validator: validateLoginInput,
    endpoint: "/auth/cus-login",
    successMessage: "Đăng nhập thành công!",
    redirectUrl: "/",
    buttonTextId: "loginButtonText",
    spinnerId: "loginSpinner",
  },
  register: {
    fields: ["fullName", "email", "phone", "password", "passwordConfirm"],
    validator: validateRegisterInput,
    endpoint: "/auth/register",
    successMessage: "Đăng ký thành công!",
    redirectUrl: "/customer/auth/login",
    buttonTextId: "registerButtonText",
    spinnerId: "registerSpinner",
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Hiển thị/ẩn lỗi cho một trường input
function showFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);
  const errorMsgElement = document.getElementById(`${fieldId}ErrorMsg`);

  if (!field || !errorElement) return;

  if (errorMessage) {
    field.classList.add("border-red-500", "bg-red-50");
    const targetElement = errorMsgElement || errorElement;
    targetElement.textContent = errorMessage;
    errorElement.classList.remove("hidden");
  } else {
    field.classList.remove("border-red-500", "bg-red-50");
    const targetElement = errorMsgElement || errorElement;
    targetElement.textContent = "";
    errorElement.classList.add("hidden");
  }
}

// Xóa tất cả lỗi của form
function clearAllErrors(fieldIds) {
  fieldIds.forEach((fieldId) => showFieldError(fieldId, null));
  clearFormError();
}

// Hiển thị/ẩn lỗi chung của form
function showFormError(message) {
  const formError = document.getElementById("formError");
  const formErrorMsg = document.getElementById("formErrorMsg");

  if (!formError || !formErrorMsg) return;

  if (message) {
    formErrorMsg.textContent = message;
    formError.classList.remove("hidden");
  } else {
    formErrorMsg.textContent = "";
    formError.classList.add("hidden");
  }
}

function clearFormError() {
  showFormError(null);
}

// Quản lý trạng thái loading
function toggleLoadingState(config, isLoading) {
  const buttonText = document.getElementById(config.buttonTextId);
  const spinner = document.getElementById(config.spinnerId);
  const button = document.querySelector(`button[type='submit']`);

  if (!buttonText || !spinner) return;

  if (isLoading) {
    buttonText.classList.add("hidden");
    spinner.classList.remove("hidden");
    if (button) button.disabled = true;
  } else {
    buttonText.classList.remove("hidden");
    spinner.classList.add("hidden");
    if (button) button.disabled = false;
  }
}

// Lấy giá trị từ các trường input
function getFormValues(fieldIds) {
  const values = {};
  fieldIds.forEach((fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) {
      values[fieldId] =
        fieldId === "password" || fieldId === "passwordConfirm"
          ? element.value
          : element.value.trim();
    }
  });
  return values;
}

// ============================================
// VALIDATION
// ============================================

// Kiểm tra form
function validateFormWithConfig(config) {
  const values = getFormValues(config.fields);
  const result = config.validator(...Object.values(values));

  if (!result.isValid) {
    Object.keys(result.errors).forEach((fieldId) => {
      showFieldError(fieldId, result.errors[fieldId]);
    });
  } else {
    config.fields.forEach((fieldId) => showFieldError(fieldId, null));
  }

  return result;
}

//  Setup validation cho từng trường input
function setupFieldValidation(fieldId, validator, validateArgs) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  // Xóa lỗi ngay khi người dùng bắt đầu nhập
  field.addEventListener("input", function () {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement && !errorElement.classList.contains("hidden")) {
      showFieldError(fieldId, null);
    }
  });

  field.addEventListener("blur", function () {
    const value =
      fieldId === "password" || fieldId === "passwordConfirm"
        ? this.value
        : this.value.trim();

    if (value) {
      const args = validateArgs(this.value);
      const result = validator(...args);
      showFieldError(fieldId, result.errors[fieldId] || null);
    }
  });
}

// ============================================
// SHOW/HIDE PASSWORD
// ============================================

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.getElementById("passwordToggle");

  if (!passwordInput || !toggleIcon) return;

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleIcon.classList.remove("fa-eye");
    toggleIcon.classList.add("fa-eye-slash");
  } else {
    passwordInput.type = "password";
    toggleIcon.classList.remove("fa-eye-slash");
    toggleIcon.classList.add("fa-eye");
  }
}

// ============================================
// LOGIN HANDLER
// ============================================

function setupLoginValidation() {
  setupFieldValidation("username", validateLoginInput, (value) => [
    value.trim(),
    "",
  ]);
  setupFieldValidation("password", validateLoginInput, (value) => ["", value]);
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const config = FORM_CONFIGS.login;

  const nextUrl = new URLSearchParams(window.location.search).get("next");
  const redirectUrl = nextUrl || config.redirectUrl;

  clearAllErrors(config.fields);

  const validationResult = validateFormWithConfig(config);
  if (!validationResult.isValid) return;

  const values = getFormValues(config.fields);
  const rememberMe = document.getElementById("rememberMe")?.checked || false;

  toggleLoadingState(config, true);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, rememberMe }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      toggleLoadingState(config, false);
      if (data.message) showFormError(data.message);
      return;
    }

    toggleLoadingState(config, false);
    Notification.success(config.successMessage);

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
  } catch (error) {
    toggleLoadingState(config, false);
    console.error("Login error:", error);
  }
}

// ============================================
// REGISTER HANDLER
// ============================================

function setupRegisterValidation() {
  const fields = ["fullName", "email", "phone", "password", "passwordConfirm"];

  fields.forEach((fieldId) => {
    setupFieldValidation(fieldId, validateRegisterInput, (value) => {
      // Tạo object với tất cả giá trị hiện tại
      const values = getFormValues(FORM_CONFIGS.register.fields);
      // Cập nhật giá trị của field đang validate
      values[fieldId] =
        fieldId === "password" || fieldId === "passwordConfirm"
          ? value
          : value.trim();

      return Object.values(values);
    });
  });
}

function validateRegisterForm(config) {
  const result = validateFormWithConfig(config);

  if (!result.isValid) return false;

  const agreeTerms = document.getElementById("agreeTerms")?.checked;
  if (!agreeTerms) {
    Notification.error("Bạn phải đồng ý với Điều khoản sử dụng");
    return false;
  }

  return true;
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const config = FORM_CONFIGS.register;

  clearAllErrors(config.fields);

  if (!validateRegisterForm(config)) return;

  const values = getFormValues(config.fields);

  toggleLoadingState(config, true);

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      toggleLoadingState(config, false);

      if (data.errors) {
        Object.keys(data.errors).forEach((field) => {
          showFieldError(field, data.errors[field]);
        });
      }

      if (data.message) {
        Notification.error(data.message);
      }

      return;
    }

    toggleLoadingState(config, false);
    Notification.success(config.successMessage);

    document.getElementById("registerForm")?.classList.add("hidden");
    document.getElementById("registerSuccess")?.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = config.redirectUrl;
    }, 1000);
  } catch (error) {
    toggleLoadingState(config, false);
    Notification.error("Lỗi kết nối, vui lòng thử lại");
    console.error("Register error:", error);
  }
}

// ============================================
// LOGOUT HANDLER
// ============================================

async function handleCusLogout() {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (response.ok) {
      window.location.href = "/";
    } else {
      const data = await response.json();
      Notification.error(data.message || "Đăng xuất thất bại");
    }
  } catch (error) {
    console.error("Logout error:", error);
    Notification.error("Lỗi kết nối, vui lòng thử lại");
  }
}

// ============================================
// KIỂM TRA VÀ LẤY THÔNG TIN NGƯỜI DÙNG
// ============================================

// Kiểm tra người dùng đã đăng nhập hay chưa
async function isLoggedIn() {
  try {
    const response = await fetch("/auth/check-token", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();
    return data.success && !data.expired;
  } catch (error) {
    console.error("Check login error:", error);
    return false;
  }
}

// Lấy thông tin người dùng hiện tại
async function getCurrentUser() {
  try {
    const response = await fetch("/api/users/current-user", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.user;
    }
    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// Load user
async function loadUserInfo() {
  try {
    const loggedIn = await isLoggedIn();
    const user = await getCurrentUser();

    const loginBtn = document.getElementById("loginBtn");
    const userSection = document.getElementById("userSection");

    if (loggedIn && user) {
      // Hiển thị thông tin người dùng, ẩn nút đăng nhập
      loginBtn?.classList.add("hidden");
      userSection?.classList.remove("hidden");

      // Lấy thông tin người dùng và hiển thị
      const userFullName = document.getElementById("userFullName");
      const userFullNameDropdown = document.getElementById(
        "userFullNameDropdown"
      );
      const userEmailDropdown = document.getElementById("userEmailDropdown");

      if (userFullName) userFullName.textContent = user.fullName;
      if (userFullNameDropdown)
        userFullNameDropdown.textContent = user.fullName;
      if (userEmailDropdown) userEmailDropdown.textContent = user.email;
    } else {
      // Hiển thị nút đăng nhập, ẩn thông tin người dùng
      loginBtn?.classList.remove("hidden");
      userSection?.classList.add("hidden");
    }
  } catch (error) {
    console.error("Load user info error:", error);
  }
}

// Dropdown menu
function toggleUserMenuCustomer() {
  const menu = document.getElementById("userMenuCustomer");
  if (!menu) return;

  menu.classList.toggle("hidden");

  if (!menu.classList.contains("hidden")) {
    setTimeout(() => {
      document.addEventListener("click", function closeMenu(e) {
        const btn = document.getElementById("userMenuBtn");
        if (!btn?.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.add("hidden");
          document.removeEventListener("click", closeMenu);
        }
      });
    }, 0);
  }
}

// ============================================
// ADD EVENT LISTENERS
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const logoutBtn = document.getElementById("btn-logout");
  const userMenuBtn = document.getElementById("userMenuBtn");
  const showPasswordBtn = document.getElementById("showPasswordBtn");

  if (loginForm) {
    setupLoginValidation();
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (registerForm) {
    setupRegisterValidation();
    registerForm.addEventListener("submit", handleRegisterSubmit);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleCusLogout);
  }

  if (userMenuBtn) {
    userMenuBtn.addEventListener("click", toggleUserMenuCustomer);
  }

  if (showPasswordBtn) {
    showPasswordBtn.addEventListener("click", togglePassword);
  }

  loadUserInfo();
});
