'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wordpress_infos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      siteUrl: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      wpVersion: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      siteName: {
        type: Sequelize.STRING(255),
        defaultValue: true
      },
      phpVersion: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      siteUrl: {
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
      licenseId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Licenses',
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
      },
    });

    // Add unique index for licenseKey
    await queryInterface.addIndex('wordpress_infos', {
      fields: ['siteUrl'],
      unique: true,
      name: 'wordpress_infos_site_url_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wordpress_infos');
  }
};
