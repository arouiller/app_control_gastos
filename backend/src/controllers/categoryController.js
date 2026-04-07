const { Category, Expense } = require('../models');
const { success, created, error } = require('../utils/response');

const DEFAULT_CATEGORIES = [
  { name: 'Alimentación', color: '#FF6B6B', icon: 'utensils', description: 'Comidas, alimentos, restaurantes' },
  { name: 'Transporte', color: '#4ECDC4', icon: 'car', description: 'Gasolina, transporte público, taxi' },
  { name: 'Entretenimiento', color: '#45B7D1', icon: 'film', description: 'Cine, juegos, hobbies' },
  { name: 'Servicios', color: '#96CEB4', icon: 'home', description: 'Agua, luz, internet, servicios' },
  { name: 'Salud', color: '#FFEAA7', icon: 'heart', description: 'Medicinas, doctor, gym' },
  { name: 'Educación', color: '#DDA15E', icon: 'book', description: 'Cursos, libros, educación' },
  { name: 'Otros', color: '#C0C0C0', icon: 'circle', description: 'Otros gastos' },
];

const listCategories = async (req, res, next) => {
  try {
    const where = { user_id: req.user.id };
    if (!req.query.includeInactive) {
      where.is_active = true;
    }
    const categories = await Category.findAll({ where, order: [['name', 'ASC']] });
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, color, icon, description } = req.body;
    const category = await Category.create({
      user_id: req.user.id,
      name,
      color: color || '#3B82F6',
      icon: icon || 'circle',
      description,
    });
    return created(res, category);
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!category) {
      return error(res, 'Categoría no encontrada', 404);
    }

    const { name, color, icon, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;

    await category.update(updates);
    return success(res, category, 'Categoría actualizada');
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!category) {
      return error(res, 'Categoría no encontrada', 404);
    }

    // Check if category has expenses
    const expenseCount = await Expense.count({ where: { category_id: category.id } });
    if (expenseCount > 0) {
      return error(res, 'No se puede eliminar: la categoría tiene gastos asociados', 409);
    }

    await category.destroy();
    return success(res, null, 'Categoría eliminada');
  } catch (err) {
    next(err);
  }
};

const seedDefaultCategories = async (userId) => {
  const existing = await Category.count({ where: { user_id: userId } });
  if (existing === 0) {
    await Category.bulkCreate(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }))
    );
  }
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, seedDefaultCategories };
