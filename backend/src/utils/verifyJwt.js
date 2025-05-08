import jwt from "jsonwebtoken";
import { asyncHandler } from "./async.handler.js";
import { ApiError } from "./apiError.js";
import { ApiRespose } from "./apiResponse.js";
import { User } from "../models/user.models.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //.reaplace - js method replace particular string from a string

    if (!token) {
      throw new ApiError("Token not found", 401);
    }

    const decoded = jwt.verify(token, process.env.refreshTokenSecret);

    const findUser = await User.findById(decoded.id).select(
      "-password  -createdAt -updatedAt"
    );

    if (!findUser) {
      return ApiRespose.error(res, "User not found", 404);
    }

    req.user = findUser; // add user to request object

    next();
  } catch (error) {
    console.log(error.message);
    throw new ApiError(400, "user not found");
  }
});

const verifyJwtFunction = async () => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //.reaplace - js method replace particular string from a string

    if (!token) {
      throw new ApiError("Token not found", 401);
    }

    const decoded = jwt.verify(token, process.env.accessTokenSecret);

    const findUser = await User.findById(decoded.id).select(
      "-password  -createdAt -updatedAt"
    );

    if (!findUser) {
      return ApiRespose.error(res, "User not found", 404);
    }

    req.user = findUser; // add user to request object

    next();
  } catch (error) {
    console.log(error.message);
    throw new ApiError(400, "user not found");
  }
};

export { verifyJwt, verifyJwtFunction };
