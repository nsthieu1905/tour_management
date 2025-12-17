require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const { engine } = require("express-handlebars");
const route = require("./routes");
const db = require("./config/db");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIO = require("socket.io");
const SocketService = require("./services/SocketService");

const port = process.env.PORT || 3000;

// Tạo server HTTP và tích hợp Socket.IO
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Khởi tạo SocketService
const socketService = new SocketService(io);
socketService.initialize();

// Lưu trữ đối tượng io và danh sách người dùng kết nối vào biến toàn cục
global.io = io;
global.connectedUsers = socketService.getConnectedUsers();

app.use(methodOverride("_method"));

//Connect to DB
db.connect();

//Http logger
// app.use(morgan("combined"));

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
    formatPrice: (price) => {
      if (!price || isNaN(price)) return "0";
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },

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
      let d = Array.isArray(date) ? date[0] : date;
      if (typeof d === "object" && d !== null && d.date) {
        d = d.date;
      }
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return "";
      return dateObj.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    },

    thumbnail: (images) => {
      return images && images.length > 0 ? images[0] : "/uploads/default.jpg";
    },

    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => (b !== 0 ? a / b : 0),

    slice: (arr, start, end) => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(start, end);
    },

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

    json: (obj) => {
      return JSON.stringify(obj);
    },
  },

  //Điều hướng đến thư mục partials
  partialsDir: [
    "./src/resources/admin/views/partials",
    "./src/resources/admin/views/CRUD/qly-tours",
    "./src/resources/admin/views/CRUD/qly-coupons",
    "./src/resources/admin/views/CRUD/qly-nhanviens",
    "./src/resources/admin/views/CRUD/qly-doitacs",
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

server.listen(port, () => {
  console.log(
    `Admin app listening on http://localhost:${port}/admin/dashboard`
  );
  console.log(`Client app listening on http://localhost:${port}`);
});
