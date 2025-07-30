const License = require('../models/License');
const {Sequelize} = require('sequelize');
const User = require('../models/User');
const WordPressInfo = require('../models/WordPressInfo');

const defineAssociations = () => {

    User.hasMany(License, {
        foreignKey: 'userId',
        as: 'userID'
    });

    License.belongsTo(User, {
        foreignKey: 'userId',
        as: 'userGenerated',
    })
    
    WordPressInfo.belongsTo(License, {
        foreignKey: 'licenseId',
        as: 'license'
    });

    License.hasMany(WordPressInfo, {
        foreignKey: 'licenseId',
        as: 'wordpressInfosId'
    });
};

module.exports = defineAssociations