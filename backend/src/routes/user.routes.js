import { Router } from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../utils/verifyJwt.js";
import { getUser, getContacts } from "../controllers/getuser.controller.js";
import { upload } from "../middleware/multer.js";
import { getMessages } from "../controllers/getmessages.controller.js";
const router = Router();

// unsecured routes
router.route("/register").post(upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);

//secrured routes
router.route("/getUsers").get(getUser);
router.route("/getcontact").get(verifyJwt, getContacts);
router.route("/getMessages").get(verifyJwt, getMessages);

export default router;
