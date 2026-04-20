import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecommendationBanner = ({ recommendation, onDismiss }) => {
    const navigate = useNavigate();

    if (!recommendation) return null;

    return (
        <div style={{
            backgroundColor: '#f0f7f4',
            border: '1px solid #c3ddd4',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#5a8a75' }}>
                    {recommendation.reason}
                </p>
                <p
                    onClick={() => navigate(`/sets/${recommendation.setId}`)}
                    style={{
                        margin: 0,
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#2b5c3f',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {recommendation.title}
                    {recommendation.course && (
                        <span style={{ fontWeight: 400, color: '#666', marginLeft: '6px' }}>
                            · {recommendation.course}
                        </span>
                    )}
                    {recommendation.cardCount != null && (
                        <span style={{ fontWeight: 400, color: '#666', marginLeft: '6px' }}>
                            · {recommendation.cardCount} cards
                        </span>
                    )}
                </p>
            </div>
            <button
                onClick={onDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#888',
                    flexShrink: 0,
                    padding: '0 4px',
                    lineHeight: 1,
                }}
                title="Dismiss"
            >
                ✕
            </button>
        </div>
    );
};

export default RecommendationBanner;