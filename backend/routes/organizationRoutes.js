const express = require("express");
const router = express.Router();
const {
  createOrganization,
  getVendorOrganization,
  updateVendorOrganization,
  getOrganizationById,
  verifyOrganization
} = require("../controllers/organizationController");

// Vendor Organization Profile Endpoints
router.post("/", createOrganization);
router.get("/me", getVendorOrganization);
router.put("/me", updateVendorOrganization);

// Authority & By-ID Endpoints
router.get("/:id", getOrganizationById);
router.put("/:id/verify", verifyOrganization);

module.exports = router;
