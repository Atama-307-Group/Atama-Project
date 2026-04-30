import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourse, getGroupsByCourse, getUserGroups, createGroup, joinPublicGroup } from "../api.js";
import BackButton from "../components/BackButton.jsx";
import "./StudyGroupsListPage.css";

const StudyGroupsListPage = ({ userId }) => {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [course, setCourse] = useState(null);
    const [groups, setGroups] = useState([]);
    const [joinedIds, setJoinedIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createDesc, setCreateDesc] = useState("");
    const [createPrivacy, setCreatePrivacy] = useState("PUBLIC");
    const [createMaxMembers, setCreateMaxMembers] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const createModalRef = useRef(null);

    // Join state
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const [courseData, groupsData, membershipsData] = await Promise.all([
                    getCourse(courseId),
                    getGroupsByCourse(courseId),
                    getUserGroups(userId),
                ]);
                setCourse(courseData);
                setGroups(Array.isArray(groupsData) ? groupsData : []);
                const ids = new Set((membershipsData ?? []).map(m => String(m.group?.id)));
                setJoinedIds(ids);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [courseId, userId]);

    // Close create modal on outside click
    useEffect(() => {
        if (!showCreate) return;
        function onPointerDown(e) {
            if (createModalRef.current && !createModalRef.current.contains(e.target)) {
                setShowCreate(false);
            }
        }
        window.addEventListener("pointerdown", onPointerDown);
        return () => window.removeEventListener("pointerdown", onPointerDown);
    }, [showCreate]);

    // Close on Escape
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === "Escape") setShowCreate(false);
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    async function handleCreate(e) {
        e.preventDefault();
        if (!createName.trim()) return;
        setCreating(true);
        setCreateError("");
        try {
            const payload = {
                name: createName.trim(),
                description: createDesc.trim() || null,
                privacy: createPrivacy,
                maxMembers: createMaxMembers ? parseInt(createMaxMembers, 10) : null,
                course: { id: courseId },
            };
            const newGroup = await createGroup(payload, userId);
            setGroups(prev => [newGroup, ...prev]);
            setJoinedIds(prev => new Set([...prev, String(newGroup.id)]));
            setShowCreate(false);
            resetCreateForm();
        } catch (e) {
            setCreateError(e.message);
        } finally {
            setCreating(false);
        }
    }

    function resetCreateForm() {
        setCreateName("");
        setCreateDesc("");
        setCreatePrivacy("PUBLIC");
        setCreateMaxMembers("");
        setCreateError("");
    }

    async function handleJoin(groupId) {
        setJoiningId(groupId);
        try {
            await joinPublicGroup(groupId, userId);
            setJoinedIds(prev => new Set([...prev, String(groupId)]));
        } catch (e) {
            console.error(e);
        } finally {
            setJoiningId(null);
        }
    }

    if (loading) return <div className="sglPage"><p className="sglLoading">Loading…</p></div>;
    if (error) return <div className="sglPage"><p className="sglError">{error}</p></div>;

    return (
        <div className="sglPage">
            <header className="sglHeader">
                <BackButton onClick={() => navigate(`/course/${courseId}`)} />
                <div className="sglHeaderInfo">
                    <h1 className="sglTitle">Study Groups</h1>
                    <span className="sglSubtitle">
                        {course ? `${course.courseCode} — ${course.courseName}` : ""}
                    </span>
                </div>
                <button className="sglCreateBtn" onClick={() => { resetCreateForm(); setShowCreate(true); }}>
                    + Create Group
                </button>
            </header>

            {groups.length === 0 ? (
                <div className="sglEmpty">
                    <p>No study groups yet for this course.</p>
                    <button className="sglCreateBtn" onClick={() => { resetCreateForm(); setShowCreate(true); }}>
                        + Create the first one
                    </button>
                </div>
            ) : (
                <div className="sglGrid">
                    {groups.map(g => {
                        const joined = joinedIds.has(String(g.id));
                        return (
                            <div key={g.id} className="sglCard">
                                <div className="sglCardTop">
                                    <span className={`sglPrivacyBadge sglPrivacyBadge--${g.privacy?.toLowerCase()}`}>
                                        {g.privacy}
                                    </span>
                                    {g.maxMembers && (
                                        <span className="sglMaxBadge">Max {g.maxMembers}</span>
                                    )}
                                </div>
                                <h3 className="sglCardName">{g.name}</h3>
                                {g.description && (
                                    <p className="sglCardDesc">{g.description}</p>
                                )}
                                <div className="sglCardActions">
                                    {joined ? (
                                        <button
                                            className="sglOpenBtn"
                                            onClick={() => navigate(`/groups/${g.id}`)}
                                        >
                                            Open →
                                        </button>
                                    ) : g.privacy === "PUBLIC" ? (
                                        <button
                                            className="sglJoinBtn"
                                            disabled={joiningId === g.id}
                                            onClick={() => handleJoin(g.id)}
                                        >
                                            {joiningId === g.id ? "Joining…" : "Join"}
                                        </button>
                                    ) : (
                                        <span className="sglPrivateNote">Invite only</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreate && (
                <div className="sglOverlay">
                    <div className="sglModal" ref={createModalRef}>
                        <h2 className="sglModalTitle">Create Study Group</h2>
                        <form onSubmit={handleCreate} className="sglForm">
                            <label className="sglLabel">
                                Name <span className="sglRequired">*</span>
                                <input
                                    className="sglInput"
                                    value={createName}
                                    onChange={e => setCreateName(e.target.value)}
                                    placeholder="e.g. Midterm Prep Squad"
                                    maxLength={80}
                                    required
                                />
                            </label>
                            <label className="sglLabel">
                                Description
                                <textarea
                                    className="sglTextarea"
                                    value={createDesc}
                                    onChange={e => setCreateDesc(e.target.value.slice(0, 255))}
                                    placeholder="What's this group for?"
                                    rows={3}
                                    maxLength={255}
                                />
                            </label>
                            <div className="sglRow">
                                <label className="sglLabel">
                                    Privacy
                                    <select
                                        className="sglSelect"
                                        value={createPrivacy}
                                        onChange={e => setCreatePrivacy(e.target.value)}
                                    >
                                        <option value="PUBLIC">Public</option>
                                        <option value="PRIVATE">Private (invite only)</option>
                                    </select>
                                </label>
                                <label className="sglLabel">
                                    Max Members
                                    <input
                                        className="sglInput"
                                        type="number"
                                        min={2}
                                        max={500}
                                        value={createMaxMembers}
                                        onChange={e => setCreateMaxMembers(e.target.value)}
                                        placeholder="No limit"
                                    />
                                </label>
                            </div>
                            {createError && <p className="sglFormError">{createError}</p>}
                            <div className="sglModalActions">
                                <button
                                    type="button"
                                    className="sglCancelBtn"
                                    onClick={() => setShowCreate(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="sglSubmitBtn"
                                    disabled={creating || !createName.trim()}
                                >
                                    {creating ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyGroupsListPage;
