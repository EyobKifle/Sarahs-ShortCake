const InventoryItem = require('../models/InventoryItem');
const recipeMapping = require('./recipeMapping');

/**
 * Deduct ingredients from inventory when an order is completed
 * @param {Array} orderItems - Array of order items with product names and quantities
 * @param {String} orderId - Order ID for tracking
 * @param {String} performedBy - User who performed the action
 * @returns {Object} - Result object with success status and details
 */
async function deductInventoryForOrder(orderItems, orderId, performedBy = 'System') {
    const deductionResults = [];
    const errors = [];
    const warnings = [];

    try {
        console.log(`🔄 Processing inventory deduction for order ${orderId}`);
        console.log(`📦 Order items:`, orderItems);

        for (const orderItem of orderItems) {
            const { productName, quantity } = orderItem;

            // Get recipe for this product
            const recipe = recipeMapping[productName];

            if (!recipe) {
                warnings.push(`⚠️ No recipe found for product: ${productName}`);
                continue;
            }

            console.log(`🧁 Processing ${quantity}x ${productName}`);

            // Process each ingredient in the recipe
            for (const ingredient of recipe.ingredients) {
                const { name, quantity: recipeQuantity, conversionFactor } = ingredient;

                // Calculate total quantity needed (recipe quantity * number of cupcakes * conversion factor)
                const totalQuantityNeeded = recipeQuantity * quantity * conversionFactor;

                try {
                    // Find the inventory item
                    const inventoryItem = await InventoryItem.findOne({ name: name });

                    if (!inventoryItem) {
                        errors.push(`❌ Inventory item not found: ${name}`);
                        continue;
                    }

                    // Check if we have enough quantity
                    if (inventoryItem.quantity < totalQuantityNeeded) {
                        errors.push(`❌ Insufficient inventory for ${name}. Required: ${totalQuantityNeeded.toFixed(4)} ${inventoryItem.unit}, Available: ${inventoryItem.quantity} ${inventoryItem.unit}`);
                        continue;
                    }

                    // Deduct the quantity
                    const previousQuantity = inventoryItem.quantity;
                    inventoryItem.quantity -= totalQuantityNeeded;

                    // Add history entry
                    const historyEntry = {
                        action: 'deduct',
                        previousQuantity: previousQuantity,
                        newQuantity: inventoryItem.quantity,
                        changeAmount: -totalQuantityNeeded,
                        date: new Date(),
                        notes: `Order completion - ${quantity}x ${productName} (Order: ${orderId})`
                    };

                    // Only add performedBy if it's a valid ObjectId
                    if (performedBy && performedBy !== 'System' && performedBy !== 'Admin') {
                        const mongoose = require('mongoose');
                        if (mongoose.Types.ObjectId.isValid(performedBy)) {
                            historyEntry.performedBy = performedBy;
                        }
                    }

                    inventoryItem.history.push(historyEntry);

                    // Save the updated inventory item
                    await inventoryItem.save();

                    deductionResults.push({
                        ingredient: name,
                        quantityDeducted: totalQuantityNeeded,
                        unit: inventoryItem.unit,
                        previousQuantity: previousQuantity,
                        newQuantity: inventoryItem.quantity,
                        forProduct: productName,
                        productQuantity: quantity
                    });

                    console.log(`✅ Deducted ${totalQuantityNeeded.toFixed(4)} ${inventoryItem.unit} of ${name} (${previousQuantity} → ${inventoryItem.quantity})`);

                    // Check if item is now low stock
                    if (inventoryItem.quantity <= inventoryItem.threshold) {
                        warnings.push(`⚠️ ${name} is now at or below threshold (${inventoryItem.quantity} ${inventoryItem.unit} ≤ ${inventoryItem.threshold} ${inventoryItem.unit})`);
                    }

                } catch (error) {
                    errors.push(`❌ Error processing ${name}: ${error.message}`);
                }
            }
        }

        const result = {
            success: errors.length === 0,
            orderId: orderId,
            deductionResults: deductionResults,
            errors: errors,
            warnings: warnings,
            summary: {
                totalIngredients: deductionResults.length,
                totalErrors: errors.length,
                totalWarnings: warnings.length
            }
        };

        if (result.success) {
            console.log(`✅ Successfully processed inventory deduction for order ${orderId}`);
            console.log(`📊 Deducted ${deductionResults.length} ingredients`);
        } else {
            console.log(`❌ Inventory deduction completed with ${errors.length} errors for order ${orderId}`);
        }

        if (warnings.length > 0) {
            console.log(`⚠️ ${warnings.length} warnings generated`);
        }

        return result;

    } catch (error) {
        console.error(`❌ Fatal error during inventory deduction for order ${orderId}:`, error);
        return {
            success: false,
            orderId: orderId,
            deductionResults: [],
            errors: [`Fatal error: ${error.message}`],
            warnings: warnings,
            summary: {
                totalIngredients: 0,
                totalErrors: 1,
                totalWarnings: warnings.length
            }
        };
    }
}

/**
 * Check if sufficient inventory exists for an order before processing
 * @param {Array} orderItems - Array of order items with product names and quantities
 * @returns {Object} - Result object with availability status and details
 */
async function checkInventoryAvailability(orderItems) {
    const availabilityResults = [];
    const insufficientItems = [];

    try {
        for (const orderItem of orderItems) {
            const { productName, quantity } = orderItem;

            const recipe = recipeMapping[productName];
            if (!recipe) {
                insufficientItems.push(`No recipe found for product: ${productName}`);
                continue;
            }

            for (const ingredient of recipe.ingredients) {
                const { name, quantity: recipeQuantity, conversionFactor } = ingredient;
                const totalQuantityNeeded = recipeQuantity * quantity * conversionFactor;

                const inventoryItem = await InventoryItem.findOne({ name: name });

                if (!inventoryItem) {
                    insufficientItems.push(`Inventory item not found: ${name}`);
                    continue;
                }

                if (inventoryItem.quantity < totalQuantityNeeded) {
                    insufficientItems.push(`Insufficient ${name}: need ${totalQuantityNeeded.toFixed(4)} ${inventoryItem.unit}, have ${inventoryItem.quantity} ${inventoryItem.unit}`);
                }

                availabilityResults.push({
                    ingredient: name,
                    required: totalQuantityNeeded,
                    available: inventoryItem.quantity,
                    unit: inventoryItem.unit,
                    sufficient: inventoryItem.quantity >= totalQuantityNeeded,
                    forProduct: productName
                });
            }
        }

        return {
            available: insufficientItems.length === 0,
            availabilityResults: availabilityResults,
            insufficientItems: insufficientItems
        };

    } catch (error) {
        return {
            available: false,
            availabilityResults: [],
            insufficientItems: [`Error checking availability: ${error.message}`]
        };
    }
}

module.exports = {
    deductInventoryForOrder,
    checkInventoryAvailability
};
