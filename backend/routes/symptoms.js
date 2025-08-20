const router = require('express').Router();
const SymptomLog = require('../models/SymptomLog');
const auth = require('../middleware/auth');

// Add new symptom log
router.post('/', auth, async (req, res) => {
  try {
    const { date, medicineId, symptoms, painLevel, mood, sideEffects, notes } = req.body;

    const symptomLog = new SymptomLog({
      userId: req.user.id,
      date: date || new Date(),
      medicineId,
      symptoms,
      painLevel,
      mood,
      sideEffects,
      notes
    });

    const savedLog = await symptomLog.save();
    res.status(201).json(savedLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get symptom logs by date range
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, medicineId } = req.query;
    
    const query = {
      userId: req.user.id
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = {
        $gte: new Date(startDate)
      };
    }

    if (medicineId) {
      query.medicineId = medicineId;
    }

    const logs = await SymptomLog.find(query)
      .sort({ date: -1 })
      .populate('medicineId', 'name');

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get symptom log by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const log = await SymptomLog.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('medicineId', 'name');

    if (!log) {
      return res.status(404).json({ message: 'Symptom log not found' });
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update symptom log
router.put('/:id', auth, async (req, res) => {
  try {
    const { symptoms, painLevel, mood, sideEffects, notes } = req.body;

    const log = await SymptomLog.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Symptom log not found' });
    }

    // Update fields
    if (symptoms !== undefined) log.symptoms = symptoms;
    if (painLevel !== undefined) log.painLevel = painLevel;
    if (mood !== undefined) log.mood = mood;
    if (sideEffects !== undefined) log.sideEffects = sideEffects;
    if (notes !== undefined) log.notes = notes;

    const updatedLog = await log.save();
    res.json(updatedLog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete symptom log
router.delete('/:id', auth, async (req, res) => {
  try {
    const log = await SymptomLog.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!log) {
      return res.status(404).json({ message: 'Symptom log not found' });
    }

    await log.deleteOne();
    res.json({ message: 'Symptom log deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get symptom statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate, medicineId } = req.query;
    
    const query = {
      userId: req.user.id
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (medicineId) {
      query.medicineId = medicineId;
    }

    const logs = await SymptomLog.find(query);

    // Calculate statistics
    const stats = {
      totalLogs: logs.length,
      averagePainLevel: 0,
      moodDistribution: {
        good: 0,
        ok: 0,
        bad: 0
      },
      commonSymptoms: new Map()
    };

    logs.forEach(log => {
      // Pain level average
      stats.averagePainLevel += log.painLevel;

      // Mood distribution
      stats.moodDistribution[log.mood]++;

      // Common symptoms
      if (log.symptoms) {
        const symptoms = log.symptoms.toLowerCase().split(',').map(s => s.trim());
        symptoms.forEach(symptom => {
          stats.commonSymptoms.set(
            symptom,
            (stats.commonSymptoms.get(symptom) || 0) + 1
          );
        });
      }
    });

    // Finalize calculations
    if (logs.length > 0) {
      stats.averagePainLevel /= logs.length;
    }

    // Convert symptoms map to sorted array
    stats.commonSymptoms = Array.from(stats.commonSymptoms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 most common symptoms
      .map(([symptom, count]) => ({ symptom, count }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 