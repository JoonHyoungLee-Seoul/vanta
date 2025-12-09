import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bottom-nav">
      <button
        className={`nav-btn ${isActive('/parties') ? 'active' : ''}`}
        onClick={() => navigate('/parties')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>
      <button
        className={`nav-btn ${isActive('/coupon') ? 'active' : ''}`}
        onClick={() => navigate('/coupon')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 3H12H8C6.34 3 5 4.34 5 6v12c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V9.5L13.5 3zm3 16H8c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h4v5l2.5-1.5L17 10V6.83L16.17 6 13.5 8.67V3.83l2.67 2.67-.67.67 3-3V19c0 .55-.45 1-1 1z"/>
        </svg>
      </button>
      <button
        className={`nav-btn ${isActive('/profile') ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    </div>
  );
}

export default BottomNav;
