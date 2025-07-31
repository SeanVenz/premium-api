'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminId = uuidv4();
    const testUserId = uuidv4();
    
    await queryInterface.bulkInsert('Users', [
      {
        id: adminId,
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'superAdmin',
        isVerified: true,
      },
      {
        id: testUserId,
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('test123', 10),
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'user',
        isVerified: true,
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
