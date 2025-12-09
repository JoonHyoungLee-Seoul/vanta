import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './RegistrationForm.css';

function PhoneInput() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useEnrollment();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone.trim()) return;

    // 휴대폰 번호 검증: 010으로 시작하는 11자리 숫자
    const phoneRegex = /^010\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('010으로 시작하는 11자리 숫자를 입력해주세요.');
      return;
    }

    if (!registrationData.sessionId) {
      setError('세션이 만료되었습니다. 초대코드부터 다시 시작해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.savePhone(registrationData.sessionId, phone);

      if (result.ok) {
        updateRegistrationData({ phone });
        navigate('/register/userid');
      } else {
        setError(result.message || '휴대폰 번호 저장에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '휴대폰 번호 저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page registration-page">
      <button className="back-button" onClick={handleBack}>
        ←
      </button>
      
      <div className="form-content form-content-with-back">
        <h1 className="page-title fade-in">
          휴대폰번호를 입력해주세요
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="tel"
              className={`input-field ${phone ? 'active' : ''}`}
              placeholder="01012345678"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 11) {
                  setPhone(value);
                }
              }}
              maxLength={11}
              autoFocus
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="button-container fade-in delay-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!phone.trim() || loading}
            >
              {loading ? '저장 중...' : '다음'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PhoneInput;
