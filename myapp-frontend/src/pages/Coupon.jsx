import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import './Coupon.css';

function Coupon() {
  const [couponUsed, setCouponUsed] = useState(false);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasNoCoupon, setHasNoCoupon] = useState(false);
  const navigate = useNavigate();
  const { registrationData } = useEnrollment();

  // For now, hardcoding partyId as 1 (Say's Halloween Party)
  const partyId = 1;

  useEffect(() => {
    if (!registrationData.userId) {
      navigate('/login');
      return;
    }

    loadCouponStatus();
  }, []);

  const loadCouponStatus = async () => {
    try {
      const result = await apiClient.getCoupon(registrationData.userId, partyId);
      if (result.ok) {
        setCouponUsed(result.couponUsed);
        setHasNoCoupon(false);
      } else {
        // 참가하지 않은 파티 - 쿠폰 없음 상태로 설정
        setHasNoCoupon(true);
      }
    } catch (err) {
      console.error('Failed to load coupon:', err);
      // 에러 발생 시에도 쿠폰 없음으로 처리
      setHasNoCoupon(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCoupon = async () => {
    try {
      const result = await apiClient.useCoupon(registrationData.userId, partyId);
      if (result.ok) {
        setCouponUsed(true);
        setShowUsedModal(true);
      }
    } catch (err) {
      console.error('Failed to use coupon:', err);
      alert(err.message || '쿠폰 사용에 실패했습니다.');
    }
  };

  const closeModal = () => {
    setShowUsedModal(false);
  };

  if (loading) {
    return <div className="page coupon-page">Loading...</div>;
  }

  return (
    <div className="page coupon-page">
      <div className="coupon-header">
        <Logo size="medium" />
      </div>

      <div className="coupon-content">
        <h2 className="coupon-title">Coupon</h2>

        {hasNoCoupon ? (
          <div className="empty-coupon-message">
            <p>사용가능한 쿠폰이 없습니다.</p>
          </div>
        ) : (
          <div className="coupon-card">
            <div className="coupon-card-content">
              <div className="coupon-image-container">
                <img
                  src="/party-image.png"
                  alt="Party"
                  className="coupon-image"
                />
              </div>
              <div className="coupon-info">
                <p className="coupon-offer">1 Free drink</p>
                <p className="coupon-party">Say's Halloween Party</p>
              </div>
            </div>
            <div className="coupon-action">
              {couponUsed ? (
                <span className="coupon-used-label">Used</span>
              ) : (
                <button className="coupon-use-btn" onClick={handleUseCoupon}>
                  Use
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Used Modal */}
      {showUsedModal && (
        <div className="coupon-modal" onClick={closeModal}>
          <div className="coupon-modal-content">
            <div className="coupon-modal-image-container">
              <img
                src="/party-image.png"
                alt="Party"
                className="coupon-modal-image"
              />
            </div>
            <h2 className="coupon-modal-title">Used!</h2>
            <p className="coupon-modal-subtitle">Show this to the merchant</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Coupon;
