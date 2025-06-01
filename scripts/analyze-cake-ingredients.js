const mongoose = require('mongoose');
const Product = require('../models/Product');

async function analyzeCakeIngredients() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes');
        console.log('✅ Connected to MongoDB');

        // Get all products
        const products = await Product.find();
        console.log(`📦 Found ${products.length} products\n`);

        // Define comprehensive ingredient lists for each cake type
        const cakeRecipes = {
            'vanilla': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                    { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 2, unit: 'tsp' },
                    { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' }
                ]
            },
            'chocolate': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.25, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                    { ingredient: 'Cocoa Powder', quantity: 0.25, unit: 'cup' },
                    { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' }
                ]
            },
            'strawberry': {
                ingredients: [
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
                ]
            },
            'red velvet': {
                ingredients: [
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
                ]
            },
            'lemon': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                    { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Lemon Extract', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Lemon Zest', quantity: 2, unit: 'tbsp' },
                    { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' }
                ]
            },
            'carrot': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 0.75, unit: 'cup' },
                    { ingredient: 'Brown Sugar', quantity: 0.25, unit: 'cup' },
                    { ingredient: 'Vegetable Oil', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Ground Cinnamon', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Baking Powder', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Baking Soda', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Grated Carrots', quantity: 1, unit: 'cup' }
                ]
            },
            'funfetti': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                    { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 2, unit: 'tsp' },
                    { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Rainbow Sprinkles', quantity: 0.25, unit: 'cup' }
                ]
            },
            'cookies and cream': {
                ingredients: [
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
            },
            'black forest': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.25, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                    { ingredient: 'Cocoa Powder', quantity: 0.25, unit: 'cup' },
                    { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Maraschino Cherries', quantity: 0.25, unit: 'cup' }
                ]
            },
            'blueberry': {
                ingredients: [
                    { ingredient: 'All-Purpose Flour', quantity: 1.5, unit: 'cups' },
                    { ingredient: 'Granulated Sugar', quantity: 1, unit: 'cup' },
                    { ingredient: 'Unsalted Butter', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Large Eggs', quantity: 2, unit: 'pieces' },
                    { ingredient: 'Vanilla Extract', quantity: 1, unit: 'tsp' },
                    { ingredient: 'Baking Powder', quantity: 1.5, unit: 'tsp' },
                    { ingredient: 'Salt', quantity: 0.5, unit: 'tsp' },
                    { ingredient: 'Whole Milk', quantity: 0.5, unit: 'cup' },
                    { ingredient: 'Fresh Blueberries', quantity: 0.5, unit: 'cup' }
                ]
            }
        };

        // Analyze each product and assign appropriate recipe
        console.log('🔍 Analyzing products and assigning recipes:\n');
        
        const allIngredients = new Set();
        let updatedCount = 0;

        for (const product of products) {
            const productName = product.name.toLowerCase();
            let assignedRecipe = null;
            let recipeType = 'vanilla'; // default

            // Determine recipe type based on product name
            if (productName.includes('chocolate') && !productName.includes('white')) {
                recipeType = 'chocolate';
            } else if (productName.includes('strawberry')) {
                recipeType = 'strawberry';
            } else if (productName.includes('red velvet')) {
                recipeType = 'red velvet';
            } else if (productName.includes('lemon')) {
                recipeType = 'lemon';
            } else if (productName.includes('carrot')) {
                recipeType = 'carrot';
            } else if (productName.includes('funfetti') || productName.includes('confetti')) {
                recipeType = 'funfetti';
            } else if (productName.includes('cookies') && productName.includes('cream')) {
                recipeType = 'cookies and cream';
            } else if (productName.includes('black forest')) {
                recipeType = 'black forest';
            } else if (productName.includes('blueberry')) {
                recipeType = 'blueberry';
            }

            assignedRecipe = cakeRecipes[recipeType];
            
            console.log(`📝 ${product.name} → ${recipeType.toUpperCase()} recipe`);
            
            // Add ingredients to master list
            if (assignedRecipe) {
                assignedRecipe.ingredients.forEach(ingredient => {
                    allIngredients.add(ingredient.ingredient);
                });
                
                // Update product with recipe
                await Product.findByIdAndUpdate(product._id, {
                    recipe: assignedRecipe.ingredients,
                    updatedAt: new Date()
                });
                updatedCount++;
            }
        }

        console.log(`\n✅ Updated ${updatedCount} products with recipes`);
        console.log(`\n📋 Complete ingredient list needed (${allIngredients.size} ingredients):`);
        
        const sortedIngredients = Array.from(allIngredients).sort();
        sortedIngredients.forEach((ingredient, index) => {
            console.log(`   ${index + 1}. ${ingredient}`);
        });

        console.log('\n🎯 Next Steps:');
        console.log('   1. Update inventory with all these ingredients');
        console.log('   2. Set appropriate quantities and thresholds');
        console.log('   3. Test the complete inventory system');

    } catch (error) {
        console.error('❌ Error analyzing cake ingredients:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

analyzeCakeIngredients();
