import { asyncHandler } from "../utils/async.handler.js";
import { User } from "../models/user.models.js";
import { ApiRespose } from "../utils/apiResponse.js";

const getUser = asyncHandler(async (req, res) => {
  const users = await User.distinct("username"); // distinct will return all unique usernames

  res.status(200).json(new ApiRespose(200, "got all users", users));
});

export { getUser };
