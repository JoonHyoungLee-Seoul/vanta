import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import './Payment.css';

function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enrollInParty } = useEnrollment();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const result = await apiClient.getPaymentInfo();
        if (result.ok) {
          setPaymentInfo(result.payment);
        }
      } catch (error) {
        console.error('Failed to fetch payment info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentInfo();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleComplete = async () => {
    if (submitting) {
      return; // 중복 클릭 방지
    }

    setSubmitting(true);
    try {
      const result = await enrollInParty(Number(id));
      console.log('Enrollment result:', result);
      navigate('/enrolled');
    } catch (error) {
      console.error('Enrollment error:', error);
      // 더 구체적인 에러 메시지
      if (error.message.includes('인증')) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      } else {
        alert('파티 참가에 실패했습니다: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading || !paymentInfo) {
    return (
      <div className="page payment-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page payment-page">
      <button className="back-button" onClick={handleBack}>
        ←
      </button>

      <div className="payment-content">
        <h1 className="payment-title fade-in">
          아래 계좌번호로 송금해주세요
        </h1>

        <div className="payment-details fade-in delay-1">
          <p className="bank-name">{paymentInfo.bankName}</p>
          <p
            className="account-number"
            onClick={() => handleCopy(paymentInfo.accountNumber)}
          >
            {paymentInfo.accountNumber}
          </p>
          <p className="payment-amount">{paymentInfo.amount.toLocaleString()} Won</p>
        </div>

        <div className="button-container fade-in delay-2">
          <button
            className="complete-btn"
            onClick={handleComplete}
            disabled={submitting}
          >
            {submitting ? '처리중...' : '완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payment;
