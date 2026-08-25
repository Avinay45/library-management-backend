const mongoose = require("mongoose");
const Book = require("../models/Book");

const bookFields = ["title", "author", "category", "isbn"];

const parseWholeNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return Number.NaN;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) ? numberValue : Number.NaN;
};

const getValidationErrors = (error) =>
  Object.values(error.errors).map((validationError) => validationError.message);

// Get all books
const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Error fetching books:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching books",
    });
  }
};

// Get a single book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Error fetching book:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
};
// Create a new book
const createBook = async (req, res) => {
  try {
    const { title, author, category, isbn } = req.body;
    const quantity = parseWholeNumber(req.body.quantity);

    if (Number.isNaN(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: ["Quantity must be a whole number greater than or equal to 0"],
      });
    }

    // Check for duplicate ISBN
    const existingBook = await Book.findOne({ isbn });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists",
      });
    }

    const book = await Book.create({
      title,
      author,
      category,
      isbn,
      quantity,
      availableQuantity: quantity,
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    console.error("Error creating book:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: getValidationErrors(error),
      });
    }

    // Duplicate MongoDB unique index error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create book",
    });
  }
};

// Update an existing book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const { isbn } = req.body;

    // Check if the new ISBN already belongs to another book
    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn });

      if (existingBook) {
        return res.status(409).json({
          success: false,
          message: "A book with this ISBN already exists",
        });
      }
    }

    bookFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    if (req.body.quantity !== undefined) {
      const quantity = parseWholeNumber(req.body.quantity);

      if (Number.isNaN(quantity) || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: ["Quantity must be a whole number greater than or equal to 0"],
        });
      }

      const borrowedQuantity = book.quantity - book.availableQuantity;

      if (quantity < borrowedQuantity) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            `Quantity cannot be less than ${borrowedQuantity} because that many copies are currently borrowed`,
          ],
        });
      }

      book.quantity = quantity;
      book.availableQuantity = quantity - borrowedQuantity;
    }

    const updatedBook = await book.save();

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Error updating book:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: getValidationErrors(error),
      });
    }

    // Duplicate MongoDB unique index error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
