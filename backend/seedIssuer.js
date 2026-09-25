require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedIssuer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ No MONGO_URI specified in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB for Issuer seeding...");

    const issuerEmail = "issuer@gov.in";
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const issuerData = {
      name: "Government Credential Issuer",
      email: issuerEmail,
      password: hashedPassword,
      role: "ISSUER",
      organizationId: "GOV_ISSUER_001",
      company: "National DID & Verifiable Credential Authority",
      phone: "+91 11 2345 6789",
      address: "Ministry of Electronics & IT, Digital India Authority, New Delhi",
      experienceYears: 15,
      annualTurnoverCr: 500,
      completedProjects: 120
    };

    const updatedIssuer = await User.findOneAndUpdate(
      { email: issuerEmail },
      issuerData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("=========================================");
    console.log("✅ ISSUER USER SUCCESSFULLY ADDED TO DB:");
    console.log(JSON.stringify(updatedIssuer, null, 2));
    console.log("=========================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Issuer Seeding Failed:", error.message);
    process.exit(1);
  }
};

seedIssuer();
