import { validateLoginInput } from "../../utils/validators.js";

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
          showFieldField("password", null);
        }
      }
    });
  }
}

// ============================================
// CHỨC NĂNG ĐĂNG NHẬP
// ============================================

// Chuyển đổi hiển thị/ẩn mật khẩu
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleIcon = document.getElementById("passwordToggle");

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

// Hiển thị thông báo (toast notification)
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  notification.classList.add(bgColor, "text-white");

  notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${
              type === "success"
                ? "check-circle"
                : type === "error"
                ? "exclamation-circle"
                : "info-circle"
            }"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  setTimeout(() => {
    notification.classList.add("translate-x-full");
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ============================================
// CHUYỂN TRANG
// ============================================

// Hiển thị trang đăng ký
function showRegisterPage() {
  document.getElementById("loginPage").classList.add("hidden");
  if (document.getElementById("registerPage")) {
    document.getElementById("registerPage").classList.remove("hidden");
  }
}

// Hiển thị trang đăng nhập
function showLoginPage() {
  if (document.getElementById("registerPage")) {
    document.getElementById("registerPage").classList.add("hidden");
  }
  document.getElementById("loginPage").classList.remove("hidden");
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
        const response = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: username,
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
        showNotification("Đăng nhập thành công!", "success");

        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 1500);
      } catch (error) {
        hideLoadingState();
      }
    });
  }
});

// ============================================
// TỰ ĐỘNG LÀM MỚI TOKEN KHI HẾT HẠN
// ============================================

// Kiểm tra và làm mới token nếu hết hạn
async function checkAndRefreshToken() {
  try {
    const response = await fetch("/auth/check-token", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    // Nếu token hết hạn, thử làm mới
    if (data.expired) {
      const refreshResponse = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Nếu làm mới không thành công, chuyển hướng về trang đăng nhập
      if (!refreshResponse.ok) {
        window.location.href = "/auth/admin";
      }
    }
  } catch (error) {
    // Bỏ qua lỗi
  }
}

// Kiểm tra token mỗi 30 giây
// if (window.location.pathname.startsWith("/admin")) {
//   setInterval(checkAndRefreshToken, 30000);
//   checkAndRefreshToken();
// }
