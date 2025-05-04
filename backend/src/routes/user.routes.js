import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../utils/verifyJwt.js";
import { getUser } from "../controllers/getuser.controller.js";

const router = Router();

// unsecured routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

//secrured routes
router.route("/getUsers").get(getUser);

export default router;
