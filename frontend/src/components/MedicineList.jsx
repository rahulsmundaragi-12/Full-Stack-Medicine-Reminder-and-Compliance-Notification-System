import { useState, useEffect } from 'react';
import { medicineApi } from '../services/api';
import MedicineForm from './MedicineForm';
import GeminiDetailsModal from './GeminiDetailsModal';

export default function MedicineList() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [geminiDetails, setGeminiDetails] = useState(null);
  const [showGeminiModal, setShowGeminiModal] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await medicineApi.getAll();
      setMedicines(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch medicines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }

    try {
      await medicineApi.delete(id);
      setMedicines(medicines.filter(med => med._id !== id));
    } catch (err) {
      setError('Failed to delete medicine');
      console.error(err);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setSelectedMedicine(null);
    fetchMedicines();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedMedicine(null);
  };

  const handleViewDetails = async (medicine) => {
    try {
      // Fetch Gemini details using backend PUT (simulate update with no changes to get Gemini details)
      const response = await medicineApi.update(medicine._id, {});
      setGeminiDetails(response.data.geminiDetails);
      setShowGeminiModal(true);
    } catch (err) {
      setGeminiDetails({ error: 'Could not fetch Gemini details' });
      setShowGeminiModal(true);
    }
  };

  if (loading) {
    return <div>Loading medicines...</div>;
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Medicines</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          Add New Medicine
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold mb-4">
              {selectedMedicine ? 'Edit' : 'Add'} Medicine
            </h2>
            <MedicineForm
              medicine={selectedMedicine}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {medicines.length === 0 ? (
          <p>No medicines added yet.</p>
        ) : (
          medicines.map(medicine => (
            <div key={medicine._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{medicine.name}</h3>
                  <p className="text-sm">Dosage: {medicine.dosage}</p>
                  <p className="text-sm">Frequency: {medicine.frequency}</p>
                  <p className="text-sm">
                    Times: {medicine.times.join(', ')}
                  </p>
                  {medicine.notes && (
                    <p className="text-sm mt-2">Notes: {medicine.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(medicine)}
                    className="btn btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(medicine._id)}
                    className="btn btn-secondary"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleViewDetails(medicine)}
                    className="btn btn-primary"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {showGeminiModal && (
        <GeminiDetailsModal
          details={geminiDetails}
          onClose={() => setShowGeminiModal(false)}
        />
      )}
    </div>
  );
} 