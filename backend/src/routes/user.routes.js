import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../utils/verifyJwt.js";
import { sendMessage } from "../controllers/sendMessage.controller.js";
const router = Router();

// unsecured routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

//secrured routes

router.route("/sendMessage").post(sendMessage);

export default router;
