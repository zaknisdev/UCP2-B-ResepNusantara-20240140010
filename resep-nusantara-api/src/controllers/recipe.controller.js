const recipeModel = require('../models/recipe.model');

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit };
}

async function list(req, res) {
  try {
    const { category, region, difficulty } = req.query;
    const { page, limit } = parsePagination(req.query);

    const { total, items } = await recipeModel.list({ category, region, difficulty, page, limit });

    return res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar resep' });
  }
}

async function detail(req, res) {
  try {
    const { id } = req.params;
    const recipe = await recipeModel.findById(id);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const ingredients = await recipeModel.findIngredientsByRecipeId(id);

    return res.json({
      success: true,
      data: { ...recipe, ingredients },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail resep' });
  }
}

async function ingredientsForRecipe(req, res) {
  try {
    const { id } = req.params;
    const recipe = await recipeModel.findById(id);

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Resep tidak ditemukan' });
    }

    const ingredients = await recipeModel.findIngredientsByRecipeId(id);
    return res.json({ success: true, data: ingredients });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil bahan resep' });
  }
}

async function listIngredients(req, res) {
  try {
    const { page, limit } = parsePagination(req.query);
    const { total, items } = await recipeModel.listIngredients({ page, limit });

    return res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar bahan' });
  }
}

module.exports = { list, detail, ingredientsForRecipe, listIngredients };
