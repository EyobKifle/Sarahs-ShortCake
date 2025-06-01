const mongoose = require('mongoose');
const Product = require('../models/Product');

// Cupcake recipes with ingredients from our inventory
const cupcakeRecipes = [
    {
        slug: "vanilla-cupcake",
        name: "Vanilla Cupcake",
        price: 3.99,
        imagePath: "images/menu images/Vanilla cupcake with Vanilla icing.jpg",
        description: "Classic vanilla cupcake with vanilla buttercream frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "chocolate-cupcake",
        name: "Chocolate Cupcake",
        price: 3.99,
        imagePath: "images/menu images/Chocolate cupcake with vanilla icing.jpg",
        description: "Rich chocolate cupcake with vanilla buttercream frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.4, unit: "cups" },
            { ingredient: "Cocoa powder (unsweetened)", quantity: 0.1, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "red-velvet-cupcake",
        name: "Red Velvet Cupcake",
        price: 4.49,
        imagePath: "images/menu images/Red Velvet cak.jpg",
        description: "Classic red velvet cupcake with cream cheese frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Cocoa powder (unsweetened)", quantity: 1, unit: "tbsp" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking soda", quantity: 0.25, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Vegetable oil", quantity: 2, unit: "tbsp" },
            { ingredient: "Buttermilk", quantity: 0.25, unit: "cups" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Food coloring (gel)", quantity: 0.5, unit: "tsp" },
            { ingredient: "Cream cheese", quantity: 2, unit: "oz" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "french-vanilla-cupcake",
        name: "French Vanilla Cupcake",
        price: 4.49,
        imagePath: "images/menu images/French Vanilla cupcake with vanilla icing.jpg",
        description: "Delicate French vanilla cupcake with vanilla buttercream",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "Cake flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Egg whites", quantity: 1, unit: "pieces" },
            { ingredient: "Heavy cream", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.75, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "white-chocolate-cupcake",
        name: "White Chocolate Cupcake",
        price: 4.99,
        imagePath: "images/menu images/White chocolate with cream cheese.jpg",
        description: "White chocolate cupcake with cream cheese frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "White chocolate", quantity: 1, unit: "oz" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Cream cheese", quantity: 2, unit: "oz" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "double-chocolate-cupcake",
        name: "Double Chocolate Cupcake",
        price: 4.99,
        imagePath: "images/menu images/double chocolate with coocie crumbs.jpg",
        description: "Rich chocolate cupcake with chocolate frosting and cookie crumbs",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.4, unit: "cups" },
            { ingredient: "Cocoa powder (unsweetened)", quantity: 0.1, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Dark chocolate", quantity: 1, unit: "oz" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Oreo cookies (crushed)", quantity: 1, unit: "tbsp" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "strawberry-cupcake",
        name: "Strawberry Cupcake",
        price: 4.99,
        imagePath: "images/menu images/strawberry cupcake with peanut icing.jpg",
        description: "Fresh strawberry cupcake with peanut butter frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Fresh strawberries", quantity: 0.25, unit: "cups" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Strawberry jam", quantity: 1, unit: "tbsp" },
            { ingredient: "Peanut butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "peanut-butter-cupcake",
        name: "Peanut Butter Cupcake",
        price: 4.99,
        imagePath: "images/menu images/peanut butter cupcake with oreo icing.jpg",
        description: "Peanut butter cupcake with Oreo frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Brown sugar (light)", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Peanut butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Unsalted butter", quantity: 1, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Oreo cookies (crushed)", quantity: 2, unit: "tbsp" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "blueberry-cupcake",
        name: "Blueberry Cupcake",
        price: 4.99,
        imagePath: "images/menu images/blueberry cupcake with mint icing.jpg",
        description: "Fresh blueberry cupcake with mint frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Fresh blueberries", quantity: 0.25, unit: "cups" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Lemon zest", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "pumpkin-spice-cupcake",
        name: "Pumpkin Spice Cupcake",
        price: 4.99,
        imagePath: "images/menu images/pumpkin spice with champagne icing.jpg",
        description: "Seasonal pumpkin spice cupcake with champagne frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Brown sugar (light)", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Heavy cream", quantity: 2, unit: "tbsp" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "apple-cinnamon-cupcake",
        name: "Apple Cinnamon Cupcake",
        price: 4.99,
        imagePath: "images/menu images/apple cinammon cupcake with german cocolate icing.jpg",
        description: "Apple cinnamon cupcake with German chocolate frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Brown sugar (light)", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Shredded coconut", quantity: 1, unit: "tbsp" },
            { ingredient: "Chopped pecans", quantity: 1, unit: "tbsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "cookies-cream-cupcake",
        name: "Cookies and Cream Cupcake",
        price: 4.99,
        imagePath: "images/menu images/cookies and cream cupcake with  espresso icing.jpg",
        description: "Cookies and cream cupcake with espresso frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Oreo cookies (crushed)", quantity: 2, unit: "tbsp" },
            { ingredient: "Espresso powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "champagne-cupcake",
        name: "Champagne Cupcake",
        price: 5.49,
        imagePath: "images/menu images/champagne cupcake with lemon icing.jpg",
        description: "Elegant champagne cupcake with lemon frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "Cake flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Heavy cream", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Lemon zest", quantity: 1, unit: "tsp" },
            { ingredient: "Lemon extract", quantity: 0.25, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "chocolate-cheesecake-cupcake",
        name: "Chocolate Cheesecake Cupcake",
        price: 5.99,
        imagePath: "images/menu images/Chocolate cheesecake with maple bacon.jpg",
        description: "Chocolate cheesecake cupcake with maple bacon frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.4, unit: "cups" },
            { ingredient: "Cocoa powder (unsweetened)", quantity: 0.1, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Cream cheese", quantity: 3, unit: "oz" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Dark chocolate", quantity: 1, unit: "oz" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "mississippi-mud-cupcake",
        name: "Mississippi Mud Cupcake",
        price: 5.99,
        imagePath: "images/menu images/missipi mud cake with dark choclate icing.jpg",
        description: "Rich chocolate cupcake with dark chocolate frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.4, unit: "cups" },
            { ingredient: "Cocoa powder (unsweetened)", quantity: 0.1, unit: "cups" },
            { ingredient: "Brown sugar (dark)", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Dark chocolate", quantity: 1.5, unit: "oz" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Coffee (ground)", quantity: 0.5, unit: "tsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Chopped pecans", quantity: 1, unit: "tbsp" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "coconut-cupcake",
        name: "Coconut Cupcake",
        price: 4.99,
        imagePath: "images/menu images/cocunut cupcake with coconut pecan icing.jpg",
        description: "Tropical coconut cupcake with coconut pecan frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.5, unit: "cups" },
            { ingredient: "Granulated sugar", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Shredded coconut", quantity: 0.25, unit: "cups" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Chopped pecans", quantity: 2, unit: "tbsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    },
    {
        slug: "smores-cupcake",
        name: "S'mores Cupcake",
        price: 5.49,
        imagePath: "images/menu images/smores cupcake strawberry icing.jpg",
        description: "Graham cracker cupcake with strawberry frosting",
        category: "cupcake",
        isActive: true,
        recipe: [
            { ingredient: "All-purpose flour", quantity: 0.4, unit: "cups" },
            { ingredient: "Brown sugar (light)", quantity: 0.33, unit: "cups" },
            { ingredient: "Baking powder", quantity: 0.5, unit: "tsp" },
            { ingredient: "Salt", quantity: 0.125, unit: "tsp" },
            { ingredient: "Unsalted butter", quantity: 2, unit: "tbsp" },
            { ingredient: "Whole eggs", quantity: 0.5, unit: "pieces" },
            { ingredient: "Whole milk", quantity: 0.25, unit: "cups" },
            { ingredient: "Vanilla extract", quantity: 0.5, unit: "tsp" },
            { ingredient: "Milk chocolate", quantity: 1, unit: "oz" },
            { ingredient: "Marshmallow fluff", quantity: 2, unit: "tbsp" },
            { ingredient: "Strawberry jam", quantity: 1, unit: "tbsp" },
            { ingredient: "Powdered sugar", quantity: 0.5, unit: "cups" },
            { ingredient: "Cupcake liners (standard)", quantity: 1, unit: "pieces" }
        ]
    }
];

async function populateProductsWithRecipes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sarahs-short-cakes');
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert products with recipes
        const result = await Product.insertMany(cupcakeRecipes);
        console.log(`Successfully added ${result.length} products with recipes`);

        // Display summary
        console.log('\nProducts with Recipes Summary:');
        for (const product of cupcakeRecipes) {
            console.log(`- ${product.name}: ${product.recipe.length} ingredients`);
        }

        console.log('\nProduct population with recipes completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error populating products with recipes:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    populateProductsWithRecipes();
}

module.exports = { cupcakeRecipes, populateProductsWithRecipes };
