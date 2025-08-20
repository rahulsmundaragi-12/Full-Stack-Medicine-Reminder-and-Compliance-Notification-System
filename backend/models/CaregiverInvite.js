const mongoose = require('mongoose');
const crypto = require('crypto');

const caregiverInviteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['view', 'manage'],
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // 7 days from now
  }
}, {
  timestamps: true
});

// Index for faster token lookups
caregiverInviteSchema.index({ token: 1 });

// Index for checking existing invites
caregiverInviteSchema.index({ userId: 1, email: 1 });

// Generate a secure random token
caregiverInviteSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Check if invite is expired
caregiverInviteSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Check if invite can be accepted
caregiverInviteSchema.methods.canBeAccepted = function() {
  return this.status === 'pending' && !this.isExpired();
};

module.exports = mongoose.model('CaregiverInvite', caregiverInviteSchema); 