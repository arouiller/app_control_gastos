const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');
const { success, created, error } = require('../utils/response');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return error(res, 'El email ya está registrado', 400);
    }

    const password_hash = await User.hashPassword(password);
    const user = await User.create({ email, password_hash, name });

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ user_id: user.id, refresh_token: refreshToken, expires_at: expiresAt });

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user) {
      return error(res, 'Credenciales inválidas', 400);
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return error(res, 'Credenciales inválidas', 400);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ user_id: user.id, refresh_token: refreshToken, expires_at: expiresAt });

    return res.status(200).json({
      success: true,
      data: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (token) {
      // Invalidate all sessions for this user (simple approach)
      await Session.destroy({ where: { user_id: req.user.id } });
    }
    return success(res, null, 'Sesión cerrada');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return error(res, 'Refresh token requerido', 400);
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const session = await Session.findOne({
      where: { refresh_token: token, user_id: decoded.id },
    });
    if (!session || new Date() > session.expires_at) {
      return error(res, 'Refresh token inválido o expirado', 401);
    }

    const tokens = generateTokens(decoded.id);

    // Replace old session
    await session.destroy();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({
      user_id: decoded.id,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
    });

    return res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return error(res, 'Refresh token inválido', 401);
    }
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    // Simplified: just confirm the email exists
    const { email } = req.body;
    const user = await User.findOne({ where: { email, is_active: true } });
    // Always return success to prevent email enumeration
    return success(res, null, 'Si el email existe, recibirás instrucciones de recuperación');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refreshToken, forgotPassword };
