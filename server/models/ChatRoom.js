const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxMembers: {
    type: Number,
    default: 100,
    min: 2,
    max: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chatRoomSchema.index({ type: 1, isActive: 1 });
chatRoomSchema.index({ 'members.user': 1 });
chatRoomSchema.index({ createdBy: 1 });
chatRoomSchema.index({ lastMessage: -1 });

// Virtual for room info
chatRoomSchema.virtual('roomInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    type: this.type,
    memberCount: this.members.filter(m => m.isActive).length,
    lastMessage: this.lastMessage,
    createdAt: this.createdAt,
    isActive: this.isActive
  };
});

// Method to add member to room
chatRoomSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
  } else {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

// Method to remove member from room
chatRoomSchema.methods.removeMember = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.isActive = false;
  }
  return this.save();
};

// Method to check if user is member
chatRoomSchema.methods.isMember = function(userId) {
  return this.members.some(m => 
    m.user.toString() === userId.toString() && m.isActive
  );
};

// Method to get active members
chatRoomSchema.methods.getActiveMembers = function() {
  return this.members.filter(m => m.isActive);
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);