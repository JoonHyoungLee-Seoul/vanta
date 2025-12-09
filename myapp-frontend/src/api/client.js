const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'auth_token';

class ApiClient {
  // Token management
  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  logout() {
    // 토큰 삭제
    this.removeToken();
    // 필요시 추가 로그아웃 로직 (서버 알림 등)
  }

  // Get headers with optional authorization
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle 401 Unauthorized errors
  handleUnauthorized() {
    // 토큰 삭제
    this.removeToken();
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  }

  // Common fetch wrapper with error handling
  async fetchWithErrorHandling(url, options) {
    try {
      const response = await fetch(url, options);

      // 401 Unauthorized - 토큰 만료 또는 유효하지 않음
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }

      return response;
    } catch (error) {
      // Network error or other issues
      throw error;
    }
  }

  async verifyInvitation(invitationCode) {
    const response = await fetch(`${API_BASE_URL}/auth/invitation/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invitation_code: invitationCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '초대코드 검증 실패');
    }

    return response.json();
  }

  async login(userId, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        password: password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '로그인 실패');
    }

    return response.json();
  }

  async saveName(sessionId, name) {
    const response = await fetch(`${API_BASE_URL}/auth/register/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        name: name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '이름 저장 실패');
    }

    return response.json();
  }

  async saveBirthday(sessionId, birthday) {
    const response = await fetch(`${API_BASE_URL}/auth/register/birthday`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        birthday: birthday,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '생년월일 저장 실패');
    }

    return response.json();
  }

  async savePhone(sessionId, phone) {
    const response = await fetch(`${API_BASE_URL}/auth/register/phone`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        phone: phone,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '휴대폰 저장 실패');
    }

    return response.json();
  }

  async saveUserId(sessionId, userId) {
    const response = await fetch(`${API_BASE_URL}/auth/register/userid`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '아이디 저장 실패');
    }

    return response.json();
  }

  async savePassword(sessionId, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        password: password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '비밀번호 저장 실패');
    }

    const result = await response.json();

    // 회원가입 완료 시 자동으로 JWT 토큰 저장
    if (result.ok && result.accessToken) {
      this.setToken(result.accessToken);
    }

    return result;
  }

  async enrollParty(userId, partyId) {
    const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/enroll`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        user_id: userId,
        party_id: partyId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '파티 참가 실패');
    }

    return response.json();
  }

  async checkEnrollment(userId, partyId) {
    const response = await fetch(`${API_BASE_URL}/enrollment/check/${userId}/${partyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('참가 상태 확인 실패');
    }

    return response.json();
  }

  async getCoupon(userId, partyId) {
    const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/coupon/${userId}/${partyId}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('쿠폰 조회 실패');
    }

    return response.json();
  }

  async useCoupon(userId, partyId) {
    const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/coupon/use`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        user_id: userId,
        party_id: partyId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '쿠폰 사용 실패');
    }

    return response.json();
  }

  async getUserProfile(userId) {
    const response = await this.fetchWithErrorHandling(`${API_BASE_URL}/profile/${userId}`, {
      method: 'GET',
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('프로필 조회 실패');
    }

    return response.json();
  }

  async getPaymentInfo() {
    const response = await fetch(`${API_BASE_URL}/payment/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('결제 정보 조회 실패');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();