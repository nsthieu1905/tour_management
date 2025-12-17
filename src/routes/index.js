// Admin
const siteRoutes = require("./admin/site");
const authRoutes = require("./admin/auth");
const toursApiRoutes = require("./admin/tours");
const couponApiRoutes = require("./admin/coupon");
const usersApiRoutes = require("./admin/users");
const adminBookingRoutes = require("./admin/bookings");
const adminStaffRoutes = require("./admin/staff");
const doiTacApiRoutes = require("./admin/doi-tac");
const tourCategoryApiRoutes = require("./admin/tour-categories");

// Chatbot
const chatbotApiRoutes = require("./client/chatbot");

// Client
const homeRoutes = require("./client/home");
const clientAuthRoutes = require("./client/auth");
const favoriteRoutes = require("./client/favorites");
const bookingRoutes = require("./client/bookings");
const feedbackRoutes = require("./client/feedbacks");

// Real-time
const notificationRoutes = require("./realtime/notifications");
const messageRoutes = require("./realtime/messages");

function route(app) {
  // Admin
  app.use("/auth", authRoutes);
  app.use("/admin", siteRoutes);
  app.use("/api/tours", toursApiRoutes);
  app.use("/api/coupons", couponApiRoutes);
  app.use("/api/users", usersApiRoutes);
  app.use("/api/bookings", adminBookingRoutes);
  app.use("/api/staffs", adminStaffRoutes);
  app.use("/api/doi-tac", doiTacApiRoutes);
  app.use("/api/tour-categories", tourCategoryApiRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/messages", messageRoutes);

  // Chatbot
  app.use("/api/chatbot", chatbotApiRoutes);

  // Client
  app.use("/client/auth", clientAuthRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/feedbacks", feedbackRoutes);
  app.use("/", homeRoutes);
}

module.exports = route;
