const sequelize = require('./sequelize');
const License = require('../models/License');
const defineAssociations = require('./associations');

const initializeDatabase = async () => {
    try{
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        defineAssociations();

        console.log('Database connection initialized. Use migrations and seeders to set up tables.');
    } catch(error){
        console.log('Unable to connect to the database:', error);
    }
}

module.exports = initializeDatabase;