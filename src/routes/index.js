const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");
const toursApiRoutes = require("./api/tours");

function route(app) {
  app.use("/auth", authRoutes);
  app.use("/admin", dashboardRoutes);
  app.use("/api/tours", toursApiRoutes);
}

module.exports = route;
