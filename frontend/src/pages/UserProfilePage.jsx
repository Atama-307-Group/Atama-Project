import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserProfilePage.css";
import ReportModal from '../components/ReportModal';

const UserProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/users/${username}/profile`)
            .then(r => {
                if (!r.ok) throw new Error("User not found");
                return r.json();
            })
            .then(data => { setProfile(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [username]);

    if (loading) return (
        <div className="user-profile-page">
            <p className="user-profile-loading">Loading…</p>
        </div>
    );

    if (error) return (
        <div className="user-profile-page">
            <button className="user-profile-back" onClick={() => navigate(-1)}>← Back</button>
            <p className="user-profile-error">{error}</p>
        </div>
    );

    return (
        <div className="user-profile-page">
            <button className="user-profile-back" onClick={() => navigate(-1)}>← Back</button>

            {/* Profile card */}
            <div className="user-profile-card">
                <button className="user-profile-report-btn" onClick={() => setShowReport(true)} title="Report user">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                </button>
                {profile.profilePictureUrl ? (
                    <img
                        src={profile.profilePictureUrl}
                        alt={profile.username}
                        className="user-profile-avatar-img"
                    />
                ) : (
                    <div className="user-profile-avatar">
                        {profile.username.charAt(0).toUpperCase()}
                    </div>
                )}
                <p className="user-profile-username">{profile.username}</p>
                <p className="user-profile-set-count">
                    {profile.publicSets?.length ?? 0} public set{profile.publicSets?.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Public sets */}
            {profile.publicSets?.length > 0 ? (
                <>
                    <p className="user-profile-section-label">Flashcard sets</p>
                    <div className="user-profile-sets">
                        {profile.publicSets.map(set => (
                            <div
                                key={set.id}
                                className="user-profile-set-item"
                                onClick={() => navigate(`/sets/${set.id}`)}
                            >
                                <div className="user-profile-set-left">
                                    <p className="user-profile-set-title">{set.title}</p>
                                    <p className="user-profile-set-meta">
                                        {set.courseCode ? `${set.courseCode} · ` : ""}
                                        {set.cardCount} card{set.cardCount !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <div className="user-profile-set-right">
                                    {set.averageRating != null ? (
                                        <span className="user-profile-rating">
                                            ★ {set.averageRating.toFixed(1)}
                                        </span>
                                    ) : (
                                        <span className="user-profile-no-rating">No reviews</span>
                                    )}
                                    <span className="user-profile-arrow">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="user-profile-empty">This user has no public sets yet.</p>
            )}

        {showReport && (
            <ReportModal
                targetType="user"
                targetId={profile.id}
                onClose={() => setShowReport(false)}
            />
        )}
        </div>
    );
};

export default UserProfilePage;