const FormData = require('form-data');
const Mailgun = require('mailgun-js');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Mailgun with proper configuration
const mg = Mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    host: process.env.MAILGUN_ENDPOINT || 'api.mailgun.net'
});

const sendMail = async (options) => {
    try {
        
        // Handle both html and template properties
        const htmlContent = options.html || options.template;
        
        if (!htmlContent) {
            throw new Error('Email content is required (html or template property)');
        }

        const data = await mg.messages().send({
            from: process.env.MAIL_FROM_ADDRESS || 'no-reply@pikocode.com',
            to: options.to,
            subject: options.subject,
            html: htmlContent,
        });

        return data;
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

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found: ${templatePath}`);
        }

        const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

        const template = Handlebars.compile(templateContent);
        const compiledTemplate = template(data || {});
        
        return compiledTemplate;
    } catch (error) {
        console.error('Error reading email template:', {
            templateName,
            error: error.message
        });
        throw error;
    }
}

module.exports = {
    sendMail,
    getEmailTemplate
};