const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const app = express();
app.use(cors());
dotenv.config({ path: "./.env" });

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use("/api", authRoutes);
app.use("/user", userRoutes);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Connection established");
  console.log(`Server is running on port ${PORT}`);
});
