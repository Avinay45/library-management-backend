const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Book = require("../models/Book");
const Member = require("../models/Member");

// GET all transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("book", "title author isbn")
      .populate("member", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

// GET transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("book", "title author isbn")
      .populate("member", "name email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
};

// CREATE transaction / issue book
const createTransaction = async (req, res) => {
  try {
    const { book, member, dueDate } = req.body;

    if (!book || !member || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Book, member, and due date are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(book)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(member)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    const bookData = await Book.findById(book);

    if (!bookData) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const memberData = await Member.findById(member);

    if (!memberData) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (bookData.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Book is currently unavailable",
      });
    }

    const transaction = await Transaction.create({
      book,
      member,
      dueDate,
      status: "issued",
    });

    bookData.availableQuantity -= 1;
    await bookData.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("book", "title author isbn")
      .populate("member", "name email");

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: populatedTransaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
};

// RETURN book
const returnBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status === "returned") {
      return res.status(400).json({
        success: false,
        message: "Book has already been returned",
      });
    }

    const book = await Book.findById(transaction.book);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book associated with transaction not found",
      });
    }

    transaction.returnDate = new Date();
    transaction.status = "returned";

    await transaction.save();

    book.availableQuantity += 1;

    if (book.availableQuantity > book.quantity) {
      book.availableQuantity = book.quantity;
    }

    await book.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("book", "title author isbn")
      .populate("member", "name email");

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: populatedTransaction,
    });
  } catch (error) {
    console.error("Error returning book:", error);

    res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  }
};

// DELETE transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
};
const getOverdueTransactions = async (req, res) => {
  try {
    const now = new Date();

    // Find issued transactions whose due date has passed
    await Transaction.updateMany(
      {
        status: "issued",
        dueDate: { $lt: now },
      },
      {
        $set: {
          status: "overdue",
        },
      },
    );

    // Fetch all overdue transactions with book and member details
    const overdueTransactions = await Transaction.find({
      status: "overdue",
    })
      .populate("book", "title author isbn")
      .populate("member", "name email")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: overdueTransactions.length,
      data: overdueTransactions,
    });
  } catch (error) {
    console.error("Error fetching overdue transactions:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue transactions",
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  returnBook,
  deleteTransaction,
  getOverdueTransactions,
};
