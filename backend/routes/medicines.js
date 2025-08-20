const router = require('express').Router();
const Medicine = require('../models/Medicine');
const RefillLog = require('../models/RefillLog');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const ScheduledDose = require('../models/ScheduledDose');
const { fetchMedicineDetails } = require('../services/gemini');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Create a new medicine
router.post('/', auth, async (req, res) => {
  try {
    const { name, dosage, frequency, times, startDate, endDate, notes, totalQuantity, lowStockThreshold } = req.body;

    const newMedicine = new Medicine({
      userId: req.user.id,
      name,
      dosage,
      frequency,
      times,
      startDate,
      endDate,
      notes,
      totalQuantity: totalQuantity || 0,
      pillsRemaining: totalQuantity || 0,
      lowStockThreshold: lowStockThreshold || 5
    });

    const savedMedicine = await newMedicine.save();

    // Generate ScheduledDose entries for each scheduled dose
    const doses = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      for (const time of times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(d);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        doses.push({
          userId: req.user.id,
          medicineId: savedMedicine._id,
          scheduledTime,
        });
      }
    }
    if (doses.length > 0) {
      await ScheduledDose.insertMany(doses);
    }

    // Fetch Gemini medicine details
    let geminiDetails = null;
    try {
      geminiDetails = await fetchMedicineDetails(name, dosage);
    } catch (e) {
      geminiDetails = { error: 'Could not fetch Gemini details' };
    }

    res.status(201).json({ savedMedicine, geminiDetails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all medicines for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific medicine
router.get('/:id', auth, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a medicine
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, dosage, frequency, times, startDate, endDate, notes, lowStockThreshold } = req.body;

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Track if schedule fields changed
    const scheduleChanged = (times && JSON.stringify(times) !== JSON.stringify(medicine.times)) ||
      (startDate && startDate !== medicine.startDate.toISOString().slice(0,10)) ||
      (endDate && endDate !== medicine.endDate.toISOString().slice(0,10));

    // Update fields
    if (name) medicine.name = name;
    if (dosage) medicine.dosage = dosage;
    if (frequency) medicine.frequency = frequency;
    if (times) medicine.times = times;
    if (startDate) medicine.startDate = startDate;
    if (endDate) medicine.endDate = endDate;
    if (notes !== undefined) medicine.notes = notes;
    if (lowStockThreshold) medicine.lowStockThreshold = lowStockThreshold;

    const updatedMedicine = await medicine.save();

    // If schedule changed, remove old ScheduledDose and create new ones
    if (scheduleChanged) {
      await ScheduledDose.deleteMany({ medicineId: medicine._id, userId: req.user.id });
      const doses = [];
      const start = new Date(medicine.startDate);
      const end = new Date(medicine.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        for (const time of medicine.times) {
          const [hours, minutes] = time.split(':');
          const scheduledTime = new Date(d);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          doses.push({
            userId: req.user.id,
            medicineId: medicine._id,
            scheduledTime,
          });
        }
      }
      if (doses.length > 0) {
        await ScheduledDose.insertMany(doses);
      }
    }

    // Fetch Gemini medicine details
    let geminiDetails = null;
    try {
      geminiDetails = await fetchMedicineDetails(medicine.name, medicine.dosage);
    } catch (e) {
      geminiDetails = { error: 'Could not fetch Gemini details' };
    }

    res.json({ updatedMedicine, geminiDetails });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a medicine
router.delete('/:id', auth, async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    await medicine.deleteOne();
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Refill medicine stock
router.post('/:id/refill', auth, async (req, res) => {
  try {
    const { quantityAdded, notes } = req.body;

    const quantity = parseInt(quantityAdded);
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const medicine = await Medicine.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Update quantities
    medicine.totalQuantity += quantity;
    medicine.pillsRemaining += quantity;
    medicine.lowStockAlertDate = null; // Reset low stock alert

    // Save medicine update
    const updatedMedicine = await medicine.save();

    // Log the refill
    const refillLog = new RefillLog({
      userId: req.user.id,
      medicineId: medicine._id,
      quantityAdded: quantity,
      notes
    });
    await refillLog.save();

    res.json(updatedMedicine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get refill history for a medicine
router.get('/:id/refills', auth, async (req, res) => {
  try {
    const refills = await RefillLog.find({
      medicineId: req.params.id,
      userId: req.user.id
    }).sort({ date: -1 });

    res.json(refills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper function to send low stock email
async function sendLowStockEmail(user, medicine) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Low Stock Alert: ${medicine.name}`,
      html: `
        <h2>Low Stock Alert</h2>
        <p>Your medicine ${medicine.name} is running low.</p>
        <p>Current quantity: ${medicine.pillsRemaining} pills</p>
        <p>Please refill soon to ensure uninterrupted treatment.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

module.exports = router; 