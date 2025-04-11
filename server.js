const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Lazy connect to MongoDB on each request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({ message: "MongoDB connection failed" });
  }
});

app.use("/api", authRoutes);
app.use("/user", userRoutes);

module.exports = app;
