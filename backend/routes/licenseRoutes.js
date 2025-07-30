const express = require('express');
const router = express.Router();
const LicenseController = require('../controllers/licenseController');
const license = new LicenseController();
const authenticateToken = require('../middleware/authMiddleware');

router.post('/generate/:project', authenticateToken, license.generateLicense);

router.post('/validate', license.validateLicense);

router.get('/:licenseKey', authenticateToken, license.getLicenseDetails);

router.put('/:licenseKey/deactivate', license.deactivateLicense);

module.exports = router;
