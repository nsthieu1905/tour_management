class AuthController {
  login(req, res) {
    res.render("auth/login", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }

  register(req, res) {
    res.render("auth/register", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
}

module.exports = new AuthController();
