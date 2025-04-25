const Recipe = require('../models/Recipe');

// Get all recipes
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find().sort({ name: 1 });
        res.status(200).json({
            success: true,
            data: recipes
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recipes'
        });
    }
};

// Get recipe by ID
exports.getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }
        res.status(200).json({
            success: true,
            data: recipe
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recipe'
        });
    }
};

// Create new recipe
exports.createRecipe = async (req, res) => {
    try {
        const recipeData = req.body;
        const recipe = new Recipe(recipeData);
        await recipe.save();
        res.status(201).json({
            success: true,
            data: recipe,
            message: 'Recipe created successfully'
        });
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating recipe'
        });
    }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
    try {
        const recipeData = req.body;
        const recipe = await Recipe.findByIdAndUpdate(req.params.id, recipeData, { new: true });
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }
        res.status(200).json({
            success: true,
            data: recipe,
            message: 'Recipe updated successfully'
        });
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating recipe'
        });
    }
};

// Delete recipe
exports.deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Recipe deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting recipe'
        });
    }
};
