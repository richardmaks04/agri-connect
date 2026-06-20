const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// ─── Token generators ─────────────────────────────────────────────────────────
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

// ─── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email, password, fullName, phoneNumber,
      primarySpecialization, state, lga, experience,
      role = 'farmer', inviteCode,
    } = req.body;

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // If the user requests a privileged role, require a valid invite code
    const privilegedRoles = ['expert', 'extension', 'admin'];
    let isVerified = false;
    let assignedRole = 'farmer';

    if (role && privilegedRoles.includes(role)) {
      const code = (inviteCode || '').trim();
      if (!code) {
        return res.status(403).json({ error: 'Invite code required for requested account type.' });
      }

      const ok = (
        (role === 'admin' && process.env.ADMIN_SIGNUP_KEY && code === process.env.ADMIN_SIGNUP_KEY) ||
        (role === 'expert' && process.env.EXPERT_SIGNUP_KEY && code === process.env.EXPERT_SIGNUP_KEY) ||
        (role === 'extension' && process.env.EXTENSION_SIGNUP_KEY && code === process.env.EXTENSION_SIGNUP_KEY)
      );

      if (!ok) {
        return res.status(403).json({ error: 'Invalid invite code for requested account type.' });
      }

      assignedRole = role;
      isVerified = true; // Invite-based signups are treated as verified
    }

    const user = await User.create({
      email: normalizedEmail,
      phoneNumber,
      passwordHash: password, // Will be hashed by pre-save hook in User model
      role: assignedRole,
      isVerified,
      profile: {
        fullName,
        location: { state, lga },
        farmingSpecializations: primarySpecialization ? [{
          primary: primarySpecialization,
          experience: experience || 'beginner',
        }] : [],
      },
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'Account created successfully',
      user: user.toPublicProfile(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Select passwordHash explicitly (it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Login successful',
      user: user.toPublicProfile(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};
