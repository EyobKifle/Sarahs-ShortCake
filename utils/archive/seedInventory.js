const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
require('dotenv').config();

// Complete inventory items for all 17 cupcake recipes
const sampleInventoryItems = [
    // Basic Baking Ingredients
    {
        name: 'All-purpose flour',
        description: 'High-quality all-purpose flour for baking',
        category: 'Flour',
        quantity: 50,
        unit: 'kg',
        threshold: 10,
        costPerUnit: 2.50,
        supplier: 'Local Flour Mill',
        location: 'Pantry Shelf A',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 50,
            changeAmount: 50,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Cake flour',
        description: 'Fine cake flour for tender cupcakes',
        category: 'Flour',
        quantity: 20,
        unit: 'kg',
        threshold: 5,
        costPerUnit: 3.20,
        supplier: 'Premium Flour Co.',
        location: 'Pantry Shelf A',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 20,
            changeAmount: 20,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Granulated sugar',
        description: 'White granulated sugar for baking and decoration',
        category: 'Sugar',
        quantity: 30,
        unit: 'kg',
        threshold: 5,
        costPerUnit: 1.80,
        supplier: 'Sugar Co.',
        location: 'Pantry Shelf B',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 30,
            changeAmount: 30,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Brown sugar (light)',
        description: 'Light brown sugar for rich flavor',
        category: 'Sugar',
        quantity: 15,
        unit: 'kg',
        threshold: 3,
        costPerUnit: 2.20,
        supplier: 'Sugar Co.',
        location: 'Pantry Shelf B',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 15,
            changeAmount: 15,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Brown sugar (dark)',
        description: 'Dark brown sugar for deep molasses flavor',
        category: 'Sugar',
        quantity: 10,
        unit: 'kg',
        threshold: 2,
        costPerUnit: 2.40,
        supplier: 'Sugar Co.',
        location: 'Pantry Shelf B',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 10,
            changeAmount: 10,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Powdered sugar',
        description: 'Confectioners sugar for frosting',
        category: 'Sugar',
        quantity: 20,
        unit: 'kg',
        threshold: 4,
        costPerUnit: 2.80,
        supplier: 'Sugar Co.',
        location: 'Pantry Shelf B',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 20,
            changeAmount: 20,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Dairy Products
    {
        name: 'Unsalted butter',
        description: 'Premium unsalted butter for baking',
        category: 'Dairy',
        quantity: 15,
        unit: 'kg',
        threshold: 3,
        costPerUnit: 8.50,
        supplier: 'Dairy Farm Co.',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 15,
            changeAmount: 15,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Cream cheese',
        description: 'Philadelphia cream cheese for frosting',
        category: 'Dairy',
        quantity: 8,
        unit: 'kg',
        threshold: 2,
        costPerUnit: 12.00,
        supplier: 'Dairy Farm Co.',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 8,
            changeAmount: 8,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Heavy cream',
        description: 'Heavy whipping cream for frosting',
        category: 'Dairy',
        quantity: 10,
        unit: 'L',
        threshold: 2,
        costPerUnit: 4.50,
        supplier: 'Dairy Farm Co.',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 10,
            changeAmount: 10,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Whole milk',
        description: 'Fresh whole milk for baking',
        category: 'Dairy',
        quantity: 12,
        unit: 'L',
        threshold: 3,
        costPerUnit: 1.50,
        supplier: 'Dairy Farm Co.',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 12,
            changeAmount: 12,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Buttermilk',
        description: 'Cultured buttermilk for tender cupcakes',
        category: 'Dairy',
        quantity: 5,
        unit: 'L',
        threshold: 1,
        costPerUnit: 2.20,
        supplier: 'Dairy Farm Co.',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 5,
            changeAmount: 5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Eggs
    {
        name: 'Whole eggs',
        description: 'Fresh large whole eggs for baking',
        category: 'Eggs',
        quantity: 10,
        unit: 'dozen',
        threshold: 2,
        costPerUnit: 3.50,
        supplier: 'Local Farm',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 10,
            changeAmount: 10,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Egg whites',
        description: 'Fresh egg whites for light cupcakes',
        category: 'Eggs',
        quantity: 3,
        unit: 'dozen',
        threshold: 1,
        costPerUnit: 4.00,
        supplier: 'Local Farm',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Flavorings and Extracts
    {
        name: 'Vanilla extract',
        description: 'Pure vanilla extract for flavoring',
        category: 'Flavoring',
        quantity: 3,
        unit: 'L',
        threshold: 0.5,
        costPerUnit: 25.00,
        supplier: 'Flavor House',
        location: 'Spice Cabinet',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Lemon extract',
        description: 'Pure lemon extract for citrus flavor',
        category: 'Flavoring',
        quantity: 0.5,
        unit: 'L',
        threshold: 0.1,
        costPerUnit: 30.00,
        supplier: 'Flavor House',
        location: 'Spice Cabinet',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 0.5,
            changeAmount: 0.5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Leavening Agents
    {
        name: 'Baking powder',
        description: 'Double-acting baking powder',
        category: 'Other',
        quantity: 5,
        unit: 'kg',
        threshold: 1,
        costPerUnit: 12.00,
        supplier: 'Baking Supply Co.',
        location: 'Pantry Shelf C',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 5,
            changeAmount: 5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Baking soda',
        description: 'Sodium bicarbonate for leavening',
        category: 'Other',
        quantity: 2,
        unit: 'kg',
        threshold: 0.5,
        costPerUnit: 8.00,
        supplier: 'Baking Supply Co.',
        location: 'Pantry Shelf C',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 2,
            changeAmount: 2,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Salt',
        description: 'Fine table salt for baking',
        category: 'Other',
        quantity: 3,
        unit: 'kg',
        threshold: 0.5,
        costPerUnit: 2.00,
        supplier: 'Local Supplier',
        location: 'Pantry Shelf C',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Chocolates
    {
        name: 'Cocoa powder (unsweetened)',
        description: 'Unsweetened cocoa powder for chocolate cakes',
        category: 'Other',
        quantity: 8,
        unit: 'kg',
        threshold: 2,
        costPerUnit: 15.00,
        supplier: 'Chocolate Co.',
        location: 'Pantry Shelf C',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 8,
            changeAmount: 8,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'White chocolate',
        description: 'Premium white chocolate for baking',
        category: 'Other',
        quantity: 5,
        unit: 'kg',
        threshold: 1,
        costPerUnit: 18.00,
        supplier: 'Chocolate Co.',
        location: 'Cool Storage',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 5,
            changeAmount: 5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Dark chocolate',
        description: 'Premium dark chocolate for rich flavor',
        category: 'Other',
        quantity: 8,
        unit: 'kg',
        threshold: 2,
        costPerUnit: 20.00,
        supplier: 'Chocolate Co.',
        location: 'Cool Storage',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 8,
            changeAmount: 8,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Milk chocolate',
        description: 'Premium milk chocolate for s\'mores cupcakes',
        category: 'Other',
        quantity: 3,
        unit: 'kg',
        threshold: 0.5,
        costPerUnit: 16.00,
        supplier: 'Chocolate Co.',
        location: 'Cool Storage',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Oils and Fats
    {
        name: 'Vegetable oil',
        description: 'Neutral vegetable oil for baking',
        category: 'Other',
        quantity: 5,
        unit: 'L',
        threshold: 1,
        costPerUnit: 4.00,
        supplier: 'Local Supplier',
        location: 'Pantry Shelf D',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 5,
            changeAmount: 5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Fresh Fruits
    {
        name: 'Fresh strawberries',
        description: 'Fresh strawberries for cupcakes',
        category: 'Fresh Fruits',
        quantity: 5,
        unit: 'kg',
        threshold: 1,
        costPerUnit: 8.00,
        supplier: 'Local Farm',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 5,
            changeAmount: 5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Fresh blueberries',
        description: 'Fresh blueberries for cupcakes',
        category: 'Fresh Fruits',
        quantity: 3,
        unit: 'kg',
        threshold: 0.5,
        costPerUnit: 12.00,
        supplier: 'Local Farm',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Lemon zest',
        description: 'Fresh lemon zest for citrus flavor',
        category: 'Fresh Fruits',
        quantity: 0.5,
        unit: 'kg',
        threshold: 0.1,
        costPerUnit: 20.00,
        supplier: 'Local Farm',
        location: 'Refrigerator',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 0.5,
            changeAmount: 0.5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Nuts and Mix-ins
    {
        name: 'Peanut butter',
        description: 'Creamy peanut butter for cupcakes and frosting',
        category: 'Other',
        quantity: 3,
        unit: 'kg',
        threshold: 0.5,
        costPerUnit: 8.00,
        supplier: 'Local Supplier',
        location: 'Pantry Shelf D',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Chopped pecans',
        description: 'Chopped pecans for cupcakes and frosting',
        category: 'Other',
        quantity: 2,
        unit: 'kg',
        threshold: 0.3,
        costPerUnit: 25.00,
        supplier: 'Nut Supplier',
        location: 'Cool Storage',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 2,
            changeAmount: 2,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Shredded coconut',
        description: 'Sweetened shredded coconut',
        category: 'Other',
        quantity: 3,
        unit: 'kg',
        threshold: 0.5,
        costPerUnit: 12.00,
        supplier: 'Tropical Supplier',
        location: 'Pantry Shelf D',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 3,
            changeAmount: 3,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Oreo cookies (crushed)',
        description: 'Crushed Oreo cookies for mix-ins',
        category: 'Other',
        quantity: 5,
        unit: 'kg',
        threshold: 1,
        costPerUnit: 15.00,
        supplier: 'Cookie Supplier',
        location: 'Pantry Shelf D',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 5,
            changeAmount: 5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Jams and Spreads
    {
        name: 'Strawberry jam',
        description: 'Premium strawberry jam for filling',
        category: 'Other',
        quantity: 2,
        unit: 'kg',
        threshold: 0.3,
        costPerUnit: 8.00,
        supplier: 'Local Supplier',
        location: 'Pantry Shelf D',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 2,
            changeAmount: 2,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Marshmallow fluff',
        description: 'Marshmallow fluff for s\'mores cupcakes',
        category: 'Other',
        quantity: 1.5,
        unit: 'kg',
        threshold: 0.2,
        costPerUnit: 12.00,
        supplier: 'Sweet Supplier',
        location: 'Pantry Shelf D',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 1.5,
            changeAmount: 1.5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Coffee and Spices
    {
        name: 'Espresso powder',
        description: 'Instant espresso powder for coffee flavor',
        category: 'Other',
        quantity: 0.5,
        unit: 'kg',
        threshold: 0.1,
        costPerUnit: 35.00,
        supplier: 'Coffee Supplier',
        location: 'Spice Cabinet',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 0.5,
            changeAmount: 0.5,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Coffee (ground)',
        description: 'Ground coffee for Mississippi mud cupcakes',
        category: 'Other',
        quantity: 1,
        unit: 'kg',
        threshold: 0.2,
        costPerUnit: 20.00,
        supplier: 'Coffee Supplier',
        location: 'Spice Cabinet',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 1,
            changeAmount: 1,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    // Decoration and Packaging
    {
        name: 'Food coloring (gel)',
        description: 'Gel food coloring in various colors',
        category: 'Decoration',
        quantity: 50,
        unit: 'pieces',
        threshold: 10,
        costPerUnit: 2.50,
        supplier: 'Decoration Supply',
        location: 'Decoration Cabinet',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 50,
            changeAmount: 50,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Cupcake liners (standard)',
        description: 'Standard cupcake liners for baking',
        category: 'Packaging',
        quantity: 1000,
        unit: 'pieces',
        threshold: 200,
        costPerUnit: 0.05,
        supplier: 'Packaging Solutions',
        location: 'Storage Room',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 1000,
            changeAmount: 1000,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    },
    {
        name: 'Cake boxes',
        description: 'White cake boxes for packaging',
        category: 'Packaging',
        quantity: 200,
        unit: 'pieces',
        threshold: 50,
        costPerUnit: 1.25,
        supplier: 'Packaging Solutions',
        location: 'Storage Room',
        history: [{
            action: 'create',
            previousQuantity: 0,
            newQuantity: 200,
            changeAmount: 200,
            date: new Date(),
            notes: 'Initial inventory setup',
            performedBy: null
        }]
    }
];

async function seedInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-shortcakes');
        console.log('📦 Connected to MongoDB');

        // Clear existing inventory items
        await InventoryItem.deleteMany({});
        console.log('🗑️ Cleared existing inventory items');

        // Insert sample inventory items
        const insertedItems = await InventoryItem.insertMany(sampleInventoryItems);
        console.log(`✅ Successfully seeded ${insertedItems.length} inventory items:`);

        insertedItems.forEach(item => {
            console.log(`   - ${item.name}: ${item.quantity} ${item.unit} (ID: ${item._id})`);
        });

        console.log('\n📊 Inventory Summary:');
        console.log(`   Total Items: ${insertedItems.length}`);
        console.log(`   Total Categories: ${[...new Set(insertedItems.map(item => item.category))].length}`);
        console.log(`   Total Value: $${insertedItems.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0).toFixed(2)}`);

    } catch (error) {
        console.error('❌ Error seeding inventory:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
    seedInventory();
}

module.exports = { seedInventory, sampleInventoryItems };
