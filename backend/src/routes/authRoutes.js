
import express from "express";
import { localSignup, localSignIn, googleAuth ,getUserByIdController } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", localSignup);
router.post("/signin", localSignIn);
router.post("/google-auth", googleAuth);
router.get("/user/:id", getUserByIdController);

export default router;
