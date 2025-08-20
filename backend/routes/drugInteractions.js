const router = require('express').Router();
const Medicine = require('../models/Medicine');
const DrugInteraction = require('../models/DrugInteraction');
const { fetchMedicineDetails, fetchDrugInteractions } = require('../services/gemini');
const auth = require('../middleware/auth');

// Check interactions for a list of medicines
router.post('/check', auth, async (req, res) => {
  try {
    const { medicines } = req.body;
    
    // Get medicine details from database
    const medicineDetails = await Promise.all(
      medicines.map(async (med) => {
        const medicine = await Medicine.findById(med.id);
        return medicine ? medicine.name : med.name;
      })
    );

    // Check interactions using Gemini
    const interactions = await fetchDrugInteractions(medicineDetails);

    // Store interactions in database
    const interactionDocs = interactions.map(interaction => ({
      userId: req.user.id,
      medicines: [
        { name: interaction.drugA },
        { name: interaction.drugB }
      ],
      severity: interaction.severity,
      description: interaction.description,
      management: interaction.management
    }));

    if (interactionDocs.length > 0) {
      await DrugInteraction.insertMany(interactionDocs);
    }

    res.json(interactions);
  } catch (err) {
    console.error('Drug interaction check error:', err);
    res.status(500).json({ 
      message: 'Failed to check drug interactions',
      error: err.message 
    });
  }
});

// Get medicine details
router.get('/medicine/:name', auth, async (req, res) => {
  try {
    const { name } = req.params;
    const details = await fetchMedicineDetails(name);
    res.json(details);
  } catch (err) {
    console.error('Medicine details error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch medicine details',
      error: err.message 
    });
  }
});

// Get active interactions for user
router.get('/active', auth, async (req, res) => {
  try {
    const interactions = await DrugInteraction.find({
      userId: req.user.id
    }).sort('-createdAt');
    res.json(interactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Acknowledge an interaction warning
router.post('/:id/acknowledge', auth, async (req, res) => {
  try {
    const interaction = await DrugInteraction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }

    interaction.acknowledged = true;
    interaction.acknowledgedAt = new Date();
    await interaction.save();

    res.json(interaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 