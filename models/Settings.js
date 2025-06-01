const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Business Information
    businessName: {
        type: String,
        default: "Sarah's Short Cakes"
    },
    businessEmail: {
        type: String,
        default: "info@sarahsshortcakes.com"
    },
    businessPhone: {
        type: String,
        default: "+1 (555) 123-4567"
    },
    businessAddress: {
        type: String,
        default: "123 Sweet Street, Bakery City"
    },
    businessDescription: {
        type: String,
        default: "Delicious homemade cupcakes and cakes made with love and the finest ingredients."
    },
    businessLogo: {
        type: String,
        default: ""
    },

    // Notification Settings
    emailNotifications: {
        type: Boolean,
        default: true
    },
    smsNotifications: {
        type: Boolean,
        default: false
    },
    lowStockAlerts: {
        type: Boolean,
        default: true
    },
    newOrderAlerts: {
        type: Boolean,
        default: true
    },
    orderStatusAlerts: {
        type: Boolean,
        default: true
    },
    customerRegistrationAlerts: {
        type: Boolean,
        default: false
    },

    // Email Configuration
    emailSettings: {
        smtpHost: {
            type: String,
            default: "smtp.gmail.com"
        },
        smtpPort: {
            type: Number,
            default: 587
        },
        smtpUser: {
            type: String,
            default: "eyobkifle456@gmail.com"
        },
        smtpPassword: {
            type: String,
            default: ""
        },
        fromEmail: {
            type: String,
            default: "info@sarahsshortcakes.com"
        },
        fromName: {
            type: String,
            default: "Sarahs ShortCakes"
        },
        useSSL: {
            type: Boolean,
            default: true
        },
        testMode: {
            type: Boolean,
            default: false
        }
    },

    // SMS Configuration
    smsSettings: {
        provider: {
            type: String,
            enum: ['twilio', 'ethiopia_telecom', 'safaricom_ethiopia', 'local_gateway', 'africastalking', 'textlocal', 'afromessage'],
            default: 'afromessage'
        },
        // Twilio settings
        accountSid: {
            type: String,
            default: ""
        },
        authToken: {
            type: String,
            default: ""
        },
        fromNumber: {
            type: String,
            default: ""
        },
        // Ethiopia Telecom settings
        apiKey: {
            type: String,
            default: ""
        },
        senderId: {
            type: String,
            default: "SARAHS"
        },
        apiUrl: {
            type: String,
            default: "https://api.ethiotelecom.et/sms/send"
        },
        // Safaricom Ethiopia settings
        username: {
            type: String,
            default: ""
        },
        password: {
            type: String,
            default: ""
        },
        shortCode: {
            type: String,
            default: ""
        },
        // Africa's Talking settings (Great for Ethiopia)
        africasTalkingApiKey: {
            type: String,
            default: ""
        },
        africasTalkingUsername: {
            type: String,
            default: "sandbox"
        },
        africasTalkingFrom: {
            type: String,
            default: "SARAHS"
        },
        // TextLocal settings (Good international coverage)
        textLocalApiKey: {
            type: String,
            default: ""
        },
        textLocalSender: {
            type: String,
            default: "SARAHS"
        },
        // AfroMessage settings (Perfect for Ethiopia)
        afroMessageApiKey: {
            type: String,
            default: "eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiRWdKZFlmOHBMNENDRUhra3RnZ1pBdXZoaWxEZXVGYnEiLCJleHAiOjE5MDYyMDY4NDcsImlhdCI6MTc0ODQ0MDQ0NywianRpIjoiNGVjMjE3MWEtYzg3OC00YzZjLTk3MzctZmIxY2I1MjgxMzJhIn0.QKK5HdkTFpcx3ov_Npg7qCBQYZ-7TrqjsLXzwYK8rvo"
        },
        afroMessageSender: {
            type: String,
            default: "SARAHS"
        },
        afroMessageIdentifierId: {
            type: String,
            default: ""
        },
        // Local Gateway settings
        gatewayUrl: {
            type: String,
            default: ""
        },
        gatewayApiKey: {
            type: String,
            default: ""
        },
        testMode: {
            type: Boolean,
            default: false
        }
    },

    // Business Hours
    businessHours: {
        monday: {
            open: { type: String, default: '08:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false }
        },
        tuesday: {
            open: { type: String, default: '08:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false }
        },
        wednesday: {
            open: { type: String, default: '08:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false }
        },
        thursday: {
            open: { type: String, default: '08:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false }
        },
        friday: {
            open: { type: String, default: '08:00' },
            close: { type: String, default: '18:00' },
            closed: { type: Boolean, default: false }
        },
        saturday: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '16:00' },
            closed: { type: Boolean, default: false }
        },
        sunday: {
            open: { type: String, default: '10:00' },
            close: { type: String, default: '14:00' },
            closed: { type: Boolean, default: true }
        }
    },

    // Order Settings
    orderSettings: {
        minimumOrderAmount: {
            type: Number,
            default: 0
        },
        maxOrdersPerDay: {
            type: Number,
            default: 50
        },
        advanceOrderDays: {
            type: Number,
            default: 7
        },
        autoAcceptOrders: {
            type: Boolean,
            default: false
        },
        requirePaymentProof: {
            type: Boolean,
            default: true
        }
    },

    // Inventory Settings
    inventorySettings: {
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        autoReorderEnabled: {
            type: Boolean,
            default: false
        },
        reorderQuantity: {
            type: Number,
            default: 50
        }
    },

    // Payment Settings
    paymentSettings: {
        acceptCash: {
            type: Boolean,
            default: true
        },
        acceptCard: {
            type: Boolean,
            default: true
        },
        acceptOnlinePayment: {
            type: Boolean,
            default: false
        },
        requireDepositPercentage: {
            type: Number,
            default: 0
        }
    },

    // Delivery Settings
    deliverySettings: {
        deliveryEnabled: {
            type: Boolean,
            default: true
        },
        deliveryFee: {
            type: Number,
            default: 5.00
        },
        freeDeliveryThreshold: {
            type: Number,
            default: 50.00
        },
        maxDeliveryDistance: {
            type: Number,
            default: 10
        }
    },

    // System Settings
    systemSettings: {
        maintenanceMode: {
            type: Boolean,
            default: false
        },
        allowGuestOrders: {
            type: Boolean,
            default: true
        },
        requireEmailVerification: {
            type: Boolean,
            default: false
        },
        sessionTimeout: {
            type: Number,
            default: 30
        }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
settingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
