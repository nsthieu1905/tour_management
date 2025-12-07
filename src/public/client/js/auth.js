import {
  validateLoginInput,
  validateRegisterInput,
} from "../../utils/validators.js";
import { Notification } from "../../utils/modal.js";

// ============================================
// XỬ LÝ LỖI FORM
// ============================================

// Hiển thị lỗi cho một trường input
function showFieldError(fieldId, errorMessage) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}Error`);
  const errorMsgElement = document.getElementById(`${fieldId}ErrorMsg`);

  if (errorMessage) {
    field.classList.add("border-red-500", "bg-red-50");
    if (errorMsgElement) {
      errorMsgElement.textContent = errorMessage;
    } else {
      errorElement.textContent = errorMessage;
    }
    errorElement.classList.remove("hidden");
  } else {
    field.classList.remove("border-red-500", "bg-red-50");
    if (errorMsgElement) {
      errorMsgElement.textContent = "";
    } else {
      errorElement.textContent = "";
    }
    errorElement.classList.add("hidden");
  }
}

// Xóa tất cả lỗi
function clearAllErrors() {
  const fieldIds = ["username", "password"];
  fieldIds.forEach((fieldId) => {
    showFieldError(fieldId, null);
  });
  clearFormError();
}

// Hiển thị/ẩn lỗi chung của form
function showFormError(message) {
  const formError = document.getElementById("formError");
  const formErrorMsg = document.getElementById("formErrorMsg");

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

// ============================================
// KIỂM TRA DỮ LIỆU NHẬP VÀO
// ============================================

// Kiểm tra toàn bộ form
function validateForm(fields = ["username", "password"]) {
  const username = document.getElementById("username")?.value.trim() || "";
  const password = document.getElementById("password")?.value.trim() || "";

  const result = validateLoginInput(username, password);

  if (!result.isValid) {
    if (result.errors.username) {
      showFieldError("username", result.errors.username);
    }
    if (result.errors.password) {
      showFieldError("password", result.errors.password);
    }
  } else {
    showFieldError("username", null);
    showFieldError("password", null);
  }

  return result;
}

// Kiểm tra dữ liệu thời gian thực (khi người dùng nhập)
function setupRealtimeValidation() {
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");

  if (usernameField) {
    usernameField.addEventListener("blur", function () {
      const result = validateLoginInput(this.value.trim(), "");
      showFieldError("username", result.errors.username || null);
    });

    usernameField.addEventListener("input", function () {
      if (this.value.trim()) {
        const result = validateLoginInput(this.value.trim(), "");
        if (!result.errors.username) {
          showFieldError("username", null);
        }
      }
    });
  }

  if (passwordField) {
    passwordField.addEventListener("blur", function () {
      const result = validateLoginInput("", this.value);
      showFieldError("password", result.errors.password || null);
    });

    passwordField.addEventListener("input", function () {
      if (this.value) {
        const result = validateLoginInput("", this.value);
        if (!result.errors.password) {
          showFieldError("password", null);
        }
      }
    });
  }
}

// ============================================
// CHỨC NĂNG ĐĂNG NHẬP
// ============================================

// Chuyển đổi hiển thị/ẩn mật khẩu

// Hiển thị trạng thái đang tải (loading)
function showLoadingState() {
  document.getElementById("loginButtonText").classList.add("hidden");
  document.getElementById("loginSpinner").classList.remove("hidden");
}

// Ẩn trạng thái đang tải
function hideLoadingState() {
  document.getElementById("loginButtonText").classList.remove("hidden");
  document.getElementById("loginSpinner").classList.add("hidden");
}

// ============================================
// XỬ LÝ FORM ĐĂNG NHẬP
// ============================================

// Bắt sự kiện submit form
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  // Thiết lập kiểm tra dữ liệu thời gian thực
  setupRealtimeValidation();

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Xóa tất cả lỗi trước đó
      clearAllErrors();

      // Kiểm tra dữ liệu form
      const validationResult = validateForm();

      if (!validationResult.isValid) {
        return;
      }

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const rememberMe = document.getElementById("rememberMe").checked;

      showLoadingState();

      try {
        const response = await fetch("/auth/client-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
            rememberMe: rememberMe,
          }),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          hideLoadingState();

          // Hiển thị lỗi chung dưới form
          if (data.message) {
            showFormError(data.message);
          }

          return;
        }

        // Đăng nhập thành công
        hideLoadingState();
        Notification.success("Đăng nhập thành công!");

        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } catch (error) {
        hideLoadingState();
      }
    });
  }
});

// ============================================
// XỬ LÝ FORM ĐĂNG KÝ
// ============================================

// Hiển thị lỗi cho trường đăng ký
function showRegisterFieldError(fieldId, errorMessage) {
  // Map field names to actual element IDs in HTML
  const fieldMap = {
    password: "password",
    passwordConfirm: "passwordConfirm",
  };

  const actualFieldId = fieldMap[fieldId] || fieldId;
  const field = document.getElementById(actualFieldId);
  const errorElement = document.getElementById(`${actualFieldId}Error`);

  if (errorMessage) {
    field.classList.add("border-red-500", "bg-red-50");
    errorElement.textContent = errorMessage;
    errorElement.classList.remove("hidden");
  } else {
    field.classList.remove("border-red-500", "bg-red-50");
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  }
}

// Xóa tất cả lỗi đăng ký
function clearAllRegisterErrors() {
  const fieldIds = [
    "fullName",
    "email",
    "phone",
    "password",
    "passwordConfirm",
  ];
  fieldIds.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (field && errorElement) {
      field.classList.remove("border-red-500", "bg-red-50");
      errorElement.textContent = "";
      errorElement.classList.add("hidden");
    }
  });
}

// Hiển thị trạng thái loading đăng ký
function showRegisterLoadingState() {
  const registerBtn = document.querySelector(
    "#registerForm button[type='submit']"
  );
  const buttonText = document.getElementById("registerButtonText");
  const spinner = document.getElementById("registerSpinner");

  registerBtn.disabled = true;
  buttonText.classList.add("hidden");
  spinner.classList.remove("hidden");
}

// Ẩn trạng thái loading đăng ký
function hideRegisterLoadingState() {
  const registerBtn = document.querySelector(
    "#registerForm button[type='submit']"
  );
  const buttonText = document.getElementById("registerButtonText");
  const spinner = document.getElementById("registerSpinner");

  registerBtn.disabled = false;
  buttonText.classList.remove("hidden");
  spinner.classList.add("hidden");
}

// Kiểm tra form đăng ký
function validateRegisterForm() {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;

  const result = validateRegisterInput(
    fullName,
    email,
    phone,
    password,
    passwordConfirm
  );

  if (!result.isValid) {
    // Hiển thị lỗi cho từng field
    Object.keys(result.errors).forEach((fieldId) => {
      showRegisterFieldError(fieldId, result.errors[fieldId]);
    });
    return false;
  }

  // Kiểm tra đồng ý điều khoản
  const agreeTerms = document.getElementById("agreeTerms").checked;
  if (!agreeTerms) {
    Notification.error("Bạn phải đồng ý với Điều khoản sử dụng");
    return false;
  }

  return true;
}

// Bắt sự kiện submit form đăng ký
document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // Xóa tất cả lỗi trước đó
      clearAllRegisterErrors();

      // Kiểm tra dữ liệu form
      if (!validateRegisterForm()) {
        return;
      }

      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("passwordConfirm").value;

      showRegisterLoadingState();

      try {
        const response = await fetch("/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            fullName,
            email,
            phone,
            password,
            passwordConfirm,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          hideRegisterLoadingState();

          // Hiển thị lỗi từ server
          if (data.errors) {
            Object.keys(data.errors).forEach((field) => {
              showRegisterFieldError(field, data.errors[field]);
            });
          }

          if (data.message) {
            Notification.error(data.message);
          }

          return;
        }

        // Đăng ký thành công
        hideRegisterLoadingState();
        Notification.success("Đăng ký thành công!");

        // Hiển thị thông báo thành công
        document.getElementById("registerForm").classList.add("hidden");
        document.getElementById("registerSuccess").classList.remove("hidden");

        setTimeout(() => {
          window.location.href = "/client/auth/login";
        }, 1000);
      } catch (error) {
        hideRegisterLoadingState();
        Notification.error("Lỗi kết nối, vui lòng thử lại");
        console.error("Register error:", error);
      }
    });
  }
});
