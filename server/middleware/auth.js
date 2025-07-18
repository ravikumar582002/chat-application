const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify Firebase token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify Firebase token (you'll need to implement Firebase Admin SDK)
    // For now, we'll use a simple JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in database
    const user = await User.findOne({ 
      firebaseUid: decoded.firebaseUid,
      isActive: true 
    }).select('-__v');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ 
        firebaseUid: decoded.firebaseUid,
        isActive: true 
      }).select('-__v');
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to check if user is admin of a room
const isRoomAdmin = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const ChatRoom = require('../models/ChatRoom');
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    const member = room.members.find(m => 
      m.user.toString() === userId.toString() && m.isActive
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required' 
      });
    }

    req.room = room;
    next();
  } catch (error) {
    console.error('Room admin check error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization check failed' 
    });
  }
};

// Middleware to check if user is member of a room
const isRoomMember = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const ChatRoom = require('../models/ChatRoom');
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }

    if (!room.isMember(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this room' 
      });
    }

    req.room = room;
    next();
  } catch (error) {
    console.error('Room member check error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization check failed' 
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  isRoomAdmin,
  isRoomMember
};