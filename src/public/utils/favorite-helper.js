/**
 * Favorite helper - handles favorite operations
 */
import { Modal } from "/utils/modal.js";

const favoriteHelper = {
  showLoginRequiredModal: function (redirectUrl) {
    Modal.loginRequired({
      loginUrl: redirectUrl || "/client/auth/login",
    });
  },

  /**
   * Toggle favorite for a tour
   */
  toggleFavorite: async function (tourId) {
    try {
      const response = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ tourId }),
      });

      const data = await response.json();

      if (response.status === 401 && data && data.error === "AUTH_REQUIRED") {
        this.showLoginRequiredModal(data.redirect);
        return {
          success: false,
          authRequired: true,
          redirect: data.redirect,
          message: data.message,
        };
      }

      if (response.ok && data.success) {
        return {
          success: true,
          isFavorited: data.isFavorited,
          message: data.message,
        };
      } else {
        return {
          success: false,
          message: data.message || "Không thể cập nhật danh sách yêu thích",
        };
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      return {
        success: false,
        message: "Lỗi kết nối",
      };
    }
  },

  /**
   * Check if tour is favorited
   */
  checkIsFavorited: async function (tourId) {
    try {
      const response = await fetch(`/api/favorites/check/${tourId}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        return data.isFavorited;
      }
      return false;
    } catch (error) {
      console.error("Check favorite error:", error);
      return false;
    }
  },

  /**
   * Get user's favorite tours
   */
  getUserFavorites: async function () {
    try {
      const response = await fetch("/api/favorites/list", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return data.data.favorites;
      }
      return [];
    } catch (error) {
      console.error("Get favorites error:", error);
      return [];
    }
  },
};

// Make it globally accessible
window.favoriteHelper = favoriteHelper;
