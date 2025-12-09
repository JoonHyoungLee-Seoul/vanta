import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './RegistrationForm.css';

function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { updateRegistrationData } = useEnrollment();

  const handleBack = () => {
    navigate('/invite');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.login(userId, password);

      if (result.ok) {
        // JWT 토큰 저장
        if (result.accessToken) {
          apiClient.setToken(result.accessToken);
        }

        // 로그인 성공 - userId를 컨텍스트에 저장
        updateRegistrationData({
          userId: result.userId,
          name: result.name
        });

        // 파티 목록으로 이동
        navigate('/parties');
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
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
          Log-in
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="text"
              className={`input-field ${userId ? 'active' : ''}`}
              placeholder="ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="input-group fade-in delay-2">
            <input
              type="password"
              className={`input-field ${password ? 'active' : ''}`}
              placeholder="PW"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
          </div>

          <div className="button-container fade-in delay-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!userId.trim() || !password.trim() || loading}
            >
              {loading ? '로그인 중...' : '→'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
