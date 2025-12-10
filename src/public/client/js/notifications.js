/**
 * Client Notification System
 * Dành cho khách hàng - thông báo về tour mới và cập nhật
 */

class ClientNotificationManager {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.maxNotifications = 5;
    this.init();
  }

  init() {
    this.createNotificationUI();
    this.attachEventListeners();
    this.loadNotificationsFromStorage();
    this.updateBadge();
    this.startFakeNotifications(); // Fake notifications for demo
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

  addNotification(notification) {
    // Cấu trúc: { id, type, icon, title, message, time, read }
    const newNotif = {
      id: `notif-${Date.now()}`,
      type: notification.type || "tour", // tour, booking, promotion, alert
      icon: notification.icon || "fa-bell",
      title: notification.title,
      message: notification.message,
      time: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotif);
    this.unreadCount++;
    this.updateBadge();
    this.saveNotificationsToStorage();
    this.showToast(newNotif);
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
      const avatarType = notif.type;

      html += `
        <div class="notification-item ${unreadClass}" data-id="${notif.id}">
          ${notif.read ? "" : '<div class="notification-unread-dot"></div>'}
          <div class="notification-avatar ${avatarType}">
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
      if (notif.read) {
        notif.read = false;
        this.unreadCount++;
      } else {
        notif.read = true;
        this.unreadCount--;
      }
      this.updateBadge();
      this.saveNotificationsToStorage();
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
      this.updateBadge();
      this.saveNotificationsToStorage();
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
    localStorage.setItem(
      "clientNotifications",
      JSON.stringify(this.notifications)
    );
  }

  loadNotificationsFromStorage() {
    const stored = localStorage.getItem("clientNotifications");
    if (stored) {
      this.notifications = JSON.parse(stored);
      this.unreadCount = this.notifications.filter((n) => !n.read).length;
    }
  }

  // Fake notifications for demo
  startFakeNotifications() {
    const fakeData = [
      {
        type: "tour",
        icon: "fa-map",
        title: "Tour mới: Đà Lạt 3 ngày 2 đêm",
        message:
          "Tận hưởng không khí lạnh mát tại thành phố ngàn hoa với giá chỉ từ 2.500.000 VND",
      },
      {
        type: "tour",
        icon: "fa-map",
        title: "Tour Hot: Hạ Long - Cát Bà 2 ngày",
        message:
          "Khám phá vịnh Hạ Long kỳ bí, đảo Cát Bà xinh đẹp. Mua ngay, tặng voucher 500k",
      },
      {
        type: "promotion",
        icon: "fa-tag",
        title: "Khuyến mại tháng 12",
        message: "Giảm 30% tất cả tour nước ngoài. Áp dụng từ 1/12 đến 31/12",
      },
      {
        type: "tour",
        icon: "fa-map",
        title: "Tour mới: Phuket 4 ngày 3 đêm",
        message:
          "Biển xanh, cát trắng, chủng môn tuyệt vời. Giá từ 5.500.000 VND",
      },
      {
        type: "booking",
        icon: "fa-calendar",
        title: "Đơn booking của bạn được xác nhận",
        message:
          "Tour Nha Trang - Ninh Chữ đã được xác nhận. Vui lòng thanh toán trước ngày 25/12",
      },
      {
        type: "tour",
        icon: "fa-map",
        title: "Tour flash sale: Maldives 7 ngày",
        message: "Giá sốc chỉ có hôm nay. Từ 15.000.000 VND. Còn 5 chỗ thôi!",
      },
      {
        type: "promotion",
        icon: "fa-tag",
        title: "Coupon 20% cho khách VIP",
        message: "Bạn được tặng coupon 20% cho tất cả tour. Mã: VIP2024",
      },
      {
        type: "tour",
        icon: "fa-map",
        title: "Tour mới: Sapa 3 ngày giảm 40%",
        message: "Khám phá vẻ đẹp núi rừng, gặp gỡ đồng bào dân tộc thiểu số",
      },
      {
        type: "booking",
        icon: "fa-calendar",
        title: "Đơn hoàn tiền của bạn đã được duyệt",
        message:
          "Số tiền 8.000.000 VND sẽ được chuyển vào tài khoản trong 3-5 ngày",
      },
      {
        type: "promotion",
        icon: "fa-tag",
        title: "Bạn bè giới thiệu - Nhận 300k",
        message: "Mời bạn bè đặt tour, bạn sẽ nhận 300k mỗi lần",
      },
    ];

    let index = 0;
    setInterval(() => {
      if (index < fakeData.length) {
        this.addNotification(fakeData[index]);
        index++;
      }
    }, 10000); // 10 giây một cái (để test nhanh)
  }
}

// Initialize notification manager when DOM is ready
let clientNotificationManager;
document.addEventListener("DOMContentLoaded", () => {
  clientNotificationManager = new ClientNotificationManager();
});

// Export for use with Socket.io later
if (typeof module !== "undefined" && module.exports) {
  module.exports = ClientNotificationManager;
}
