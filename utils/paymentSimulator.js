class PaymentSimulator {
    constructor() {
        this.paymentMethods = {
            CBE: {
                name: "Commercial Bank of Ethiopia",
                logo: "/images/cbe-logo.png",
                simulateDelay: 2000
            },
            Telebirr: {
                name: "Telebirr",
                logo: "/images/telebirr-logo.png",
                simulateDelay: 1500
            }
        };
    }

    /**
     * Simulate payment processing
     * @param {string} method - 'CBE' or 'Telebirr'
     * @param {number} amount - Payment amount
     * @param {Object} details - Payment details
     * @returns {Promise<Object>} Simulated payment result
     */
    async processPayment(method, amount, details) {
        if (!this.paymentMethods[method]) {
            throw new Error('Invalid payment method');
        }

        // Simulate network delay
        await new Promise(resolve => 
            setTimeout(resolve, this.paymentMethods[method].simulateDelay));

        // Randomly succeed (80%) or fail (20%) for simulation
        const isSuccess = Math.random() > 0.2;
        
        return {
            success: isSuccess,
            method,
            amount,
            transactionId: isSuccess ? this.generateTransactionId(method) : null,
            message: isSuccess 
                ? `Payment of ${amount} ETB processed successfully via ${method}`
                : `Payment failed. Please try again or use another method`,
            timestamp: new Date().toISOString(),
            details
        };
    }

    generateTransactionId(method) {
        const prefix = method === 'CBE' ? 'CBE' : 'TEL';
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}-${randomNum}-${Date.now().toString().slice(-4)}`;
    }

    getPaymentMethods() {
        return Object.keys(this.paymentMethods).map(key => ({
            id: key,
            ...this.paymentMethods[key]
        }));
    }
}

module.exports = new PaymentSimulator();