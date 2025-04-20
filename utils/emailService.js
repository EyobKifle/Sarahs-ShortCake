const nodemailer = require('nodemailer');

// Create transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Sends an order confirmation email to the customer
 * @param {Object} order - The order document
 * @param {Object} customer - The customer document
 * @returns {Promise} Promise that resolves when email is sent
 */
exports.sendOrderConfirmation = async (order, customer) => {
    const mailOptions = {
        from: `"Sarah's Short Cakes" <${process.env.EMAIL_FROM}>`,
        to: customer.email,
        subject: `Your Cupcake Order #${order._id.toString().slice(-6)}`,
        html: `
            <h1>Thank you for your order, ${customer.firstName}!</h1>
            <p>We're busy preparing your delicious cupcakes and will notify you when they're ready.</p>
            
            <h2>Order Details</h2>
            <p><strong>Order #:</strong> ${order._id.toString().slice(-6)}</p>
            <p><strong>Pickup/Delivery:</strong> ${order.deliveryOption === 'delivery' ? 
                `Delivery to ${customer.streetAddress}, ${customer.city}` : 'Store Pickup'}</p>
            <p><strong>Date/Time:</strong> ${order.neededDate.toDateString()} at ${order.neededTime}</p>
            
            <h3>Items</h3>
            <ul>
                ${order.items.map(item => `
                    <li>
                        ${item.quantity} x ${item.cakeFlavor} cupcake
                        ${item.cakeColor !== 'N/A' ? `(${item.cakeColor})` : ''}
                        with ${item.icingFlavor} icing
                        ${item.icingColor !== 'N/A' ? `(${item.icingColor})` : ''}
                        ${item.decoration ? `decorated with ${item.decoration}` : ''}
                    </li>
                `).join('')}
            </ul>
            
            <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
            
            <p>If you have any questions, please reply to this email or call us at (555) 123-4567.</p>
            <p>We hope you enjoy your cupcakes!</p>
            <p>- The Sarah's Short Cakes Team</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Order confirmation sent to ${customer.email}`);
    } catch (error) {
        console.error('Error sending order confirmation:', error);
        throw error;
    }
};

/**
 * Sends an OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password code
 * @returns {Promise} Promise that resolves when email is sent
 */
exports.sendOTP = async (to, otp) => {
    const mailOptions = {
        from: `"Sarah's Short Cakes" <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Password Reset Code',
        html: `<p>Your OTP code is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${to}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
};

/**
 * Sends a low stock alert email to admin
 * @param {string} adminEmail - Admin email address
 * @param {Array} items - Array of low stock items {name, quantity}
 * @returns {Promise} Promise that resolves when email is sent
 */
exports.sendLowStockAlert = async (adminEmail, items) => {
    const list = items.map(i => `<li>${i.name} (Qty: ${i.quantity})</li>`).join('');
    const mailOptions = {
        from: `"Inventory Bot" <${process.env.EMAIL_FROM}>`,
        to: adminEmail,
        subject: 'Inventory Alert: Low Stock',
        html: `<p>The following items are low in stock:</p><ul>${list}</ul>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Low stock alert sent to ${adminEmail}`);
    } catch (error) {
        console.error('Error sending low stock alert:', error);
        throw error;
    }
};

/**
 * Sends a pickup ready notification email to customer
 * @param {string} to - Customer email address
 * @param {string} orderId - Order ID
 * @returns {Promise} Promise that resolves when email is sent
 */
exports.sendPickupReady = async (to, orderId) => {
    const mailOptions = {
        from: `"Sarah's Short Cakes" <${process.env.EMAIL_FROM}>`,
        to,
        subject: 'Your Order is Ready!',
        html: `<p>Your order <strong>${orderId}</strong> is ready for pickup!</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Pickup ready email sent to ${to}`);
    } catch (error) {
        console.error('Error sending pickup ready email:', error);
        throw error;
    }
};
