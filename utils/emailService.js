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
 * Sends a daily order summary to the bakery staff
 * @param {Object} report - The daily order report
 * @returns {Promise} Promise that resolves when email is sent
 */
exports.sendDailySummary = async (report) => {
    const mailOptions = {
        from: `"Sarah's Short Cakes" <${process.env.EMAIL_FROM}>`,
        to: process.env.EMAIL_STAFF,
        subject: `Daily Order Summary - ${report.date.toDateString()}`,
        html: `
            <h1>Daily Order Summary</h1>
            <p><strong>Date:</strong> ${report.date.toDateString()}</p>
            
            <h2>Overview</h2>
            <ul>
                <li><strong>Total Orders:</strong> ${report.totalOrders}</li>
                <li><strong>Total Cupcakes:</strong> ${report.totalCupcakes}</li>
                <li><strong>Total Revenue:</strong> $${report.totalRevenue.toFixed(2)}</li>
                <li><strong>Pickup Orders:</strong> ${report.pickupOrders}</li>
                <li><strong>Delivery Orders:</strong> ${report.deliveryOrders}</li>
            </ul>
            
            <h2>Orders by Status</h2>
            <ul>
                <li><strong>Pending:</strong> ${report.ordersByStatus.pending}</li>
                <li><strong>Processing:</strong> ${report.ordersByStatus.processing}</li>
                <li><strong>Ready:</strong> ${report.ordersByStatus.ready}</li>
                <li><strong>Delivered:</strong> ${report.ordersByStatus.delivered}</li>
            </ul>
            
            <h2>Delivery Schedule</h2>
            ${report.orders.filter(o => o.deliveryOption === 'delivery').length > 0 ? 
                '<p>See attached delivery report for route details.</p>' : 
                '<p>No deliveries today.</p>'}
            
            <p>Log in to the admin system for full order details.</p>
        `,
        attachments: [
            {
                filename: `deliveries-${report.date.toISOString().split('T')[0]}.pdf`,
                content: generateDeliveryPDF(report) // This would call a PDF generator function
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Daily summary sent to staff');
    } catch (error) {
        console.error('Error sending daily summary:', error);
        throw error;
    }
};