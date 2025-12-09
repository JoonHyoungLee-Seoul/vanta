import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const EnrollmentContext = createContext();

export function EnrollmentProvider({ children }) {
  // 회원가입 관련 상태
  const [registrationData, setRegistrationData] = useState(() => {
    const saved = sessionStorage.getItem('registrationData');
    return saved ? JSON.parse(saved) : {
      sessionId: null,
      invitationCode: null,
      name: null,
      password: null,
      birthday: null,
      phone: null,
      userId: null,
    };
  });

  useEffect(() => {
    sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
  }, [registrationData]);

  const enrollInParty = async (partyId) => {
    // API 호출하여 데이터베이스에 저장
    const userId = registrationData.userId;
    if (userId) {
      try {
        await apiClient.enrollParty(userId, partyId);
      } catch (error) {
        console.error('파티 참가 API 호출 실패:', error);
        throw error;
      }
    } else {
      throw new Error('로그인이 필요합니다.');
    }
  };

  // 회원가입 데이터 업데이트 함수들
  const updateRegistrationData = (data) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
  };

  const clearRegistrationData = () => {
    setRegistrationData({
      sessionId: null,
      invitationCode: null,
      name: null,
      password: null,
      birthday: null,
      phone: null,
      userId: null,
    });
    sessionStorage.removeItem('registrationData');
  };

  return (
    <EnrollmentContext.Provider value={{
      enrollInParty,
      registrationData,
      updateRegistrationData,
      clearRegistrationData,
    }}>
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const context = useContext(EnrollmentContext);
  if (!context) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
}