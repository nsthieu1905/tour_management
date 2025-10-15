const homeRoutes = require("./client/home");
const authRoutes = require("./admin/auth");
const dashboardRoutes = require("./admin/dashboard");

function route(app) {
  app.use("/auth", authRoutes);
  app.use("/admin", dashboardRoutes);

  app.use("/", homeRoutes);
}

module.exports = route;
