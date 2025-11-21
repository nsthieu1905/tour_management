const jwt = require("jsonwebtoken");

// [GET] /auth/login
const login = (req, res) => {
  const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];

  if (accessToken) {
    try {
      jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);
      return res.redirect("/admin/qly-tour");
    } catch (error) {
      // Token không hợp lệ, cho phép đăng nhập lại
    }
  }

  res.render("auth/login", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

// [GET] /auth/register
const register = (req, res) => {
  res.render("auth/register", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

module.exports = {
  login,
  register,
};
