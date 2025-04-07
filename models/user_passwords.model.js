const mongoose = require("mongoose");
const User = require("../models/user.model");

const passwordSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: [true, "Company Name is required"],
      trim: true,
    },
    companyUrl: {
      type: String,
      required: [true, "Company URL is required"],
      trim: true,
      match: [
        /^(https?:\/\/)?([\w\d\-]+\.)+[\w]{2,}(\/.*)?$/,
        "Please enter a valid company URL",
      ],
    },
    companyLogoUrl: {
      type: String,
      required: [true, "Company Logo URL is required."],
      trim: true,
      match: [
        /^(https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp))$/,
        "Please enter a valid image URL",
      ],
    },
    emailOrUserId: {
      type: String,
      required: [true, "Email/UserId is required."],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    breachedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Password = mongoose.model("Password", passwordSchema);

module.exports = Password;
