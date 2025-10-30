class HomeController {
  home(req, res) {
    res.render("home", {
      bodyClass: "bg-gray-50",
    });
  }
}

module.exports = new HomeController();
