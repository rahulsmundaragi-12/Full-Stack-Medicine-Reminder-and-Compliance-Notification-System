import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to login
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          MedReminder
        </Link>
        
        <nav className="nav">
          <Link
            to="/dashboard"
            className={isActive('/dashboard')}
          >
            Dashboard
          </Link>
          <Link
            to="/medicines"
            className={isActive('/medicines')}
          >
            Medicines
          </Link>
          <Link
            to="/logs"
            className={isActive('/logs')}
          >
            Logs
          </Link>
          <Link
            to="/symptom-diary"
            className={isActive('/symptom-diary')}
          >
            Symptom Diary
          </Link>
          <Link
            to="/settings/caregivers"
            className={isActive('/settings/caregivers')}
          >
            Caregivers
          </Link>
          <button
            onClick={handleLogout}
            className="nav-link"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
} 