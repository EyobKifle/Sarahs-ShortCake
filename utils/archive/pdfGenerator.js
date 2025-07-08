const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generates a PDF version of the daily order report
 * @param {Object} report - The daily order report
 * @returns {Stream} PDF document stream
 */
exports.generateDailyOrderPDF = (report) => {
    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(`./reports/daily-${new Date().toISOString().split('T')[0]}.pdf`));
    
    // Title
    doc.fontSize(20).text(`Sarah's Short Cakes - Daily Orders`, { align: 'center' });
    doc.fontSize(14).text(report.date.toDateString(), { align: 'center' });
    doc.moveDown();
    
    // Summary
    doc.fontSize(16).text('Summary', { underline: true });
    doc.fontSize(12).text(`Total Orders: ${report.totalOrders}`);
    doc.text(`Total Cupcakes: ${report.totalCupcakes}`);
    doc.text(`Total Revenue: $${report.totalRevenue.toFixed(2)}`);
    doc.moveDown();
    
    // Orders by status
    doc.fontSize(16).text('Orders by Status', { underline: true });
    for (const [status, count] of Object.entries(report.ordersByStatus)) {
        doc.fontSize(12).text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`);
    }
    doc.moveDown();
    
    // Order details
    doc.fontSize(16).text('Order Details', { underline: true });
    doc.moveDown();
    
    report.orders.forEach(order => {
        doc.fontSize(14).text(`Order #${order.orderId.toString().slice(-6)}`);
        doc.fontSize(12).text(`Customer: ${order.customer.firstName} ${order.customer.lastName}`);
        doc.text(`Items: ${order.items} (${order.cupcakes} cupcakes)`);
        doc.text(`Total: $${order.total.toFixed(2)}`);
        doc.text(`Type: ${order.deliveryOption}`);
        doc.text(`Status: ${order.status}`);
        doc.text(`Time: ${order.neededTime}`);
        doc.moveDown();
    });
    
    doc.end();
    return stream;
};

/**
 * Generates a PDF delivery route sheet
 * @param {Object} report - The delivery report
 * @returns {Stream} PDF document stream
 */
exports.generateDeliveryPDF = (report) => {
    const doc = new PDFDocument();
    const stream = doc.pipe(fs.createWriteStream(`./reports/deliveries-${new Date().toISOString().split('T')[0]}.pdf`));
    
    // Title
    doc.fontSize(20).text(`Sarah's Short Cakes - Delivery Route`, { align: 'center' });
    doc.fontSize(14).text(report.date.toDateString(), { align: 'center' });
    doc.moveDown();
    
    // Summary
    doc.fontSize(16).text('Delivery Summary', { underline: true });
    doc.fontSize(12).text(`Total Deliveries: ${report.totalDeliveries}`);
    doc.moveDown();
    
    // Delivery schedule by time window
    report.timeWindows.forEach(window => {
        doc.fontSize(16).text(`Time Window: ${window.timeWindow} (${window.count} deliveries)`, { underline: true });
        doc.moveDown();
        
        window.deliveries.forEach((delivery, index) => {
            doc.fontSize(14).text(`${index + 1}. ${delivery.customer}`);
            doc.fontSize(12).text(`Address: ${delivery.address}`);
            doc.text(`Phone: ${delivery.phone}`);
            doc.text(`Items: ${delivery.items} (${delivery.cupcakes} cupcakes)`);
            doc.text(`Total: $${delivery.total.toFixed(2)}`);
            doc.text(`Notes: ${delivery.notes}`);
            doc.moveDown();
        });
    });
    
    doc.end();
    return stream;
};