'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('licenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      licenseKey: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      project: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      features: {
        type: Sequelize.JSON,
        defaultValue: JSON.stringify(['premium_templates', 'advanced_analytics', 'custom_branding'])
      },
      lastValidated: {
        type: Sequelize.DATE,
        allowNull: true
      },
      validationCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      siteUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      wpVersion: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      siteName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phpVersion: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add unique index for licenseKey
    await queryInterface.addIndex('licenses', {
      fields: ['licenseKey'],
      unique: true,
      name: 'licenses_license_key_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('licenses');
  }
};
