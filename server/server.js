const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { getDatabaseError } = require("./config/db");

const bookRoutes = require("./routes/bookRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const memberRoutes = require("./routes/memberRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

/* -------------------------------------------------------------------------- */
/* CORS                                                                       */
/* -------------------------------------------------------------------------- */

const normalizeOrigin = (origin) => {
  if (!origin) return "";

  return origin.trim().replace(/\/+$/, "");
};

const parseAllowedOrigins = (value) => {
  if (!value) return [];

  return value.split(",").map(normalizeOrigin).filter(Boolean);
};

const isAllowedVercelPreview = (origin) => {
  if (process.env.ALLOW_VERCEL_PREVIEWS !== "true") {
    return false;
  }

  try {
    const url = new URL(origin);

    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const allowedOrigins = new Set([
  ...parseAllowedOrigins(process.env.FRONTEND_URL),
  ...parseAllowedOrigins(process.env.FRONTEND_URLS),

  // Local development
  "http://localhost:5173",
  "http://localhost:3000",
]);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without an Origin header.
    // This includes direct browser navigation, health checks,
    // Postman, server-to-server requests, etc.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (
      allowedOrigins.has(normalizedOrigin) ||
      isAllowedVercelPreview(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);

    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "Accept"],

  credentials: false,

  optionsSuccessStatus: 204,
};

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "1mb" }));

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Management API is running",
    databaseConfigured: Boolean(
      process.env.MONGODB_URI || process.env.MONGO_URI,
    ),
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
    const databaseError = getDatabaseError(error);

    console.error("Database health check failed:", {
      code: databaseError.code,
      message: error.message,
    });

    res.status(503).json({
      success: false,
      message: databaseError.message,
      code: databaseError.code,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Database middleware                                                        */
/* -------------------------------------------------------------------------- */

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    const databaseError = getDatabaseError(error);

    console.error("Database connection failed:", {
      code: databaseError.code,
      message: error.message,
    });

    res.status(503).json({
      success: false,
      message: databaseError.message,
      code: databaseError.code,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* API Routes                                                                 */
/* -------------------------------------------------------------------------- */

app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/transactions", transactionRoutes);

/* -------------------------------------------------------------------------- */
/* 404                                                                        */
/* -------------------------------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

/* -------------------------------------------------------------------------- */
/* Error Handler                                                              */
/* -------------------------------------------------------------------------- */

app.use((error, req, res, next) => {
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin is not allowed",
    });
  }

  console.error("Unhandled server error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* -------------------------------------------------------------------------- */
/* Vercel                                                                    */
/* -------------------------------------------------------------------------- */

module.exports = app;

/* -------------------------------------------------------------------------- */
/* Local Development                                                          */
/* -------------------------------------------------------------------------- */

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
