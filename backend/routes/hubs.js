import express from "express"
import Hub from "../models/Hub.js"
import ActivityLog from "../models/ActivityLog.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get all hubs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const hubs = await Hub.find()
    res.json(hubs)
  } catch (error) {
    console.error("Get hubs error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get hub by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id)
    if (!hub) {
      return res.status(404).json({ message: "Hub not found" })
    }

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "view_hub",
      target: "hub",
      targetId: hub._id,
      details: {
        hubName: hub.name,
        hubType: hub.type,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json(hub)
  } catch (error) {
    console.error("Get hub error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create hub (admin, team_lead only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, type, ipAddress, macAddress, location, customer } = req.body

    // Create hub
    const newHub = new Hub({
      name,
      type,
      ipAddress,
      macAddress,
      location,
      customer,
      status: "offline", // Default status
    })

    await newHub.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "create_hub",
      target: "hub",
      targetId: newHub._id,
      details: {
        hubName: newHub.name,
        hubType: newHub.type,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients if socket.io is available
    if (req.io) {
      req.io.emit("hub_created", newHub)
    }

    res.status(201).json({
      message: "Hub created successfully",
      hub: newHub,
    })
  } catch (error) {
    console.error("Create hub error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update hub (admin, team_lead only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, type, ipAddress, macAddress, location, status, customer } = req.body

    // Find hub
    const hub = await Hub.findById(req.params.id)
    if (!hub) {
      return res.status(404).json({ message: "Hub not found" })
    }

    // Update fields
    if (name) hub.name = name
    if (type) hub.type = type
    if (ipAddress) hub.ipAddress = ipAddress
    if (macAddress !== undefined) hub.macAddress = macAddress
    if (location !== undefined) hub.location = location
    if (status) hub.status = status
    if (customer) hub.customer = customer

    await hub.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_hub",
      target: "hub",
      targetId: hub._id,
      details: {
        hubName: hub.name,
        hubStatus: hub.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients if socket.io is available
    if (req.io) {
      req.io.emit("hub_updated", hub)
    }

    res.json({
      message: "Hub updated successfully",
      hub,
    })
  } catch (error) {
    console.error("Update hub error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete hub (admin, team_lead only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find hub
    const hub = await Hub.findById(req.params.id)
    if (!hub) {
      return res.status(404).json({ message: "Hub not found" })
    }

    // Delete hub
    await Hub.deleteOne({ _id: hub._id })

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "delete_hub",
      target: "hub",
      details: {
        hubName: hub.name,
        hubId: hub._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients if socket.io is available
    if (req.io) {
      req.io.emit("hub_deleted", { hubId: hub._id })
    }

    res.json({ message: "Hub deleted successfully" })
  } catch (error) {
    console.error("Delete hub error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update hub status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body

    // Find hub
    const hub = await Hub.findById(req.params.id)
    if (!hub) {
      return res.status(404).json({ message: "Hub not found" })
    }

    // Update status
    hub.status = status
    hub.lastPing = new Date()
    await hub.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_hub_status",
      target: "hub",
      targetId: hub._id,
      details: {
        hubName: hub.name,
        hubStatus: hub.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients if socket.io is available
    if (req.io) {
      req.io.emit("hub_status_changed", {
        hubId: hub._id,
        status: hub.status,
      })
    }

    res.json({
      message: "Hub status updated successfully",
      hub,
    })
  } catch (error) {
    console.error("Update hub status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router

