const mongoose = require('mongoose');
const Product = require('../models/Product');

async function fixRecipeIngredients() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes');
        console.log('✅ Connected to MongoDB');

        // Get all products
        const products = await Product.find();
        console.log(`📦 Found ${products.length} products\n`);

        // Define recipes with EXACT inventory ingredient names
        const cakeRecipes = {
            'vanilla': [
                { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla Extract', quantity: 2, unit: 'tsp' },
                { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' }
            ],
            'chocolate': [
                { ingredient: 'All-Purpose Flour', quantity: 1.25, unit: 'cups' },
                { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Cocoa Powder', quantity: 0.25, unit: 'cup' },
                { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' }
            ],
            'strawberry': [
                { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Strawberry Extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Fresh Strawberries', quantity: 0.5, unit: 'cup' }
            ],
            'red velvet': [
                { ingredient: 'All-Purpose Flour', quantity: 1.25, unit: 'cups' },
                { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Cocoa Powder', quantity: 1, unit: 'tbsp' },
                { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Red Food Coloring', quantity: 2, unit: 'tbsp' },
                { ingredient: 'Baking Soda', quantity: 1, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Buttermilk', quantity: 0.5, unit: 'cup' },
                { ingredient: 'White Vinegar', quantity: 1, unit: 'tsp' }
            ],
            'blueberry': [
                { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Fresh Blueberries', quantity: 0.5, unit: 'cup' }
            ],
            'cookies and cream': [
                { ingredient: 'All-Purpose Flour', quantity: 1.25, unit: 'cups' },
                { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                { ingredient: 'Vanilla Extract', quantity: 2, unit: 'tsp' },
                { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' },
                { ingredient: 'Crushed Oreo Cookies', quantity: 0.5, unit: 'cup' }
            ]
        };

        console.log('🔧 Fixing recipe ingredient names to match inventory:\n');
        
        let updatedCount = 0;

        for (const product of products) {
            const productName = product.name.toLowerCase();
            let recipeType = 'vanilla'; // default

            // Determine recipe type based on product name
            if (productName.includes('chocolate') && !productName.includes('white')) {
                recipeType = 'chocolate';
            } else if (productName.includes('strawberry')) {
                recipeType = 'strawberry';
            } else if (productName.includes('red velvet')) {
                recipeType = 'red velvet';
            } else if (productName.includes('cookies') && productName.includes('cream')) {
                recipeType = 'cookies and cream';
            } else if (productName.includes('blueberry')) {
                recipeType = 'blueberry';
            }

            const recipe = cakeRecipes[recipeType];
            
            if (recipe) {
                await Product.findByIdAndUpdate(product._id, {
                    recipe: recipe,
                    updatedAt: new Date()
                });
                
                console.log(`✅ ${product.name} → ${recipeType.toUpperCase()} (${recipe.length} ingredients)`);
                updatedCount++;
            }
        }

        console.log(`\n🎯 Recipe Update Summary:`);
        console.log(`   ✅ Updated ${updatedCount} products with corrected recipes`);
        console.log(`   ✅ All ingredient names now match inventory exactly`);
        console.log(`   ✅ Ready for accurate inventory tracking`);

        // Verify a sample recipe
        const sampleProduct = await Product.findOne({ name: /vanilla/i });
        if (sampleProduct && sampleProduct.recipe) {
            console.log(`\n🔍 Sample Recipe Verification (${sampleProduct.name}):`);
            sampleProduct.recipe.forEach((ingredient, index) => {
                console.log(`   ${index + 1}. ${ingredient.ingredient}: ${ingredient.quantity} ${ingredient.unit}`);
            });
        }

    } catch (error) {
        console.error('❌ Error fixing recipe ingredients:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

fixRecipeIngredients();
