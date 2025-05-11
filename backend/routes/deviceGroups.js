import express from "express"
import DeviceGroup from "../models/DeviceGroup.js"
import Device from "../models/Device.js"
import ActivityLog from "../models/ActivityLog.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get all device groups
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions (admin, team_lead, supervisor)
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const deviceGroups = await DeviceGroup.find()
      .populate("devices", "name type status")
      .populate("createdBy", "username")
    
    res.json(deviceGroups)
  } catch (error) {
    console.error("Get device groups error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get device group by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions (admin, team_lead, supervisor)
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const deviceGroup = await DeviceGroup.findById(req.params.id)
      .populate("devices", "name type status ipAddress macAddress")
      .populate("createdBy", "username")
    
    if (!deviceGroup) {
      return res.status(404).json({ message: "Device group not found" })
    }

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "view_device_group",
      target: "device_group",
      targetId: deviceGroup._id,
      details: {
        deviceGroupName: deviceGroup.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json(deviceGroup)
  } catch (error) {
    console.error("Get device group error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create device group (team_lead, admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, devices } = req.body

    // Create device group
    const deviceGroup = new DeviceGroup({
      name,
      description,
      devices: devices || [],
      createdBy: req.user.id,
    })

    await deviceGroup.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "create_device_group",
      target: "device_group",
      targetId: deviceGroup._id,
      details: {
        deviceGroupName: deviceGroup.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(201).json({
      message: "Device group created successfully",
      deviceGroup,
    })
  } catch (error) {
    console.error("Create device group error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update device group (team_lead, admin only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, devices } = req.body

    // Find device group
    const deviceGroup = await DeviceGroup.findById(req.params.id)
    if (!deviceGroup) {
      return res.status(404).json({ message: "Device group not found" })
    }

    // Update fields
    if (name) deviceGroup.name = name
    if (description !== undefined) deviceGroup.description = description
    if (devices) deviceGroup.devices = devices

    await deviceGroup.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_device_group",
      target: "device_group",
      targetId: deviceGroup._id,
      details: {
        deviceGroupName: deviceGroup.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Device group updated successfully",
      deviceGroup,
    })
  } catch (error) {
    console.error("Update device group error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete device group (team_lead, admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find device group
    const deviceGroup = await DeviceGroup.findById(req.params.id)
    if (!deviceGroup) {
      return res.status(404).json({ message: "Device group not found" })
    }

    // Delete device group
    await DeviceGroup.deleteOne({ _id: deviceGroup._id })

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "delete_device_group",
      target: "device_group",
      details: {
        deviceGroupName: deviceGroup.name,
        deviceGroupId: deviceGroup._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({ message: "Device group deleted successfully" })
  } catch (error) {
    console.error("Delete device group error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add device to group
router.post("/:id/devices", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { deviceId } = req.body

    // Find device group
    const deviceGroup = await DeviceGroup.findById(req.params.id)
    if (!deviceGroup) {
      return res.status(404).json({ message: "Device group not found" })
    }

    // Check if device exists
    const device = await Device.findById(deviceId)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    // Check if device is already in group
    if (deviceGroup.devices.includes(deviceId)) {
      return res.status(400).json({ message: "Device already in group" })
    }

    // Add device to group
    deviceGroup.devices.push(deviceId)
    await deviceGroup.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "add_device_to_group",
      target: "device_group",
      targetId: deviceGroup._id,
      details: {
        deviceGroupName: deviceGroup.name,
        deviceName: device.name,
        deviceId: device._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Device added to group successfully",
      deviceGroup,
    })
  } catch (error) {
    console.error("Add device to group error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Remove device from group
router.delete("/:id/devices/:deviceId", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find device group
    const deviceGroup = await DeviceGroup.findById(req.params.id)
    if (!deviceGroup) {
      return res.status(404).json({ message: "Device group not found" })
    }

    // Check if device is in group
    if (!deviceGroup.devices.includes(req.params.deviceId)) {
      return res.status(400).json({ message: "Device not in group" })
    }

    // Remove device from group
    deviceGroup.devices = deviceGroup.devices.filter(
      (id) => id.toString() !== req.params.deviceId
    )
    await deviceGroup.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "remove_device_from_group",
      target: "device_group",
      targetId: deviceGroup._id,
      details: {
        deviceGroupName: deviceGroup.name,
        deviceId: req.params.deviceId,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Device removed from group successfully",
      deviceGroup,
    })
  } catch (error) {
    console.error("Remove device from group error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
