const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');

class AuthService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
        this.COOKIE_OPTIONS = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/',
        };
    }

    /**
     * Generate JWT token for user
     */
    generateToken(user) {
        const payload = {
            id: user._id,
            email: user.email,
            userType: user.role || 'customer',
            firstName: user.firstName,
            lastName: user.lastName
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN
        });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Extract token from request (cookies or headers)
     */
    extractToken(req) {
        let token = null;

        // Check cookies first (preferred for web apps)
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        // Check Authorization header (for API clients)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        return token;
    }

    /**
     * Authenticate user by email and password
     */
    async authenticateUser(email, password, userType = 'auto') {
        let user = null;
        let actualUserType = userType;

        try {
            // If userType is 'auto', try to determine from email or check both
            if (userType === 'auto') {
                // First try customer
                user = await Customer.findOne({ email }).select('+password');
                if (user) {
                    actualUserType = 'customer';
                } else {
                    // Try admin
                    user = await Admin.findOne({ email }).select('+password');
                    if (user) {
                        actualUserType = 'admin';
                    }
                }
            } else if (userType === 'customer') {
                user = await Customer.findOne({ email }).select('+password');
            } else if (userType === 'admin') {
                user = await Admin.findOne({ email }).select('+password');
            }

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Update last login for admins
            if (actualUserType === 'admin' && user.updateLastLogin) {
                await user.updateLastLogin();
            }

            // Generate token
            const token = this.generateToken(user);

            // Return user data (without password)
            const userData = {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: actualUserType,
                ...(actualUserType === 'admin' && {
                    permissions: user.permissions,
                    lastLogin: user.lastLogin
                })
            };

            return {
                success: true,
                token,
                user: userData,
                userType: actualUserType
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get user by ID and type
     */
    async getUserById(id, userType) {
        try {
            let user;
            if (userType === 'customer') {
                user = await Customer.findById(id).select('-password');
            } else if (userType === 'admin') {
                user = await Admin.findById(id).select('-password');
            }

            if (!user) {
                throw new Error('User not found');
            }

            return {
                success: true,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    address: user.address,
                    role: userType,
                    ...(userType === 'admin' && {
                        permissions: user.permissions,
                        lastLogin: user.lastLogin
                    })
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Set authentication cookie
     */
    setAuthCookie(res, token) {
        res.cookie('jwt', token, this.COOKIE_OPTIONS);
    }

    /**
     * Clear authentication cookie
     */
    clearAuthCookie(res) {
        res.clearCookie('jwt', { path: '/' });
    }

    /**
     * Middleware to protect routes
     */
    protect() {
        return async (req, res, next) => {
            try {
                // Extract token
                const token = this.extractToken(req);
                
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'Access denied. No token provided.'
                    });
                }

                // Verify token
                const decoded = this.verifyToken(token);
                
                // Get user from database
                const userResult = await this.getUserById(decoded.id, decoded.userType);
                
                if (!userResult.success) {
                    return res.status(401).json({
                        success: false,
                        message: 'Access denied. User not found.'
                    });
                }

                // Attach user to request
                req.user = userResult.user;
                req.userType = decoded.userType;
                req.token = token;

                next();
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. Invalid token.'
                });
            }
        };
    }

    /**
     * Middleware to authorize specific roles
     */
    authorize(...roles) {
        return (req, res, next) => {
            if (!req.userType || !roles.includes(req.userType)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }
            next();
        };
    }

    /**
     * Check if user has specific permission (for admins)
     */
    hasPermission(user, permission) {
        if (user.role !== 'admin') return false;
        return user.permissions?.includes(permission) || user.role === 'super-admin';
    }
}

module.exports = new AuthService();
