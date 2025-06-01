const Customer = require('../models/Customer');
const Order = require('../models/Order');
const ContactMessage = require('../models/ContactMessage');
const NotificationService = require('../services/notificationService');
const EmailService = require('../services/emailService');
const SmsService = require('../services/smsService');
const Settings = require('../models/Settings');

// Test email and phone for comprehensive testing
const TEST_EMAIL = 'eyobkifle456@gmail.com';
const TEST_PHONE = '+251911123456'; // Ethiopian test number

class TestController {
    // Initialize test data and settings
    async initializeTestData(req, res) {
        try {
            console.log('Initializing test data...');

            // Create or update test customer (registered)
            let testCustomer = await Customer.findOne({ email: TEST_EMAIL });
            if (!testCustomer) {
                testCustomer = new Customer({
                    firstName: 'Eyob',
                    lastName: 'Kifle',
                    email: TEST_EMAIL,
                    phone: TEST_PHONE,
                    address: 'Addis Ababa, Ethiopia',
                    isRegistered: true,
                    emailOptIn: true,
                    smsOptIn: true,
                    createdAt: new Date()
                });
                await testCustomer.save();
                console.log('Test customer created:', testCustomer._id);
            } else {
                // Update existing customer
                testCustomer.phone = TEST_PHONE;
                testCustomer.emailOptIn = true;
                testCustomer.smsOptIn = true;
                await testCustomer.save();
                console.log('Test customer updated:', testCustomer._id);
            }

            // Create test order for registered customer
            const testOrder = new Order({
                customer: testCustomer._id,
                items: [
                    {
                        name: 'Chocolate Cupcake',
                        quantity: 6,
                        price: 3.50,
                        flavor: 'Chocolate',
                        icing: 'Vanilla Buttercream'
                    },
                    {
                        name: 'Red Velvet Cake',
                        quantity: 1,
                        price: 25.00,
                        flavor: 'Red Velvet',
                        icing: 'Cream Cheese'
                    }
                ],
                totalAmount: 46.00,
                status: 'pending',
                orderType: 'pickup',
                specialInstructions: 'Test order for notification system',
                createdAt: new Date()
            });
            await testOrder.save();
            console.log('Test order created:', testOrder._id);

            // Create test guest order
            const guestOrder = new Order({
                guestInfo: {
                    name: 'Eyob Kifle (Guest)',
                    email: TEST_EMAIL,
                    phone: TEST_PHONE,
                    address: 'Addis Ababa, Ethiopia'
                },
                items: [
                    {
                        name: 'Vanilla Cupcake',
                        quantity: 12,
                        price: 3.00,
                        flavor: 'Vanilla',
                        icing: 'Chocolate Buttercream'
                    }
                ],
                totalAmount: 36.00,
                status: 'pending',
                orderType: 'delivery',
                specialInstructions: 'Test guest order for notification system',
                paymentProof: 'test-payment-proof.jpg',
                createdAt: new Date()
            });
            await guestOrder.save();
            console.log('Test guest order created:', guestOrder._id);

            // Create test contact message
            const contactMessage = new ContactMessage({
                name: 'Eyob Kifle',
                email: TEST_EMAIL,
                phone: TEST_PHONE,
                subject: 'Test Contact Message',
                message: 'This is a test message for the notification system testing.',
                status: 'unread',
                createdAt: new Date()
            });
            await contactMessage.save();
            console.log('Test contact message created:', contactMessage._id);

            // Initialize notification service
            await NotificationService.initialize();

            res.status(200).json({
                success: true,
                message: 'Test data initialized successfully',
                data: {
                    testCustomer: testCustomer._id,
                    testOrder: testOrder._id,
                    guestOrder: guestOrder._id,
                    contactMessage: contactMessage._id,
                    testEmail: TEST_EMAIL,
                    testPhone: TEST_PHONE
                }
            });
        } catch (error) {
            console.error('Error initializing test data:', error);
            res.status(500).json({
                success: false,
                message: 'Error initializing test data',
                error: error.message
            });
        }
    }

    // Test email configuration
    async testEmailConfig(req, res) {
        try {
            console.log('Testing email configuration...');

            const { testEmail = TEST_EMAIL } = req.body;

            // Test basic email sending
            await EmailService.sendTestEmail(testEmail);

            res.status(200).json({
                success: true,
                message: `Test email sent successfully to ${testEmail}`,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error testing email:', error);
            res.status(500).json({
                success: false,
                message: 'Error sending test email',
                error: error.message
            });
        }
    }

    // Test SMS configuration
    async testSmsConfig(req, res) {
        try {
            console.log('Testing SMS configuration...');

            const { testPhone = TEST_PHONE } = req.body;

            // Test basic SMS sending
            await SmsService.sendTestSms(testPhone);

            res.status(200).json({
                success: true,
                message: `Test SMS sent successfully to ${testPhone}`,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error testing SMS:', error);
            res.status(500).json({
                success: false,
                message: 'Error sending test SMS',
                error: error.message
            });
        }
    }

    // Test order confirmation notifications (registered customer)
    async testOrderConfirmationRegistered(req, res) {
        try {
            console.log('Testing order confirmation for registered customer...');

            // Find test customer and order
            const customer = await Customer.findOne({ email: TEST_EMAIL });
            const order = await Order.findOne({ customer: customer._id }).populate('customer');

            if (!order) {
                throw new Error('Test order not found');
            }

            // Send order confirmation
            await NotificationService.sendOrderConfirmation(order);

            res.status(200).json({
                success: true,
                message: 'Order confirmation sent to registered customer',
                data: {
                    orderId: order._id,
                    customerEmail: order.customer.email,
                    customerPhone: order.customer.phone,
                    orderTotal: order.totalAmount
                }
            });
        } catch (error) {
            console.error('Error testing order confirmation:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing order confirmation',
                error: error.message
            });
        }
    }

    // Test order confirmation notifications (guest customer)
    async testOrderConfirmationGuest(req, res) {
        try {
            console.log('Testing order confirmation for guest customer...');

            // Find test guest order
            const order = await Order.findOne({ 'guestInfo.email': TEST_EMAIL });

            if (!order) {
                throw new Error('Test guest order not found');
            }

            // Send order confirmation
            await NotificationService.sendOrderConfirmation(order);

            res.status(200).json({
                success: true,
                message: 'Order confirmation sent to guest customer',
                data: {
                    orderId: order._id,
                    guestEmail: order.guestInfo.email,
                    guestPhone: order.guestInfo.phone,
                    orderTotal: order.totalAmount
                }
            });
        } catch (error) {
            console.error('Error testing guest order confirmation:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing guest order confirmation',
                error: error.message
            });
        }
    }

    // Test order status update notifications
    async testOrderStatusUpdate(req, res) {
        try {
            console.log('Testing order status update notifications...');

            const { orderType = 'registered', newStatus = 'confirmed' } = req.body;

            let order;
            if (orderType === 'guest') {
                order = await Order.findOne({ 'guestInfo.email': TEST_EMAIL });
                if (!order) {
                    // Create test guest order
                    order = new Order({
                        guestInfo: {
                            name: 'Test Guest Customer',
                            email: TEST_EMAIL,
                            phone: TEST_PHONE,
                            address: 'Test Address'
                        },
                        items: [
                            {
                                name: 'Guest Test Cupcake',
                                quantity: 2,
                                price: 4.00,
                                flavor: 'Red Velvet',
                                icing: 'Cream Cheese'
                            }
                        ],
                        totalAmount: 8.00,
                        status: 'confirmed',
                        orderType: 'delivery',
                        specialInstructions: 'Test guest order for status updates',
                        createdAt: new Date()
                    });
                    await order.save();
                }
            } else {
                let customer = await Customer.findOne({ email: TEST_EMAIL });
                if (!customer) {
                    // Create test customer
                    customer = new Customer({
                        firstName: 'Test',
                        lastName: 'Customer',
                        email: TEST_EMAIL,
                        phone: TEST_PHONE,
                        emailOptIn: true,
                        smsOptIn: true
                    });
                    await customer.save();
                }

                order = await Order.findOne({ customer: customer._id }).populate('customer');
                if (!order) {
                    // Create test order
                    order = new Order({
                        customer: customer._id,
                        items: [
                            {
                                name: 'Test Status Update Cupcake',
                                quantity: 4,
                                price: 3.75,
                                flavor: 'Chocolate',
                                icing: 'Vanilla'
                            }
                        ],
                        totalAmount: 15.00,
                        status: 'confirmed',
                        orderType: 'pickup',
                        specialInstructions: 'Test order for status update notifications',
                        createdAt: new Date()
                    });
                    await order.save();
                    order = await Order.findById(order._id).populate('customer');
                }
            }

            // Update order status
            order.status = newStatus;
            await order.save();

            // Send status update notification
            await NotificationService.sendOrderStatusUpdate(order, newStatus);

            res.status(200).json({
                success: true,
                message: `Order status update sent for ${orderType} customer`,
                data: {
                    orderId: order._id,
                    newStatus: newStatus,
                    customerType: orderType
                }
            });
        } catch (error) {
            console.error('Error testing order status update:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing order status update',
                error: error.message
            });
        }
    }

    // Test admin notifications (new order alert)
    async testNewOrderAlert(req, res) {
        try {
            console.log('Testing new order alert to admin...');

            // Find or create a test order
            let customer = await Customer.findOne({ email: TEST_EMAIL });
            if (!customer) {
                // Create test customer if not exists
                customer = new Customer({
                    firstName: 'Test',
                    lastName: 'Customer',
                    email: TEST_EMAIL,
                    phone: TEST_PHONE,
                    emailOptIn: true,
                    smsOptIn: true
                });
                await customer.save();
            }

            let order = await Order.findOne({ customer: customer._id }).populate('customer');
            if (!order) {
                // Create test order if not exists
                order = new Order({
                    customer: customer._id,
                    items: [
                        {
                            name: 'Test Cupcake',
                            quantity: 6,
                            price: 3.50,
                            flavor: 'Vanilla',
                            icing: 'Chocolate'
                        }
                    ],
                    totalAmount: 21.00,
                    status: 'pending',
                    orderType: 'pickup',
                    specialInstructions: 'Test order for notification system',
                    createdAt: new Date()
                });
                await order.save();
                order = await Order.findById(order._id).populate('customer');
            }

            // Send new order alert to admin
            await NotificationService.sendNewOrderAlert(order);

            res.status(200).json({
                success: true,
                message: 'New order alert sent to admin',
                data: {
                    orderId: order._id,
                    orderTotal: order.totalAmount,
                    customerName: order.customer.firstName + ' ' + order.customer.lastName
                }
            });
        } catch (error) {
            console.error('Error testing new order alert:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing new order alert',
                error: error.message
            });
        }
    }

    // Test contact message reply
    async testContactMessageReply(req, res) {
        try {
            console.log('Testing contact message reply...');

            // Find test contact message
            const contactMessage = await ContactMessage.findOne({ email: TEST_EMAIL });

            if (!contactMessage) {
                throw new Error('Test contact message not found');
            }

            const replyContent = `Dear ${contactMessage.name},

Thank you for your message regarding "${contactMessage.subject}".

This is a test reply from our notification system. We appreciate your interest in Sarah's Short Cakes!

We have received your message: "${contactMessage.message}"

Our team will get back to you soon with more information.

Best regards,
Sarah's Short Cakes Team`;

            // Send reply
            await NotificationService.sendContactMessageReply(contactMessage, replyContent);

            res.status(200).json({
                success: true,
                message: 'Contact message reply sent successfully',
                data: {
                    messageId: contactMessage._id,
                    recipientEmail: contactMessage.email,
                    originalSubject: contactMessage.subject
                }
            });
        } catch (error) {
            console.error('Error testing contact message reply:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing contact message reply',
                error: error.message
            });
        }
    }

    // Test welcome message for new customer
    async testWelcomeMessage(req, res) {
        try {
            console.log('Testing welcome message...');

            const customer = await Customer.findOne({ email: TEST_EMAIL });

            if (!customer) {
                throw new Error('Test customer not found');
            }

            // Send welcome message using enhanced email service
            const emailService = require('../services/emailService');
            await emailService.sendWelcomeEmail(customer);

            res.status(200).json({
                success: true,
                message: 'Welcome message sent successfully',
                data: {
                    customerId: customer._id,
                    customerEmail: customer.email,
                    customerName: customer.firstName + ' ' + customer.lastName
                }
            });
        } catch (error) {
            console.error('Error testing welcome message:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing welcome message',
                error: error.message
            });
        }
    }

    // Test low stock alert
    async testLowStockAlert(req, res) {
        try {
            console.log('Testing low stock alert...');

            const emailService = require('../services/emailService');

            // Create mock low stock items
            const mockLowStockItems = [
                {
                    name: 'Flour',
                    quantity: 2,
                    threshold: 5,
                    unit: 'kg',
                    category: 'Baking Ingredients'
                },
                {
                    name: 'Sugar',
                    quantity: 1,
                    threshold: 3,
                    unit: 'kg',
                    category: 'Baking Ingredients'
                }
            ];

            await emailService.sendLowStockAlert(mockLowStockItems);

            res.status(200).json({
                success: true,
                message: 'Low stock alert sent successfully',
                data: {
                    itemsAlerted: mockLowStockItems.length,
                    adminEmail: 'eyobkifle456@gmail.com'
                }
            });
        } catch (error) {
            console.error('Error testing low stock alert:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing low stock alert',
                error: error.message
            });
        }
    }

    // Run comprehensive notification test suite
    async runFullTestSuite(req, res) {
        try {
            console.log('Running comprehensive notification test suite...');

            const results = {
                timestamp: new Date(),
                tests: [],
                summary: {
                    total: 0,
                    passed: 0,
                    failed: 0
                }
            };

            // Test 1: Email Configuration
            try {
                await EmailService.sendTestEmail(TEST_EMAIL);
                results.tests.push({ name: 'Email Configuration', status: 'PASSED', message: 'Test email sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'Email Configuration', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 2: SMS Configuration
            try {
                await SmsService.sendTestSms(TEST_PHONE);
                results.tests.push({ name: 'SMS Configuration', status: 'PASSED', message: 'Test SMS sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'SMS Configuration', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 3: Registered Customer Order Confirmation
            try {
                const customer = await Customer.findOne({ email: TEST_EMAIL });
                const order = await Order.findOne({ customer: customer._id }).populate('customer');
                await NotificationService.sendOrderConfirmation(order);
                results.tests.push({ name: 'Registered Customer Order Confirmation', status: 'PASSED', message: 'Notifications sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'Registered Customer Order Confirmation', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 4: Guest Customer Order Confirmation
            try {
                const guestOrder = await Order.findOne({ 'guestInfo.email': TEST_EMAIL });
                await NotificationService.sendOrderConfirmation(guestOrder);
                results.tests.push({ name: 'Guest Customer Order Confirmation', status: 'PASSED', message: 'Notifications sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'Guest Customer Order Confirmation', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 5: Order Status Update
            try {
                const customer = await Customer.findOne({ email: TEST_EMAIL });
                const order = await Order.findOne({ customer: customer._id }).populate('customer');
                await NotificationService.sendOrderStatusUpdate(order, 'ready');
                results.tests.push({ name: 'Order Status Update', status: 'PASSED', message: 'Status update notifications sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'Order Status Update', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 6: New Order Alert to Admin
            try {
                const customer = await Customer.findOne({ email: TEST_EMAIL });
                const order = await Order.findOne({ customer: customer._id }).populate('customer');
                await NotificationService.sendNewOrderAlert(order);
                results.tests.push({ name: 'New Order Alert to Admin', status: 'PASSED', message: 'Admin alert sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'New Order Alert to Admin', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 7: Contact Message Reply
            try {
                const contactMessage = await ContactMessage.findOne({ email: TEST_EMAIL });
                const replyContent = 'This is a test reply from our automated testing system.';
                await NotificationService.sendContactMessageReply(contactMessage, replyContent);
                results.tests.push({ name: 'Contact Message Reply', status: 'PASSED', message: 'Reply sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'Contact Message Reply', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            // Test 8: Welcome Message
            try {
                const customer = await Customer.findOne({ email: TEST_EMAIL });
                await NotificationService.sendWelcomeMessage(customer);
                results.tests.push({ name: 'Welcome Message', status: 'PASSED', message: 'Welcome message sent successfully' });
                results.summary.passed++;
            } catch (error) {
                results.tests.push({ name: 'Welcome Message', status: 'FAILED', message: error.message });
                results.summary.failed++;
            }
            results.summary.total++;

            console.log('Test suite completed:', results.summary);

            res.status(200).json({
                success: true,
                message: 'Comprehensive test suite completed',
                results: results
            });
        } catch (error) {
            console.error('Error running test suite:', error);
            res.status(500).json({
                success: false,
                message: 'Error running test suite',
                error: error.message
            });
        }
    }

    // Create test contact messages
    async createTestContactMessages(req, res) {
        try {
            console.log('Creating test contact messages...');

            // Create multiple test contact messages
            const testMessages = [
                {
                    name: 'Sarah Johnson',
                    email: 'sarah.johnson@example.com',
                    phone: '+1-555-0123',
                    subject: 'Question about custom cake orders',
                    message: 'Hi! I would like to order a custom birthday cake for my daughter. Can you please let me know what options are available and the pricing? Thank you!',
                    status: 'new',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                },
                {
                    name: 'Michael Chen',
                    email: 'michael.chen@example.com',
                    phone: '+1-555-0456',
                    subject: 'Wedding cake inquiry',
                    message: 'Hello, we are planning our wedding for next month and would love to discuss wedding cake options. Do you offer tastings? What is your availability?',
                    status: 'new',
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
                },
                {
                    name: 'Emily Rodriguez',
                    email: 'emily.rodriguez@example.com',
                    phone: '+1-555-0789',
                    subject: 'Thank you for the amazing cupcakes!',
                    message: 'I just wanted to say thank you for the beautiful cupcakes you made for our office party. Everyone loved them! Will definitely order again.',
                    status: 'read',
                    isRead: true,
                    readAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
                },
                {
                    name: 'David Wilson',
                    email: 'david.wilson@example.com',
                    phone: '+1-555-0321',
                    subject: 'Delivery question',
                    message: 'Do you deliver to the downtown area? I would like to order a cake for pickup but my schedule is very busy this week.',
                    status: 'replied',
                    reply: 'Hi David! Yes, we do deliver to the downtown area. Our delivery fee is $5 for orders over $25. Please let us know your address and preferred delivery time.',
                    repliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
                },
                {
                    name: 'Lisa Thompson',
                    email: 'lisa.thompson@example.com',
                    phone: '+1-555-0654',
                    subject: 'Allergy information needed',
                    message: 'Hi, my son has a severe nut allergy. Do any of your cakes or cupcakes contain nuts? Can you guarantee no cross-contamination?',
                    status: 'new',
                    createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
                }
            ];

            // Delete existing test messages first
            await ContactMessage.deleteMany({
                email: {
                    $in: testMessages.map(msg => msg.email)
                }
            });

            // Create new test messages
            const createdMessages = await ContactMessage.insertMany(testMessages);
            console.log(`Created ${createdMessages.length} test contact messages`);

            res.status(200).json({
                success: true,
                message: `${createdMessages.length} test contact messages created successfully`,
                data: {
                    messagesCreated: createdMessages.length,
                    messages: createdMessages.map(msg => ({
                        id: msg._id,
                        name: msg.name,
                        email: msg.email,
                        subject: msg.subject,
                        status: msg.status,
                        createdAt: msg.createdAt
                    }))
                }
            });
        } catch (error) {
            console.error('Error creating test contact messages:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating test contact messages',
                error: error.message
            });
        }
    }

    // Get test data status
    async getTestStatus(req, res) {
        try {
            const customer = await Customer.findOne({ email: TEST_EMAIL });
            const orders = await Order.find({
                $or: [
                    { customer: customer?._id },
                    { 'guestInfo.email': TEST_EMAIL }
                ]
            });
            const contactMessage = await ContactMessage.findOne({ email: TEST_EMAIL });
            const allContactMessages = await ContactMessage.find().sort({ createdAt: -1 });
            const settings = await Settings.findOne();

            res.status(200).json({
                success: true,
                data: {
                    testEmail: TEST_EMAIL,
                    testPhone: TEST_PHONE,
                    customer: customer ? {
                        id: customer._id,
                        name: customer.firstName + ' ' + customer.lastName,
                        email: customer.email,
                        phone: customer.phone,
                        emailOptIn: customer.emailOptIn,
                        smsOptIn: customer.smsOptIn
                    } : null,
                    orders: orders.length,
                    contactMessage: contactMessage ? {
                        id: contactMessage._id,
                        subject: contactMessage.subject,
                        status: contactMessage.status
                    } : null,
                    allContactMessages: {
                        total: allContactMessages.length,
                        new: allContactMessages.filter(msg => msg.status === 'new').length,
                        read: allContactMessages.filter(msg => msg.status === 'read').length,
                        replied: allContactMessages.filter(msg => msg.status === 'replied').length,
                        recent: allContactMessages.slice(0, 3).map(msg => ({
                            id: msg._id,
                            name: msg.name,
                            subject: msg.subject,
                            status: msg.status,
                            createdAt: msg.createdAt
                        }))
                    },
                    notificationSettings: settings ? {
                        emailNotifications: settings.emailNotifications,
                        smsNotifications: settings.smsNotifications,
                        lowStockAlerts: settings.lowStockAlerts,
                        newOrderAlerts: settings.newOrderAlerts
                    } : null
                }
            });
        } catch (error) {
            console.error('Error getting test status:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting test status',
                error: error.message
            });
        }
    }

    // Test low stock alert
    async testLowStockAlert(req, res) {
        try {
            console.log('Testing low stock alert...');

            // Create mock low stock items
            const lowStockItems = [
                {
                    name: 'All-purpose flour',
                    currentQuantity: 2,
                    threshold: 10,
                    unit: 'kg',
                    category: 'Baking Ingredients'
                },
                {
                    name: 'Vanilla extract',
                    currentQuantity: 1,
                    threshold: 5,
                    unit: 'bottles',
                    category: 'Flavorings'
                },
                {
                    name: 'Butter',
                    currentQuantity: 0.5,
                    threshold: 3,
                    unit: 'kg',
                    category: 'Dairy'
                }
            ];

            // Send low stock alert
            await NotificationService.sendLowStockAlert(lowStockItems);

            res.status(200).json({
                success: true,
                message: 'Low stock alert sent successfully',
                data: {
                    itemsCount: lowStockItems.length,
                    items: lowStockItems
                }
            });
        } catch (error) {
            console.error('Error testing low stock alert:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing low stock alert',
                error: error.message
            });
        }
    }

    // Test password reset
    async testPasswordReset(req, res) {
        try {
            console.log('Testing password reset...');

            const { testEmail } = req.body;
            const email = testEmail || TEST_EMAIL;

            // Generate mock reset token
            const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Send password reset email
            await NotificationService.sendPasswordResetEmail(email, resetToken);

            res.status(200).json({
                success: true,
                message: 'Password reset email sent successfully',
                data: {
                    email: email,
                    resetToken: resetToken
                }
            });
        } catch (error) {
            console.error('Error testing password reset:', error);
            res.status(500).json({
                success: false,
                message: 'Error testing password reset',
                error: error.message
            });
        }
    }
}

module.exports = new TestController();
