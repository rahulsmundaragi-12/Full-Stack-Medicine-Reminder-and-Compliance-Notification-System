import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function CaregiverJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    verifyInvite();
  }, []);

  const verifyInvite = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        setError('Invalid invite link');
        return;
      }

      const response = await axios.get(`http://localhost:4000/api/caregivers/invite/${token}`);
      setInvite(response.data.invite);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    try {
      const token = searchParams.get('token');
      await axios.post(
        `http://localhost:4000/api/caregivers/invite/${token}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="card">
          <p>Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Invalid Invite</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="card max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-6">Caregiver Invitation</h2>
        
        <div className="mb-6">
          <p className="mb-2">
            <strong>{invite.patientName}</strong> has invited you to be their caregiver.
          </p>
          <p className="mb-4">
            You will have <strong>{invite.role === 'manage' ? 'full management' : 'view only'}</strong> access
            to their medicine schedule and intake logs.
          </p>

          {!isLoggedIn ? (
            <div>
              <p className="mb-4">Please log in or create an account to accept this invitation.</p>
              <div className="flex gap-4">
                <Link to="/login" className="btn btn-primary">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-secondary">
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleAcceptInvite}
                className="btn btn-primary"
              >
                Accept Invitation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 