class DashboardController {
  dashboard(req, res) {
    res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  qlyTour(req, res) {
    res.render("components/qly-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  bookingTour(req, res) {
    res.render("components/booking-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  qlyNhanVien(req, res) {
    res.render("components/qly-nhan-vien", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  qlyKhachHang(req, res) {
    res.render("components/qly-KH", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  doiTac(req, res) {
    res.render("components/doi-tac", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  thongKe(req, res) {
    res.render("components/thong-ke", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
  settings(req, res) {
    res.render("components/settings", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }
}

module.exports = new DashboardController();
