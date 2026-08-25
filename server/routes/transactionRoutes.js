const express = require("express");

const {
  getTransactions,
  getTransactionById,
  createTransaction,
  returnBook,
  deleteTransaction,
  getOverdueTransactions,
} = require("../controllers/transactionController");

const router = express.Router();

// IMPORTANT: /overdue must come before /:id
router.get("/overdue", getOverdueTransactions);

router.get("/", getTransactions);

router.get("/:id", getTransactionById);

router.post("/issue", createTransaction);

router.put("/:id/return", returnBook);

router.delete("/:id", deleteTransaction);

module.exports = router;
