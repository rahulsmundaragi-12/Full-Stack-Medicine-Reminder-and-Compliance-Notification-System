import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CaregiverSettings() {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'view'
  });

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const fetchCaregivers = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/caregivers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCaregivers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch caregivers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:4000/api/caregivers/invite',
        inviteFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setShowInviteForm(false);
      setInviteFormData({ email: '', role: 'view' });
      fetchCaregivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const handleRemoveCaregiver = async (caregiverId) => {
    if (!window.confirm('Are you sure you want to remove this caregiver?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:4000/api/caregivers/${caregiverId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchCaregivers();
    } catch (err) {
      setError('Failed to remove caregiver');
    }
  };

  const handleNotificationUpdate = async (caregiverId, preferences) => {
    try {
      await axios.put(
        `http://localhost:4000/api/caregivers/${caregiverId}/notifications`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchCaregivers();
    } catch (err) {
      setError('Failed to update notification preferences');
    }
  };

  if (loading) {
    return <div>Loading caregivers...</div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Caregivers</h2>
        <button
          onClick={() => setShowInviteForm(true)}
          className="btn btn-primary"
        >
          Invite Caregiver
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {showInviteForm && (
        <div className="card mb-6">
          <h3 className="font-bold mb-4">Invite New Caregiver</h3>
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Role</label>
              <select
                value={inviteFormData.role}
                onChange={(e) => setInviteFormData(prev => ({
                  ...prev,
                  role: e.target.value
                }))}
                className="input"
              >
                <option value="view">View Only</option>
                <option value="manage">Full Management</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {caregivers.length === 0 ? (
          <p>No caregivers added yet.</p>
        ) : (
          caregivers.map(caregiver => (
            <div
              key={caregiver.userId._id}
              className="card bg-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{caregiver.userId.name}</h3>
                  <p className="text-sm text-gray-600">{caregiver.userId.email}</p>
                  <p className="text-sm mt-1">
                    Role: {caregiver.role === 'manage' ? 'Full Management' : 'View Only'}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveCaregiver(caregiver.userId._id)}
                  className="btn btn-secondary"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium mb-2">Notification Preferences</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={caregiver.notificationPreferences.missedDoses}
                      onChange={(e) => handleNotificationUpdate(caregiver.userId._id, {
                        ...caregiver.notificationPreferences,
                        missedDoses: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Missed Doses
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={caregiver.notificationPreferences.lowStock}
                      onChange={(e) => handleNotificationUpdate(caregiver.userId._id, {
                        ...caregiver.notificationPreferences,
                        lowStock: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Low Stock Alerts
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={caregiver.notificationPreferences.dailySummary}
                      onChange={(e) => handleNotificationUpdate(caregiver.userId._id, {
                        ...caregiver.notificationPreferences,
                        dailySummary: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Daily Summary
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 