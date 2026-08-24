const express = require("express");
const router = express.Router();
const { 
  forgotPassword, 
  verifyOtp, 
  resetPassword, 
  register, 
  login,
  oauthLogin,
  updateProfile
} = require("../controllers/authController");

router.post("/forgot-password", forgotPassword);
router.post("/send-otp", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/register", register);
router.post("/login", login);
router.post("/oauth-login", oauthLogin);
router.post("/update-profile", updateProfile);
router.put("/update-profile", updateProfile);

module.exports = router;
