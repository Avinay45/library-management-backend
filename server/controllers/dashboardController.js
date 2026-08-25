const Book = require("../models/Book");
const Member = require("../models/member");
const Transaction = require("../models/Transaction");

// GET dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [totalBooks, totalMembers, activeLoans, overdueLoans, returnedBooks] =
      await Promise.all([
        Book.countDocuments(),

        Member.countDocuments(),

        // Books currently issued and not yet returned
        Transaction.countDocuments({
          returnDate: null,
        }),

        // Currently issued books whose due date has passed
        Transaction.countDocuments({
          dueDate: { $lt: new Date() },
          returnDate: null,
        }),

        // Books that have been returned
        Transaction.countDocuments({
          returnDate: { $ne: null },
        }),
      ]);

    const availableBooks = await Book.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$availableQuantity",
          },
        },
      },
    ]);

    const borrowedBooks = await Book.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $subtract: ["$quantity", "$availableQuantity"],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalMembers,
        activeLoans,
        overdueLoans,
        availableBooks: availableBooks[0]?.total || 0,
        borrowedBooks: borrowedBooks[0]?.total || 0,
        returnedBooks,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};
