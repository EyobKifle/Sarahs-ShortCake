#!/usr/bin/env node

/**
 * Comprehensive Notification Testing Script
 * Tests both SMS and Email notifications for Sarah's Short Cakes
 *
 * Usage: node test-notifications.js [test-type]
 *
 * Test types:
 * - init: Initialize test data
 * - email: Test email configuration
 * - sms: Test SMS configuration
 * - registered: Test registered customer notifications
 * - guest: Test guest customer notifications
 * - all: Run all tests
 */

const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const ContactMessage = require('./models/ContactMessage');
const NotificationService = require('./services/notificationService');
const EmailService = require('./services/emailService');
const SmsService = require('./services/smsService');

// Test configuration
const TEST_EMAIL = 'eyobkifle456@gmail.com';
const TEST_PHONE = '+251911123456';

class NotificationTester {
    constructor() {
        this.results = [];
    }

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

    logResult(testName, status, message) {
        const result = {
            test: testName,
            status,
            message,
            timestamp: new Date().toISOString()
        };
        this.results.push(result);

        const icon = status === 'PASSED' ? '✅' : '❌';
        console.log(`${icon} ${testName}: ${message}`);
    }

    async initializeTestData() {
        try {
            console.log('\n🔧 Initializing test data...');

            // Create or update test customer (registered)
            let testCustomer = await Customer.findOne({ email: TEST_EMAIL });
            if (!testCustomer) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('testpassword123', 12);

                testCustomer = new Customer({
                    firstName: 'Eyob',
                    lastName: 'Kifle',
                    email: TEST_EMAIL,
                    password: hashedPassword,
                    phone: TEST_PHONE,
                    address: 'Addis Ababa, Ethiopia',
                    isRegistered: true,
                    emailOptIn: true,
                    smsOptIn: true,
                    createdAt: new Date()
                });
                await testCustomer.save();
                console.log(`✅ Test customer created: ${testCustomer._id}`);
            } else {
                testCustomer.phone = TEST_PHONE;
                testCustomer.emailOptIn = true;
                testCustomer.smsOptIn = true;
                await testCustomer.save();
                console.log(`✅ Test customer updated: ${testCustomer._id}`);
            }

            // Create test order for registered customer
            const existingOrder = await Order.findOne({ customerId: testCustomer._id });
            if (!existingOrder) {
                const testOrder = new Order({
                    orderNumber: `TEST-${Date.now()}`,
                    customerId: testCustomer._id,
                    customerType: 'registered',
                    items: [
                        {
                            productId: 'chocolate-cupcake',
                            quantity: 6,
                            price: 3.50,
                            customization: {
                                flavor: 'Chocolate',
                                icing: 'Vanilla Buttercream'
                            }
                        },
                        {
                            productId: 'red-velvet-cake',
                            quantity: 1,
                            price: 25.00,
                            customization: {
                                flavor: 'Red Velvet',
                                icing: 'Cream Cheese'
                            }
                        }
                    ],
                    deliveryInfo: {
                        method: 'pickup',
                        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                        deliveryTime: '14:00'
                    },
                    payment: {
                        method: 'integrated',
                        amount: 46.00,
                        status: 'pending'
                    },
                    subtotal: 46.00,
                    tax: 0,
                    deliveryFee: 0,
                    total: 46.00,
                    status: 'pending',
                    notes: 'Test order for notification system',
                    createdAt: new Date()
                });
                await testOrder.save();
                console.log(`✅ Test order created: ${testOrder._id}`);
            }

            // Create test guest order
            const existingGuestOrder = await Order.findOne({ 'guestInfo.email': TEST_EMAIL });
            if (!existingGuestOrder) {
                const guestOrder = new Order({
                    orderNumber: `GUEST-${Date.now()}`,
                    customerType: 'guest',
                    guestInfo: {
                        name: 'Eyob Kifle (Guest)',
                        email: TEST_EMAIL,
                        phone: TEST_PHONE
                    },
                    items: [
                        {
                            productId: 'vanilla-cupcake',
                            quantity: 12,
                            price: 3.00,
                            customization: {
                                flavor: 'Vanilla',
                                icing: 'Chocolate Buttercream'
                            }
                        }
                    ],
                    deliveryInfo: {
                        method: 'delivery',
                        address: {
                            street: 'Test Street',
                            city: 'Addis Ababa',
                            state: 'Addis Ababa',
                            zip: '1000'
                        },
                        deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
                        deliveryTime: '16:00'
                    },
                    payment: {
                        method: 'proof_upload',
                        amount: 36.00,
                        status: 'pending',
                        proofImage: 'test-payment-proof.jpg'
                    },
                    subtotal: 36.00,
                    tax: 0,
                    deliveryFee: 0,
                    total: 36.00,
                    status: 'pending',
                    notes: 'Test guest order for notification system',
                    createdAt: new Date()
                });
                await guestOrder.save();
                console.log(`✅ Test guest order created: ${guestOrder._id}`);
            }

            // Create test contact message
            const existingMessage = await ContactMessage.findOne({ email: TEST_EMAIL });
            if (!existingMessage) {
                const contactMessage = new ContactMessage({
                    name: 'Eyob Kifle',
                    email: TEST_EMAIL,
                    subject: 'Test Contact Message',
                    message: 'This is a test message for the notification system testing.',
                    status: 'new',
                    createdAt: new Date()
                });
                await contactMessage.save();
                console.log(`✅ Test contact message created: ${contactMessage._id}`);
            }

            // Initialize notification service
            await NotificationService.initialize();

            this.logResult('Test Data Initialization', 'PASSED', 'All test data created successfully');
            return true;
        } catch (error) {
            this.logResult('Test Data Initialization', 'FAILED', error.message);
            return false;
        }
    }

    async testEmailConfiguration() {
        try {
            console.log('\n📧 Testing email configuration...');
            await EmailService.sendTestEmail(TEST_EMAIL);
            this.logResult('Email Configuration', 'PASSED', `Test email sent to ${TEST_EMAIL}`);
            return true;
        } catch (error) {
            this.logResult('Email Configuration', 'FAILED', error.message);
            return false;
        }
    }

    async testSmsConfiguration() {
        try {
            console.log('\n📱 Testing SMS configuration...');
            await SmsService.sendTestSms(TEST_PHONE);
            this.logResult('SMS Configuration', 'PASSED', `Test SMS sent to ${TEST_PHONE}`);
            return true;
        } catch (error) {
            this.logResult('SMS Configuration', 'FAILED', error.message);
            return false;
        }
    }

    async testRegisteredCustomerNotifications() {
        try {
            console.log('\n👤 Testing registered customer notifications...');

            const customer = await Customer.findOne({ email: TEST_EMAIL });
            const order = await Order.findOne({ customerId: customer._id }).populate('customerId');

            if (!order) {
                throw new Error('Test order not found');
            }

            // Test order confirmation
            await NotificationService.sendOrderConfirmation(order);
            console.log('✅ Order confirmation sent');

            // Test order status update
            order.status = 'confirmed';
            await order.save();
            await NotificationService.sendOrderStatusUpdate(order, 'confirmed');
            console.log('✅ Order status update sent');

            // Test welcome message
            await NotificationService.sendWelcomeMessage(customer);
            console.log('✅ Welcome message sent');

            this.logResult('Registered Customer Notifications', 'PASSED', 'All notifications sent successfully');
            return true;
        } catch (error) {
            this.logResult('Registered Customer Notifications', 'FAILED', error.message);
            return false;
        }
    }

    async testGuestCustomerNotifications() {
        try {
            console.log('\n🎭 Testing guest customer notifications...');

            const guestOrder = await Order.findOne({ 'guestInfo.email': TEST_EMAIL });

            if (!guestOrder) {
                throw new Error('Test guest order not found');
            }

            // Test guest order confirmation
            await NotificationService.sendOrderConfirmation(guestOrder);
            console.log('✅ Guest order confirmation sent');

            // Test guest order status update
            guestOrder.status = 'processing';
            await guestOrder.save();
            await NotificationService.sendOrderStatusUpdate(guestOrder, 'processing');
            console.log('✅ Guest order status update sent');

            this.logResult('Guest Customer Notifications', 'PASSED', 'All guest notifications sent successfully');
            return true;
        } catch (error) {
            this.logResult('Guest Customer Notifications', 'FAILED', error.message);
            return false;
        }
    }

    async testAdminNotifications() {
        try {
            console.log('\n👨‍💼 Testing admin notifications...');

            const customer = await Customer.findOne({ email: TEST_EMAIL });
            const order = await Order.findOne({ customerId: customer._id }).populate('customerId');

            if (!order) {
                throw new Error('Test order not found');
            }

            // Test new order alert
            await NotificationService.sendNewOrderAlert(order);
            console.log('✅ New order alert sent to admin');

            // Test contact message reply
            const contactMessage = await ContactMessage.findOne({ email: TEST_EMAIL });
            if (contactMessage) {
                const replyContent = 'Thank you for your test message. This is an automated test reply from our notification system.';
                await NotificationService.sendContactMessageReply(contactMessage, replyContent);
                console.log('✅ Contact message reply sent');
            }

            this.logResult('Admin Notifications', 'PASSED', 'All admin notifications sent successfully');
            return true;
        } catch (error) {
            this.logResult('Admin Notifications', 'FAILED', error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive notification test suite...');
        console.log(`📧 Test Email: ${TEST_EMAIL}`);
        console.log(`📱 Test Phone: ${TEST_PHONE}`);
        console.log('=' * 50);

        const tests = [
            () => this.initializeTestData(),
            () => this.testEmailConfiguration(),
            () => this.testSmsConfiguration(),
            () => this.testRegisteredCustomerNotifications(),
            () => this.testGuestCustomerNotifications(),
            () => this.testAdminNotifications()
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                const result = await test();
                if (result) passed++;
                else failed++;
            } catch (error) {
                console.error(`❌ Test failed: ${error.message}`);
                failed++;
            }

            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('\n' + '=' * 50);
        console.log('📊 TEST SUMMARY');
        console.log('=' * 50);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${passed + failed}`);
        console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Your notification system is working perfectly!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
        }

        return { passed, failed, total: passed + failed };
    }

    printResults() {
        console.log('\n📋 DETAILED RESULTS:');
        console.log('-' * 50);
        this.results.forEach(result => {
            const icon = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.message}`);
        });
    }
}

// Main execution
async function main() {
    const testType = process.argv[2] || 'all';
    const tester = new NotificationTester();

    try {
        await tester.connect();

        switch (testType) {
            case 'init':
                await tester.initializeTestData();
                break;
            case 'email':
                await tester.testEmailConfiguration();
                break;
            case 'sms':
                await tester.testSmsConfiguration();
                break;
            case 'registered':
                await tester.testRegisteredCustomerNotifications();
                break;
            case 'guest':
                await tester.testGuestCustomerNotifications();
                break;
            case 'admin':
                await tester.testAdminNotifications();
                break;
            case 'all':
            default:
                await tester.runAllTests();
                break;
        }

        tester.printResults();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    } finally {
        await tester.disconnect();
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Run the tests
if (require.main === module) {
    main();
}

module.exports = NotificationTester;
