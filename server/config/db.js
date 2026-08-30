const mongoose = require("mongoose");

let connectionPromise = null;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  return uri?.trim().replace(/^["']|["']$/g, "");
};

const getDatabaseError = (error) => {
  if (error.message.includes("MONGODB_URI is not configured")) {
    return {
      code: "MISSING_MONGODB_URI",
      message: "MONGODB_URI is not configured in the backend deployment.",
    };
  }

  if (
    error.message.includes("bad auth") ||
    error.message.includes("Authentication failed")
  ) {
    return {
      code: "MONGODB_AUTH_FAILED",
      message: "MongoDB authentication failed. Check the database username and password in MONGODB_URI.",
    };
  }

  if (
    error.message.includes("querySrv") ||
    error.message.includes("ENOTFOUND") ||
    error.message.includes("ETIMEOUT") ||
    error.message.includes("Server selection timed out")
  ) {
    return {
      code: "MONGODB_NETWORK_FAILED",
      message:
        "MongoDB network connection failed. In Atlas, allow access from 0.0.0.0/0 for Vercel serverless deployments and verify the cluster host.",
    };
  }

  return {
    code: "MONGODB_CONNECTION_FAILED",
    message: "Database connection failed. Check the MongoDB Atlas URI and Network Access settings.",
  };
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  connectionPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    })
    .then((connection) => {
      console.log(`MongoDB connected: ${connection.connection.host}`);
      return connection.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error("Error connecting to MongoDB:", error.message);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
module.exports.getDatabaseError = getDatabaseError;
