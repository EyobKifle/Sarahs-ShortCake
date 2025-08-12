/**
 * Serverless Function Adapter
 * Fixes BODY_NOT_A_STRING_FROM_FUNCTION error by ensuring string responses
 */

const serverlessAdapter = (handler) => {
    return async (event, context) => {
        try {
            // Parse the event body if it's a string
            let body = {};
            if (event.body) {
                try {
                    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                } catch (e) {
                    body = event.body;
                }
            }

            // Create Express-like request object
            const req = {
                body,
                query: event.queryStringParameters || {},
                params: event.pathParameters || {},
                headers: event.headers || {},
                method: event.httpMethod || 'GET',
                url: event.path || '/',
                user: event.user || null
            };

            // Create Express-like response object
            let response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: ''
            };

            // Mock Express response methods
            const res = {
                status: (code) => {
                    response.statusCode = code;
                    return res;
                },
                json: (data) => {
                    response.body = JSON.stringify(data);
                    return response;
                },
                send: (data) => {
                    if (typeof data === 'object') {
                        response.body = JSON.stringify(data);
                    } else {
                        response.body = String(data);
                        response.headers['Content-Type'] = 'text/plain';
                    }
                    return response;
                },
                sendFile: (path) => {
                    response.body = `File: ${path}`;
                    response.headers['Content-Type'] = 'text/plain';
                    return response;
                },
                redirect: (url) => {
                    response.statusCode = 302;
                    response.headers['Location'] = url;
                    response.body = `Redirecting to ${url}`;
                    return response;
                }
            };

            // Execute the handler
            const result = await handler(req, res);

            // Ensure string response
            if (typeof result === 'object') {
                return {
                    ...response,
                    body: JSON.stringify(result)
                };
            } else if (typeof result === 'string') {
                return {
                    ...response,
                    body: result
                };
            } else {
                return {
                    ...response,
                    body: String(result || '')
                };
            }

        } catch (error) {
            console.error('Serverless adapter error:', error);
            return {
                statusCode: error.statusCode || 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: error.message || 'Internal server error',
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                })
            };
        }
    };
};

module.exports = serverlessAdapter;
