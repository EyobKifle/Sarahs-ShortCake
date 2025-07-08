const mongoose = require('mongoose');
const connectDB = require('./db');
const Product = require('../models/Product');

const productsData = [
  {
    slug: "vanilla",
    name: "Vanilla Cupcake",
    price: 3.99,
    description: "Classic vanilla cupcake with vanilla buttercream frosting",
    imagePath: "menu images/Vanilla cupcake with Vanilla icing.jpg",
    category: "cupcake"
  },
  {
    slug: "chocolate",
    name: "Chocolate Cupcake",
    price: 3.99,
    description: "Rich chocolate cupcake with vanilla buttercream frosting",
    imagePath: "menu images/Chocolate cupcake with vanilla icing.jpg",
    category: "cupcake"
  },
  {
    slug: "red-velvet",
    name: "Red Velvet Cupcake",
    price: 4.49,
    description: "Classic red velvet cupcake with cream cheese frosting",
    imagePath: "menu images/Red Velvet cak.jpg",
    category: "cupcake"
  },
  {
    slug: "french-vanilla",
    name: "French Vanilla Cupcake",
    price: 4.49,
    description: "Delicate French vanilla cupcake with vanilla buttercream",
    imagePath: "menu images/French Vanilla cupcake with vanilla icing.jpg",
    category: "cupcake"
  },
  {
    slug: "white-chocolate",
    name: "White Chocolate Cupcake",
    price: 4.99,
    description: "White chocolate cupcake with cream cheese frosting",
    imagePath: "menu images/White chocolate with cream cheese.jpg",
    category: "cupcake"
  },
  {
    slug: "double-chocolate",
    name: "Double Chocolate Cupcake",
    price: 4.99,
    description: "Rich chocolate cupcake with chocolate frosting and cookie crumbs",
    imagePath: "menu images/double chocolate with coocie crumbs.jpg",
    category: "cupcake"
  },
  {
    slug: "strawberry",
    name: "Strawberry Cupcake",
    price: 4.99,
    description: "Fresh strawberry cupcake with peanut butter frosting",
    imagePath: "menu images/strawberry cupcake with peanut icing.jpg",
    category: "cupcake"
  },
  {
    slug: "peanut-butter",
    name: "Peanut Butter Cupcake",
    price: 4.99,
    description: "Peanut butter cupcake with Oreo frosting",
    imagePath: "menu images/peanut butter cupcake with oreo icing.jpg",
    category: "cupcake"
  },
  {
    slug: "blueberry",
    name: "Blueberry Cupcake",
    price: 4.99,
    description: "Fresh blueberry cupcake with mint frosting",
    imagePath: "menu images/blueberry cupcake with mint icing.jpg",
    category: "cupcake"
  },
  {
    slug: "pumpkin-spice",
    name: "Pumpkin Spice Cupcake",
    price: 4.99,
    description: "Seasonal pumpkin spice cupcake with champagne frosting",
    imagePath: "menu images/pumpkin spice with champagne icing.jpg",
    category: "cupcake"
  },
  {
    slug: "apple-cinnamon",
    name: "Apple Cinnamon Cupcake",
    price: 4.99,
    description: "Apple cinnamon cupcake with German chocolate frosting",
    imagePath: "menu images/apple cinammon cupcake with german cocolate icing.jpg",
    category: "cupcake"
  },
  {
    slug: "cookies-cream",
    name: "Cookies and Cream Cupcake",
    price: 4.99,
    description: "Cookies and cream cupcake with espresso frosting",
    imagePath: "menu images/cookies and cream cupcake with  espresso icing.jpg",
    category: "cupcake"
  },
  {
    slug: "champagne",
    name: "Champagne Cupcake",
    price: 5.49,
    description: "Elegant champagne cupcake with lemon frosting",
    imagePath: "menu images/champagne cupcake with lemon icing.jpg",
    category: "cupcake"
  },
  {
    slug: "chocolate-cheesecake",
    name: "Chocolate Cheesecake Cupcake",
    price: 5.99,
    description: "Chocolate cheesecake cupcake with maple bacon frosting",
    imagePath: "menu images/Chocolate cheesecake with maple bacon.jpg",
    category: "cupcake"
  },
  {
    slug: "mississippi-mud",
    name: "Mississippi Mud Cupcake",
    price: 5.99,
    description: "Rich chocolate cupcake with dark chocolate frosting",
    imagePath: "menu images/missipi mud cake with dark choclate icing.jpg",
    category: "cupcake"
  },
  {
    slug: "coconut",
    name: "Coconut Cupcake",
    price: 4.99,
    description: "Tropical coconut cupcake with coconut pecan frosting",
    imagePath: "menu images/cocunut cupcake with coconut pecan icing.jpg",
    category: "cupcake"
  },
  {
    slug: "smores",
    name: "S'mores Cupcake",
    price: 5.49,
    description: "Graham cracker cupcake with strawberry frosting",
    imagePath: "menu images/smores cupcake strawberry icing.jpg",
    category: "cupcake"
  }
];

const seedProducts = async () => {
  try {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('Existing products cleared');

    // Insert new products
    await Product.insertMany(productsData);
    console.log('Products seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
