const ContactMessage = require('../models/ContactMessage');

// Create a new contact message
exports.createContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        const contactMessage = new ContactMessage({
            name,
            email,
            phone,
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

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact messages'
        });
    }
};

// Get a single contact message by ID
exports.getContactMessageById = async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Error fetching contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact message'
        });
    }
};

// Delete a contact message
exports.deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contact message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contact message'
        });
    }
};

// Mark a contact message as read
exports.markAsRead = async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status: 'read' },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.status(200).json({
            success: true,
            data: message,
            message: 'Message marked as read'
        });
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking message as read'
        });
    }
};

// Reply to a contact message
exports.replyToMessage = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply || !reply.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Reply content is required'
            });
        }

        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            {
                status: 'replied',
                reply: reply.trim(),
                repliedAt: new Date()
            },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        // Here you could also send an email reply to the customer
        // using the email service if configured

        res.status(200).json({
            success: true,
            data: message,
            message: 'Reply sent successfully'
        });
    } catch (error) {
        console.error('Error replying to message:', error);
        res.status(500).json({
            success: false,
            message: 'Error replying to message'
        });
    }
};
