const express = require('express');
const recipeController = require('../controllers/recipe.controller');
const authApiKey = require('../middleware/auth.apikey');

const router = express.Router();

router.use(authApiKey);

router.get('/recipes', recipeController.list);
router.get('/recipes/:id', recipeController.detail);
router.get('/recipes/:id/ingredients', recipeController.ingredientsForRecipe);
router.get('/ingredients', recipeController.listIngredients);

module.exports = router;
