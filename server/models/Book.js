const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      minlength: [2, "Book title must be at least 2 characters"],
    },

    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      minlength: [2, "Author name must be at least 2 characters"],
    },

    category: {
      type: String,
      required: [true, "Book category is required"],
      trim: true,
    },

    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      unique: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, "Book quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },

    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Available quantity cannot be negative"],
      validate: {
        validator: function (value) {
          return value <= this.quantity;
        },
        message: "Available quantity cannot exceed total quantity",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
