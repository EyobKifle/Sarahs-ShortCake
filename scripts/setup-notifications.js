#!/usr/bin/env node

/**
 * Notification Setup Script
 * Configures email and SMS settings for Sarah's Short Cakes
 *
 * Usage: node setup-notifications.js
 */

const mongoose = require('mongoose');
const Settings = require('./models/Settings');

class NotificationSetup {
    async connect() {
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_cakes');
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            process.exit(1);
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }

    async setupEmailSettings() {
        console.log('\n📧 Setting up email configuration...');

        // For testing purposes, we'll use a mock configuration
        // In production, you would use real SMTP settings
        const emailSettings = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            user: 'your-email@gmail.com', // Replace with actual email
            password: 'your-app-password', // Replace with actual app password
            from: 'Sarah\'s Short Cakes <noreply@sarahsshortcakes.com>'
        };

        console.log('📧 Email settings configured (using test configuration)');
        return emailSettings;
    }

    async setupSmsSettings() {
        console.log('\n📱 Setting up SMS configuration...');

        // Ethiopian SMS provider settings
        const smsSettings = {
            provider: 'ethiopia_telecom', // or 'safaricom_ethiopia', 'twilio'
            apiKey: 'your-ethiopia-telecom-api-key',
            senderId: 'SARAHS',
            baseUrl: 'https://api.ethiotelecom.et/sms/v1'
        };

        console.log('📱 SMS settings configured (using test configuration)');
        return smsSettings;
    }

    async createOrUpdateSettings() {
        try {
            console.log('🔧 Creating/updating notification settings...');

            const emailSettings = await this.setupEmailSettings();
            const smsSettings = await this.setupSmsSettings();

            // Check if settings already exist
            let settings = await Settings.findOne();

            if (!settings) {
                // Create new settings
                settings = new Settings({
                    businessName: 'Sarah\'s Short Cakes',
                    businessEmail: 'info@sarahsshortcakes.com',
                    businessPhone: '+251911000000',
                    businessAddress: 'Addis Ababa, Ethiopia',
                    businessDescription: 'Delicious homemade cupcakes and cakes made with love and the finest ingredients.',

                    // Notification settings
                    emailNotifications: true,
                    smsNotifications: true,
                    lowStockAlerts: true,
                    newOrderAlerts: true,
                    orderStatusAlerts: true,
                    customerRegistrationAlerts: true,

                    // Email configuration
                    emailSettings: {
                        smtpHost: emailSettings.host,
                        smtpPort: emailSettings.port,
                        smtpUser: emailSettings.user,
                        smtpPassword: emailSettings.password,
                        fromEmail: emailSettings.from,
                        fromName: 'Sarah\'s Short Cakes',
                        useSSL: emailSettings.secure
                    },

                    // SMS configuration
                    smsSettings: {
                        provider: smsSettings.provider,
                        apiKey: smsSettings.apiKey,
                        senderId: smsSettings.senderId,
                        apiUrl: smsSettings.baseUrl
                    }
                });

                await settings.save();
                console.log('✅ New settings created successfully');
            } else {
                // Update existing settings
                settings.businessName = 'Sarah\'s Short Cakes';
                settings.businessEmail = 'info@sarahsshortcakes.com';
                settings.businessPhone = '+251911000000';
                settings.businessAddress = 'Addis Ababa, Ethiopia';

                // Update notification settings
                settings.emailNotifications = true;
                settings.smsNotifications = true;
                settings.lowStockAlerts = true;
                settings.newOrderAlerts = true;
                settings.orderStatusAlerts = true;

                // Update email settings
                settings.emailSettings.smtpHost = emailSettings.host;
                settings.emailSettings.smtpPort = emailSettings.port;
                settings.emailSettings.smtpUser = emailSettings.user;
                settings.emailSettings.smtpPassword = emailSettings.password;
                settings.emailSettings.fromEmail = emailSettings.from;
                settings.emailSettings.fromName = 'Sarah\'s Short Cakes';
                settings.emailSettings.useSSL = emailSettings.secure;

                // Update SMS settings
                settings.smsSettings.provider = smsSettings.provider;
                settings.smsSettings.apiKey = smsSettings.apiKey;
                settings.smsSettings.senderId = smsSettings.senderId;
                settings.smsSettings.apiUrl = smsSettings.baseUrl;

                await settings.save();
                console.log('✅ Existing settings updated successfully');
            }

            return settings;
        } catch (error) {
            console.error('❌ Error creating/updating settings:', error.message);
            throw error;
        }
    }

    async setupTestConfiguration() {
        console.log('🚀 Setting up test notification configuration...');
        console.log('=' * 50);

        try {
            const settings = await this.createOrUpdateSettings();

            console.log('\n📋 Configuration Summary:');
            console.log('-'.repeat(30));
            console.log(`Business Name: ${settings.businessName}`);
            console.log(`Email Enabled: ${settings.emailNotifications ? '✅' : '❌'}`);
            console.log(`SMS Enabled: ${settings.smsNotifications ? '✅' : '❌'}`);
            console.log(`SMS Provider: ${settings.smsSettings.provider}`);
            console.log(`Order Status Alerts: ${settings.orderStatusAlerts ? '✅' : '❌'}`);
            console.log(`Low Stock Alerts: ${settings.lowStockAlerts ? '✅' : '❌'}`);
            console.log(`New Order Alerts: ${settings.newOrderAlerts ? '✅' : '❌'}`);

            console.log('\n🎉 Notification system configured successfully!');
            console.log('\n📝 Next Steps:');
            console.log('1. Update email SMTP settings with real credentials');
            console.log('2. Configure Ethiopian SMS provider API keys');
            console.log('3. Run: node test-notifications.js email');
            console.log('4. Run: node test-notifications.js sms');
            console.log('5. Run: node test-notifications.js all');

            return settings;
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            throw error;
        }
    }

    async showCurrentSettings() {
        try {
            const settings = await Settings.findOne();

            if (!settings) {
                console.log('❌ No settings found. Run setup first.');
                return;
            }

            console.log('\n📋 Current Notification Settings:');
            console.log('='.repeat(40));

            console.log('\n🏢 Business Information:');
            console.log(`Name: ${settings.businessName || 'Not set'}`);
            console.log(`Email: ${settings.businessEmail || 'Not set'}`);
            console.log(`Phone: ${settings.businessPhone || 'Not set'}`);
            console.log(`Address: ${settings.businessAddress || 'Not set'}`);

            console.log('\n📧 Email Settings:');
            console.log(`Enabled: ${settings.emailNotifications ? '✅' : '❌'}`);
            console.log(`SMTP Host: ${settings.emailSettings?.smtpHost || 'Not set'}`);
            console.log(`SMTP Port: ${settings.emailSettings?.smtpPort || 'Not set'}`);
            console.log(`From Email: ${settings.emailSettings?.fromEmail || 'Not set'}`);

            console.log('\n📱 SMS Settings:');
            console.log(`Enabled: ${settings.smsNotifications ? '✅' : '❌'}`);
            console.log(`Provider: ${settings.smsSettings?.provider || 'Not set'}`);
            console.log(`Sender ID: ${settings.smsSettings?.senderId || 'Not set'}`);
            console.log(`API URL: ${settings.smsSettings?.apiUrl || 'Not set'}`);

            console.log('\n🔔 Notification Preferences:');
            console.log(`Email Notifications: ${settings.emailNotifications ? '✅' : '❌'}`);
            console.log(`SMS Notifications: ${settings.smsNotifications ? '✅' : '❌'}`);
            console.log(`Order Status Alerts: ${settings.orderStatusAlerts ? '✅' : '❌'}`);
            console.log(`Low Stock Alerts: ${settings.lowStockAlerts ? '✅' : '❌'}`);
            console.log(`New Order Alerts: ${settings.newOrderAlerts ? '✅' : '❌'}`);
            console.log(`Customer Registration Alerts: ${settings.customerRegistrationAlerts ? '✅' : '❌'}`);

        } catch (error) {
            console.error('❌ Error retrieving settings:', error.message);
        }
    }

    async enableTestMode() {
        try {
            console.log('🧪 Enabling test mode...');

            const settings = await Settings.findOne();
            if (!settings) {
                throw new Error('Settings not found. Run setup first.');
            }

            // Enable test mode - this will use console logging instead of actual sending
            if (!settings.emailSettings) {
                settings.emailSettings = {};
            }
            if (!settings.smsSettings) {
                settings.smsSettings = {};
            }

            settings.emailSettings.testMode = true;
            settings.smsSettings.testMode = true;

            await settings.save();

            console.log('✅ Test mode enabled');
            console.log('📧 Emails will be logged to console instead of sent');
            console.log('📱 SMS messages will be logged to console instead of sent');

        } catch (error) {
            console.error('❌ Error enabling test mode:', error.message);
        }
    }

    async disableTestMode() {
        try {
            console.log('🔧 Disabling test mode...');

            const settings = await Settings.findOne();
            if (!settings) {
                throw new Error('Settings not found. Run setup first.');
            }

            settings.emailSettings.testMode = false;
            settings.smsSettings.testMode = false;

            await settings.save();

            console.log('✅ Test mode disabled');
            console.log('📧 Emails will be sent via SMTP');
            console.log('📱 SMS messages will be sent via configured provider');

        } catch (error) {
            console.error('❌ Error disabling test mode:', error.message);
        }
    }
}

// Main execution
async function main() {
    const action = process.argv[2] || 'setup';
    const setup = new NotificationSetup();

    try {
        await setup.connect();

        switch (action) {
            case 'setup':
                await setup.setupTestConfiguration();
                break;
            case 'show':
                await setup.showCurrentSettings();
                break;
            case 'test-mode':
                await setup.enableTestMode();
                break;
            case 'live-mode':
                await setup.disableTestMode();
                break;
            default:
                console.log('Usage: node setup-notifications.js [setup|show|test-mode|live-mode]');
                break;
        }
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        await setup.disconnect();
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Run the setup
if (require.main === module) {
    main();
}

module.exports = NotificationSetup;
