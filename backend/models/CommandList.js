import mongoose from "mongoose"

const commandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  command: {
    type: String,
    required: true,
  },
  parameters: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    trim: true,
  },
})

const commandListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    commands: [commandSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const CommandList = mongoose.model("CommandList", commandListSchema)

export default CommandList
