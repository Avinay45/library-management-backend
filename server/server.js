const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const bookRoutes = require("./routes/bookRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const memberRoutes = require("./routes/memberRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

const parseAllowedOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const isAllowedVercelPreview = (origin) => {
  if (process.env.ALLOW_VERCEL_PREVIEWS !== "true") {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(origin);

    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const allowedOrigins = [
  ...parseAllowedOrigins(process.env.FRONTEND_URL),
  ...parseAllowedOrigins(process.env.FRONTEND_URLS),
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, "");

    if (
      !origin ||
      allowedOrigins.includes(normalizedOrigin) ||
      isAllowedVercelPreview(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management API is running",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await connectDB();

    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// API Routes
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);

// Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin is not allowed",
    });
  }

  console.error("Unhandled server error:", error.message);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Export Express app for Vercel
module.exports = app;

// Local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
