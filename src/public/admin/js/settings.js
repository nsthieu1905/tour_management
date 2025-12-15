import { Modal, Notification } from "../../utils/modal.js";
import { validateEmail, validatePhoneNumber } from "../../utils/validators.js";

// Load user data on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserProfile();
  setupEventListeners();
});

// Load user profile data from API
async function loadUserProfile() {
  try {
    const response = await fetch("/api/staffs/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    const user = data.data?.user || {};

    // Populate form fields
    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("gender").value = user.gender || "";

    if (user.dateOfBirth) {
      const date = new Date(user.dateOfBirth);
      document.getElementById("dateOfBirth").value = date
        .toISOString()
        .split("T")[0];
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    Notification.error("Không thể tải thông tin cá nhân");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching for Profile
  const profileTabBtn = document.getElementById("profileTabBtn");
  const profileTabBtn2 = document.getElementById("profileTabBtn2");
  const passwordTabBtn = document.getElementById("passwordTabBtn");
  const passwordTabBtn2 = document.getElementById("passwordTabBtn2");
  const updateProfileBtn = document.getElementById("updateProfileBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");

  if (profileTabBtn) profileTabBtn.addEventListener("click", showProfileTab);
  if (profileTabBtn2) profileTabBtn2.addEventListener("click", showProfileTab);
  if (passwordTabBtn) passwordTabBtn.addEventListener("click", showPasswordTab);
  if (passwordTabBtn2)
    passwordTabBtn2.addEventListener("click", showPasswordTab);
  if (updateProfileBtn)
    updateProfileBtn.addEventListener("click", handleUpdateProfile);
  if (changePasswordBtn)
    changePasswordBtn.addEventListener("click", handleChangePassword);

  // Clear errors on input focus
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      const errorId = input.id + "Error";
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.classList.add("hidden");
      }
    });
  });
}

// Show Profile Tab
function showProfileTab() {
  const settingsDiv = document.getElementById("settings");
  const changePasswordDiv = document.getElementById("changePasswordSection");

  if (settingsDiv) settingsDiv.classList.remove("hidden");
  if (changePasswordDiv) changePasswordDiv.classList.add("hidden");

  // Update button styles
  const profileTabBtn = document.getElementById("profileTabBtn");
  const passwordTabBtn = document.getElementById("passwordTabBtn");
  const profileTabBtn2 = document.getElementById("profileTabBtn2");
  const passwordTabBtn2 = document.getElementById("passwordTabBtn2");

  if (profileTabBtn) {
    profileTabBtn.classList.remove(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
    profileTabBtn.classList.add("bg-blue-600", "text-white");
  }
  if (passwordTabBtn) {
    passwordTabBtn.classList.remove("bg-green-600", "text-white");
    passwordTabBtn.classList.add(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
  }
  if (profileTabBtn2) {
    profileTabBtn2.classList.remove(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
    profileTabBtn2.classList.add("bg-blue-600", "text-white");
  }
  if (passwordTabBtn2) {
    passwordTabBtn2.classList.remove("bg-green-600", "text-white");
    passwordTabBtn2.classList.add(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
  }
}

// Show Password Tab
function showPasswordTab() {
  const settingsDiv = document.getElementById("settings");
  const changePasswordDiv = document.getElementById("changePasswordSection");

  if (settingsDiv) settingsDiv.classList.add("hidden");
  if (changePasswordDiv) changePasswordDiv.classList.remove("hidden");

  // Update button styles
  const passwordTabBtn = document.getElementById("passwordTabBtn");
  const profileTabBtn = document.getElementById("profileTabBtn");
  const passwordTabBtn2 = document.getElementById("passwordTabBtn2");
  const profileTabBtn2 = document.getElementById("profileTabBtn2");

  if (passwordTabBtn) {
    passwordTabBtn.classList.remove(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
    passwordTabBtn.classList.add("bg-green-600", "text-white");
  }
  if (profileTabBtn) {
    profileTabBtn.classList.remove("bg-blue-600", "text-white");
    profileTabBtn.classList.add(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
  }
  if (passwordTabBtn2) {
    passwordTabBtn2.classList.remove(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
    passwordTabBtn2.classList.add("bg-green-600", "text-white");
  }
  if (profileTabBtn2) {
    profileTabBtn2.classList.remove("bg-blue-600", "text-white");
    profileTabBtn2.classList.add(
      "bg-white",
      "text-gray-700",
      "border",
      "border-gray-300",
      "hover:bg-gray-50"
    );
  }

  // Clear password fields
  clearPasswordForm();
}

// Handle Update Profile
async function handleUpdateProfile() {
  // Clear all errors first
  clearErrors();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const gender = document.getElementById("gender").value;
  const dateOfBirth = document.getElementById("dateOfBirth").value;

  // Validate inputs
  const errors = {};

  if (!fullName) {
    errors.fullName = "Vui lòng nhập họ và tên";
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

  // Display errors if any
  if (Object.keys(errors).length > 0) {
    Object.keys(errors).forEach((key) => {
      const errorElement = document.getElementById(key + "Error");
      if (errorElement) {
        errorElement.textContent = errors[key];
        errorElement.classList.remove("hidden");
      }
    });
    return;
  }

  // Disable button and show loading state
  const button = document.getElementById("updateProfileBtn");
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang lưu...';

  try {
    const response = await fetch("/api/staffs/update-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        gender,
        dateOfBirth,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific field errors from server
      if (data.errors) {
        Object.keys(data.errors).forEach((key) => {
          const errorElement = document.getElementById(key + "Error");
          if (errorElement) {
            errorElement.textContent = data.errors[key];
            errorElement.classList.remove("hidden");
          }
        });
      } else {
        Notification.error(data.message || "Lỗi khi cập nhật thông tin");
      }
      return;
    }

    Notification.success("Cập nhật thông tin thành công!");
  } catch (error) {
    console.error("Error updating profile:", error);
    Notification.error("Đã xảy ra lỗi. Vui lòng thử lại!");
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

// Handle Change Password
async function handleChangePassword() {
  // Clear all errors first
  clearPasswordErrors();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validate inputs
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword = "Vui lòng nhập mật khẩu cũ";
  }

  if (!newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới";
  } else if (newPassword.length < 6) {
    errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  // Display errors if any
  if (Object.keys(errors).length > 0) {
    Object.keys(errors).forEach((key) => {
      const errorElement = document.getElementById(key + "Error");
      if (errorElement) {
        errorElement.textContent = errors[key];
        errorElement.classList.remove("hidden");
      }
    });
    return;
  }

  // Disable button and show loading state
  const button = document.getElementById("changePasswordBtn");
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';

  try {
    const response = await fetch("/api/staffs/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific field errors from server
      if (data.errors) {
        Object.keys(data.errors).forEach((key) => {
          const errorElement = document.getElementById(key + "Error");
          if (errorElement) {
            errorElement.textContent = data.errors[key];
            errorElement.classList.remove("hidden");
          }
        });
      } else {
        Notification.error(data.message || "Lỗi khi đổi mật khẩu");
      }
      return;
    }

    Notification.success("Đổi mật khẩu thành công!");
    clearPasswordForm();
  } catch (error) {
    console.error("Error changing password:", error);
    Notification.error("Đã xảy ra lỗi. Vui lòng thử lại!");
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

// Clear all error messages in profile form
function clearErrors() {
  const errorIds = ["fullNameError", "emailError", "phoneError"];
  errorIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.add("hidden");
      element.textContent = "";
    }
  });
}

// Clear all error messages in password form
function clearPasswordErrors() {
  const errorIds = [
    "currentPasswordError",
    "newPasswordError",
    "confirmPasswordError",
  ];
  errorIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.add("hidden");
      element.textContent = "";
    }
  });
}

// Clear password form
function clearPasswordForm() {
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";
  clearPasswordErrors();
}
