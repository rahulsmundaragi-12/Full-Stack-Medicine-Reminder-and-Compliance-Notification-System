import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DrugInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/drug-interactions/active', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setInteractions(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch drug interactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (interactionId) => {
    try {
      await axios.post(
        `http://localhost:4000/api/drug-interactions/${interactionId}/acknowledge`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      // Remove the acknowledged interaction from the list
      setInteractions(interactions.filter(i => i._id !== interactionId));
    } catch (err) {
      setError('Failed to acknowledge interaction');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading interactions...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  if (interactions.length === 0) {
    return null; // Don't show anything if there are no interactions
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Drug Interactions</h2>
      <div className="space-y-4">
        {interactions.map(interaction => (
          <div
            key={interaction._id}
            className={`p-4 rounded-lg border ${
              interaction.severity === 'major'
                ? 'bg-red-50 border-red-300'
                : interaction.severity === 'moderate'
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-blue-50 border-blue-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`badge ${
                      interaction.severity === 'major'
                        ? 'badge-error'
                        : interaction.severity === 'moderate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {interaction.severity.toUpperCase()}
                  </span>
                  <span className="font-medium">
                    {interaction.medicines.map(m => m.name).join(' + ')}
                  </span>
                </div>
                <p className="mb-2">{interaction.description}</p>
                {interaction.management && (
                  <div className="mt-2">
                    <strong className="text-sm">Management:</strong>
                    <p className="text-sm">{interaction.management}</p>
                  </div>
                )}
                {interaction.reference && (
                  <div className="mt-2">
                    <a
                      href={interaction.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Learn More
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAcknowledge(interaction._id)}
                className="close-button"
                title="Acknowledge"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 