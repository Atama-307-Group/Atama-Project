import React, { useState } from 'react';
import './ReportModal.css';

const REPORT_TYPES = [
    { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
    { value: 'PRIVACY',        label: 'Privacy violation' },
    { value: 'ACADEMIC_MISCONDUCT', label: 'Academic misconduct' },
    { value: 'SPAM',           label: 'Spam' },
    { value: 'OTHER',          label: 'Other' },
];

const API_BASE = 'http://localhost:8080';

const ReportModal = ({ targetType, targetId, onClose }) => {
    const [selectedType, setSelectedType] = useState('');
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedType) { setError('Please select a reason.'); return; }
        if (!description.trim()) { setError('Please add a description.'); return; }

        setLoading(true);
        setError('');

        try {
            const body = {
                type: selectedType,
                description: description.trim(),
                ...(targetType === 'user'  && { reportedUserId: targetId }),
                ...(targetType === 'item'  && { reportedLibraryItemId: targetId }),
            };

            const res = await fetch(`${API_BASE}/api/reports`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Failed to submit report');
            setSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rpt-overlay" onClick={onClose}>
            <div className="rpt-modal" onClick={e => e.stopPropagation()}>
                {submitted ? (
                    <div className="rpt-success">
                        <div className="rpt-success-icon">✓</div>
                        <p className="rpt-success-title">Report submitted</p>
                        <p className="rpt-success-body">
                            Thanks for letting us know. We'll review this and take action if needed.
                        </p>
                        <button className="rpt-btn-primary" onClick={onClose}>Done</button>
                    </div>
                ) : (
                    <>
                        <div className="rpt-header">
                            <p className="rpt-title">Report</p>
                            <button className="rpt-close" onClick={onClose}>✕</button>
                        </div>

                        <p className="rpt-label">What's the issue?</p>
                        <div className="rpt-type-list">
                            {REPORT_TYPES.map(rt => (
                                <button
                                    key={rt.value}
                                    className={`rpt-type-btn ${selectedType === rt.value ? 'selected' : ''}`}
                                    onClick={() => setSelectedType(rt.value)}
                                >
                                    {rt.label}
                                </button>
                            ))}
                        </div>

                        <p className="rpt-label">Description</p>
                        <textarea
                            className="rpt-textarea"
                            placeholder="Describe the issue..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            maxLength={500}
                        />
                        <p className="rpt-char-count">{description.length}/500</p>

                        {error && <p className="rpt-error">{error}</p>}

                        <div className="rpt-footer">
                            <button className="rpt-btn-secondary" onClick={onClose}>Cancel</button>
                            <button
                                className="rpt-btn-primary"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit report'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportModal;