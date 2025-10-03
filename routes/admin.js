import express from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import mongoose from "mongoose";
const router = express.Router();

// Get all users
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single user
router.get("/users/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user status
// PUT /api/admin/user/:userId/status
// Toggle user active status
router.put("/user/:userId/status", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Toggle the isActive field
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.name} is now ${
        user.isActive ? "active" : "inactive"
      }`,
      isActive: user.isActive,
    });
  } catch (err) {
    console.error("Toggle user status error:", err);
    res.status(500).json({ message: "Server error updating status" });
  }
});
// Delete user
// routes/admin.js
router.delete("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `User ${user.name} deleted successfully` });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/user/:userId/promote", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isAdmin = true;
    await user.save();

    res.json({ message: `User ${user.name} promoted to admin`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
