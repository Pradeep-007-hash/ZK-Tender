const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  organizationId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  companyName: { 
    type: String, 
    required: [true, "Company name is required"], 
    trim: true 
  },
  organizationType: { 
    type: String, 
    required: [true, "Organization type is required"],
    enum: [
      "Private Limited", 
      "Public Limited", 
      "Partnership", 
      "LLP", 
      "Sole Proprietorship", 
      "Government Organization", 
      "Startup", 
      "Other"
    ] 
  },
  registrationNumber: { 
    type: String, 
    required: [true, "Registration number is required"], 
    trim: true 
  },
  gstNumber: { 
    type: String, 
    trim: true,
    uppercase: true 
  },
  panNumber: { 
    type: String, 
    trim: true,
    uppercase: true 
  },
  cinNumber: { 
    type: String, 
    trim: true,
    uppercase: true 
  },
  yearEstablished: { 
    type: Number, 
    min: 1800, 
    max: new Date().getFullYear() 
  },
  companySize: { 
    type: String, 
    enum: ["Micro", "Small", "Medium", "Large", "Enterprise"],
    default: "Micro" 
  },
  businessCategory: { 
    type: String, 
    required: [true, "Business category is required"],
    enum: [
      "IT & Software", 
      "Construction", 
      "Goods & Materials", 
      "Consultancy", 
      "Healthcare", 
      "Infrastructure", 
      "Services", 
      "Manufacturing", 
      "Other"
    ] 
  },
  website: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, "Email address is required"], 
    lowercase: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    required: [true, "Phone number is required"], 
    trim: true 
  },
  address: { 
    type: String, 
    required: [true, "Registered address is required"], 
    trim: true 
  },
  state: { 
    type: String, 
    required: [true, "State is required"], 
    trim: true 
  },
  district: { 
    type: String, 
    required: [true, "District is required"], 
    trim: true 
  },
  city: { 
    type: String, 
    required: [true, "City is required"], 
    trim: true 
  },
  pincode: { 
    type: String, 
    required: [true, "Pincode is required"], 
    trim: true 
  },
  contactPerson: { 
    type: String, 
    required: [true, "Contact person name is required"], 
    trim: true 
  },
  designation: { 
    type: String, 
    required: [true, "Designation is required"], 
    trim: true 
  },
  verificationStatus: { 
    type: String, 
    enum: ["PENDING", "VERIFIED", "REJECTED"], 
    default: "PENDING" 
  },
  verifiedAt: { 
    type: Date, 
    default: null 
  },
  accountStatus: { 
    type: String, 
    enum: ["ACTIVE", "SUSPENDED", "INACTIVE"], 
    default: "ACTIVE" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Organization", organizationSchema);
