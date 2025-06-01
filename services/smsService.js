const axios = require('axios');
const Settings = require('../models/Settings');

class SmsService {
    constructor() {
        this.client = null;
        this.fromNumber = null;
        this.provider = null;
    }

    async initializeClient(smsSettings = null) {
        try {
            if (!smsSettings) {
                const settings = await Settings.findOne();
                smsSettings = settings?.smsSettings;
            }

            if (!smsSettings) {
                throw new Error('SMS settings not configured');
            }

            // Check if test mode is enabled
            if (smsSettings.testMode) {
                console.log('📱 SMS service initialized in TEST MODE - SMS messages will be logged to console');
                this.testMode = true;
                this.provider = smsSettings.provider || 'ethiopia_telecom';
                return true;
            }

            this.testMode = false;
            this.provider = smsSettings.provider || process.env.SMS_PROVIDER || 'afromessage';

            switch (this.provider) {
                case 'twilio':
                    if (!smsSettings.accountSid || !smsSettings.authToken) {
                        throw new Error('Twilio credentials not configured');
                    }
                    const twilio = require('twilio');
                    this.client = twilio(smsSettings.accountSid, smsSettings.authToken);
                    this.fromNumber = smsSettings.fromNumber;
                    break;

                case 'afromessage':
                    // Use environment variables as fallback
                    const afroApiKey = smsSettings.afroMessageApiKey || process.env.AFROMESSAGE_API_KEY;
                    const afroIdentifierId = smsSettings.afroMessageIdentifierId || process.env.AFROMESSAGE_IDENTIFIER_ID;
                    const afroSender = smsSettings.afroMessageSender || process.env.AFROMESSAGE_SENDER;

                    if (!afroApiKey || !afroIdentifierId) {
                        throw new Error('AfroMessage credentials not configured');
                    }
                    this.afroMessageApiKey = afroApiKey;
                    this.afroMessageIdentifierId = afroIdentifierId;
                    this.afroMessageSender = afroSender || 'SARAHS';
                    this.afroMessageApiUrl = smsSettings.afroMessageApiUrl || process.env.AFROMESSAGE_API_URL || 'https://api.afromessage.com/api/send';
                    break;

                case 'ethiopia_telecom':
                    if (!smsSettings.apiKey || !smsSettings.senderId) {
                        throw new Error('Ethiopia Telecom SMS credentials not configured');
                    }
                    this.apiKey = smsSettings.apiKey;
                    this.senderId = smsSettings.senderId;
                    this.apiUrl = smsSettings.apiUrl || 'https://api.ethiotelecom.et/sms/send';
                    break;

                case 'safaricom_ethiopia':
                    if (!smsSettings.username || !smsSettings.password) {
                        throw new Error('Safaricom Ethiopia SMS credentials not configured');
                    }
                    this.username = smsSettings.username;
                    this.password = smsSettings.password;
                    this.apiUrl = smsSettings.apiUrl || 'https://api.safaricom.et/sms/send';
                    break;

                case 'local_gateway':
                    if (!smsSettings.gatewayUrl || !smsSettings.apiKey) {
                        throw new Error('Local SMS gateway credentials not configured');
                    }
                    this.gatewayUrl = smsSettings.gatewayUrl;
                    this.apiKey = smsSettings.apiKey;
                    break;

                default:
                    throw new Error(`Unsupported SMS provider: ${this.provider}`);
            }

            console.log(`SMS service initialized successfully with provider: ${this.provider}`);
            return true;
        } catch (error) {
            console.error('Error initializing SMS service:', error);
            throw error;
        }
    }

    async sendSms(to, message) {
        try {
            if (!this.provider) {
                await this.initializeClient();
            }

            // Format phone number for Ethiopia
            const formattedTo = this.formatEthiopianPhoneNumber(to);

            // Check for test mode from settings
            const settings = await Settings.findOne();
            const isTestMode = this.testMode || settings?.smsSettings?.testMode;

            // If in test mode, log the SMS instead of sending
            if (isTestMode) {
                console.log('\n📱 SMS TEST MODE - SMS would be sent:');
                console.log('='.repeat(50));
                console.log(`Provider: ${this.provider}`);
                console.log(`To: ${formattedTo}`);
                console.log(`Message: ${message}`);
                console.log(`Carrier Info:`, this.getEthiopianCarrierInfo(formattedTo));
                console.log('='.repeat(50));
                return { messageId: 'test-mode-' + Date.now(), status: 'test-sent', provider: this.provider };
            }

            let result;

            switch (this.provider) {
                case 'twilio':
                    result = await this.sendViaTwilio(formattedTo, message);
                    break;

                case 'afromessage':
                    result = await this.sendViaAfroMessage(formattedTo, message);
                    break;

                case 'ethiopia_telecom':
                    result = await this.sendViaEthiopiaTelecom(formattedTo, message);
                    break;

                case 'safaricom_ethiopia':
                    result = await this.sendViaSafaricomEthiopia(formattedTo, message);
                    break;

                case 'local_gateway':
                    result = await this.sendViaLocalGateway(formattedTo, message);
                    break;

                default:
                    throw new Error(`Unsupported SMS provider: ${this.provider}`);
            }

            console.log('SMS sent successfully via', this.provider, ':', result.messageId || result.sid);
            return result;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }

    async sendViaTwilio(to, message) {
        if (!this.client || !this.fromNumber) {
            throw new Error('Twilio client not properly initialized');
        }

        const result = await this.client.messages.create({
            body: message,
            from: this.fromNumber,
            to: to
        });

        return { messageId: result.sid, status: result.status };
    }

    async sendViaAfroMessage(to, message) {
        if (!this.afroMessageApiKey || !this.afroMessageIdentifierId) {
            throw new Error('AfroMessage client not properly initialized');
        }

        console.log('🚀 SENDING AFROMESSAGE SMS:');
        console.log('📞 To:', to);
        console.log('📝 Message:', message);
        console.log('🔑 API Key:', this.afroMessageApiKey ? 'Present' : 'Missing');
        console.log('👤 Sender:', this.afroMessageSender);
        console.log('🆔 Identifier ID:', this.afroMessageIdentifierId);

        // Format the request for AfroMessage API (GET method with query parameters)
        const requestParams = {
            from: this.afroMessageIdentifierId,
            sender: this.afroMessageSender,
            to: to.replace(/\D/g, ''), // Remove non-digits
            message: message,
            callback: '' // Optional callback URL
        };

        console.log('📡 Request URL:', this.afroMessageApiUrl);
        console.log('📦 Request Params:', requestParams);

        const response = await axios.get(this.afroMessageApiUrl, {
            params: requestParams,
            headers: {
                'Authorization': `Bearer ${this.afroMessageApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        console.log('📨 AfroMessage Response:', response.data);

        // Check if the response indicates success
        const isSuccess = response.data && (
            response.data.acknowledge === 'success' ||
            response.data.status === 'success' ||
            response.status === 200
        );

        if (isSuccess) {
            return {
                messageId: response.data.messageId || response.data.id || 'afro-' + Date.now(),
                status: 'sent',
                provider: 'afromessage',
                response: response.data
            };
        } else {
            throw new Error('AfroMessage API returned error: ' + JSON.stringify(response.data));
        }
    }

    async sendViaEthiopiaTelecom(to, message) {
        const payload = {
            apiKey: this.apiKey,
            senderId: this.senderId,
            to: to,
            message: message,
            type: 'text'
        };

        const response = await axios.post(this.apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        if (response.data.success) {
            return {
                messageId: response.data.messageId || response.data.id,
                status: 'sent',
                provider: 'ethiopia_telecom'
            };
        } else {
            throw new Error(response.data.message || 'Failed to send SMS via Ethiopia Telecom');
        }
    }

    async sendViaSafaricomEthiopia(to, message) {
        const payload = {
            username: this.username,
            password: this.password,
            to: to,
            message: message,
            from: 'SHORTCODE' // Safaricom Ethiopia shortcode
        };

        const response = await axios.post(this.apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.status === 'success') {
            return {
                messageId: response.data.messageId,
                status: 'sent',
                provider: 'safaricom_ethiopia'
            };
        } else {
            throw new Error(response.data.message || 'Failed to send SMS via Safaricom Ethiopia');
        }
    }

    async sendViaLocalGateway(to, message) {
        const payload = {
            apiKey: this.apiKey,
            to: to,
            message: message,
            timestamp: new Date().toISOString()
        };

        const response = await axios.post(this.gatewayUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            }
        });

        if (response.data.success) {
            return {
                messageId: response.data.messageId,
                status: 'sent',
                provider: 'local_gateway'
            };
        } else {
            throw new Error(response.data.message || 'Failed to send SMS via local gateway');
        }
    }

    async sendTestSms(testPhone, smsSettings) {
        try {
            await this.initializeClient(smsSettings);

            const message = `Test SMS from Sarah's Short Cakes admin system. If you received this message, your SMS configuration is working correctly! Sent at: ${new Date().toLocaleString()}`;

            await this.sendSms(testPhone, message);
            return true;
        } catch (error) {
            console.error('Error sending test SMS:', error);
            throw error;
        }
    }

    async sendOrderConfirmation(order, customerPhone) {
        try {
            const message = `Hi ${order.customer?.firstName || order.guestInfo?.name || 'Customer'}! Your order #${order.orderNumber || order._id.toString().slice(-6)} has been confirmed. Total: $${(order.total || order.totalAmount || 0).toFixed(2)}. We'll notify you when it's ready! - Sarah's Short Cakes`;

            await this.sendSms(customerPhone, message);
            console.log('Order confirmation SMS sent to:', customerPhone);
        } catch (error) {
            console.error('Error sending order confirmation SMS:', error);
            throw error;
        }
    }

    async sendOrderStatusUpdate(order, customerPhone, newStatus) {
        try {
            let message = '';
            const orderRef = order.orderNumber || order._id.toString().slice(-6);
            const customerName = order.customer?.firstName || order.guestInfo?.name || 'Customer';

            switch (newStatus.toLowerCase()) {
                case 'confirmed':
                    message = `Hi ${customerName}! Your order #${orderRef} has been confirmed and is being prepared. - Sarah's Short Cakes`;
                    break;
                case 'preparing':
                    message = `Hi ${customerName}! Your order #${orderRef} is now being prepared by our bakers. - Sarah's Short Cakes`;
                    break;
                case 'ready':
                    message = `Hi ${customerName}! Your order #${orderRef} is ready for pickup! Please come by when convenient. - Sarah's Short Cakes`;
                    break;
                case 'completed':
                    message = `Hi ${customerName}! Thank you for your order #${orderRef}. We hope you enjoyed your treats! - Sarah's Short Cakes`;
                    break;
                case 'cancelled':
                    message = `Hi ${customerName}! Your order #${orderRef} has been cancelled. If you have questions, please contact us. - Sarah's Short Cakes`;
                    break;
                default:
                    message = `Hi ${customerName}! Your order #${orderRef} status has been updated to: ${newStatus}. - Sarah's Short Cakes`;
            }

            await this.sendSms(customerPhone, message);
            console.log('Order status update SMS sent to:', customerPhone);
        } catch (error) {
            console.error('Error sending order status update SMS:', error);
            throw error;
        }
    }

    async sendLowStockAlert(lowStockItems, adminPhones) {
        try {
            const itemNames = lowStockItems.slice(0, 3).map(item => item.name).join(', ');
            const additionalCount = lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : '';

            const message = `🚨 LOW STOCK ALERT: ${itemNames}${additionalCount} need restocking. Check admin panel for details. - Sarah's Short Cakes`;

            for (const phone of adminPhones) {
                await this.sendSms(phone, message);
            }
            console.log('Low stock alert SMS sent to admins');
        } catch (error) {
            console.error('Error sending low stock alert SMS:', error);
            throw error;
        }
    }

    async sendNewOrderAlert(order, adminPhones) {
        try {
            const orderRef = order.orderNumber || order._id.toString().slice(-6);
            const customerName = order.customer?.firstName || order.guestInfo?.name || 'Guest';

            const message = `🎉 NEW ORDER: #${orderRef} from ${customerName}. Total: $${(order.total || order.totalAmount || 0).toFixed(2)}. ${order.items.length} item(s). Check admin panel to process. - Sarah's Short Cakes`;

            for (const phone of adminPhones) {
                await this.sendSms(phone, message);
            }
            console.log('New order alert SMS sent to admins');
        } catch (error) {
            console.error('Error sending new order alert SMS:', error);
            throw error;
        }
    }

    async sendDeliveryNotification(order, customerPhone, deliveryInfo) {
        try {
            const orderRef = order.orderNumber || order._id.toString().slice(-6);
            const customerName = order.customer?.firstName || order.guestInfo?.name || 'Customer';

            const message = `Hi ${customerName}! Your order #${orderRef} is out for delivery. Expected delivery: ${deliveryInfo.estimatedTime}. Driver: ${deliveryInfo.driverName}. - Sarah's Short Cakes`;

            await this.sendSms(customerPhone, message);
            console.log('Delivery notification SMS sent to:', customerPhone);
        } catch (error) {
            console.error('Error sending delivery notification SMS:', error);
            throw error;
        }
    }

    async sendPromotionalMessage(customers, message) {
        try {
            const results = [];

            for (const customer of customers) {
                if (customer.phone && customer.smsOptIn) {
                    try {
                        const result = await this.sendSms(customer.phone, message);
                        results.push({ customer: customer._id, success: true, messageId: result.sid });
                    } catch (error) {
                        results.push({ customer: customer._id, success: false, error: error.message });
                    }
                }
            }

            console.log(`Promotional SMS campaign completed. Sent to ${results.filter(r => r.success).length} customers`);
            return results;
        } catch (error) {
            console.error('Error sending promotional SMS:', error);
            throw error;
        }
    }

    async sendAppointmentReminder(appointment, customerPhone) {
        try {
            const appointmentDate = new Date(appointment.date).toLocaleDateString();
            const appointmentTime = appointment.time;
            const customerName = appointment.customer?.firstName || 'Customer';

            const message = `Hi ${customerName}! Reminder: You have an appointment at Sarah's Short Cakes on ${appointmentDate} at ${appointmentTime}. See you soon! - Sarah's Short Cakes`;

            await this.sendSms(customerPhone, message);
            console.log('Appointment reminder SMS sent to:', customerPhone);
        } catch (error) {
            console.error('Error sending appointment reminder SMS:', error);
            throw error;
        }
    }

    formatEthiopianPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Ethiopian phone number patterns:
        // Mobile: 09XXXXXXXX (10 digits) -> +251 9XXXXXXXX
        // Landline: 011XXXXXXX (10 digits) -> +251 11XXXXXXX
        // International format: +251XXXXXXXXX

        if (cleaned.startsWith('251')) {
            // Already has country code
            return `+${cleaned}`;
        } else if (cleaned.startsWith('09')) {
            // Ethiopian mobile number starting with 09
            return `+251${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('9') && cleaned.length === 9) {
            // Ethiopian mobile number without leading 0
            return `+251${cleaned}`;
        } else if (cleaned.startsWith('011') || cleaned.startsWith('11')) {
            // Ethiopian landline
            const number = cleaned.startsWith('011') ? cleaned.substring(1) : cleaned;
            return `+251${number}`;
        } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
            // Ethiopian number with leading 0
            return `+251${cleaned.substring(1)}`;
        } else if (cleaned.length === 9) {
            // Ethiopian number without leading 0
            return `+251${cleaned}`;
        } else {
            // Fallback - assume it's already properly formatted or international
            return phone.startsWith('+') ? phone : `+${cleaned}`;
        }
    }

    formatPhoneNumber(phone) {
        // Legacy method for backward compatibility
        return this.formatEthiopianPhoneNumber(phone);
    }

    validateEthiopianPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');

        // Ethiopian mobile numbers: 09XXXXXXXX or 9XXXXXXXX
        // Ethiopian landlines: 011XXXXXXX or 11XXXXXXX
        // International format: +251XXXXXXXXX

        if (cleaned.startsWith('251')) {
            // International format
            return cleaned.length >= 12 && cleaned.length <= 13;
        } else if (cleaned.startsWith('09') || cleaned.startsWith('011')) {
            // Local format with area code
            return cleaned.length === 10;
        } else if (cleaned.startsWith('9') || cleaned.startsWith('11')) {
            // Local format without leading 0
            return cleaned.length === 9 || cleaned.length === 8;
        } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
            // Any Ethiopian number with leading 0
            return true;
        } else if (cleaned.length === 9) {
            // Any Ethiopian number without leading 0
            return true;
        }

        return false;
    }

    validatePhoneNumber(phone) {
        // Legacy method for backward compatibility
        return this.validateEthiopianPhoneNumber(phone);
    }

    getEthiopianCarrierInfo(phone) {
        const cleaned = phone.replace(/\D/g, '');
        let number = cleaned;

        // Remove country code if present
        if (number.startsWith('251')) {
            number = number.substring(3);
        }

        // Remove leading 0 if present
        if (number.startsWith('0')) {
            number = number.substring(1);
        }

        // Determine carrier based on number prefix
        if (number.startsWith('9')) {
            const prefix = number.substring(0, 2);
            switch (prefix) {
                case '91':
                    return { carrier: 'Ethio Telecom', type: 'mobile', network: 'GSM' };
                case '92':
                    return { carrier: 'Ethio Telecom', type: 'mobile', network: 'GSM' };
                case '93':
                    return { carrier: 'Ethio Telecom', type: 'mobile', network: 'GSM' };
                case '94':
                    return { carrier: 'Ethio Telecom', type: 'mobile', network: 'GSM' };
                case '96':
                    return { carrier: 'Safaricom Ethiopia', type: 'mobile', network: 'GSM' };
                case '97':
                    return { carrier: 'Safaricom Ethiopia', type: 'mobile', network: 'GSM' };
                default:
                    return { carrier: 'Unknown', type: 'mobile', network: 'GSM' };
            }
        } else if (number.startsWith('11')) {
            return { carrier: 'Ethio Telecom', type: 'landline', network: 'Fixed' };
        } else {
            return { carrier: 'Unknown', type: 'unknown', network: 'Unknown' };
        }
    }

    async getMessageStatus(messageSid) {
        try {
            if (!this.client) {
                await this.initializeClient();
            }

            const message = await this.client.messages(messageSid).fetch();
            return {
                sid: message.sid,
                status: message.status,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
                dateCreated: message.dateCreated,
                dateSent: message.dateSent,
                dateUpdated: message.dateUpdated
            };
        } catch (error) {
            console.error('Error getting message status:', error);
            throw error;
        }
    }

    async getAccountInfo() {
        try {
            if (!this.client) {
                await this.initializeClient();
            }

            const account = await this.client.api.accounts.list({ limit: 1 });
            const balance = await this.client.balance.fetch();

            return {
                accountSid: account[0].sid,
                friendlyName: account[0].friendlyName,
                status: account[0].status,
                balance: balance.balance,
                currency: balance.currency
            };
        } catch (error) {
            console.error('Error getting account info:', error);
            throw error;
        }
    }

    // Test SMS functionality
    async sendTestSms(testPhone = '+251911123456') {
        try {
            console.log(`Sending test SMS to ${testPhone}...`);

            const message = `🧁 Sarah's Short Cakes - SMS Test

✅ SMS Configuration Test Successful!

This is a test message to verify that the SMS notification system is working correctly for Ethiopian customers.

📱 SMS Features Available:
• Order confirmations
• Order status updates
• Admin alerts
• Low stock notifications

Test Details:
📞 Phone: ${testPhone}
⏰ Time: ${new Date().toLocaleString()}
🏢 System: Admin Panel

If you received this SMS, your SMS configuration is working perfectly! 🎉

Sarah's Short Cakes
Test: ${new Date().toLocaleDateString()}`;

            await this.sendSms(testPhone, message);
            console.log(`Test SMS sent successfully to ${testPhone}`);

            return {
                success: true,
                message: `Test SMS sent successfully to ${testPhone}`,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error sending test SMS:', error);
            throw new Error(`Failed to send test SMS: ${error.message}`);
        }
    }
}

module.exports = new SmsService();
