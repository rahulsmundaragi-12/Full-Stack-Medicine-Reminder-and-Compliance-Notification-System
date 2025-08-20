import { useState } from 'react';
import axios from 'axios';

export default function SymptomLogModal({ medicine, onClose, onSave }) {
  const [formData, setFormData] = useState({
    symptoms: '',
    painLevel: 5,
    mood: 'ok',
    sideEffects: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:4000/api/symptoms',
        {
          ...formData,
          medicineId: medicine.medicineId,
          date: new Date()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      onSave(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save symptom log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">How do you feel?</h2>
          <button
            onClick={onClose}
            className="close-button"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Mood</label>
            <div className="flex gap-4">
              {['good', 'ok', 'bad'].map(mood => (
                <label
                  key={mood}
                  className={`
                    flex-1 flex flex-col items-center p-3 rounded-lg cursor-pointer border-2
                    ${formData.mood === mood ? 'border-accent bg-primary' : 'border-secondary'}
                  `}
                  onClick={() => setFormData(prev => ({ ...prev, mood }))}
                >
                  <span className="text-2xl mb-1">
                    {mood === 'good' ? '😊' : mood === 'ok' ? '😐' : '😞'}
                  </span>
                  <span className="capitalize">{mood}</span>
                  <input
                    type="radio"
                    name="mood"
                    value={mood}
                    checked={formData.mood === mood}
                    onChange={() => {}}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">
              Pain Level: {formData.painLevel}
              <span className="text-sm text-gray-500 ml-2">(1-10)</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.painLevel}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                painLevel: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>No Pain</span>
              <span>Severe Pain</span>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Symptoms</label>
            <input
              type="text"
              value={formData.symptoms}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                symptoms: e.target.value
              }))}
              className="input"
              placeholder="Headache, nausea, etc. (comma-separated)"
            />
          </div>

          <div className="form-group">
            <label className="label">Side Effects</label>
            <input
              type="text"
              value={formData.sideEffects}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                sideEffects: e.target.value
              }))}
              className="input"
              placeholder="Any side effects you've noticed"
            />
          </div>

          <div className="form-group">
            <label className="label">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              className="input"
              rows="3"
              placeholder="Any other observations or notes"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 