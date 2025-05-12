import mongoose from "mongoose"

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    sshPort: {
      type: Number,
      default: 22,
    },
    sshUsername: {
      type: String,
      trim: true,
    },
    sshPassword: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance", "error"],
      default: "offline",
    },
    lastPing: {
      type: Date,
    },
    // Docker specific fields
    isDocker: {
      type: Boolean,
      default: false,
    },
    dockerId: {
      type: String,
      trim: true,
    },
    dockerStats: {
      cpuUsage: String,
      memoryUsage: String,
      networkIO: String,
      lastUpdated: Date,
    },
  },
  {
    timestamps: true,
  },
)

const Device = mongoose.model("Device", deviceSchema)

export default Device
