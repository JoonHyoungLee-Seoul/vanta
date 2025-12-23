import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import './Profile.css';

// 파티 데이터 매핑 (실제로는 백엔드에서 가져와야 하지만, 현재는 하드코딩)
const partyNames = {
  1: "After-Christmas Party"
};

function Profile() {
  const navigate = useNavigate();
  const { registrationData } = useEnrollment();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!registrationData.userId) {
      navigate('/login');
      return;
    }

    loadProfileData();
  }, [registrationData.userId, navigate]);

  const loadProfileData = async () => {
    try {
      const result = await apiClient.getUserProfile(registrationData.userId);
      if (result.ok) {
        setProfileData(result);
      } else {
        console.error('Failed to load profile:', result.message);
        // 실패해도 빈 프로필 데이터 설정
        setProfileData({
          ok: false,
          user: null,
          enrollments: [],
          couponSummary: { total: 0, used: 0, available: 0 }
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // 에러 발생 시에도 빈 프로필 데이터 설정
      setProfileData({
        ok: false,
        user: null,
        enrollments: [],
        couponSummary: { total: 0, used: 0, available: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBirthday = (birthday) => {
    if (!birthday || birthday.length !== 6) return birthday;
    // 990101 -> 99.01.01
    return `${birthday.slice(0, 2)}.${birthday.slice(2, 4)}.${birthday.slice(4, 6)}`;
  };

  const formatPhone = (phone) => {
    if (!phone || phone.length !== 11) return phone;
    // 01012345678 -> 010-1234-5678
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7, 11)}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page profile-page">
        <div className="profile-header">
          <Logo size="medium" />
        </div>
        <div className="profile-content">
          <p>Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="page profile-page">
        <div className="profile-header">
          <Logo size="medium" />
        </div>
        <div className="profile-content">
          <p>프로필 정보를 불러올 수 없습니다.</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <Logo size="medium" />
      </div>

      <div className="profile-content">
        <h2 className="profile-title">Profile</h2>

        {/* 프로필 기본 정보 */}
        {profileData.user ? (
          <div className="profile-info-card">
            <div className="profile-avatar">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div className="profile-details">
              <div className="profile-detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{profileData.user.name}</span>
              </div>

              <div className="profile-detail-item">
                <span className="detail-label">User ID</span>
                <span className="detail-value">{profileData.user.userId}</span>
              </div>

              <div className="profile-detail-item">
                <span className="detail-label">Birthday</span>
                <span className="detail-value">{formatBirthday(profileData.user.birthday)}</span>
              </div>

              <div className="profile-detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{formatPhone(profileData.user.phone)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-info-card">
            <p className="empty-message">프로필 정보를 불러올 수 없습니다.</p>
          </div>
        )}

        {/* 쿠폰 요약 */}
        <div className="coupon-summary-card">
          <h3 className="card-title">Coupon Summary</h3>
          <div className="coupon-stats">
            <div className="coupon-stat">
              <div className="stat-value">{profileData.couponSummary.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="coupon-stat">
              <div className="stat-value available">{profileData.couponSummary.available}</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="coupon-stat">
              <div className="stat-value used">{profileData.couponSummary.used}</div>
              <div className="stat-label">Used</div>
            </div>
          </div>
        </div>

        {/* 참가한 파티 목록 */}
        <div className="enrolled-parties-card">
          <h3 className="card-title">Enrolled Parties ({profileData.enrollments.length})</h3>
          {profileData.enrollments.length > 0 ? (
            <div className="party-list">
              {profileData.enrollments.map((enrollment) => (
                <div key={enrollment.partyId} className="party-item">
                  <div className="party-item-info">
                    <div className="party-item-name">
                      {partyNames[enrollment.partyId] || `Party #${enrollment.partyId}`}
                    </div>
                    <div className="party-item-date">
                      Enrolled: {formatDate(enrollment.enrolledAt)}
                    </div>
                  </div>
                  <div className="party-item-status">
                    {enrollment.status === 'pending' && (
                      <span className="status-badge pending">승인 대기중</span>
                    )}
                    {enrollment.status === 'rejected' && (
                      <span className="status-badge rejected">거절됨</span>
                    )}
                    {enrollment.status === 'approved' && (
                      <>
                        {enrollment.couponUsed ? (
                          <span className="status-badge used">Coupon Used</span>
                        ) : (
                          <span className="status-badge available">Coupon Available</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No parties enrolled yet</p>
          )}
        </div>

        {/* 관리자 전용 버튼 */}
        {profileData.user && (profileData.user.id === 1 || profileData.user.id === 2) && (
          <button className="admin-btn" onClick={() => navigate('/admin')}>
            Admin Dashboard
          </button>
        )}

        <button className="logout-btn" onClick={() => {
          navigate('/login');
        }}>
          Log out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default Profile;
