import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import { createServer } from "http"
import { Server } from "socket.io"

// Routes
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import hubRoutes from "./routes/hubs.js"
import deviceRoutes from "./routes/devices.js"
import logRoutes from "./routes/logs.js"
import deviceGroupRoutes from "./routes/deviceGroups.js"
import commandListRoutes from "./routes/commandLists.js"
import profileRoutes from "./routes/profiles.js"

// Middleware
import { authMiddleware } from "./middleware/auth.js"
import { logActivity } from "./middleware/logger.js"

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
})

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
)
app.use(express.json())

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id)

  socket.on("join_hub", (hubId) => {
    socket.join(hubId)
    console.log(`User joined hub: ${hubId}`)
  })

  socket.on("leave_hub", (hubId) => {
    socket.leave(hubId)
    console.log(`User left hub: ${hubId}`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Apply logging middleware to authenticated routes
app.use("/api/users", authMiddleware, logActivity, userRoutes)
app.use("/api/hubs", authMiddleware, logActivity, hubRoutes)
app.use("/api/devices", authMiddleware, logActivity, deviceRoutes)
app.use("/api/logs", authMiddleware, logActivity, logRoutes)
app.use("/api/device-groups", authMiddleware, logActivity, deviceGroupRoutes)
app.use("/api/command-lists", authMiddleware, logActivity, commandListRoutes)
app.use("/api/profiles", authMiddleware, logActivity, profileRoutes)

// Auth routes (no logging middleware for login)
app.use("/api/auth", authRoutes)

// Root route
app.get("/", (req, res) => {
  res.send("AIoT Monitor API is running")
})

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aiot-monitor")
  .then(() => {
    console.log("Connected to MongoDB")
    // Create admin user if not exists
    import("./utils/createAdmin.js").then((module) => module.default())
  })
  .catch((err) => console.error("MongoDB connection error:", err))

// Start server
const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export { io }
