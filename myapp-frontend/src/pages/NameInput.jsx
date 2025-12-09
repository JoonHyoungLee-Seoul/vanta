import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './RegistrationForm.css';

function NameInput() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { registrationData, updateRegistrationData } = useEnrollment();

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (!registrationData.sessionId) {
      setError('세션이 만료되었습니다. 초대코드부터 다시 시작해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await apiClient.saveName(registrationData.sessionId, name);

      if (result.ok) {
        updateRegistrationData({ name });
        navigate('/register/birthday');
      } else {
        setError(result.message || '이름 저장에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '이름 저장 중 오류가 발생했습니다.');
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
        <h1 className="page-title fade-in">이름을 입력해주세요</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group fade-in delay-1">
            <input
              type="text"
              className={`input-field ${name ? 'active' : ''}`}
              placeholder="박우진"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {error && <p className="input-error">{error}</p>}
            {!error && <p className="input-hint">실명을 기준해주세요</p>}
          </div>

          <div className="button-container fade-in delay-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || loading}
            >
              {loading ? '저장 중...' : '다음'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NameInput;
