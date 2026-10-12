require('dotenv').config();
const mongoose = require('mongoose');
const Tender = require('./models/Tender');

const rawTenders = [
  {
    "tenderReferenceNumber": "TN-PWD-2026-INFRA-001",
    "tenderTitle": "Construction of Four-Lane Bypass Highway and Smart Toll Plaza",
    "department": "Tamil Nadu Public Works Department (TN-PWD)",
    "tenderType": "Open Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "Infrastructure",
    "tenderDescription": "Engineering, Procurement, and Construction (EPC) of a 24.5 km 4-lane bypass highway including automated RFID-enabled smart tolling infrastructure and solar lighting system.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 450000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 4500000,
        "emdExemptionApplicable": "Yes (MSEs & Startups Exempt)"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 25000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Thoothukudi",
      "city": "Kovilpatti",
      "workLocation": "NH-7 Bypass Stretch Km 12 to 36.5",
      "contractDuration": 24,
      "durationUnit": "Months",
      "expectedStartDate": "2026-12-01",
      "expectedCompletionDate": "2028-11-30",
      "detailedScope": "Excavation, bituminous concrete pavement layout, drainage construction, smart traffic monitoring systems, and 3-year structural maintenance."
    },
    "timeline": {
      "publicationDate": "2026-10-15T10:00:00Z",
      "bidStartDate": "2026-10-20T10:00:00Z",
      "preBidMeeting": "2026-10-28T11:00:00Z",
      "clarificationDeadline": "2026-11-02T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-15T17:00:00Z",
      "techEvalStartDate": "2026-11-16T10:00:00Z",
      "techEvalEndDate": "2026-11-22T17:00:00Z",
      "finEvalStartDate": "2026-11-24T10:00:00Z",
      "finEvalEndDate": "2026-11-26T17:00:00Z",
      "expectedAwardDate": "2026-12-01T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "Minimum Annual Financial Turnover",
        "requirement": "₹150,000,000 average over last 3 fiscal years",
        "verificationType": "Zero-Knowledge Proof (ZK-Financial-Proof)"
      },
      {
        "criterion": "Prior Highway Construction Experience",
        "requirement": "Completion of at least 2 similar 4-lane road projects (>₹200 Cr each)",
        "verificationType": "Authority Verification / Verifiable Credential"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "GST Registration Certificate", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Technical Capability Statement & Machinery List", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"},
      {"documentName": "Audited Financial Statements (Last 3 Years)", "isMandatory": true, "verificationType": "ZK-Proof Verification"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 120,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "Technical Qualification & Past Experience", "weightPercentage": 40},
        {"criterionName": "Methodology & Deployment Schedule", "weightPercentage": 20},
        {"criterionName": "Financial Bid Evaluation", "weightPercentage": 40}
      ]
    },
    "zkpRule": "Turnover ≥ ₹15 Cr & 2 Prior Projects (Groth16 Range Proof)"
  },
  {
    "tenderReferenceNumber": "TN-DICT-2026-IT-002",
    "tenderTitle": "Development of Decentralized Citizen Identity and Document Verification Portal",
    "department": "Department of Information & Communication Tech (TN-DICT)",
    "tenderType": "E-Tender",
    "procurementMethod": "Request for Proposal (RFP)",
    "category": "IT & Software",
    "tenderDescription": "Design, development, and deployment of a blockchain-backed web and mobile platform for issuance and verification of W3C-compliant Verifiable Credentials.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 85000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Percentage of Estimated Value",
        "emdFixedAmount": 1700000,
        "emdExemptionApplicable": "Yes (MSEs & Startups Exempt)"
      },
      "tenderDocumentFee": {
        "feeRequired": "Free (No Document Fee)",
        "feeAmount": 0,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Chennai",
      "city": "Chennai",
      "workLocation": "State Data Centre, Perungudi, Chennai",
      "contractDuration": 12,
      "durationUnit": "Months",
      "expectedStartDate": "2026-11-15",
      "expectedCompletionDate": "2027-11-14",
      "detailedScope": "Full-stack Web3 application development using Node.js, React, Solidity, and Circom ZK-circuits with 24-month maintenance support."
    },
    "timeline": {
      "publicationDate": "2026-10-14T09:00:00Z",
      "bidStartDate": "2026-10-18T10:00:00Z",
      "preBidMeeting": "2026-10-25T14:00:00Z",
      "clarificationDeadline": "2026-10-29T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-08T17:00:00Z",
      "techEvalStartDate": "2026-11-09T10:00:00Z",
      "techEvalEndDate": "2026-11-11T17:00:00Z",
      "finEvalStartDate": "2026-11-12T10:00:00Z",
      "finEvalEndDate": "2026-11-13T17:00:00Z",
      "expectedAwardDate": "2026-11-15T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "ISO 27001 Certification",
        "requirement": "Active Information Security Management System certification",
        "verificationType": "Authority Verification"
      },
      {
        "criterion": "CMMI Level 3 or Higher",
        "requirement": "Active appraisal status for software engineering practices",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "Company Incorporation Certificate", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Technical Architecture Proposal", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"},
      {"documentName": "Audited Balance Sheets (2023-2026)", "isMandatory": true, "verificationType": "ZK-Proof Verification"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 90,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "Technical Solution Architecture & Security Design", "weightPercentage": 50},
        {"criterionName": "Vendor Experience & Key Team Credentials", "weightPercentage": 20},
        {"criterionName": "Financial Commercial Quote", "weightPercentage": 30}
      ]
    },
    "zkpRule": "ISO 27001 & CMMI Level 3 + DID Attestation (ZK Proof)"
  },
  {
    "tenderReferenceNumber": "IN-TNEB-2026-PWR-003",
    "tenderTitle": "Installation of 50MW Grid-Connected Solar Photovoltaic Power Plant",
    "department": "Tamil Nadu Generation and Distribution Corp (TNEB)",
    "tenderType": "Open Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "Energy & Power",
    "tenderDescription": "Design, supply, installation, testing, and commissioning of a 50 MW ground-mounted solar PV power project with 5 years of comprehensive O&M.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 2200000000,
      "bidPriceRestriction": "Maximum Bid Only",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 22000000,
        "emdExemptionApplicable": "No Exemption Allowed"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 50000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Tirunelveli",
      "city": "Kayathar",
      "workLocation": "TNEB Solar Park Site Alpha",
      "contractDuration": 18,
      "durationUnit": "Months",
      "expectedStartDate": "2027-01-01",
      "expectedCompletionDate": "2028-06-30",
      "detailedScope": "Turnkey construction of 50 MW solar plant, 110 kV substation integration, transmission lines, and real-time SCADA telemetry."
    },
    "timeline": {
      "publicationDate": "2026-10-10T10:00:00Z",
      "bidStartDate": "2026-10-25T10:00:00Z",
      "preBidMeeting": "2026-11-05T11:00:00Z",
      "clarificationDeadline": "2026-11-10T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-30T17:00:00Z",
      "techEvalStartDate": "2026-12-01T10:00:00Z",
      "techEvalEndDate": "2026-12-10T17:00:00Z",
      "finEvalStartDate": "2026-12-15T10:00:00Z",
      "finEvalEndDate": "2026-12-18T17:00:00Z",
      "expectedAwardDate": "2027-01-01T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "Cumulative Executed Solar Capacity",
        "requirement": "Minimum 100 MW solar capacity commissioned in last 5 years",
        "verificationType": "Authority Verification"
      },
      {
        "criterion": "Net Worth Requirement",
        "requirement": "Positive net worth exceeding ₹500,000,000",
        "verificationType": "Zero-Knowledge Proof (ZK-Financial-Proof)"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "Commissioning Certificates from Electrical Inspectorate", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Solar PV Panel Tier-1 Tier Rating Proof", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 180,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Not Allowed",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "L1 (Lowest Financial Bid)",
      "weights": [
        {"criterionName": "Financial Commercial Price (L1 Method)", "weightPercentage": 100}
      ]
    },
    "zkpRule": "Net Worth ≥ ₹50 Cr & Capacity ≥ 100 MW (Groth16 Range Proof)"
  },
  {
    "tenderReferenceNumber": "IN-CMRL-2026-TRN-004",
    "tenderTitle": "Supply and Maintenance of Electric Bus Fleet for Metro Last-Mile Connectivity",
    "department": "Chennai Metro Rail Limited (CMRL)",
    "tenderType": "Two-Stage Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "Transportation",
    "tenderDescription": "Procurement of 100 low-floor 9-meter air-conditioned electric buses along with fast-charging depot infrastructure on Gross Cost Contract (GCC) model.",
    "financialTerms": {
      "budgetType": "Fixed Rate Contract",
      "estimatedTenderValue": 1200000000,
      "bidPriceRestriction": "Minimum + Maximum",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 12000000,
        "emdExemptionApplicable": "Yes (MSEs & Startups Exempt)"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 30000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Chennai",
      "city": "Chennai",
      "workLocation": "Koyambedu & Alandur Bus Depots",
      "contractDuration": 10,
      "durationUnit": "Years",
      "expectedStartDate": "2027-02-01",
      "expectedCompletionDate": "2037-01-31",
      "detailedScope": "Delivery of 100 electric buses within 8 months, installation of 20 ultra-fast DC chargers, and 10 years operational maintenance."
    },
    "timeline": {
      "publicationDate": "2026-10-12T10:00:00Z",
      "bidStartDate": "2026-10-22T10:00:00Z",
      "preBidMeeting": "2026-11-02T11:00:00Z",
      "clarificationDeadline": "2026-11-08T17:00:00Z",
      "bidSubmissionDeadline": "2026-12-05T17:00:00Z",
      "techEvalStartDate": "2026-12-06T10:00:00Z",
      "techEvalEndDate": "2026-12-15T17:00:00Z",
      "finEvalStartDate": "2026-12-20T10:00:00Z",
      "finEvalEndDate": "2026-12-23T17:00:00Z",
      "expectedAwardDate": "2027-02-01T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "OEM Manufacturing License",
        "requirement": "Original Equipment Manufacturer with active automotive production facility in India",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "Automotive Research Association of India (ARAI) Type Approval", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Battery Chemistry and Safety Test Certificates (AIS-156)", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Three Stage (Pre-Qual + Tech + Fin)",
      "bidValidityPeriodDays": 180,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "Vehicle Specifications & Battery Efficiency (kWh/km)", "weightPercentage": 35},
        {"criterionName": "Maintenance Plan & Spare Guarantee", "weightPercentage": 25},
        {"criterionName": "Per-Kilometer Commercial Rate Quote", "weightPercentage": 40}
      ]
    },
    "zkpRule": "OEM Automotive License & AIS-156 Safety Compliance (ZK-Proof)"
  },
  {
    "tenderReferenceNumber": "TN-HEALTH-2026-MED-005",
    "tenderTitle": "Supply, Installation, and Maintenance of Advanced Diagnostic MRI Systems",
    "department": "Tamil Nadu Health & Family Welfare Department (TN-HEALTH)",
    "tenderType": "Global Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "Healthcare",
    "tenderDescription": "Procurement of five 3.0 Tesla High-Field MRI scanners with multi-year Comprehensive Maintenance Contract (CMC) for government medical college hospitals.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 650000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 6500000,
        "emdExemptionApplicable": "No Exemption Allowed"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 15000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Madurai",
      "city": "Madurai",
      "workLocation": "Government Rajaji Hospital, Madurai & 4 Other Regional Centers",
      "contractDuration": 84,
      "durationUnit": "Months",
      "expectedStartDate": "2027-01-15",
      "expectedCompletionDate": "2034-01-14",
      "detailedScope": "Supply, turnkey civil/chiller site preparation, installation, operator training, and 7-year comprehensive maintenance."
    },
    "timeline": {
      "publicationDate": "2026-10-11T10:00:00Z",
      "bidStartDate": "2026-10-20T10:00:00Z",
      "preBidMeeting": "2026-11-01T11:00:00Z",
      "clarificationDeadline": "2026-11-06T17:00:00Z",
      "bidSubmissionDeadline": "2026-12-10T17:00:00Z",
      "techEvalStartDate": "2026-12-11T10:00:00Z",
      "techEvalEndDate": "2026-12-20T17:00:00Z",
      "finEvalStartDate": "2026-12-22T10:00:00Z",
      "finEvalEndDate": "2026-12-24T17:00:00Z",
      "expectedAwardDate": "2027-01-15T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "US-FDA or CE Certification",
        "requirement": "Equipment must possess active US-FDA or European CE medical device clearance",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "AERB (Atomic Energy Regulatory Board) Type Approval", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Principal Manufacturer Authorization Letter", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 150,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "Technical Specifications & Image Resolution Quality", "weightPercentage": 60},
        {"criterionName": "After-Sales Service Network & Uptime Guarantee", "weightPercentage": 10},
        {"criterionName": "Total Cost of Ownership (Equipment + 7yr CMC)", "weightPercentage": 30}
      ]
    },
    "zkpRule": "US-FDA / CE Clearance & AERB Nuclear Safety Verified (ZK-Proof)"
  },
  {
    "tenderReferenceNumber": "TN-SMART-2026-CNS-006",
    "tenderTitle": "Consultancy Services for Smart City Urban Mobility Master Plan",
    "department": "Tamil Nadu Urban Infrastructure & Smart Cities Mission (TN-SMART)",
    "tenderType": "Open Tender",
    "procurementMethod": "Request for Proposal (RFP)",
    "category": "Consultancy",
    "tenderDescription": "Engagement of an international urban planning consultancy to formulate a 15-year integrated mobility, pedestrianization, and transit-oriented development framework.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 35000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 700000,
        "emdExemptionApplicable": "Yes (MSEs & Startups Exempt)"
      },
      "tenderDocumentFee": {
        "feeRequired": "Free (No Document Fee)",
        "feeAmount": 0,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Coimbatore",
      "city": "Coimbatore",
      "workLocation": "Coimbatore Municipal Corporation Jurisdiction",
      "contractDuration": 9,
      "durationUnit": "Months",
      "expectedStartDate": "2026-12-15",
      "expectedCompletionDate": "2027-09-14",
      "detailedScope": "Traffic pattern GIS mapping, public transport optimization modeling, stakeholder consultations, and master plan publication."
    },
    "timeline": {
      "publicationDate": "2026-10-13T10:00:00Z",
      "bidStartDate": "2026-10-18T10:00:00Z",
      "preBidMeeting": "2026-10-27T11:00:00Z",
      "clarificationDeadline": "2026-10-31T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-20T17:00:00Z",
      "techEvalStartDate": "2026-11-21T10:00:00Z",
      "techEvalEndDate": "2026-11-25T17:00:00Z",
      "finEvalStartDate": "2026-11-27T10:00:00Z",
      "finEvalEndDate": "2026-11-28T17:00:00Z",
      "expectedAwardDate": "2026-12-15T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "Prior Urban Mobility Consultancy Projects",
        "requirement": "Successfully prepared mobility master plans for at least 2 cities with >1 Million population",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "CVs of Proposed Key Experts (Transport Planner, GIS Specialist)", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"},
      {"documentName": "Technical Approach & Methodology Presentation", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 90,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QBS (Quality Based Selection)",
      "weights": [
        {"criterionName": "Qualifications and Experience of Core Expert Panel", "weightPercentage": 50},
        {"criterionName": "Methodology, Work Plan, & AI-Simulations Proposed", "weightPercentage": 30},
        {"criterionName": "Firm Credentials & Regional Experience", "weightPercentage": 20}
      ]
    },
    "zkpRule": "Mobility Plans for ≥ 2 Metros (>1M Pop) (Attestation Verified)"
  },
  {
    "tenderReferenceNumber": "IN-TWAD-2026-CON-007",
    "tenderTitle": "Construction of Underground Sewage Treatment Plant (STP) using SBR Technology",
    "department": "Tamil Nadu Water Supply and Drainage Board (TWAD)",
    "tenderType": "Open Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "Construction",
    "tenderDescription": "Design, construction, installation, testing, and commissioning of a 45 MLD capacity Sequential Batch Reactor (SBR) based sewage treatment plant.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 580000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 5800000,
        "emdExemptionApplicable": "No Exemption Allowed"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 20000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Tiruchirappalli",
      "city": "Tiruchirappalli",
      "workLocation": "Kallakudi Zone 3 Wastewater Facility",
      "contractDuration": 18,
      "durationUnit": "Months",
      "expectedStartDate": "2026-12-20",
      "expectedCompletionDate": "2028-06-19",
      "detailedScope": "Civil earthworks, electro-mechanical pump installation, automated SCADA monitoring, and 5-year O&M period."
    },
    "timeline": {
      "publicationDate": "2026-10-09T10:00:00Z",
      "bidStartDate": "2026-10-19T10:00:00Z",
      "preBidMeeting": "2026-10-29T11:00:00Z",
      "clarificationDeadline": "2026-11-04T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-25T17:00:00Z",
      "techEvalStartDate": "2026-11-26T10:00:00Z",
      "techEvalEndDate": "2026-12-02T17:00:00Z",
      "finEvalStartDate": "2026-12-05T10:00:00Z",
      "finEvalEndDate": "2026-12-08T17:00:00Z",
      "expectedAwardDate": "2026-12-20T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "SBR STP Execution Track Record",
        "requirement": "Constructed at least one operational STP of minimum 30 MLD capacity",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "Pollution Control Board Consent to Establish (CTE) Clearance", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Bank Solvency Certificate (Minimum ₹15 Cr)", "isMandatory": true, "verificationType": "ZK-Proof Verification"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 120,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "L1 (Lowest Financial Bid)",
      "weights": [
        {"criterionName": "Financial Quote (L1 Evaluation)", "weightPercentage": 100}
      ]
    },
    "zkpRule": "Bank Solvency ≥ ₹15 Cr & Capacity ≥ 30 MLD (ZK-Proof)"
  },
  {
    "tenderReferenceNumber": "TN-AGRIC-2026-OTH-008",
    "tenderTitle": "Deployment of Drone-Based Remote Sensing and Crop Health Analytics Framework",
    "department": "Department of Agriculture & Farmers Welfare (TN-AGRIC)",
    "tenderType": "Limited Tender",
    "procurementMethod": "Request for Quotation (RFQ)",
    "category": "Other",
    "tenderDescription": "Multi-spectral agricultural drone surveying across 100,000 hectares of paddy cultivation for automated crop disease detection and yield prediction.",
    "financialTerms": {
      "budgetType": "Maximum Rate Ceiling",
      "estimatedTenderValue": 25000000,
      "bidPriceRestriction": "Maximum Bid Only",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 250000,
        "emdExemptionApplicable": "Yes (MSEs & Startups Exempt)"
      },
      "tenderDocumentFee": {
        "feeRequired": "Free (No Document Fee)",
        "feeAmount": 0,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Thanjavur",
      "city": "Thanjavur",
      "workLocation": "Thanjavur & Thiruvarur Agricultural Blocks",
      "contractDuration": 6,
      "durationUnit": "Months",
      "expectedStartDate": "2026-11-20",
      "expectedCompletionDate": "2027-05-19",
      "detailedScope": "Drone flight path execution, multi-spectral image processing, AI disease analysis, and cloud dashboard delivery."
    },
    "timeline": {
      "publicationDate": "2026-10-14T10:00:00Z",
      "bidStartDate": "2026-10-18T10:00:00Z",
      "preBidMeeting": "2026-10-24T11:00:00Z",
      "clarificationDeadline": "2026-10-27T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-05T17:00:00Z",
      "techEvalStartDate": "2026-11-06T10:00:00Z",
      "techEvalEndDate": "2026-11-09T17:00:00Z",
      "finEvalStartDate": "2026-11-10T10:00:00Z",
      "finEvalEndDate": "2026-11-12T17:00:00Z",
      "expectedAwardDate": "2026-11-20T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "DGCA Drone Operator License",
        "requirement": "Valid Director General of Civil Aviation drone pilot and operator authorization",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "DGCA UAV Fleet Registration Certificates", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Sample Multispectral Survey Dataset", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Single Cover",
      "bidValidityPeriodDays": 60,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "Spatial Resolution & Sensor Precision", "weightPercentage": 40},
        {"criterionName": "AI Analytical Model Accuracy Benchmark", "weightPercentage": 30},
        {"criterionName": "Per-Hectare Commercial Survey Quote", "weightPercentage": 30}
      ]
    },
    "zkpRule": "DGCA Drone License & Certified Fleet (ZK Attestation)"
  },
  {
    "tenderReferenceNumber": "IN-ELCOT-2026-IT-009",
    "tenderTitle": "Establishment of Tier-IV High-Performance AI Data Center",
    "department": "Electronics Corporation of Tamil Nadu (ELCOT)",
    "tenderType": "Global Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "IT & Software",
    "tenderDescription": "Turnkey engineering, procurement, and setup of a 10 MW liquid-cooled AI Data Center with dedicated GPU cluster racks and dual grid power feed.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 3200000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Fixed Amount",
        "emdFixedAmount": 32000000,
        "emdExemptionApplicable": "No Exemption Allowed"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 100000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Chengalpattu",
      "city": "Siruseri",
      "workLocation": "SIPCOT IT Park, Siruseri",
      "contractDuration": 15,
      "durationUnit": "Months",
      "expectedStartDate": "2027-01-10",
      "expectedCompletionDate": "2028-04-09",
      "detailedScope": "Civil shell construction, HVAC liquid cooling systems, high-voltage transformers, network fabric deployment, and Uptime Institute Tier-IV certification."
    },
    "timeline": {
      "publicationDate": "2026-10-08T10:00:00Z",
      "bidStartDate": "2026-10-22T10:00:00Z",
      "preBidMeeting": "2026-11-03T11:00:00Z",
      "clarificationDeadline": "2026-11-10T17:00:00Z",
      "bidSubmissionDeadline": "2026-12-15T17:00:00Z",
      "techEvalStartDate": "2026-12-16T10:00:00Z",
      "techEvalEndDate": "2026-12-24T17:00:00Z",
      "finEvalStartDate": "2026-12-28T10:00:00Z",
      "finEvalEndDate": "2026-12-30T17:00:00Z",
      "expectedAwardDate": "2027-01-10T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "Uptime Tier-IV Construction Experience",
        "requirement": "Constructed at least one Uptime certified Tier-III or Tier-IV Data Center in Asia",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "Uptime Institute Accredited Tier Specialist (ATS) Certification", "isMandatory": true, "verificationType": "DID Identity Attestation"},
      {"documentName": "Liquid Cooling Technical Schematics & PUE Rating Proof", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 180,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Not Allowed",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "PUE Efficiency Guarantee & Thermal Design", "weightPercentage": 40},
        {"criterionName": "Project Execution Schedule & SLA Commitment", "weightPercentage": 30},
        {"criterionName": "Commercial EPC Cost Proposal", "weightPercentage": 30}
      ]
    },
    "zkpRule": "Uptime Tier-IV ATS Credentials & PUE ≤ 1.25 (ZK Proof)"
  },
  {
    "tenderReferenceNumber": "IN-TNCLEAN-2026-INF-010",
    "tenderTitle": "Automated Bio-Methanation Plant Construction and Solid Waste Processing",
    "department": "Tamil Nadu Clean Environment Mission (TN-CLEAN)",
    "tenderType": "Open Tender",
    "procurementMethod": "Competitive Bidding",
    "category": "Infrastructure",
    "tenderDescription": "Design, construction, operation, and maintenance of a 200 Tons Per Day (TPD) wet municipal solid waste to Compressed Biogas (CBG) processing plant.",
    "financialTerms": {
      "budgetType": "Estimated Budget",
      "estimatedTenderValue": 380000000,
      "bidPriceRestriction": "No Restriction",
      "emdConfig": {
        "emdSecurityType": "Percentage of Estimated Value",
        "emdFixedAmount": 3800000,
        "emdExemptionApplicable": "Yes (MSEs & Startups Exempt)"
      },
      "tenderDocumentFee": {
        "feeRequired": "Fee Required",
        "feeAmount": 15000,
        "currency": "INR"
      }
    },
    "locationAndScope": {
      "country": "India",
      "state": "Tamil Nadu",
      "district": "Salem",
      "city": "Salem",
      "workLocation": "Chettichavadi Waste Processing Site",
      "contractDuration": 12,
      "durationUnit": "Months",
      "expectedStartDate": "2026-12-01",
      "expectedCompletionDate": "2027-11-30",
      "detailedScope": "Installation of pre-sorting segregator, anaerobic digesters, gas purification unit, and bottling compressor station."
    },
    "timeline": {
      "publicationDate": "2026-10-12T10:00:00Z",
      "bidStartDate": "2026-10-18T10:00:00Z",
      "preBidMeeting": "2026-10-26T11:00:00Z",
      "clarificationDeadline": "2026-10-30T17:00:00Z",
      "bidSubmissionDeadline": "2026-11-12T17:00:00Z",
      "techEvalStartDate": "2026-11-13T10:00:00Z",
      "techEvalEndDate": "2026-11-18T17:00:00Z",
      "finEvalStartDate": "2026-11-20T10:00:00Z",
      "finEvalEndDate": "2026-11-22T17:00:00Z",
      "expectedAwardDate": "2026-12-01T10:00:00Z"
    },
    "vendorEligibilityCriteria": [
      {
        "criterion": "CBG / Bio-CNG Operational Capacity",
        "requirement": "Must have operational experience in running at least one 100 TPD waste processing facility",
        "verificationType": "Authority Verification"
      }
    ],
    "requiredDocumentsChecklist": [
      {"documentName": "Methane Yield and Gas Quality Guarantee Certificate", "isMandatory": true, "verificationType": "Cryptographic Hash Signature"},
      {"documentName": "Environmental Clearance (EC) Clearance Document", "isMandatory": true, "verificationType": "DID Identity Attestation"}
    ],
    "bidConfig": {
      "bidSubmissionType": "Two Stage / Two Cover (Tech + Fin)",
      "bidValidityPeriodDays": 90,
      "bidModification": "Allowed Before Deadline",
      "bidWithdrawal": "Allowed Before Deadline",
      "multipleBidSubmission": "Not Allowed (Single Bid Per Vendor)",
      "financialBidEncryption": "Enabled (End-to-End Sealed Encrypted Bids)"
    },
    "evaluationCriteria": {
      "evaluationMethod": "QCBS (Quality & Cost Based Selection)",
      "weights": [
        {"criterionName": "Anaerobic Digester Efficiency & Gas Recovery Rate", "weightPercentage": 50},
        {"criterionName": "Vendor Technical Execution Track Record", "weightPercentage": 20},
        {"criterionName": "Financial Commercial Price", "weightPercentage": 30}
      ]
    },
    "zkpRule": "CBG Capacity ≥ 100 TPD & Gas Yield Guarantee (ZK-Proof)"
  }
];

async function seedTenders() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ No MONGODB_URI found in environment.");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Atlas for Tender Ingestion...");

    // 1. Clean up and purge all deadline-overed and expired test tenders from MongoDB
    const now = Date.now();
    const existingTenders = await Tender.find({});
    let removedCount = 0;
    for (const t of existingTenders) {
      const rawDate = t.submissionDeadline || t.closingDate || t.bidDeadline;
      const parsedTime = rawDate ? new Date(rawDate).getTime() : 0;
      const isPast = (parsedTime > 0 && parsedTime < now);
      const isLegacyTest = ['TND-2026-6868', 'TND-2026-5778', 'TND-SEPOLIA-4897', 'TND-2026-3840', 'TND-2026-9503', 'TND-2026-4383'].includes(t.tenderId);
      if (isPast || isLegacyTest || !rawDate) {
        await Tender.deleteOne({ _id: t._id });
        removedCount++;
        console.log(`🗑️ Removed expired tender from DB: ${t.tenderId} (Deadline: ${rawDate || 'None'})`);
      }
    }
    console.log(`🧹 Removed ${removedCount} deadline-overed tenders from MongoDB.`);

    // 2. Distinct Public Tender Requirements Map (Different for every single tender)
    const tenderEligibilityMap = {
      "TN-PWD-2026-INFRA-001":  { minimumExperience: 7, minimumTurnover: 15,  minimumProjects: 4 }, // Highway: Exp ≥ 7 Yrs, Turn ≥ ₹15 Cr, Proj ≥ 4
      "TN-DICT-2026-IT-002":    { minimumExperience: 4, minimumTurnover: 5,   minimumProjects: 3 }, // Identity: Exp ≥ 4 Yrs, Turn ≥ ₹5 Cr, Proj ≥ 3
      "IN-TNEB-2026-PWR-003":   { minimumExperience: 8, minimumTurnover: 22,  minimumProjects: 5 }, // Solar 50MW: Exp ≥ 8 Yrs, Turn ≥ ₹22 Cr, Proj ≥ 5
      "IN-CMRL-2026-TRN-004":   { minimumExperience: 6, minimumTurnover: 18,  minimumProjects: 4 }, // Electric Bus: Exp ≥ 6 Yrs, Turn ≥ ₹18 Cr, Proj ≥ 4
      "TN-HEALTH-2026-MED-005": { minimumExperience: 5, minimumTurnover: 12,  minimumProjects: 3 }, // MRI Systems: Exp ≥ 5 Yrs, Turn ≥ ₹12 Cr, Proj ≥ 3
      "TN-SMART-2026-CNS-006":  { minimumExperience: 3, minimumTurnover: 2,   minimumProjects: 2 }, // Mobility Plan: Exp ≥ 3 Yrs, Turn ≥ ₹2 Cr, Proj ≥ 2
      "IN-TWAD-2026-CON-007":   { minimumExperience: 6, minimumTurnover: 14,  minimumProjects: 3 }, // Sewage STP: Exp ≥ 6 Yrs, Turn ≥ ₹14 Cr, Proj ≥ 3
      "TN-AGRIC-2026-OTH-008":  { minimumExperience: 2, minimumTurnover: 1.5, minimumProjects: 2 }, // Agri Drones: Exp ≥ 2 Yrs, Turn ≥ ₹1.5 Cr, Proj ≥ 2
      "IN-ELCOT-2026-IT-009":   { minimumExperience: 8, minimumTurnover: 25,  minimumProjects: 6 }, // AI Data Center: Exp ≥ 8 Yrs, Turn ≥ ₹25 Cr, Proj ≥ 6
      "IN-TNCLEAN-2026-INF-010": { minimumExperience: 5, minimumTurnover: 8,   minimumProjects: 3 }  // Bio-Methanation: Exp ≥ 5 Yrs, Turn ≥ ₹8 Cr, Proj ≥ 3
    };

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of rawTenders) {
      const tenderId = item.tenderReferenceNumber;
      
      const stripIsoTime = (d) => {
        if (!d) return "";
        return String(d).replace(/T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/gi, "").trim();
      };

      const cleanTimeline = item.timeline ? {
        publicationDate: stripIsoTime(item.timeline.publicationDate),
        bidStartDate: stripIsoTime(item.timeline.bidStartDate),
        preBidMeeting: stripIsoTime(item.timeline.preBidMeeting),
        clarificationDeadline: stripIsoTime(item.timeline.clarificationDeadline),
        bidSubmissionDeadline: stripIsoTime(item.timeline.bidSubmissionDeadline),
        techEvalStartDate: stripIsoTime(item.timeline.techEvalStartDate),
        techEvalEndDate: stripIsoTime(item.timeline.techEvalEndDate),
        finEvalStartDate: stripIsoTime(item.timeline.finEvalStartDate),
        finEvalEndDate: stripIsoTime(item.timeline.finEvalEndDate),
        expectedAwardDate: stripIsoTime(item.timeline.expectedAwardDate),
      } : {};

      const reqs = tenderEligibilityMap[tenderId] || { minimumExperience: 5, minimumTurnover: 10, minimumProjects: 3 };

      const doc = {
        tenderId,
        title: item.tenderTitle || "",
        category: item.category || "General",
        type: item.tenderType || "Open Tender",
        tenderType: item.tenderType || "Open Tender",
        organization: "Government of Tamil Nadu",
        department: item.department || "Tamil Nadu Public Procurement Division",
        procurementMethod: item.procurementMethod || "Competitive Bidding",
        budget: item.financialTerms?.estimatedTenderValue || 0,
        estimatedValue: item.financialTerms?.estimatedTenderValue || 0,
        budgetType: item.financialTerms?.budgetType || "Estimated Budget",
        bidPriceRestriction: item.financialTerms?.bidPriceRestriction || "No Restriction",
        emdType: item.financialTerms?.emdConfig?.emdSecurityType || "Fixed Amount",
        emdAmount: item.financialTerms?.emdConfig?.emdFixedAmount || 0,
        emdExemptionApplicable: item.financialTerms?.emdConfig?.emdExemptionApplicable || "Yes",
        tenderFeeType: item.financialTerms?.tenderDocumentFee?.feeRequired || "Fee Required",
        docFeeAmount: item.financialTerms?.tenderDocumentFee?.feeAmount || 0,
        docFeeCurrency: item.financialTerms?.tenderDocumentFee?.currency || "INR",
        country: item.locationAndScope?.country || "India",
        state: item.locationAndScope?.state || "Tamil Nadu",
        district: item.locationAndScope?.district || "",
        city: item.locationAndScope?.city || "",
        workAddress: item.locationAndScope?.workLocation || "",
        contractDuration: item.locationAndScope?.contractDuration || 12,
        contractDurationUnit: item.locationAndScope?.durationUnit || "Months",
        expectedStartDate: item.locationAndScope?.expectedStartDate || "",
        expectedCompletionDate: item.locationAndScope?.expectedCompletionDate || "",
        detailedScope: item.locationAndScope?.detailedScope || "",
        executiveSummary: item.tenderDescription || "",
        description: item.tenderDescription || "",
        pubDate: stripIsoTime(item.timeline?.publicationDate) || new Date().toISOString().split('T')[0],
        bidStartDate: stripIsoTime(item.timeline?.bidStartDate),
        preBidDate: stripIsoTime(item.timeline?.preBidMeeting),
        clarificationDeadline: stripIsoTime(item.timeline?.clarificationDeadline),
        submissionDeadline: stripIsoTime(item.timeline?.bidSubmissionDeadline),
        closingDate: stripIsoTime(item.timeline?.bidSubmissionDeadline),
        bidDeadline: stripIsoTime(item.timeline?.bidSubmissionDeadline),
        techEvalStartDate: stripIsoTime(item.timeline?.techEvalStartDate),
        techEvalEndDate: stripIsoTime(item.timeline?.techEvalEndDate),
        finEvalStartDate: stripIsoTime(item.timeline?.finEvalStartDate),
        finEvalEndDate: stripIsoTime(item.timeline?.finEvalEndDate),
        awardDate: stripIsoTime(item.timeline?.expectedAwardDate),
        minimumExperience: reqs.minimumExperience,
        minimumTurnover: reqs.minimumTurnover,
        minimumProjects: reqs.minimumProjects,
        eligibilityCriteria: {
          minimumExperience: reqs.minimumExperience,
          minimumTurnover: reqs.minimumTurnover,
          minimumProjects: reqs.minimumProjects
        },
        eligibilityRequirementsList: item.vendorEligibilityCriteria || [],
        requiredDocsList: item.requiredDocumentsChecklist || [],
        submissionType: item.bidConfig?.bidSubmissionType || "Two Stage / Two Cover",
        validityPeriodDays: item.bidConfig?.bidValidityPeriodDays || 120,
        allowModification: item.bidConfig?.bidModification || "Allowed",
        allowWithdrawal: item.bidConfig?.bidWithdrawal || "Allowed",
        multipleBidSubmission: item.bidConfig?.multipleBidSubmission || "Not Allowed",
        financialBidEncryption: item.bidConfig?.financialBidEncryption || "Enabled",
        evaluationMethod: item.evaluationCriteria?.evaluationMethod || "QCBS",
        evaluationCriteriaList: item.evaluationCriteria?.weights || [],
        totalWeight: 100,
        zkpActive: true,
        zkpRule: `Min Exp ≥ ${reqs.minimumExperience} Yrs, Turnover ≥ ₹${reqs.minimumTurnover} Cr, Projects ≥ ${reqs.minimumProjects} (Groth16 Range Proof)`,
        status: "Published",
        bidsCount: 0,
        txHash: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        contractAddress: "0xD796C483CdAea7389bBfC379Ed602f4BC8C9a994",
        createdAt: new Date(),
        // Raw nested structures for full fidelity
        financialTerms: item.financialTerms,
        locationAndScope: item.locationAndScope,
        timeline: cleanTimeline,
        vendorEligibilityCriteria: item.vendorEligibilityCriteria,
        requiredDocumentsChecklist: item.requiredDocumentsChecklist,
        bidConfig: item.bidConfig,
        evaluationCriteria: item.evaluationCriteria
      };

      const res = await Tender.findOneAndUpdate(
        { tenderId },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`✅ Stored Tender [${tenderId}]: "${item.tenderTitle}" (Budget: ₹${item.financialTerms?.estimatedTenderValue?.toLocaleString('en-IN')})`);
      insertedCount++;
    }

    console.log(`\n🎉 SUCCESS: ${insertedCount} Tenders successfully ingested into MongoDB!`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding tenders:", err);
    process.exit(1);
  }
}

seedTenders();
