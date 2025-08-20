const router = require('express').Router();
const User = require('../models/User');
const CaregiverInvite = require('../models/CaregiverInvite');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send invite to caregiver
router.post('/invite', auth, async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if invite already exists
    const existingInvite = await CaregiverInvite.findOne({
      userId: req.user.id,
      email,
      status: 'pending'
    });

    if (existingInvite) {
      return res.status(400).json({ message: 'Invite already sent to this email' });
    }

    // Check if user is already a caregiver
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isAlreadyCaregiver = req.user.caregivers.some(
        c => c.userId.toString() === existingUser._id.toString()
      );
      if (isAlreadyCaregiver) {
        return res.status(400).json({ message: 'User is already a caregiver' });
      }
    }

    // Create new invite
    const token = CaregiverInvite.generateToken();
    const invite = new CaregiverInvite({
      userId: req.user.id,
      email,
      role,
      token
    });

    await invite.save();

    // Send invite email
    const inviteUrl = `${process.env.FRONTEND_URL}/caregiver/join?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Caregiver Invitation from ${req.user.name}`,
      html: `
        <h2>Caregiver Invitation</h2>
        <p>${req.user.name} has invited you to be their caregiver for medicine management.</p>
        <p>Role: ${role === 'manage' ? 'Full Management' : 'View Only'}</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${inviteUrl}">${inviteUrl}</a>
        <p>This invite will expire in 7 days.</p>
      `
    });

    res.status(201).json({ message: 'Invite sent successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify and accept invite
router.get('/invite/:token', async (req, res) => {
  try {
    const invite = await CaregiverInvite.findOne({ token: req.params.token })
      .populate('userId', 'name email');

    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite token' });
    }

    if (!invite.canBeAccepted()) {
      return res.status(400).json({
        message: invite.isExpired() ? 'Invite has expired' : 'Invite is no longer valid'
      });
    }

    res.json({
      invite: {
        patientName: invite.userId.name,
        patientEmail: invite.userId.email,
        role: invite.role,
        email: invite.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept invite
router.post('/invite/:token/accept', auth, async (req, res) => {
  try {
    const invite = await CaregiverInvite.findOne({ token: req.params.token })
      .populate('userId');

    if (!invite) {
      return res.status(404).json({ message: 'Invalid invite token' });
    }

    if (!invite.canBeAccepted()) {
      return res.status(400).json({
        message: invite.isExpired() ? 'Invite has expired' : 'Invite is no longer valid'
      });
    }

    if (invite.email !== req.user.email) {
      return res.status(403).json({ message: 'This invite was sent to a different email address' });
    }

    // Update patient's caregivers list
    await User.findByIdAndUpdate(invite.userId._id, {
      $push: {
        caregivers: {
          userId: req.user.id,
          role: invite.role
        }
      }
    });

    // Update caregiver's patients list
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        patientsAsCaregivers: {
          userId: invite.userId._id,
          role: invite.role
        }
      }
    });

    // Mark invite as accepted
    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invite accepted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all caregivers for current user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('caregivers.userId', 'name email');
    
    res.json(user.caregivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all patients for current caregiver
router.get('/patients', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('patientsAsCaregivers.userId', 'name email');
    
    res.json(user.patientsAsCaregivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove caregiver
router.delete('/:caregiverId', auth, async (req, res) => {
  try {
    // Remove from patient's caregivers list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: {
        caregivers: {
          userId: req.params.caregiverId
        }
      }
    });

    // Remove from caregiver's patients list
    await User.findByIdAndUpdate(req.params.caregiverId, {
      $pull: {
        patientsAsCaregivers: {
          userId: req.user.id
        }
      }
    });

    res.json({ message: 'Caregiver removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update caregiver notification preferences
router.put('/:caregiverId/notifications', auth, async (req, res) => {
  try {
    const { missedDoses, lowStock, dailySummary } = req.body;

    const user = await User.findById(req.user.id);
    const caregiver = user.caregivers.id(req.params.caregiverId);

    if (!caregiver) {
      return res.status(404).json({ message: 'Caregiver not found' });
    }

    caregiver.notificationPreferences = {
      missedDoses,
      lowStock,
      dailySummary
    };

    await user.save();
    res.json(caregiver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 