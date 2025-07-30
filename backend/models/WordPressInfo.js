const { DataTypes } = require('sequelize');
const sequelize = require('../database/sequelize');
const crypto = require('crypto');

const WordPressInfo = sequelize.define('WordPressInfo', {
  id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
  siteUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  wpVersion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  siteName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phpVersion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
}, {
  tableName: 'licenses',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['licenseKey']
    }
  ]
});

module.exports = WordPressInfo;