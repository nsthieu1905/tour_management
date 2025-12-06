/**
 * Favorite helper - handles favorite operations
 */
const favoriteHelper = {
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
