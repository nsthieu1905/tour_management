// [GET] /admin/dashboard
const dashboard = (req, res) => {
  try {
    return res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-tour
const qlyTour = async (req, res) => {
  try {
    return res.render("components/qly-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-tour/trash
const trashTour = async (req, res) => {
  try {
    return res.render("CRUD/qly-tours/trash-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/booking-tour
const bookingTour = (req, res) => {
  try {
    return res.render("components/booking-tour", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-nhan-vien
const qlyNhanVien = (req, res) => {
  try {
    return res.render("components/qly-nhan-vien", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/qly-khach-hang
const qlyKhachHang = (req, res) => {
  try {
    return res.render("components/qly-KH", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/doi-tac
const doiTac = (req, res) => {
  try {
    return res.render("components/doi-tac", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/thong-ke
const thongKe = (req, res) => {
  try {
    return res.render("components/thong-ke", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /admin/settings
const settings = (req, res) => {
  try {
    return res.render("components/settings", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};
// [GET] /admin/ma-giam-gia
const maGiamGia = (req, res) => {
  try {
    return res.render("components/ma-giam-gia", {
      bodyClass: "bg-gray-50 transition-all duration-300",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  dashboard,
  qlyTour,
  trashTour,
  bookingTour,
  qlyNhanVien,
  qlyKhachHang,
  doiTac,
  thongKe,
  settings,
  maGiamGia,
};
