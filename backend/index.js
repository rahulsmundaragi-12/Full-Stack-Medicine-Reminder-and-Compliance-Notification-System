const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const ScheduledDose = require('./models/ScheduledDose');
const Medicine = require('./models/Medicine');
const User = require('./models/User');
const CaregiverInvite = require('./models/CaregiverInvite');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- Email Template Helpers ---
function preReminderEmail({ user, medicine, dose }) {
  return {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Your medicine is due soon: ${medicine.name}`,
    html: `
      <h2>Medicine Reminder</h2>
      <p>Hi ${user.name},</p>
      <p>This is a reminder that your medicine <b>${medicine.name}</b> (${medicine.dosage || ''}) is scheduled for <b>${dose.scheduledTime.toLocaleString()}</b>.</p>
      ${medicine.notes ? `<p><b>Notes:</b> ${medicine.notes}</p>` : ''}
      <p>Please ensure you take your dose on time.</p>
    `
  };
}

function missedDoseEmail({ user, medicine, dose }) {
  return {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `You missed your medicine!`,
    html: `
      <h2>Missed Medicine Alert</h2>
      <p>Hi ${user.name},</p>
      <p>It looks like you missed your scheduled dose of <b>${medicine.name}</b> (${medicine.dosage || ''}) at <b>${dose.scheduledTime.toLocaleString()}</b>.</p>
      <p><b>Please take your dose as soon as possible.</b></p>
      ${medicine.notes ? `<p><b>Notes:</b> ${medicine.notes}</p>` : ''}
    `
  };
}

function caregiverMissedDoseEmail({ caregiverEmail, user, medicine, dose }) {
  return {
    from: process.env.EMAIL_USER,
    to: caregiverEmail,
    subject: `Missed medicine alert for ${user.name}`,
    html: `
      <h2>Missed Medicine Alert for ${user.name}</h2>
      <p>${user.name} missed their scheduled dose of <b>${medicine.name}</b> (${medicine.dosage || ''}) at <b>${dose.scheduledTime.toLocaleString()}</b>.</p>
      <p>Please check in with them to ensure their safety.</p>
    `
  };
}

// Scheduler: runs every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const preWindowStart = new Date(now.getTime() + 29 * 60000); // 29 min from now
  const preWindowEnd = new Date(now.getTime() + 31 * 60000); // 31 min from now
  const postWindowStart = new Date(now.getTime() - 31 * 60000); // 31 min ago
  const postWindowEnd = new Date(now.getTime() - 29 * 60000); // 29 min ago

  // 1. Pre-reminder: find doses 30 min from now, not yet sent
  const preReminders = await ScheduledDose.find({
    scheduledTime: { $gte: preWindowStart, $lte: preWindowEnd },
    preReminderSent: false
  });
  for (const dose of preReminders) {
    const medicine = await Medicine.findById(dose.medicineId);
    const user = await User.findById(dose.userId);
    if (medicine && user) {
      try {
        await transporter.sendMail(preReminderEmail({ user, medicine, dose }));
        dose.preReminderSent = true;
        await dose.save();
        console.log(`Pre-reminder sent to ${user.email} for ${medicine.name} at ${dose.scheduledTime}`);
      } catch (err) {
        console.error('Error sending pre-reminder email:', err);
      }
    }
  }

  // 2. Post-missed: find doses 30 min ago, still pending, not yet sent
  const postMissed = await ScheduledDose.find({
    scheduledTime: { $gte: postWindowStart, $lte: postWindowEnd },
    status: 'pending',
    postMissedSent: false
  });
  for (const dose of postMissed) {
    const medicine = await Medicine.findById(dose.medicineId);
    const user = await User.findById(dose.userId);
    if (medicine && user) {
      try {
        // Send missed dose email to user
        await transporter.sendMail(missedDoseEmail({ user, medicine, dose }));
        // Optionally, notify caregiver if still not taken
        const caregiverInvite = await CaregiverInvite.findOne({ userId: user._id, status: 'accepted' });
        if (caregiverInvite && caregiverInvite.email) {
          await transporter.sendMail(caregiverMissedDoseEmail({ caregiverEmail: caregiverInvite.email, user, medicine, dose }));
          dose.caretakerNotified = true;
          console.log(`Missed dose alert sent to caregiver ${caregiverInvite.email} for ${user.name}`);
        }
        dose.postMissedSent = true;
        await dose.save();
        console.log(`Missed dose alert sent to ${user.email} for ${medicine.name} at ${dose.scheduledTime}`);
      } catch (err) {
        console.error('Error sending missed dose email:', err);
      }
    }
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/intake', require('./routes/medicineIntake'));
app.use('/api/drug-interactions', require('./routes/drugInteractions'));
app.use('/api/caregivers', require('./routes/caregivers'));
app.use('/api/symptoms', require('./routes/symptoms'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
