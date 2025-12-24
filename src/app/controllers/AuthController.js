const jwt = require("jsonwebtoken");

// [GET] /auth/admin
const login = (req, res) => {
  const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];

  if (accessToken) {
    try {
      jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);
      return res.redirect("/admin/qly-tour");
    } catch (error) {
      console.error(error);
    }
  }

  res.render("auth/login", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

// [GET] /customer/auth/login
const cusLogin = (req, res) => {
  const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];
  const nextUrl = req.query.next;

  if (accessToken) {
    try {
      jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);
      if (nextUrl) {
        return res.redirect(nextUrl);
      }
      return res.redirect("/");
    } catch (error) {
      console.error(error);
    }
  }

  res.render("auth/login-customer", {
    bodyClass: "bg-gray-50 transition-all duration-300",
    layout: false,
  });
};

// [GET] /customer/auth/register
const cusRegister = (req, res) => {
  res.render("auth/register", {
    bodyClass: "bg-gray-50 transition-all duration-300",
    layout: false,
  });
};

module.exports = {
  login,
  cusLogin,
  cusRegister,
};
