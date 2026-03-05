import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnrollment } from '../context/EnrollmentContext';
import { apiClient } from '../api/client';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import './PartyList.css';

function PartyList() {
  const navigate = useNavigate();
  const { registrationData } = useEnrollment();
  const [parties, setParties] = useState([]);
  const [enrolledParties, setEnrolledParties] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parties from API (include archived to show all)
        const partiesResponse = await apiClient.getParties(true);
        if (partiesResponse.ok) {
          setParties(partiesResponse.parties);
        }

        // Fetch enrollment statuses
        const userId = registrationData.userId;
        if (userId && partiesResponse.ok) {
          const statuses = {};
          for (const party of partiesResponse.parties) {
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
      } catch (error) {
        console.error('파티 목록 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [registrationData.userId]);

  const handleViewParty = (partyId) => {
    navigate(`/party/${partyId}`);
  };

  if (loading) {
    return (
      <div className="page party-list-page">
        <header className="party-header fade-in">
          <Logo size="medium" />
        </header>
        <div className="party-section">
          <p>Loading...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Split parties into active and archived
  const activeParties = parties.filter(party => !party.isArchived);
  const archivedParties = parties.filter(party => party.isArchived);

  return (
    <div className="page party-list-page">
      <header className="party-header fade-in">
        <Logo size="medium" />
      </header>

      {/* Active Parties Section */}
      {activeParties.length > 0 && (
        <section className="party-section">
          <h2 className="section-title fade-in delay-1">Party List</h2>

          <div className="party-cards">
            {activeParties.map((party, index) => (
              <div
                key={party.id}
                className={`party-card fade-in delay-${index + 2}`}
                onClick={() => handleViewParty(party.id)}
              >
                <div className="party-image">
                  <img src={party.image || '/images/party-main.png'} alt={party.name} />
                </div>

                <div className="party-info">
                  <h3 className="party-name">{party.name}</h3>

                  <button
                    className="enroll-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewParty(party.id);
                    }}
                    disabled={!party.isActive}
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
      )}

      {/* Closed Parties Section */}
      {archivedParties.length > 0 && (
        <section className="party-section closed-section">
          <h2 className="section-title fade-in">Closed Party List</h2>

          <div className="party-cards">
            {archivedParties.map((party, index) => (
              <div
                key={party.id}
                className={`party-card archived fade-in`}
                onClick={() => handleViewParty(party.id)}
              >
                <div className="party-image">
                  <img src={party.image || '/images/party-main.png'} alt={party.name} />
                  <div className="archived-badge">Closed</div>
                </div>

                <div className="party-info">
                  <h3 className="party-name">{party.name}</h3>

                  <button
                    className="enroll-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewParty(party.id);
                    }}
                    disabled
                  >
                    Closed
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
      )}

      <BottomNav />
    </div>
  );
}

export default PartyList;
