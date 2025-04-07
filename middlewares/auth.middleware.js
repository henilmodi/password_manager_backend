const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const UserModel = require("../models/user.model");

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "").trim();
    console.log("Token: ", token);

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "Access denied. No token provided.",
        success: false,
        data: null,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token: ", decoded);

    // Check if token has expired
    const currentTimestamp = Math.floor(Date.now() / 1000); // Convert to seconds
    if (decoded.exp && decoded.exp < currentTimestamp) {
      return res.status(401).json({
        statusCode: 401,
        message: "Token has expired. Please log in again.",
        success: false,
        data: null,
      });
    }

    // Find user by ID
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        message: "User not found.",
        success: false,
        data: null,
      });
    }

    // Attach user info to request
    req.user = user;
    next();
  } catch (err) {
    console.error("Error in jwtAuthMiddleware: ", err);

    // Differentiate between expired and invalid tokens
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        statusCode: 401,
        message: "Token has expired. Please log in again.",
        success: false,
        data: null,
      });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        statusCode: 401,
        message: "Invalid token or no token has provided. Please log in again.",
        success: false,
        data: null,
      });
    }

    return res.status(401).json({
      statusCode: 401,
      message: "Authentication failed.",
      success: false,
      data: null,
    });
  }
};

module.exports = jwtAuthMiddleware;
