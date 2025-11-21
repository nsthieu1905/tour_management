/**
 * Middleware để bảo vệ các route admin
 * - Verify access_token từ cookie
 * - Nếu access_token hết hạn nhưng refresh_token còn hạn → tạo access_token mới
 * - Nếu không có refresh_token hoặc hết hạn → redirect login
 */

const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../app/API/AuthApiController");

const protectAdminRoutes = (req, res, next) => {
  try {
    const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];
    const refreshToken = req.cookies[process.env.REFRESH_TOKEN_NAME];

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);
        req.userId = decoded.userId;
        return next();
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          // Access token hết hạn, cố refresh
          if (!refreshToken) {
            return res.redirect("/auth/admin");
          }

          try {
            // Refresh token còn hạn?
            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );

            const newAccessToken = generateAccessToken(decodedRefresh.userId);

            // Tính maxAge từ AUTH_TOKEN_EXP
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

            // Set cookie mới
            res.cookie(process.env.AUTH_TOKEN_NAME, newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              maxAge: maxAgeMs,
            });

            req.userId = decodedRefresh.userId;
            return next();
          } catch (refreshError) {
            return res.redirect("/auth/admin");
          }
        } else {
          return res.redirect("/auth/admin");
        }
      }
    } else {
      // Không có access token
      if (!refreshToken) {
        return res.redirect("/auth/admin");
      }

      try {
        // Có refresh token nhưng không có access token
        // Tạo access token mới từ refresh token
        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

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
        return next();
      } catch (refreshError) {
        return res.redirect("/auth/admin");
      }
    }
  } catch (error) {
    return res.redirect("/auth/admin");
  }
};

module.exports = protectAdminRoutes;
