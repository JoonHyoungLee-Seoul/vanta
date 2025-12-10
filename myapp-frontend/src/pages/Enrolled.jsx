import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrolled.css';

function Enrolled() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/parties');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="page enrolled-page">
      <div className="enrolled-content">
        <h1 className="enrolled-title fade-in">참가 신청 완료!</h1>
        <p className="enrolled-subtitle fade-in delay-1">
          운영진의 확인 후 승인됩니다
        </p>
        <p className="enrolled-location fade-in delay-2">
          @서울시 강남구 테헤란로 12길 35 1층
        </p>
      </div>
    </div>
  );
}

export default Enrolled;
