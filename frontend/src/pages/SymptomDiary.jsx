import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function SymptomDiary() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    symptoms: '',
    painLevel: 5,
    mood: 'ok',
    sideEffects: '',
    notes: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/symptoms', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLogs(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch symptom logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/symptoms/stats/summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:4000/api/symptoms',
        {
          ...addFormData,
          date: new Date()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setShowAddForm(false);
      setAddFormData({
        symptoms: '',
        painLevel: 5,
        mood: 'ok',
        sideEffects: '',
        notes: ''
      });
      fetchLogs();
      fetchStats();
    } catch (err) {
      setError('Failed to add symptom log');
    }
  };

  const handleEdit = (log) => {
    setSelectedLog(log);
    setEditFormData({
      symptoms: log.symptoms || '',
      painLevel: log.painLevel,
      mood: log.mood,
      sideEffects: log.sideEffects || '',
      notes: log.notes || ''
    });
    setEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:4000/api/symptoms/${selectedLog._id}`,
        editFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setEditMode(false);
      setSelectedLog(null);
      fetchLogs();
      fetchStats();
    } catch (err) {
      setError('Failed to update symptom log');
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:4000/api/symptoms/${logId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchLogs();
      fetchStats();
    } catch (err) {
      setError('Failed to delete symptom log');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Symptom Diary</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          Add Symptom Log
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {/* Statistics and Charts */}
      {stats && (
        <div className="grid gap-6 mb-8">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Pain Level Trend</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={logs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="formattedDate"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis domain={[1, 10]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="painLevel"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Mood Distribution</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={[stats.moodDistribution]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="good" fill="#4ade80" name="Good" />
                  <Bar dataKey="ok" fill="#fbbf24" name="OK" />
                  <Bar dataKey="bad" fill="#f87171" name="Bad" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Common Symptoms</h2>
            <div className="space-y-2">
              {stats.commonSymptoms.map(({ symptom, count }) => (
                <div
                  key={symptom}
                  className="flex items-center gap-2"
                >
                  <div
                    className="bg-primary h-6"
                    style={{
                      width: `${(count / stats.totalLogs) * 100}%`,
                      minWidth: '2rem'
                    }}
                  />
                  <span>{symptom}</span>
                  <span className="text-gray-500">({count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-4">
        {logs.map(log => (
          <div
            key={log._id}
            className="card bg-white"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {log.mood === 'good' ? '😊' : log.mood === 'ok' ? '😐' : '😞'}
                  </span>
                  <span className="font-medium">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                  {log.medicineId && (
                    <span className="text-sm text-gray-500">
                      After taking {log.medicineId.name}
                    </span>
                  )}
                </div>
                <p className="mb-1">
                  <strong>Pain Level:</strong> {log.painLevel}/10
                </p>
                {log.symptoms && (
                  <p className="mb-1">
                    <strong>Symptoms:</strong> {log.symptoms}
                  </p>
                )}
                {log.sideEffects && (
                  <p className="mb-1">
                    <strong>Side Effects:</strong> {log.sideEffects}
                  </p>
                )}
                {log.notes && (
                  <p className="mt-2 text-gray-600">{log.notes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(log)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(log._id)}
                  className="btn btn-secondary"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Symptom Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Symptom Log</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">Mood</label>
                <div className="flex gap-4">
                  {['good', 'ok', 'bad'].map(mood => (
                    <label
                      key={mood}
                      className={`
                        flex-1 flex flex-col items-center p-3 rounded-lg cursor-pointer border-2
                        ${addFormData.mood === mood ? 'border-accent bg-primary' : 'border-secondary'}
                      `}
                      onClick={() => setAddFormData(prev => ({ ...prev, mood }))}
                    >
                      <span className="text-2xl mb-1">
                        {mood === 'good' ? '😊' : mood === 'ok' ? '😐' : '😞'}
                      </span>
                      <span className="capitalize">{mood}</span>
                      <input
                        type="radio"
                        name="mood"
                        value={mood}
                        checked={addFormData.mood === mood}
                        onChange={() => {}}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  Pain Level: {addFormData.painLevel}
                  <span className="text-sm text-gray-500 ml-2">(1-10)</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={addFormData.painLevel}
                  onChange={(e) => setAddFormData(prev => ({
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
                  value={addFormData.symptoms}
                  onChange={(e) => setAddFormData(prev => ({
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
                  value={addFormData.sideEffects}
                  onChange={(e) => setAddFormData(prev => ({
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
                  value={addFormData.notes}
                  onChange={(e) => setAddFormData(prev => ({
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
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMode && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Symptom Log</h2>
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelectedLog(null);
                }}
                className="close-button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="form-group">
                <label className="label">Mood</label>
                <div className="flex gap-4">
                  {['good', 'ok', 'bad'].map(mood => (
                    <label
                      key={mood}
                      className={`
                        flex-1 flex flex-col items-center p-3 rounded-lg cursor-pointer border-2
                        ${editFormData.mood === mood ? 'border-accent bg-primary' : 'border-secondary'}
                      `}
                      onClick={() => setEditFormData(prev => ({ ...prev, mood }))}
                    >
                      <span className="text-2xl mb-1">
                        {mood === 'good' ? '😊' : mood === 'ok' ? '😐' : '😞'}
                      </span>
                      <span className="capitalize">{mood}</span>
                      <input
                        type="radio"
                        name="mood"
                        value={mood}
                        checked={editFormData.mood === mood}
                        onChange={() => {}}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  Pain Level: {editFormData.painLevel}
                  <span className="text-sm text-gray-500 ml-2">(1-10)</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={editFormData.painLevel}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    painLevel: parseInt(e.target.value)
                  }))}
                  className="w-full"
                />
              </div>

              <div className="form-group">
                <label className="label">Symptoms</label>
                <input
                  type="text"
                  value={editFormData.symptoms}
                  onChange={(e) => setEditFormData(prev => ({
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
                  value={editFormData.sideEffects}
                  onChange={(e) => setEditFormData(prev => ({
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
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({
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
                  onClick={() => {
                    setEditMode(false);
                    setSelectedLog(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 