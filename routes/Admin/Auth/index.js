const express = require("express");
const router = express.Router();
const {
  adminsingin,
  emailVerification,
  fetchAllowedFeatures,
  getusers,
  updatebalance,
} = require("../../../controller/AdminController/adminAuth");
const { blockUnAuthorizeAccess_Admin } = require("../../../middleware/Auth");
// routes for admin account
router.post("/login", adminsingin);
// Email verification for admin
router.get("/verify/email/:id", emailVerification);
// upload many files with one field.
router.get("/getadmininfo", blockUnAuthorizeAccess_Admin);
router.get(
  "/fetch-features",
  blockUnAuthorizeAccess_Admin,
  fetchAllowedFeatures
);
// Getting users
router.get(
  "/getusers",
  blockUnAuthorizeAccess_Admin,
  getusers
);

router.post(
  "/updatebalance",
  blockUnAuthorizeAccess_Admin,
  updatebalance
);
module.exports = router;
