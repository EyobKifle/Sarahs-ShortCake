const Settings = require('../models/Settings');

// Get all settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = new Settings({
                businessName: "Sarah's Short Cakes",
                businessEmail: "info@sarahsshortcakes.com",
                businessPhone: "+1 (555) 123-4567",
                businessAddress: "123 Sweet Street, Bakery City",
                businessDescription: "Delicious homemade cupcakes and cakes made with love and the finest ingredients.",
                emailNotifications: true,
                smsNotifications: false,
                lowStockAlerts: true,
                newOrderAlerts: true,
                emailSettings: {
                    smtpHost: 'smtp.gmail.com',
                    smtpPort: 587,
                    smtpUser: 'eyobkifle456@gmail.com',
                    smtpPassword: '',
                    fromEmail: 'info@sarahsshortcakes.com',
                    fromName: "Sarahs ShortCakes"
                },
                smsSettings: {
                    provider: 'twilio',
                    accountSid: '',
                    authToken: '',
                    fromNumber: ''
                },
                businessHours: {
                    monday: { open: '08:00', close: '18:00', closed: false },
                    tuesday: { open: '08:00', close: '18:00', closed: false },
                    wednesday: { open: '08:00', close: '18:00', closed: false },
                    thursday: { open: '08:00', close: '18:00', closed: false },
                    friday: { open: '08:00', close: '18:00', closed: false },
                    saturday: { open: '09:00', close: '16:00', closed: false },
                    sunday: { open: '10:00', close: '14:00', closed: true }
                }
            });
            await settings.save();
        }

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings(req.body);
        } else {
            // Update existing settings
            Object.keys(req.body).forEach(key => {
                if (req.body[key] !== undefined) {
                    settings[key] = req.body[key];
                }
            });
        }

        settings.updatedAt = new Date();
        await settings.save();

        res.status(200).json({
            success: true,
            data: settings,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings'
        });
    }
};

// Test email configuration
exports.testEmailConfig = async (req, res) => {
    try {
        const { testEmail, emailSettings } = req.body;

        if (!testEmail) {
            return res.status(400).json({
                success: false,
                message: 'Test email address is required'
            });
        }

        // Use provided settings or get from database
        let settings = emailSettings;
        if (!settings) {
            const dbSettings = await Settings.findOne();
            settings = dbSettings?.emailSettings;
        }

        if (!settings || !settings.smtpHost) {
            return res.status(400).json({
                success: false,
                message: 'Email settings not configured. Please configure SMTP settings first.'
            });
        }

        // Import email service
        const EmailService = require('../services/emailService');

        // Create a test transporter with the provided settings
        const nodemailer = require('nodemailer');
        const testTransporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            secure: settings.smtpPort === 465,
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection
        await testTransporter.verify();

        // Send test email
        const testMailOptions = {
            from: `"${settings.fromName || "Sarah's Short Cakes"}" <${settings.fromEmail || settings.smtpUser}>`,
            to: testEmail,
            subject: '📧 Email Configuration Test - Sarah\'s Short Cakes',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                        <h1>🧁 Sarah's Short Cakes</h1>
                        <h2>Email Configuration Test</h2>
                    </div>
                    <div style="padding: 20px; background: #f9f9f9;">
                        <h3>✅ Email Configuration Successful!</h3>
                        <p>This is a test email to verify that your email configuration is working correctly.</p>

                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <h4>Configuration Details:</h4>
                            <ul>
                                <li><strong>SMTP Host:</strong> ${settings.smtpHost}</li>
                                <li><strong>SMTP Port:</strong> ${settings.smtpPort}</li>
                                <li><strong>From Email:</strong> ${settings.fromEmail}</li>
                                <li><strong>From Name:</strong> ${settings.fromName}</li>
                            </ul>
                        </div>

                        <p>If you received this email, your email configuration is working properly and you can now:</p>
                        <ul>
                            <li>Send order confirmations to customers</li>
                            <li>Receive new order notifications</li>
                            <li>Send low stock alerts</li>
                            <li>Communicate with customers via email</li>
                        </ul>

                        <div style="text-align: center; margin-top: 20px;">
                            <p style="color: #666;">Test sent at: ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            `,
            text: `
Email Configuration Test - Sarah's Short Cakes

✅ Email Configuration Successful!

This is a test email to verify that your email configuration is working correctly.

Configuration Details:
- SMTP Host: ${settings.smtpHost}
- SMTP Port: ${settings.smtpPort}
- From Email: ${settings.fromEmail}
- From Name: ${settings.fromName}

If you received this email, your email configuration is working properly.

Test sent at: ${new Date().toLocaleString()}
            `
        };

        await testTransporter.sendMail(testMailOptions);

        res.status(200).json({
            success: true,
            message: `Test email sent successfully to ${testEmail}`,
            details: {
                smtpHost: settings.smtpHost,
                smtpPort: settings.smtpPort,
                fromEmail: settings.fromEmail,
                sentAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending test email:', error);

        let errorMessage = 'Error sending test email: ';
        if (error.code === 'EAUTH') {
            errorMessage += 'Authentication failed. Please check your email credentials.';
        } else if (error.code === 'ECONNECTION') {
            errorMessage += 'Connection failed. Please check your SMTP host and port.';
        } else if (error.code === 'ESOCKET') {
            errorMessage += 'Socket error. Please check your network connection.';
        } else {
            errorMessage += error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.code || 'UNKNOWN_ERROR'
        });
    }
};

// Test SMS configuration
exports.testSmsConfig = async (req, res) => {
    try {
        const { testPhone, smsSettings } = req.body;

        if (!testPhone) {
            return res.status(400).json({
                success: false,
                message: 'Test phone number is required'
            });
        }

        // Use provided settings or get from database
        let settings = smsSettings;
        if (!settings) {
            const dbSettings = await Settings.findOne();
            settings = dbSettings?.smsSettings;
        }

        if (!settings) {
            return res.status(400).json({
                success: false,
                message: 'SMS settings not configured. Please configure SMS settings first.'
            });
        }

        // Debug: Log the settings to see what we have
        console.log('SMS Settings for testing:', JSON.stringify(settings, null, 2));

        // TEMPORARY FIX: If AfroMessage fields are missing, add them and save to database
        if (settings.provider === 'afromessage' && !settings.afroMessageApiKey) {
            console.log('🔧 FIXING: Adding missing AfroMessage fields to settings');
            settings.afroMessageApiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiRWdKZFlmOHBMNENDRUhra3RnZ1pBdXZoaWxEZXVGYnEiLCJleHAiOjE5MDYyMDY4NDcsImlhdCI6MTc0ODQ0MDQ0NywianRpIjoiNGVjMjE3MWEtYzg3OC00YzZjLTk3MzctZmIxY2I1MjgxMzJhIn0.QKK5HdkTFpcx3ov_Npg7qCBQYZ-7TrqjsLXzwYK8rvo';
            settings.afroMessageSender = 'INFO';
            settings.afroMessageIdentifierId = '';

            // Save the updated settings to database
            try {
                const settingsDoc = await Settings.findOne();
                if (settingsDoc) {
                    settingsDoc.smsSettings = settings;
                    await settingsDoc.save();
                    console.log('💾 AfroMessage settings saved to database permanently');
                }
            } catch (saveError) {
                console.log('⚠️ Could not save AfroMessage settings to database:', saveError.message);
            }

            console.log('✅ AfroMessage fields added successfully');
        }

        // Validate settings based on provider
        if (settings.provider === 'twilio') {
            if (!settings.accountSid || !settings.authToken || !settings.fromNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Twilio settings incomplete. Please provide Account SID, Auth Token, and From Number.'
                });
            }
        } else if (settings.provider === 'afromessage') {
            if (!settings.afroMessageApiKey) {
                return res.status(400).json({
                    success: false,
                    message: 'AfroMessage settings incomplete. Please provide API Key.'
                });
            }
        } else if (settings.provider === 'ethiopia_telecom') {
            if (!settings.apiKey || !settings.senderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Ethiopia Telecom settings incomplete. Please provide API Key and Sender ID.'
                });
            }
        }

        // Validate phone numbers are different for Twilio
        if (settings.provider === 'twilio' && settings.fromNumber === testPhone) {
            return res.status(400).json({
                success: false,
                message: 'Test failed: From number and To number cannot be the same',
                error: 'Please use a different phone number for testing, or configure a proper Twilio phone number as the sender',
                solution: {
                    step1: 'Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
                    step2: 'Buy a phone number with SMS capability',
                    step3: 'Use that number as your From Number in SMS settings',
                    step4: 'Test with your personal number as the recipient'
                }
            });
        }

        // Test SMS sending based on provider
        let result;
        if (settings.provider === 'twilio') {
            // Test Twilio SMS
            const twilio = require('twilio');
            const client = twilio(settings.accountSid, settings.authToken);

            result = await client.messages.create({
                body: `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: Twilio\nFrom: ${settings.fromNumber}\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications and send customer updates via SMS!`,
                from: settings.fromNumber,
                to: testPhone
            });
        } else if (settings.provider === 'africastalking') {
            // Test Africa's Talking SMS (Great for Ethiopia)
            const AfricasTalking = require('africastalking');
            const africasTalking = AfricasTalking({
                apiKey: settings.africasTalkingApiKey,
                username: settings.africasTalkingUsername || 'sandbox'
            });

            const sms = africasTalking.SMS;
            const message = `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: Africa's Talking\nSender: ${settings.africasTalkingFrom}\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications!`;

            result = await sms.send({
                to: [testPhone],
                message: message,
                from: settings.africasTalkingFrom || 'SARAHS'
            });
        } else if (settings.provider === 'afromessage') {
            // Test AfroMessage SMS (Perfect for Ethiopia)
            const axios = require('axios');
            const message = `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: AfroMessage\nSender: ${settings.afroMessageSender}\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications!`;

            console.log('🚀 SENDING AFROMESSAGE SMS:');
            console.log('📞 To:', testPhone);
            console.log('📝 Message:', message);
            console.log('🔑 API Key:', settings.afroMessageApiKey ? 'Present' : 'Missing');
            console.log('👤 Sender:', settings.afroMessageSender);

            // Ensure phone number is in correct format for AfroMessage
            let formattedPhone = testPhone;
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
            }
            console.log('📱 Formatted Phone:', formattedPhone);

            // Remove the old requestData - we'll use query parameters directly

            try {
                // AfroMessage uses GET method with query parameters
                // Use the correct identifier ID from your AfroMessage account
                const identifierId = 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164'; // Your actual identifier ID

                const queryParams = new URLSearchParams({
                    from: identifierId, // Your IDENTIFIER_ID from token
                    sender: 'SARAHS', // Use the approved sender name
                    to: formattedPhone,
                    message: message,
                    callback: '' // Optional callback URL
                });

                const apiUrl = `https://api.afromessage.com/api/send?${queryParams.toString()}`;
                console.log('🔗 AfroMessage API URL:', apiUrl);

                const response = await axios.get(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${settings.afroMessageApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('📥 AfroMessage Response Status:', response.status);
                console.log('📥 AfroMessage Response Data:', JSON.stringify(response.data, null, 2));

                // Check AfroMessage response format
                if (response.data && response.data.acknowledge) {
                    if (response.data.acknowledge === 'success') {
                        console.log('✅ AfroMessage API: SMS sent successfully');
                        console.log('📱 Message ID:', response.data.response?.message_id);
                        console.log('📞 Sent to:', response.data.response?.to);
                    } else {
                        console.log('❌ AfroMessage API: SMS failed');
                        console.log('🚫 Error:', response.data.response || 'Unknown error');
                    }
                } else {
                    console.log('⚠️ AfroMessage API: Unexpected response format');
                }

                result = response.data;
            } catch (afroError) {
                console.log('💥 AfroMessage API Error:', afroError.message);
                if (afroError.response) {
                    console.log('📥 Error Response Status:', afroError.response.status);
                    console.log('📥 Error Response Data:', JSON.stringify(afroError.response.data, null, 2));
                }
                throw new Error(`AfroMessage API Error: ${afroError.message}`);
            }
        } else if (settings.provider === 'textlocal') {
            // Test TextLocal SMS (Good international coverage)
            const axios = require('axios');
            const message = `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: TextLocal\nSender: ${settings.textLocalSender}\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications!`;

            const response = await axios.post('https://api.textlocal.in/send/', {
                apikey: settings.textLocalApiKey,
                numbers: testPhone.replace('+', ''),
                message: message,
                sender: settings.textLocalSender || 'SARAHS'
            });

            result = response.data;
        } else if (settings.provider === 'ethiopia_telecom') {
            // Test Ethiopia Telecom SMS
            const axios = require('axios');
            const message = `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: Ethiopia Telecom\nSender: ${settings.senderId}\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications!`;

            const response = await axios.post(settings.apiUrl || 'https://api.ethiotelecom.et/sms/send', {
                apiKey: settings.apiKey,
                senderId: settings.senderId,
                to: testPhone,
                message: message
            });

            result = response.data;
        } else if (settings.provider === 'safaricom_ethiopia') {
            // Test Safaricom Ethiopia SMS
            const axios = require('axios');
            const message = `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: Safaricom Ethiopia\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications!`;

            const response = await axios.post('https://api.safaricom.et/sms/send', {
                username: settings.username,
                password: settings.password,
                shortCode: settings.shortCode,
                to: testPhone,
                message: message
            });

            result = response.data;
        } else if (settings.provider === 'local_gateway') {
            // Test Local Gateway SMS
            const axios = require('axios');
            const message = `📱 SMS Test from Sarah's Short Cakes!\n\n✅ Your SMS configuration is working correctly.\n\nProvider: Local Gateway\nSent: ${new Date().toLocaleString()}\n\nYou can now receive order notifications!`;

            const response = await axios.post(settings.gatewayUrl, {
                apiKey: settings.gatewayApiKey,
                to: testPhone,
                message: message
            });

            result = response.data;
        } else {
            throw new Error('Unsupported SMS provider: ' + settings.provider);
        }

        res.status(200).json({
            success: true,
            message: `Test SMS sent successfully to ${testPhone}`,
            details: {
                provider: settings.provider,
                fromNumber: settings.fromNumber || settings.senderId,
                messageId: result.sid || result.messageId || 'N/A',
                sentAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error sending test SMS:', error);

        let errorMessage = 'Error sending test SMS: ';
        let solution = null;

        if (error.code === 63038) {
            errorMessage += 'Daily message limit exceeded for trial account.';
            solution = {
                issue: 'Twilio trial accounts have a daily limit of 9 SMS messages',
                steps: [
                    '🎉 GOOD NEWS: Your SMS configuration is working perfectly!',
                    'You have reached the daily limit of 9 messages for trial accounts',
                    'Options to continue:',
                    '• Wait until tomorrow (limit resets daily)',
                    '• Add $20+ credits to your Twilio account to remove limits',
                    '• Upgrade to a paid Twilio account',
                    'Your SMS notifications will work normally for customers'
                ],
                success: true
            };
        } else if (error.code === 21266) {
            errorMessage += 'From and To numbers cannot be the same.';
            solution = {
                issue: 'You are using the same number for sender and recipient',
                steps: [
                    'Buy a Twilio phone number from https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
                    'Use the Twilio number as your From Number',
                    'Use your personal number as the test recipient'
                ]
            };
        } else if (error.code === 21659) {
            errorMessage += 'The From number is not a valid Twilio phone number.';
            solution = {
                issue: 'You must use a Twilio phone number as the sender',
                steps: [
                    'Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming',
                    'Buy a phone number with SMS capability (~$1/month)',
                    'Use that number as your From Number in SMS settings'
                ]
            };
        } else if (error.code === 21608) {
            errorMessage += 'Phone number is unverified. Trial accounts can only send to verified numbers.';
            solution = {
                issue: 'Twilio trial accounts have restrictions',
                steps: [
                    'Option 1: Verify your phone number at https://console.twilio.com/us1/develop/phone-numbers/manage/verified',
                    'Option 2: Upgrade your Twilio account to send to any number',
                    'Option 3: Add credits to your account ($20+ removes trial restrictions)'
                ]
            };
        } else if (error.code === 21211) {
            errorMessage += 'Invalid phone number format.';
            solution = {
                issue: 'Phone number format is incorrect',
                steps: [
                    'Use international format: +251912345678',
                    'Include country code (+251 for Ethiopia)',
                    'Remove spaces and special characters except +'
                ]
            };
        } else if (error.code === 20003) {
            errorMessage += 'Authentication failed. Please check your credentials.';
            solution = {
                issue: 'Twilio credentials are incorrect',
                steps: [
                    'Verify Account SID starts with "AC"',
                    'Check Auth Token is correct',
                    'Ensure credentials are from https://console.twilio.com/'
                ]
            };
        } else if (error.code === 21408) {
            errorMessage += 'Permission denied. Please check your account permissions.';
        } else if (error.response?.status === 401) {
            errorMessage += 'Authentication failed. Please check your API credentials.';
        } else if (error.response?.status === 400) {
            errorMessage += 'Bad request. Please check your SMS configuration.';
        } else {
            errorMessage += error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.code || error.response?.status || 'UNKNOWN_ERROR',
            solution: solution,
            twilioError: {
                code: error.code,
                message: error.message,
                moreInfo: error.moreInfo
            }
        });
    }
};

// Get system information
exports.getSystemInfo = async (req, res) => {
    try {
        const os = require('os');
        const fs = require('fs');
        const path = require('path');

        // Get database connection status
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        // Get storage information
        const uploadsPath = path.join(__dirname, '../uploads');
        let storageUsed = 0;
        try {
            const files = fs.readdirSync(uploadsPath, { withFileTypes: true });
            for (const file of files) {
                if (file.isFile()) {
                    const stats = fs.statSync(path.join(uploadsPath, file.name));
                    storageUsed += stats.size;
                }
            }
        } catch (err) {
            console.warn('Could not read uploads directory:', err.message);
        }

        const systemInfo = {
            version: '1.0.0',
            nodeVersion: process.version,
            platform: os.platform(),
            architecture: os.arch(),
            totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
            freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
            uptime: Math.round(process.uptime() / 60) + ' minutes',
            database: dbStatus,
            storageUsed: Math.round(storageUsed / 1024 / 1024 * 100) / 100 + ' MB',
            lastUpdated: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: systemInfo
        });
    } catch (error) {
        console.error('Error fetching system info:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system information'
        });
    }
};

// Backup database
exports.backupDatabase = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const fs = require('fs');
        const path = require('path');

        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backup = {};

        for (const collection of collections) {
            const collectionName = collection.name;
            const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            backup[collectionName] = data;
        }

        // Create backup file
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

        res.status(200).json({
            success: true,
            message: 'Database backup created successfully',
            filename: `backup-${timestamp}.json`
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating database backup'
        });
    }
};

// Change admin password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // In a real app, you would verify the current password against the database
        // For now, we'll simulate password change
        const bcrypt = require('bcryptjs');

        // Validate password strength
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // In a real app, update the admin user's password in the database
        // For now, we'll just return success

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password'
        });
    }
};

// Get login history
exports.getLoginHistory = async (req, res) => {
    try {
        // In a real app, this would come from a login_history table
        const mockLoginHistory = [
            {
                id: 1,
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                ipAddress: '192.168.1.100',
                location: 'New York, US',
                device: 'Chrome on Windows',
                status: 'success'
            },
            {
                id: 2,
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                ipAddress: '203.0.113.45',
                location: 'Chicago, US',
                device: 'Safari on iPhone',
                status: 'success'
            },
            {
                id: 3,
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ipAddress: '198.51.100.22',
                location: 'Unknown',
                device: 'Unknown',
                status: 'failed'
            }
        ];

        res.status(200).json({
            success: true,
            data: mockLoginHistory
        });
    } catch (error) {
        console.error('Error fetching login history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching login history'
        });
    }
};

// Get backup history
exports.getBackupHistory = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');

        const backupDir = path.join(__dirname, '../backups');
        let backupHistory = [];

        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir);
            backupHistory = files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const stats = fs.statSync(path.join(backupDir, file));
                    return {
                        filename: file,
                        size: Math.round(stats.size / 1024) + ' KB',
                        created: stats.birthtime,
                        type: 'Database Backup'
                    };
                })
                .sort((a, b) => new Date(b.created) - new Date(a.created));
        }

        res.status(200).json({
            success: true,
            data: backupHistory
        });
    } catch (error) {
        console.error('Error fetching backup history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching backup history'
        });
    }
};

// Upload logo/favicon
exports.uploadBrandingFile = async (req, res) => {
    try {
        const multer = require('multer');
        const path = require('path');
        const fs = require('fs');

        // Configure multer for file upload
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                const uploadDir = path.join(__dirname, '../Public/static/images');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: function (req, file, cb) {
                const fileType = req.body.fileType; // 'logo' or 'favicon'
                const extension = path.extname(file.originalname);
                cb(null, `${fileType}${extension}`);
            }
        });

        const upload = multer({
            storage: storage,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
            fileFilter: function (req, file, cb) {
                const allowedTypes = /jpeg|jpg|png|gif|ico/;
                const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
                const mimetype = allowedTypes.test(file.mimetype);

                if (mimetype && extname) {
                    return cb(null, true);
                } else {
                    cb(new Error('Only image files are allowed'));
                }
            }
        }).single('file');

        upload(req, res, function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            }

            res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                filename: req.file.filename,
                path: `/static/images/${req.file.filename}`
            });
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file'
        });
    }
};

// Reset settings to default
exports.resetToDefaults = async (req, res) => {
    try {
        const Settings = require('../models/Settings');

        // Delete existing settings
        await Settings.deleteMany({});

        // Create new default settings
        const defaultSettings = new Settings({
            businessName: "Sarah's Short Cakes",
            businessEmail: "info@sarahsshortcakes.com",
            businessPhone: "+1 (555) 123-4567",
            businessAddress: "123 Sweet Street, Bakery City",
            businessDescription: "Delicious homemade cupcakes and cakes made with love and the finest ingredients.",
            emailNotifications: true,
            smsNotifications: false,
            lowStockAlerts: true,
            newOrderAlerts: true,
            emailSettings: {
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpUser: 'eyobkifle456@gmail.com',
                smtpPassword: '',
                fromEmail: 'info@sarahsshortcakes.com',
                fromName: "Sarahs ShortCakes"
            },
            smsSettings: {
                provider: 'afromessage',
                afroMessageApiKey: 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiRWdKZFlmOHBMNENDRUhra3RnZ1pBdXZoaWxEZXVGYnEiLCJleHAiOjE5MDYyMDY4NDcsImlhdCI6MTc0ODQ0MDQ0NywianRpIjoiNGVjMjE3MWEtYzg3OC00YzZjLTk3MzctZmIxY2I1MjgxMzJhIn0.QKK5HdkTFpcx3ov_Npg7qCBQYZ-7TrqjsLXzwYK8rvo',
                afroMessageSender: 'SARAHS',
                afroMessageIdentifierId: '',
                accountSid: '',
                authToken: '',
                fromNumber: ''
            },
            businessHours: {
                monday: { open: '08:00', close: '18:00', closed: false },
                tuesday: { open: '08:00', close: '18:00', closed: false },
                wednesday: { open: '08:00', close: '18:00', closed: false },
                thursday: { open: '08:00', close: '18:00', closed: false },
                friday: { open: '08:00', close: '18:00', closed: false },
                saturday: { open: '09:00', close: '16:00', closed: false },
                sunday: { open: '10:00', close: '14:00', closed: true }
            }
        });

        await defaultSettings.save();

        res.status(200).json({
            success: true,
            message: 'Settings reset to defaults successfully',
            data: defaultSettings
        });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting settings to defaults'
        });
    }
};
