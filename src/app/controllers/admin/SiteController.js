const { Tour } = require("../../models/index");
// [GET] /admin/dashboard
const dashboard = (req, res) => {
  try {
    res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [GET] /admin/qly-tour
const qlyTour = async (req, res, next) => {
  try {
    res.render("components/qly-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /admin/qly-tour/trash
const trashTour = async (req, res, next) => {
  try {
    res.render("CRUD/qly-tours/trash-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /admin/qly-tour/:id
const tourDetail = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).lean();
    res.render("CRUD/qly-tours/tour-detail", {
      tour,
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /admin/booking-tour
const bookingTour = (req, res) => {
  try {
    res.render("components/booking-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [GET] /admin/qly-nhan-vien
const qlyNhanVien = (req, res) => {
  try {
    res.render("components/qly-nhan-vien", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [GET] /admin/qly-khach-hang
const qlyKhachHang = (req, res) => {
  try {
    res.render("components/qly-KH", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [GET] /admin/doi-tac
const doiTac = (req, res) => {
  try {
    res.render("components/doi-tac", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [GET] /admin/thong-ke
const thongKe = (req, res) => {
  try {
    res.render("components/thong-ke", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// [GET] /admin/settings
const settings = (req, res) => {
  try {
    res.render("components/settings", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
// [GET] /admin/ma-giam-gia
const maGiamGia = (req, res) => {
  try {
    res.render("components/ma-giam-gia", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  dashboard,
  qlyTour,
  trashTour,
  tourDetail,
  bookingTour,
  qlyNhanVien,
  qlyKhachHang,
  doiTac,
  thongKe,
  settings,
  maGiamGia,
};
