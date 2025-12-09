// Admin
const siteRoutes = require("./admin/site");
const authRoutes = require("./admin/auth");
const toursApiRoutes = require("./admin/tours");
const couponApiRoutes = require("./admin/coupon");
const usersApiRoutes = require("./admin/users");
const adminBookingRoutes = require("./admin/bookings");

// Client
const homeRoutes = require("./client/home");
const clientAuthRoutes = require("./client/auth");
const favoriteRoutes = require("./client/favorites");
const bookingRoutes = require("./client/bookings");

function route(app) {
  // Admin
  app.use("/auth", authRoutes);
  app.use("/admin", siteRoutes);
  app.use("/api/tours", toursApiRoutes);
  app.use("/api/coupons", couponApiRoutes);
  app.use("/api/users", usersApiRoutes);
  app.use("/api/admin/bookings", adminBookingRoutes);

  // Client
  app.use("/client/auth", clientAuthRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/", homeRoutes);
}

module.exports = route;
