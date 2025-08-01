const { up } = require('../database/migrations/20250709000001-create-user');
const License = require('../models/License');
const Project = require('../models/Project');
const WordPressInfo = require('../models/WordPressInfo');

class LicenseController {
  
  async createLicenseForUser(userId, projectName, options = {}) {
    try {
      const licenseKey = License.generateLicenseKey();
      
      const license = await License.create({
        licenseKey: licenseKey,
        features: options.features || ['premium_templates', 'advanced_analytics', 'custom_branding'],
        userId: userId,
        project: projectName,
        isActive: options.isActive || false,
        validationCount: options.validationCount || 0
      });

      return {
        success: true,
        data: {
          id: license.id,
          licenseKey: license.licenseKey,
          features: license.features,
          project: license.project,
          isActive: license.isActive,
          createdAt: license.createdAt
        }
      };
    } catch (error) {
      console.error('Error creating license:', error);
      throw error;
    }
  }

  async generateLicense(userId, projectName, options = {}) {
    try {
      const licenseKey = License.generateLicenseKey();


      if (!userId) {
        res.status(403).json({ success: false, message: "User not authencticated" });
      }

      if (!projectName) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      const isValidProject = await Project.findOne({
        where: { projectName: projectName }
      });

      if (!isValidProject) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const license = await License.create({
        licenseKey: licenseKey,
        features: ['premium_templates', 'advanced_analytics', 'custom_branding'],
        userId: id,
        project
      });

      res.status(201).json({
        success: true,
        message: 'License key generated successfully',
        data: {
          licenseKey: license.licenseKey,
          features: license.features,
          createdAt: license.createdAt
        }
      });
    } catch (error) {
      console.error('Error generating license:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate license key',
        error: error.message
      });
    }
  };

  // This will be called from WordPress
  async activateLicense(req, res) {
    try {
      const { licenseKey, siteUrl, siteName, wpVersion, phpVersion, userAgent, ipAddress } = req.body;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          message: 'License key is required'
        });
      }

      // Find the license
      const license = await License.findOne({
        where: { licenseKey: licenseKey }
      });

      if (!license) {
        return res.status(404).json({
          success: false,
          message: 'Invalid license key'
        });
      }

      // Validate the license
      const validationResult = await license.validateLicense();

      license.isActive = true;
      await license.save();

      if (!validationResult.valid) {
        return res.status(403).json({
          success: false,
          message: validationResult.message
        });
      }

      // Create WordPress info record
      await WordPressInfo.create({
        siteUrl: siteUrl,
        wpVersion: wpVersion,
        siteName: siteName,
        phpVersion: phpVersion,
        userAgent: userAgent,
        ipAddress: ipAddress,
        licenseId: license.id
      });

      res.json({
        success: true,
        message: 'License is valid',
        data: {
          features: validationResult.features,
          validationCount: license.validationCount,
          lastValidated: license.lastValidated,
        }
      });

    } catch (error) {
      console.error('Error validating license:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate license',
        error: error.message
      });
    }
  };

  async getLicenseDetails(req, res) {
    try {
      const { licenseKey } = req.params;

      const license = await License.findOne({
        where: { licenseKey: licenseKey },
        attributes: ['licenseKey', 'isActive', 'features', 'validationCount', 'lastValidated', 'siteUrl', 'createdAt', 'wpVersion', 'siteName', 'phpVersion', 'userAgent', 'ipAddress']
      });

      if (!license) {
        return res.status(404).json({
          success: false,
          message: 'License not found'
        });
      }

      res.json({
        success: true,
        data: license
      });

    } catch (error) {
      console.error('Error fetching license details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch license details',
        error: error.message
      });
    }
  };

  async deactivateLicense(req, res) {
    try {
      const { licenseKey } = req.params;

      const license = await License.findOne({
        where: { licenseKey: licenseKey }
      });

      if (!license) {
        return res.status(404).json({
          success: false,
          message: 'License not found'
        });
      }
      if(license.isDeactivated === true) {
        return res.status(400).json({
          success: false,
          message: 'License has already been deactivated'
        });
      }

      license.isActive = false;
      license.isDeactivated = true;
      await license.save();

      res.json({
        success: true,
        message: 'License deactivated successfully'
      });

    } catch (error) {
      console.error('Error deactivating license:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate license',
        error: error.message
      });
    }
  };

  async getAllLicensesForUser(req, res){
    try {
      const user = req.user;

      if (!user) {
        return res.status(403).json({ success: false, message: 'User not authenticated' });
      }

      const licenses = await License.findAll({
        where: { userId: user.id },
        attributes: ['id', 'licenseKey', 'isActive', 'features', 'validationCount', 'lastValidated', 'createdAt', 'project', 'isDeactivated'],
      });

      const wordPressInfo = await WordPressInfo.findAll({
        where: {licenseId : licenses.map(license => license.id)},
        attributes: ['siteUrl', 'wpVersion', 'siteName', 'phpVersion', 'userAgent', 'ipAddress', 'createdAt', 'licenseId'],
      });

      res.json({
        success: true,
        data: {
          licenses,
          wordPressInfo
        }
      });

    } catch (error) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch licenses', error: error.message });
    }
  }
}
module.exports = LicenseController;
