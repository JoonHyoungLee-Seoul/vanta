import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './RegistrationForm.css';

function UserIdInput() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useEnrollment();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId.trim()) return;

    // 아이디 검증: 4-20자의 영문, 숫자 조합
    const userIdRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (!userIdRegex.test(userId)) {
      setError('4-20자의 영문, 숫자 조합만 가능합니다.');
      return;
    }

    if (!registrationData.sessionId) {
      setError('세션이 만료되었습니다. 초대코드부터 다시 시작해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.saveUserId(registrationData.sessionId, userId);

      if (result.ok) {
        updateRegistrationData({ userId });
        navigate('/register/password');
      } else {
        setError(result.message || '아이디 저장에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '아이디 저장 중 오류가 발생했습니다.');
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
          사용할 아이디를 입력해주세요
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="text"
              className={`input-field ${userId ? 'active' : ''}`}
              placeholder="아이디"
              value={userId}
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                if (value.length <= 20) {
                  setUserId(value);
                }
              }}
              maxLength={20}
              autoFocus
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
            <p className="input-hint">4-20자의 영문, 숫자 조합</p>
          </div>

          <div className="button-container fade-in delay-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!userId.trim() || loading}
            >
              {loading ? '저장 중...' : '다음'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserIdInput;
