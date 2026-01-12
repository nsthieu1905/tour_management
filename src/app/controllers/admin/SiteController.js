const toInputDate = (date) => {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const parseDateRange = (req, fallbackStart, fallbackEnd) => {
  const { startDate, endDate } = req.query;

  let start = new Date(fallbackStart);
  start.setHours(0, 0, 0, 0);

  let end = new Date(fallbackEnd);
  end.setHours(23, 59, 59, 999);

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (!Number.isNaN(parsedStart.getTime())) {
      parsedStart.setHours(0, 0, 0, 0);
      start = parsedStart;
    }
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (!Number.isNaN(parsedEnd.getTime())) {
      parsedEnd.setHours(23, 59, 59, 999);
      end = parsedEnd;
    }
  }

  if (start > end) {
    start = new Date(fallbackStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(fallbackEnd);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// [GET] /admin/dashboard
const dashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);

    const { start: rangeStart, end: rangeEnd } = parseDateRange(
      req,
      startOfMonth,
      currentDate
    );
    return res.render("components/dashboard", {
      bodyClass: "bg-gray-50 transition-all duration-300",
      selectedStartDate: toInputDate(rangeStart),
      selectedEndDate: toInputDate(rangeEnd),
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

// [GET] /admin/qly-tour/categories
const qlyTourCategories = async (req, res) => {
  try {
    return res.render("components/qly-tour-categories", {
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

// [GET] /admin/customers/:id
const customerDetail = (req, res) => {
  try {
    return res.render("components/customer-detail", {
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
    return res.render("components/qly-doi-tac", {
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
const thongKe = async (req, res) => {
  try {
    const currentDate = new Date();
    const fallbackEnd = new Date(currentDate);
    fallbackEnd.setHours(23, 59, 59, 999);
    const fallbackStart = new Date(currentDate);
    fallbackStart.setDate(fallbackStart.getDate() - 30);
    fallbackStart.setHours(0, 0, 0, 0);

    const { start: startDate, end: endDate } = parseDateRange(
      req,
      fallbackStart,
      fallbackEnd
    );
    return res.render("components/thong-ke", {
      bodyClass: "bg-gray-50 transition-all duration-300",
      selectedStartDate: toInputDate(startDate),
      selectedEndDate: toInputDate(endDate),
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
// [GET] /admin/qly-coupon
const maGiamGia = (req, res) => {
  try {
    return res.render("components/qly-coupon", {
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

// [GET] /admin/qly-nhan-tin
const qlyNhanTin = (req, res) => {
  try {
    return res.render("components/qly-nhan-tin", {
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
  qlyTourCategories,
  trashTour,
  bookingTour,
  qlyNhanVien,
  qlyKhachHang,
  customerDetail,
  doiTac,
  thongKe,
  settings,
  maGiamGia,
  qlyNhanTin,
};
