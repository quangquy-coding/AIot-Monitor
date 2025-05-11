import express from "express"
import Profile from "../models/Profile.js"
import DeviceGroup from "../models/DeviceGroup.js"
import CommandList from "../models/CommandList.js"
import User from "../models/User.js"
import ActivityLog from "../models/ActivityLog.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get all profiles
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions (admin, team_lead, supervisor)
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const profiles = await Profile.find()
      .populate("deviceGroup", "name")
      .populate("commandList", "name")
      .populate("operators", "username firstName lastName")
      .populate("createdBy", "username")

    res.json(profiles)
  } catch (error) {
    console.error("Get profiles error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get profile by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions (admin, team_lead, supervisor)
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const profile = await Profile.findById(req.params.id)
      .populate("deviceGroup", "name devices")
      .populate("commandList", "name commands")
      .populate("operators", "username firstName lastName email")
      .populate("createdBy", "username")

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "view_profile",
      target: "profile",
      targetId: profile._id,
      details: {
        profileName: profile.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json(profile)
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create profile (team_lead, admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, deviceGroupId, commandListId, operators } = req.body

    // Check if device group exists
    const deviceGroup = await DeviceGroup.findById(deviceGroupId)
    if (!deviceGroup) {
      return res.status(404).json({ message: "Device group not found" })
    }

    // Check if command list exists
    const commandList = await CommandList.findById(commandListId)
    if (!commandList) {
      return res.status(404).json({ message: "Command list not found" })
    }

    // Create profile
    const profile = new Profile({
      name,
      description,
      deviceGroup: deviceGroupId,
      commandList: commandListId,
      operators: operators || [],
      createdBy: req.user.id,
    })

    await profile.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "create_profile",
      target: "profile",
      targetId: profile._id,
      details: {
        profileName: profile.name,
        deviceGroupName: deviceGroup.name,
        commandListName: commandList.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(201).json({
      message: "Profile created successfully",
      profile,
    })
  } catch (error) {
    console.error("Create profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update profile (team_lead, admin only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, deviceGroupId, commandListId } = req.body

    // Find profile
    const profile = await Profile.findById(req.params.id)
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Update fields
    if (name) profile.name = name
    if (description !== undefined) profile.description = description

    // Update device group if provided
    if (deviceGroupId && deviceGroupId !== profile.deviceGroup.toString()) {
      const deviceGroup = await DeviceGroup.findById(deviceGroupId)
      if (!deviceGroup) {
        return res.status(404).json({ message: "Device group not found" })
      }
      profile.deviceGroup = deviceGroupId
    }

    // Update command list if provided
    if (commandListId && commandListId !== profile.commandList.toString()) {
      const commandList = await CommandList.findById(commandListId)
      if (!commandList) {
        return res.status(404).json({ message: "Command list not found" })
      }
      profile.commandList = commandListId
    }

    await profile.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_profile",
      target: "profile",
      targetId: profile._id,
      details: {
        profileName: profile.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Profile updated successfully",
      profile,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete profile (team_lead, admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find profile
    const profile = await Profile.findById(req.params.id)
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Delete profile
    await Profile.deleteOne({ _id: profile._id })

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "delete_profile",
      target: "profile",
      details: {
        profileName: profile.name,
        profileId: profile._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({ message: "Profile deleted successfully" })
  } catch (error) {
    console.error("Delete profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Assign operator to profile
router.post("/:id/operators", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { userId } = req.body

    // Find profile
    const profile = await Profile.findById(req.params.id)
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Check if user exists and is an operator
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role !== "operator") {
      return res.status(400).json({ message: "User is not an operator" })
    }

    // Check if operator is already assigned to profile
    if (profile.operators.includes(userId)) {
      return res.status(400).json({ message: "Operator already assigned to profile" })
    }

    // Add operator to profile
    profile.operators.push(userId)
    await profile.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "assign_operator_to_profile",
      target: "profile",
      targetId: profile._id,
      details: {
        profileName: profile.name,
        operatorName: user.username,
        operatorId: user._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Operator assigned to profile successfully",
      profile,
    })
  } catch (error) {
    console.error("Assign operator error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Remove operator from profile
router.delete("/:id/operators/:userId", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find profile
    const profile = await Profile.findById(req.params.id)
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Check if operator is assigned to profile
    if (!profile.operators.includes(req.params.userId)) {
      return res.status(400).json({ message: "Operator not assigned to profile" })
    }

    // Get operator details for logging
    const operator = await User.findById(req.params.userId)

    // Remove operator from profile
    profile.operators = profile.operators.filter((id) => id.toString() !== req.params.userId)
    await profile.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "remove_operator_from_profile",
      target: "profile",
      targetId: profile._id,
      details: {
        profileName: profile.name,
        operatorName: operator ? operator.username : "Unknown",
        operatorId: req.params.userId,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Operator removed from profile successfully",
      profile,
    })
  } catch (error) {
    console.error("Remove operator error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get profiles for operator
router.get("/operator/:userId", authMiddleware, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if the requesting user is the operator or has admin/team_lead/supervisor role
    if (req.user.id !== req.params.userId && !["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view other users' profiles" })
    }

    // Get profiles for operator
    const profiles = await Profile.find({ operators: req.params.userId })
      .populate("deviceGroup", "name devices")
      .populate({
        path: "deviceGroup",
        populate: {
          path: "devices",
          select: "name type status",
        },
      })
      .populate("commandList", "name commands")
      .populate("createdBy", "username")

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "view_operator_profiles",
      target: "profile",
      details: {
        operatorId: req.params.userId,
        profileCount: profiles.length,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json(profiles)
  } catch (error) {
    console.error("Get operator profiles error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
