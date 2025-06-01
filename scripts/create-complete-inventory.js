const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');

async function createCompleteInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/sarahs_shortcakes');
        console.log('✅ Connected to MongoDB');

        // Clear existing inventory
        await InventoryItem.deleteMany({});
        console.log('🗑️ Cleared existing inventory');

        // Complete inventory with all 17 required ingredients
        const completeInventory = [
            // Basic Baking Ingredients
            {
                name: 'All-Purpose Flour',
                description: 'High-quality all-purpose flour for baking',
                category: 'Baking Ingredients',
                quantity: 100,
                unit: 'lbs',
                threshold: 20,
                supplier: 'Local Bakery Supply',
                costPerUnit: 2.50
            },
            {
                name: 'Granulated Sugar',
                description: 'White granulated sugar',
                category: 'Baking Ingredients',
                quantity: 50,
                unit: 'lbs',
                threshold: 10,
                supplier: 'Sweet Supply Co',
                costPerUnit: 1.80
            },
            {
                name: 'Unsalted Butter',
                description: 'Premium unsalted butter for baking',
                category: 'Dairy',
                quantity: 30,
                unit: 'lbs',
                threshold: 5,
                supplier: 'Dairy Fresh',
                costPerUnit: 8.50
            },
            {
                name: 'Large Eggs',
                description: 'Fresh large eggs',
                category: 'Dairy',
                quantity: 240,
                unit: 'pieces',
                threshold: 48,
                supplier: 'Farm Fresh Eggs',
                costPerUnit: 0.25
            },
            {
                name: 'Vanilla Extract',
                description: 'Pure vanilla extract',
                category: 'Flavorings',
                quantity: 32,
                unit: 'oz',
                threshold: 8,
                supplier: 'Flavor Masters',
                costPerUnit: 2.50
            },
            {
                name: 'Whole Milk',
                description: 'Fresh whole milk',
                category: 'Dairy',
                quantity: 20,
                unit: 'quarts',
                threshold: 4,
                supplier: 'Dairy Fresh',
                costPerUnit: 3.50
            },
            {
                name: 'Salt',
                description: 'Fine table salt',
                category: 'Baking Ingredients',
                quantity: 10,
                unit: 'lbs',
                threshold: 2,
                supplier: 'Baking Essentials',
                costPerUnit: 1.50
            },

            // Leavening Agents
            {
                name: 'Baking Powder',
                description: 'Double-acting baking powder',
                category: 'Leavening Agents',
                quantity: 5,
                unit: 'lbs',
                threshold: 1,
                supplier: 'Baking Essentials',
                costPerUnit: 6.50
            },
            {
                name: 'Baking Soda',
                description: 'Pure baking soda',
                category: 'Leavening Agents',
                quantity: 3,
                unit: 'lbs',
                threshold: 0.5,
                supplier: 'Baking Essentials',
                costPerUnit: 4.00
            },

            // Chocolate & Cocoa
            {
                name: 'Cocoa Powder',
                description: 'Unsweetened cocoa powder',
                category: 'Chocolate',
                quantity: 15,
                unit: 'lbs',
                threshold: 3,
                supplier: 'Chocolate Supply Co',
                costPerUnit: 12.00
            },

            // Fruits & Berries
            {
                name: 'Fresh Strawberries',
                description: 'Fresh strawberries for decoration and flavoring',
                category: 'Fruits',
                quantity: 10,
                unit: 'lbs',
                threshold: 2,
                supplier: 'Fresh Fruit Market',
                costPerUnit: 8.00
            },
            {
                name: 'Fresh Blueberries',
                description: 'Fresh blueberries for cupcakes',
                category: 'Fruits',
                quantity: 8,
                unit: 'lbs',
                threshold: 2,
                supplier: 'Fresh Fruit Market',
                costPerUnit: 12.00
            },

            // Specialty Ingredients
            {
                name: 'Strawberry Extract',
                description: 'Natural strawberry extract',
                category: 'Flavorings',
                quantity: 16,
                unit: 'oz',
                threshold: 4,
                supplier: 'Flavor Masters',
                costPerUnit: 4.50
            },
            {
                name: 'Red Food Coloring',
                description: 'Red food coloring for red velvet',
                category: 'Food Coloring',
                quantity: 20,
                unit: 'bottles',
                threshold: 5,
                supplier: 'Cake Decorating Plus',
                costPerUnit: 3.50
            },
            {
                name: 'Buttermilk',
                description: 'Fresh buttermilk for red velvet cupcakes',
                category: 'Dairy',
                quantity: 12,
                unit: 'quarts',
                threshold: 3,
                supplier: 'Dairy Fresh',
                costPerUnit: 4.00
            },
            {
                name: 'White Vinegar',
                description: 'White vinegar for red velvet cupcakes',
                category: 'Baking Ingredients',
                quantity: 5,
                unit: 'bottles',
                threshold: 1,
                supplier: 'General Supply',
                costPerUnit: 2.00
            },
            {
                name: 'Crushed Oreo Cookies',
                description: 'Crushed Oreo cookies for cookies and cream cupcakes',
                category: 'Mix-ins',
                quantity: 20,
                unit: 'lbs',
                threshold: 4,
                supplier: 'Cookie Supply Co',
                costPerUnit: 6.00
            }
        ];

        // Insert all inventory items
        const createdItems = await InventoryItem.insertMany(completeInventory);
        console.log(`✅ Created ${createdItems.length} inventory items`);

        // Display summary by category
        const categories = {};
        createdItems.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        console.log('\n📊 Inventory Summary by Category:');
        Object.keys(categories).forEach(category => {
            console.log(`\n   ${category}:`);
            categories[category].forEach(item => {
                console.log(`     • ${item.name}: ${item.quantity} ${item.unit} (threshold: ${item.threshold})`);
            });
        });

        // Calculate total inventory value
        const totalValue = createdItems.reduce((sum, item) => 
            sum + (item.quantity * item.costPerUnit), 0
        );

        console.log('\n💰 Inventory Financial Summary:');
        console.log(`   Total Items: ${createdItems.length}`);
        console.log(`   Total Value: $${totalValue.toFixed(2)}`);
        console.log(`   Average Cost per Item: $${(totalValue / createdItems.length).toFixed(2)}`);

        console.log('\n🎯 Inventory Status:');
        console.log('   ✅ All 17 required ingredients added');
        console.log('   ✅ Appropriate quantities set for production');
        console.log('   ✅ Low stock thresholds configured');
        console.log('   ✅ Supplier information included');
        console.log('   ✅ Cost tracking enabled');

        console.log('\n🔄 Ready for Recipe Testing:');
        console.log('   • All cake recipes can now be properly tracked');
        console.log('   • Inventory will update automatically on order confirmation');
        console.log('   • Low stock warnings will trigger when thresholds are reached');

    } catch (error) {
        console.error('❌ Error creating complete inventory:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

createCompleteInventory();
