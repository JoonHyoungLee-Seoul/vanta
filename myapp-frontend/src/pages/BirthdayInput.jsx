import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './RegistrationForm.css';

function BirthdayInput() {
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useEnrollment();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!birthday.trim()) return;

    // 생년월일 검증: 6자리 숫자
    const birthdayRegex = /^\d{6}$/;
    if (!birthdayRegex.test(birthday)) {
      setError('6자리 숫자를 입력해주세요 (예: 990101).');
      return;
    }

    if (!registrationData.sessionId) {
      setError('세션이 만료되었습니다. 초대코드부터 다시 시작해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.saveBirthday(registrationData.sessionId, birthday);

      if (result.ok) {
        updateRegistrationData({ birthday });
        navigate('/register/phone');
      } else {
        setError(result.message || '생년월일 저장에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '생년월일 저장 중 오류가 발생했습니다.');
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
          생년월일을 입력해주세요
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="text"
              className={`input-field ${birthday ? 'active' : ''}`}
              placeholder="예시: 990101"
              value={birthday}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 6) {
                  setBirthday(value);
                }
              }}
              maxLength={6}
              autoFocus
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="button-container fade-in delay-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!birthday.trim() || loading}
            >
              {loading ? '저장 중...' : '다음'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BirthdayInput;
