import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const UserProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        fetch(`/api/users/${id}/profile`)
            .then(r => r.json())
            .then(setProfile);
    }, [id]);

    if (!profile) return <p style={{ padding: 32 }}>Loading…</p>;

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}>← Back</button>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                {profile.profilePictureUrl
                    ? <img src={profile.profilePictureUrl} style={{ width: 64, height: 64, borderRadius: "50%" }} />
                    : <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                }
                <h2>{profile.username}</h2>
            </div>
            <h3>Public Sets</h3>
            {profile.publicSets?.map(set => (
                <div key={set.id} className="recent-item" onClick={() => navigate(`/sets/${set.id}`)} style={{ cursor: "pointer" }}>
                    <p className="recent-title">🃏 {set.title}</p>
                    <p className="recent-meta">{set.cardCount} cards</p>
                </div>
            ))}
        </div>
    );
};

export default UserProfilePage;