import { asyncHandler } from "../utils/async.handler.js";
import { User } from "../models/user.models.js";
import { ApiRespose } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

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

const getUserDetails = asyncHandler(async (req, res) => {
  console.log(req.query.input);
  const input = req.query.input;
  if (!input) {
    throw new ApiError(400, "input is req to fetch user data");
  }
  const user = await User.findById(input);
  if (!user) {
    throw new ApiError(500, "not able to fetch data");
  }

  res.status(200).json(user);
});

export { getUser, getContacts, getUserDetails };
