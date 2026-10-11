const express = require('express');
const router = express.Router();
const vendorDocumentController = require('../controllers/vendorDocumentController');

// Vendor Documents Endpoints
router.get('/', vendorDocumentController.getVendorDocuments);
router.post('/submit-all', vendorDocumentController.submitAllVendorDocuments);
router.get('/:id', vendorDocumentController.getVendorDocumentById);
router.post('/', vendorDocumentController.createVendorDocument);
router.put('/:id', vendorDocumentController.updateVendorDocument);
router.delete('/:id', vendorDocumentController.deleteVendorDocument);

module.exports = router;
