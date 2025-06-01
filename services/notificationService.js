const EmailService = require('./emailService');
const SmsService = require('./smsService');
const Settings = require('../models/Settings');

class NotificationService {
    constructor() {
        this.emailService = EmailService;
        this.smsService = SmsService;
        this.settings = null;
    }

    async initialize() {
        try {
            this.settings = await Settings.findOne();
            if (!this.settings) {
                console.warn('No settings found, using defaults');
                this.settings = {
                    emailNotifications: true,
                    smsNotifications: false,
                    lowStockAlerts: true,
                    newOrderAlerts: true
                };
            }
            console.log('Notification service initialized');
        } catch (error) {
            console.error('Error initializing notification service:', error);
        }
    }

    async sendOrderConfirmation(order) {
        try {
            const customerEmail = order.customer?.email || order.guestInfo?.email;
            const customerPhone = order.customer?.phone || order.guestInfo?.phone;

            // Send email confirmation
            if (this.settings.emailNotifications && customerEmail) {
                await this.emailService.sendOrderConfirmation(order, customerEmail);
                console.log('Order confirmation email sent');
            }

            // Send SMS confirmation
            if (this.settings.smsNotifications && customerPhone) {
                await this.smsService.sendOrderConfirmation(order, customerPhone);
                console.log('Order confirmation SMS sent');
            }
        } catch (error) {
            console.error('Error sending order confirmation:', error);
        }
    }

    async sendOrderStatusUpdate(order, newStatus) {
        try {
            const customerEmail = order.customer?.email || order.guestInfo?.email;
            const customerPhone = order.customer?.phone || order.guestInfo?.phone;

            // Send email update
            if (this.settings.emailNotifications && customerEmail) {
                await this.emailService.sendOrderStatusUpdate(order, customerEmail, newStatus);
                console.log('Order status update email sent');
            }

            // Send SMS update
            if (this.settings.smsNotifications && customerPhone) {
                await this.smsService.sendOrderStatusUpdate(order, customerPhone, newStatus);
                console.log('Order status update SMS sent');
            }
        } catch (error) {
            console.error('Error sending order status update:', error);
        }
    }

    async sendNewOrderAlert(order) {
        try {
            if (!this.settings.newOrderAlerts) {
                return;
            }

            const adminEmails = [this.settings.businessEmail];
            const adminPhones = [this.settings.businessPhone];

            // Send email alert to admins
            if (this.settings.emailNotifications) {
                await this.emailService.sendNewOrderAlert(order, adminEmails);
                console.log('New order alert email sent to admins');
            }

            // Send SMS alert to admins
            if (this.settings.smsNotifications) {
                await this.smsService.sendNewOrderAlert(order, adminPhones);
                console.log('New order alert SMS sent to admins');
            }
        } catch (error) {
            console.error('Error sending new order alert:', error);
        }
    }

    async sendLowStockAlert(lowStockItems) {
        try {
            if (!this.settings.lowStockAlerts || !lowStockItems.length) {
                return;
            }

            const adminEmails = [this.settings.businessEmail];
            const adminPhones = [this.settings.businessPhone];

            // Send email alert to admins
            if (this.settings.emailNotifications) {
                await this.emailService.sendLowStockAlert(lowStockItems, adminEmails);
                console.log('Low stock alert email sent to admins');
            }

            // Send SMS alert to admins
            if (this.settings.smsNotifications) {
                await this.smsService.sendLowStockAlert(lowStockItems, adminPhones);
                console.log('Low stock alert SMS sent to admins');
            }
        } catch (error) {
            console.error('Error sending low stock alert:', error);
        }
    }

    async sendContactMessageReply(originalMessage, replyContent) {
        try {
            const customerEmail = originalMessage.email;

            if (this.settings.emailNotifications && customerEmail) {
                await this.emailService.sendContactMessageReply(originalMessage, replyContent, customerEmail);
                console.log('Contact message reply sent');
            }
        } catch (error) {
            console.error('Error sending contact message reply:', error);
        }
    }

    async sendWelcomeMessage(customer) {
        try {
            const welcomeContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ff69b4; text-align: center;">Welcome to Sarah's Short Cakes!</h2>
                    <p>Dear ${customer.firstName},</p>
                    <p>Thank you for joining Sarah's Short Cakes family! We're excited to serve you delicious homemade cupcakes and cakes.</p>

                    <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>What's Next?</h3>
                        <ul>
                            <li>Browse our delicious cake collection</li>
                            <li>Place your first order</li>
                            <li>Enjoy our freshly baked treats</li>
                        </ul>
                    </div>

                    <p>If you have any questions, feel free to contact us anytime!</p>
                    <p>Happy baking!</p>

                    <hr style="margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Sarah's Short Cakes<br>
                        ${this.settings?.businessAddress || '123 Sweet Street, Bakery City'}<br>
                        ${this.settings?.businessPhone || '(555) 123-4567'}
                    </p>
                </div>
            `;

            if (this.settings.emailNotifications && customer.email) {
                await this.emailService.sendEmail(
                    customer.email,
                    'Welcome to Sarah\'s Short Cakes!',
                    welcomeContent
                );
                console.log('Welcome email sent to new customer');
            }
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    }

    async sendPasswordResetOTP(email, otp, firstName = '') {
        try {
            const otpContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
                    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #ff69b4; margin: 0; font-size: 28px;">Sarah's Short Cakes</h1>
                            <p style="color: #666; margin: 5px 0 0 0;">Password Reset Request</p>
                        </div>

                        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">
                            ${firstName ? `Hi ${firstName}!` : 'Hello!'}
                        </h2>

                        <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            You requested a password reset for your account. Use the verification code below to reset your password:
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #ff69b4; color: white; padding: 20px; border-radius: 10px; display: inline-block; min-width: 200px;">
                                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your verification code is:</p>
                                <h1 style="margin: 10px 0 0 0; font-size: 36px; letter-spacing: 8px; font-weight: bold;">
                                    ${otp}
                                </h1>
                            </div>
                        </div>

                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 25px 0;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                <strong>⏰ Important:</strong> This code will expire in <strong>10 minutes</strong> for security reasons.
                            </p>
                        </div>

                        <div style="background: #f8f9fa; border-radius: 5px; padding: 15px; margin: 25px 0;">
                            <p style="margin: 0; color: #6c757d; font-size: 14px;">
                                <strong>🔒 Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
                            </p>
                        </div>

                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

                        <div style="text-align: center;">
                            <p style="color: #666; font-size: 12px; margin: 0;">
                                Sarah's Short Cakes<br>
                                ${this.settings?.businessAddress || '123 Sweet Street, Bakery City'}<br>
                                ${this.settings?.businessPhone || '(555) 123-4567'}
                            </p>
                        </div>
                    </div>
                </div>
            `;

            await this.emailService.sendEmail(
                email,
                'Password Reset Code - Sarah\'s Short Cakes',
                otpContent
            );
            console.log('Password reset OTP email sent to:', email);
        } catch (error) {
            console.error('Error sending password reset OTP email:', error);
            throw error;
        }
    }

    // Keep the old method for backward compatibility
    async sendPasswordResetEmail(email, resetToken) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

            const resetContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ff69b4; text-align: center;">Password Reset Request</h2>
                    <p>You requested a password reset for your Sarah's Short Cakes account.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #ff69b4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Your Password
                        </a>
                    </div>

                    <p>This link will expire in 1 hour for security reasons.</p>
                    <p>If you didn't request this reset, please ignore this email.</p>

                    <hr style="margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Sarah's Short Cakes<br>
                        ${this.settings?.businessAddress || '123 Sweet Street, Bakery City'}
                    </p>
                </div>
            `;

            await this.emailService.sendEmail(
                email,
                'Password Reset - Sarah\'s Short Cakes',
                resetContent
            );
            console.log('Password reset email sent');
        } catch (error) {
            console.error('Error sending password reset email:', error);
        }
    }

    async sendPromotionalMessage(customers, subject, content, includeEmail = true, includeSms = false) {
        try {
            const results = {
                emailsSent: 0,
                smsSent: 0,
                errors: []
            };

            for (const customer of customers) {
                try {
                    // Send email
                    if (includeEmail && customer.email && customer.emailOptIn !== false) {
                        await this.emailService.sendEmail(customer.email, subject, content);
                        results.emailsSent++;
                    }

                    // Send SMS
                    if (includeSms && customer.phone && customer.smsOptIn === true) {
                        const smsContent = this.stripHtmlForSms(content);
                        await this.smsService.sendSms(customer.phone, smsContent);
                        results.smsSent++;
                    }
                } catch (error) {
                    results.errors.push({
                        customer: customer._id,
                        error: error.message
                    });
                }
            }

            console.log('Promotional campaign completed:', results);
            return results;
        } catch (error) {
            console.error('Error sending promotional messages:', error);
            throw error;
        }
    }

    async sendMaintenanceNotification(message, scheduledTime) {
        try {
            const adminEmails = [this.settings.businessEmail];

            const maintenanceContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ff6b6b; text-align: center;">🔧 Scheduled Maintenance Notice</h2>
                    <p>This is an automated notification about scheduled system maintenance.</p>

                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Maintenance Details</h3>
                        <p><strong>Scheduled Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
                        <p><strong>Message:</strong> ${message}</p>
                    </div>

                    <p>Please ensure all critical operations are completed before the maintenance window.</p>

                    <hr style="margin: 30px 0;">
                    <p style="color: #666; font-size: 12px; text-align: center;">
                        Sarah's Short Cakes Admin System<br>
                        Automated Notification - ${new Date().toLocaleString()}
                    </p>
                </div>
            `;

            await this.emailService.sendEmail(
                adminEmails[0],
                'Scheduled Maintenance Notification',
                maintenanceContent
            );
            console.log('Maintenance notification sent');
        } catch (error) {
            console.error('Error sending maintenance notification:', error);
        }
    }

    stripHtmlForSms(htmlContent) {
        return htmlContent
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 160); // SMS character limit
    }

    async refreshSettings() {
        await this.initialize();
    }

    // Utility method to check if notifications are enabled
    isEmailEnabled() {
        return this.settings?.emailNotifications === true;
    }

    isSmsEnabled() {
        return this.settings?.smsNotifications === true;
    }

    areOrderAlertsEnabled() {
        return this.settings?.newOrderAlerts === true;
    }

    areStockAlertsEnabled() {
        return this.settings?.lowStockAlerts === true;
    }
}

module.exports = new NotificationService();
