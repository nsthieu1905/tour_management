// ===========================
// CONFIRM THÔNG BÁO
// ===========================
const Modal = {
  // Modal xác nhận
  confirm({
    title = "Xác nhận",
    message = "Bạn có chắc chắn?",
    icon = "fa-exclamation-triangle",
    iconColor = "red",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    confirmColor = "red",
    onConfirm = () => {},
    onCancel = () => {},
  }) {
    const modal = document.createElement("div");
    modal.id = "reusable-modal";
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50";

    const colorClasses = {
      red: {
        bg: "bg-red-100",
        text: "text-red-600",
        btn: "bg-red-500 hover:bg-red-600",
      },
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        btn: "bg-blue-500 hover:bg-blue-600",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        btn: "bg-green-500 hover:bg-green-600",
      },
      yellow: {
        bg: "bg-yellow-100",
        text: "text-yellow-600",
        btn: "bg-yellow-500 hover:bg-yellow-600",
      },
    };

    const colors = colorClasses[iconColor] || colorClasses.red;
    const btnColors = colorClasses[confirmColor] || colorClasses.red;

    modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 mt-20 animate-fade-in">
      <div class="p-6">
        <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 ${colors.bg} rounded-full">
          <i class="fas ${icon} text-3xl ${colors.text}"></i>
        </div>
        <h3 class="text-xl font-bold text-center text-gray-800 mb-2">${title}</h3>
        <div class="text-gray-600 text-center mb-6">${message}</div>
        <div class="flex space-x-3">
          <button
            id="modal-cancel-btn"
            class="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <i class="fas fa-times mr-2"></i>${cancelText}
          </button>
          <button
            id="modal-confirm-btn"
            class="flex-1 px-4 py-3 ${btnColors.btn} text-white rounded-lg transition-colors font-medium"
          >
            <i class="fas fa-check mr-2"></i>${confirmText}
          </button>
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    const cancelBtn = document.getElementById("modal-cancel-btn");
    const confirmBtn = document.getElementById("modal-confirm-btn");

    cancelBtn.onclick = () => {
      this.close();
      onCancel();
    };

    confirmBtn.onclick = async () => {
      confirmBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...';
      confirmBtn.disabled = true;
      try {
        await onConfirm();
        this.close();
      } catch (err) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<i class="fas fa-check mr-2"></i>${confirmText}`;
      }
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        this.close();
        onCancel();
      }
    };

    const keyHandler = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmBtn.click();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelBtn.click();
      }
    };

    document.addEventListener("keydown", keyHandler);

    // Khi modal đóng, xoá event listener để tránh rò rỉ
    this._keyHandler = keyHandler;
  },

  loginRequired({
    loginUrl = "/customer/auth/login",
    message = "Vui lòng đăng nhập để tiếp tục",
    onCancel = () => {},
  } = {}) {
    this.confirm({
      title: "Thông báo",
      message,
      icon: "fa-info-circle",
      iconColor: "blue",
      confirmText: "OK",
      cancelText: "Hủy",
      confirmColor: "blue",
      onConfirm: () => {
        window.location.href = loginUrl;
      },
      onCancel,
    });
  },

  close() {
    const modal = document.getElementById("reusable-modal");
    if (modal) modal.remove();
    if (this._keyHandler) {
      document.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  },

  // Modal thông báo chỉ có 1 nút OK
  alert({
    title = "Thông báo",
    message = "",
    icon = "fa-info-circle",
    iconColor = "blue",
    buttonText = "OK",
    onClose = () => {},
  }) {
    const modal = document.createElement("div");
    modal.id = "reusable-modal";
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50";

    const colorClasses = {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        btn: "bg-blue-500 hover:bg-blue-600",
      },
      red: {
        bg: "bg-red-100",
        text: "text-red-600",
        btn: "bg-red-500 hover:bg-red-600",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        btn: "bg-green-500 hover:bg-green-600",
      },
      yellow: {
        bg: "bg-yellow-100",
        text: "text-yellow-600",
        btn: "bg-yellow-500 hover:bg-yellow-600",
      },
    };

    const colors = colorClasses[iconColor] || colorClasses.blue;

    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 mt-20 animate-fade-in">
        <div class="p-6">
          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 ${colors.bg} rounded-full">
            <i class="fas ${icon} text-3xl ${colors.text}"></i>
          </div>
          <h3 class="text-xl font-bold text-center text-gray-800 mb-2">${title}</h3>
          <div class="text-gray-600 text-center mb-6">${message}</div>
          <div class="flex justify-center">
            <button
              id="modal-ok-btn"
              class="px-6 py-3 ${colors.btn} text-white rounded-lg transition-colors font-medium"
            >
              <i class="fas fa-check mr-2"></i>${buttonText}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Chỉ có một nút OK
    document.getElementById("modal-ok-btn").onclick = () => {
      this.close();
      onClose();
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        this.close();
        onClose();
      }
    };

    const keyHandler = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmBtn.click();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelBtn.click();
      }
    };

    document.addEventListener("keydown", keyHandler);

    // Khi modal đóng, xoá event listener để tránh rò rỉ
    this._keyHandler = keyHandler;
  },
};

// ===========================
// TOAST
// ===========================
const Notification = {
  show(message, type = "success", duration = 3000) {
    const configs = {
      success: { bg: "bg-green-500", icon: "fa-check-circle" },
      error: { bg: "bg-red-500", icon: "fa-times-circle" },
      warning: { bg: "bg-yellow-500", icon: "fa-exclamation-triangle" },
      info: { bg: "bg-blue-500", icon: "fa-info-circle" },
    };

    const config = configs[type] || configs.success;

    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      container.className =
        "fixed top-4 right-4 flex flex-col items-end space-y-3 z-50";
      document.body.appendChild(container);
    }

    const notification = document.createElement("div");
    notification.className = `px-6 py-4 rounded-lg shadow-lg animate-slide-in ${config.bg} text-white w-max max-w-sm`;
    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas ${config.icon} mr-3"></i>
          <span>${message}</span>
        </div>
        <button class="ml-4 hover:opacity-75 focus:outline-none transition-opacity" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times text-lg"></i>
        </button>
      </div>
    `;

    container.appendChild(notification);

    const timeoutId = setTimeout(() => {
      notification.style.animation = "slide-out 0.3s ease-out forwards";
      setTimeout(() => notification.remove(), 300);
    }, duration);

    notification.querySelector("button").addEventListener("click", () => {
      clearTimeout(timeoutId);
      notification.style.animation = "slide-out 0.3s ease-out forwards";
      setTimeout(() => notification.remove(), 300);
    });
  },

  success(message, duration) {
    this.show(message, "success", duration);
  },

  error(message, duration) {
    this.show(message, "error", duration);
  },

  warning(message, duration) {
    this.show(message, "warning", duration);
  },

  info(message, duration) {
    this.show(message, "info", duration);
  },
};

export { Modal, Notification };
