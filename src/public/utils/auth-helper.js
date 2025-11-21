const logoutHelper = {
  logout: async function () {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/auth/admin";
      }
    } catch (error) {
      console.error("Logout error:", error);

      window.location.href = "/auth/admin";
    }
  },
};

window.logoutHelper = logoutHelper;
