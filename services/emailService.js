const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

class EmailService {
    constructor() {
        this.transporter = null;
        this.testMode = false;
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds base delay
    }

    async initializeTransporter(emailSettings = null) {
        try {
            if (!emailSettings) {
                const settings = await Settings.findOne();
                emailSettings = settings?.emailSettings;
            }

            // If no settings in database, use environment variables as fallback
            if (!emailSettings) {
                console.log('📧 No email settings in database, using environment variables...');
                emailSettings = {
                    smtpHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
                    smtpPort: process.env.EMAIL_PORT || 587,
                    smtpUser: process.env.EMAIL_USER || 'eyobkifle456@gmail.com',
                    smtpPassword: process.env.EMAIL_PASSWORD || 'eqjd qpia odbz tiux',
                    fromEmail: process.env.EMAIL_FROM || 'info@sarahsshortcakes.com',
                    fromName: process.env.EMAIL_FROM_NAME || "Sarah's Short Cakes",
                    useSSL: process.env.EMAIL_SECURE === 'true' ? true : false,
                    testMode: false
                };
                console.log('✅ Using environment email settings');
            }

            // Check if test mode is enabled
            if (emailSettings.testMode) {
                console.log('📧 Email service initialized in TEST MODE - emails will be logged to console');
                this.testMode = true;
                return true;
            }

            if (!emailSettings.smtpHost) {
                throw new Error('Email SMTP settings not configured');
            }

            console.log('📧 Creating SMTP transporter with settings:', {
                host: emailSettings.smtpHost,
                port: emailSettings.smtpPort,
                secure: emailSettings.useSSL,
                user: emailSettings.smtpUser ? 'Present' : 'Missing',
                password: emailSettings.smtpPassword ? 'Present' : 'Missing'
            });

            // Gmail SMTP configuration fix
            const isGmail = emailSettings.smtpHost.includes('gmail.com');
            const smtpConfig = {
                host: emailSettings.smtpHost,
                port: emailSettings.smtpPort,
                secure: emailSettings.smtpPort === 465, // true for 465, false for other ports like 587
                auth: {
                    user: emailSettings.smtpUser,
                    pass: emailSettings.smtpPassword
                }
            };

            // For Gmail and port 587, use STARTTLS
            if (isGmail && emailSettings.smtpPort === 587) {
                smtpConfig.secure = false;
                smtpConfig.requireTLS = true;
                smtpConfig.tls = {
                    ciphers: 'SSLv3'
                };
            }

            console.log('📧 SMTP Configuration:', {
                ...smtpConfig,
                auth: { user: smtpConfig.auth.user, pass: '***' }
            });

            this.transporter = nodemailer.createTransport(smtpConfig);

            // Verify connection
            await this.transporter.verify();
            console.log('Email service initialized successfully');
            this.testMode = false;
            return true;
        } catch (error) {
            console.error('Error initializing email service:', error);
            throw error;
        }
    }

    async sendEmail(to, subject, htmlContent, textContent = null) {
        try {
            const settings = await Settings.findOne();

            // Check for test mode first
            const isTestMode = this.testMode || settings?.emailSettings?.testMode;

            // If in test mode, log the email instead of sending
            if (isTestMode) {
                const fromEmail = settings?.emailSettings?.fromEmail || 'info@sarahsshortcakes.com';
                const fromName = settings?.emailSettings?.fromName || "Sarah's Short Cakes";

                const mailOptions = {
                    from: `"${fromName}" <${fromEmail}>`,
                    to: to,
                    subject: subject,
                    html: htmlContent,
                    text: textContent || this.stripHtml(htmlContent)
                };

                console.log('\n📧 EMAIL TEST MODE - Email would be sent:');
                console.log('='.repeat(50));
                console.log(`From: ${mailOptions.from}`);
                console.log(`To: ${mailOptions.to}`);
                console.log(`Subject: ${mailOptions.subject}`);
                console.log(`Text Content:\n${mailOptions.text}`);
                console.log('='.repeat(50));
                return { messageId: 'test-mode-' + Date.now() };
            }

            if (!this.transporter) {
                await this.initializeTransporter();
            }

            const fromEmail = settings?.emailSettings?.fromEmail || 'info@sarahsshortcakes.com';
            const fromName = settings?.emailSettings?.fromName || "Sarah's Short Cakes";

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: to,
                subject: subject,
                html: htmlContent,
                text: textContent || this.stripHtml(htmlContent)
            };

            // Retry mechanism for network issues
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const result = await this.transporter.sendMail(mailOptions);
                    console.log(`✅ Email sent successfully on attempt ${attempt}:`, result.messageId);
                    return result;
                } catch (error) {
                    lastError = error;
                    console.warn(`⚠️ Email attempt ${attempt} failed:`, error.message);

                    // If it's a network error, wait and retry
                    if (error.code === 'EDNS' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                        if (attempt < 3) {
                            console.log(`🔄 Retrying email in ${attempt * 2} seconds...`);
                            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                            continue;
                        }
                    }
                    throw error;
                }
            }

            throw lastError;
        } catch (error) {
            console.error('❌ Final email sending error:', error);

            // Log the email for manual review/retry
            this.logFailedEmail(to, subject, htmlContent, error);
            throw error;
        }
    }

    // Log failed emails for manual review
    logFailedEmail(to, subject, htmlContent, error) {
        const failedEmail = {
            timestamp: new Date().toISOString(),
            to,
            subject,
            htmlContent,
            error: error.message,
            errorCode: error.code
        };

        console.log('📝 Logging failed email for manual review:', {
            to,
            subject,
            errorCode: error.code,
            timestamp: failedEmail.timestamp
        });

        // In a production environment, you might want to save this to a database
        // or send to a monitoring service
    }

    async sendTestEmail(testEmail, emailSettings) {
        try {
            await this.initializeTransporter(emailSettings);

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ff69b4;">Email Configuration Test</h2>
                    <p>This is a test email from Sarah's Short Cakes admin system.</p>
                    <p>If you received this email, your email configuration is working correctly!</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        Sent at: ${new Date().toLocaleString()}<br>
                        From: Sarah's Short Cakes Admin System
                    </p>
                </div>
            `;

            await this.sendEmail(testEmail, 'Email Configuration Test', htmlContent);
            return true;
        } catch (error) {
            console.error('Error sending test email:', error);
            throw error;
        }
    }

    async sendOrderConfirmation(order, customerEmail) {
        try {
            const htmlContent = this.generateOrderConfirmationHtml(order);
            const subject = `Order Confirmation - ${order.orderNumber || order._id}`;

            await this.sendEmail(customerEmail, subject, htmlContent);
            console.log('Order confirmation email sent to:', customerEmail);
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
            throw error;
        }
    }

    async sendOrderStatusUpdate(order, customerEmail, newStatus) {
        try {
            let subject, htmlContent;

            if (newStatus === 'confirmed' || newStatus === 'accepted') {
                // Order confirmation email
                subject = `Order Confirmed - ${order.orderNumber || order._id}`;
                htmlContent = this.generateOrderConfirmationHtml(order);
            } else if (newStatus === 'completed') {
                // Order fulfillment notification
                subject = `Order Ready - ${order.orderNumber || order._id}`;
                htmlContent = this.generateOrderCompletionHtml(order);
            } else {
                // General status update
                subject = `Order Update - ${order.orderNumber || order._id}`;
                htmlContent = this.generateOrderStatusUpdateHtml(order, newStatus);
            }

            await this.sendEmail(customerEmail, subject, htmlContent);
            console.log(`Order ${newStatus} email sent to:`, customerEmail);
        } catch (error) {
            console.error('Error sending order status update email:', error);
            throw error;
        }
    }

    async sendWelcomeEmail(customer) {
        try {
            const subject = 'Welcome to Sarah\'s ShortCakes! 🧁';
            const htmlContent = this.generateWelcomeEmailHtml(customer);

            await this.sendEmail(customer.email, subject, htmlContent);
            console.log('Welcome email sent to:', customer.email);
        } catch (error) {
            console.error('Error sending welcome email:', error);
            throw error;
        }
    }

    async sendLowStockAlert(lowStockItems, adminEmails = ['eyobkifle456@gmail.com']) {
        try {
            const htmlContent = this.generateLowStockAlertHtml(lowStockItems);
            const subject = `🚨 Low Stock Alert - ${lowStockItems.length} Item${lowStockItems.length > 1 ? 's' : ''} Need Restocking`;

            for (const email of adminEmails) {
                await this.sendEmail(email, subject, htmlContent);
            }
            console.log('Low stock alert emails sent to admins:', adminEmails);
        } catch (error) {
            console.error('Error sending low stock alert emails:', error);
            throw error;
        }
    }

    async sendNewOrderAlert(order, adminEmails) {
        try {
            const htmlContent = this.generateNewOrderAlertHtml(order);
            const subject = `New Order Received - ${order.orderNumber || order._id}`;

            for (const email of adminEmails) {
                await this.sendEmail(email, subject, htmlContent);
            }
            console.log('New order alert emails sent to admins');
        } catch (error) {
            console.error('Error sending new order alert emails:', error);
            throw error;
        }
    }

    async sendContactMessageReply(originalMessage, replyContent, customerEmail) {
        try {
            const htmlContent = this.generateContactReplyHtml(originalMessage, replyContent);
            const subject = `Re: ${originalMessage.subject || 'Your Message'}`;

            await this.sendEmail(customerEmail, subject, htmlContent);
            console.log('Contact message reply sent to:', customerEmail);
        } catch (error) {
            console.error('Error sending contact message reply:', error);
            throw error;
        }
    }

    generateOrderConfirmationHtml(order) {
        const items = order.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff69b4; text-align: center;">Order Confirmation</h2>
                <p>Dear ${order.customer?.firstName || order.guestInfo?.name || 'Customer'},</p>
                <p>Thank you for your order! We have received your order and it is being processed.</p>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Order Details</h3>
                    <p><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #ff69b4; color: white;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f0f0f0; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; text-align: right;">Total Amount:</td>
                            <td style="padding: 10px; text-align: right;">$${(order.total || order.totalAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <p>We will notify you when your order is ready for pickup or delivery.</p>
                <p>Thank you for choosing Sarah's Short Cakes!</p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Sarah's Short Cakes<br>
                    123 Sweet Street, Bakery City<br>
                    (555) 123-4567
                </p>
            </div>
        `;
    }

    generateOrderStatusUpdateHtml(order, newStatus) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff69b4; text-align: center;">Order Status Update</h2>
                <p>Dear ${order.customer?.firstName || order.guestInfo?.name || 'Customer'},</p>
                <p>Your order status has been updated.</p>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Order Information</h3>
                    <p><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
                    <p><strong>New Status:</strong> <span style="color: #ff69b4; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
                    <p><strong>Updated:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <p>Thank you for your patience!</p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Sarah's Short Cakes<br>
                    123 Sweet Street, Bakery City<br>
                    (555) 123-4567
                </p>
            </div>
        `;
    }

    generateLowStockAlertHtml(lowStockItems) {
        const items = lowStockItems.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.threshold} ${item.unit}</td>
            </tr>
        `).join('');

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff6b6b; text-align: center;">⚠️ Low Stock Alert</h2>
                <p>The following ingredients are running low and need to be restocked:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #ff6b6b; color: white;">
                            <th style="padding: 10px; text-align: left;">Ingredient</th>
                            <th style="padding: 10px; text-align: center;">Current Stock</th>
                            <th style="padding: 10px; text-align: center;">Threshold</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items}
                    </tbody>
                </table>

                <p>Please restock these items as soon as possible to avoid disruption to operations.</p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Sarah's Short Cakes Admin System<br>
                    Automated Alert - ${new Date().toLocaleString()}
                </p>
            </div>
        `;
    }

    generateNewOrderAlertHtml(order) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4CAF50; text-align: center;">🎉 New Order Received!</h2>
                <p>A new order has been placed and requires your attention.</p>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>Order Summary</h3>
                    <p><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
                    <p><strong>Customer:</strong> ${order.customer?.firstName || order.guestInfo?.name || 'Guest Customer'}</p>
                    <p><strong>Total Amount:</strong> $${(order.total || order.totalAmount || 0).toFixed(2)}</p>
                    <p><strong>Items:</strong> ${order.items.length} item(s)</p>
                    <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <p>Please log in to the admin panel to review and process this order.</p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Sarah's Short Cakes Admin System<br>
                    Automated Alert - ${new Date().toLocaleString()}
                </p>
            </div>
        `;
    }

    generateContactReplyHtml(originalMessage, replyContent) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #ff69b4; text-align: center;">Reply from Sarah's Short Cakes</h2>
                <p>Dear ${originalMessage.name},</p>
                <p>Thank you for contacting us. Here is our response to your message:</p>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4>Our Response:</h4>
                    <p>${replyContent.replace(/\n/g, '<br>')}</p>
                </div>

                <div style="background: #e9e9e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h4>Your Original Message:</h4>
                    <p><strong>Subject:</strong> ${originalMessage.subject}</p>
                    <p><strong>Message:</strong> ${originalMessage.message.replace(/\n/g, '<br>')}</p>
                    <p><strong>Sent:</strong> ${new Date(originalMessage.createdAt).toLocaleString()}</p>
                </div>

                <p>If you have any further questions, please don't hesitate to contact us.</p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Sarah's Short Cakes<br>
                    123 Sweet Street, Bakery City<br>
                    (555) 123-4567<br>
                    info@sarahsshortcakes.com
                </p>
            </div>
        `;
    }

    generateOrderCompletionHtml(order) {
        const items = order.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name || item.productId}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const deliveryInfo = order.deliveryInfo || {};
        const isDelivery = deliveryInfo.method === 'delivery';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4CAF50; text-align: center;">🎉 Your Order is Ready!</h2>
                <p>Dear ${order.customer?.firstName || order.guestInfo?.name || 'Customer'},</p>
                <p>Great news! Your order has been completed and is ready for ${isDelivery ? 'delivery' : 'pickup'}.</p>

                <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                    <h3 style="margin-top: 0; color: #2e7d32;">Order Details</h3>
                    <p><strong>Order Number:</strong> ${order.orderNumber || order._id}</p>
                    <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">COMPLETED</span></p>
                    <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #4CAF50; color: white;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f0f0f0; font-weight: bold;">
                            <td colspan="2" style="padding: 10px; text-align: right;">Total Amount:</td>
                            <td style="padding: 10px; text-align: right;">$${(order.total || order.totalAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                ${isDelivery ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h4 style="margin-top: 0; color: #856404;">🚚 Delivery Information</h4>
                        <p><strong>Delivery Address:</strong><br>
                        ${deliveryInfo.address?.street || ''}<br>
                        ${deliveryInfo.address?.city || ''}, ${deliveryInfo.address?.state || ''} ${deliveryInfo.address?.zip || ''}</p>
                        <p><strong>Delivery Date:</strong> ${deliveryInfo.deliveryDate ? new Date(deliveryInfo.deliveryDate).toLocaleDateString() : 'TBD'}</p>
                        <p><strong>Delivery Time:</strong> ${deliveryInfo.deliveryTime || 'TBD'}</p>
                        <p>Our delivery team will contact you shortly to confirm the delivery details.</p>
                    </div>
                ` : `
                    <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                        <h4 style="margin-top: 0; color: #0c5460;">📍 Pickup Information</h4>
                        <p><strong>Pickup Location:</strong><br>
                        Sarah's ShortCakes<br>
                        123 Sweet Street, Bakery City<br>
                        (555) 123-4567</p>
                        <p><strong>Pickup Date:</strong> ${deliveryInfo.deliveryDate ? new Date(deliveryInfo.deliveryDate).toLocaleDateString() : 'Today'}</p>
                        <p><strong>Pickup Time:</strong> ${deliveryInfo.deliveryTime || 'During business hours'}</p>
                        <p>Please bring this email or your order number when picking up your order.</p>
                    </div>
                `}

                <p>Thank you for choosing Sarah's ShortCakes! We hope you enjoy your delicious treats! 🧁</p>

                <hr style="margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                    Sarah's ShortCakes<br>
                    123 Sweet Street, Bakery City<br>
                    (555) 123-4567 | info@sarahsshortcakes.com
                </p>
            </div>
        `;
    }

    generateWelcomeEmailHtml(customer) {
        const firstName = customer.firstName || customer.name || 'Valued Customer';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff69b4; margin-bottom: 10px;">🧁 Welcome to Sarah's ShortCakes!</h1>
                    <p style="color: #666; font-size: 18px;">Where every bite is a sweet delight</p>
                </div>

                <div style="background: linear-gradient(135deg, #ff69b4, #ff1493); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                    <h2 style="margin: 0; font-size: 24px;">Hello ${firstName}! 👋</h2>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for joining our sweet family!</p>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #333; margin-top: 0;">🎉 Your Account is Ready!</h3>
                    <p style="color: #666; line-height: 1.6;">
                        Welcome to Sarah's ShortCakes! Your account has been successfully created and you're now part of our sweet community.
                    </p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <p style="margin: 0; color: #333;"><strong>Account Email:</strong> ${customer.email}</p>
                        <p style="margin: 5px 0 0 0; color: #333;"><strong>Member Since:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div style="background: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #ff69b4; margin-top: 0;">🧁 What You Can Do Now:</h3>
                    <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                        <li><strong>Browse Our Menu:</strong> Explore our delicious selection of cupcakes and cakes</li>
                        <li><strong>Place Orders:</strong> Order your favorite treats for pickup or delivery</li>
                        <li><strong>Track Orders:</strong> Monitor your order status in real-time</li>
                        <li><strong>Save Favorites:</strong> Keep track of your favorite items for quick reordering</li>
                        <li><strong>Manage Profile:</strong> Update your information and preferences</li>
                    </ul>
                </div>

                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #1976d2; margin-top: 0;">🎂 Our Specialties:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <span style="background: white; padding: 5px 10px; border-radius: 15px; font-size: 14px; color: #333;">🧁 Vanilla Cupcakes</span>
                        <span style="background: white; padding: 5px 10px; border-radius: 15px; font-size: 14px; color: #333;">🍫 Chocolate Delights</span>
                        <span style="background: white; padding: 5px 10px; border-radius: 15px; font-size: 14px; color: #333;">🍓 Strawberry Dreams</span>
                        <span style="background: white; padding: 5px 10px; border-radius: 15px; font-size: 14px; color: #333;">❤️ Red Velvet</span>
                    </div>
                </div>

                <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #333; margin-top: 0;">Ready to Get Started?</h4>
                    <p style="color: #666; margin-bottom: 15px;">Visit our website to place your first order!</p>
                    <a href="http://localhost:3000/menu.html" style="background: #ff69b4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                        🛒 Browse Our Menu
                    </a>
                </div>

                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p style="color: #666; margin-bottom: 10px;">
                        Questions? We're here to help! Contact us anytime.
                    </p>
                    <p style="color: #999; font-size: 14px; margin-bottom: 0;">
                        Sarah's ShortCakes<br>
                        123 Sweet Street, Bakery City<br>
                        📞 (555) 123-4567 | 📧 info@sarahsshortcakes.com
                    </p>
                </div>
            </div>
        `;
    }

    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // Test email functionality
    async sendTestEmail(testEmail = 'eyobkifle456@gmail.com') {
        try {
            console.log(`Sending test email to ${testEmail}...`);

            const subject = 'Sarah\'s Short Cakes - Email Test';
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #e91e63; margin-bottom: 10px;">🧁 Sarah's Short Cakes</h1>
                        <h2 style="color: #333; font-size: 24px;">Email System Test</h2>
                    </div>

                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #28a745; margin-top: 0;">✅ Email Configuration Test Successful!</h3>
                        <p style="color: #666; line-height: 1.6;">
                            This is a test email to verify that the email notification system is working correctly.
                        </p>
                    </div>

                    <div style="background-color: #fff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="color: #333; margin-top: 0;">Test Details:</h4>
                        <ul style="color: #666; line-height: 1.6;">
                            <li><strong>Test Email:</strong> ${testEmail}</li>
                            <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                            <li><strong>System:</strong> Sarah's Short Cakes Admin Panel</li>
                            <li><strong>Test Type:</strong> Email Configuration Verification</li>
                        </ul>
                    </div>

                    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="color: #1976d2; margin-top: 0;">📧 Email Features Available:</h4>
                        <ul style="color: #666; line-height: 1.6; margin-bottom: 0;">
                            <li>Order confirmations</li>
                            <li>Order status updates</li>
                            <li>Welcome messages for new customers</li>
                            <li>Contact message replies</li>
                            <li>Admin notifications</li>
                            <li>Low stock alerts</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #666; margin-bottom: 10px;">
                            If you received this email, your email configuration is working perfectly! 🎉
                        </p>
                        <p style="color: #999; font-size: 14px; margin-bottom: 0;">
                            Sarah's Short Cakes - Admin Notification System<br>
                            Test conducted on ${new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            `;

            const text = `
Sarah's Short Cakes - Email System Test

✅ Email Configuration Test Successful!

This is a test email to verify that the email notification system is working correctly.

Test Details:
- Test Email: ${testEmail}
- Test Time: ${new Date().toLocaleString()}
- System: Sarah's Short Cakes Admin Panel
- Test Type: Email Configuration Verification

📧 Email Features Available:
- Order confirmations
- Order status updates
- Welcome messages for new customers
- Contact message replies
- Admin notifications
- Low stock alerts

If you received this email, your email configuration is working perfectly! 🎉

Sarah's Short Cakes - Admin Notification System
Test conducted on ${new Date().toLocaleDateString()}
            `;

            await this.sendEmail(testEmail, subject, html, text);
            console.log(`Test email sent successfully to ${testEmail}`);

            return {
                success: true,
                message: `Test email sent successfully to ${testEmail}`,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error sending test email:', error);
            throw new Error(`Failed to send test email: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
