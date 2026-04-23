import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { getGroup, getGroupMembers, getUniversity, getGroupLeaderboard, getGroupMessages, nudgeMember, leaveGroup, getLibraryItems, openPDF } from "../api.js";
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
    const stompClientRef = useRef(null);
    const sentClientIds = useRef(new Set());

    const [copiedInvite, setCopiedInvite] = useState(false);
    const [nudgedMembers, setNudgedMembers] = useState({});

    const [showPicker, setShowPicker] = useState(false);
    const [pickerItems, setPickerItems] = useState([]);
    const [pickerLoading, setPickerLoading] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        async function load() {
            try {
                const [groupData, membersData, uniData, leaderboardData, historyData] = await Promise.all([
                    getGroup(groupId),
                    getGroupMembers(groupId),
                    getUniversity(),
                    getGroupLeaderboard(groupId),
                    getGroupMessages(groupId),
                ]);
                setGroup(groupData);
                setMembers(membersData);
                setUniversity(uniData);
                setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
                setMessages(historyData.map(m => ({
                    id: m.id,
                    author: m.username,
                    text: m.text,
                    messageType: m.messageType ?? "TEXT",
                    materialId: m.materialId,
                    materialTitle: m.materialTitle,
                    materialType: m.materialType,
                    time: new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isMe: String(m.userId) === String(userId),
                    clientId: m.clientId,
                })));
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();

        const client = new Client({
            brokerURL: "ws://localhost:8080/ws",
            onConnect: () => {
                client.subscribe(`/topic/groups/${groupId}`, (frame) => {
                    const msg = JSON.parse(frame.body);
                    if (msg.clientId && sentClientIds.current.has(msg.clientId)) {
                        sentClientIds.current.delete(msg.clientId);
                        return;
                    }
                    setMessages(prev => [...prev, {
                        id: msg.id,
                        author: msg.username,
                        text: msg.text,
                        messageType: msg.messageType ?? "TEXT",
                        materialId: msg.materialId,
                        materialTitle: msg.materialTitle,
                        materialType: msg.materialType,
                        time: new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        isMe: String(msg.userId) === String(userId),
                        clientId: msg.clientId,
                    }]);
                });
            },
        });
        client.activate();
        stompClientRef.current = client;

        return () => { client.deactivate(); };
    }, [groupId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!showPicker) return;
        function onPointerDown(e) {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        }
        window.addEventListener("pointerdown", onPointerDown);
        return () => window.removeEventListener("pointerdown", onPointerDown);
    }, [showPicker]);

    function sendMessage(e) {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text || !stompClientRef.current?.connected) return;

        const me = members.find(m => String(m.user?.id) === String(userId));
        const username = me?.user?.username ?? "You";
        const clientId = crypto.randomUUID();

        sentClientIds.current.add(clientId);
        setMessages(prev => [...prev, {
            id: clientId,
            author: username,
            text,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
            clientId,
        }]);

        stompClientRef.current.publish({
            destination: `/app/groups/${groupId}/chat`,
            body: JSON.stringify({ userId, username, text, clientId }),
        });

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

    async function handleLeave() {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            await leaveGroup(groupId, userId);
            navigate(-1);
        } catch (e) {
            alert(e.message);
        }
    }

    async function handleOpenPicker() {
        setShowPicker(true);
        if (pickerItems.length > 0) return;
        setPickerLoading(true);
        try {
            const items = await getLibraryItems();
            setPickerItems(Array.isArray(items) ? items.filter(i => i.isPublic) : []);
        } catch {
            setPickerItems([]);
        } finally {
            setPickerLoading(false);
        }
    }

    function handleSendMaterial(item) {
        if (!stompClientRef.current?.connected) return;
        const me = members.find(m => String(m.user?.id) === String(userId));
        const username = me?.user?.username ?? "You";
        const clientId = crypto.randomUUID();

        sentClientIds.current.add(clientId);
        setMessages(prev => [...prev, {
            id: clientId,
            author: username,
            text: "",
            messageType: "MATERIAL",
            materialId: item.id,
            materialTitle: item.title,
            materialType: item.itemType,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
            clientId,
        }]);

        stompClientRef.current.publish({
            destination: `/app/groups/${groupId}/chat`,
            body: JSON.stringify({
                userId, username, text: "", clientId,
                messageType: "MATERIAL",
                materialId: item.id,
                materialTitle: item.title,
                materialType: item.itemType,
            }),
        });

        setShowPicker(false);
    }

    function handleNavigateMaterial(type, id) {
        if (type === "PDF") {
            openPDF(id);
        } else if (type === "CONCEPT_MAP") {
            navigate(`/concept-maps/${id}`);
        } else {
            navigate(`/sets/${id}`);
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
                {members.find(m => String(m.user?.id) === String(userId) && m.role !== "OWNER") && (
                    <button className="sgLeaveBtn" onClick={handleLeave}>Leave</button>
                )}
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
                                {msg.messageType === "MATERIAL" ? (
                                    <div
                                        className="sgMaterialCard"
                                        onClick={() => handleNavigateMaterial(msg.materialType, msg.materialId)}
                                    >
                                        <div className="sgMaterialCardName">{msg.materialTitle}</div>
                                        <div className="sgMaterialCardMeta">
                                            <span className={`sgMaterialTypeBadge sgMaterialTypeBadge--${msg.materialType?.toLowerCase()}`}>
                                                {msg.materialType?.replace(/_/g, " ")}
                                            </span>
                                            <span className="sgMaterialCardHint">Click to open →</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="sgMsgText">{msg.text}</span>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="sgChatFormWrap" ref={pickerRef}>
                        {showPicker && (
                            <div className="sgPicker">
                                <div className="sgPickerHeader">
                                    <span>Share from Library</span>
                                    <button className="sgPickerClose" onClick={() => setShowPicker(false)}>✕</button>
                                </div>
                                {pickerLoading ? (
                                    <p className="sgPickerEmpty">Loading…</p>
                                ) : pickerItems.length === 0 ? (
                                    <p className="sgPickerEmpty">No public items in your library.</p>
                                ) : (
                                    <div className="sgPickerGrid">
                                        {pickerItems.map(item => (
                                            <div
                                                key={item.id}
                                                className="sgPickerItem"
                                                onClick={() => handleSendMaterial(item)}
                                            >
                                                <div className="sgPickerItemName">{item.title}</div>
                                                <span className={`sgMaterialTypeBadge sgMaterialTypeBadge--${item.itemType?.toLowerCase()}`}>
                                                    {item.itemType?.replace(/_/g, " ")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <form className="sgChatForm" onSubmit={sendMessage}>
                            <button
                                className="sgPickerBtn"
                                type="button"
                                onClick={handleOpenPicker}
                                title="Share a library item"
                            >+</button>
                            <input
                                className="sgChatInput"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                            />
                            <button className="sgChatSendBtn" type="submit">Send</button>
                        </form>
                    </div>
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
