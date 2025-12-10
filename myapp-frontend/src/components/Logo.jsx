import { useNavigate } from 'react-router-dom';
import './Logo.css';

function Logo({ size = 'medium', className = '' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/parties');
  };

  return (
    <div 
      className={`vanta-logo vanta-logo-${size} ${className}`}
      onClick={handleClick}
    >
      <svg viewBox="0 0 200 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* V */}
        <path d="M0,2 L4,2 L16,28 L28,2 L32,2 L18,30 L14,30 Z" fill="currentColor"/>
        {/* A */}
        <path d="M44,30 L40,30 L54,2 L58,2 L72,30 L68,30 L64,21 L48,21 L44,30 Z M50,18 L62,18 L56,5 Z" fill="currentColor"/>
        {/* И (mirrored N) */}
        <path d="M84,2 L88,2 L88,24 L108,2 L112,2 L112,30 L108,30 L108,8 L88,30 L84,30 Z" fill="currentColor"/>
        {/* T */}
        <path d="M124,2 L160,2 L160,5 L144,5 L144,30 L140,30 L140,5 L124,5 Z" fill="currentColor"/>
        {/* A */}
        <path d="M168,30 L164,30 L178,2 L182,2 L196,30 L192,30 L188,21 L172,21 L168,30 Z M174,18 L186,18 L180,5 Z" fill="currentColor"/>
      </svg>
    </div>
  );
}

export default Logo;
