import { asyncHandler } from "../utils/async.handler.js";
import { Status } from "../models/user.status.models.js";
import { ApiError } from "../utils/apiError.js";
import mongoose from "mongoose";
import { ApiRespose } from "../utils/apiResponse.js";

const getUserStatus = asyncHandler(async (req, res) => {
  const to = req.query.to;
  const toObject = new mongoose.Types.ObjectId(to);

  const userStatus = await Status.findOne({
    userId: toObject,
  });

  res.send(userStatus);
});

export { getUserStatus };
