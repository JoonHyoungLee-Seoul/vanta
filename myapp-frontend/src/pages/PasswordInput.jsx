import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './RegistrationForm.css';

function PasswordInput() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useEnrollment();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }

    if (!registrationData.sessionId) {
      setError('세션이 만료되었습니다. 초대코드부터 다시 시작해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.savePassword(registrationData.sessionId, password);

      if (result.ok) {
        // userId를 저장
        updateRegistrationData({ userId: result.userId });

        // 파티 목록으로 이동 (세션 데이터는 유지)
        navigate('/parties');
      } else {
        setError(result.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isValid = password.trim() && confirmPassword.trim();

  return (
    <div className="page registration-page">
      <button className="back-button" onClick={handleBack}>
        ←
      </button>
      
      <div className="form-content form-content-with-back">
        <h1 className="page-title fade-in">
          비밀번호를 입력해주세요
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="password"
              className={`input-field ${password ? 'active' : ''}`}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="input-group fade-in delay-2">
            <input
              type="password"
              className={`input-field ${confirmPassword ? 'active' : ''}`}
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="button-container fade-in delay-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || loading}
            >
              {loading ? '회원가입 중...' : '다음'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordInput;

