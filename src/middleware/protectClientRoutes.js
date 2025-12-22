const jwt = require("jsonwebtoken");
const { User } = require("../app/models/index");
const { generateAccessToken } = require("../app/API/AuthApiController");

const isApiRequest = (req) => {
  const accept = req.headers.accept || "";
  const contentType = req.headers["content-type"] || "";
  return (
    req.xhr ||
    req.originalUrl.startsWith("/api/") ||
    accept.includes("application/json") ||
    contentType.includes("application/json")
  );
};

const buildClientLoginUrl = (nextUrl) => {
  const safeNext = nextUrl || "/";
  return `/client/auth/login?next=${encodeURIComponent(safeNext)}`;
};

const respondAuthRequired = (req, res) => {
  const nextUrl = isApiRequest(req)
    ? req.headers.referer || "/"
    : req.originalUrl || "/";
  const loginUrl = buildClientLoginUrl(nextUrl);

  if (isApiRequest(req)) {
    return res.status(401).json({
      success: false,
      error: "AUTH_REQUIRED",
      message: "Vui lòng đăng nhập để tiếp tục",
      redirect: loginUrl,
    });
  }

  return res.status(401).render("auth/require-login", {
    layout: false,
    loginUrl,
  });
};

const respondForbidden = (req, res) => {
  if (isApiRequest(req)) {
    return res.status(403).json({
      success: false,
      error: "FORBIDDEN",
      message: "Bạn không đủ quyền truy cập.",
    });
  }

  return res.status(403).render("auth/forbidden", {
    message: "Bạn không đủ quyền truy cập.",
    layout: false,
  });
};

const handleClientAuth = async (req, res, next, { optional } = {}) => {
  try {
    const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];
    const refreshToken = req.cookies[process.env.REFRESH_TOKEN_NAME];

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
          return optional ? next() : respondAuthRequired(req, res);
        }

        if (user.status === "inactive" || user.status === "blocked") {
          return optional ? next() : res.redirect("/");
        }

        req.userId = decoded.userId;
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        };
        return next();
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          if (!refreshToken) {
            return optional ? next() : respondAuthRequired(req, res);
          }

          try {
            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );

            const user = await User.findById(decodedRefresh.userId);
            if (!user) {
              return optional ? next() : respondAuthRequired(req, res);
            }

            if (user.status === "inactive" || user.status === "blocked") {
              return optional ? next() : res.redirect("/");
            }

            const newAccessToken = generateAccessToken(decodedRefresh.userId);

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

            res.cookie(process.env.AUTH_TOKEN_NAME, newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              maxAge: maxAgeMs,
            });

            req.userId = decodedRefresh.userId;
            req.user = {
              userId: user._id,
              email: user.email,
              role: user.role,
              fullName: user.fullName,
            };
            return next();
          } catch (refreshError) {
            return optional ? next() : respondAuthRequired(req, res);
          }
        }

        return optional ? next() : respondAuthRequired(req, res);
      }
    }

    if (!refreshToken) {
      return optional ? next() : respondAuthRequired(req, res);
    }

    try {
      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedRefresh.userId);
      if (!user) {
        return optional ? next() : respondAuthRequired(req, res);
      }

      const newAccessToken = generateAccessToken(decodedRefresh.userId);

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

      res.cookie(process.env.AUTH_TOKEN_NAME, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: maxAgeMs,
      });

      req.userId = decodedRefresh.userId;
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      };
      return next();
    } catch (refreshError) {
      return optional ? next() : respondAuthRequired(req, res);
    }
  } catch (error) {
    return optional ? next() : respondAuthRequired(req, res);
  }
};

const protectClientRoutes = (req, res, next) =>
  handleClientAuth(req, res, next, { optional: false });

protectClientRoutes.optional = (req, res, next) =>
  handleClientAuth(req, res, next, { optional: true });

module.exports = protectClientRoutes;
