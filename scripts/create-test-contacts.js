const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');

async function createTestContacts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs_shortcakes', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Clear existing test messages
        await ContactMessage.deleteMany({});
        console.log('🗑️ Cleared existing contact messages');

        // Create test contact messages
        const testMessages = [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@email.com',
                phone: '+1234567890',
                subject: 'Wedding Cake Inquiry',
                message: 'Hi! I\'m planning my wedding for next month and would love to discuss custom cupcake options. Could you please provide information about your wedding packages and pricing? I\'m looking for about 100 cupcakes with various flavors.',
                status: 'new',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                name: 'Mike Chen',
                email: 'mike.chen@gmail.com',
                subject: 'Birthday Party Order',
                message: 'Hello! I need to place an order for my daughter\'s 8th birthday party this weekend. She loves chocolate cupcakes. Can I get 24 chocolate cupcakes with pink frosting?',
                status: 'new',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
            },
            {
                name: 'Emily Rodriguez',
                email: 'emily.r@company.com',
                phone: '+1987654321',
                subject: 'Corporate Event Catering',
                message: 'We\'re hosting a corporate event next Friday and would like to order cupcakes for 50 people. Do you offer delivery to downtown offices? What are your most popular flavors for business events?',
                status: 'read',
                isRead: true,
                readAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
            },
            {
                name: 'David Thompson',
                email: 'david.thompson@email.com',
                subject: 'Allergy Information',
                message: 'Hi, my son has a severe nut allergy. Do you have any nut-free options? What precautions do you take to prevent cross-contamination in your kitchen?',
                status: 'replied',
                reply: 'Thank you for reaching out! We take allergies very seriously and have dedicated nut-free preparation areas. Please call us to discuss your specific needs.',
                repliedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
            },
            {
                name: 'Lisa Park',
                email: 'lisa.park@email.com',
                phone: '+1555123456',
                subject: 'Custom Flavor Request',
                message: 'Do you make lemon lavender cupcakes? I\'m looking for something unique for my book club meeting next week.',
                status: 'new',
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
            },
            {
                name: 'Robert Wilson',
                email: 'rob.wilson@email.com',
                subject: 'Pricing Question',
                message: 'What are your prices for a dozen mixed cupcakes? Do you offer any discounts for bulk orders?',
                status: 'new',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
            }
        ];

        // Insert test messages
        const createdMessages = await ContactMessage.insertMany(testMessages);
        console.log(`✅ Created ${createdMessages.length} test contact messages`);

        // Display summary
        console.log('\n📋 Test Contact Messages Summary:');
        createdMessages.forEach((message, index) => {
            console.log(`${index + 1}. ${message.name} - ${message.subject} (${message.status})`);
        });

        console.log('\n🌐 You can now view the messages at: http://localhost:3000/admin-contact-messages.html');
        console.log('📧 Test the contact form at: http://localhost:3000/contact.html');

    } catch (error) {
        console.error('❌ Error creating test contacts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createTestContacts();
