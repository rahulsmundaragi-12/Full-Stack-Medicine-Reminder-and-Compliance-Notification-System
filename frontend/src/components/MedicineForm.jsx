import { useState, useEffect } from 'react';
import { medicineApi } from '../services/api';
import axios from 'axios';
// import GeminiDetailsModal from './GeminiDetailsModal';

export default function MedicineForm({ medicine, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: [''],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInteractionWarning, setShowInteractionWarning] = useState(false);
  const [geminiDetails, setGeminiDetails] = useState(null);
  const [showGeminiModal, setShowGeminiModal] = useState(false);

  useEffect(() => {
    if (medicine) {
      setFormData({
        name: medicine.name,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        times: medicine.times,
        startDate: new Date(medicine.startDate).toISOString().split('T')[0],
        endDate: medicine.endDate ? new Date(medicine.endDate).toISOString().split('T')[0] : '',
        notes: medicine.notes || ''
      });
    }
  }, [medicine]);

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, name: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData(prev => ({
      ...prev,
      times: newTimes
    }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      times: [...prev.times, '']
    }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.dosage || formData.times.some(time => !time)) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const medicineData = {
        ...formData,
        times: formData.times.filter(time => time), // Remove empty time slots
      };

      let response;
      if (medicine) {
        response = await medicineApi.update(medicine._id, medicineData);
      } else {
        response = await medicineApi.create(medicineData);
      }

      // Fetch interactions after adding
      const allMeds = await medicineApi.getAll();
      const interactionResponse = await axios.post(
        'http://localhost:4000/api/drug-interactions/check',
        {
          medicines: allMeds.data
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setGeminiDetails({
        gemini: response.data.geminiDetails,
        interactions: interactionResponse.data
      });
      setShowGeminiModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="label">Medicine Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleNameChange}
            className="input"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Dosage*</label>
          <input
            type="text"
            name="dosage"
            value={formData.dosage}
            onChange={handleChange}
            className="input"
            placeholder="e.g., 1 tablet, 5ml"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Frequency*</label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className="input"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="as-needed">As Needed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label">Times*</label>
          {formData.times.map((time, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(index, e.target.value)}
                className="input"
                required
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index)}
                  className="btn btn-secondary"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTimeSlot}
            className="btn btn-secondary mt-2"
          >
            Add Time
          </button>
        </div>

        <div className="form-group">
          <label className="label">Start Date*</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div className="form-group">
          <label className="label">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="input"
            min={formData.startDate}
          />
        </div>

        <div className="form-group">
          <label className="label">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input"
            rows="3"
          />
        </div>

        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || showInteractionWarning}
          >
            {loading ? 'Saving...' : medicine ? 'Update' : 'Add'} Medicine
          </button>
        </div>
      </form>
      {showGeminiModal && geminiDetails && (
        <div className="modal">
          <div className="modal-content max-w-lg p-6 bg-white rounded shadow-lg">
            <h2 className="font-bold text-xl mb-2">Medicine Details</h2>
            {/* Gemini Details */}
            {geminiDetails.gemini && !geminiDetails.gemini.error && !geminiDetails.gemini.raw && (
              <>
                {geminiDetails.gemini.name && <p className="mb-2 font-semibold">{geminiDetails.gemini.name}</p>}
                {geminiDetails.gemini.summary && <p className="mb-4">{geminiDetails.gemini.summary}</p>}
                {geminiDetails.gemini.common_side_effects && geminiDetails.gemini.common_side_effects.length > 0 && (
                  <div className="mb-3">
                    <h3 className="font-semibold">Common Side Effects</h3>
                    <ul className="list-disc ml-6">
                      {geminiDetails.gemini.common_side_effects.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {geminiDetails.gemini.serious_side_effects && geminiDetails.gemini.serious_side_effects.length > 0 && (
                  <div className="mb-3">
                    <h3 className="font-semibold text-red-600">Serious/Rare Side Effects</h3>
                    <ul className="list-disc ml-6 text-red-600">
                      {geminiDetails.gemini.serious_side_effects.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {geminiDetails.gemini.precautions && geminiDetails.gemini.precautions.length > 0 && (
                  <div className="mb-3">
                    <h3 className="font-semibold text-yellow-700">Precautions</h3>
                    <ul className="list-disc ml-6 text-yellow-700">
                      {geminiDetails.gemini.precautions.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {geminiDetails.gemini.expected_effects && geminiDetails.gemini.expected_effects.length > 0 && (
                  <div className="mb-3">
                    <h3 className="font-semibold">Expected Effects</h3>
                    <ul className="list-disc ml-6">
                      {geminiDetails.gemini.expected_effects.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
            {geminiDetails.gemini && geminiDetails.gemini.error && (
              <p className="text-red-600">{geminiDetails.gemini.error}</p>
            )}
            {geminiDetails.gemini && geminiDetails.gemini.raw && (
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{geminiDetails.gemini.raw}</pre>
            )}
            {/* Interactions */}
            <div className="mt-6">
              <h3 className="font-bold mb-2">Drug Interactions</h3>
              {geminiDetails.interactions && geminiDetails.interactions.length > 0 ? (
                geminiDetails.interactions.map((interaction, idx) => (
                  <div key={idx} className="mb-4 p-4 rounded-lg border-2" style={{
                    borderColor: interaction.severity === 'major' ? '#DC2626' :
                               interaction.severity === 'moderate' ? '#F59E0B' : '#6B7280'
                  }}>
                    <p className="font-medium mb-2">
                      {interaction.drugA} + {interaction.drugB}
                    </p>
                    <p className="mb-2">
                      <span className={`badge ${
                        interaction.severity === 'major' ? 'badge-error' :
                        interaction.severity === 'moderate' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {interaction.severity.toUpperCase()}
                      </span>
                    </p>
                    <p className="mb-2">{interaction.description}</p>
                    <p className="text-sm">
                      <strong>Management:</strong> {interaction.management}
                    </p>
                  </div>
                ))
              ) : (
                <p>No interactions found.</p>
              )}
            </div>
            <button className="btn btn-primary mt-4" onClick={() => {
              setShowGeminiModal(false);
              onSubmit();
            }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
} 