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

const port = process.env.PORT || 3000;

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store socket instance globally for use in controllers/services
global.io = io;
global.connectedUsers = new Map(); // Map to store userId -> socketId

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
    "./src/resources/client/views/partials",
    "./src/resources/client/views/chatbot",
  ],
});

app.engine(".hbs", hbs);
app.set("view engine", ".hbs");
app.set("views", [
  "./src/resources/admin/views",
  "./src/resources/client/views",
]);

route(app);

// Socket.io connection handling
io.on("connection", (socket) => {
  // User joins - store the socket connection
  socket.on("user:join", (userId) => {
    if (!userId) {
      return;
    }

    const userIdStr = userId.toString ? userId.toString() : userId;
    const roomName = `user:${userIdStr}`;

    global.connectedUsers.set(userIdStr, socket.id);
    socket.join(roomName);
  });

  // Admin joins notification room
  socket.on("admin:join", (data) => {
    const adminId = data.adminId || data;
    global.connectedUsers.set(`admin:${adminId}`, socket.id);
    socket.join("admin-notifications");
    socket.join("admin-messages"); // Admin messages room
  });

  // Client joins notification room
  socket.on("client:join", (data) => {
    const clientId = data.userId || data;
    global.connectedUsers.set(`client:${clientId}`, socket.id);
    socket.join("client-notifications");
    socket.join(`client:${clientId}`); // Individual client room
  });

  // ===== MESSAGING EVENTS =====

  /**
   * Message:send - Gửi tin nhắn
   */
  socket.on("message:send", (data) => {
    const { conversationId, message } = data;

    // Broadcast đến tất cả user trong cuộc hội thoại
    io.to(`conversation:${conversationId}`).emit("message:new", message);

    // Notify admin nếu tin nhắn từ client
    if (message.senderType === "client") {
      io.to("admin-messages").emit("message:new", message);
    }

    // Notify client nếu tin nhắn từ admin
    if (message.senderType === "admin") {
      const clientIdStr = message.recipientId?.toString
        ? message.recipientId.toString()
        : message.recipientId;
      io.to(`client:${clientIdStr}`).emit("message:new", message);
    }
  });

  /**
   * Conversation:join - Join vào phòng cuộc hội thoại
   */
  socket.on("conversation:join", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  /**
   * Conversation:leave - Rời khỏi phòng cuộc hội thoại
   */
  socket.on("conversation:leave", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  /**
   * Conversation:read - Đánh dấu cuộc hội thoại đã đọc
   */
  socket.on("conversation:read", (data) => {
    const { conversationId } = data;
    io.to(`conversation:${conversationId}`).emit("conversation:read", data);
  });

  /**
   * Conversation:closed - Đóng cuộc hội thoại
   */
  socket.on("conversation:closed", (data) => {
    const { conversationId } = data;
    io.to(`conversation:${conversationId}`).emit("conversation:closed", data);
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    // Remove user from map
    for (let [key, value] of global.connectedUsers.entries()) {
      if (value === socket.id) {
        global.connectedUsers.delete(key);
        break;
      }
    }
  });
});

server.listen(port, () => {
  console.log(
    `Admin app listening on http://localhost:${port}/admin/dashboard`
  );
  console.log(`Client app listening on http://localhost:${port}`);
});
