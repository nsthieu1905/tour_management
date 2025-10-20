const express = require("express");
const app = express();
const port = 8386;
const morgan = require("morgan");
const { engine } = require("express-handlebars");
const route = require("./routes");
const db = require("./config/db");
const methodOverride = require("method-override");
const moment = require("moment");

app.use(methodOverride("_method"));

//Connect to DB
db.connect();

//Http logger
app.use(morgan("combined"));

//config static files
app.use(express.static("./src/public"));
app.use("/uploads", express.static("src/public/uploads"));

//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//template engine
const hbs = engine({
  extname: ".hbs",
  helpers: {
    sum: (a, b) => a + b,
    sub: (a, b) => a - b,
    eq: (a, b) => a === b,
    thumbnail: (images) =>
      images && images.length > 0 ? images[0] : "/images/default.jpg",
    badgeClass: (type) => {
      switch (type) {
        case "Giá tốt":
          return "badge-giatot";
        case "Cao cấp":
          return "badge-caocap";
        case "Tiêu chuẩn":
          return "badge-tieuchuan";
        case "Tiết kiệm":
          return "badge-tietkiem";
        default:
          return "";
      }
    },
    badgeIcon: (type) => {
      switch (type) {
        case "Giá tốt":
          return "fa-tag";
        case "Cao cấp":
          return "fa-gem";
        case "Tiêu chuẩn":
          return "fa-medal";
        case "Tiết kiệm":
          return "fa-crown";
        default:
          return "fa-ticket";
      }
    },
    formatDate: (date) => {
      if (!date) return "";
      const value = Array.isArray(date) ? date[0] : date; // nếu là mảng thì lấy phần tử đầu tiên
      return moment(value).format("DD/MM/YYYY");
    },
    formatPrice: (value) => {
      if (isNaN(value)) return "0";
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
  },

  //Điều hướng đến thư mục partials
  partialsDir: ["./src/resources/views/partials", "./src/resources/views/CRUD"],
});

app.engine(".hbs", hbs);
app.set("view engine", ".hbs");
app.set("views", "./src/resources/views");

route(app);

app.listen(port, () => {
  console.log(
    `Example app listening on port http://localhost:${port}/admin/dashboard`
  );
});
