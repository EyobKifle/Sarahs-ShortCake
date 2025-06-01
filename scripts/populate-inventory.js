const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');

// Comprehensive bakery ingredients for cupcakes
const bakeryIngredients = [
    // Basic Dry Ingredients
    {
        name: 'All-purpose flour',
        category: 'Dry Ingredients',
        description: 'Versatile flour for most baking needs',
        quantity: 50,
        unit: 'lbs',
        threshold: 10,
        costPerUnit: 0.75,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Cake flour',
        category: 'Dry Ingredients',
        description: 'Fine flour for tender, soft cupcakes',
        quantity: 25,
        unit: 'lbs',
        threshold: 5,
        costPerUnit: 1.20,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Granulated sugar',
        category: 'Dry Ingredients',
        description: 'White granulated sugar for sweetening',
        quantity: 40,
        unit: 'lbs',
        threshold: 8,
        costPerUnit: 0.60,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Brown sugar (light)',
        category: 'Dry Ingredients',
        description: 'Light brown sugar for rich flavor',
        quantity: 20,
        unit: 'lbs',
        threshold: 4,
        costPerUnit: 0.80,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Brown sugar (dark)',
        category: 'Dry Ingredients',
        description: 'Dark brown sugar for deeper molasses flavor',
        quantity: 15,
        unit: 'lbs',
        threshold: 3,
        costPerUnit: 0.85,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Baking powder',
        category: 'Dry Ingredients',
        description: 'Double-acting baking powder for leavening',
        quantity: 5,
        unit: 'lbs',
        threshold: 1,
        costPerUnit: 3.50,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Baking soda',
        category: 'Dry Ingredients',
        description: 'Sodium bicarbonate for leavening',
        quantity: 3,
        unit: 'lbs',
        threshold: 0.5,
        costPerUnit: 2.00,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Salt',
        category: 'Dry Ingredients',
        description: 'Fine table salt for flavor enhancement',
        quantity: 10,
        unit: 'lbs',
        threshold: 2,
        costPerUnit: 0.50,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Cocoa powder (unsweetened)',
        category: 'Dry Ingredients',
        description: 'Dutch-processed cocoa powder for chocolate cupcakes',
        quantity: 8,
        unit: 'lbs',
        threshold: 2,
        costPerUnit: 4.50,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },

    // Wet Ingredients
    {
        name: 'Whole eggs',
        category: 'Wet Ingredients',
        description: 'Fresh large eggs for binding and structure',
        quantity: 30,
        unit: 'dozen',
        threshold: 6,
        costPerUnit: 3.50,
        location: 'Refrigerator',
        supplier: 'Local Farm Supply'
    },
    {
        name: 'Egg whites',
        category: 'Wet Ingredients',
        description: 'Separated egg whites for light textures',
        quantity: 2,
        unit: 'quarts',
        threshold: 0.5,
        costPerUnit: 8.00,
        location: 'Refrigerator',
        supplier: 'Local Farm Supply'
    },
    {
        name: 'Whole milk',
        category: 'Wet Ingredients',
        description: 'Fresh whole milk for moisture',
        quantity: 10,
        unit: 'gallons',
        threshold: 2,
        costPerUnit: 4.50,
        location: 'Refrigerator',
        supplier: 'Local Dairy'
    },
    {
        name: 'Buttermilk',
        category: 'Wet Ingredients',
        description: 'Cultured buttermilk for tangy flavor',
        quantity: 4,
        unit: 'quarts',
        threshold: 1,
        costPerUnit: 3.25,
        location: 'Refrigerator',
        supplier: 'Local Dairy'
    },
    {
        name: 'Heavy cream',
        category: 'Wet Ingredients',
        description: 'Heavy whipping cream for rich frostings',
        quantity: 6,
        unit: 'quarts',
        threshold: 1,
        costPerUnit: 5.50,
        location: 'Refrigerator',
        supplier: 'Local Dairy'
    },
    {
        name: 'Vegetable oil',
        category: 'Wet Ingredients',
        description: 'Neutral vegetable oil for moist cupcakes',
        quantity: 5,
        unit: 'gallons',
        threshold: 1,
        costPerUnit: 12.00,
        location: 'Pantry B',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Unsalted butter',
        category: 'Wet Ingredients',
        description: 'Premium unsalted butter for flavor',
        quantity: 20,
        unit: 'lbs',
        threshold: 4,
        costPerUnit: 4.25,
        location: 'Refrigerator',
        supplier: 'Local Dairy'
    },
    {
        name: 'Vanilla extract',
        category: 'Wet Ingredients',
        description: 'Pure vanilla extract for flavoring',
        quantity: 2,
        unit: 'liters',
        threshold: 0.5,
        costPerUnit: 25.00,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },
    {
        name: 'Almond extract',
        category: 'Wet Ingredients',
        description: 'Pure almond extract for flavoring',
        quantity: 0.5,
        unit: 'liters',
        threshold: 0.1,
        costPerUnit: 35.00,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },
    {
        name: 'Lemon extract',
        category: 'Wet Ingredients',
        description: 'Pure lemon extract for citrus flavor',
        quantity: 0.5,
        unit: 'liters',
        threshold: 0.1,
        costPerUnit: 30.00,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },

    // Frosting and Filling Essentials
    {
        name: 'Powdered sugar',
        category: 'Frosting Ingredients',
        description: 'Confectioners sugar for smooth frostings',
        quantity: 25,
        unit: 'lbs',
        threshold: 5,
        costPerUnit: 1.20,
        location: 'Pantry A',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Cream cheese',
        category: 'Frosting Ingredients',
        description: 'Full-fat cream cheese for rich frostings',
        quantity: 15,
        unit: 'lbs',
        threshold: 3,
        costPerUnit: 3.50,
        location: 'Refrigerator',
        supplier: 'Local Dairy'
    },
    {
        name: 'Marshmallow fluff',
        category: 'Frosting Ingredients',
        description: 'Marshmallow creme for fluffy frostings',
        quantity: 12,
        unit: 'jars',
        threshold: 2,
        costPerUnit: 4.50,
        location: 'Pantry B',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Dark chocolate',
        category: 'Frosting Ingredients',
        description: 'High-quality dark chocolate for ganache',
        quantity: 10,
        unit: 'lbs',
        threshold: 2,
        costPerUnit: 8.50,
        location: 'Pantry B',
        supplier: 'Chocolate Specialty Co'
    },
    {
        name: 'Milk chocolate',
        category: 'Frosting Ingredients',
        description: 'Premium milk chocolate for sweet frostings',
        quantity: 8,
        unit: 'lbs',
        threshold: 2,
        costPerUnit: 7.50,
        location: 'Pantry B',
        supplier: 'Chocolate Specialty Co'
    },
    {
        name: 'White chocolate',
        category: 'Frosting Ingredients',
        description: 'Quality white chocolate for elegant frostings',
        quantity: 6,
        unit: 'lbs',
        threshold: 1,
        costPerUnit: 9.00,
        location: 'Pantry B',
        supplier: 'Chocolate Specialty Co'
    },
    {
        name: 'Peanut butter',
        category: 'Frosting Ingredients',
        description: 'Smooth peanut butter for PB frostings',
        quantity: 8,
        unit: 'jars',
        threshold: 2,
        costPerUnit: 6.50,
        location: 'Pantry B',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Strawberry jam',
        category: 'Frosting Ingredients',
        description: 'Premium strawberry preserves for fillings',
        quantity: 6,
        unit: 'jars',
        threshold: 1,
        costPerUnit: 5.50,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },
    {
        name: 'Raspberry jam',
        category: 'Frosting Ingredients',
        description: 'Premium raspberry preserves for fillings',
        quantity: 4,
        unit: 'jars',
        threshold: 1,
        costPerUnit: 6.00,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },

    // Flavor & Texture Add-ins
    {
        name: 'Food coloring (gel)',
        category: 'Add-ins',
        description: 'Concentrated gel food coloring set',
        quantity: 3,
        unit: 'sets',
        threshold: 1,
        costPerUnit: 15.00,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },
    {
        name: 'Rainbow sprinkles',
        category: 'Add-ins',
        description: 'Colorful rainbow sprinkles for decoration',
        quantity: 20,
        unit: 'containers',
        threshold: 4,
        costPerUnit: 3.50,
        location: 'Pantry B',
        supplier: 'Decoration Supply Co'
    },
    {
        name: 'Chocolate sprinkles',
        category: 'Add-ins',
        description: 'Chocolate jimmies for decoration',
        quantity: 15,
        unit: 'containers',
        threshold: 3,
        costPerUnit: 3.75,
        location: 'Pantry B',
        supplier: 'Decoration Supply Co'
    },
    {
        name: 'Chopped walnuts',
        category: 'Add-ins',
        description: 'Fresh chopped walnuts for texture',
        quantity: 5,
        unit: 'lbs',
        threshold: 1,
        costPerUnit: 12.00,
        location: 'Freezer',
        supplier: 'Nut Specialty Co'
    },
    {
        name: 'Chopped pecans',
        category: 'Add-ins',
        description: 'Fresh chopped pecans for Southern flavors',
        quantity: 4,
        unit: 'lbs',
        threshold: 1,
        costPerUnit: 15.00,
        location: 'Freezer',
        supplier: 'Nut Specialty Co'
    },
    {
        name: 'Sliced almonds',
        category: 'Add-ins',
        description: 'Blanched sliced almonds for decoration',
        quantity: 3,
        unit: 'lbs',
        threshold: 0.5,
        costPerUnit: 10.00,
        location: 'Freezer',
        supplier: 'Nut Specialty Co'
    },
    {
        name: 'Shredded coconut',
        category: 'Add-ins',
        description: 'Sweetened shredded coconut',
        quantity: 8,
        unit: 'bags',
        threshold: 2,
        costPerUnit: 4.50,
        location: 'Pantry B',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Oreo cookies (crushed)',
        category: 'Add-ins',
        description: 'Crushed Oreo cookies for mix-ins',
        quantity: 10,
        unit: 'bags',
        threshold: 2,
        costPerUnit: 5.50,
        location: 'Pantry B',
        supplier: 'Wholesale Bakery Supply'
    },
    {
        name: 'Fresh blueberries',
        category: 'Add-ins',
        description: 'Fresh blueberries for fruit cupcakes',
        quantity: 6,
        unit: 'pints',
        threshold: 1,
        costPerUnit: 4.50,
        location: 'Refrigerator',
        supplier: 'Local Fruit Market'
    },
    {
        name: 'Fresh strawberries',
        category: 'Add-ins',
        description: 'Fresh strawberries for fruit cupcakes',
        quantity: 4,
        unit: 'lbs',
        threshold: 1,
        costPerUnit: 5.50,
        location: 'Refrigerator',
        supplier: 'Local Fruit Market'
    },
    {
        name: 'Dried cranberries',
        category: 'Add-ins',
        description: 'Sweetened dried cranberries',
        quantity: 3,
        unit: 'lbs',
        threshold: 0.5,
        costPerUnit: 8.00,
        location: 'Pantry B',
        supplier: 'Specialty Ingredients Co'
    },
    {
        name: 'Coffee (ground)',
        category: 'Add-ins',
        description: 'Finely ground coffee for mocha flavors',
        quantity: 2,
        unit: 'lbs',
        threshold: 0.5,
        costPerUnit: 12.00,
        location: 'Pantry B',
        supplier: 'Coffee Roasters Co'
    },
    {
        name: 'Espresso powder',
        category: 'Add-ins',
        description: 'Instant espresso powder for intense coffee flavor',
        quantity: 1,
        unit: 'lbs',
        threshold: 0.2,
        costPerUnit: 25.00,
        location: 'Pantry B',
        supplier: 'Coffee Roasters Co'
    },
    {
        name: 'Lemon zest',
        category: 'Add-ins',
        description: 'Fresh lemon zest for citrus flavor',
        quantity: 20,
        unit: 'lemons',
        threshold: 4,
        costPerUnit: 0.75,
        location: 'Refrigerator',
        supplier: 'Local Fruit Market'
    },
    {
        name: 'Orange zest',
        category: 'Add-ins',
        description: 'Fresh orange zest for citrus flavor',
        quantity: 15,
        unit: 'oranges',
        threshold: 3,
        costPerUnit: 0.85,
        location: 'Refrigerator',
        supplier: 'Local Fruit Market'
    },

    // Other Essentials
    {
        name: 'Cupcake liners (standard)',
        category: 'Packaging',
        description: 'Standard size paper cupcake liners',
        quantity: 5000,
        unit: 'pieces',
        threshold: 1000,
        costPerUnit: 0.02,
        location: 'Storage Room',
        supplier: 'Packaging Supply Co'
    },
    {
        name: 'Cupcake liners (mini)',
        category: 'Packaging',
        description: 'Mini size paper cupcake liners',
        quantity: 2000,
        unit: 'pieces',
        threshold: 500,
        costPerUnit: 0.015,
        location: 'Storage Room',
        supplier: 'Packaging Supply Co'
    },
    {
        name: 'Cupcake boxes (6-count)',
        category: 'Packaging',
        description: 'Cardboard boxes for 6 cupcakes',
        quantity: 200,
        unit: 'boxes',
        threshold: 50,
        costPerUnit: 1.25,
        location: 'Storage Room',
        supplier: 'Packaging Supply Co'
    },
    {
        name: 'Cupcake boxes (12-count)',
        category: 'Packaging',
        description: 'Cardboard boxes for 12 cupcakes',
        quantity: 150,
        unit: 'boxes',
        threshold: 30,
        costPerUnit: 2.00,
        location: 'Storage Room',
        supplier: 'Packaging Supply Co'
    }
];

async function populateInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-short-cakes');
        console.log('Connected to MongoDB');

        // Clear existing inventory
        await InventoryItem.deleteMany({});
        console.log('Cleared existing inventory');

        // Insert new ingredients
        const result = await InventoryItem.insertMany(bakeryIngredients);
        console.log(`Successfully added ${result.length} inventory items`);

        // Display summary
        const categories = [...new Set(bakeryIngredients.map(item => item.category))];
        console.log('\nInventory Summary:');
        for (const category of categories) {
            const categoryItems = bakeryIngredients.filter(item => item.category === category);
            console.log(`- ${category}: ${categoryItems.length} items`);
        }

        console.log('\nInventory population completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error populating inventory:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    populateInventory();
}

module.exports = { bakeryIngredients, populateInventory };
