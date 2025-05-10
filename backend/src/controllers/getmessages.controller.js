import { asyncHandler } from "../utils/async.handler.js";
import { Message } from "../models/message.models.js";
import mongoose from "mongoose";

const getMessages = asyncHandler(async (req, res) => {
  const { sender, receiver } = req.query;

  const foundMessage = await Message.find({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender },
    ],
  }).sort({ createdAt: 1 });

  res.send(foundMessage);
});

export { getMessages };
