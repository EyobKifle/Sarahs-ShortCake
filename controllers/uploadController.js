const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for payment confirmation uploads
const paymentConfirmationStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/payment-confirmations');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'payment-confirmation-' + uniqueSuffix + extension);
    }
});

const paymentConfirmationUpload = multer({
    storage: paymentConfirmationStorage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow images and PDFs
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, JPG, PNG, GIF) and PDF files are allowed'));
        }
    }
});

// Upload payment confirmation file
exports.uploadPaymentConfirmation = async (req, res) => {
    try {
        console.log('📁 Payment confirmation upload request received');
        
        paymentConfirmationUpload.single('file')(req, res, function (err) {
            if (err) {
                console.error('❌ File upload error:', err.message);
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            }

            if (!req.file) {
                console.error('❌ No file provided');
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            console.log('✅ Payment confirmation file uploaded successfully:', req.file.filename);
            
            res.status(200).json({
                success: true,
                message: 'Payment confirmation uploaded successfully',
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                path: `/uploads/payment-confirmations/${req.file.filename}`,
                uploadedAt: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('❌ Upload controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during file upload',
            error: error.message
        });
    }
};

// Configure multer for profile image uploads (for future use)
const profileImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/profile-images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + extension);
    }
});

const profileImageUpload = multer({
    storage: profileImageStorage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow only images
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
        }
    }
});

// Upload profile image (for future use)
exports.uploadProfileImage = async (req, res) => {
    try {
        profileImageUpload.single('file')(req, res, function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Profile image uploaded successfully',
                filename: req.file.filename,
                path: `/uploads/profile-images/${req.file.filename}`
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during file upload',
            error: error.message
        });
    }
};
