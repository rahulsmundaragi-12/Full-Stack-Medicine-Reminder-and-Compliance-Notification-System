import React from 'react';

export default function GeminiDetailsModal({ details, onClose }) {
  if (!details) return null;

  // If Gemini returned a raw string or error
  if (details.error) {
    return (
      <div className="modal">
        <div className="modal-content">
          <h2 className="font-bold mb-2">Medicine Details</h2>
          <p className="text-red-600">{details.error}</p>
          <button className="btn btn-primary mt-4" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  if (details.raw) {
    return (
      <div className="modal">
        <div className="modal-content">
          <h2 className="font-bold mb-2">Medicine Details</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{details.raw}</pre>
          <button className="btn btn-primary mt-4" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal">
      <div className="modal-content max-w-lg p-6 bg-white rounded shadow-lg">
        <h2 className="font-bold text-xl mb-2">{details.name || 'Medicine Details'}</h2>
        {details.summary && <p className="mb-4">{details.summary}</p>}
        {details.common_side_effects && details.common_side_effects.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold">Common Side Effects</h3>
            <ul className="list-disc ml-6">
              {details.common_side_effects.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
        {details.serious_side_effects && details.serious_side_effects.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold text-red-600">Serious/Rare Side Effects</h3>
            <ul className="list-disc ml-6 text-red-600">
              {details.serious_side_effects.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
        {details.precautions && details.precautions.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold text-yellow-700">Precautions</h3>
            <ul className="list-disc ml-6 text-yellow-700">
              {details.precautions.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
        {details.expected_effects && details.expected_effects.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold">Expected Effects</h3>
            <ul className="list-disc ml-6">
              {details.expected_effects.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
        <button className="btn btn-primary mt-4" onClick={onClose}>Close</button>
      </div>
    </div>
  );
} 