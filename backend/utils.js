const FormData = require('form-data');
const Mailgun = require('mailgun-js');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Mailgun with the correct syntax
const mg = Mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    host: 'api.eu.mailgun.net' // Use EU endpoint if needed
});

const sendMail = async (options) => {
    try {
        const data = {
            from: process.env.MAIL_FROM_NAME,
            to: options.to,
            subject: options.subject,
            html: options.html || options.template,
        };

        const result = await mg.messages().send(data);
        return result;
    } catch (error) {
        console.error('Mailgun Error Details:', {
            message: error.message,
            status: error.status,
            details: error.details,
            type: error.type
        });
        throw error;
    }
}

const getEmailTemplate = async (templateName, data = null) => {
    try {
        const templatePath = path.join(__dirname, `./templates/${templateName}.html`);

        // Use fs.promises.readFile for async/await or fs.readFileSync for synchronous
        const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

        const template = Handlebars.compile(templateContent);
        return template(data); // Pass data directly, not wrapped in { data }
    } catch (error) {
        throw error;
    }
}

module.exports = {
    sendMail,
    getEmailTemplate
};