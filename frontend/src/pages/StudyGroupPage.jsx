import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGroup, getGroupMembers, getUniversity, getGroupLeaderboard, nudgeMember } from "../api.js";
import "./StudyGroupPage.css";

const StudyGroupPage = ({ userId }) => {
    const navigate = useNavigate();
    const { groupId } = useParams();

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [university, setUniversity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardTab, setLeaderboardTab] = useState("minutes");

    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef(null);

    const [copiedInvite, setCopiedInvite] = useState(false);
    const [nudgedMembers, setNudgedMembers] = useState({});

    useEffect(() => {
        async function load() {
            try {
                const [groupData, membersData, uniData, leaderboardData] = await Promise.all([
                    getGroup(groupId),
                    getGroupMembers(groupId),
                    getUniversity(),
                    getGroupLeaderboard(groupId),
                ]);
                setGroup(groupData);
                setMembers(membersData);
                setUniversity(uniData);
                setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [groupId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function sendMessage(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const me = members.find(m => String(m.user?.id) === String(userId));
        const username = me?.user?.username ?? "You";
        setMessages(prev => [...prev, {
            id: Date.now(),
            author: username,
            text: chatInput.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
        }]);
        setChatInput("");
    }

    async function handleNudge(targetUserId) {
        setNudgedMembers(prev => ({ ...prev, [targetUserId]: "sending" }));
        try {
            await nudgeMember(groupId, targetUserId, userId);
            setNudgedMembers(prev => ({ ...prev, [targetUserId]: "sent" }));
            setTimeout(() => setNudgedMembers(prev => ({ ...prev, [targetUserId]: null })), 3000);
        } catch {
            setNudgedMembers(prev => ({ ...prev, [targetUserId]: null }));
        }
    }

    function handleShareInvite() {
        const token = group?.inviteToken;
        const link = token
            ? `${window.location.origin}/join?token=${token}`
            : window.location.href;
        navigator.clipboard.writeText(link);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
    }

    const minutesBoard = [...leaderboard].sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
    const streakBoard = [...leaderboard].sort((a, b) => b.currentStreak - a.currentStreak);
    const activeBoard = leaderboardTab === "minutes" ? minutesBoard : streakBoard;

    if (loading) return <div className="sgPage"><p className="sgLoading">Loading...</p></div>;
    if (error) return <div className="sgPage"><p className="sgError">{error}</p></div>;

    return (
        <div className="sgPage">
            <header className="sgHeader">
                <button className="sgBackBtn" onClick={() => navigate(-1)}>←</button>
                <div className="sgHeaderInfo">
                    <h1 className="sgGroupName">{group.name}</h1>
                    <span className="sgHeaderMeta">
                        {group.course?.courseName ?? group.course?.courseCode}
                        {university?.name ? ` · ${university.name}` : ""}
                    </span>
                </div>
                <button className="sgShareBtn" onClick={handleShareInvite}>
                    {copiedInvite ? "Copied!" : "Share Invite"}
                </button>
            </header>

            <div className="sgBody">
                <section className="sgChatPanel">
                    <h2 className="sgPanelTitle">Group Chat</h2>
                    <div className="sgMessages">
                        {messages.length === 0 && (
                            <p className="sgEmptyChat">No messages yet. Say hello!</p>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`sgMessage ${msg.isMe ? "sgMessage--me" : ""}`}>
                                <div className="sgMsgHeader">
                                    <span className="sgMsgAuthor">{msg.author}</span>
                                    <span className="sgMsgTime">{msg.time}</span>
                                </div>
                                <span className="sgMsgText">{msg.text}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form className="sgChatForm" onSubmit={sendMessage}>
                        <input
                            className="sgChatInput"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button className="sgChatSendBtn" type="submit">Send</button>
                    </form>
                </section>

                <aside className="sgSidebar">
                    <section className="sgMembersPanel">
                        <h2 className="sgPanelTitle">
                            Members
                            <span className="sgMemberCount">
                                {members.length}{group.maxMembers ? ` / ${group.maxMembers}` : ""}
                            </span>
                        </h2>
                        <ul className="sgMemberList">
                            {members.map(m => {
                                const isMe = String(m.user?.id) === String(userId);
                                const nudgeState = nudgedMembers[m.user?.id];
                                return (
                                    <li key={m.id} className="sgMemberItem">
                                        <div className="sgAvatar">
                                            {m.user?.profilePictureUrl
                                                ? <img src={m.user.profilePictureUrl} alt={m.user.username} />
                                                : <span>{m.user?.username?.[0]?.toUpperCase() ?? "?"}</span>
                                            }
                                        </div>
                                        <span className="sgMemberName">{m.user?.username}</span>
                                        {m.role === "OWNER" && <span className="sgRoleBadge">Owner</span>}
                                        {!isMe && (
                                            <button
                                                className={`sgNudgeBtn${nudgeState === "sent" ? " sgNudgeBtn--sent" : ""}`}
                                                onClick={() => handleNudge(m.user?.id)}
                                                disabled={!!nudgeState}
                                                title="Send a nudge email"
                                            >
                                                {nudgeState === "sending" ? "..." : nudgeState === "sent" ? "Sent!" : "Nudge"}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    <section className="sgLeaderboardPanel">
                        <h2 className="sgPanelTitle">Leaderboard</h2>
                        <div className="sgLeaderboardTabs">
                            <button
                                className={`sgLeaderboardTab ${leaderboardTab === "minutes" ? "sgLeaderboardTab--active" : ""}`}
                                onClick={() => setLeaderboardTab("minutes")}
                            >
                                Weekly Study
                            </button>
                            <button
                                className={`sgLeaderboardTab ${leaderboardTab === "streak" ? "sgLeaderboardTab--active" : ""}`}
                                onClick={() => setLeaderboardTab("streak")}
                            >
                                Streak
                            </button>
                        </div>
                        <ol className="sgLeaderboard">
                            {activeBoard.map((entry, i) => (
                                <li
                                    key={entry.userId}
                                    className={[
                                        "sgLeaderboardItem",
                                        i === 0 ? "sgLeaderboardItem--gold" : "",
                                        i === 1 ? "sgLeaderboardItem--silver" : "",
                                        i === 2 ? "sgLeaderboardItem--bronze" : "",
                                    ].join(" ").trim()}
                                >
                                    <span className="sgLeaderboardRank">#{i + 1}</span>
                                    <div className="sgAvatar sgAvatar--sm">
                                        {entry.profilePictureUrl
                                            ? <img src={entry.profilePictureUrl} alt={entry.username} />
                                            : <span>{entry.username?.[0]?.toUpperCase() ?? "?"}</span>
                                        }
                                    </div>
                                    <span className="sgLeaderboardName">{entry.username}</span>
                                    <span className="sgLeaderboardStat">
                                        {leaderboardTab === "minutes"
                                            ? `${entry.weeklyMinutes} min`
                                            : `${entry.currentStreak} day${entry.currentStreak !== 1 ? "s" : ""}`
                                        }
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default StudyGroupPage;
