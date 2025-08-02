import express from 'express';
import { sendOtp, verifyOtp, getUserFromCookie } from '../controllers/otpController.js'; // ✅ dono import karo

const router = express.Router();

router.post('/send-otp', sendOtp);        // 🔵 OTP bhejne waala route
router.post('/verify-otp', verifyOtp);    // 🟢 OTP verify karne waala route (missing tha)
router.get("/me", getUserFromCookie);


export default router;
