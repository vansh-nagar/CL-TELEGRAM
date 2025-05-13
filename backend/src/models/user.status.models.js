import mongoose from "mongoose";

const userStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  lastSeen: {
    type: Date,
    default: Date.now(),
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isWriting: {
    type: Boolean,
    default: false,
  },
  onCall: {
    type: Boolean,
    default: false,
  },
  currentSocketId: {
    type: String,
    default: null,
  },
});

export const Status = mongoose.model("Status", userStatusSchema);
