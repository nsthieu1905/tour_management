const clientAuthHelper = {
  // login: async function (username, password, rememberMe = false) {
  //   try {
  //     const response = await fetch("/auth/client-login", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //       body: JSON.stringify({
  //         username,
  //         password,
  //         rememberMe,
  //       }),
  //     });

  //     const data = await response.json();

  //     // Login success - redirect to home
  //     if (response.ok && data.success) {
  //       window.location.href = "/";
  //       return { success: true, data };
  //     } else {
  //       return {
  //         success: false,
  //         message: data.message || "Đăng nhập thất bại",
  //         errors: data.errors || {},
  //       };
  //     }
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     return {
  //       success: false,
  //       message: "Lỗi kết nối, vui lòng thử lại",
  //     };
  //   }
  // },

  // register: async function (
  //   fullName,
  //   username,
  //   phone,
  //   password,
  //   passwordConfirm
  // ) {
  //   try {
  //     const response = await fetch("/auth/register", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       credentials: "include",
  //       body: JSON.stringify({
  //         fullName,
  //         username,
  //         phone,
  //         password,
  //         passwordConfirm,
  //       }),
  //     });

  //     const data = await response.json();

  //     // Registration success - auto login and redirect
  //     if (response.ok && data.success) {
  //       return {
  //         success: true,
  //         message: data.message,
  //         data,
  //       };
  //     } else {
  //       return {
  //         success: false,
  //         message: data.message || "Đăng ký thất bại",
  //         errors: data.errors || {},
  //       };
  //     }
  //   } catch (error) {
  //     console.error("Register error:", error);
  //     return {
  //       success: false,
  //       message: "Lỗi kết nối, vui lòng thử lại",
  //     };
  //   }
  // },

  logout: async function () {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  },

  getCurrentUser: async function () {
    try {
      const response = await fetch("/api/users/current-user", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.user;
      }
      return null;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  isLoggedIn: async function () {
    try {
      const response = await fetch("/auth/check-token", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      return data.success && !data.expired;
    } catch (error) {
      console.error("Check login error:", error);
      return false;
    }
  },
};

window.clientAuthHelper = clientAuthHelper;
