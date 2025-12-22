import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import './EventDetail.css';

const eventData = {
  1: {
    id: 1,
    title: "Soy's Halloween Party",
    date: 'Friday, Oct 31',
    time: '10:00pm - 2:00am',
    host: 'Soy Park',
    spotsLeft: 12,
    totalSpots: 50,
    location: '서울시 강남구 테헤란로 12길 35 1층',
    description: `<하이엔드 프라이빗 와인모임 초대 안내>

안녕하세요. 저희는 상위 1%를 위한 프라이빗 소셜 네트워크, '그레이스 제이'입니다.

운영진의 직접 섭외 및 지인 추천을 통해서만 초대되는 형태로, 직업, 외모, 매력은 물론, 품격 있는 인성을 갖춘 분들만 엄선하여 진행됩니다.

모임은 승인제로 운영되며,
정기 와인모임을 비롯해 소규모 네트워킹, 하우스 파티, 경제·와인 스터디 등 다양한 형태의 만남을 비공개로 기획하고 있습니다.

남성 참가자 : 전문직, 사업가, 대기업 임직원, 공무원 등 다방면에서 매력과 실력을 갖춘 분들

여성 참가자 : 아나운서, 미스코리아, 모델, 승무원 등 커리어와 품위를 겸비한 분들`,
  },
};

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { registrationData } = useEnrollment();
  const event = eventData[id] || eventData[1];
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollmentStatus = async () => {
      const userId = registrationData.userId;
      if (userId) {
        try {
          const response = await apiClient.checkEnrollment(userId, id);
          setEnrolled(response.enrolled);
        } catch (error) {
          console.error('참가 상태 확인 실패:', error);
        }
      }
      setLoading(false);
    };

    fetchEnrollmentStatus();
  }, [id, registrationData.userId]);

  const handleEnroll = () => {
    navigate(`/payment/${id}`);
  };

  return (
    <div className="page event-detail-page">
      <header className="event-header fade-in">
        <Logo size="small" />
      </header>

      <div className="event-content">
        <h2 className="event-title fade-in delay-1">{event.title}</h2>
        
        <div className="halloween-banner fade-in delay-2">
          <img
            src="/images/party-main.png"
            alt="Party"
            className="halloween-image"
          />
        </div>

        <div className="event-info fade-in delay-3">
          <div className="event-date">
            <span className="date-day">{event.date}</span>
            <span className="date-time">{event.time}</span>
          </div>
          
          <div className="event-meta">
            <div className="meta-row">
              <span className="meta-label">Hosted by</span>
              <span className="host-badge">
                <span className="host-avatar-small">👤</span>
                {event.host}
              </span>
            </div>

            <div className="meta-row">
              <span className="location-icon">📍</span>
              {enrolled ? (
                <span className="location-revealed">{event.location}</span>
              ) : (
                <span className="location-text">
                  <strong>enroll</strong> to see location
                </span>
              )}
            </div>

            <div className="meta-row">
              <span className="spots-icon">👥</span>
              <span className="spots-text">{event.spotsLeft}/{event.totalSpots} spots left</span>
            </div>
          </div>
        </div>

        <div className="event-description fade-in delay-4">
          <p>{event.description}</p>
        </div>

        {!enrolled && (
          <div className="event-footer fade-in delay-5">
            <button className="enroll-button" onClick={handleEnroll}>
              Enroll
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default EventDetail;
