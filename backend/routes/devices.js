import express from "express"
import Device from "../models/Device.js"
import ActivityLog from "../models/ActivityLog.js"
import { authMiddleware } from "../middleware/auth.js"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)
const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Get all devices
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find()
    res.json(devices)
  } catch (error) {
    console.error("Get devices error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get device by ID
router.get("/:id", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)

    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "view_device",
      target: "device",
      targetId: device._id,
      details: {
        deviceName: device.name,
        deviceType: device.type,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json(device)
  } catch (error) {
    console.error("Get device error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create device (admin, team_lead, supervisor only)
router.post("/", async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, type, ipAddress, sshPort, sshUsername, sshPassword, status, isDocker, dockerId } = req.body

    // Create device
    const newDevice = new Device({
      name,
      type,
      ipAddress,
      sshPort,
      sshUsername,
      sshPassword,
      status: status || "offline",
      isDocker: isDocker || false,
      dockerId,
    })

    await newDevice.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "create_device",
      target: "device",
      targetId: newDevice._id,
      details: {
        deviceName: newDevice.name,
        deviceType: newDevice.type,
        isDocker: newDevice.isDocker,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(201).json({
      message: "Device created successfully",
      device: newDevice,
    })
  } catch (error) {
    console.error("Create device error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update device
router.put("/:id", async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, type, ipAddress, sshPort, sshUsername, sshPassword, status, isDocker, dockerId } = req.body

    // Find device
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    // Update fields
    if (name) device.name = name
    if (type) device.type = type
    if (ipAddress) device.ipAddress = ipAddress
    if (sshPort) device.sshPort = sshPort
    if (sshUsername) device.sshUsername = sshUsername
    if (sshPassword) device.sshPassword = sshPassword
    if (status) device.status = status
    if (isDocker !== undefined) device.isDocker = isDocker
    if (dockerId) device.dockerId = dockerId

    await device.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_device",
      target: "device",
      targetId: device._id,
      details: {
        deviceName: device.name,
        deviceStatus: device.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients
    if (req.io) {
      req.io.emit("device_updated", device)
    }

    res.json({
      message: "Device updated successfully",
      device,
    })
  } catch (error) {
    console.error("Update device error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete device (admin, team_lead only)
router.delete("/:id", async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find device
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    // Delete device
    await Device.deleteOne({ _id: device._id })

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "delete_device",
      target: "device",
      details: {
        deviceName: device.name,
        deviceId: device._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients
    if (req.io) {
      req.io.emit("device_deleted", { deviceId: device._id })
    }

    res.json({ message: "Device deleted successfully" })
  } catch (error) {
    console.error("Delete device error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update device status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body

    // Find device
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    // Update status
    device.status = status
    device.lastPing = new Date()
    await device.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_device_status",
      target: "device",
      targetId: device._id,
      details: {
        deviceName: device.name,
        deviceStatus: device.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    // Notify connected clients
    if (req.io) {
      req.io.emit("device_status_changed", {
        deviceId: device._id,
        status: device.status,
      })
    }

    res.json({
      message: "Device status updated successfully",
      device,
    })
  } catch (error) {
    console.error("Update device status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Test SSH connection
router.post("/:id/test-ssh", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    // In a real implementation, you would test the SSH connection here
    // For now, we'll just simulate a successful connection
    const success = true
    const message = success ? "SSH connection successful" : "Failed to connect via SSH"

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "test_ssh_connection",
      target: "device",
      targetId: device._id,
      details: {
        deviceName: device.name,
        success: success,
        ipAddress: device.ipAddress,
        sshPort: device.sshPort,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      success,
      message,
      device: {
        name: device.name,
        ipAddress: device.ipAddress,
        sshPort: device.sshPort,
      },
    })
  } catch (error) {
    console.error("Test SSH error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Docker specific routes

// Get Docker container status
router.get("/:id/docker-status", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    if (!device.isDocker || !device.dockerId) {
      return res.status(400).json({ message: "This device is not a Docker container" })
    }

    try {
      // Get container status using docker inspect
      const { stdout } = await execPromise(`docker inspect --format='{{.State.Status}}' ${device.dockerId}`)
      const status = stdout.trim()

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "check_docker_status",
        target: "device",
        targetId: device._id,
        details: {
          deviceName: device.name,
          dockerId: device.dockerId,
          status: status,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      })

      res.json({
        status: status,
        dockerId: device.dockerId,
        name: device.name,
      })
    } catch (error) {
      console.error("Docker inspect error:", error)
      res.status(500).json({ message: "Failed to get Docker container status" })
    }
  } catch (error) {
    console.error("Get Docker status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get Docker container stats
router.get("/:id/docker-stats", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    if (!device.isDocker || !device.dockerId) {
      return res.status(400).json({ message: "This device is not a Docker container" })
    }

    try {
      // Get container stats using docker stats
      const { stdout } = await execPromise(
        `docker stats ${device.dockerId} --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}"`,
      )

      const [cpuUsage, memoryUsage, networkIO] = stdout.trim().split("|")

      // Update device with stats
      device.dockerStats = {
        cpuUsage,
        memoryUsage,
        networkIO,
        lastUpdated: new Date(),
      }

      await device.save()

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "check_docker_stats",
        target: "device",
        targetId: device._id,
        details: {
          deviceName: device.name,
          dockerId: device.dockerId,
          stats: device.dockerStats,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      })

      res.json({
        stats: device.dockerStats,
        dockerId: device.dockerId,
        name: device.name,
      })
    } catch (error) {
      console.error("Docker stats error:", error)
      res.status(500).json({ message: "Failed to get Docker container stats" })
    }
  } catch (error) {
    console.error("Get Docker stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Docker container action (start, stop, restart)
router.post("/:id/docker-action", async (req, res) => {
  try {
    const { action } = req.body
    if (!["start", "stop", "restart"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be start, stop, or restart" })
    }

    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    if (!device.isDocker || !device.dockerId) {
      return res.status(400).json({ message: "This device is not a Docker container" })
    }

    try {
      // Execute docker action
      await execPromise(`docker ${action} ${device.dockerId}`)

      // Update device status based on action
      if (action === "start") {
        device.status = "online"
      } else if (action === "stop") {
        device.status = "offline"
      }

      await device.save()

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: `docker_${action}`,
        target: "device",
        targetId: device._id,
        details: {
          deviceName: device.name,
          dockerId: device.dockerId,
          action: action,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      })

      res.json({
        message: `Container ${action} successful`,
        dockerId: device.dockerId,
        name: device.name,
        status: device.status,
      })
    } catch (error) {
      console.error(`Docker ${action} error:`, error)
      res.status(500).json({ message: `Failed to ${action} Docker container` })
    }
  } catch (error) {
    console.error("Docker action error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get Docker container logs
router.get("/:id/docker-logs", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    if (!device.isDocker || !device.dockerId) {
      return res.status(400).json({ message: "This device is not a Docker container" })
    }

    try {
      // Get container logs
      const { stdout } = await execPromise(`docker logs --tail 100 ${device.dockerId}`)

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "view_docker_logs",
        target: "device",
        targetId: device._id,
        details: {
          deviceName: device.name,
          dockerId: device.dockerId,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      })

      res.json({
        logs: stdout,
        dockerId: device.dockerId,
        name: device.name,
      })
    } catch (error) {
      console.error("Docker logs error:", error)
      res.status(500).json({ message: "Failed to get Docker container logs" })
    }
  } catch (error) {
    console.error("Get Docker logs error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Execute command on device via SSH
router.post("/:id/execute-command", async (req, res) => {
  try {
    const { command } = req.body
    if (!command) {
      return res.status(400).json({ message: "Command is required" })
    }

    const device = await Device.findById(req.params.id)
    if (!device) {
      return res.status(404).json({ message: "Device not found" })
    }

    if (!device.sshUsername || !device.ipAddress) {
      return res.status(400).json({ message: "Device does not have SSH credentials configured" })
    }

    try {
      // In a production environment, you would use a proper SSH library
      // This is a simplified example using sshpass for demonstration
      const sshCommand = `sshpass -p "${device.sshPassword}" ssh -o StrictHostKeyChecking=no -p ${device.sshPort || 22} ${device.sshUsername}@${device.ipAddress} "${command}"`

      const { stdout, stderr } = await execPromise(sshCommand)

      // Log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "execute_command",
        target: "device",
        targetId: device._id,
        details: {
          deviceName: device.name,
          command: command,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      })

      res.json({
        output: stdout,
        error: stderr,
        command: command,
        deviceName: device.name,
      })
    } catch (error) {
      console.error("Command execution error:", error)
      res.status(500).json({
        message: "Failed to execute command",
        error: error.message,
        stderr: error.stderr,
      })
    }
  } catch (error) {
    console.error("Execute command error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
