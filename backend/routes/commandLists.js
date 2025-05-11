import express from "express"
import CommandList from "../models/CommandList.js"
import ActivityLog from "../models/ActivityLog.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get all command lists
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions (admin, team_lead, supervisor)
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const commandLists = await CommandList.find()
      .populate("createdBy", "username")
    
    res.json(commandLists)
  } catch (error) {
    console.error("Get command lists error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get command list by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions (admin, team_lead, supervisor)
    if (!["admin", "team_lead", "supervisor"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const commandList = await CommandList.findById(req.params.id)
      .populate("createdBy", "username")
    
    if (!commandList) {
      return res.status(404).json({ message: "Command list not found" })
    }

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "view_command_list",
      target: "command_list",
      targetId: commandList._id,
      details: {
        commandListName: commandList.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json(commandList)
  } catch (error) {
    console.error("Get command list error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create command list (team_lead, admin only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, commands } = req.body

    // Create command list
    const commandList = new CommandList({
      name,
      description,
      commands: commands || [],
      createdBy: req.user.id,
    })

    await commandList.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "create_command_list",
      target: "command_list",
      targetId: commandList._id,
      details: {
        commandListName: commandList.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.status(201).json({
      message: "Command list created successfully",
      commandList,
    })
  } catch (error) {
    console.error("Create command list error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update command list (team_lead, admin only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, commands } = req.body

    // Find command list
    const commandList = await CommandList.findById(req.params.id)
    if (!commandList) {
      return res.status(404).json({ message: "Command list not found" })
    }

    // Update fields
    if (name) commandList.name = name
    if (description !== undefined) commandList.description = description
    if (commands) commandList.commands = commands

    await commandList.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "update_command_list",
      target: "command_list",
      targetId: commandList._id,
      details: {
        commandListName: commandList.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Command list updated successfully",
      commandList,
    })
  } catch (error) {
    console.error("Update command list error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete command list (team_lead, admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find command list
    const commandList = await CommandList.findById(req.params.id)
    if (!commandList) {
      return res.status(404).json({ message: "Command list not found" })
    }

    // Delete command list
    await CommandList.deleteOne({ _id: commandList._id })

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "delete_command_list",
      target: "command_list",
      details: {
        commandListName: commandList.name,
        commandListId: commandList._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({ message: "Command list deleted successfully" })
  } catch (error) {
    console.error("Delete command list error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add command to list
router.post("/:id/commands", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, command, parameters, description } = req.body

    // Find command list
    const commandList = await CommandList.findById(req.params.id)
    if (!commandList) {
      return res.status(404).json({ message: "Command list not found" })
    }

    // Add command to list
    commandList.commands.push({
      name,
      command,
      parameters: parameters || [],
      description,
    })
    await commandList.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "add_command",
      target: "command_list",
      targetId: commandList._id,
      details: {
        commandListName: commandList.name,
        commandName: name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Command added successfully",
      commandList,
    })
  } catch (error) {
    console.error("Add command error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Remove command from list
router.delete("/:id/commands/:commandId", authMiddleware, async (req, res) => {
  try {
    // Check permissions
    if (!["admin", "team_lead"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Find command list
    const commandList = await CommandList.findById(req.params.id)
    if (!commandList) {
      return res.status(404).json({ message: "Command list not found" })
    }

    // Check if command exists
    const commandIndex = commandList.commands.findIndex(
      (cmd) => cmd._id.toString() === req.params.commandId
    )
    if (commandIndex === -1) {
      return res.status(404).json({ message: "Command not found in list" })
    }

    // Remove command from list
    const removedCommand = commandList.commands[commandIndex]
    commandList.commands.splice(commandIndex, 1)
    await commandList.save()

    // Log activity
    await ActivityLog.create({
      user: req.user.id,
      action: "remove_command",
      target: "command_list",
      targetId: commandList._id,
      details: {
        commandListName: commandList.name,
        commandName: removedCommand.name,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    })

    res.json({
      message: "Command removed successfully",
      commandList,
    })
  } catch (error) {
    console.error("Remove command error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
