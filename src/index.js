const express = require("express");
const app = express();
const port = 8386;
const morgan = require("morgan");
const { engine } = require("express-handlebars");
const route = require("./routes");
const db = require("./config/db");
const methodOverride = require("method-override");

app.use(methodOverride("_method"));

//Connect to DB
db.connect();

//Http logger
app.use(morgan("combined"));

//config static files
app.use(express.static("./src/public"));

//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//template engine
const hbs = engine({
  extname: ".hbs",
  helpers: {
    sum: (a, b) => a + b,
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
