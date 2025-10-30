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
  helpers: {},

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
