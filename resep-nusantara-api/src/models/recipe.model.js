const pool = require('../config/db');

async function list({ category, region, difficulty, page, limit }) {
  const conditions = [];
  const values = [];

  if (category) {
    values.push(category);
    conditions.push(`category ILIKE $${values.length}`);
  }
  if (region) {
    values.push(region);
    conditions.push(`region ILIKE $${values.length}`);
  }
  if (difficulty) {
    values.push(difficulty);
    conditions.push(`difficulty ILIKE $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM recipes ${whereClause}`,
    values
  );

  values.push(limit);
  values.push(offset);
  const dataResult = await pool.query(
    `SELECT id, name, category, region, difficulty, cook_time_minutes, servings, description, image_url, created_at
     FROM recipes
     ${whereClause}
     ORDER BY id ASC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return {
    total: countResult.rows[0].total,
    items: dataResult.rows,
  };
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
  return result.rows[0];
}

async function findIngredientsByRecipeId(recipeId) {
  const result = await pool.query(
    `SELECT ri.id, ri.quantity, ri.unit, ri.notes,
            i.id AS ingredient_id, i.name AS ingredient_name, i.default_unit, i.image_url AS ingredient_image_url
     FROM recipe_ingredients ri
     JOIN ingredients i ON i.id = ri.ingredient_id
     WHERE ri.recipe_id = $1
     ORDER BY ri.id ASC`,
    [recipeId]
  );
  return result.rows;
}

async function listIngredients({ page, limit }) {
  const offset = (page - 1) * limit;

  const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM ingredients');
  const dataResult = await pool.query(
    `SELECT id, name, default_unit, image_url, created_at
     FROM ingredients
     ORDER BY id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    total: countResult.rows[0].total,
    items: dataResult.rows,
  };
}

module.exports = {
  list,
  findById,
  findIngredientsByRecipeId,
  listIngredients,
};
