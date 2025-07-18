const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user (called after Firebase authentication)
router.post('/register', async (req, res) => {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;

    // Validate required fields
    if (!firebaseUid || !email || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'firebaseUid, email, and displayName are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ firebaseUid }, { email }] 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = new User({
      firebaseUid,
      email,
      displayName,
      photoURL: photoURL || null,
      status: 'online'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { firebaseUid: user.firebaseUid },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.fullProfile,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user (called after Firebase authentication)
router.post('/login', async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'firebaseUid is required'
      });
    }

    // Find user
    const user = await User.findOne({ firebaseUid, isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status to online
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { firebaseUid: user.firebaseUid },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.fullProfile,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.fullProfile
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, photoURL, status } = req.body;
    const updates = {};

    if (displayName) {
      updates.displayName = displayName;
    }
    if (photoURL !== undefined) {
      updates.photoURL = photoURL;
    }
    if (status && ['online', 'offline', 'away'].includes(status)) {
      updates.status = status;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.fullProfile
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update user status to offline
    await req.user.updateStatus('offline');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Get online users
router.get('/online-users', authenticateToken, async (req, res) => {
  try {
    const onlineUsers = await User.find({
      status: 'online',
      isActive: true,
      _id: { $ne: req.user._id } // Exclude current user
    }).select('displayName photoURL status lastSeen');

    res.json({
      success: true,
      data: {
        users: onlineUsers
      }
    });

  } catch (error) {
    console.error('Online users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
});

module.exports = router;