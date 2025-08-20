import { useState, useEffect } from 'react';
import { medicineApi } from '../services/api';
import MedicineForm from '../components/MedicineForm';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

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

  if (loading) {
    return <div className="container">Loading medicines...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medicines</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          Add New Medicine
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {medicines.map(medicine => (
          <div key={medicine._id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2">{medicine.name}</h3>
                <p className="mb-1">Dosage: {medicine.dosage}</p>
                <p className="mb-1">Frequency: {medicine.frequency}</p>
                <p className="mb-1">Times: {medicine.times.join(', ')}</p>
                <p className="mb-1">Start Date: {new Date(medicine.startDate).toLocaleDateString()}</p>
                {medicine.endDate && (
                  <p className="mb-1">End Date: {new Date(medicine.endDate).toLocaleDateString()}</p>
                )}
                {medicine.notes && (
                  <p className="mt-2 text-gray-600">{medicine.notes}</p>
                )}
              </div>
              <div className="flex gap-4">
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
              </div>
            </div>
          </div>
        ))}
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
              onCancel={() => {
                setShowForm(false);
                setSelectedMedicine(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 