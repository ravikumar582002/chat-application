const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  photoURL: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastSeen: -1 });

// Virtual for user's full profile
userSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    firebaseUid: this.firebaseUid,
    email: this.email,
    displayName: this.displayName,
    photoURL: this.photoURL,
    status: this.status,
    lastSeen: this.lastSeen,
    isActive: this.isActive
  };
});

// Method to update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Method to update status
userSchema.methods.updateStatus = function(status) {
  this.status = status;
  if (status === 'offline') {
    this.lastSeen = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);