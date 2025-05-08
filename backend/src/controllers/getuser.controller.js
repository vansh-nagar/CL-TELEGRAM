import { asyncHandler } from "../utils/async.handler.js";
import { User } from "../models/user.models.js";
import { ApiRespose } from "../utils/apiResponse.js";

const getUser = asyncHandler(async (req, res) => {
  //

  const Inputparams = req.query.input;
  console.log(Inputparams);

  const users = await User.find({
    username: { $regex: Inputparams, $options: "i" },
  }).select("-password   -accessToken -contact");

  res.status(200).json(new ApiRespose(200, "got all users", users));
});

export { getUser };
