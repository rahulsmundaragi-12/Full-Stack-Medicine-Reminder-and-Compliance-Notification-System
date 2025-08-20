import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = formData;
      const response = await authApi.register(registrationData);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Register
          </button>

          <div className="text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 