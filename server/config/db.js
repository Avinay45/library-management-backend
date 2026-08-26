const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
      return;
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

module.exports = connectDB;
