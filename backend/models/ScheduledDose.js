const mongoose = require('mongoose');

const ScheduledDoseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  scheduledTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'taken', 'missed'], default: 'pending' },
  preReminderSent: { type: Boolean, default: false },
  postMissedSent: { type: Boolean, default: false },
  caretakerNotified: { type: Boolean, default: false },
});

module.exports = mongoose.model('ScheduledDose', ScheduledDoseSchema); 