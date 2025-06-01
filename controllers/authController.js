const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const PasswordResetToken = require('../models/PasswordResetToken');
const authService = require('../services/authService');
const NotificationService = require('../services/notificationService');
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const registerSchema = Joi.object({
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().min(7).required(),
  address: Joi.string().allow('', null)
});

exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    // Use centralized auth service with auto-detection
    const authResult = await authService.authenticateUser(email, password, 'auto');

    if (!authResult.success) {
      console.log('❌ Login failed for:', email, '-', authResult.message);
      return res.status(400).json({
        success: false,
        message: authResult.message,
      });
    }

    // Set authentication cookie
    authService.setAuthCookie(res, authResult.token);

    console.log('✅ Login successful for:', email, 'as', authResult.userType);
    res.status(200).json({
      success: true,
      token: authResult.token,
      user: authResult.user,
      userType: authResult.userType
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    console.log('🔐 Admin login attempt for:', email);

    // Use centralized auth service specifically for admin
    const authResult = await authService.authenticateUser(email, password, 'admin');

    if (!authResult.success) {
      console.log('❌ Admin login failed for:', email, '-', authResult.message);
      return res.status(400).json({
        success: false,
        message: authResult.message,
      });
    }

    // Set authentication cookie
    authService.setAuthCookie(res, authResult.token);

    console.log('✅ Admin login successful for:', email);
    res.status(200).json({
      success: true,
      token: authResult.token,
      user: authResult.user,
      userType: authResult.userType
    });

  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    console.log('🚪 Logout request from user:', req.user?.email || 'unknown');

    // Clear authentication cookie using centralized service
    authService.clearAuthCookie(res);

    console.log('✅ Logout successful');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { firstName, lastName, email, password, phone, address } = req.body;

    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const newUser = new Customer({
      firstName,
      lastName,
      email,
      phone,
      address,
      password,
      role: 'customer',
      isGuest: false // IMPORTANT: All signups create registered customers
    });

    await newUser.save();

    // Send welcome email to new customer
    try {
      const emailService = require('../services/emailService');
      await emailService.sendWelcomeEmail(newUser);
      console.log('✅ Welcome email sent to new customer:', newUser.email);
    } catch (emailError) {
      console.error('⚠️ Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({ success: true, data: newUser, message: 'Registration successful' });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('👤 Profile request from user:', req.user?.email || 'unknown');

    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get fresh user data from database using centralized service
    const userResult = await authService.getUserById(req.user.id, req.userType);

    if (!userResult.success) {
      console.log('❌ Failed to fetch user data:', userResult.message);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile data retrieved for:', userResult.user.email);
    res.status(200).json({
      success: true,
      user: userResult.user,
      userType: req.userType
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Password reset functionality - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    console.log('🔐 Password reset request received for:', req.body.email);
    const { email } = req.body;

    if (!email) {
      console.log('❌ No email provided in request');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log('🔍 Looking for user with email:', email.toLowerCase());
    // Find user by email
    const user = await Customer.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log('⚠️ User not found for email:', email);
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a password reset code will be sent.'
      });
    }

    console.log('✅ User found:', user.firstName, user.lastName);

    // Delete any existing reset tokens for this user
    console.log('🗑️ Deleting existing reset tokens for user:', user._id);
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Generate new OTP
    console.log('🎲 Generating new OTP...');
    const { otp, otpHash } = PasswordResetToken.generateOTP();
    console.log('✅ OTP generated:', otp);

    // Create reset token record with OTP
    console.log('💾 Creating reset token record...');
    const resetToken = new PasswordResetToken({
      userId: user._id,
      email: user.email,
      otp: otp,
      otpHash: otpHash,
      type: 'otp',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await resetToken.save();
    console.log('✅ Reset token saved to database');

    // Initialize notification service if not already done
    console.log('📧 Initializing notification service...');
    if (!NotificationService.settings) {
      await NotificationService.initialize();
    }
    console.log('✅ Notification service initialized');

    // Send OTP email
    console.log('📤 Sending OTP email to:', user.email);
    try {
      await NotificationService.sendPasswordResetOTP(user.email, otp, user.firstName);
      console.log('✅ OTP email sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending OTP email:', emailError);
      // Still return success to prevent email enumeration
      // but log the error for debugging
    }

    res.status(200).json({
      success: true,
      message: 'If this email is registered, a password reset code will be sent.',
      data: {
        email: user.email,
        expiresIn: 10 // minutes
      }
    });

  } catch (error) {
    console.error('❌ Error in forgotPassword:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Verify OTP code
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required'
      });
    }

    // Find the reset token
    const resetTokenDoc = await PasswordResetToken.findOne({
      email: email.toLowerCase(),
      type: 'otp',
      used: false
    }).populate('userId', 'email firstName lastName');

    if (!resetTokenDoc || !resetTokenDoc.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code'
      });
    }

    // Verify OTP
    const isValidOTP = resetTokenDoc.verifyOTP(otp);

    if (!isValidOTP) {
      await resetTokenDoc.save(); // Save updated attempts count

      const remainingAttempts = 3 - resetTokenDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${remainingAttempts} attempts remaining.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        email: resetTokenDoc.email,
        userName: `${resetTokenDoc.userId.firstName} ${resetTokenDoc.userId.lastName}`,
        verified: true
      }
    });

  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
};

// Reset password with OTP
exports.resetPassword = async (req, res) => {
  try {
    console.log('🔐 Password reset attempt for:', req.body.email);
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email, OTP code, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Additional password complexity validation
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter'
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number'
      });
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one special character'
      });
    }

    // Find and verify the reset token
    const resetTokenDoc = await PasswordResetToken.findOne({
      email: email.toLowerCase(),
      type: 'otp',
      used: false
    });

    if (!resetTokenDoc || !resetTokenDoc.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code'
      });
    }

    // Verify OTP one more time
    const isValidOTP = resetTokenDoc.verifyOTP(otp);

    if (!isValidOTP) {
      await resetTokenDoc.save(); // Save updated attempts count

      const remainingAttempts = 3 - resetTokenDoc.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${remainingAttempts} attempts remaining.`
      });
    }

    // Find the user
    console.log('👤 Finding user with ID:', resetTokenDoc.userId);
    const user = await Customer.findById(resetTokenDoc.userId);
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user.firstName, user.lastName);

    // Update user password
    console.log('🔒 Updating user password...');
    user.password = newPassword;
    await user.save();
    console.log('✅ Password updated successfully');

    // Mark token as used
    console.log('🗑️ Marking token as used...');
    resetTokenDoc.used = true;
    await resetTokenDoc.save();

    // Delete all reset tokens for this user
    console.log('🧹 Cleaning up reset tokens...');
    await PasswordResetToken.deleteMany({ userId: user._id });

    console.log('🎉 Password reset completed successfully for:', user.email);
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};
