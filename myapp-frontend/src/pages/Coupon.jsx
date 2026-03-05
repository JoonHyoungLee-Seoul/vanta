import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import './Coupon.css';

function Coupon() {
  const [coupons, setCoupons] = useState([]);
  const [showUsedModal, setShowUsedModal] = useState(false);
  const [usedCouponParty, setUsedCouponParty] = useState(null);
  const [usedCouponImage, setUsedCouponImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { registrationData } = useEnrollment();

  useEffect(() => {
    if (!registrationData.userId) {
      navigate('/login');
      return;
    }

    loadAllCoupons();
  }, [registrationData.userId]);

  const loadAllCoupons = async () => {
    try {
      // Get user profile with all enrollments
      const profileResult = await apiClient.getUserProfile(registrationData.userId);

      if (!profileResult.ok || !profileResult.enrollments || profileResult.enrollments.length === 0) {
        setLoading(false);
        return;
      }

      // Get party details for all enrolled parties
      const couponPromises = profileResult.enrollments
        .filter(enrollment => enrollment.status === 'approved') // Only approved enrollments
        .map(async (enrollment) => {
          try {
            const partyResult = await apiClient.getPartyDetail(enrollment.partyId);
            if (partyResult.ok) {
              return {
                partyId: enrollment.partyId,
                partyName: partyResult.party.name,
                partyImage: partyResult.party.image,
                couponUsed: enrollment.couponUsed,
                isArchived: partyResult.party.isArchived,
                isActive: partyResult.party.isActive,
                enrolledAt: enrollment.enrolledAt,
              };
            }
            return null;
          } catch (error) {
            console.error(`Failed to load party ${enrollment.partyId}:`, error);
            return null;
          }
        });

      const loadedCoupons = (await Promise.all(couponPromises)).filter(c => c !== null);
      setCoupons(loadedCoupons);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCoupon = async (partyId, partyName, partyImage) => {
    try {
      const result = await apiClient.useCoupon(registrationData.userId, partyId);
      if (result.ok) {
        // Update the coupon status locally
        setCoupons(coupons.map(coupon =>
          coupon.partyId === partyId
            ? { ...coupon, couponUsed: true }
            : coupon
        ));
        setUsedCouponParty(partyName);
        setUsedCouponImage(partyImage);
        setShowUsedModal(true);
      }
    } catch (err) {
      console.error('Failed to use coupon:', err);
      alert(err.message || '쿠폰 사용에 실패했습니다.');
    }
  };

  const closeModal = () => {
    setShowUsedModal(false);
    setUsedCouponParty(null);
    setUsedCouponImage(null);
  };

  const canUseCoupon = (coupon) => {
    // Can use if: not used AND party is active (not archived)
    return !coupon.couponUsed && !coupon.isArchived && coupon.isActive;
  };

  if (loading) {
    return (
      <div className="page coupon-page">
        <div className="coupon-header">
          <Logo size="medium" />
        </div>
        <div className="coupon-content">
          <p>Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page coupon-page">
      <div className="coupon-header">
        <Logo size="medium" />
      </div>

      <div className="coupon-content">
        <h2 className="coupon-title">My Coupons</h2>

        {coupons.length === 0 ? (
          <div className="empty-coupon-message">
            <p>사용가능한 쿠폰이 없습니다.</p>
          </div>
        ) : (
          <div className="coupon-list">
            {coupons.map((coupon) => (
              <div
                key={coupon.partyId}
                className={`coupon-card ${!canUseCoupon(coupon) ? 'disabled' : ''}`}
              >
                <div className="coupon-card-content">
                  <div className="coupon-image-container">
                    <img
                      src={coupon.partyImage || '/party-image.png'}
                      alt={coupon.partyName}
                      className="coupon-image"
                    />
                  </div>
                  <div className="coupon-info">
                    <p className="coupon-offer">1 Free drink</p>
                    <p className="coupon-party">{coupon.partyName}</p>
                    {coupon.isArchived && (
                      <p className="coupon-status archived">Party Closed</p>
                    )}
                  </div>
                </div>
                <div className="coupon-action">
                  {coupon.couponUsed ? (
                    <span className="coupon-used-label">Used</span>
                  ) : coupon.isArchived ? (
                    <span className="coupon-expired-label">Expired</span>
                  ) : (
                    <button
                      className="coupon-use-btn"
                      onClick={() => handleUseCoupon(coupon.partyId, coupon.partyName, coupon.partyImage)}
                      disabled={!canUseCoupon(coupon)}
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used Modal */}
      {showUsedModal && (
        <div className="coupon-modal" onClick={closeModal}>
          <div className="coupon-modal-content">
            <div className="coupon-modal-image-container">
              <img
                src={usedCouponImage || '/images/party-main.png'}
                alt="Party"
                className="coupon-modal-image"
              />
            </div>
            <h2 className="coupon-modal-title">Used!</h2>
            <p className="coupon-modal-subtitle">Show this to the merchant</p>
            {usedCouponParty && (
              <p className="coupon-modal-party">{usedCouponParty}</p>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Coupon;
