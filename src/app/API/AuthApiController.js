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
const adminLogin = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validate input format
    const validation = validateLoginInput(username, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Lỗi định dạng",
        errors: validation.errors,
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email: username });

    // So sánh password nếu user tồn tại
    const isPasswordValid = user ? await user.comparePassword(password) : false;

    // Validate credentials (email có tồn tại, password đúng, account status)
    const credentialsValidation = validateCredentials(
      username,
      password,
      user,
      isPasswordValid
    );
    if (!credentialsValidation.isValid) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản này không có quyền truy cập hệ thống quản trị.",
        error: "INVALID_ROLE",
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === "inactive" || user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khoá",
        error: "ACCOUNT_LOCKED",
      });
    }

    // Cập nhật metadata
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    // Tạo tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Tính maxAge từ AUTH_TOKEN_EXP
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

    // Tính maxAge từ REFRESH_TOKEN_EXP
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

    // Chỉ set maxAge nếu check "remember me" -> persistent cookie
    // Nếu không -> session cookie (xóa khi tắt browser)
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
    console.error("Admin Api login error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [POST] auth/client-login
const clientLogin = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validate input format
    const validation = validateLoginInput(username, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Lỗi định dạng",
        errors: validation.errors,
      });
    }

    const user = await User.findOne({ email: username });

    // So sánh password nếu user tồn tại
    const isPasswordValid = user ? await user.comparePassword(password) : false;

    const credentialsValidation = validateCredentials(
      username,
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

    // Kiểm tra trạng thái tài khoản
    if (user.status === "inactive" || user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khoá",
        error: "ACCOUNT_LOCKED",
      });
    }

    // Cập nhật metadata
    user.metadata.lastLogin = new Date();
    user.metadata.loginCount += 1;
    await user.save();

    // Tạo tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Tính maxAge từ AUTH_TOKEN_EXP
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

    // Tính maxAge từ REFRESH_TOKEN_EXP
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

    // Chỉ set maxAge nếu check "remember me" -> persistent cookie
    // Nếu không -> session cookie (xóa khi tắt browser)
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
    console.error("Client login error:", error);
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

    console.error(error);
    console.error("Client refresh token error:", error);
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

// [POST] auth/check-token
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
        message: "Token còn hạn",
        expired: false,
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(200).json({
          success: true,
          message: "Token hết hạn",
          expired: true,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ",
          expired: true,
        });
      }
    }
  } catch (error) {
    console.error("Check token error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [POST] auth/register
const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, passwordConfirm } = req.body;

    // Validate required fields
    const errors = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Vui số nhập tên người dùng";
    }

    if (!email) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ (vd: user@example.com)";
    }

    if (!phone) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(?:\+84|0|84)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    }

    // Nếu có lỗi validation, trả về ngay
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
        errors: errors,
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được đăng ký",
        errors: {
          email: "Email đã được đăng ký",
        },
      });
    }

    // Tạo user mới với role mặc định là 'customer'
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      password: password,
      role: "customer",
      status: "active",
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      data: {
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [POST] admin/add-staff
const addAdmin = async (req, res) => {
  try {
    const { fullName, email, phone, password, passwordConfirm } = req.body;

    // Validate required fields
    const errors = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.fullName = "Vui lòng nhập tên nhân viên";
    }

    if (!email) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ (vd: user@example.com)";
    }

    if (!phone) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^(?:\+84|0|84)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }

    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải tối thiểu 6 ký tự";
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Mật khẩu xác nhận không khớp";
    }

    // Nếu có lỗi validation, trả về ngay
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
        errors: errors,
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã được đăng ký",
        errors: {
          email: "Email đã được đăng ký",
        },
      });
    }

    // Tạo user mới với role mặc định là 'admin'
    const newAdmin = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      password: password,
      role: "admin",
      status: "active",
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: "Thêm nhân viên thành công!",
      data: {
        user: {
          id: newAdmin._id,
          fullName: newAdmin.fullName,
          email: newAdmin.email,
          phone: newAdmin.phone,
          role: newAdmin.role,
          status: newAdmin.status,
        },
      },
    });
  } catch (error) {
    console.error("Add admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  adminLogin,
  clientLogin,
  register,
  addAdmin,
  refreshToken,
  logout,
  checkToken,
  generateAccessToken,
  generateRefreshToken,
};
