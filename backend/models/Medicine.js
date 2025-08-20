const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'as-needed']
  },
  times: [{
    type: String,
    required: true
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  pillsRemaining: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    required: true,
    default: 5
  },
  lowStockAlertDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual field for low stock alert
medicineSchema.virtual('lowStock').get(function() {
  return this.pillsRemaining <= this.lowStockThreshold;
});

// Calculate next depletion date based on current schedule and pills remaining
medicineSchema.virtual('nextDepletionDate').get(function() {
  if (!this.pillsRemaining || this.frequency === 'as-needed') return null;
  
  const dailyDoses = this.frequency === 'daily' ? this.times.length :
                     this.frequency === 'weekly' ? this.times.length / 7 :
                     this.frequency === 'monthly' ? this.times.length / 30 : 0;
  
  if (dailyDoses === 0) return null;
  
  const daysRemaining = Math.floor(this.pillsRemaining / dailyDoses);
  const date = new Date();
  date.setDate(date.getDate() + daysRemaining);
  return date;
});

// Ensure virtuals are included in JSON
medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema); 