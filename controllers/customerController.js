// Added dashboard stats API method
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Review = require('../models/Review');


// Create or update a customer
exports.createOrUpdateCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, role, isGuest, favorites } = req.body;

        // Check if customer already exists
        let customer = await Customer.findOne({ email });

        if (customer) {
            // Update existing customer
            customer.firstName = firstName;
            customer.lastName = lastName;
            customer.phone = phone;
            customer.address = address;
            if (role) customer.role = role;
            // IMPORTANT: Never set isGuest to true for Customer model entries
            // All Customer model entries are registered customers with accounts
            customer.isGuest = false;
            if (favorites) customer.favorites = favorites;
        } else {
            // Create new customer
            customer = new Customer({
                firstName,
                lastName,
                email,
                phone,
                address,
                role: role || 'customer',
                isGuest: false, // All Customer model entries are registered customers
                favorites: favorites || []
            });
        }

        await customer.save();

        res.status(200).json({
            success: true,
            data: customer,
            message: 'Customer information saved successfully'
        });
    } catch (error) {
        console.error('Error saving customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving customer information'
        });
    }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ lastName: 1 });

        // Enhance customers with order statistics
        const enhancedCustomers = await Promise.all(customers.map(async (customer) => {
            try {
                const customerObj = customer.toObject();

                // Get order count and total spent for this customer
                const orders = await Order.find({ customerId: customer._id });
                customerObj.orderCount = orders.length;

                // Calculate total spent using comprehensive logic
                customerObj.totalSpent = orders.reduce((sum, order) => {
                    // Try multiple fields for total amount
                    let orderTotal = order.total || order.totalAmount || order.payment?.amount;

                    // If no total found, calculate from items
                    if (!orderTotal && order.items && Array.isArray(order.items)) {
                        orderTotal = order.items.reduce((total, item) => {
                            if (!item.price || !item.quantity) return total;
                            return total + (parseFloat(item.price) * parseInt(item.quantity));
                        }, 0);
                    }

                    const validTotal = parseFloat(orderTotal) || 0;
                    return sum + validTotal;
                }, 0);

                // Ensure required fields exist
                if (!customerObj.firstName) customerObj.firstName = '';
                if (!customerObj.lastName) customerObj.lastName = '';
                if (!customerObj.email) customerObj.email = '';
                if (!customerObj.phone) customerObj.phone = '';
                if (!customerObj.createdAt) customerObj.createdAt = new Date();

                // IMPORTANT: All customers in the Customer model are REGISTERED customers
                // The Customer model requires a password field, so anyone in this model has an account
                // Guest customers are NOT stored in the Customer model - they only exist in order.guestInfo
                customerObj.isGuest = false; // All Customer model entries are registered customers

                return customerObj;
            } catch (error) {
                console.error('Error enhancing customer data:', error);
                return customer.toObject();
            }
        }));

        // Add guest customers from orders
        // ONLY include orders that are truly from guests:
        // 1. No customerId (not linked to registered customer)
        // 2. Has guestInfo (contains guest details)
        // 3. Email is NOT from a registered customer
        const registeredEmails = new Set(enhancedCustomers.map(c => c.email.toLowerCase()));

        const guestOrders = await Order.find({
            // Must have no customerId (not linked to registered customer)
            $and: [
                {
                    $or: [
                        { customerId: { $exists: false } },
                        { customerId: null }
                    ]
                },
                // Must have guest info
                { guestInfo: { $exists: true } },
                // Must have guest email
                { 'guestInfo.email': { $exists: true, $ne: null, $ne: '' } }
            ]
        }).lean();

        const guestCustomers = {};
        guestOrders.forEach(order => {
            const email = order.guestInfo?.email?.toLowerCase();
            const phone = order.guestInfo?.phone;

            // CRITICAL: Skip if this email belongs to a registered customer
            // This prevents registered customers from appearing as guests
            if (email && registeredEmails.has(email)) {
                return;
            }

            // Only use email as identifier for true guest customers
            const identifier = email || `guest_${order._id}`;

            // Additional validation: ensure this is truly a guest order
            if (!email) {
                return;
            }

            if (identifier) {
                if (!guestCustomers[identifier]) {
                    const fullName = order.guestInfo?.name || 'Guest Customer';
                    const nameParts = fullName.split(' ');

                    guestCustomers[identifier] = {
                        _id: `guest_${identifier}`,
                        firstName: nameParts[0] || 'Guest',
                        lastName: nameParts.slice(1).join(' ') || '',
                        email: email || '',
                        phone: phone || '',
                        address: order.deliveryInfo?.address || '',
                        isGuest: true,
                        orderCount: 0,
                        totalSpent: 0,
                        averageOrderValue: 0,
                        lastOrderDate: order.createdAt,
                        createdAt: order.createdAt,
                        status: 'Guest',
                        customerSince: order.createdAt,
                        orders: []
                    };
                }

                guestCustomers[identifier].orderCount++;

                // Calculate order total using comprehensive logic
                let orderTotal = order.total || order.totalAmount || order.payment?.amount;
                if (!orderTotal && order.items && Array.isArray(order.items)) {
                    orderTotal = order.items.reduce((total, item) => {
                        if (!item.price || !item.quantity) return total;
                        return total + (parseFloat(item.price) * parseInt(item.quantity));
                    }, 0);
                }
                const validOrderTotal = parseFloat(orderTotal) || 0;

                guestCustomers[identifier].totalSpent += validOrderTotal;
                guestCustomers[identifier].orders.push({
                    orderId: order._id,
                    date: order.createdAt,
                    amount: validOrderTotal,
                    status: order.status
                });

                // Update last order date
                if (new Date(order.createdAt) > new Date(guestCustomers[identifier].lastOrderDate)) {
                    guestCustomers[identifier].lastOrderDate = order.createdAt;
                }

                // Update first order date (customer since)
                if (new Date(order.createdAt) < new Date(guestCustomers[identifier].createdAt)) {
                    guestCustomers[identifier].createdAt = order.createdAt;
                    guestCustomers[identifier].customerSince = order.createdAt;
                }
            }
        });

        // Calculate average order values for guest customers
        Object.values(guestCustomers).forEach(customer => {
            if (customer.orderCount > 0) {
                customer.averageOrderValue = customer.totalSpent / customer.orderCount;
            }
        });

        const allCustomers = [...enhancedCustomers, ...Object.values(guestCustomers)];

        // Calculate additional statistics
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const newThisMonth = allCustomers.filter(c => {
            const createdDate = new Date(c.createdAt);
            return createdDate.getMonth() === thisMonth &&
                   createdDate.getFullYear() === thisYear;
        }).length;

        const newLastMonth = allCustomers.filter(c => {
            const createdDate = new Date(c.createdAt);
            return createdDate.getMonth() === lastMonth &&
                   createdDate.getFullYear() === lastMonthYear;
        }).length;

        const activeCustomers = allCustomers.filter(c => {
            if (!c.lastOrderDate) return false;
            const daysSinceLastOrder = (now - new Date(c.lastOrderDate)) / (1000 * 60 * 60 * 24);
            return daysSinceLastOrder <= 30; // Active if ordered in last 30 days
        }).length;

        res.status(200).json({
            success: true,
            data: allCustomers,
            summary: {
                totalCustomers: allCustomers.length,
                registeredCustomers: enhancedCustomers.length,
                guestCustomers: Object.keys(guestCustomers).length,
                newThisMonth: newThisMonth,
                newLastMonth: newLastMonth,
                activeCustomers: activeCustomers,
                customerGrowth: newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth * 100).toFixed(1) : 100,
                totalRevenue: allCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
                averageCustomerValue: allCustomers.length > 0 ?
                    (allCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / allCustomers.length).toFixed(2) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers'
        });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        let customerId = req.params.id;
        // If the id is "me", replace it with the authenticated user's id
        if (customerId === 'me') {
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized: User not authenticated'
                });
            }
            customerId = req.user._id;
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer'
        });
    }
};

// Get dashboard stats for logged-in customer
exports.getDashboardStats = async (req, res) => {
    try {
        const customerId = req.user._id;

        // Total orders count
        const totalOrders = await Order.countDocuments({ customerId: customerId });

        // Total spent sum
        const orders = await Order.find({ customerId: customerId });
        const totalSpent = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);

        // Wishlist items count
        const customer = await Customer.findById(customerId);
        const wishlistItems = customer && customer.favorites ? customer.favorites.length : 0;

        // Reviews count
        const reviewsCount = await Review.countDocuments({ customer: customerId });

        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                totalSpent,
                wishlistItems,
                reviews: reviewsCount
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats'
        });
    }
};

// Get addresses for logged-in customer
const UserAddress = require('../models/UserAddress');

exports.getAddresses = async (req, res) => {
    try {
        const userId = req.user._id;
        const addresses = await UserAddress.find({ userId });
        res.status(200).json({ success: true, data: addresses });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ success: false, message: 'Error fetching addresses' });
    }
};

// Add new address
exports.addAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { street, city, state, zip } = req.body;
        const newAddress = new UserAddress({ userId, street, city, state, zip });
        await newAddress.save();
        res.status(201).json({ success: true, data: newAddress, message: 'Address added successfully' });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ success: false, message: 'Error adding address' });
    }
};

// Edit address
exports.editAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;
        const { street, city, state, zip } = req.body;
        const address = await UserAddress.findOneAndUpdate(
            { _id: addressId, userId },
            { street, city, state, zip },
            { new: true }
        );
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, data: address, message: 'Address updated successfully' });
    } catch (error) {
        console.error('Error editing address:', error);
        res.status(500).json({ success: false, message: 'Error editing address' });
    }
};

// Delete address
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const addressId = req.params.id;
        const address = await UserAddress.findOneAndDelete({ _id: addressId, userId });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Error deleting address' });
    }
};

// Get wishlist items for logged-in customer
exports.getWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const customer = await Customer.findById(customerId).populate('favorites');
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: customer.favorites || [] });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ success: false, message: 'Error fetching wishlist' });
    }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const customerId = req.user._id;
        const itemId = req.params.itemId;
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        customer.favorites = customer.favorites.filter(favId => favId.toString() !== itemId);
        await customer.save();
        res.status(200).json({ success: true, message: 'Item removed from wishlist' });
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        res.status(500).json({ success: false, message: 'Error removing item from wishlist' });
    }
};

// Get reviews for logged-in customer
exports.getReviews = async (req, res) => {
    try {
        const customerId = req.user._id;
        const reviews = await Review.find({ customer: customerId });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
};

// Update logged-in customer's profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { firstName, lastName, email, phone } = req.body;

        const customer = await Customer.findById(userId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Update fields
        if (firstName) customer.firstName = firstName;
        if (lastName) customer.lastName = lastName;
        if (email) customer.email = email;
        if (phone) customer.phone = phone;

        await customer.save();

        res.status(200).json({ success: true, data: customer, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};

// Admin function to reset all customer passwords to a temporary password
exports.resetAllPasswords = async (req, res) => {
    try {
        const { tempPassword } = req.body;

        // Use default temp password if none provided
        const defaultTempPassword = tempPassword || 'TempPass123!';

        // Get all customers
        const customers = await Customer.find({}, 'email firstName lastName');

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No customers found'
            });
        }

        const resetResults = [];

        // Reset password for each customer
        for (const customer of customers) {
            try {
                customer.password = defaultTempPassword;
                await customer.save();

                resetResults.push({
                    email: customer.email,
                    name: `${customer.firstName} ${customer.lastName}`,
                    tempPassword: defaultTempPassword,
                    status: 'success'
                });
            } catch (error) {
                console.error(`Error resetting password for ${customer.email}:`, error);
                resetResults.push({
                    email: customer.email,
                    name: `${customer.firstName} ${customer.lastName}`,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        const successCount = resetResults.filter(r => r.status === 'success').length;
        const failedCount = resetResults.filter(r => r.status === 'failed').length;

        res.status(200).json({
            success: true,
            message: `Password reset completed. ${successCount} successful, ${failedCount} failed.`,
            data: {
                tempPassword: defaultTempPassword,
                totalCustomers: customers.length,
                successCount,
                failedCount,
                results: resetResults
            }
        });

    } catch (error) {
        console.error('Error resetting all passwords:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting customer passwords'
        });
    }
};

// Admin function to get all customer emails and their current password status
exports.getCustomerCredentials = async (req, res) => {
    try {
        const customers = await Customer.find({}, 'email firstName lastName password createdAt lastLogin');

        const customerData = customers.map(customer => ({
            id: customer._id,
            email: customer.email,
            name: `${customer.firstName} ${customer.lastName}`,
            firstName: customer.firstName,
            lastName: customer.lastName,
            hasPassword: !!customer.password,
            passwordHash: customer.password, // This is the hashed password
            createdAt: customer.createdAt,
            lastLogin: customer.lastLogin
        }));

        res.status(200).json({
            success: true,
            message: `Found ${customers.length} customers`,
            data: customerData,
            summary: {
                totalCustomers: customers.length,
                customersWithPasswords: customerData.filter(c => c.hasPassword).length
            }
        });

    } catch (error) {
        console.error('Error fetching customer credentials:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer credentials'
        });
    }
};
