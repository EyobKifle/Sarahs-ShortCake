// Generates a unique order ID using timestamp and random components
function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${randomPart}`;
}

// Expose globally
window.generateOrderId = generateOrderId;
