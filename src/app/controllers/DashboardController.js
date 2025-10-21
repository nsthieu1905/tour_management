const { Tour } = require("../models/index");

class DashboardController {
  dashboard(req, res) {
    res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  }

  // ==============
  // QUẢN LÝ TOUR
  // ==============

  // [GET] /qly-tour
  async qlyTour(req, res, next) {
    try {
      const tours = await Tour.find({}).lean();
      console.log(tours);
      res.render("components/qly-tour", {
        tours,
        bodyClass: "bg-gray-50 transition-all duration-300",
      });
    } catch (next) {}
  }

  // [POST] /qly-tour/add
  async storeTour(req, res, next) {
    const getTourType = (price) => {
      if (price <= 2000000) return "Tiết kiệm";
      if (price > 2000000 && price <= 4000000) return "Tiêu chuẩn";
      if (price > 4000000 && price <= 7000000) return "Giá tốt";
      return "Cao cấp";
    };
    try {
      const { price, departureDates } = req.body;
      const imagePaths = req.files?.map((f) => `/uploads/${f.filename}`) || [];
      req.body = {
        ...req.body,
        price,
        departureDates: departureDates ? JSON.parse(departureDates) : [],
        images: imagePaths,
        thumbnail: imagePaths[0] || "",
        tourType: getTourType(Number(price)),
      };
      const tour = new Tour(req.body);

      await tour.save();
      res.redirect("/admin/qly-tour");
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  // [GET] /qly-tour/trash
  async trashTour(req, res, next) {
    try {
      const tours = await Tour.find({}).lean();
      res.render("CRUD/trash-tour", {
        tours,
        bodyClass: "bg-gray-50 transition-all duration-300",
      });
    } catch (next) {}
  }

  // [DELETE] /qly-tour/:id
  async deleteTour(req, res, next) {
    try {
      await Tour.delete({ _id: req.params.id });
      res.redirect("/admin/qly-tour");
    } catch (error) {
      next(error);
    }
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
