const authRoutes = require("./auth");
const dashboardRoutes = require("./dashboard");

function route(app) {
  app.use("/auth", authRoutes);
  app.use("/", dashboardRoutes);
  app.use("/admin", dashboardRoutes);
}

module.exports = route;
