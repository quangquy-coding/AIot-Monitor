import mongoose from "mongoose"

const profileSchema = new mongoose.Schema(
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
    deviceGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceGroup",
      required: true,
    },
    commandList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommandList",
      required: true,
    },
    operators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

const Profile = mongoose.model("Profile", profileSchema)

export default Profile
