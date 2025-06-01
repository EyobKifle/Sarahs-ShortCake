const mongoose = require('mongoose');
const Product = require('../models/Product');

async function addRecipesToProducts() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes');
        console.log('✅ Connected to MongoDB');

        // Get all products
        const products = await Product.find();
        console.log(`📦 Found ${products.length} products`);

        // Define recipes for different types of cupcakes
        const recipes = {
            vanilla: [
                { ingredient: 'All-purpose flour', quantity: 1.5, unit: 'cups' },
                { ingredient: 'Granulated sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Unsalted butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla extract', quantity: 2, unit: 'tsp' },
                { ingredient: 'Baking powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole milk', quantity: 0.5, unit: 'cup' }
            ],
            chocolate: [
                { ingredient: 'All-purpose flour', quantity: 1.25, unit: 'cups' },
                { ingredient: 'Granulated sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Cocoa powder (unsweetened)', quantity: 0.25, unit: 'cup' },
                { ingredient: 'Unsalted butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Baking powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole milk', quantity: 0.5, unit: 'cup' }
            ],
            strawberry: [
                { ingredient: 'All-purpose flour', quantity: 1.5, unit: 'cups' },
                { ingredient: 'Granulated sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Unsalted butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Strawberry extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Baking powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole milk', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Fresh strawberries', quantity: 0.5, unit: 'cup' }
            ],
            redVelvet: [
                { ingredient: 'All-purpose flour', quantity: 1.25, unit: 'cups' },
                { ingredient: 'Granulated sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Cocoa powder (unsweetened)', quantity: 1, unit: 'tbsp' },
                { ingredient: 'Unsalted butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Red food coloring', quantity: 2, unit: 'tbsp' },
                { ingredient: 'Baking soda', quantity: 1, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Buttermilk', quantity: 0.5, unit: 'cup' },
                { ingredient: 'White vinegar', quantity: 1, unit: 'tsp' }
            ]
        };

        let updatedCount = 0;

        // Assign recipes to products based on their names
        for (const product of products) {
            let recipe = null;
            const productName = product.name.toLowerCase();

            if (productName.includes('vanilla')) {
                recipe = recipes.vanilla;
                console.log(`🧁 Adding vanilla recipe to: ${product.name}`);
            } else if (productName.includes('chocolate')) {
                recipe = recipes.chocolate;
                console.log(`🍫 Adding chocolate recipe to: ${product.name}`);
            } else if (productName.includes('strawberry')) {
                recipe = recipes.strawberry;
                console.log(`🍓 Adding strawberry recipe to: ${product.name}`);
            } else if (productName.includes('red velvet')) {
                recipe = recipes.redVelvet;
                console.log(`❤️ Adding red velvet recipe to: ${product.name}`);
            } else {
                // Default to vanilla recipe for unknown types
                recipe = recipes.vanilla;
                console.log(`🧁 Adding default vanilla recipe to: ${product.name}`);
            }

            if (recipe) {
                await Product.findByIdAndUpdate(product._id, {
                    recipe: recipe,
                    updatedAt: new Date()
                });
                updatedCount++;
            }
        }

        console.log('\n🎉 Recipe assignment completed!');
        console.log(`📊 Summary:`);
        console.log(`   - ${updatedCount} products updated with recipes`);
        console.log(`   - Ready for inventory tracking on orders`);

    } catch (error) {
        console.error('❌ Error adding recipes:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

addRecipesToProducts();
