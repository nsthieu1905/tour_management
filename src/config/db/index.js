const mongoose = require("mongoose");
const URI = process.env.DB_URI;

async function connect() {
  try {
    await mongoose.connect(URI);
    console.log("Connect successfully!!!!!!!!!!!!!");
  } catch (error) {
    console.log("Connect failure!!!!!!!!!!!!!");
  }
}

module.exports = { connect };
