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

    // Test API
    // fetch("/api/notifications/test-api")
    //   .then((r) => r.json())
    //   .then((d) => console.log("[Client] API test response:", d))
    //   .catch((e) => console.error("[Client] API test error:", e));

    // Always fetch userId from API to ensure we get current user
    this.fetchUserIdFromApi();

    this.initializeSocket();
  }

  /**
   * Fallback: Fetch userId from /api/users/current-user API
   */
  async fetchUserIdFromApi() {
    try {
      const response = await fetch("/api/users/current-user");

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Try multiple ways to extract userId
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

  /**
   * Get client ID from DOM (from user profile or data attribute)
   */
  getClientIdFromDom() {
    // Try to get from localStorage or data attribute
    const clientId =
      localStorage.getItem("clientId") ||
      document.body.dataset.clientId ||
      document.querySelector("[data-client-id]")?.dataset.clientId;
    return clientId || "client_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get user ID from DOM (for logged-in users)
   */
  getUserIdFromDom() {
    // Try multiple sources
    const userId =
      document.body.dataset.userId ||
      document.querySelector("[data-user-id]")?.dataset.userId ||
      document.querySelector("[data-user-id]")?.value ||
      localStorage.getItem("userId");

    return userId;
  }

  /**
   * Initialize Socket.io connection
   */
  initializeSocket() {
    if (typeof io === "undefined") {
      // Fallback to fake notifications if socket.io not available
      this.startFakeNotifications();
      return;
    }

    this.socket = io();

    // Set up all listeners BEFORE connect event fires
    // Listen for new notifications
    this.socket.on("notification:new", (notification) => {
      this.addNotification(notification);
    });

    // Listen for read status updates
    this.socket.on("notification:read", (notificationId) => {
      const notif = this.notifications.find((n) => n.id === notificationId);
      if (notif) {
        notif.read = true;
      }
    });

    // Listen for delete notifications
    this.socket.on("notification:delete", (notificationId) => {
      this.deleteNotification(notificationId);
    });

    this.socket.on("disconnect", () => {});

    // Debug: log all socket events
    this.socket.onAny((event, ...args) => {});

    // NOW handle connect event
    this.socket.on("connect", () => {
      // Emit client:join for general notifications
      this.socket.emit("client:join", this.clientId);

      // If logged in, emit user:join with userId for personal notifications
      let userId = this.getUserIdFromDom();
      if (!userId) {
        // Fallback: fetch from API
        this.fetchUserIdFromApi().then((apiUserId) => {
          if (apiUserId) {
            userId = apiUserId;
            this.emitUserJoin(userId);
            // Fetch notifications after getting userId from API
            this.fetchNotificationsFromServer(userId);
          }
        });
      } else {
        this.emitUserJoin(userId);
        // Fetch notifications from server to catch any that were missed
        this.fetchNotificationsFromServer(userId);
      }
    });
  }

  /**
   * Helper to emit user:join
   */
  emitUserJoin(userId) {
    if (!userId) {
      return;
    }

    this.socket.emit("user:join", userId);
  }

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

    // Close modal when clicking outside
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

  closeModal() {
    const modal = document.getElementById("notificationModal");
    const overlay = document.getElementById("notificationOverlay");
    const bellBtn = document.querySelector(".notification-bell-btn");

    modal.classList.remove("active");
    overlay.classList.remove("active");
    bellBtn.classList.remove("active");
  }

  /**
   * Fetch notifications from server API to catch any missed realtime updates
   */
  async fetchNotificationsFromServer(userId) {
    try {
      const response = await fetch(`/api/notifications/user`);

      if (!response.ok) {
        const errorText = await response.text();
        return;
      }

      const data = await response.json();

      const serverNotifications = data.data || data || [];

      // Merge with existing notifications, avoiding duplicates
      serverNotifications.forEach((serverNotif) => {
        // Check if notification already exists
        const exists = this.notifications.some((n) => n.id === serverNotif._id);
        if (!exists) {
          this.addNotificationFromServer(serverNotif);
        }
      });

      this.updateBadge();
    } catch (error) {
      console.error("Error fetching notifications from server:", error);
    }
  }

  /**
   * Add notification fetched from server database
   */
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

  addNotification(notification) {
    // Cấu trúc: { id, type, icon, title, message, time, read }
    const newNotif = {
      id: notification.id || `notif-${Date.now()}`,
      type: notification.type || "tour", // tour, booking, promotion, alert
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

  renderNotifications() {
    const content = document.getElementById("notificationContent");
    // Sort notifications by time (newest first)
    const displayNotifications = [...this.notifications].sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeB - timeA; // Newest first
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
      const newestClass = index === 0 ? "newest" : ""; // Highlight the newest
      // Use iconBg if available, otherwise default to type-based styling
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

  attachNotificationActions() {
    // Action button click
    document.querySelectorAll(".notification-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const menu = document.querySelector(
          `.notification-action-menu[data-id="${id}"]`
        );

        // Close all other menus
        document
          .querySelectorAll(".notification-action-menu.active")
          .forEach((m) => {
            if (m !== menu) m.classList.remove("active");
          });

        menu?.classList.toggle("active");
      });
    });

    // Mark as read
    document.querySelectorAll(".mark-read").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.toggleRead(id);
        this.renderNotifications();
      });
    });

    // Delete
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

    // Mark as read when clicking notification
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

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-action-btn")) {
        document
          .querySelectorAll(".notification-action-menu.active")
          .forEach((menu) => menu.classList.remove("active"));
      }
    });
  }

  toggleRead(id) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      // Update server
      fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((err) => console.error("Error marking as read:", err));

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

  deleteNotification(id) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index > -1) {
      const notif = this.notifications[index];
      if (!notif.read) {
        this.unreadCount--;
      }
      this.notifications.splice(index, 1);

      // Delete from server
      fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((err) => console.error("Error deleting notification:", err));

      this.updateBadge();
    }
  }

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

    // Auto remove after 10 seconds
    const timeout = setTimeout(() => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    }, 10000);

    // Close button
    toast
      .querySelector(".notification-toast-close")
      .addEventListener("click", () => {
        clearTimeout(timeout);
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
      });

    // Click to open modal
    toast.addEventListener("click", () => {
      this.toggleModal();
    });
  }

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

  saveNotificationsToStorage() {
    // No longer saving to localStorage - all data from server
    console.log("Notifications stored in database, not localStorage");
  }

  loadNotificationsFromStorage() {
    // No longer loading from localStorage - all data from server
    this.notifications = [];
    this.unreadCount = 0;
  }

  // Fake notifications for demo (DISABLED - Use real notifications from server)
  startFakeNotifications() {
    // Fake notifications disabled - all notifications come from server via Socket.io
    console.log("Waiting for real notifications from server...");
    // This method is no longer needed but kept for fallback purposes
  }
}

// Initialize notification manager when DOM is ready
let clientNotificationManager;
document.addEventListener("DOMContentLoaded", () => {
  clientNotificationManager = new ClientNotificationManager();
});

// Export for use with Socket.io
if (typeof module !== "undefined" && module.exports) {
  module.exports = ClientNotificationManager;
}
