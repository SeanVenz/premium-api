'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get the user IDs from the Users table
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM Users WHERE username IN ('admin', 'testuser')`,
      {
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );

    const adminUser = users.find(user => user.username === 'admin');
    const testUser = users.find(user => user.username === 'testuser');

    if (!adminUser || !testUser) {
      throw new Error('Required users (admin, testuser) not found. Please run user seeders first.');
    }

    // Generate sample license keys
    const generateLicenseKey = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      
      for (let group = 0; group < 8; group++) {
        if (group > 0) result += '-';
        for (let i = 0; i < 4; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
      }
      
      return result;
    };

    await queryInterface.bulkInsert('licenses', [
      {
        id: uuidv4(),
        licenseKey: generateLicenseKey(),
        project: 'Premium WordPress Plugin',
        isActive: true,
        features: JSON.stringify(['premium_templates', 'advanced_analytics', 'custom_branding']),
        validationCount: 0,
        userId: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        licenseKey: generateLicenseKey(),
        project: 'Premium React App',
        isActive: true,
        features: JSON.stringify(['premium_templates', 'advanced_analytics']),
        validationCount: 0,
        userId: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        licenseKey: generateLicenseKey(),
        project: 'Enterprise Solution',
        isActive: false,
        features: JSON.stringify(['premium_templates', 'advanced_analytics', 'custom_branding', 'priority_support']),
        validationCount: 5,
        userId: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('licenses', null, {});
  }
};
