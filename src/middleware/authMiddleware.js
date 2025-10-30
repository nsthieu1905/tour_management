const jwt = require("jsonwebtoken");
const { User } = require("../app/models/index");

// Middleware xác thực token
exports.authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.AUTH_TOKEN_SECRET);

    // Tìm user
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

    // Gán thông tin user vào req
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

// Middleware kiểm tra quyền theo role
exports.authorize = (...allowedRoles) => {
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

// Middleware kiểm tra user có phải chính họ hoặc admin
exports.authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa được xác thực",
    });
  }

  const requestedUserId = req.params.userId || req.params.id;

  // Cho phép admin hoặc chính user đó
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
