import { Router } from "express";
import { sendSignupOtp, verifySignupOtp } from "../controllers/user/auth.otp.controller";
import { registerUserAfterOtp } from "../controllers/user/auth.controller";
import { verifyUser } from "../middleware/user.auth.middleware";
import { meUser, loginUser, logoutUser } from "../controllers/user/auth.session.controller"; 

const router = Router();

// OTP flow
router.post("/auth/send-otp", sendSignupOtp);
router.post("/auth/verify-otp", verifySignupOtp);
router.post("/auth/register", registerUserAfterOtp);

// session
router.post("/auth/login", loginUser);
router.post("/auth/logout", logoutUser);
router.get("/auth/me", verifyUser, meUser);

export default router;
