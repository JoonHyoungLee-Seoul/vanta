import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.png';
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
      <img src={logoImage} alt="VANTA" className="vanta-logo-img" />
    </div>
  );
}

export default Logo;
