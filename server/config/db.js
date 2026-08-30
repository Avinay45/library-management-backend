const mongoose = require("mongoose");

let connectionPromise = null;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    return null;
  }

  return uri.trim().replace(/^[\"']|[\"']$/g, "");
};

const getDatabaseError = (error) => {
  const message = error?.message || "";

  if (message.includes("MONGODB_URI is not configured")) {
    return {
      code: "MISSING_MONGODB_URI",
      message: "MONGODB_URI is not configured in the backend deployment.",
    };
  }

  if (
    message.includes("bad auth") ||
    message.includes("Authentication failed") ||
    message.includes("authentication failed")
  ) {
    return {
      code: "MONGODB_AUTH_FAILED",
      message:
        "MongoDB authentication failed. Check the database username and password in MONGODB_URI.",
    };
  }

  if (
    message.includes("querySrv") ||
    message.includes("ENOTFOUND") ||
    message.includes("ETIMEOUT") ||
    message.includes("Server selection timed out") ||
    message.includes("ECONNREFUSED")
  ) {
    return {
      code: "MONGODB_NETWORK_FAILED",
      message:
        "MongoDB network connection failed. Verify the Atlas cluster hostname, Network Access rules, and MONGODB_URI.",
    };
  }

  return {
    code: "MONGODB_CONNECTION_FAILED",
    message:
      "Database connection failed. Check the MongoDB Atlas URI, database user, and Network Access settings.",
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
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      maxIdleTimeMS: 30000,
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
