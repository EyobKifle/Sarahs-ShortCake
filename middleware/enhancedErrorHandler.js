// Enhanced error handling middleware to prevent BODY_NOT_A_STRING_FROM_FUNCTION error
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', err);
    console.error('Error stack:', err.stack);

    // Ensure response is always a string
    const errorResponse = {
        error: 'Something went wrong!',
        message: err.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => e.message);
        errorResponse.error = 'Validation Error';
        errorResponse.details = validationErrors;
    } else if (err.name === 'CastError') {
        errorResponse.error = 'Invalid ID format';
    } else if (err.code === 11000) {
        errorResponse.error = 'Duplicate key error';
    }

    // Ensure status code is a number
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;

    // Always return JSON string for serverless compatibility
    const responseString = JSON.stringify(errorResponse);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Send response
    res.status(statusCode).send(responseString);
};

// Additional function to handle serverless errors
const serverlessErrorHandler = (error) => {
    console.error('Serverless error:', error);
    
    const errorResponse = {
        statusCode: error.statusCode || 500,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            error: error.message || 'Internal server error',
            timestamp: new Date().toISOString()
        })
    };

    return errorResponse;
};

module.exports = errorHandler;
module.exports.serverlessErrorHandler = serverlessErrorHandler;
