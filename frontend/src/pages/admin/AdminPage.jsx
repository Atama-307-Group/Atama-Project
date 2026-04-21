import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const AdminPage = ({ currentUser, onLogout }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('reports');
    const [reports, setReports] = useState([]);
    const [courseRequests, setCourseRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [successModal, setSuccessModal] = useState(null); // { name, university }


    const API_BASE = 'http://localhost:8080';

    useEffect(() => {
        fetchReports();
        fetchCourseRequests();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/reports`, { credentials: 'include' });
            if (res.ok) setReports(await res.json());
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseRequests = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/course-requests`, { credentials: 'include' });
            if (res.ok) setCourseRequests(await res.json());
        } catch (err) {
            console.error('Failed to fetch course requests:', err);
        }
    };

    const handleReport = async (id, action) => {
        try {
            await fetch(`${API_BASE}/api/admin/reports/${id}/${action}`, {
                method: 'PATCH',
                credentials: 'include',
            });
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Failed to update report:', err);
        }
    };

    const handleCourseRequest = async (id, action) => {
        try {
            await fetch(`${API_BASE}/api/admin/course-requests/${id}/${action}`, {
                method: 'PATCH',
                credentials: 'include',
            });
            setCourseRequests(prev => prev.map(r =>
                r.id === id
                    ? { ...r, status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'PENDING' }
                    : r
            ));

            // Show success modal on approve
            if (action === 'approve') {
                const approved = courseRequests.find(r => r.id === id);
                if (approved) {
                    setSuccessModal({ name: `${approved.code} — ${approved.name}`, university: approved.universityName });
                }
            }
        } catch (err) {
            console.error('Failed to update course request:', err);
        }
    };

    const formatTime = (instant) => {
        if (!instant) return '';
        const diff = Date.now() - new Date(instant).getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${mins}m ago`;
    };

    const formatReportTarget = (report) => {
        if (report.reportedUsername) return `Reported user: @${report.reportedUsername}`;
        if (report.reportedItemTitle) return `Reported item: ${report.reportedItemTitle}`;
        return 'Unknown target';
    };

    const formatReportType = (type) => {
        const map = {
            INAPPROPRIATE: 'Inappropriate content',
            PRIVACY: 'Privacy violation',
            ACADEMIC_MISCONDUCT: 'Academic misconduct',
            SPAM: 'Spam',
            OTHER: 'Other',
        };
        return map[type] || type;
    };

    const pendingReports = reports.filter(r => r.status === 'PENDING');
    const pendingCourseRequests = courseRequests.filter(r => r.status === 'PENDING');

    return (
        <div className="adm">
            <div className="adm-topbar">
                <div className="adm-topbar-left">
                    <span className="adm-logo">Atama</span>
                    <span className="adm-badge">Admin</span>
                </div>
                <button className="adm-logout-btn" onClick={onLogout}>Log Out</button>
            </div>

            <div className="adm-body">
                <p className="adm-greeting-sub">Welcome back,</p>
                <p className="adm-greeting-name">{currentUser?.username || 'Admin'}</p>

                <div className="adm-stat-grid">
                    <div className="adm-stat">
                        <p className="adm-stat-label">Pending reports</p>
                        <p className="adm-stat-val">{pendingReports.length}</p>
                        <p className="adm-stat-sub">
                            <span className="adm-stat-dot" style={{ background: '#EF9F27' }} />
                            Needs review
                        </p>
                    </div>
                    <div className="adm-stat">
                        <p className="adm-stat-label">Course requests</p>
                        <p className="adm-stat-val">{pendingCourseRequests.length}</p>
                        <p className="adm-stat-sub">
                            <span className="adm-stat-dot" style={{ background: '#77BFA3' }} />
                            Awaiting approval
                        </p>
                    </div>
                </div>

                <div className="adm-tabs">
                    <button
                        className={`adm-tab ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        Reports
                    </button>
                    <button
                        className={`adm-tab ${activeTab === 'courses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('courses')}
                    >
                        Course Requests
                    </button>
                </div>

                {loading ? (
                    <p className="adm-empty">Loading...</p>
                ) : activeTab === 'reports' ? (
                    <>
                        <p className="adm-section-label">Pending reports</p>
                        {pendingReports.length === 0 ? (
                            <p className="adm-empty">No pending reports</p>
                        ) : (
                            <div className="adm-card-list">
                                {pendingReports.map(report => (
                                    <div key={report.id} className="adm-card">
                                        <div className="adm-card-info">
                                            <p className="adm-card-title">{formatReportTarget(report)}</p>
                                            <p className="adm-card-meta">
                                                {formatReportType(report.type)}
                                                {report.user && ` · Reported by @${report.user.username}`}
                                                {report.description && ` · "${report.description}"`}
                                                {` · ${formatTime(report.createdAt)}`}
                                            </p>
                                        </div>
                                        <span className="adm-pill adm-pill-pending">Pending</span>
                                        <div className="adm-actions">
                                            <button
                                                className="adm-btn adm-btn-approve"
                                                onClick={() => handleReport(report.id, 'resolve')}
                                            >
                                                Mark as Resolved
                                            </button>
                                            <button
                                                className="adm-btn adm-btn-reject"
                                                onClick={() => handleReport(report.id, 'dismiss')}
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="adm-section-label">Course requests</p>
                        {pendingCourseRequests.length === 0 ? (
                            <p className="adm-empty">No pending course requests</p>
                        ) : (
                            <div className="adm-card-list">
                                {pendingCourseRequests.map(req => (
                                    <div key={req.id} className="adm-card">
                                        <div className="adm-card-info">
                                            <p className="adm-card-title">{req.code} - {req.name}</p>
                                            <p className="adm-card-meta">
                                                {req.requesterUsername && `Requested by @${req.requesterUsername}`}
                                                {req.universityName && ` · ${req.universityName}`}
                                                {` · ${formatTime(req.createdAt)}`}
                                            </p>
                                        </div>
                                        <span className={`adm-pill ${req.status === 'REJECTED' ? 'adm-pill-rejected' : 'adm-pill-new'}`}>
                                            {req.status === 'REJECTED' ? 'Rejected' : 'New'}
                                        </span>
                                        <div className="adm-actions">
                                            {req.status === 'REJECTED' ? (
                                                <button
                                                    className="adm-btn adm-btn-restore"
                                                    onClick={() => handleCourseRequest(req.id, 'restore')}
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <>
                                                    <button className="adm-btn adm-btn-approve" onClick={() => handleCourseRequest(req.id, 'approve')}>Approve</button>
                                                    <button className="adm-btn adm-btn-reject" onClick={() => handleCourseRequest(req.id, 'reject')}>Reject</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {successModal && (
                <div className="adm-modal-overlay" onClick={() => setSuccessModal(null)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()}>
                        <div className="adm-modal-icon">✓</div>
                        <p className="adm-modal-title">Course Added Successfully</p>
                        <p className="adm-modal-body">
                            <strong>{successModal.name}</strong> has been approved and added to{' '}
                            <strong>{successModal.university}</strong>.
                        </p>
                        <button className="adm-btn adm-btn-approve adm-modal-close" onClick={() => setSuccessModal(null)}>
                            Done
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminPage;