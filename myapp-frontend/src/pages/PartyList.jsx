import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import './PartyList.css';

const parties = [
  {
    id: 1,
    name: "Soy's 할로윈 파티",
    host: 'Soy Park',
    image: '/images/halloween-party.svg',
  },
];

function PartyList() {
  const navigate = useNavigate();
  const { registrationData } = useEnrollment();
  const [enrolledParties, setEnrolledParties] = useState({});

  useEffect(() => {
    const fetchEnrollmentStatuses = async () => {
      const userId = registrationData.userId;
      if (userId) {
        const statuses = {};
        for (const party of parties) {
          try {
            const response = await apiClient.checkEnrollment(userId, party.id);
            statuses[party.id] = response.enrolled;
          } catch (error) {
            console.error(`파티 ${party.id} 상태 확인 실패:`, error);
            statuses[party.id] = false;
          }
        }
        setEnrolledParties(statuses);
      }
    };

    fetchEnrollmentStatuses();
  }, [registrationData.userId]);

  const handleViewParty = (partyId) => {
    navigate(`/party/${partyId}`);
  };

  return (
    <div className="page party-list-page">
      <header className="party-header fade-in">
        <Logo size="small" />
      </header>

      <section className="party-section">
        <h2 className="section-title fade-in delay-1">Party List</h2>
        
        <div className="party-cards">
          {parties.map((party, index) => (
            <div 
              key={party.id} 
              className={`party-card fade-in delay-${index + 2}`}
              onClick={() => handleViewParty(party.id)}
            >
              <div className="party-image">
                <img src={party.image} alt={party.name} />
              </div>
              
              <div className="party-info">
                <h3 className="party-name">{party.name}</h3>
                
                <button
                  className="enroll-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewParty(party.id);
                  }}
                >
                  {enrolledParties[party.id] ? 'View' : 'Enroll'}
                </button>
                
                <div className="party-host">
                  <span className="host-avatar">👤</span>
                  <span className="host-name">{party.host}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

export default PartyList;
