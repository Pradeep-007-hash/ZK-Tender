const Organization = require("../models/Organization");
const User = require("../models/User");

// Utility helper to auto-generate unique organizationId
const generateOrgId = () => {
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VEN-${randomHex}`;
};

// 1. Create Vendor Organization (POST /api/organizations)
exports.createOrganization = async (req, res) => {
  const {
    userEmail,
    companyName,
    organizationType,
    registrationNumber,
    gstNumber,
    panNumber,
    cinNumber,
    yearEstablished,
    companySize,
    businessCategory,
    website,
    email,
    phone,
    address,
    state,
    district,
    city,
    pincode,
    contactPerson,
    designation
  } = req.body;

  // Validation: Required fields
  if (
    !companyName || 
    !organizationType || 
    !registrationNumber || 
    !businessCategory || 
    !email || 
    !phone || 
    !address || 
    !state || 
    !district || 
    !city || 
    !pincode || 
    !contactPerson || 
    !designation
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required organization profile fields."
    });
  }

  // CIN Requirement for Private / Public Limited
  if (
    (organizationType === "Private Limited" || organizationType === "Public Limited") && 
    !cinNumber
  ) {
    return res.status(400).json({
      success: false,
      message: "CIN Number is required for Private Limited and Public Limited organizations."
    });
  }

  // Validation: Year Established
  const currentYear = new Date().getFullYear();
  if (yearEstablished && (yearEstablished < 1800 || yearEstablished > currentYear)) {
    return res.status(400).json({
      success: false,
      message: `Year established must be between 1800 and ${currentYear}.`
    });
  }

  // Validation: Pincode (6 digits)
  if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 6-digit Indian PIN code."
    });
  }

  // Validation: PAN Format (if provided)
  if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim().toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid PAN number format. Example: ABCDE1234F"
    });
  }

  try {
    const cleanEmail = (email || userEmail).toLowerCase().trim();

    // Auto-generate organizationId
    const organizationId = generateOrgId();

    const newOrg = new Organization({
      organizationId,
      companyName: companyName.trim(),
      organizationType,
      registrationNumber: registrationNumber.trim(),
      gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : "",
      panNumber: panNumber ? panNumber.trim().toUpperCase() : "",
      cinNumber: cinNumber ? cinNumber.trim().toUpperCase() : "",
      yearEstablished: parseInt(yearEstablished) || currentYear,
      companySize: companySize || "Micro",
      businessCategory,
      website: website ? website.trim() : "",
      email: cleanEmail,
      phone: phone.trim(),
      address: address.trim(),
      state: state.trim(),
      district: district.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      contactPerson: contactPerson.trim(),
      designation: designation.trim(),
      verificationStatus: "PENDING",
      verifiedAt: null,
      accountStatus: "ACTIVE"
    });

    await newOrg.save();
    console.log(`[ORGANIZATION CREATED] Saved ${newOrg.companyName} (${organizationId}) in MongoDB`);

    // Associate vendor user with organizationId
    if (userEmail) {
      await User.findOneAndUpdate(
        { email: userEmail.toLowerCase().trim() },
        { organizationId, company: companyName.trim() }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Organization profile created successfully!",
      organization: newOrg
    });
  } catch (error) {
    console.error("[CREATE ORGANIZATION ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating organization profile.",
      error: error.message
    });
  }
};

// 2. Get Logged-in Vendor Organization (GET /api/organizations/me)
exports.getVendorOrganization = async (req, res) => {
  const userEmail = req.query.email || req.headers["x-user-email"];
  const orgId = req.query.organizationId || req.headers["x-organization-id"];

  try {
    let org = null;

    if (orgId) {
      org = await Organization.findOne({ organizationId: orgId });
    }

    if (!org && userEmail) {
      const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
      if (user && user.organizationId) {
        org = await Organization.findOne({ organizationId: user.organizationId });
      }
      if (!org) {
        org = await Organization.findOne({ email: userEmail.toLowerCase().trim() });
      }
    }

    if (!org) {
      return res.status(200).json({
        success: true,
        exists: false,
        organization: null,
        message: "No organization profile found for this vendor user."
      });
    }

    return res.status(200).json({
      success: true,
      exists: true,
      organization: org
    });
  } catch (error) {
    console.error("[GET ORGANIZATION ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching organization profile."
    });
  }
};

// 3. Update Vendor Organization (PUT /api/organizations/me)
exports.updateVendorOrganization = async (req, res) => {
  const {
    organizationId,
    userEmail,
    companyName,
    organizationType,
    registrationNumber,
    gstNumber,
    panNumber,
    cinNumber,
    yearEstablished,
    companySize,
    businessCategory,
    website,
    email,
    phone,
    address,
    state,
    district,
    city,
    pincode,
    contactPerson,
    designation
  } = req.body;

  // Stripping sensitive authority fields: verificationStatus, verifiedAt, accountStatus cannot be updated by vendors
  try {
    let org = null;

    if (organizationId) {
      org = await Organization.findOne({ organizationId });
    }

    const targetEmail = (userEmail || email).toLowerCase().trim();
    if (!org && targetEmail) {
      org = await Organization.findOne({ email: targetEmail });
      if (!org) {
        const user = await User.findOne({ email: targetEmail });
        if (user && user.organizationId) {
          org = await Organization.findOne({ organizationId: user.organizationId });
        }
      }
    }

    if (!org) {
      // If organization does not exist yet, invoke create handler
      return exports.createOrganization(req, res);
    }

    // CIN Requirement Check
    const targetOrgType = organizationType || org.organizationType;
    if (
      (targetOrgType === "Private Limited" || targetOrgType === "Public Limited") &&
      !cinNumber && !org.cinNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "CIN Number is required for Private Limited and Public Limited organizations."
      });
    }

    if (companyName) org.companyName = companyName.trim();
    if (organizationType) org.organizationType = organizationType;
    if (registrationNumber) org.registrationNumber = registrationNumber.trim();
    if (gstNumber !== undefined) org.gstNumber = gstNumber.trim().toUpperCase();
    if (panNumber !== undefined) org.panNumber = panNumber.trim().toUpperCase();
    if (cinNumber !== undefined) org.cinNumber = cinNumber.trim().toUpperCase();
    if (yearEstablished) org.yearEstablished = parseInt(yearEstablished);
    if (companySize) org.companySize = companySize;
    if (businessCategory) org.businessCategory = businessCategory;
    if (website !== undefined) org.website = website.trim();
    if (email) org.email = email.toLowerCase().trim();
    if (phone) org.phone = phone.trim();
    if (address) org.address = address.trim();
    if (state) org.state = state.trim();
    if (district) org.district = district.trim();
    if (city) org.city = city.trim();
    if (pincode) org.pincode = pincode.trim();
    if (contactPerson) org.contactPerson = contactPerson.trim();
    if (designation) org.designation = designation.trim();

    await org.save();
    console.log(`[ORGANIZATION UPDATED] Saved changes for ${org.companyName} (${org.organizationId}) in MongoDB`);

    // Sync company name in User model if applicable
    if (targetEmail) {
      await User.findOneAndUpdate(
        { email: targetEmail },
        { company: org.companyName, organizationId: org.organizationId }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Organization profile updated successfully!",
      organization: org
    });
  } catch (error) {
    console.error("[UPDATE ORGANIZATION ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating organization profile.",
      error: error.message
    });
  }
};

// 4. Get Organization by ID (GET /api/organizations/:id)
exports.getOrganizationById = async (req, res) => {
  const { id } = req.params;

  try {
    const org = await Organization.findOne({
      $or: [{ organizationId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }]
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found."
      });
    }

    return res.status(200).json({
      success: true,
      organization: org
    });
  } catch (error) {
    console.error("[GET ORG BY ID ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving organization."
    });
  }
};

// 5. Verify / Authority Status Control (PUT /api/organizations/:id/verify)
exports.verifyOrganization = async (req, res) => {
  const { id } = req.params;
  const { verificationStatus, accountStatus } = req.body;

  try {
    const org = await Organization.findOne({
      $or: [{ organizationId: id }, { _id: id }]
    });

    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found." });
    }

    if (verificationStatus) {
      org.verificationStatus = verificationStatus;
      if (verificationStatus === "VERIFIED") {
        org.verifiedAt = new Date();
      }
    }

    if (accountStatus) {
      org.accountStatus = accountStatus;
    }

    await org.save();
    console.log(`[ORGANIZATION VERIFIED BY AUTHORITY] ${org.companyName} set to ${org.verificationStatus}`);

    return res.status(200).json({
      success: true,
      message: `Organization status updated to ${org.verificationStatus}`,
      organization: org
    });
  } catch (error) {
    console.error("[VERIFY ORG ERROR]", error);
    return res.status(500).json({ success: false, message: "Server error updating verification status." });
  }
};
