const { User } = require('../models');
const { success, error } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    return success(res, req.user.toJSON());
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, profile_picture_url } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (profile_picture_url !== undefined) updates.profile_picture_url = profile_picture_url;

    await req.user.update(updates);
    return success(res, req.user.toJSON(), 'Perfil actualizado');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isValid = await req.user.validatePassword(currentPassword);
    if (!isValid) {
      return error(res, 'Contraseña actual incorrecta', 400);
    }

    const password_hash = await User.hashPassword(newPassword);
    await req.user.update({ password_hash });

    return success(res, null, 'Contraseña actualizada');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword };
