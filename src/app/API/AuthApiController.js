const { User, Session } = require("../models/index");
const jwt = require("jsonwebtoken");
const {
  validateLoginInput,
  validateCredentials,
} = require("../../utils/validators");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.AUTH_TOKEN_SECRET, {
    expiresIn: process.env.AUTH_TOKEN_EXP,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXP,
  });
};

// [POST] auth/login
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate input format
    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Lỗi định dạng",
        errors: validation.errors,
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });

    // So sánh password nếu user tồn tại
    const isPasswordValid = user ? await user.comparePassword(password) : false;

    // Validate credentials (email có tồn tại, password đúng, account status)
    const credentialsValidation = validateCredentials(
      email,
      password,
      user,
      isPasswordValid
    );
    if (!credentialsValidation.isValid) {
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

    // Convert AUTH_TOKEN_EXP to milliseconds for maxAge
    const accessExpiresInStr = process.env.AUTH_TOKEN_EXP;
    let accessMaxAgeMs = 60 * 1000;

    if (accessExpiresInStr.endsWith("s")) {
      accessMaxAgeMs = parseInt(accessExpiresInStr) * 1000;
    } else if (accessExpiresInStr.endsWith("m")) {
      accessMaxAgeMs = parseInt(accessExpiresInStr) * 60 * 1000;
    } else if (accessExpiresInStr.endsWith("h")) {
      accessMaxAgeMs = parseInt(accessExpiresInStr) * 60 * 60 * 1000;
    } else if (accessExpiresInStr.endsWith("d")) {
      accessMaxAgeMs = parseInt(accessExpiresInStr) * 24 * 60 * 60 * 1000;
    }

    // Convert REFRESH_TOKEN_EXP to milliseconds for maxAge
    const refreshExpiresInStr = process.env.REFRESH_TOKEN_EXP;
    let refreshMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

    if (refreshExpiresInStr.endsWith("s")) {
      refreshMaxAgeMs = parseInt(refreshExpiresInStr) * 1000;
    } else if (refreshExpiresInStr.endsWith("m")) {
      refreshMaxAgeMs = parseInt(refreshExpiresInStr) * 60 * 1000;
    } else if (refreshExpiresInStr.endsWith("h")) {
      refreshMaxAgeMs = parseInt(refreshExpiresInStr) * 60 * 60 * 1000;
    } else if (refreshExpiresInStr.endsWith("d")) {
      refreshMaxAgeMs = parseInt(refreshExpiresInStr) * 24 * 60 * 60 * 1000;
    }

    // Lưu access token vào cookie
    const accessCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    // Lưu refresh token vào cookie
    const refreshCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    // Chỉ set maxAge nếu check "remember me" → persistent cookie
    // Nếu không → session cookie (xóa khi tắt browser)
    if (rememberMe) {
      accessCookieOptions.maxAge = accessMaxAgeMs;
      refreshCookieOptions.maxAge = refreshMaxAgeMs;
    }

    res.cookie(process.env.AUTH_TOKEN_NAME, accessToken, accessCookieOptions);
    res.cookie(
      process.env.REFRESH_TOKEN_NAME,
      refreshToken,
      refreshCookieOptions
    );

    // Lưu refresh token vào db
    const expiresAt = new Date(Date.now() + refreshMaxAgeMs);
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";

    const session = await Session.create({
      userId: user._id,
      refreshToken,
      deviceInfo: {
        userAgent,
        ipAddress,
        deviceType: userAgent.includes("Mobile") ? "mobile" : "desktop",
      },
      expiresAt,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      rememberMe: rememberMe,
      data: {
        accessToken,
        user: user.toJSON(),
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

// [POST] auth/refresh
const refreshToken = async (req, res) => {
  try {
    const refreshTokenValue = req.cookies[process.env.REFRESH_TOKEN_NAME];

    if (!refreshTokenValue) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy refresh token",
      });
    }

    // Verify refresh token tồn tại trong DB và còn hoạt động
    const session = await Session.findOne({
      refreshToken: refreshTokenValue,
      isActive: true,
      revokedAt: null,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Verify refresh token signature
    const decoded = jwt.verify(
      refreshTokenValue,
      process.env.REFRESH_TOKEN_SECRET
    );

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

    // Convert AUTH_TOKEN_EXP to milliseconds for maxAge
    const expiresInStr = process.env.AUTH_TOKEN_EXP;
    let maxAgeMs = 60 * 1000;

    if (expiresInStr.endsWith("s")) {
      maxAgeMs = parseInt(expiresInStr) * 1000;
    } else if (expiresInStr.endsWith("m")) {
      maxAgeMs = parseInt(expiresInStr) * 60 * 1000;
    } else if (expiresInStr.endsWith("h")) {
      maxAgeMs = parseInt(expiresInStr) * 60 * 60 * 1000;
    } else if (expiresInStr.endsWith("d")) {
      maxAgeMs = parseInt(expiresInStr) * 24 * 60 * 60 * 1000;
    }

    // Cập nhật access token vào cookie
    res.cookie(process.env.AUTH_TOKEN_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: maxAgeMs,
    });

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

//[POST] auth/logout
const logout = async (req, res) => {
  try {
    const refreshTokenValue = req.cookies[process.env.REFRESH_TOKEN_NAME];

    // Revoked session trong DB
    if (refreshTokenValue) {
      await Session.findOneAndUpdate(
        { refreshToken: refreshTokenValue, isActive: true },
        {
          isActive: false,
          revokedAt: new Date(),
        }
      );
    }

    // Xóa access token cookie
    res.clearCookie(process.env.AUTH_TOKEN_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

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
const getCurrentUser = async (req, res) => {
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

// [POST] auth/check-token
// Check nếu access token hết hạn
const checkToken = (req, res) => {
  try {
    const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "No token",
        expired: true,
      });
    }

    // Verify token - check nếu hết hạn
    try {
      jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);
      return res.status(200).json({
        success: true,
        message: "Token still valid",
        expired: false,
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(200).json({
          success: true,
          message: "Token expired",
          expired: true,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Token invalid",
          expired: true,
        });
      }
    }
  } catch (error) {
    console.error("Check token error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getCurrentUser,
  checkToken,
  generateAccessToken,
  generateRefreshToken,
};
