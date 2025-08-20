import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Medicines from './pages/Medicines';
import Logs from './pages/Logs';
import CaregiverJoin from './pages/CaregiverJoin';
import CaregiverDashboard from './components/CaregiverDashboard';
import CaregiverSettings from './components/CaregiverSettings';
import SymptomDiary from './pages/SymptomDiary';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if there's no token
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Redirect to dashboard if already logged in
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-neutral">
        {isAuthenticated && <Header />}
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines"
            element={
              <ProtectedRoute>
                <Medicines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <Logs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caregiver/join"
            element={<CaregiverJoin />}
          />
          <Route
            path="/caregiver/dashboard"
            element={
              <ProtectedRoute>
                <CaregiverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/caregivers"
            element={
              <ProtectedRoute>
                <CaregiverSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptom-diary"
            element={
              <ProtectedRoute>
                <SymptomDiary />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
