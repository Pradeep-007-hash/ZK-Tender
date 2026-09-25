const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedSystemAccounts = async () => {
    try {
        const User = require('./models/User');
        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        // 1. Seed Issuer Account (issuer@gov.in / Admin@123)
        await User.findOneAndUpdate(
            { email: "issuer@gov.in" },
            {
                name: "Government Credential Issuer",
                email: "issuer@gov.in",
                password: hashedPassword,
                role: "ISSUER",
                organizationId: "GOV_ISSUER_001",
                company: "National DID & Verifiable Credential Authority",
                phone: "+91 11 2345 6789",
                address: "Ministry of Electronics & IT, Digital India Authority, New Delhi"
            },
            { upsert: true, setDefaultsOnInsert: true }
        );

        // 2. Seed Authority Account (officer@gov.in / Admin@123)
        await User.findOneAndUpdate(
            { email: "officer@gov.in" },
            {
                name: "Government Officer",
                email: "officer@gov.in",
                password: hashedPassword,
                role: "AUTHORITY",
                organizationId: "GOV001",
                company: "Government Procurement Portal",
                phone: "+91 11 2233 4455",
                address: "Central Public Works Dept, New Delhi"
            },
            { upsert: true, setDefaultsOnInsert: true }
        );

        console.log("✅ Auto-seeded System Accounts in DB: issuer@gov.in & officer@gov.in");
    } catch (err) {
        console.warn("⚠️ System Accounts auto-seeding notice:", err.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully");
        await seedSystemAccounts();
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
    }
};

module.exports = connectDB;

