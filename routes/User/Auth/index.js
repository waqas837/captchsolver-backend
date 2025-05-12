const express = require("express");
const router = express.Router();
const {
  userSignUp,
  emailVerification,
  userSignIn,
  sendEmail_for_forgotPassword,
  reset_user_password,
  getuserinfo,
  createInvoice,
  checkoutSession,
} = require("../../../controller/UserController/userAuth");
const jwt = require("jsonwebtoken");
const { blockUnAuthorizeAccess_User } = require("../../../middleware/UserAuth");

router.post("/signup", userSignUp);
router.post("/login", userSignIn);
router.get("/verify/email/:id", emailVerification);
router.post("/forgotpassword/:email", sendEmail_for_forgotPassword);
router.put("/reset-password/:userid/:password", reset_user_password);
router.get("/auth", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.Jwt_Secret_User);
      let userid = decoded.userid;
      if (userid) {
        res.json({ success: true, message: "userid found", userid });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
});
router.get("/getuserinfo", blockUnAuthorizeAccess_User, getuserinfo);
router.post("/createInvoice", blockUnAuthorizeAccess_User, createInvoice);

// Stripe payment method
router.post(
  "/create-checkout-session",
  blockUnAuthorizeAccess_User,
  checkoutSession
);

module.exports = router;
