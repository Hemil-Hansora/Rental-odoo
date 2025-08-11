import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    changeCurrentPassword,
    updateUserDetails,
} from "../controllers/user.controller"; 
import { verifyJWT } from "../middlewares";

const router = Router();

router.route("/signup").post(registerUser);
router.route("/signin").post(loginUser);

router.use(verifyJWT);
router.route("/logout").post(logoutUser);
router.route("/profile").get(getCurrentUser);
router.route("/change-password").patch(changeCurrentPassword);
router.route("/update").patch(updateUserDetails);
export default router;
