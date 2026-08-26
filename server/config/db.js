const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Reuse an existing MongoDB connection
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }

    // Wait for an existing connection attempt
    if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
      return;
    }

    // Validate environment variable
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Connect to MongoDB
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

module.exports = connectDB;
