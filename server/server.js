const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const bookRoutes = require("./routes/bookRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const memberRoutes = require("./routes/memberRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management API is running",
  });
});

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Export Express app for Vercel
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error.message);
    });
}
