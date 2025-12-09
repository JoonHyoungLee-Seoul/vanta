import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './InviteCode.css';

function InviteCode() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateRegistrationData } = useEnrollment();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.verifyInvitation(code);

      if (result.valid) {
        // Context에 세션 정보 저장
        updateRegistrationData({
          sessionId: result.sessionId,
          invitationCode: code,
        });

        // 다음 페이지로 이동
        navigate('/register/name');
      } else {
        setError(result.message || '초대코드가 유효하지 않습니다.');
      }
    } catch (err) {
      setError('초대코드 검증 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page invite-page">
      <div className="form-content">
        <h1 className="page-title fade-in">초대 코드를 입력하세요</h1>

        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="text"
              className={`input-field ${code ? 'active' : ''}`}
              placeholder="예시: TEST001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="button-container fade-in delay-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!code.trim() || loading}
            >
              {loading ? '확인 중...' : '다음'}
            </button>
          </div>
        </form>

        <div className="login-prompt fade-in delay-3">
          <p className="login-text">Already Registered?</p>
          <button
            className="btn btn-secondary login-arrow-btn"
            onClick={() => navigate('/login')}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteCode;