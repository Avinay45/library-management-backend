const express = require("express");

const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/memberController");

const router = express.Router();

// GET /api/members
router.get("/", getMembers);

// GET /api/members/:id
router.get("/:id", getMemberById);

// POST /api/members
router.post("/", createMember);

// PUT /api/members/:id
router.put("/:id", updateMember);

// DELETE /api/members/:id
router.delete("/:id", deleteMember);

module.exports = router;
