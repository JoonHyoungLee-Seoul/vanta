import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import './Admin.css';

// API Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vanta-production-9f79.up.railway.app';

function Admin() {
  const navigate = useNavigate();
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const partyNames = {
    1: "Say's Halloween Party"
  };

  useEffect(() => {
    loadPendingEnrollments();
  }, []);

  const loadPendingEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/enrollments/pending`, {
        headers: apiClient.getHeaders(true),
      });

      if (!response.ok) {
        throw new Error('Failed to load pending enrollments');
      }

      const data = await response.json();
      if (data.ok) {
        setPendingEnrollments(data.enrollments);
      }
    } catch (error) {
      console.error('Failed to load pending enrollments:', error);
      alert('승인 대기 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId) => {
    if (processingId) return;
    if (!confirm('이 참가 신청을 승인하시겠습니까?')) return;

    try {
      setProcessingId(enrollmentId);
      const response = await fetch(`${API_BASE_URL}/admin/enrollments/approve`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });

      const data = await response.json();
      if (data.ok) {
        alert('승인되었습니다!');
        // Remove from list
        setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      } else {
        throw new Error(data.message || '승인 실패');
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('승인에 실패했습니다: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (enrollmentId) => {
    if (processingId) return;
    if (!confirm('이 참가 신청을 거절하시겠습니까?')) return;

    try {
      setProcessingId(enrollmentId);
      const response = await fetch(`${API_BASE_URL}/admin/enrollments/reject`, {
        method: 'POST',
        headers: apiClient.getHeaders(true),
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });

      const data = await response.json();
      if (data.ok) {
        alert('거절되었습니다.');
        // Remove from list
        setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      } else {
        throw new Error(data.message || '거절 실패');
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert('거절에 실패했습니다: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatPhone = (phone) => {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  if (loading) {
    return (
      <div className="page admin-page">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>
        <div className="admin-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="admin-title">Enrollment Approvals</h1>
        <button className="refresh-btn" onClick={loadPendingEnrollments}>
          ↻ Refresh
        </button>
      </div>

      <div className="admin-content">
        <div className="pending-count">
          승인 대기중: <span className="count">{pendingEnrollments.length}</span>건
        </div>

        {pendingEnrollments.length === 0 ? (
          <div className="empty-state">
            <p>승인 대기 중인 참가 신청이 없습니다.</p>
          </div>
        ) : (
          <div className="enrollment-list">
            {pendingEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="enrollment-card">
                <div className="enrollment-info">
                  <div className="party-name">
                    {partyNames[enrollment.partyId] || `Party #${enrollment.partyId}`}
                  </div>
                  <div className="user-info">
                    <div className="info-row">
                      <span className="label">이름:</span>
                      <span className="value">{enrollment.user.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">ID:</span>
                      <span className="value">{enrollment.user.userId}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">연락처:</span>
                      <span className="value">{formatPhone(enrollment.user.phone)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">신청일:</span>
                      <span className="value">{formatDate(enrollment.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="enrollment-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(enrollment.id)}
                    disabled={processingId === enrollment.id}
                  >
                    {processingId === enrollment.id ? '처리중...' : '승인'}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(enrollment.id)}
                    disabled={processingId === enrollment.id}
                  >
                    {processingId === enrollment.id ? '처리중...' : '거절'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
