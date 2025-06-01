const mongoose = require('mongoose');

// Define ContactMessage schema directly
const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    reply: { type: String },
    repliedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sarahs-shortcakes', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestContactMessages() {
    try {
        console.log('Creating test contact messages...');

        // Delete existing test messages first
        await ContactMessage.deleteMany({
            email: {
                $in: [
                    'sarah.johnson@example.com',
                    'michael.chen@example.com',
                    'emily.rodriguez@example.com',
                    'david.wilson@example.com',
                    'lisa.thompson@example.com'
                ]
            }
        });

        // Create test contact messages
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

        // Create new test messages
        const createdMessages = await ContactMessage.insertMany(testMessages);
        console.log(`✅ Created ${createdMessages.length} test contact messages`);

        // Display created messages
        createdMessages.forEach((msg, index) => {
            console.log(`${index + 1}. ${msg.name} - ${msg.subject} (${msg.status})`);
        });

        // Get total count
        const totalMessages = await ContactMessage.countDocuments();
        console.log(`📊 Total contact messages in database: ${totalMessages}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test contact messages:', error);
        process.exit(1);
    }
}

createTestContactMessages();
