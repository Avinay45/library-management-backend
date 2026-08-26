const Member = require("../models/Member");

// GET /api/members
const getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,\
      data: members,
    });
  } catch (error) {
    console.error("Error fetching members:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching members",
    });
  }
};

// GET /api/members/:id
const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("Error fetching member:", error);

    res.status(400).json({
      success: false,
      message: "Invalid member ID",
    });
  }
};

// POST /api/members
const createMember = async (req, res) => {
  try {
    const { name, email, phone, membershipDate } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required",
      });
    }

    const existingMember = await Member.findOne({
      email: email.toLowerCase(),
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: "A member with this email already exists",
      });
    }

    const member = await Member.create({
      name,
      email: email.toLowerCase(),
      phone,
      membershipDate,
    });

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error creating member:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create member",
    });
  }
};

// PUT /api/members/:id
const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const { name, email, phone, membershipDate } = req.body;

    if (!name && !email && !phone && !membershipDate) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required for update",
      });
    }

    if (email && email.toLowerCase() !== member.email) {
      const existingMember = await Member.findOne({
        email: email.toLowerCase(),
        _id: { $ne: member._id },
      });

      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: "A member with this email already exists",
        });
      }

      member.email = email.toLowerCase();
    }

    member.name = name ?? member.name;
    member.phone = phone ?? member.phone;
    member.membershipDate = membershipDate ?? member.membershipDate;

    const updatedMember = await member.save();

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    console.error("Error updating member:", error);

    res.status(400).json({
      success: false,
      message: "Failed to update member",
    });
  }
};

// DELETE /api/members/:id
const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting member:", error);

    res.status(400).json({
      success: false,
      message: "Invalid member ID",
    });
  }
};

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
};
