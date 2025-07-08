/**
 * Formats a price with currency symbol
 * @param {Number} amount - The amount to format
 * @returns {String} Formatted price string
 */
exports.formatPrice = (amount) => {
    return `$${amount.toFixed(2)}`;
};

/**
 * Capitalizes the first letter of each word in a string
 * @param {String} str - The string to capitalize
 * @returns {String} Capitalized string
 */
exports.capitalize = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Generates a random order number
 * @returns {String} Random order number
 */
exports.generateOrderNumber = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    
    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Add 4 random numbers
    for (let i = 0; i < 4; i++) {
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return result;
};

/**
 * Validates an email address
 * @param {String} email - The email to validate
 * @returns {Boolean} True if email is valid
 */
exports.validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Calculates the estimated preparation time for an order
 * @param {Array} items - Array of order items
 * @returns {Number} Estimated minutes required
 */
exports.estimatePrepTime = (items) => {
    const baseTime = 30; // Base time in minutes
    const perItemTime = 5; // Additional minutes per item
    
    return baseTime + (items.length * perItemTime);
};