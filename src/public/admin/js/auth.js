// Authentication System for TravelAdmin Pro
// Global variables for authentication
let loginStep = 1; // 1: credentials, 2: 2FA

// Login Functions
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

function fillDemoCredentials() {
  document.getElementById("username").value = "admin";
  document.getElementById("password").value = "admin123";

  // Add visual feedback
  const button = e.target;
  const originalText = button.textContent;
  button.textContent = "Đã điền!";
  button.classList.add("bg-green-200", "text-green-700");

  setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove("bg-green-200", "text-green-700");
  }, 1500);
}

function showLoadingState() {
  document.getElementById("loginButtonText").classList.add("hidden");
  document.getElementById("loginSpinner").classList.remove("hidden");
}

function hideLoadingState() {
  document.getElementById("loginButtonText").classList.remove("hidden");
  document.getElementById("loginSpinner").classList.add("hidden");
}

function show2FAStep() {
  document.getElementById("twoFactorSection").classList.remove("hidden");
  document.getElementById("loginButtonText").innerHTML =
    '<i class="fas fa-shield-alt mr-2"></i>Xác thực 2FA';
  loginStep = 2;

  // Focus on 2FA input
  setTimeout(() => {
    document.getElementById("twoFactorCode").focus();
  }, 100);
}

function loginSuccess() {
  // Hide login page with animation
  const loginPage = document.getElementById("loginPage");
  loginPage.style.transform = "scale(0.95)";
  loginPage.style.opacity = "0";

  setTimeout(() => {
    loginPage.classList.add("hidden");

    // Show success notification
    showNotification(
      "Đăng nhập thành công! Chào mừng bạn đến với TravelAdmin Pro.",
      "success"
    );
  }, 300);
}

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

  // Animate in
  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.add("translate-x-full");
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Page navigation functions
function showRegisterPage() {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("registerPage").classList.remove("hidden");
}

function showLoginPage() {
  document.getElementById("registerPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

// Register form functions
function toggleRegisterPassword() {
  const passwordInput = document.getElementById("regPassword");
  const toggleIcon = document.getElementById("regPasswordToggle");

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

function checkPasswordStrength(password) {
  const strengthIndicator = document.getElementById("passwordStrength");
  const strengthBars = ["strength1", "strength2", "strength3", "strength4"];
  const strengthText = document.getElementById("strengthText");

  if (password.length === 0) {
    strengthIndicator.classList.add("hidden");
    return;
  }

  strengthIndicator.classList.remove("hidden");

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;

  // Uppercase check
  if (/[A-Z]/.test(password)) strength++;

  // Lowercase check
  if (/[a-z]/.test(password)) strength++;

  // Number or special character check
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength++;

  // Reset all bars
  strengthBars.forEach((bar) => {
    document.getElementById(bar).className = "w-6 h-2 rounded-full bg-gray-200";
  });

  // Fill bars based on strength
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];
  const texts = ["Yếu", "Trung bình", "Khá", "Mạnh"];

  for (let i = 0; i < strength; i++) {
    document.getElementById(
      strengthBars[i]
    ).className = `w-6 h-2 rounded-full ${colors[strength - 1]}`;
  }

  strengthText.textContent = texts[strength - 1] || "Yếu";
  strengthText.className = `font-medium text-${
    colors[strength - 1]?.replace("bg-", "") || "red-500"
  }`;
}

function validatePasswords() {
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const confirmInput = document.getElementById("confirmPassword");

  if (password && confirmPassword) {
    if (password === confirmPassword) {
      confirmInput.classList.remove("border-red-500");
      confirmInput.classList.add("border-green-500");
      return true;
    } else {
      confirmInput.classList.remove("border-green-500");
      confirmInput.classList.add("border-red-500");
      return false;
    }
  }

  confirmInput.classList.remove("border-red-500", "border-green-500");
  return false;
}

function showRegisterLoadingState() {
  document.getElementById("registerButtonText").classList.add("hidden");
  document.getElementById("registerSpinner").classList.remove("hidden");
}

function hideRegisterLoadingState() {
  document.getElementById("registerButtonText").classList.remove("hidden");
  document.getElementById("registerSpinner").classList.add("hidden");
}

function registerSuccess() {
  hideRegisterLoadingState();
  document.getElementById("registerSuccess").classList.remove("hidden");

  // Scroll to success message
  document.getElementById("registerSuccess").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  // Auto redirect to login after 5 seconds
  setTimeout(() => {
    showNotification("Chuyển về trang đăng nhập...", "info");
    setTimeout(() => {
      showLoginPage();
      // Reset register form
      document.getElementById("registerForm").reset();
      document.getElementById("registerSuccess").classList.add("hidden");
      document.getElementById("passwordStrength").classList.add("hidden");
    }, 2000);
  }, 3000);
}

// Logout function
function logout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    // Show logout animation
    const loginPage = document.getElementById("loginPage");
    loginPage.classList.remove("hidden");
    loginPage.style.transform = "scale(0.95)";
    loginPage.style.opacity = "0";

    // Reset login form
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("twoFactorCode").value = "";
    document.getElementById("twoFactorSection").classList.add("hidden");
    document.getElementById("loginButtonText").innerHTML =
      '<i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập';
    loginStep = 1;

    // Animate login page back in
    setTimeout(() => {
      loginPage.style.transform = "scale(1)";
      loginPage.style.opacity = "1";
    }, 100);

    showNotification("Đã đăng xuất thành công!", "info");
  }
}

// Add shake animation CSS
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(shakeStyle);

// Handle login and register form submissions
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // Login form handler
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const twoFactorCode = document.getElementById("twoFactorCode").value;

    showLoadingState();

    // Simulate API call delay
    setTimeout(() => {
      if (loginStep === 1) {
        // First step: validate credentials
        if (username === "admin" && password === "admin123") {
          hideLoadingState();
          show2FAStep();
        } else {
          hideLoadingState();
          showNotification("Tên đăng nhập hoặc mật khẩu không đúng!", "error");

          // Shake animation for error
          const form = document.querySelector(".relative.bg-white");
          form.style.animation = "shake 0.5s ease-in-out";
          setTimeout(() => {
            form.style.animation = "";
          }, 500);
        }
      } else if (loginStep === 2) {
        // Second step: validate 2FA
        if (twoFactorCode === "123456") {
          hideLoadingState();
          loginSuccess();
        } else {
          hideLoadingState();
          showNotification("Mã xác thực 2FA không đúng!", "error");
          document.getElementById("twoFactorCode").value = "";
          document.getElementById("twoFactorCode").focus();
        }
      }
    }, 1500); // Simulate network delay
  });

  // Register form handler
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = {
      companyName: document.getElementById("companyName").value,
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      businessType: document.getElementById("businessType").value,
      username: document.getElementById("regUsername").value,
      password: document.getElementById("regPassword").value,
      confirmPassword: document.getElementById("confirmPassword").value,
      agreeTerms: document.getElementById("agreeTerms").checked,
      marketingConsent: document.getElementById("marketingConsent").checked,
    };

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showNotification("Mật khẩu xác nhận không khớp!", "error");
      return;
    }

    // Check password strength
    if (formData.password.length < 8) {
      showNotification("Mật khẩu phải có ít nhất 8 ký tự!", "error");
      return;
    }

    // Check terms agreement
    if (!formData.agreeTerms) {
      showNotification("Vui lòng đồng ý với điều khoản sử dụng!", "error");
      return;
    }

    showRegisterLoadingState();

    // Simulate API call
    setTimeout(() => {
      // Simulate successful registration
      registerSuccess();
      showNotification(
        "Đăng ký thành công! Kiểm tra email để xác thực tài khoản.",
        "success"
      );
    }, 2000);
  });

  // Auto-format 2FA code input
  document
    .getElementById("twoFactorCode")
    .addEventListener("input", function (e) {
      // Only allow numbers
      this.value = this.value.replace(/[^0-9]/g, "");

      // Auto-submit when 6 digits are entered
      if (this.value.length === 6) {
        setTimeout(() => {
          loginForm.dispatchEvent(new Event("submit"));
        }, 500);
      }
    });

  // Password strength checker
  document
    .getElementById("regPassword")
    .addEventListener("input", function (e) {
      checkPasswordStrength(this.value);
      validatePasswords();
    });

  // Confirm password validator
  document
    .getElementById("confirmPassword")
    .addEventListener("input", function (e) {
      validatePasswords();
    });

  // Phone number formatter
  document.getElementById("phone").addEventListener("input", function (e) {
    // Remove non-digits
    let value = this.value.replace(/\D/g, "");

    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    // Format as Vietnamese phone number
    if (value.length >= 4) {
      if (value.length <= 7) {
        value = value.replace(/(\d{4})(\d+)/, "$1 $2");
      } else {
        value = value.replace(/(\d{4})(\d{3})(\d+)/, "$1 $2 $3");
      }
    }

    this.value = value;
  });

  // Username availability checker (simulated)
  document.getElementById("regUsername").addEventListener("blur", function (e) {
    const username = this.value;
    if (username.length >= 3) {
      // Simulate checking username availability
      setTimeout(() => {
        if (username === "admin" || username === "test") {
          this.classList.add("border-red-500");
          showNotification("Tên đăng nhập đã được sử dụng!", "error");
        } else {
          this.classList.remove("border-red-500");
          this.classList.add("border-green-500");
        }
      }, 500);
    }
  });
});
