const { Tour } = require("../../models/index");

const dashboard = (req, res) => {
  res.render("components/dashboard", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

// [GET] /qly-tour
const qlyTour = async (req, res, next) => {
  try {
    const tours = await Tour.find({}).lean();
    res.render("components/qly-tour", {
      tours,
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /qly-tour/trash
const trashTour = async (req, res, next) => {
  try {
    const tours = await Tour.find({}).lean();
    res.render("CRUD/qly-tours/trash-tour", {
      tours,
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    next(error);
  }
};

// [GET] /qly-tour/:id
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

// [DELETE] /qly-tour/:id
const deleteTour = async (req, res, next) => {
  try {
    await Tour.delete({ _id: req.params.id });
    res.redirect("/admin/qly-tour");
  } catch (error) {
    next(error);
  }
};

const bookingTour = (req, res) => {
  res.render("components/booking-tour", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

const qlyNhanVien = (req, res) => {
  res.render("components/qly-nhan-vien", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

const qlyKhachHang = (req, res) => {
  res.render("components/qly-KH", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

const doiTac = (req, res) => {
  res.render("components/doi-tac", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

const thongKe = (req, res) => {
  res.render("components/thong-ke", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

const settings = (req, res) => {
  res.render("components/settings", {
    bodyClass: "bg-gray-50 transition-all duration-300",
  });
};

module.exports = {
  dashboard,
  qlyTour,
  trashTour,
  tourDetail,
  deleteTour,
  bookingTour,
  qlyNhanVien,
  qlyKhachHang,
  doiTac,
  thongKe,
  settings,
};
