import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import ActivityLog from "../models/ActivityLog.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Find user
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is disabled" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      // Log failed login attempt
      await ActivityLog.create({
        user: user._id,
        action: "login",
        target: "auth",
        details: { success: false },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        status: "failure",
      })

      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "aiot_monitor_secret_key_change_in_production",
      { expiresIn: "8h" },
    )

    // Log successful login
    await ActivityLog.create({
      user: user._id,
      action: "login",
      target: "auth",
      details: { success: true },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    })

    // Send response
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Reset password (admin only)
router.post("/reset-password", authMiddleware, async (req, res) => {
  try {
    const { userId, newPassword } = req.body
    const adminUser = req.user

    // Check if admin
    if (adminUser.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Log activity
    await ActivityLog.create({
      user: adminUser.id,
      action: "reset_password",
      target: "user",
      targetId: user._id,
      details: { userId: user._id },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Password reset error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Reset admin password to default (public endpoint)
router.post("/reset-admin-password", async (req, res) => {
  try {
    // Find admin user
    const adminUser = await User.findOne({ role: "admin" })
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" })
    }

    // Reset password to default
    adminUser.password = "admin123"
    await adminUser.save()

    // Log activity
    await ActivityLog.create({
      user: adminUser._id,
      action: "reset_admin_password",
      target: "user",
      targetId: adminUser._id,
      details: { username: adminUser.username },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      status: "success",
    })

    res.json({ message: "Admin password reset to default successfully" })
  } catch (error) {
    console.error("Admin password reset error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update own password
router.put("/update-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Log activity
    await ActivityLog.create({
      user: userId,
      action: "update_password",
      target: "user",
      targetId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password update error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router

