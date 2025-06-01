const Admin = require('../models/Admin');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const Joi = require('joi');

const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching admins', error: error.message });
  }
};

const createAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(1).required()
});

const createAdmin = async (req, res) => {
  try {
    const { error } = createAdminSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { email, password, name } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }
    const newAdmin = new Admin({ email, password, name });
    await newAdmin.save();
    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating admin', error: error.message });
  }
};

const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching admin', error: error.message });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating admin', error: error.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting admin', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    console.log('Starting getDashboardStats with period:', req.query.period);
    const period = req.query.period || 'all';
    const today = new Date();

    // Calculate date ranges based on period
    let startDate, endDate, previousStartDate, previousEndDate;

    switch (period) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        previousStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        previousEndDate = startDate;
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        startDate = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        previousStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        previousEndDate = startDate;
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        previousStartDate = new Date(today.getFullYear() - 1, 0, 1);
        previousEndDate = startDate;
        break;
      default: // 'all'
        startDate = new Date(0); // Beginning of time
        endDate = new Date(); // Now
        previousStartDate = new Date(0);
        previousEndDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000); // Last year
    }

    console.log('Date range:', { startDate, endDate, previousStartDate, previousEndDate });

    // Total orders count for the period
    console.log('Fetching orders for period');
    const ordersInPeriod = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate }
    }).populate('customerId', 'firstName lastName email');
    console.log('ordersInPeriod count:', ordersInPeriod.length);

    // Orders in previous period for comparison
    const ordersInPreviousPeriod = await Order.find({
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    });
    console.log('ordersInPreviousPeriod count:', ordersInPreviousPeriod.length);

    // Calculate ordersChange percentage
    const currentOrderCount = ordersInPeriod.length;
    const previousOrderCount = ordersInPreviousPeriod.length;
    const ordersChange = previousOrderCount === 0 ? 100 : ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100;
    console.log('ordersChange:', ordersChange);

    // Total revenue for current period
    const totalRevenueCurrent = ordersInPeriod.reduce((sum, order) => {
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
      console.log(`Order ${order._id}: total = ${validTotal}`);
      return sum + validTotal;
    }, 0);
    console.log('totalRevenueCurrent:', totalRevenueCurrent);

    // Total revenue for previous period
    const totalRevenuePrevious = ordersInPreviousPeriod.reduce((sum, order) => {
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
    console.log('totalRevenuePrevious:', totalRevenuePrevious);

    // Revenue change percentage
    const revenueChange = totalRevenuePrevious === 0 ? 100 : ((totalRevenueCurrent - totalRevenuePrevious) / totalRevenuePrevious) * 100;
    console.log('revenueChange:', revenueChange);

    // New customers for current period
    const newCustomersCurrent = await Customer.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate }
    });
    console.log('newCustomersCurrent:', newCustomersCurrent);

    // New customers for previous period
    const newCustomersPrevious = await Customer.countDocuments({
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    });
    console.log('newCustomersPrevious:', newCustomersPrevious);

    // Customers change percentage
    const customersChange = newCustomersPrevious === 0 ? 100 : ((newCustomersCurrent - newCustomersPrevious) / newCustomersPrevious) * 100;
    console.log('customersChange:', customersChange);

    // Define date ranges for ratings (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const prevThirtyDays = new Date(today);
    prevThirtyDays.setDate(today.getDate() - 60);

    // Average rating last 30 days
    const reviewsLast30 = await Review.find({
      createdAt: { $gte: thirtyDaysAgo }
    });
    console.log('reviewsLast30 count:', reviewsLast30.length);

    const avgRating = reviewsLast30.length === 0 ? 0 : reviewsLast30.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsLast30.length;
    console.log('avgRating:', avgRating);

    // Average rating previous 30 days
    const reviewsPrev30 = await Review.find({
      createdAt: { $gte: prevThirtyDays, $lt: thirtyDaysAgo }
    });
    console.log('reviewsPrev30 count:', reviewsPrev30.length);

    const avgRatingPrev = reviewsPrev30.length === 0 ? 0 : reviewsPrev30.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsPrev30.length;
    console.log('avgRatingPrev:', avgRatingPrev);

    // Rating change percentage
    const ratingChange = avgRatingPrev === 0 ? 100 : ((avgRating - avgRatingPrev) / avgRatingPrev) * 100;
    console.log('ratingChange:', ratingChange);

    // Popular products last 30 days with Product collection lookup
    let popularProductsAggregation = [];
    try {
      popularProductsAggregation = await Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $addFields: {
            'items.productObjectId': {
              $cond: {
                if: { $ne: ['$items.productId', null] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$items.productId' }, 'objectId'] },
                    then: '$items.productId',
                    else: {
                      $cond: {
                        if: { $regexMatch: { input: '$items.productId', regex: /^[0-9a-fA-F]{24}$/ } },
                        then: { $toObjectId: '$items.productId' },
                        else: null
                      }
                    }
                  }
                },
                else: null
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productObjectId',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $group: {
            _id: '$items.productId',
            productName: { $first: { $arrayElemAt: ['$productInfo.name', 0] } },
            totalQuantity: { $sum: { $ifNull: ['$items.quantity', 1] } },
            totalRevenue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$items.price', 0] },
                  { $ifNull: ['$items.quantity', 1] }
                ]
              }
            },
            orderCount: { $sum: 1 },
            avgPrice: {
              $avg: {
                $multiply: [
                  { $ifNull: ['$items.price', 0] },
                  { $ifNull: ['$items.quantity', 1] }
                ]
              }
            }
          }
        },
        { $sort: { totalRevenue: -1 } }, // Sort by revenue instead of quantity
        { $limit: 10 },
        { $project: {
            _id: 0,
            name: { $ifNull: ['$productName', { $concat: ['Product ID: ', { $toString: '$_id' }] }] },
            totalQuantity: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] },
            orderCount: 1,
            avgPrice: { $round: ['$avgPrice', 2] }
          }
        }
      ]);
      console.log('🏆 Enhanced popularProductsAggregation with Product lookup:', popularProductsAggregation);
    } catch (aggError) {
      console.error('❌ Aggregation error in popularProductsAggregation:', aggError);
    }

    // Recent orders - ALWAYS get the 10 most recent orders regardless of time period
    // This ensures the recent orders section always shows the latest orders
    console.log('🔍 FETCHING RECENT ORDERS - timestamp:', new Date().toISOString());
    const recentOrders = await Order.find({})
      .populate('customerId', 'firstName lastName email name phone')
      .sort({ createdAt: -1 })
      .limit(10);
    console.log('recentOrders count (always latest 10):', recentOrders.length);

    // Calculate totals for recent orders using the same logic as main orders
    console.log('🔍 CALCULATING TOTALS FOR RECENT ORDERS:');
    recentOrders.forEach((order, index) => {
      // Apply the same total calculation logic as main orders
      let orderTotal = order.total || order.totalAmount || order.payment?.amount;

      // If no total found, calculate from items
      if (!orderTotal && order.items && Array.isArray(order.items)) {
        orderTotal = order.items.reduce((total, item) => {
          if (!item.price || !item.quantity) return total;
          return total + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);
      }

      const validTotal = parseFloat(orderTotal) || 0;

      // Add the calculated total to the order object
      order.calculatedTotal = validTotal;

      if (index < 3) { // Log first 3 orders for debugging
        console.log(`📋 Recent order ${index + 1}:`, {
          id: order._id,
          customerId: order.customerId,
          guestInfo: order.guestInfo,
          deliveryInfo: order.deliveryInfo,
          customerName: order.customerName,
          originalTotal: order.totalAmount || order.total,
          calculatedTotal: validTotal,
          hasItems: !!(order.items && order.items.length),
          itemsCount: order.items?.length || 0,
          hasCustomerId: !!order.customerId,
          hasGuestInfo: !!order.guestInfo,
          customerIdType: typeof order.customerId
        });
      }
    });

    // Final response with debugging
    console.log('📤 SENDING RESPONSE WITH:');
    console.log('- totalOrders:', currentOrderCount);
    console.log('- recentOrders count:', recentOrders.length);
    console.log('- recentOrders sample:', recentOrders[0]?._id);

    const response = {
      totalOrders: currentOrderCount,
      ordersChange: Math.round(ordersChange),
      totalRevenue: totalRevenueCurrent,
      revenueChange: Math.round(revenueChange),
      newCustomers: newCustomersCurrent,
      customersChange: Math.round(customersChange),
      avgRating: avgRating,
      ratingChange: Math.round(ratingChange),
      popularProducts: popularProductsAggregation,
      orders: ordersInPeriod, // All orders in the selected period
      recentOrders: recentOrders, // Recent orders for dashboard display
      period: period,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };

    console.log('📤 Response keys:', Object.keys(response));
    console.log('📤 Response recentOrders field exists:', 'recentOrders' in response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats', error: error.message, stack: error.stack });
  }
};

// Get notification count
const getNotificationCount = async (req, res) => {
  try {
    // For now, return a mock count
    // In a real app, you'd query your notifications collection
    const count = 3; // Mock count
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread messages count
const getUnreadMessagesCount = async (req, res) => {
  try {
    const ContactMessage = require('../models/ContactMessage');
    const count = await ContactMessage.countDocuments({ isRead: false });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting unread messages count:', error);
    // Return 0 if model doesn't exist or other error
    res.status(200).json({ count: 0 });
  }
};

// Get recent orders (always returns the 10 most recent orders)
const getRecentOrders = async (req, res) => {
  try {
    console.log('🔍 Fetching 10 most recent orders from database');
    console.log('🔍 Order model available:', !!Order);

    // Get the 10 most recent orders, sorted by creation date (newest first)
    const recentOrders = await Order.find({})
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`✅ Found ${recentOrders.length} recent orders`);

    res.status(200).json({
      success: true,
      count: recentOrders.length,
      orders: recentOrders
    });
  } catch (error) {
    console.error('❌ Error fetching recent orders:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent orders',
      error: error.message
    });
  }
};

// Check admin authentication
const checkAuth = async (req, res) => {
  try {
    // If we reach here, the user is authenticated (due to protect middleware)
    res.status(200).json({
      authenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        userType: req.userType
      }
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getDashboardStats,
  getRecentOrders,
  getNotificationCount,
  getUnreadMessagesCount,
  checkAuth
};
