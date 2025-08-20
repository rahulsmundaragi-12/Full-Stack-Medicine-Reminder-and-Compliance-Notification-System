const router = require('express').Router();
const MedicineIntake = require('../models/MedicineIntake');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const auth = require('../middleware/auth');
const ScheduledDose = require('../models/ScheduledDose');

// Mark medicine as taken
router.post('/taken/:medicineId', auth, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { scheduledTime, notes } = req.body;

    // Get the medicine to update pill count
    const medicine = await Medicine.findOne({
      _id: medicineId,
      userId: req.user.id
    });

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Create intake record
    const intake = new MedicineIntake({
      userId: req.user.id,
      medicineId,
      scheduledTime: scheduledTime || new Date(),
      status: 'taken',
      takenAt: new Date(),
      notes
    });

    // Update pill count
    medicine.pillsRemaining = Math.max(0, medicine.pillsRemaining - 1);

    // Update ScheduledDose status to 'taken'
    if (scheduledTime) {
      await ScheduledDose.findOneAndUpdate(
        {
          userId: req.user.id,
          medicineId,
          scheduledTime: new Date(scheduledTime)
        },
        { status: 'taken' }
      );
    }

    // Check for low stock
    let lowStockAlert = false;
    if (medicine.pillsRemaining <= medicine.lowStockThreshold && !medicine.lowStockAlertDate) {
      medicine.lowStockAlertDate = new Date();
      lowStockAlert = true;

      // Get user for email notification
      const user = await User.findById(req.user.id);
      if (user) {
        // Send email notification
        await sendLowStockEmail(user, medicine);
      }
    }

    // Save both documents
    const [savedIntake, savedMedicine] = await Promise.all([
      intake.save(),
      medicine.save()
    ]);

    res.status(201).json({
      intake: savedIntake,
      medicine: savedMedicine,
      lowStock: lowStockAlert
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get today's medicine schedule
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all medicines for the user
    const medicines = await Medicine.find({ userId: req.user.id });
    
    // Get all intakes for today
    const intakes = await MedicineIntake.find({
      userId: req.user.id,
      scheduledTime: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Create schedule for each medicine
    const schedule = [];
    for (const medicine of medicines) {
      for (const time of medicine.times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(today);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Check if there's already an intake for this medicine at this time
        const existingIntake = intakes.find(intake => 
          intake.medicineId.toString() === medicine._id.toString() &&
          intake.scheduledTime.getHours() === parseInt(hours) &&
          intake.scheduledTime.getMinutes() === parseInt(minutes)
        );

        schedule.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          scheduledTime,
          status: existingIntake ? existingIntake.status : 'pending',
          takenAt: existingIntake ? existingIntake.takenAt : null,
          pillsRemaining: medicine.pillsRemaining,
          lowStock: medicine.lowStock,
          lowStockAlertDate: medicine.lowStockAlertDate,
          nextDepletionDate: medicine.nextDepletionDate
        });
      }
    }

    // Sort by time
    schedule.sort((a, b) => a.scheduledTime - b.scheduledTime);

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get medicine intake logs
router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await MedicineIntake.find({ userId: req.user.id })
      .populate('medicineId', 'name dosage pillsRemaining lowStock')
      .sort({ scheduledTime: -1 })
      .limit(50);

    res.json(logs);
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