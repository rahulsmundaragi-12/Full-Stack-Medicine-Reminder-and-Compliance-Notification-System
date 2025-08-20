import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/intake/logs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLogs(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading logs...</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Medicine Intake Logs</h1>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Taken At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>{log.medicineId?.name || 'Unknown Medicine'}</td>
                  <td>{new Date(log.scheduledTime).toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        log.status === 'taken' ? 'badge-success' : 'badge-error'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td>
                    {log.takenAt ? new Date(log.takenAt).toLocaleString() : '-'}
                  </td>
                  <td>{log.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 