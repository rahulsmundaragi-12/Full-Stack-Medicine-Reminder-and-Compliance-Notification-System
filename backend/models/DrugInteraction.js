const mongoose = require('mongoose');

const drugInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicines: [{
    name: {
      type: String,
      required: true
    }
  }],
  severity: {
    type: String,
    enum: ['major', 'moderate', 'minor'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  management: {
    type: String,
    required: true
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date
  },
  lastChecked: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
drugInteractionSchema.index({ userId: 1, 'medicines.name': 1 });

// Virtual to determine if this is a critical interaction
drugInteractionSchema.virtual('isCritical').get(function() {
  return this.severity === 'major';
});

// Virtual to get formatted medicine names
drugInteractionSchema.virtual('medicineNames').get(function() {
  return this.medicines.map(m => m.name).join(' + ');
});

// Ensure virtuals are included in JSON
drugInteractionSchema.set('toJSON', { virtuals: true });
drugInteractionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DrugInteraction', drugInteractionSchema); 