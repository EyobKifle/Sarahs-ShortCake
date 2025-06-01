// Recipe mapping for all 17 cupcake types
// Maps product names to their required ingredients and quantities

const recipeMapping = {
    'Vanilla Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 }, // 1 cup = 0.125 kg
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 }, // 1 cup = 0.2 kg
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 }, // 1 tsp = 0.004 kg
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 }, // 1 tsp = 0.006 kg
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 }, // 1 tbsp = 0.014 kg
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 }, // 1 dozen = 12 pieces
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 }, // 1 cup = 0.24 L
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 }, // 1 tsp = 0.005 L
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 }, // 1 cup = 0.12 kg
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Chocolate Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.4, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Cocoa powder (unsweetened)', quantity: 0.1, unit: 'cups', conversionFactor: 0.086 }, // 1 cup = 0.086 kg
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Red Velvet Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Cocoa powder (unsweetened)', quantity: 1, unit: 'tbsp', conversionFactor: 0.0054 }, // 1 tbsp = 0.0054 kg
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking soda', quantity: 0.25, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Vegetable oil', quantity: 2, unit: 'tbsp', conversionFactor: 0.015 }, // 1 tbsp = 0.015 L
            { name: 'Buttermilk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Food coloring (gel)', quantity: 0.5, unit: 'tsp', conversionFactor: 1 }, // pieces
            { name: 'Cream cheese', quantity: 2, unit: 'oz', conversionFactor: 0.057 }, // 1 oz = 0.057 kg
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'French Vanilla Cupcake': {
        ingredients: [
            { name: 'Cake flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.114 }, // 1 cup = 0.114 kg
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Egg whites', quantity: 1, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Heavy cream', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.75, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'White Chocolate Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'White chocolate', quantity: 1, unit: 'oz', conversionFactor: 0.028 }, // 1 oz = 0.028 kg
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Cream cheese', quantity: 2, unit: 'oz', conversionFactor: 0.057 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Double Chocolate Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.4, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Cocoa powder (unsweetened)', quantity: 0.1, unit: 'cups', conversionFactor: 0.086 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Dark chocolate', quantity: 1, unit: 'oz', conversionFactor: 0.028 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Oreo cookies (crushed)', quantity: 1, unit: 'tbsp', conversionFactor: 0.008 }, // 1 tbsp = 0.008 kg
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Strawberry Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Fresh strawberries', quantity: 0.25, unit: 'cups', conversionFactor: 0.15 }, // 1 cup = 0.15 kg
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Strawberry jam', quantity: 1, unit: 'tbsp', conversionFactor: 0.02 }, // 1 tbsp = 0.02 kg
            { name: 'Peanut butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.032 }, // 1 tbsp = 0.032 kg
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Peanut Butter Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Brown sugar (light)', quantity: 0.33, unit: 'cups', conversionFactor: 0.213 }, // 1 cup = 0.213 kg
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Peanut butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.032 },
            { name: 'Unsalted butter', quantity: 1, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Oreo cookies (crushed)', quantity: 2, unit: 'tbsp', conversionFactor: 0.008 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Blueberry Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Fresh blueberries', quantity: 0.25, unit: 'cups', conversionFactor: 0.148 }, // 1 cup = 0.148 kg
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Lemon zest', quantity: 0.5, unit: 'tsp', conversionFactor: 0.001 }, // 1 tsp = 0.001 kg
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Pumpkin Spice Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Brown sugar (light)', quantity: 0.33, unit: 'cups', conversionFactor: 0.213 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Heavy cream', quantity: 2, unit: 'tbsp', conversionFactor: 0.03 }, // 1 tbsp = 0.03 L
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Apple Cinnamon Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Brown sugar (light)', quantity: 0.33, unit: 'cups', conversionFactor: 0.213 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Shredded coconut', quantity: 1, unit: 'tbsp', conversionFactor: 0.005 }, // 1 tbsp = 0.005 kg
            { name: 'Chopped pecans', quantity: 1, unit: 'tbsp', conversionFactor: 0.008 }, // 1 tbsp = 0.008 kg
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Cookies and Cream Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Oreo cookies (crushed)', quantity: 2, unit: 'tbsp', conversionFactor: 0.008 },
            { name: 'Espresso powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.001 }, // 1 tsp = 0.001 kg
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Champagne Cupcake': {
        ingredients: [
            { name: 'Cake flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.114 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Heavy cream', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Lemon zest', quantity: 1, unit: 'tsp', conversionFactor: 0.001 },
            { name: 'Lemon extract', quantity: 0.25, unit: 'tsp', conversionFactor: 0.001 }, // 1 tsp = 0.001 L
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Chocolate Cheesecake Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.4, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Cocoa powder (unsweetened)', quantity: 0.1, unit: 'cups', conversionFactor: 0.086 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Cream cheese', quantity: 3, unit: 'oz', conversionFactor: 0.057 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Dark chocolate', quantity: 1, unit: 'oz', conversionFactor: 0.028 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Mississippi Mud Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.4, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Cocoa powder (unsweetened)', quantity: 0.1, unit: 'cups', conversionFactor: 0.086 },
            { name: 'Brown sugar (dark)', quantity: 0.33, unit: 'cups', conversionFactor: 0.213 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Dark chocolate', quantity: 1.5, unit: 'oz', conversionFactor: 0.028 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Coffee (ground)', quantity: 0.5, unit: 'tsp', conversionFactor: 0.001 }, // 1 tsp = 0.001 kg
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Chopped pecans', quantity: 1, unit: 'tbsp', conversionFactor: 0.008 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'Coconut Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.5, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Granulated sugar', quantity: 0.33, unit: 'cups', conversionFactor: 0.2 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Shredded coconut', quantity: 0.25, unit: 'cups', conversionFactor: 0.02 }, // 1 cup = 0.02 kg
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Chopped pecans', quantity: 2, unit: 'tbsp', conversionFactor: 0.008 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    },
    'S\'mores Cupcake': {
        ingredients: [
            { name: 'All-purpose flour', quantity: 0.4, unit: 'cups', conversionFactor: 0.125 },
            { name: 'Brown sugar (light)', quantity: 0.33, unit: 'cups', conversionFactor: 0.213 },
            { name: 'Baking powder', quantity: 0.5, unit: 'tsp', conversionFactor: 0.004 },
            { name: 'Salt', quantity: 0.125, unit: 'tsp', conversionFactor: 0.006 },
            { name: 'Unsalted butter', quantity: 2, unit: 'tbsp', conversionFactor: 0.014 },
            { name: 'Whole eggs', quantity: 0.5, unit: 'pieces', conversionFactor: 0.042 },
            { name: 'Whole milk', quantity: 0.25, unit: 'cups', conversionFactor: 0.24 },
            { name: 'Vanilla extract', quantity: 0.5, unit: 'tsp', conversionFactor: 0.005 },
            { name: 'Milk chocolate', quantity: 1, unit: 'oz', conversionFactor: 0.028 },
            { name: 'Marshmallow fluff', quantity: 2, unit: 'tbsp', conversionFactor: 0.025 }, // 1 tbsp = 0.025 kg
            { name: 'Strawberry jam', quantity: 1, unit: 'tbsp', conversionFactor: 0.02 },
            { name: 'Powdered sugar', quantity: 0.5, unit: 'cups', conversionFactor: 0.12 },
            { name: 'Cupcake liners (standard)', quantity: 1, unit: 'pieces', conversionFactor: 1 }
        ]
    }
};

module.exports = recipeMapping;
