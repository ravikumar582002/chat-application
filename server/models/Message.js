const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    size: Number,
    type: String
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    }
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });

// Virtual for message info
messageSchema.virtual('messageInfo').get(function() {
  return {
    id: this._id,
    roomId: this.roomId,
    sender: this.sender,
    content: this.content,
    type: this.type,
    attachments: this.attachments,
    replyTo: this.replyTo,
    edited: this.edited,
    reactions: this.reactions,
    readBy: this.readBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => 
    r.user.toString() === userId.toString() && r.emoji === emoji
  );
  
  if (!existingReaction) {
    this.reactions.push({
      user: userId,
      emoji: emoji,
      createdAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(r => 
    !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent) {
  this.content = newContent;
  this.edited.isEdited = true;
  this.edited.editedAt = new Date();
  return this.save();
};

// Method to soft delete message
messageSchema.methods.deleteMessage = function() {
  this.isDeleted = true;
  return this.save();
};

// Pre-save middleware to update room's last message
messageSchema.pre('save', async function(next) {
  if (this.isNew && !this.isDeleted) {
    try {
      const ChatRoom = mongoose.model('ChatRoom');
      await ChatRoom.findByIdAndUpdate(this.roomId, {
        lastMessage: {
          content: this.content,
          sender: this.sender,
          timestamp: this.createdAt
        }
      });
    } catch (error) {
      console.error('Error updating room last message:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);