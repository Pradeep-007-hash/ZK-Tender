require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ No MONGO_URI specified in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB for Admin seeding...");

    const adminEmail = "officer@gov.in";
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const adminData = {
      name: "Government Officer",
      email: adminEmail,
      password: hashedPassword,
      role: "AUTHORITY",
      organizationId: "GOV001"
    };

    const updatedAdmin = await User.findOneAndUpdate(
      { email: adminEmail },
      adminData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("=========================================");
    console.log("✅ ADMIN USER SUCCESSFULLY ADDED TO DB:");
    console.log(JSON.stringify(updatedAdmin, null, 2));
    console.log("=========================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin Seeding Failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
