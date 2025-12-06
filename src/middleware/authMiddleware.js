const jwt = require("jsonwebtoken");
const { User } = require("../app/models/index");

/**
 * Middleware xác thực token từ cookie hoặc header Authorization
 * Dùng cho API endpoints (ưu tiên cookie)
 */
const authenticateFromCookie = async (req, res, next) => {
  try {
    let token = null;

    // 1. Ưu tiên kiểm tra token từ cookie
    if (req.cookies && req.cookies[process.env.AUTH_TOKEN_NAME]) {
      token = req.cookies[process.env.AUTH_TOKEN_NAME];
    }
    // 2. Nếu không có cookie, kiểm tra header Authorization
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực1",
      });
    }

    const decoded = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn chưa được kích hoạt",
      });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực, vui lòng thử lại sau",
    });
  }
};

/**
 * Middleware xác thực token từ header Authorization
 * Dùng cho API endpoints
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực12",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn chưa được kích hoạt",
      });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực, vui lòng thử lại sau",
    });
  }
};

/**
 * Middleware kiểm tra quyền theo role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa được xác thực",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập tài nguyên này",
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra user có phải chính họ hoặc admin
 */
const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa được xác thực",
    });
  }

  const requestedUserId = req.params.userId || req.params.id;

  if (
    req.user.role === "admin" ||
    req.user.userId.toString() === requestedUserId
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Bạn không có quyền truy cập thông tin này",
  });
};

module.exports = {
  authenticateFromCookie,
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
};
