import { asyncHandler } from "../utils/async.handler.js";
import { User } from "../models/user.models.js";
import { ApiRespose } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { redisClient } from "../app.js";

const getUser = asyncHandler(async (req, res) => {
  const Inputparams = req.query.input;
  const users = await User.find({
    username: { $regex: Inputparams, $options: "i" },
  }).select("-password   -accessToken ");
  res.status(200).json(new ApiRespose(200, "got all users", users));
});

const getContacts = asyncHandler(async (req, res) => {
  const user = req.user;

  const data = await User.aggregate([
    {
      $match: { _id: user._id },
    },
    { $project: { contact: 1 } },
    { $unwind: "$contact" },
    {
      $lookup: {
        from: "users",
        localField: "contact.contactId",
        foreignField: "_id",
        as: "contact",
      },
    },
    { $unwind: "$contact" },
  ]);

  if (!data) {
    throw new ApiError(400, "data not found");
  }

  res.status(200).json(data);
});

export { getUser, getContacts };
