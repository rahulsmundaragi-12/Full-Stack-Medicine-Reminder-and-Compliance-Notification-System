const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true
  },
  caregivers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['view', 'manage'],
      required: true
    },
    notificationPreferences: {
      missedDoses: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: false }
    }
  }],
  patientsAsCaregivers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['view', 'manage'],
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual to get all patients this user is a caregiver for
userSchema.virtual('patients', {
  ref: 'User',
  localField: 'patientsAsCaregivers.userId',
  foreignField: '_id'
});

// Method to check if user is a caregiver for a specific patient
userSchema.methods.isCaregiver = function(patientId) {
  return this.patientsAsCaregivers.some(p => p.userId.toString() === patientId.toString());
};

// Method to check caregiver role for a specific patient
userSchema.methods.getCaregiverRole = function(patientId) {
  const caregiverRelation = this.patientsAsCaregivers.find(
    p => p.userId.toString() === patientId.toString()
  );
  return caregiverRelation ? caregiverRelation.role : null;
};

// Method to check if user can manage a specific patient's medicines
userSchema.methods.canManagePatient = function(patientId) {
  const caregiverRelation = this.patientsAsCaregivers.find(
    p => p.userId.toString() === patientId.toString()
  );
  return caregiverRelation && caregiverRelation.role === 'manage';
};

module.exports = mongoose.model('User', userSchema); 