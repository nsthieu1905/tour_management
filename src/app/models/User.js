const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    gender: String,
    dateOfBirth: Date,
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "customer", "partner"],
      default: "customer",
    },
    avatar: String,
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    metadata: {
      lastLogin: Date,
      loginCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Hash password trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Loại bỏ password khi trả về JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
