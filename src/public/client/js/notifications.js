class ClientNotificationManager {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.maxNotifications = 5;
    this.socket = null;
    this.clientId = this.getClientIdFromDom();
    this.init();
  }

  init() {
    this.createNotificationUI();
    this.attachEventListeners();
    this.updateBadge();
    this.fetchUserIdFromApi();
    this.initializeSocket();
  }

  // Lấy userId từ API server (cho người dùng đã đăng nhập)
  async fetchUserIdFromApi() {
    try {
      const response = await fetch("/api/users/current-user");

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Thử nhiều cách để trích xuất userId
      let userId = null;
      if (data.user && data.user._id) {
        userId = data.user._id;
      } else if (data._id) {
        userId = data._id;
      } else if (data.data && typeof data.data === "object" && data.data._id) {
        userId = data.data._id;
      } else if (
        data.data &&
        typeof data.data === "object" &&
        data.data.user &&
        data.data.user._id
      ) {
        userId = data.data.user._id;
      }

      if (userId) {
        return userId;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // Lấy client ID từ DOM hoặc tạo một ID ngẫu nhiên
  getClientIdFromDom() {
    const clientId =
      localStorage.getItem("clientId") ||
      document.body.dataset.clientId ||
      document.querySelector("[data-client-id]")?.dataset.clientId;
    return clientId || "client_" + Math.random().toString(36).substr(2, 9);
  }

  // Lấy user ID từ DOM
  getUserIdFromDom() {
    const userId =
      document.body.dataset.userId ||
      document.querySelector("[data-user-id]")?.dataset.userId ||
      document.querySelector("[data-user-id]")?.value ||
      localStorage.getItem("userId");

    return userId;
  }

  // Khởi tạo kết nối Socket.io
  initializeSocket() {
    if (typeof io === "undefined") {
      return;
    }

    this.socket = io();

    // Lắng nghe thông báo mới
    this.socket.on("notification:new", (notification) => {
      this.addNotification(notification);
    });

    // Lắng nghe cập nhật trạng thái đã đọc
    this.socket.on("notification:read", (notificationId) => {
      const notif = this.notifications.find((n) => n.id === notificationId);
      if (notif) {
        notif.read = true;
      }
    });

    // Lắng nghe xóa thông báo
    this.socket.on("notification:delete", (notificationId) => {
      this.deleteNotification(notificationId);
    });

    // Xử lý sự kiện kết nối thành công
    this.socket.on("connect", () => {
      // Gửi client:join cho thông báo chung
      this.socket.emit("client:join", this.clientId);

      // Nếu đã đăng nhập, gửi user:join với userId cho thông báo cá nhân
      let userId = this.getUserIdFromDom();
      if (!userId) {
        // Dự phòng: lấy từ API
        this.fetchUserIdFromApi().then((apiUserId) => {
          if (apiUserId) {
            userId = apiUserId;
            this.emitUserJoin(userId);
            this.fetchNotificationsFromServer(userId);
          }
        });
      } else {
        this.emitUserJoin(userId);
        this.fetchNotificationsFromServer(userId);
      }
    });
  }

  // Gửi sự kiện user:join
  emitUserJoin(userId) {
    if (!userId) {
      return;
    }

    this.socket.emit("user:join", userId);
  }

  // Tạo giao diện thông báo
  createNotificationUI() {
    // Overlay
    const overlay = document.createElement("div");
    overlay.className = "notification-overlay";
    overlay.id = "notificationOverlay";
    document.body.appendChild(overlay);

    // Modal
    const modal = document.createElement("div");
    modal.className = "notification-modal";
    modal.id = "notificationModal";
    modal.innerHTML = `
      <div class="notification-modal-wrapper">
        <div class="notification-modal-header">
          <h3>Thông báo</h3>
          <button class="notification-modal-close" id="notificationClose">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="notification-modal-content" id="notificationContent">
          <div class="notification-empty">
            <i class="fas fa-bell"></i>
            <p>Không có thông báo nào</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Gắn các sự kiện
  attachEventListeners() {
    const bellBtn = document.querySelector(".notification-bell-btn");
    const closeBtn = document.getElementById("notificationClose");
    const overlay = document.getElementById("notificationOverlay");

    if (bellBtn) {
      bellBtn.addEventListener("click", () => this.toggleModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    if (overlay) {
      overlay.addEventListener("click", () => this.closeModal());
    }

    // Đóng modal khi click bên ngoài
    document.addEventListener("click", (e) => {
      const modal = document.getElementById("notificationModal");
      const bellBtn = document.querySelector(".notification-bell-btn");
      if (
        modal &&
        modal.classList.contains("active") &&
        !modal.contains(e.target) &&
        !bellBtn.contains(e.target)
      ) {
        this.closeModal();
      }
    });
  }

  // Mở/đóng modal thông báo
  toggleModal() {
    const modal = document.getElementById("notificationModal");
    const overlay = document.getElementById("notificationOverlay");
    const bellBtn = document.querySelector(".notification-bell-btn");

    if (modal.classList.contains("active")) {
      this.closeModal();
    } else {
      modal.classList.add("active");
      overlay.classList.add("active");
      bellBtn.classList.add("active");
      this.renderNotifications();
    }
  }

  // Đóng modal thông báo
  closeModal() {
    const modal = document.getElementById("notificationModal");
    const overlay = document.getElementById("notificationOverlay");
    const bellBtn = document.querySelector(".notification-bell-btn");

    modal.classList.remove("active");
    overlay.classList.remove("active");
    bellBtn.classList.remove("active");
  }

  // Lấy danh sách thông báo từ server để đồng bộ
  async fetchNotificationsFromServer(userId) {
    try {
      const response = await fetch(`/api/notifications/user`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const serverNotifications = data.data || data || [];

      // Gộp với thông báo hiện có, tránh trùng lặp
      serverNotifications.forEach((serverNotif) => {
        const exists = this.notifications.some((n) => n.id === serverNotif._id);
        if (!exists) {
          this.addNotificationFromServer(serverNotif);
        }
      });

      this.updateBadge();
    } catch (error) {
      // Xử lý lỗi im lặng
    }
  }

  // Thêm thông báo từ server database
  addNotificationFromServer(serverNotif) {
    const notification = {
      id: serverNotif._id,
      type: serverNotif.type || "booking",
      icon: serverNotif.icon || "fa-bell",
      iconBg: serverNotif.iconBg || "bg-blue-100",
      title: serverNotif.title,
      message: serverNotif.message,
      time: serverNotif.createdAt
        ? new Date(serverNotif.createdAt)
        : new Date(),
      read: serverNotif.read || false,
      link: serverNotif.link,
    };

    this.notifications.unshift(notification);
    if (!notification.read) {
      this.unreadCount++;
    }
  }

  // Thêm thông báo mới (realtime từ Socket.io)
  addNotification(notification) {
    const newNotif = {
      id: notification.id || `notif-${Date.now()}`,
      type: notification.type || "tour",
      icon: notification.icon || "fa-bell",
      iconBg: notification.iconBg || "bg-blue-100",
      title: notification.title,
      message: notification.message,
      time: new Date(),
      read: notification.read || false,
      link: notification.link,
    };

    this.notifications.unshift(newNotif);

    if (!newNotif.read) {
      this.unreadCount++;
    }

    this.updateBadge();
    this.showToast(newNotif);
  }

  // Hiển thị danh sách thông báo
  renderNotifications() {
    const content = document.getElementById("notificationContent");

    // Sắp xếp thông báo theo thời gian (mới nhất trước)
    const displayNotifications = [...this.notifications].sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeB - timeA;
    });

    if (displayNotifications.length === 0) {
      content.innerHTML = `
        <div class="notification-empty">
          <i class="fas fa-bell"></i>
          <p>Không có thông báo nào</p>
        </div>
      `;
      return;
    }

    let html = "";
    displayNotifications.forEach((notif, index) => {
      const timeStr = this.formatTime(notif.time);
      const unreadClass = notif.read ? "" : "unread";
      const newestClass = index === 0 ? "newest" : "";
      const avatarClass = notif.iconBg ? notif.iconBg : notif.type;

      html += `
        <div class="notification-item ${unreadClass} ${newestClass}" data-id="${
        notif.id
      }">
          ${notif.read ? "" : '<div class="notification-unread-dot"></div>'}
          <div class="notification-avatar ${avatarClass}">
            <i class="fas ${notif.icon}"></i>
          </div>
          <div class="notification-body">
            <p class="notification-title">${notif.title}</p>
            <p class="notification-message">${notif.message}</p>
            <p class="notification-time">${timeStr}</p>
          </div>
          <button class="notification-action-btn" data-id="${notif.id}">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div class="notification-action-menu" data-id="${notif.id}">
            <div class="notification-action-item mark-read" data-id="${
              notif.id
            }">
              <i class="fas ${
                notif.read ? "fa-circle" : "fa-circle-notch"
              }"></i>
              <span>${
                notif.read ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"
              }</span>
            </div>
            <div class="notification-action-item delete" data-id="${notif.id}">
              <i class="fas fa-trash-alt"></i>
              <span>Xoá thông báo</span>
            </div>
          </div>
        </div>
      `;
    });

    content.innerHTML = html;
    this.attachNotificationActions();
  }

  // Gắn sự kiện cho các thao tác trên thông báo
  attachNotificationActions() {
    // Nút thao tác
    document.querySelectorAll(".notification-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const menu = document.querySelector(
          `.notification-action-menu[data-id="${id}"]`
        );

        // Đóng tất cả menu khác
        document
          .querySelectorAll(".notification-action-menu.active")
          .forEach((m) => {
            if (m !== menu) m.classList.remove("active");
          });

        menu?.classList.toggle("active");
      });
    });

    // Đánh dấu đã đọc/chưa đọc
    document.querySelectorAll(".mark-read").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.toggleRead(id);
        this.renderNotifications();
      });
    });

    // Xóa thông báo
    document
      .querySelectorAll(".notification-action-item.delete")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          this.deleteNotification(id);
          this.renderNotifications();
        });
      });

    // Đánh dấu đã đọc khi click vào thông báo
    document.querySelectorAll(".notification-item").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.id;
        const notif = this.notifications.find((n) => n.id === id);
        if (notif && !notif.read) {
          this.toggleRead(id);
          this.renderNotifications();
        }
      });
    });

    // Đóng menu khi click bên ngoài
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-action-btn")) {
        document
          .querySelectorAll(".notification-action-menu.active")
          .forEach((menu) => menu.classList.remove("active"));
      }
    });
  }

  // Chuyển đổi trạng thái đã đọc/chưa đọc
  toggleRead(id) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      // Cập nhật lên server
      fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((err) => {
        // Xử lý lỗi im lặng
      });

      if (notif.read) {
        notif.read = false;
        this.unreadCount++;
      } else {
        notif.read = true;
        this.unreadCount--;
      }
      this.updateBadge();
    }
  }

  // Xóa thông báo
  deleteNotification(id) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index > -1) {
      const notif = this.notifications[index];
      if (!notif.read) {
        this.unreadCount--;
      }
      this.notifications.splice(index, 1);

      // Xóa trên server
      fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((err) => {
        // Xử lý lỗi im lặng
      });

      this.updateBadge();
    }
  }

  // Cập nhật badge số lượng thông báo chưa đọc
  updateBadge() {
    const badge = document.querySelector(".notification-badge");
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? "99+" : this.unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  // Hiển thị toast thông báo
  showToast(notification) {
    const toast = document.createElement("div");
    toast.className = `notification-toast ${notification.type}`;
    toast.innerHTML = `
      <div class="notification-toast-icon">
        <i class="fas ${notification.icon}"></i>
      </div>
      <div class="notification-toast-content">
        <p class="notification-toast-title">${notification.title}</p>
        <p class="notification-toast-message">${notification.message}</p>
      </div>
      <button class="notification-toast-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    document.body.appendChild(toast);

    // Tự động xóa sau 10 giây
    const timeout = setTimeout(() => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    }, 10000);

    // Nút đóng
    toast
      .querySelector(".notification-toast-close")
      .addEventListener("click", () => {
        clearTimeout(timeout);
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
      });

    // Click để mở modal
    toast.addEventListener("click", () => {
      this.toggleModal();
    });
  }

  // Định dạng thời gian hiển thị
  formatTime(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return new Date(date).toLocaleDateString("vi-VN");
  }

  // Không còn sử dụng localStorage - tất cả dữ liệu từ server
  loadNotificationsFromStorage() {
    this.notifications = [];
    this.unreadCount = 0;
  }
}

// Khởi tạo notification manager khi DOM đã sẵn sàng
let clientNotificationManager;
document.addEventListener("DOMContentLoaded", () => {
  clientNotificationManager = new ClientNotificationManager();
});

// Export để sử dụng với Socket.io
if (typeof module !== "undefined" && module.exports) {
  module.exports = ClientNotificationManager;
}
