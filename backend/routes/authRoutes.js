const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware');
const { getInMemoryStore } = require('../config/db');

// In-memory fallback user store when MongoDB is disconnected
const inMemoryUsers = new Map();

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Email validation helper regex
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validations (HTTP 400)
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide valid registration details. Name is required.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Please provide valid registration details. Password must be at least 6 characters.' });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { isInMemoryFallback } = getInMemoryStore();

    if (isInMemoryFallback) {
      if (inMemoryUsers.has(cleanEmail)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const id = 'user_' + Date.now();

      const newUser = {
        _id: id,
        id,
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        profileImage: '',
        createdAt: new Date().toISOString()
      };

      inMemoryUsers.set(cleanEmail, newUser);
      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      });
    }

    // MongoDB Mode
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      passwordHash
    });

    await user.save();
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, message: 'Unable to create account. Please try again.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { isInMemoryFallback } = getInMemoryStore();

    if (isInMemoryFallback) {
      const user = inMemoryUsers.get(cleanEmail);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Account not found. Please create an account.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect email or password.' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Signed in successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      });
    }

    // MongoDB Mode
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Account not found. Please create an account.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect email or password.' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      message: 'Signed in successfully!',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Login failed: ' + err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { isInMemoryFallback } = getInMemoryStore();

    if (isInMemoryFallback) {
      let foundUser = null;
      for (const u of inMemoryUsers.values()) {
        if (u.id === userId || u._id === userId) {
          foundUser = u;
          break;
        }
      }
      if (!foundUser) {
        return res.status(404).json({ success: false, message: 'User profile not found.' });
      }
      return res.json({
        success: true,
        user: {
          id: foundUser.id || foundUser._id,
          name: foundUser.name,
          email: foundUser.email,
          createdAt: foundUser.createdAt
        }
      });
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset instructions
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  return res.json({
    success: true,
    message: 'If an account exists with this email, you will receive password reset instructions shortly.'
  });
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const { isInMemoryFallback } = getInMemoryStore();

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  if (isInMemoryFallback) {
    const user = inMemoryUsers.get(cleanEmail);
    if (user) {
      user.passwordHash = hash;
      inMemoryUsers.set(cleanEmail, user);
    }
  } else {
    await User.findOneAndUpdate({ email: cleanEmail }, { passwordHash: hash });
  }

  return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

// @route   POST /api/auth/logout
// @desc    Logout user
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
