// - Verify access_token từ cookie
//  - Nếu access_token hết hạn nhưng refresh_token còn hạn -> tạo access_token mới
// - Nếu không có refresh_token hoặc hết hạn -> redirect login
// - Kiểm tra role = 'admin', nếu không là admin -> không đủ quyền/ redirect forbidden

const jwt = require("jsonwebtoken");
const { User } = require("../app/models/index");
const { generateAccessToken } = require("../app/API/AuthApiController");

const protectAdminRoutes = async (req, res, next) => {
  try {
    const accessToken = req.cookies[process.env.AUTH_TOKEN_NAME];
    const refreshToken = req.cookies[process.env.REFRESH_TOKEN_NAME];

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.AUTH_TOKEN_SECRET);

        const user = await User.findById(decoded.userId);
        // Kiểm tra user có role admin hay không
        if (!user) {
          return res.redirect("/auth/admin");
        }

        if (user.role !== "admin") {
          return res.status(403).render("auth/forbidden", {
            message: "Bạn không đủ quyền truy cập.",
            layout: false,
          });
        }

        // Kiểm tra trạng thái tài khoản
        if (user.status === "inactive" || user.status === "blocked") {
          return res.redirect("/auth/admin");
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
          // Access token hết hạn, cố refresh
          if (!refreshToken) {
            return res.redirect("/auth/admin");
          }

          try {
            // Refresh token còn hạn
            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
            );

            const user = await User.findById(decodedRefresh.userId);
            if (!user) {
              return res.redirect("/auth/admin");
            }

            if (user.role !== "admin") {
              return res.status(403).render("auth/forbidden", {
                message: "Bạn không đủ quyền truy cập.",
                layout: false,
              });
            }

            // Kiểm tra trạng thái tài khoản
            if (user.status === "inactive" || user.status === "blocked") {
              return res.redirect("/auth/admin");
            }

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
            req.user = {
              userId: user._id,
              email: user.email,
              role: user.role,
              fullName: user.fullName,
            };
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

        const user = await User.findById(decodedRefresh.userId);
        if (!user) {
          return res.redirect("/auth/admin");
        }

        if (user.role !== "admin") {
          return res.status(403).render("auth/forbidden", {
            message: "Bạn không đủ quyền truy cập.",
            layout: false,
          });
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
        return res.redirect("/auth/admin");
      }
    }
  } catch (error) {
    return res.redirect("/auth/admin");
  }
};

module.exports = protectAdminRoutes;
