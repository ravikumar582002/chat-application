const express = require('express');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken, isRoomMember, isRoomAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all chat rooms for current user
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      'members.user': req.user._id,
      'members.isActive': true,
      isActive: true
    })
    .populate('createdBy', 'displayName photoURL')
    .populate('lastMessage.sender', 'displayName photoURL')
    .sort({ 'lastMessage.timestamp': -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        rooms: rooms.map(room => room.roomInfo)
      }
    });

  } catch (error) {
    console.error('Fetch rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat rooms'
    });
  }
});

// Get public chat rooms
router.get('/public-rooms', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const rooms = await ChatRoom.find({
      type: 'public',
      isActive: true
    })
    .populate('createdBy', 'displayName photoURL')
    .populate('lastMessage.sender', 'displayName photoURL')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await ChatRoom.countDocuments({
      type: 'public',
      isActive: true
    });

    res.json({
      success: true,
      data: {
        rooms: rooms.map(room => room.roomInfo),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Fetch public rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public rooms'
    });
  }
});

// Create new chat room
router.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { name, description, type = 'public', maxMembers = 100 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    // Check if room name already exists
    const existingRoom = await ChatRoom.findOne({
      name,
      type,
      isActive: true
    });

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: 'Room with this name already exists'
      });
    }

    const room = new ChatRoom({
      name,
      description: description || '',
      type,
      createdBy: req.user._id,
      maxMembers,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date(),
        isActive: true
      }]
    });

    await room.save();

    // Populate the created room
    await room.populate('createdBy', 'displayName photoURL');

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      data: {
        room: room.roomInfo
      }
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific chat room
router.get('/rooms/:roomId', authenticateToken, isRoomMember, async (req, res) => {
  try {
    await req.room.populate('createdBy', 'displayName photoURL');
    await req.room.populate('members.user', 'displayName photoURL status lastSeen');
    await req.room.populate('lastMessage.sender', 'displayName photoURL');

    res.json({
      success: true,
      data: {
        room: req.room.roomInfo,
        members: req.room.getActiveMembers()
      }
    });

  } catch (error) {
    console.error('Fetch room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat room'
    });
  }
});

// Join chat room
router.post('/rooms/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Room is not active'
      });
    }

    if (room.type === 'private') {
      return res.status(403).json({
        success: false,
        message: 'Cannot join private room'
      });
    }

    // Check if user is already a member
    if (room.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this room'
      });
    }

    // Check if room is full
    const activeMembers = room.getActiveMembers();
    if (activeMembers.length >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    await room.addMember(req.user._id);

    res.json({
      success: true,
      message: 'Joined room successfully'
    });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

// Leave chat room
router.post('/rooms/:roomId/leave', authenticateToken, isRoomMember, async (req, res) => {
  try {
    await req.room.removeMember(req.user._id);

    res.json({
      success: true,
      message: 'Left room successfully'
    });

  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room'
    });
  }
});

// Get messages for a room
router.get('/rooms/:roomId/messages', authenticateToken, isRoomMember, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      roomId,
      isDeleted: false
    })
    .populate('sender', 'displayName photoURL')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'displayName photoURL')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      roomId,
      isDeleted: false
    });

    // Mark messages as read for current user
    const messageIds = messages.map(msg => msg._id);
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    res.json({
      success: true,
      data: {
        messages: messages.reverse().map(msg => msg.messageInfo),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send message to room
router.post('/rooms/:roomId/messages', authenticateToken, isRoomMember, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text', replyTo, attachments } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = new Message({
      roomId,
      sender: req.user._id,
      content: content.trim(),
      type,
      replyTo: replyTo || null,
      attachments: attachments || []
    });

    await message.save();
    await message.populate('sender', 'displayName photoURL');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: message.messageInfo
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Edit message
router.put('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit messages from other users'
      });
    }

    await message.editMessage(content.trim());
    await message.populate('sender', 'displayName photoURL');

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: {
        message: message.messageInfo
      }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit message'
    });
  }
});

// Delete message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or room admin
    const isSender = message.sender.toString() === req.user._id.toString();
    const room = await ChatRoom.findById(message.roomId);
    const isAdmin = room && room.members.some(m => 
      m.user.toString() === req.user._id.toString() && 
      m.role === 'admin' && 
      m.isActive
    );

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete messages from other users'
      });
    }

    await message.deleteMessage();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.addReaction(req.user._id, emoji);
    await message.populate('reactions.user', 'displayName photoURL');

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: {
        message: message.messageInfo
      }
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.removeReaction(req.user._id, emoji);
    await message.populate('reactions.user', 'displayName photoURL');

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: {
        message: message.messageInfo
      }
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
});

module.exports = router;