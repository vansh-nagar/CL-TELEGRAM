import { asyncHandler } from "../utils/async.handler.js";
import { ApiRespose } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";

const generateTokens = async (user) => {
  if (!user) {
    throw new ApiError("User not found", 400);
  }

  const foundUser = await User.findById(user._id);

  if (!foundUser) {
    throw new ApiError("User not found", 400);
  }

  const accessToken = await user.GenerateAccessToken();
  const refreshToken = await user.GenerateRefreshToken();
  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  [username, password].some((field) => {
    if (field.trim() === "") {
      throw new ApiError("All fields are required", 400);
    }
  });

  const findUser = await User.findOne({ username });
  if (findUser) {
    throw new ApiError("User already exists please sign in", 400);
  }

  const createdUser = await User.create({
    username,
    password,
  });

  if (!createdUser) {
    throw new ApiError("User not created", 400);
  }

  const { accessToken, refreshToken } = await generateTokens(createdUser);

  createdUser.accessToken = accessToken;
  await createdUser.save();

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  res
    .status(201)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiRespose(201, "user created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  [username, password].some((field) => {
    if (field.trim() === "") {
      throw new ApiError("All fields are required", 400);
    }
  });

  const findUser = await User.findOne({ username });
  if (!findUser) {
    throw new ApiError("User not found please sign up", 400);
  }

  const isPasswordMatched = await findUser.matchPassword(password);

  if (!isPasswordMatched) {
    throw new ApiError("Invalid Password", 400);
  }

  const { accessToken, refreshToken } = await generateTokens(findUser);

  findUser.accessToken = accessToken;
  await findUser.save();

  const data = await User.findById(findUser._id).select(
    "-password -chats -avatar"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  res
    .status(201)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiRespose(200, "user logedin succesfully", data));
});

export { registerUser, loginUser };
