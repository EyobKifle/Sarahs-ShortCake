const Order = require('../models/Order');
const { generateSalesReport, generateDeliveryReport, generatePopularItemsReport } = require('../utils/generateReport');

// Generate sales summary report
exports.generateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.neededDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const orders = await Order.find(dateFilter).populate('customer');
        
        const report = generateSalesReport(orders);
        
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating sales report'
        });
    }
};

// Generate delivery schedule report
exports.generateDeliveryReport = async (req, res) => {
    try {
        const { date } = req.query;
        
        const reportDate = date ? new Date(date) : new Date();
        
        const orders = await Order.find({
            neededDate: {
                $gte: new Date(reportDate.setHours(0, 0, 0, 0)),
                $lte: new Date(reportDate.setHours(23, 59, 59, 999))
            },
            deliveryOption: 'delivery'
        }).populate('customer');
        
        const report = generateDeliveryReport(orders);
        
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating delivery report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating delivery report'
        });
    }
};

// Generate popular items report
exports.generatePopularItemsReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        
        if (startDate && endDate) {
            dateFilter.neededDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const orders = await Order.find(dateFilter);
        
        const report = generatePopularItemsReport(orders);
        
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error generating popular items report:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating popular items report'
        });
    }
};