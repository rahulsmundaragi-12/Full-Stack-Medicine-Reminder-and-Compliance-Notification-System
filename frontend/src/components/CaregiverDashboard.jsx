import { useState, useEffect } from 'react';
import axios from 'axios';
import WeeklyAdherence from './WeeklyAdherence';
import DrugInteractions from './DrugInteractions';

export default function CaregiverDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMedicines();
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/caregivers/patients', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPatients(response.data);
      if (response.data.length > 0) {
        setSelectedPatient(response.data[0].userId);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientMedicines = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/intake/today', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          patientId: selectedPatient._id
        }
      });
      setMedicines(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch medicines');
      console.error(err);
    }
  };

  const handleMarkAsTaken = async (medicineId, scheduledTime) => {
    try {
      await axios.post(
        `http://localhost:4000/api/intake/taken/${medicineId}`,
        {
          scheduledTime,
          patientId: selectedPatient._id
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchPatientMedicines();
    } catch (err) {
      setError('Failed to mark medicine as taken');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (patients.length === 0) {
    return (
      <div className="container py-8">
        <div className="card">
          <p>You are not currently a caregiver for any patients.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Caregiver Banner */}
      <div className="bg-primary text-accent p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Caregiver View</h2>
            <p>
              Viewing as caregiver for:
              <select
                value={selectedPatient?._id}
                onChange={(e) => {
                  const patient = patients.find(p => p.userId._id === e.target.value);
                  setSelectedPatient(patient.userId);
                }}
                className="ml-2 bg-white rounded px-2 py-1"
              >
                {patients.map(patient => (
                  <option key={patient.userId._id} value={patient.userId._id}>
                    {patient.userId.name}
                  </option>
                ))}
              </select>
            </p>
          </div>
          <div>
            <span className="badge">
              {patients.find(p => p.userId._id === selectedPatient?._id)?.role === 'manage'
                ? 'Full Management'
                : 'View Only'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {/* Drug Interactions */}
      <DrugInteractions patientId={selectedPatient?._id} />

      {/* Today's Medicines */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Today's Medicines</h2>
        <div className="space-y-4">
          {medicines.length === 0 ? (
            <p>No medicines scheduled for today.</p>
          ) : (
            medicines.map((medicine, index) => (
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
                  {patients.find(p => p.userId._id === selectedPatient?._id)?.role === 'manage' && (
                    <div>
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
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Adherence */}
      <WeeklyAdherence patientId={selectedPatient?._id} />
    </div>
  );
} 