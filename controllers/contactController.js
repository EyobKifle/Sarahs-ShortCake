const ContactMessage = require('../models/ContactMessage');

// Create a new contact message
exports.createContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const contactMessage = new ContactMessage({
            name,
            email,
            subject,
            message
        });

        await contactMessage.save();

        res.status(201).json({
            success: true,
            data: contactMessage,
            message: 'Contact message sent successfully'
        });
    } catch (error) {
        console.error('Error sending contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending contact message'
        });
    }
};

// Get all contact messages (for admin)
exports.getAllContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact messages'
        });
    }
};
