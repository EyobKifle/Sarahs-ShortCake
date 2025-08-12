/**
 * Serverless Entry Point
 * Handles serverless/cloud function deployments
 */

const serverless = require('serverless-http');
const app = require('./server');
const serverlessAdapter = require('./utils/serverlessAdapter');

// Check if running in serverless environment
const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || 
                    !!process.env.VERCEL || 
                    !!process.env.NETLIFY;

if (isServerless) {
    // Export serverless handler
    module.exports.handler = serverless(app, {
        binary: ['image/*', 'application/pdf', 'application/octet-stream'],
        request: (request, event, context) => {
            // Add serverless context to request
            request.serverless = { event, context };
        }
    });
} else {
    // Export regular app for local development
    module.exports = app;
}

// Export individual function handlers for specific endpoints
module.exports.api = serverless(app);

// Export specific function handlers
module.exports.orders = serverlessAdapter(async (req, res) => {
    const orderController = require('./controllers/orderController');
    
    switch (req.method) {
        case 'GET':
            if (req.params.id) {
                return await orderController.getOrderById(req, res);
            } else {
                return await orderController.getAllOrders(req, res);
            }
        case 'POST':
            return await orderController.createOrder(req, res);
        case 'PUT':
            return await orderController.updateOrderStatus(req, res);
        default:
            return res.status(405).json({ error: 'Method not allowed' });
    }
});

module.exports.guestOrders = serverlessAdapter(async (req, res) => {
    const orderController = require('./controllers/orderController');
    
    if (req.method === 'POST') {
        return await orderController.createGuestOrder(req, res);
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
});

module.exports.publicOrders = serverlessAdapter(async (req, res) => {
    const orderController = require('./controllers/orderController');
    
    if (req.method === 'GET') {
        if (req.params.orderNumber) {
            return await orderController.getPublicOrderByOrderNumber(req, res);
        } else if (req.params.id) {
            return await orderController.getPublicOrderById(req, res);
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
});
