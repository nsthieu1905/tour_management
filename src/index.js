require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const { engine } = require("express-handlebars");
const route = require("./routes");
const db = require("./config/db");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");

const port = process.env.PORT || 3000;

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
app.use(cookieParser());

//template engine
const hbs = engine({
  extname: ".hbs",
  helpers: {
    // Format price
    formatPrice: (price) => {
      if (!price || isNaN(price)) return "0";
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },

    // Format date
    formatDate: (date) => {
      if (!date) return "";
      const d = Array.isArray(date) ? date[0] : date;
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },

    // Get thumbnail image
    thumbnail: (images) => {
      return images && images.length > 0 ? images[0] : "/uploads/default.jpg";
    },

    // Simple math operations
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => (b !== 0 ? a / b : 0),

    // Slice array
    slice: (arr, start, end) => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(start, end);
    },

    // Equality check
    eq: (a, b) => a === b,
    lte: (a, b) => a <= b,
    gte: (a, b) => a >= b,
    lt: (a, b) => a < b,
    gt: (a, b) => a > b,
    and: (a, b) => {
      return a && b;
    },
    or: (a, b) => {
      return a || b;
    },
  },

  //Điều hướng đến thư mục partials
  partialsDir: [
    "./src/resources/admin/views/partials",
    "./src/resources/admin/views/CRUD/qly-tours",
    "./src/resources/client/views/partials",
  ],
});

app.engine(".hbs", hbs);
app.set("view engine", ".hbs");
app.set("views", [
  "./src/resources/admin/views",
  "./src/resources/client/views",
]);

route(app);

app.listen(port, () => {
  console.log(
    `Admin app listening on http://localhost:${port}/admin/dashboard`
  );
  console.log(`Client app listening on http://localhost:${port}`);
});
