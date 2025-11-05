import React, { useEffect, useState, useRef, useMemo } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import AvatarWithSkeleton from './components/AvatarWithSkeleton';

const InboxPage = () => {
    const [loading, setLoading] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [fullScreenLoader, setFullScreenLoader] = useState(false);
    const [connectedAccountInfo, setConnectedAccountInfo] = useState([]);
    const [showPlatformList, setShowPlatformsList] = useState(false);
    const [pageFilter, setPageFilter] = useState('');
    const [selectedPlatform, setSelectPlatform] = useState(null);
    const dropdownRef = useRef(null);
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const socketRef = useRef(null);
    const storedToken = localStorage.getItem('authToken');
    const [userInfoJSON] = useState(() => localStorage.getItem('userinfo'));
    const RunGetMessages = useRef(false);

    const [message, setMessage] = useState('');
    const chatEndRef = useRef(null);
    const prevRoomRef = useRef(null);

    useEffect(() => {
        const socket = io(BACKEND_URL, {
            auth: { token: localStorage.getItem('authToken') },
            transports: ['websocket'],
        });
        socketRef.current = socket;

        /* join global room right after connect */
        socket.emit('join_conversation', JSON.parse(localStorage.getItem('userinfo'))?.userData?.uuid);

        return () => socket.disconnect();
    }, [BACKEND_URL]);

    useEffect(() => {
        const fetchData = async () => {
            setFullScreenLoader(true);
            try {
                await Promise.resolve(); // placeholder await
                const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
                if (userInfoData?.socialData) {
                    const connectedAccountsWithPages = userInfoData.socialData.filter(account =>
                        account.social_user_platform === 'facebook' &&
                        account.status === 'Connected' &&
                        Array.isArray(account.socialPage) &&
                        account.socialPage.some(page => page.status === 'Connected')
                    );
                    // console.log("Connected Accounts With Pages :", connectedAccountsWithPages);
                    
                    if (connectedAccountsWithPages.length > 0) {
                        // console.log("Selected Platform :", connectedAccountsWithPages[0]);
                        setSelectPlatform(connectedAccountsWithPages[0]);
                        setConnectedAccountInfo(connectedAccountsWithPages);
                        let PageData = [];
                        for (let account of connectedAccountsWithPages) {
                            account.socialPage.forEach(page => {
                                PageData.push(page);
                            });
                        }

                    } else {
                        toast.info('No connected accounts with pages found.');
                    }
                }
            } catch (error) {
                console.error('Parsing error:', error);
            } finally {
                setFullScreenLoader(false);
            }
        };
        fetchData();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowPlatformsList(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [localStorage.getItem('userinfo')]);

    useEffect(() => {
        if (selectedConversation?.conversation_id) {
            const newRoom = selectedConversation.conversation_id;

            if (prevRoomRef.current && prevRoomRef.current !== newRoom) {
                socketRef.current.emit('leave_conversation', prevRoomRef.current);
            }

            socketRef.current.emit('join_conversation', newRoom);
            prevRoomRef.current = newRoom;
        }

        return () => {
            if (prevRoomRef.current) {
                socketRef.current.emit('leave_conversation', prevRoomRef.current);
                prevRoomRef.current = null;
            }
        };
    }, [selectedConversation]);

    useEffect(() => {
        const s = socketRef.current;
        if (!s) return;

        const handle = msg => {
            console.log("received Message:",msg);
            setConversations(prev => {
                const draft = [...prev];
                upsertAndSort(draft, msg);   // ← adds the message once
                return draft;
            });

            /* ✅ add to open chat only if it ISN’T there yet */
            if ( selectedConversation?.conversation_id === msg.conversation_id && !selectedConversation.messages?.some(
                    m => m.platform_message_id === msg.platform_message_id
                )
            ) {
                setSelectedConversation(prev => {
                    if ( !prev || prev.conversation_id !== msg.conversation_id ||
                        prev.messages.some(m => m.platform_message_id === msg.platform_message_id)
                    ) {
                        return prev;
                    }

                    return { ...prev, messages: [...prev.messages, msg] };
                });
            }
        };

        s.on('refresh_sidebar', payload => {
            setConversations(prev => prev.map(c =>
                c.conversation_id === payload.conversation_id
                ? {
                    ...c,
                    snippet: payload.snippet,
                    last_activity: payload.timestamp || c.last_activity,
                    unreaded_messages:
                        selectedConversation?.conversation_id === c.conversation_id
                        ? c.unreaded_messages
                        : (c.unreaded_messages || 0) + (payload.unread_delta || 1)
                    }
                : c
            ));
        });

        s.on('receive_message', handle);
        s.on('global_inbox_update', handle);
        return () => {
            s.off('receive_message', handle);
            s.off('global_inbox_update', handle);
        };
    }, [selectedConversation]);

    const sendMessage = () => {
        if (!message.trim() || !selectedConversation) return;

        const msg = {
            conversation_id: selectedConversation.conversation_id,
            message_text: message.trim(),
            sender_type: 'page',
            timestamp: new Date().toISOString(),
            page_id: selectedConversation.page_id,
            recipient_id: selectedConversation.external_userid,
            platform: selectedPlatform?.social_user_platform || 'facebook',
        };

        socketRef.current.emit('send_message', msg);
        setMessage('');
        /*  The backend echo via global_inbox_update will now upsert & re‑sort sidebar automatically */
    };

    useEffect(() => {
        const fetchMessages = async () => {
            if (RunGetMessages.current) return;
            RunGetMessages.current = true;
            setFullScreenLoader(true);
            setLoading(true);

            try {
                const response = await fetch(`${BACKEND_URL}/api/messages`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + storedToken
                    }
                });

                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    const sortedData = data.data.sort((a, b) => {
                        const aTime = new Date(a.updated_time || a.messages?.slice(-1)?.timestamp || 0);
                        const bTime = new Date(b.updated_time || b.messages?.slice(-1)?.timestamp || 0);
                        return bTime - aTime;
                    });
                    setConversations(sortedData);
                } else {
                    setConversations([]);
                    toast.info('No conversations found.');
                }
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error('Error fetching messages.');
            } finally {
                setLoading(false);
                setFullScreenLoader(false);
                RunGetMessages.current = false;
            }
        };

        fetchMessages();
    }, []);

    const groupMessagesByDate = (messages) => {
        const grouped = {};
        messages.forEach(msg => {
            const date = new Date(msg.timestamp);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let label;
            if ( date.toDateString() === today.toDateString() ) {
                label = 'Today';
            } else if ( date.toDateString() === yesterday.toDateString() ) {
                label = 'Yesterday';
            } else {
                label = date.toLocaleDateString(undefined, {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
            }

            if (!grouped[label]) grouped[label] = [];
            grouped[label].push(msg);
        });
        return grouped;
    };

    useEffect(() => {
        if (chatEndRef.current && selectedConversation?.messages?.length > 0) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedConversation?.messages]);

    useEffect(() => {
        setPageFilter('');
        setSelectedConversation(null);
    }, [selectedPlatform]);

    const filteredConversations = useMemo(() => {
        if (!selectedPlatform) return [];
        const list = conversations.filter(
            c => c.platform?.toLowerCase().trim() === selectedPlatform.social_user_platform?.toLowerCase().trim() &&
                (pageFilter ? c.page_id === pageFilter : true)
        );
        return [...list].sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
    }, [conversations, selectedPlatform, pageFilter]);

    // if auth token refresh, reconnect the socket
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (socketRef.current && token) {
            socketRef.current.auth = { token };
            if (!socketRef.current.connected) socketRef.current.connect();
        }
    }, [localStorage.getItem('authToken')]);

    useEffect(() => {
        if (!userInfoJSON) return;
    }, [userInfoJSON]);

    useEffect(() => {
        setSelectedConversation(null);
    }, [pageFilter]);

    const upsertAndSort = (draft, payload, isOwn = false) => {
        const ts = payload.timestamp || new Date().toISOString();
        const idx = draft.findIndex(c => c.conversation_id === payload.conversation_id);

        // helper to initialise a conversation shell
        const makeConvo = () => ({
            conversation_id : payload.conversation_id,
            external_username : payload.external_username || 'Unknown',
            external_userid   : payload.external_userid,
            platform          : payload.platform,
            page_id           : payload.page_id,
            page_img          : payload.page_img,
            pageName          : payload.pageName,
            snippet           : payload.message_text,
            unreaded_messages : 0,
            messages          : [],
            last_activity     : ts
        });

        if (idx === -1) {
            const convo = makeConvo();
            convo.messages.push(payload);
            if (payload.sender_type === 'visitor') convo.unreaded_messages = 1;
            draft.unshift(convo);
        } else {
            const c = { ...draft[idx] };             // clone for reactivity
            if (!c.messages.some(m => m.platform_message_id === payload.platform_message_id)) {
                c.messages = [...c.messages, payload]; // new ref
            }
            c.snippet       = payload.message_text;
            c.last_activity = ts;

            if (!('unreaded_messages' in c)) c.unreaded_messages = 0;
            if ( payload.sender_type?.toLowerCase() === 'visitor' && selectedConversation?.conversation_id !== c.conversation_id ) 
            {
                c.unreaded_messages += 1;
            }

            draft.splice(idx, 1);   // remove old
            draft.unshift(c);       // push to top
        }
    };

    return (
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    {fullScreenLoader && (
                        <div className="fullscreen-loader-overlay">
                            <div className="fullscreen-loader-content">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>                                
                            </div>
                        </div>
                    )} 
                    {/* Header */}
                    <div className='page-title'>
                        <div className="d-flex justify-content-between align-items-center">
                            <div> 
                                <h1 className="mb-0 h1-heading">Inbox Messages</h1>
                                <p> Manage messages from all your social media platforms </p>
                            </div>
                            
                            {/* <div>
                                <div className="dropdown">
                                    <button className="btn custom-dropdown-toggle dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                        aria-expanded="false">  All Platforms  </button>
                                    <ul className="dropdown-menu custom-dropdown shadow">
                                        <li>
                                            <button className="dropdown-item" type="button">
                                            All Platforms
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" type="button">
                                            Facebook
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item active" type="button">
                                            Instagram
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" type="button">
                                            Twitter
                                            </button>
                                        </li>
                                        <li>
                                            <button className="dropdown-item" type="button">
                                            LinkedIn
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div> */}

                            <div style={{ display: 'flex', alignItems: 'center',}}>
                                <label htmlFor="pages-dropdown" className="my-auto" style={{ marginRight: 12, fontWeight: 500 }}>Select Platform:</label>
                                <div ref={dropdownRef} className="position-relative">
                                    <div className="form-control pe-4 custom-select-input" onClick={() => setShowPlatformsList(!showPlatformList)}>
                                        <div className="selected-pages-container">
                                            {selectedPlatform && selectedPlatform.status === 'Connected' ? (
                                                <div key={selectedPlatform.id} className="selected-page-item">
                                                    <img src={selectedPlatform.img_url} alt={selectedPlatform.name} className="selected-page-image"/>
                                                    {/* <span className="mr-2">
                                                        <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`}></i>
                                                    </span> */}
                                                    <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                            style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))", width: "25px", height: "25px" }} >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" >
                                                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7 a1 1 0 0 1 1-1h3z"></path>
                                                        </svg>
                                                    </div>
                                                    <div style={{ marginLeft: "10px" }}>
                                                        <span className="user-name">
                                                            <b>{selectedPlatform.name}</b>
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted">
                                                Select Platform to view messages
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {showPlatformList ? (
                                        <span className="position-absolute end-0 translate-middle-y me-2"
                                            style={{ cursor: "pointer", pointerEvents: "none", top: "20px",}}>
                                            <i className="fas fa-chevron-up text-muted" />
                                        </span>
                                    ) : (
                                        <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                            style={{ cursor: "pointer", pointerEvents: "none", }} >
                                            <i className="fas fa-chevron-down text-muted" />
                                        </span>
                                    )}
                                    {showPlatformList && (
                                        <div className="dropdown-content">
                                            <ul className="nested-checkbox-list">
                                                {connectedAccountInfo.length === 0 ? (
                                                    <li className="p-2 text-danger">Connect your account</li>
                                                ) : (
                                                    connectedAccountInfo.map((socialUser) => (
                                                        <li key={socialUser.id} className="parent-item" onClick={() => { setSelectPlatform(socialUser); setShowPlatformsList(false);}}
                                                            style={{ cursor: "pointer", padding: "10px 15px", display: "flex", alignItems: "center" }}>
                                                            <div className="d-flex align-items-center">
                                                                <img className="user-avatar" src={socialUser.img_url} alt="Profile"
                                                                    onError={(e) => { e.target.src = "/default-avatar.png"; }}
                                                                    style={{ width: "40px", height: "40px", }}/>
                                                                {/* <span className="mr-2">
                                                                    <i className={`fa-brands fa-${socialUser.social_user_platform} text-primary fs-5`}></i>
                                                                </span> */}
                                                                <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                        style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))", width: "25px", height: "25px" }} >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" >
                                                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7 a1 1 0 0 1 1-1h3z"></path>
                                                                    </svg>
                                                                </div>
                                                                <div style={{ marginLeft: "10px" }}>
                                                                    <span className="user-name">
                                                                        <b>{socialUser.name}</b>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Inbox Layout */}
                   <div className="row inbox-container mb-3 px-2" style={{ height: '75vh' }}>
                        {/* Sidebar */}
                        {/* <div className="col-md-3 inbox-sidebar border-end" style={{ overflowY: 'auto', height: '100%' }}> */}
                        <div className="col-md-4">
                            <div className='card'>  
                                <div className="d-flex justify-content-between align-items-center p-3 ">
                                    <div className="d-flex gap-2 align-items-center"> 
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle h-4 w-4 mr-2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>
                                    <h6 className="mb-0 h6-heading">Messages</h6>
                                    </div>
                                    <button className="btn btn-sm btn-light messages-filter-btn" onClick={() => setShowFilter(prev => !prev)}>
                                        {/* <i className="fas fa-filter"></i> */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18 " height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter h-4 w-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                    </button>
                                </div>

                                <div> 
                                    <div className="search-container d-flex align-items-center gap-2 p-3 pt-0">
                                        {/* <i className="fas fa-search search-icon"></i> */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search h-4 w-4 text-gray-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                                        <input type="text" className="form-control search-input" placeholder="Search messages..." />
                                    </div>
                                </div>

                                {showFilter && (
                                    <div className="p-3 pt-0">
                                        <label className="fw-semibold mb-1" style={{ fontSize: ".75rem" }}>Filter by Pages</label>
                                        <select className="form-select" value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
                                            <option value="">All Pages</option>
                                            {(selectedPlatform?.socialPage || []).filter((p) => p.status == "Connected").map((p) => (
                                                <option key={p.pageId} value={p.pageId}>
                                                    {p.pageName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className='inbox-sidebar card'> 
                                {filteredConversations.length === 0 ? (
                                    <div className="p-4 text-center text-muted">
                                        No messages yet.
                                    </div>
                                ) : (
                                    filteredConversations.map((convo) => {
                                        const isActive = selectedConversation?.conversation_id === convo.conversation_id;
                                        return (
                                            
                                            <div key={convo.conversation_id}
                                                onClick={async () => {
                                                    await fetch(`${BACKEND_URL}/api/messages/mark-read/${convo.conversation_id}`, {
                                                        method: 'PATCH',
                                                        headers: { Authorization: `Bearer ${storedToken}` }
                                                    });

                                                    setConversations(p =>
                                                        p.map(c =>
                                                        c.conversation_id === convo.conversation_id
                                                            ? { ...c, unreaded_messages: 0 }
                                                            : c
                                                        )
                                                    );

                                                    setSelectedConversation({
                                                        ...convo,
                                                        messages: [...(convo.messages || [])].sort(
                                                            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                                                        )
                                                    });
                                                }}
                                                className={`username-card rounded cursor-pointer d-flex align-items-center ${isActive ? '' : ''}`}
                                                style={{ transition: 'background-color 0.2s', cursor: 'pointer',  }}
                                            >
                                                <div style={{ position: 'relative', width: 40, height: 40, marginRight: 14 }}>
                                                    {/* Large Profile Image */}
                                                    <AvatarWithSkeleton
                                                        src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`}
                                                        alt="Page Avatar" className="rounded-circle"
                                                        onError={e => {
                                                            e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`;
                                                        }}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                                                            border: isActive ? '2px solid #fff' : '2px solid #eee'
                                                        }}
                                                    />

                                                    {/* Container for overlapping icons */}
                                                    <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                                                        {/* Page Icon (small image) - slightly overlapped */}
                                                        <img src={convo.page_img || `${process.env.PUBLIC_URL}/assets/images/user/profile-img.png`}
                                                            alt="Page Icon"
                                                            onError={e => {
                                                                e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/user/profile-img.png`;
                                                            }}
                                                            style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #fff',
                                                                objectFit: 'cover', position: 'absolute', bottom: -4, right: 0, zIndex: 1,
                                                                boxShadow: '0 0 2px rgba(0, 0, 0, 0.2)'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Name + snippet */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="fw-bold d-flex justify-content-between align-items-center">
                                                        <span className="text-truncate">
                                                            {convo.external_username || 'Unknown'}
                                                        </span>

                                                        {/* <div className="d-flex gap-1 justify-content-between align-items-center" style={{ fontSize: "11px"}}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-warning">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            <span style={{ color: "rgb(107 114 128)"}}> 2 mins ago </span>
                                                        </div> */}

                                                        {/* ✅ Unread badge */}
                                                        {convo.unreaded_messages > 0 && (
                                                            <span className="chat-indicator-wrapper d-flex align-items-center">
                                                                {/* <span className="unread-indicator animated-pulse" /> */}
                                                                <span className="ms-1 small fw-semibold badge bg-danger">{convo.unreaded_messages}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="" style={{ color: isActive ? '#888' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {convo.messages?.[0]?.sender_type === 'page' ? 'You: ' : `${convo.external_username || 'User'}: `}
                                                        {convo.snippet || 'No preview available'}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        );
                                    })
                                )}
                            </div>
                        
                        </div>

                        {/* Chat Window  */}
                        <div className="col-md-8 custom-container bg-white" style={{ display: 'flex', flexDirection: 'column', height: '100%',borderRadius: '10px' }}>
                           <div className='messages-scrolling' style={{margin:"auto 0px"}}>
                                {!selectedConversation ? (
                                    <div className="text-center text-muted mt-5">
                                        {/* <h5>Select a conversation to view messages</h5> */}
                                    <div className="d-flex flex-column gap-3 justify-content-center align-items-center">
                                        <div className='mb-0'> 
                                            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle h-12 w-12 text-gray-400 mx-auto"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg> 
                                        </div>
                                        <h5 className='h5-heading'> Please Select a Chat. </h5>
                                        <div style={{ color:'rgb(107 114 128)', fontSize: '16px'}}>   Select a conversation to view messages   </div>
                                    </div>
                                        
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-3 bg-white border-bottom p-3 rounded" style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                                            <div className="d-flex gap-1">
                                                <AvatarWithSkeleton
                                                    src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`}
                                                    alt="Page Avatar" className="rounded-circle me-2"
                                                    onError={e => {
                                                        e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`;
                                                    }}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', border: '2px solid #fff', margin: "0px 10px" }}
                                                />
                                                <div>
                                                    <h6 className="mb-1 h6-heading">{selectedConversation.external_username}</h6>
                                                    <div className="small" style={{ color: 'rgb(107 114 128)',fontWeight:'400',fontSize:'14px'}}>
                                                        <span className="">{selectedConversation.pageName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedConversation.messages?.length === 0 ? (
                                            <div className="text-muted">No messages in this conversation yet.</div>
                                        ) : (
                                            <>
                                            {Object.entries(groupMessagesByDate(selectedConversation.messages)).map(([dateLabel, msgs]) => (
                                                <div key={dateLabel}>
                                                    <div className="text-center text-muted mb-2 mt-3 fw-semibold">{dateLabel}</div>
                                                    {msgs.map((msg, idx) => (
                                                        <div key={idx} className={`mb-3 ${msg.sender_type === 'page' ? 'text-end' : 'text-start'}`}>
                                                            <div className="d-inline-block px-3 py-2 rounded" style={{
                                                                background: msg.sender_type === 'page' ? '#e0f7fa' : '#f1f1f1', maxWidth: '60%'
                                                            }}>
                                                                {msg.message_text}
                                                            </div>
                                                            <div className="small text-muted mt-1">
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                            <div ref={chatEndRef}></div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Input area */}
                            {selectedConversation ? (
                                <div style={{ padding: '12px 24px', borderTop: '1px solid #eee', background: '#fafafa' }}>
                                    <form className="d-flex gap-2" action="javascript:void(0);" onSubmit={(e) => {
                                            e.preventDefault();
                                            sendMessage(); // 🔁 Trigger send on Enter or button
                                        }}>
                                        <input type="text" value={message} className="form-control" placeholder="Type a message..."
                                            onChange={e => setMessage(e.target.value)} style={{ flex: 1 }}/>
                                        <button type="submit" className="btn btn-primary messages-send-btn "> 
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send h-4 w-4"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                                            </button>
                                    </form>
                                </div>
                            ) : (
                                <div></div>
                            )}
                        </div>

                        {/* Right Details Panel */}
                        {/* <div className="col-md-3 border-start p-3">
                            {selectedConversation ? (
                                <>
                                    <h6 className="mb-3">Person Details</h6>
                                    <div className="mb-4">
                                        <div className="fw-semibold">{selectedConversation.external_username}</div>
                                        <div className="text-muted small">User ID: {selectedConversation.external_userid}</div>
                                    </div>
                                    <h6 className="mb-3">Page Info</h6>
                                    <div>
                                        <div className="text-muted small">Platform: <span className="bg-success text-light px-1 rounded"
                                            >{selectedConversation.platform.toUpperCase() || 'Unknown'}</span></div>
                                        <div className="text-muted small">Page Name: {selectedConversation.pageName}</div>
                                        <div className="text-muted small">Conversation ID: {selectedConversation.conversation_id}</div>
                                    </div>
                                </>
                            ) : (
                                <h5 className="text-muted text-center">Please Select a Chat.</h5>
                            )}
                        </div> */}
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export default InboxPage;
