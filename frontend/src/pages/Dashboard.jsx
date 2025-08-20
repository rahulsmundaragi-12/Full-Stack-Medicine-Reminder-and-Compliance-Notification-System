import { useState, useEffect } from 'react';
import axios from 'axios';
import WeeklyAdherence from '../components/WeeklyAdherence';
import RefillModal from '../components/RefillModal';
import SymptomLogModal from '../components/SymptomLogModal';

export default function Dashboard() {
  const [todaysMedicines, setTodaysMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);

  useEffect(() => {
    fetchTodaysMedicines();
  }, []);

  const fetchTodaysMedicines = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/intake/today', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTodaysMedicines(response.data);
      
      // Check for any low stock medicines
      const hasLowStock = response.data.some(med => med.lowStock);
      setShowLowStockAlert(hasLowStock);
      
      setError('');
    } catch (err) {
      setError('Failed to fetch today\'s medicines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsTaken = async (medicineId, scheduledTime) => {
    try {
      const response = await axios.post(
        `http://localhost:4000/api/intake/taken/${medicineId}`,
        { scheduledTime },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.lowStock) {
        setShowLowStockAlert(true);
      }

      // Find the medicine that was marked as taken
      const medicine = todaysMedicines.find(m => m.medicineId === medicineId);
      setSelectedMedicine(medicine);
      setShowSymptomModal(true);

      fetchTodaysMedicines(); // Refresh the list
    } catch (err) {
      setError('Failed to mark medicine as taken');
      console.error(err);
    }
  };

  const handleRefill = (medicine) => {
    setSelectedMedicine(medicine);
    setShowRefillModal(true);
  };

  const handleRefillComplete = () => {
    fetchTodaysMedicines(); // Refresh the list after refill
  };

  const handleSymptomLogComplete = () => {
    setShowSymptomModal(false);
    setSelectedMedicine(null);
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container py-8">

      {showLowStockAlert && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-bold">Low Stock Alert!</h3>
            <p>Some of your medicines are running low. Please refill them soon.</p>
          </div>
          <button
            onClick={() => setShowLowStockAlert(false)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {/* Today's Reminders */}
        <div className="card" style={{ gridColumn: '1 / span 2' }}>
          <h2 className="text-xl font-bold mb-4">Today's Reminders</h2>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {todaysMedicines.length === 0 ? (
              <p>No medicines scheduled for today.</p>
            ) : (
              todaysMedicines.map((medicine, index) => (
                <div 
                  key={`${medicine.medicineId}-${index}`} 
                  className={`card bg-white ${medicine.lowStock ? 'border-2 border-red-300' : ''}`}
                > 
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{medicine.medicineName}</h3>
                        {medicine.lowStock && (
                          <span className="badge badge-error">Low Stock</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {medicine.dosage} - {new Date(medicine.scheduledTime).toLocaleTimeString()}
                      </p>
                      <p className="text-sm mt-1">
                        Pills remaining: {medicine.pillsRemaining}
                        {medicine.nextDepletionDate && (
                          <span className="text-gray-500 ml-2">
                            (Will deplete around {new Date(medicine.nextDepletionDate).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {medicine.status === 'pending' ? (
                        <button
                          onClick={() => handleMarkAsTaken(medicine.medicineId, medicine.scheduledTime)}
                          className="btn btn-secondary"
                        >
                          Mark as Taken
                        </button>
                      ) : (
                        <span className="badge badge-success">
                          Taken at {new Date(medicine.takenAt).toLocaleTimeString()}
                        </span>
                      )}
                      <button
                        onClick={() => handleRefill(medicine)}
                        className="btn btn-primary"
                      >
                        Refill Stock
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly Adherence Chart */}
        <div style={{ gridColumn: '1 / span 2' }}>
          <WeeklyAdherence />
        </div>
      </div>

      {showRefillModal && selectedMedicine && (
        <RefillModal
          medicine={selectedMedicine}
          onClose={() => {
            setShowRefillModal(false);
            setSelectedMedicine(null);
          }}
          onRefill={handleRefillComplete}
        />
      )}

      {showSymptomModal && selectedMedicine && (
        <SymptomLogModal
          medicine={selectedMedicine}
          onClose={() => {
            setShowSymptomModal(false);
            setSelectedMedicine(null);
          }}
          onSave={handleSymptomLogComplete}
        />
      )}
    </div>
  );
} 