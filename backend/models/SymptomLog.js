const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine'
  },
  symptoms: {
    type: String,
    trim: true
  },
  painLevel: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  mood: {
    type: String,
    enum: ['good', 'ok', 'bad'],
    required: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
symptomLogSchema.index({ userId: 1, date: -1 });
symptomLogSchema.index({ userId: 1, medicineId: 1, date: -1 });

// Virtual for formatted date
symptomLogSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Ensure virtuals are included in JSON
symptomLogSchema.set('toJSON', { virtuals: true });
symptomLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SymptomLog', symptomLogSchema); 