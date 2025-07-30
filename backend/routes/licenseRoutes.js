const express = require('express');
const router = express.Router();
const LicenseController = require('../controllers/licenseController');
const license = new LicenseController();
const authenticateToken = require('../middleware/authMiddleware');

router.post('/generate/:project', authenticateToken, license.generateLicense);

router.post('/activate', license.activateLicense);

router.get('/:licenseKey', authenticateToken, license.getLicenseDetails);

router.put('/:licenseKey/deactivate', license.deactivateLicense);

router.get('/user/license', authenticateToken, license.getAllLicensesForUser);

module.exports = router;
