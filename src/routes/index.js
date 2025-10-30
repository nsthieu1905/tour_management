// Admin
const dashboardRoutes = require("./admin/dashboard");
const authRoutes = require("./API/admin/auth");
const toursApiRoutes = require("./API/admin/tours");

// Client
const homeRoutes = require("./client/home");

function route(app) {
  // Admin
  app.use("/auth", authRoutes);
  app.use("/admin", dashboardRoutes);
  app.use("/api/tours", toursApiRoutes);

  // Client
  app.use("/", homeRoutes);
}

module.exports = route;
