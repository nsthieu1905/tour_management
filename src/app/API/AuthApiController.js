const { User } = require("../models/index");
const jwt = require("jsonwebtoken");

// Hàm tạo access token
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.AUTH_TOKEN_SECRET, {
    expiresIn: process.env.AUTH_TOKEN_EXP,
  });
};

// Hàm tạo refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXP,
  });
};

// API đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email và password là bắt buộc",
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
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

    // So sánh password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    // Cập nhật metadata
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    // Tạo tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Lưu refresh token vào cookie (httpOnly để bảo mật)
    res.cookie(process.env.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    // Trả về response
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: user.toJSON(),
        accessToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// API làm mới access token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies[process.env.REFRESH_TOKEN_NAME];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy refresh token",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Tìm user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra trạng thái
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không còn hoạt động",
      });
    }

    // Tạo access token mới
    const newAccessToken = generateAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Làm mới token thành công",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã hết hạn",
      });
    }

    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// API đăng xuất
exports.logout = async (req, res) => {
  try {
    // Xóa refresh token cookie
    res.clearCookie(process.env.REFRESH_TOKEN_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// API lấy thông tin user hiện tại
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin user",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};
