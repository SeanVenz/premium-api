'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('projects', [
      {
        id: uuidv4(),
        projectName: 'pikocode-premium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        projectName: 'quiz-builder',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('projects', null, {});
  }
};
