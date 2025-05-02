import mongoose from "mongoose";

const chatSchema = mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reciverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reciverName: {
      type: String,
      required: true,
    },
    reciverdob: {
      type: Date,
      required: true,
    },
    message: [
      {
        owner: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamps: true,
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.Schema("Chat", chatSchema);
