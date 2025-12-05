// Admin
const siteRoutes = require("./admin/site");
const authRoutes = require("./API/admin/auth");
const toursApiRoutes = require("./API/admin/tours");
const couponApiRoutes = require("./API/admin/coupon");

// Client
const homeRoutes = require("./client/home");
const clientAuthRoutes = require("./client/auth");

function route(app) {
  // Admin
  app.use("/auth", authRoutes);
  app.use("/admin", siteRoutes);
  app.use("/api/tours", toursApiRoutes);
  app.use("/api/coupons", couponApiRoutes);

  // Client
  app.use("/client/auth", clientAuthRoutes);
  app.use("/", homeRoutes);
}

module.exports = route;
