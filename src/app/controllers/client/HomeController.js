const { Tour } = require("../../models/index");

// [GET] /
const home = (req, res) => {
  res.render("home", {
    bodyClass: "bg-gray-50",
  });
};

module.exports = {
  home,
};
