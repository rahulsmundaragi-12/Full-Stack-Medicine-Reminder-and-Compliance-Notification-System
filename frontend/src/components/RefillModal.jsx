import { useState } from 'react';
import axios from 'axios';

export default function RefillModal({ medicine, onClose, onRefill }) {
  const [formData, setFormData] = useState({
    quantityAdded: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `http://localhost:4000/api/medicines/${medicine.medicineId}/refill`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      onRefill(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refill medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-4">Refill {medicine.name}</h2>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">
              Quantity Added*
              <span className="text-sm text-gray-500 ml-2">
                (Current: {medicine.pillsRemaining} pills)
              </span>
            </label>
            <input
              type="number"
              name="quantityAdded"
              value={formData.quantityAdded}
              onChange={handleChange}
              className="input"
              min="1"
              required
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
              placeholder="Optional notes about this refill"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Refilling...' : 'Refill Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 