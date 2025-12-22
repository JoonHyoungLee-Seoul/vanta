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
    title: "After-Christmas Party",
    date: 'Sat, DEC 27',
    time: '8:00pm - 2:00am',
    host: 'Woojin Park, Joonhyoung Lee',
    spotsLeft: 12,
    totalSpots: 50,
    location: '서울 강남구 압구정로48길 35 1층 (사파리 압구정)',
    description: '',
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
            src="/images/safari-logo.png"
            alt="Safari Social Bar"
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
