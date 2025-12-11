/**
 * Admin Notification System
 * Dành cho admin - thông báo về đơn booking, tours mới, etc
 */

class AdminNotificationManager {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.maxNotifications = 5;
    this.socket = null;
    this.adminId = this.getAdminIdFromDom();
    this.init();
  }

  init() {
    this.createNotificationUI();
    this.attachEventListeners();
    this.updateBadge();

    // Fetch notifications from server immediately on page load
    console.log("📥 [Admin] Fetching notifications from server on init");
    this.fetchNotificationsFromServer();

    this.initializeSocket();
  }

  /**
   * Get admin ID from DOM (from user profile or data attribute)
   */
  getAdminIdFromDom() {
    // Try to get from localStorage or data attribute
    const adminId =
      localStorage.getItem("adminId") ||
      document.body.dataset.adminId ||
      document.querySelector("[data-admin-id]")?.dataset.adminId;
    return adminId || "admin_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize Socket.io connection
   */
  initializeSocket() {
    console.log("🔔 [Admin] Initializing Socket.io connection");

    if (typeof io === "undefined") {
      console.warn("🔔 [Admin] Socket.io not loaded");
      // Fallback to fake notifications if socket.io not available
      this.startFakeNotifications();
      return;
    }

    console.log("🔔 [Admin] Socket.io found, creating connection");
    this.socket = io();

    this.socket.on("connect", () => {
      console.log(
        "🔔 [Admin] Connected to notification server. Socket ID:",
        this.socket.id
      );
      console.log("🔔 [Admin] Emitting admin:join with adminId:", this.adminId);
      this.socket.emit("admin:join", this.adminId);
    });

    // Listen for new notifications
    this.socket.on("notification:new", (notification) => {
      console.log(
        "🔔 [Admin] Received notification:new event with data:",
        notification
      );

      // Deduplication: Check if notification already exists
      const isDuplicate = this.notifications.some((n) => {
        // Check by ID
        if (n.id === notification.id) return true;
        // Check by title + message + timestamp (within 1 second)
        if (
          n.title === notification.title &&
          n.message === notification.message
        ) {
          const timeDiff = Math.abs(
            new Date(n.time) - new Date(notification.time)
          );
          if (timeDiff < 1000) return true; // Within 1 second = duplicate
        }
        return false;
      });

      if (isDuplicate) {
        console.log(
          "⚠️ [Admin] Duplicate notification detected, skipping:",
          notification.id
        );
        return;
      }

      this.addNotification(notification);
    });

    // Listen for read status updates
    this.socket.on("notification:read", (notificationId) => {
      console.log(
        "🔔 [Admin] Received notification:read for ID:",
        notificationId
      );
      const notif = this.notifications.find((n) => n.id === notificationId);
      if (notif) {
        notif.read = true;
      }
    });

    // Listen for delete notifications
    this.socket.on("notification:delete", (notificationId) => {
      console.log(
        "🔔 [Admin] Received notification:delete for ID:",
        notificationId
      );
      this.deleteNotification(notificationId);
    });

    this.socket.on("disconnect", () => {
      console.log("🔔 [Admin] Disconnected from notification server");
    });

    // Catch-all listener for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log("🔔 [Admin] Socket event received:", eventName, args);
    });
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
   * Fetch notifications from server API (admin only)
   */
  async fetchNotificationsFromServer() {
    try {
      console.log("📥 [Admin] Fetching notifications from server");
      const response = await fetch("/api/notifications/admin/all");

      if (!response.ok) {
        console.warn(
          "⚠️ Failed to fetch admin notifications:",
          response.status
        );
        return;
      }

      const data = await response.json();
      const serverNotifications = data.data || data || [];

      console.log(
        "📥 [Admin] Received notifications from server:",
        serverNotifications.length
      );

      // Replace notifications with fresh data from server
      this.notifications = [];
      this.unreadCount = 0;

      serverNotifications.forEach((serverNotif) => {
        this.addNotificationFromServer(serverNotif);
      });

      this.updateBadge();
    } catch (error) {
      console.error(
        "❌ Error fetching admin notifications from server:",
        error
      );
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
    console.log("🔔 [Admin] addNotification called with:", notification);

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

    console.log("🔔 [Admin] Created notification object:", newNotif);

    this.notifications.unshift(newNotif);
    console.log(
      "🔔 [Admin] Added to notifications array. Total count:",
      this.notifications.length
    );

    if (!newNotif.read) {
      this.unreadCount++;
    }
    console.log("🔔 [Admin] Updated unreadCount:", this.unreadCount);

    this.updateBadge();
    console.log("🔔 [Admin] Updated badge");

    this.showToast(newNotif);
    console.log("🔔 [Admin] Called showToast()");
  }

  renderNotifications() {
    const content = document.getElementById("notificationContent");
    const displayNotifications = this.notifications;

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
    displayNotifications.forEach((notif) => {
      const timeStr = this.formatTime(notif.time);
      const unreadClass = notif.read ? "" : "unread";
      // Use iconBg if available, otherwise default to type-based styling
      const avatarClass = notif.iconBg ? notif.iconBg : notif.type;

      html += `
        <div class="notification-item ${unreadClass}" data-id="${notif.id}">
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
        body: JSON.stringify({ userId: "admin" }),
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
        body: JSON.stringify({ userId: "admin" }),
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
    console.log("ℹ️ Notifications stored in database, not localStorage");
  }

  loadNotificationsFromStorage() {
    // No longer loading from localStorage - all data from server
    this.notifications = [];
    this.unreadCount = 0;
  }

  // Fake notifications for demo (DISABLED - Use real notifications from server)
  startFakeNotifications() {
    // Fake notifications disabled - all notifications come from server via Socket.io
    console.log("✅ Admin waiting for real notifications from server...");
    // This method is no longer needed but kept for fallback purposes
  }
}

// Initialize notification manager when DOM is ready
let adminNotificationManager;
document.addEventListener("DOMContentLoaded", () => {
  adminNotificationManager = new AdminNotificationManager();
  // Make it globally accessible for other scripts
  window.adminNotificationManager = adminNotificationManager;
});

// Export for use with Socket.io
if (typeof module !== "undefined" && module.exports) {
  module.exports = AdminNotificationManager;
}
