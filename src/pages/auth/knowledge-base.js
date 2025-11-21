import React, { useState, useEffect } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ConnectedUserSocialAccountAndPage from "./components/ConnectedUserSocialAccountAndPage";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'react-toastify';

export default function KnowledgeBase() {    
    const [connectedSocialAccount, setConnectedSocialAccount] = useState([]); 
    const [expandedAccounts, setExpandedAccounts] = useState({});
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [selectedPages, setSelectedPages] = useState([]);
    const [knowledgeBaseData, setKnowledgeBaseData] = useState({ 
        knowledgeBaseTitle:'',        
        knowledgeBaseContent:'',
    });
    const [loading, setLoading] = useState(false);
    const [savedKnowledgebaseData, setSavedKnowledgebaseData] = useState([]);
    const [openIndex, setOpenIndex] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [editIndex, setEditIndex] = useState(null);
    const [editKnowledgeBaseData, setEditKnowledgeBaseData] = useState({
        editknowledgeBaseTitle:'',        
        editknowledgeBaseContent:'',
        editknowledgeBaseStatus:'',
        editknowledgeBaseSocialDataDetail:'',        
    });
    const [savingIndex, setSavingIndex] = useState(null);
    
    const [editPageChecked, setEditPageChecked] = useState([]);
    const [savedPageChecked, setSavedPageChecked] = useState([]);

    useEffect(() => {        
        const fetchConnectUserData = async () => {            
            try {
                const rawUserInfo = localStorage.getItem('userinfo');                
                const userInfoData = JSON.parse(rawUserInfo);                 
                if(userInfoData.socialData && Array.isArray(userInfoData.socialData)) {
                    const connectedAccounts = userInfoData.socialData.filter(
                        (account) => account.status === "Connected"
                    );
                    setConnectedSocialAccount(connectedAccounts);
                } else {
                    setConnectedSocialAccount([]); 
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        };
        fetchConnectUserData();
        //console.log('connectedSocialAccount', connectedSocialAccount);
    },[]);   

    // Start Code For Add New Entey Tab
        useEffect(() => {
            const fetchKnowledgebaseData = async () => {
                await fetchKnowledgebase();
            };
            fetchKnowledgebaseData();
        }, []);

        const tabsClick = async () => {           
            setOpenIndex(null);
            setKnowledgeBaseData({
                knowledgeBaseTitle: "",
                knowledgeBaseContent: "",
            });
            setExpandedAccounts({});
            setSelectedPlatforms([]);
            setSelectedPages([]);            
        };

        const fetchKnowledgebase = async () => {
            setLoading(true);
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const authToken = localStorage.getItem('authToken'); 
            try {
                const response = await fetch(`${BACKEND_URL}/api/knowledgebase`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    }                    
                });                
                const data = await response.json();
                //console.log('data',data);
                if(data.success===true){
                    setSavedKnowledgebaseData(data.data);
                }
                                    
            } catch (error) {
                console.error("Error fetching knowledge base details:", error);            
            } finally {
                setLoading(false);
            }
        }

        // Filter platform-wise
        const facebookAccounts = connectedSocialAccount.filter(
            (acc) => acc.social_user_platform === "facebook"
        );        
    
        // ✅ Toggle account expand/collapse
        const toggleAccount = (accountId) => {
            setExpandedAccounts((prev) => ({
                ...prev,
                [accountId]: !prev[accountId],
            }));
        };

        const selectPlatform = (platform) => {
            setSelectedPlatforms((prev) => {
            // If already selected → remove it
            if (prev.includes(platform)) {
                return prev.filter((item) => item !== platform);
            }
            // If not selected → add it
            return [...prev, platform];
            });
        };

        const isSelected = (platform) => selectedPlatforms.includes(platform);

        const handlePageSelect = (pageData) => {            
            setSelectedPages((prev) => {
                const exists = prev.some((p) => p.pageId === pageData.pageId);
                if (exists) {
                    return prev.filter((p) => p.pageId !== pageData.pageId);
                } else {
                    return [...prev, pageData];
                }
            });
        };

        const handleToggleAllPages = (platform, accounts) => {
            // Get all connected pages for this platform
            const allConnectedPages = accounts.flatMap(account =>
                (account.socialPage || [])
                .filter(p => p.status === "Connected")
                .map(p => ({
                    social_userid: p.social_userid,
                    pageId: p.pageId,
                    page_platform: platform
                }))
            );

            // ✅ Extract all saved (disabled) page IDs from savedKnowledgebaseData
            const savedPageIds = savedKnowledgebaseData.flatMap(item => {
                try {
                    const details = JSON.parse(item.socialDataDetail || "[]");
                    return details.flatMap(d => d.pages || []);
                } catch {
                    return [];
                }
            });

            // ✅ Filter out saved/disabled pages
            const selectablePages = allConnectedPages.filter(
                page => !savedPageIds.includes(page.pageId)
            );

            // ✅ Check if all selectable pages are already selected
            const allSelected = selectablePages.every(page =>
                selectedPages.some(p => p.pageId === page.pageId)
            );

            if (allSelected) {
                // Deselect only selectable pages
                setSelectedPages(prev =>
                    prev.filter(p => !selectablePages.some(page => page.pageId === p.pageId))
                );
            } else {
                // Select all selectable pages
                setSelectedPages(prev => [
                    ...prev,
                    ...selectablePages.filter(
                        page => !prev.some(p => p.pageId === page.pageId)
                    )
                ]);

                // Optionally expand all accounts
                setExpandedAccounts(prev => ({
                    ...prev,
                    ...Object.fromEntries(accounts.map(acc => [acc.id, true]))
                }));
            }
        };
        
        const clearAddEntryData = async () => {
            setKnowledgeBaseData({ 
                knowledgeBaseTitle:'',        
                knowledgeBaseContent:'',
            });
            setSelectedPages([]);  
        }

        const clickSaveKnowledgebase = async () => {                      
            //console.log('selectedPages:', selectedPages);
            //console.log('knowledgeBaseData:', knowledgeBaseData);
            if(!knowledgeBaseData.knowledgeBaseTitle.trim()) 
            {
                setLoading(false);
                toast.error("Title field is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return; // stop execution here
            }

            if(!knowledgeBaseData.knowledgeBaseContent.trim()) 
            {
                setLoading(false);
                toast.error("Knowledge Base fields is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return; // stop execution here
            }

            if(selectedPages.length === 0) {
                setLoading(false);
                toast.error("Select specific platforms and pages.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return; // stop execution here
            }

            if (savedKnowledgebaseData.length > 0) {
                const isDuplicate = savedKnowledgebaseData.find(
                    (item) => item.knowledgeBase_title.trim().toLowerCase() === knowledgeBaseData.knowledgeBaseTitle.trim().toLowerCase()
                );

                if (isDuplicate) {
                    setLoading(false);
                    toast.error("Knowledge base title already exists.", {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                    return;
                }
            }           
            
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const authToken = localStorage.getItem('authToken'); 
            const filterSelectedPages = selectedPages.map(page => ({
                social_userid: page.social_userid,
                pageId: page.pageId,
                page_platform: page.page_platform
            }));
            
            const formData = new FormData();
            formData.append("knowledgeBaseData", JSON.stringify(knowledgeBaseData));
            formData.append("selectedPages", JSON.stringify(filterSelectedPages));
            try {            
                const responseData = await fetch(`${BACKEND_URL}/api/save-knowledgebase`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: formData,
                });
                const response = await responseData.json();
                if(response.success===true){
                    setKnowledgeBaseData({ 
                        knowledgeBaseTitle:'',        
                        knowledgeBaseContent:'',
                    });
                    setSelectedPages([]);
                    //console.log('response data: ',response);
                    await fetchKnowledgebase();
                    toast.success(`${response.message}`, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                } else if(response.success===false){
                    toast.error(`${response.message}`, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                }           
                setLoading(false);
            } catch (error) { 
                console.log(error.message || 'Failed to save knowledge base.');
                setLoading(false);
            }
        };
    // End Code For Add New Entey Tab

    // Start Code For Knowledge Entries Tab
        const editHandleToggle = (index) => {
            const editItem = savedKnowledgebaseData[index];
            // ✅ Always clear loader when toggling edit
            setSavingIndex(null);
            // ✅ Toggle edit index
            if (editIndex === index) {
                setEditIndex(null);
            } else {
                setEditIndex(index);
            }
            
            // ✅ Safely parse socialDataDetail to get initial pages
            let initialSelectedPages = [];
            try {
                const socialData = JSON.parse(editItem.socialDataDetail || "[]");
                socialData.forEach(accountDetail => {
                    // Assume 'accountDetail.pages' is an array of pageIds
                    (accountDetail.pages || []).forEach(pageId => {
                        // You need the full page object (pageId, social_userid, page_platform)
                        // for the handlePageSelect functions, but for initial state,
                        // we can map the pageId back to a minimal object, or just keep the IDs.
                        // Since edithandlePageSelect expects a page object, we'll construct one later
                        // or find the full page objects from connectedSocialAccount.
                        
                        // For a quick fix, let's store the list of pageIds that are enabled for this KB entry
                        initialSelectedPages.push(pageId);
                    });
                });
            } catch (error) {
                console.error("Error parsing socialDataDetail for edit:", error);
            }
            
            // 💡 Find the full page objects from all connected accounts based on the IDs
            const initialPageObjects = connectedSocialAccount.flatMap(account => 
                (account.socialPage || []).filter(page => 
                    initialSelectedPages.includes(page.pageId)
                ).map(page => ({
                    social_userid: account.social_id, // assuming account.social_id is the social_userid of the account owner
                    pageId: page.pageId,
                    page_platform: account.social_user_platform // assuming this holds the platform
                }))
            );

            // ✅ Load existing values into edit state
            setEditKnowledgeBaseData({
                editknowledgeBaseTitle: editItem.knowledgeBase_title,
                editknowledgeBaseContent: editItem.knowledgeBase_content,
                editknowledgeBaseStatus: editItem.status,
                editknowledgeBaseSocialDataDetail: editItem.socialDataDetail
            });
            
            // ✅ SET THE INITIAL CHECKED PAGES HERE
            // Both states should be synchronized initially to manage the checked status.
            setSavedPageChecked(initialPageObjects);
            setEditPageChecked(initialPageObjects); 

            // ✅ Toggle accordion open state
            setOpenIndex(openIndex === index ? null : index);
        };

        const cancelEdit = (index) => {
            if (editIndex === index) {
                setEditIndex(null);
            }
            if (savingIndex === index) {
                setSavingIndex(null);
            }
            // Close accordion if it’s open for that index
            setOpenIndex((prev) => (prev === index ? null : prev));
            setEditKnowledgeBaseData({
                editknowledgeBaseTitle: "",
                editknowledgeBaseContent: "",
            });
        };        
    
        const handleDeleteClick = (item) => {
            setSelectedKnowledgeBase(item);
            setShowDeleteModal(true);
        };

        const handleCloseModal = () => {
            setShowDeleteModal(false);
            setSelectedKnowledgeBase(null);
        };
    
        const DeleteKnowledgeBase = async (e) => {
            setDeleting(true);
            //console.log("Deleting:", selectedKnowledgeBase);
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const authToken = localStorage.getItem('authToken');
            try {
                const payload = {
                    knowledgeBaseId: selectedKnowledgeBase.id
                };

                const response = await fetch(`${BACKEND_URL}/api/knowledgebase-delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);  
                
            // Remove from local state
                setSavedKnowledgebaseData((prev) =>
                    prev.filter((item) => item.id !== selectedKnowledgeBase.id)
                );          
                setDeleting(false);
                setShowDeleteModal(false);
            } catch (err) {
                console.error("Deletion failed:", err);
                setDeleting(false);
                setShowDeleteModal(false);
                toast.error("Failed to delete knowledge base.");
            }        
        };        

        // ✏️ Handle input change inside edit mode
        const handleEditInputChange = (field, value) => {
            setEditKnowledgeBaseData((prev) => ({
                ...prev,
                [field]: value,
            }));
        };

        const knowledgeBaseDataStatus = (index) => {            
            setSavedKnowledgebaseData((prev) =>
                prev.map((item, i) =>
                    i === index
                    ? {
                        ...item,
                        knowledgeBase_status:
                            item.knowledgeBase_status === "Connected"
                                ? "NotConnected"
                                : "Connected",
                    }
                    : item
                )
            );
        };

        const edithandlePageSelect = (page) => {
            setSavedPageChecked((prevPages) => {
                const exists = prevPages.some((p) => p.pageId === page.pageId);
                const updatedPages = exists
                    ? prevPages.filter((p) => p.pageId !== page.pageId)
                    : [...prevPages, page];

                // ✅ Update both states together *after* computing the new array
                setEditPageChecked(updatedPages);

                return updatedPages;
            });
        };

        const handleSaveEdit = async (id, index) => {
            if(!editKnowledgeBaseData.editknowledgeBaseTitle.trim()) 
            {
                setLoading(false);
                toast.error("Title field is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return;
            }

            if(!editKnowledgeBaseData.editknowledgeBaseContent.trim()) 
            {
                setLoading(false);
                toast.error("Content fields is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return;
            }
            setSavingIndex(index);                        
            const updatedSocialDataDetail = [];
            // Group pages by social_userid (account ID)
            const pagesByAccount = editPageChecked.reduce((acc, page) => {
                if (!acc[page.social_userid]) {
                    acc[page.social_userid] = [];
                }
                acc[page.social_userid].push(page.pageId);
                return acc;
            }, {});

            // Create the final structure
            for (const [social_userid, pageIds] of Object.entries(pagesByAccount)) {
                updatedSocialDataDetail.push({
                    socialAccount: social_userid,
                    platform: editKnowledgeBaseData.editknowledgeBaseSocialDataDetail.platform, // You might need to derive this properly
                    pages: pageIds,
                });
            }
            // Note: The platform value here is a guess based on the existing structure.

            const updatedData = {
                knowledgeBase: id,
                knowledgeBase_title: editKnowledgeBaseData.editknowledgeBaseTitle,
                knowledgeBase_content: editKnowledgeBaseData.editknowledgeBaseContent,
                knowledgeBase_status: editKnowledgeBaseData.editknowledgeBaseStatus,
                // ✅ NEW: Include the updated social data detail
                socialDataDetail: JSON.stringify(updatedSocialDataDetail),                
            };

            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const authToken = localStorage.getItem('authToken');           
            const formData = new FormData();
            formData.append("knowledgeBaseData", JSON.stringify(updatedData));
            
            try {            
                const responseData = await fetch(`${BACKEND_URL}/api/update-knowledgebase`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: formData,
                });
                const response = await responseData.json();
                if(response.success===true){    
                    const updatedState = [...savedKnowledgebaseData];
                    updatedState[index] = {
                        ...updatedState[index],
                        knowledgeBase_title: updatedData.knowledgeBase_title,
                        knowledgeBase_content: updatedData.knowledgeBase_content,
                        status: updatedData.knowledgeBase_status,
                        socialDataDetail: updatedData.socialDataDetail, // Save the new JSON string
                    };
                    setSavedKnowledgebaseData(updatedState);

                    setEditIndex(null);
                    setSavingIndex(null);
                    setEditKnowledgeBaseData({
                        knowledgeBaseTitle: "",
                        knowledgeBaseContent: "",
                        editknowledgeBaseStatus: "Connected",
                    });
                    cancelEdit(index)
                } else if(response.success===false){
                    toast.error(`${response.message}`, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                    setEditIndex(null);
                }               
            } catch (error) { 
                console.log(error.message || 'Failed to save knowledge base.');
                setSavingIndex(null);
            }     
        };
    
    // End Code For Knowledge Entries Tab

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case "facebook":
                return  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                        </svg>;
            case "linkedin":
                return  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"
                            style={{ color: "#2563eb" }} // Tailwind text-blue-600
                        >
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect width="4" height="12" x="2" y="9"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                        </svg>            
            default:
                return null;
        }
    };

    return (        
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    {loading && (
                        <div className="fullscreen-loader-overlay">
                            <div className="fullscreen-loader-content">                                 
                                <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '3rem', height: '3rem'}}>
                                    <span className="sr-only">Loading...</span>
                                </div> 
                                <p>Loading...</p>                               
                            </div>
                        </div>
                    )}
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="d-flex justify-content-between align-items-center mobile-responsive">
                                <div className='d-flex gap-2 align-items-center'>
                                    <div className="facebook-ican d-none d-sm-inline">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-database text-primary" >
                                            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                            <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                                            <path d="M3 12A9 3 0 0 0 21 12"></path>
                                        </svg>
                                    </div>
                                    <div className='d-flex flex-column'>
                                        <h1 className='h1-heading'>
                                            Knowledge Base Management
                                        </h1>
                                        <div> 
                                            <p className='pb-0 mb-0' style={{ fontSize: "16px" }}> 
                                                Create and manage knowledge base entries for automated responses by platform 
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div> 
                                    <span className="primary-badge badge rounded-pill">
                                        {savedKnowledgebaseData.length} Entries
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-md-12">
                                <div id="knowledge-base-tabs">
                                    <ul className="nav nav-tabs gap-3">
                                        <li className="nav-item">
                                            <button className="nav-link active d-flex align-items-center" 
                                                data-bs-toggle="tab" data-bs-target="#entries"
                                                onClick={() => tabsClick()}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                    strokeLinejoin="round" className="me-2" >
                                                    <path d="M12 7v14"></path>
                                                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                                                </svg> Knowledge Entries
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className="nav-link d-flex align-items-center" 
                                                data-bs-toggle="tab" data-bs-target="#platforms"
                                                onClick={() => tabsClick()}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                    className="me-2" >
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                </svg> Connected Platforms
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className="nav-link d-flex align-items-center" data-bs-toggle="tab" 
                                                data-bs-target="#add"
                                                onClick={() => tabsClick()}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="me-2" >
                                                    <path d="M5 12h14"></path>
                                                    <path d="M12 5v14"></path>
                                                </svg>  Add New Entry
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-content rounded-bottom mt-4 custom-form-label">
                                    <div className="tab-pane fade show active" id="entries">
                                        {savedKnowledgebaseData && savedKnowledgebaseData.length > 0 && (
                                            <div className="card">
                                                <div className="card-header border-0">
                                                    <h5>Search & Filter</h5>
                                                </div>
                                                <div className="card-body pt-0">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="form-group w-100">
                                                            <label>Search Entries</label>
                                                            <div className="position-relative">
                                                                {/* SVG Icon */}
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                                                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="position-absolute"
                                                                    style={{
                                                                        left: "12px",
                                                                        top: "50%",
                                                                        transform: "translateY(-50%)",
                                                                        width: "18px",
                                                                        height: "18px",
                                                                        color: "#6c757d"
                                                                    }}
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle cx="11" cy="11" r="8"></circle>
                                                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                                </svg>
                                                                <input
                                                                    type="text"
                                                                    className="form-control ps-5"
                                                                    placeholder="Search bt title, content, or tags..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>  
                                        )} 

                                        {/* General Company Information card */}
                                        {savedKnowledgebaseData.length > 0 ? (
                                            savedKnowledgebaseData.map((KnowledgebaseData, index) => (
                                                <div className="card" key={index}>
                                                    <div className="card-header border-0 pb-1">
                                                        <div className="d-flex justify-content-between mobile-responsive">
                                                            <div className="flex-grow">
                                                                <h5>{KnowledgebaseData.knowledgeBase_title }</h5>
                                                                <div className="d-flex gap-2 pt-2 mb-3 align-items-center" style={{fontWeight:'700'}}>                                                                    
                                                                    <p className="text-muted small mb-0">
                                                                        Status: {KnowledgebaseData.status === 'Connected' ? (
                                                                                <span className="text-success">Enable</span>
                                                                            ) : KnowledgebaseData.status === 'notConnected' ? (
                                                                                <span className="text-danger">Disable</span>
                                                                            ) : (
                                                                                <span className="text-muted">Unknown</span>
                                                                            )}
                                                                    </p>
                                                                    <p className="text-muted small mb-0">
                                                                        Created: {KnowledgebaseData.createdAt
                                                                            ? new Date(KnowledgebaseData.createdAt).toISOString().split('T')[0]
                                                                            : "N/A"
                                                                        } 
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex gap-2 d-none d-md-flex">
                                                                {/* Edit Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => editHandleToggle(index)}
                                                                    className="custom-outline-btn btn d-inline-flex align-items-center justify-content-center gap-2 rounded px-3 py-2"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="me-1"
                                                                    >
                                                                        <path d="M12 20h9"></path>
                                                                        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>
                                                                    </svg>
                                                                </button>

                                                                {/* Delete Button */}
                                                                <button
                                                                    type="button"
                                                                    className="custom-outline-btn btn d-inline-flex align-items-center justify-content-center gap-2 rounded px-3 py-2 text-danger"
                                                                    onClick={() => handleDeleteClick(KnowledgebaseData)}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="me-1"
                                                                    >
                                                                        <path d="M3 6h18"></path>
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                        <line x1="10" x2="10" y1="11" y2="17"></line>
                                                                        <line x1="14" x2="14" y1="11" y2="17"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="card-body pt-0">
                                                        <div className="flex-grow">
                                                            <p className="text-dark mb-0" style={{ fontSize: "14px" }}>
                                                                {KnowledgebaseData.knowledgeBase_content
                                                                    ? KnowledgebaseData.knowledgeBase_content.split(" ").slice(0, 100).join(" ") + "..."
                                                                    : ""
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                                                            <p className="text-muted small mb-0 d-flex align-items-center gap-2">                                                                
                                                                <strong>Platforms:</strong> 
                                                                {(() => {
                                                                    // Ensure we can safely parse social_platform
                                                                    let platforms = [];
                                                                    try {
                                                                        platforms = JSON.parse(KnowledgebaseData.social_platform || "[]");
                                                                    } catch {
                                                                        platforms = [];
                                                                    }
                                                                    return (
                                                                        <>
                                                                            {platforms.includes("facebook") && (
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    width="15"
                                                                                    height="15"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    className="text-primary"
                                                                                >
                                                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                                                </svg>
                                                                            )}                                                                            
                                                                        </>
                                                                    );
                                                                })()}
                                                            </p>

                                                           <div> 
                                                                <div className="d-flex gap-2 d-block d-md-none">
                                                                {/* Edit Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => editHandleToggle(index)}
                                                                    className="custom-outline-btn btn d-inline-flex align-items-center justify-content-center gap-2 rounded px-3 py-2"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="me-1"
                                                                    >
                                                                        <path d="M12 20h9"></path>
                                                                        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>
                                                                    </svg>
                                                                </button>

                                                                {/* Delete Button */}
                                                                <button
                                                                    type="button"
                                                                    className="custom-outline-btn btn d-inline-flex align-items-center justify-content-center gap-2 rounded px-3 py-2 text-danger"
                                                                    onClick={() => handleDeleteClick(KnowledgebaseData)}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        width="16"
                                                                        height="16"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="me-1"
                                                                    >
                                                                        <path d="M3 6h18"></path>
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                        <line x1="10" x2="10" y1="11" y2="17"></line>
                                                                        <line x1="14" x2="14" y1="11" y2="17"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                           </div>
                                                        </div>
                                                    </div>

                                                    {/* Modal General Company Information card */}                                                   
                                                    <div id={`collapse-${index}`}
                                                        className={`card custom-form-label border m-3 collapse ${
                                                        openIndex === index ? "show" : ""
                                                        }`}
                                                    >
                                                        <div className="card-header border-0">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <h6 className="text-primary">Editing Entry</h6>
                                                                </div>                                                                
                                                            </div>
                                                        </div>

                                                        <div className="card-body pt-0">
                                                            <div className="form-group w-100">
                                                                <label>Title</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"                                                                     
                                                                    value={
                                                                        editIndex === index
                                                                            ? editKnowledgeBaseData.editknowledgeBaseTitle
                                                                            : KnowledgebaseData.knowledgeBase_title
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleEditInputChange(
                                                                            "editknowledgeBaseTitle",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </div> 

                                                            <div className="form-group w-100 mt-3">
                                                                <label>Content</label>
                                                                <textarea
                                                                    type="text"
                                                                    className="form-control"
                                                                    rows={4}                                                                   
                                                                    value={
                                                                        editIndex === index
                                                                            ? editKnowledgeBaseData.editknowledgeBaseContent
                                                                            : KnowledgebaseData.knowledgeBase_content
                                                                    }
                                                                    onChange={(e) =>
                                                                        handleEditInputChange(
                                                                            "editknowledgeBaseContent",
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                            </div> 

                                                            <div className="card-body pt-0 pl-0 mt-3 mobile-px-0">                                         
                                                                <label>
                                                                    Select specific platforms and pages:
                                                                </label>                                                                
                                                                <div className="card border form-group w-100 ">
                                                                    <div className="card-header border-0 card-body  llllll custom-card-padding">
                                                                        <div className="container px-2">
                                                                            <div className="row"> 
                                                                                <div
                                                                                    className={`card mb-0 border p-2 d-flex cursor-pointer rounded-3 bg-primary text-white col-md-12`}
                                                                                    data-bs-toggle="collapse"
                                                                                    href="#EditCollapseFacebook"                                                                                    
                                                                                    style={{ transition: "none" }}
                                                                                >
                                                                                    <div 
                                                                                        className="d-flex align-items-center justify-content-between"
                                                                                    >                                                                
                                                                                        <div className="d-flex align-items-center gap-2">
                                                                                            <svg
                                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                                width="20"
                                                                                                height="20"
                                                                                                viewBox="0 0 24 24"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                strokeWidth="2"
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                className="lucide lucide-facebook"                                                                        
                                                                                            >
                                                                                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                                                            </svg>
                                                                                            <span>Facebook</span>                                                                                            
                                                                                                <span className="ml-2 px-2 py-1 rounded platform-selected" style={{backgroundColor:'rgb(219 234 254)',fontSize:'.75rem', fontWeight:'500', color:'rgb(29 78 216)'}}>
                                                                                                    Platform selected
                                                                                                </span>                                                                                            
                                                                                        </div>                                                                       
                                                                                    </div>                                                               
                                                                                </div>
                                                                                
                                                                                {/* <div className="col-md-2 text-end">
                                                                                    <button
                                                                                        className={`btn plateform-select-btn border rounded-3 `}
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                        }}
                                                                                    >
                                                                                      Select All Pages 
                                                                                    </button>
                                                                                </div> */}
                                                                            </div>                                                           

                                                                            {/* Collapse Content */}
                                                                            <div className="collapse mt-2" id="EditCollapseFacebook">
                                                                                <div>
                                                                                    {/* <div className="d-flex align-items-center justify-content-between my-3">
                                                                                        <p className="text-muted small mb-0">
                                                                                            {(() => {                                                                                                
                                                                                                let socialData = editKnowledgeBaseData?.editknowledgeBaseSocialDataDetail;

                                                                                                if (typeof socialData === "string") {
                                                                                                    try {
                                                                                                        socialData = JSON.parse(socialData);
                                                                                                    } catch (error) {
                                                                                                        console.error("Failed to parse editknowledgeBaseSocialDataDetail:", error);
                                                                                                        socialData = [];
                                                                                                    }
                                                                                                }
                                                                                                
                                                                                                if (!Array.isArray(socialData)) {
                                                                                                    socialData = [];
                                                                                                }
                                                                                                
                                                                                                return (
                                                                                                    <>
                                                                                                        Connected accounts ({socialData.length}/{facebookAccounts.length})
                                                                                                    </>
                                                                                                );
                                                                                            })()}
                                                                                        </p>
                                                                                    </div> */}

                                                                                    {/* Accounts List */}
                                                                                    <div className="d-grid gap-2">
                                                                                        <div className="d-grid gap-2">
                                                                                            {(() => {
                                                                                                // ✅ Safely extract selected social account IDs
                                                                                                let socialData = editKnowledgeBaseData?.editknowledgeBaseSocialDataDetail;
                                                                                                // ✅ Parse if it's a string
                                                                                                if (typeof socialData === "string") {
                                                                                                    try {
                                                                                                        socialData = JSON.parse(socialData);
                                                                                                    } catch (error) {
                                                                                                        console.error("Failed to parse editknowledgeBaseSocialDataDetail:", error);
                                                                                                        socialData = [];
                                                                                                    }
                                                                                                }
                                                                                                const selectedAccounts = Array.isArray(socialData)
                                                                                                ? socialData.map((item) => item.socialAccount)
                                                                                                : [];
                                                                                                return facebookAccounts.map((account) => {
                                                                                                    const connectedPages = (account.socialPage || []).filter(
                                                                                                        (page) => page.status === "Connected"
                                                                                                    );
                                                                                                    const isExpanded = expandedAccounts[account.id];
                                                                                                    // ✅ Check if this account should be dark-highlighted
                                                                                                    const isSelected = selectedAccounts.includes(account.social_id);
                                                                                                    return (
                                                                                                        <div key={account.id}>
                                                                                                            <div
                                                                                                                className={`d-flex align-items-center justify-content-between p-2 rounded border cursor-pointer bg-light`}
                                                                                                                onClick={() => toggleAccount(account.id)}
                                                                                                            >
                                                                                                                <div className="d-flex align-items-center justify-content-between">
                                                                                                                    <img
                                                                                                                        src={account.img_url}
                                                                                                                        alt={account.name}
                                                                                                                        className="rounded-circle me-2"
                                                                                                                        style={{
                                                                                                                        width: "30px",
                                                                                                                        height: "30px",
                                                                                                                        objectFit: "cover",
                                                                                                                        }}
                                                                                                                    />
                                                                                                                    {/* ✅ Show Account Name */}
                                                                                                                    <span
                                                                                                                        className={`small fw-semibold text-dark`}
                                                                                                                    >
                                                                                                                        {account.name}                                                                                                                        
                                                                                                                        {isSelected  && (
                                                                                                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium text-end custom-ms" style={{marginLeft:'20px'}}>
                                                                                                                                Account connected 
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                    </span>
                                                                                                                </div>                                                                                                            
                                                                                                                
                                                                                                                <i
                                                                                                                    className={`bi ${
                                                                                                                        isExpanded
                                                                                                                        ? "fas fa-chevron-up text-muted"
                                                                                                                        : "fas fa-chevron-down text-muted"
                                                                                                                    }`}
                                                                                                                ></i>
                                                                                                            </div>

                                                                                                            {/* Pages (Animated Expand/Collapse) */}
                                                                                                            <AnimatePresence initial={false}>
                                                                                                                {isExpanded && (
                                                                                                                    <motion.div
                                                                                                                        key={`pages-${account.id}`}
                                                                                                                        className="ms-4 mt-2 card-custom-margin"
                                                                                                                        initial={{ height: 0, opacity: 0 }}
                                                                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                                                    >
                                                                                                                        {connectedPages.length > 0 ? (
                                                                                                                            connectedPages.map((page) => {
                                                                                                                                const savedPageIds = savedKnowledgebaseData.flatMap((item) => {
                                                                                                                                try {
                                                                                                                                    const details = JSON.parse(item.socialDataDetail || "[]");
                                                                                                                                    return details.flatMap((d) => d.pages || []);
                                                                                                                                } catch {
                                                                                                                                    return [];
                                                                                                                                }
                                                                                                                                });
                                                                                                                                // --- Check if this page is already saved ---
                                                                                                                                const isSaved = savedPageIds.includes(page.pageId);
                                                                                                                                //console.log('savedPageIds', savedPageIds);
                                                                                                                                // --- Checked if saved or currently selected ---
                                                                                                                                const isCheckedInEdit = editPageChecked.some((p) => p.pageId === page.pageId);
                                                                                                                                // selectedPages.some((p) => p.pageId === page.pageId);
                                                                                                                                // --- Check if this page is ALREADY SAVED on a DIFFERENT KB entry ---
                                                                                                                                const otherKbSavedPageIds = savedKnowledgebaseData.flatMap((item, i) => {
                                                                                                                                    // Only look at OTHER KB entries
                                                                                                                                    if (i === index) return []; 
                                                                                                                                    try {
                                                                                                                                        const details = JSON.parse(item.socialDataDetail || "[]");
                                                                                                                                        return details.flatMap((d) => d.pages || []);
                                                                                                                                    } catch {
                                                                                                                                        return [];
                                                                                                                                    }
                                                                                                                                });

                                                                                                                                // --- Disable if saved on another entry ---
                                                                                                                                const isDisabledByOtherEntry = otherKbSavedPageIds.includes(page.pageId);
                                                                                                                                // --- Check if saved on THIS entry OR currently selected in edit ---
                                                                                                                                const isChecked = isCheckedInEdit;                                                                                                

                                                                                                                                return (
                                                                                                                                    <motion.div
                                                                                                                                        key={page.pageId}
                                                                                                                                        className={`d-flex align-items-center p-2 border rounded mb-1 bg-white cursor-pointer ${
                                                                                                                                            isChecked
                                                                                                                                            ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20 text-dark"
                                                                                                                                            : ""
                                                                                                                                        }`}
                                                                                                                                        initial={{ opacity: 0, y: -5 }}
                                                                                                                                        animate={{ opacity: 1, y: 0 }}
                                                                                                                                        exit={{ opacity: 0, y: -5 }}
                                                                                                                                        transition={{ duration: 0.2 }}                                                                                                                                        
                                                                                                                                        style={{
                                                                                                                                            cursor: isDisabledByOtherEntry ? "not-allowed" : "pointer",
                                                                                                                                            opacity: isDisabledByOtherEntry ? 0.6 : 1,
                                                                                                                                        }}
                                                                                                                                        // onClick={() => edithandlePageSelect(page)}    
                                                                                                                                        onClick={() => {
                                                                                                                                            if (!isDisabledByOtherEntry) 
                                                                                                                                                edithandlePageSelect({
                                                                                                                                                    social_userid: account.social_id, // Pass the necessary data
                                                                                                                                                    pageId: page.pageId,
                                                                                                                                                    page_platform: account.social_user_platform,
                                                                                                                                                    pageName: page.pageName // Useful for debugging/display if needed
                                                                                                                                                });
                                                                                                                                        }}                                                                                                                                  
                                                                                                                                    >
                                                                                                                                        {/* Checkbox */} 
                                                                                                                                        <input
                                                                                                                                            type="checkbox"                                                                                                                                            
                                                                                                                                            className={`form-check-input me-2 d-none ${
                                                                                                                                                (isChecked) ? "checkedGreen" : "bg-gray-300"
                                                                                                                                            }`}
                                                                                                                                            checked={isChecked}
                                                                                                                                            style={{ borderRadius: "50px", border: "none" }}
                                                                                                                                        />                                                                                                               
                                                                                                                                        <div 
                                                                                                                                            className={`form-check-input ${
                                                                                                                                            (isChecked)
                                                                                                                                                ? "checkedGreen d-flex justify-content-center align-items-center"
                                                                                                                                                : "bg-gray-300"
                                                                                                                                            }`}
                                                                                                                                            style={{marginRight:'8px', padding:'2px',borderRadius:'50px'}}
                                                                                                                                        >
                                                                                                                                            {isChecked && (
                                                                                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                                                                                                                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                                                                                                                                    className="lucide lucide-check text-white"
                                                                                                                                                >
                                                                                                                                                    <path d="M20 6 9 17l-5-5"></path>
                                                                                                                                                </svg>
                                                                                                                                            )}
                                                                                                                                        </div>                                                                                                                
                                                                                                                                            {/* Page Picture */}
                                                                                                                                        <img
                                                                                                                                            src={page.page_picture}
                                                                                                                                            alt={page.pageName}
                                                                                                                                            className="rounded-circle me-2"
                                                                                                                                            style={{
                                                                                                                                                width: "24px",
                                                                                                                                                height: "24px",
                                                                                                                                                objectFit: "cover",
                                                                                                                                            }}
                                                                                                                                        />
                                                                                                                                        {/* Page Name */}
                                                                                                                                        <div className="d-flex justify-content-between align-items-center w-100 mobile-responsive"> 
                                                                                                                                            <span className="small fw-medium">{page.pageName}</span>
                                                                                                                                            {isDisabledByOtherEntry && (
                                                                                                                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium text-end text-danger">
                                                                                                                                                    Used in another entry
                                                                                                                                                </span>
                                                                                                                                            )}
                                                                                                                                            {isChecked && !isDisabledByOtherEntry && (
                                                                                                                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium text-end">
                                                                                                                                                    Auto-replies enabled
                                                                                                                                                </span>
                                                                                                                                            )}
                                                                                                                                            {/* {isChecked && (
                                                                                                                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium text-end">
                                                                                                                                                    Auto-replies enabled
                                                                                                                                                </span>
                                                                                                                                            )} */}
                                                                                                                                        </div>
                                                                                                                                    </motion.div>
                                                                                                                                );
                                                                                                                            })
                                                                                                                            ) : (
                                                                                                                            <motion.div
                                                                                                                                className="ms-2 text-danger small"
                                                                                                                                initial={{ opacity: 0 }}
                                                                                                                                animate={{ opacity: 1 }}
                                                                                                                                exit={{ opacity: 0 }}
                                                                                                                            >
                                                                                                                                No connected pages found.
                                                                                                                            </motion.div>
                                                                                                                            )}
                                                                                                                    </motion.div>
                                                                                                                )}
                                                                                                            </AnimatePresence>
                                                                                                        </div>
                                                                                                    );
                                                                                                });
                                                                                            })()}
                                                                                        </div>                                                                                         
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>                                                                                             
                                                            </div>                                                          

                                                            <div className="form-group rounded-3 custom-width-100 " style={{width:'35%',backgroundColor:'rgb(251, 246, 252)',padding:'15px'}}>
                                                                <div className="d-flex align-items-center justify-content-between mb-2"> 
                                                                    <div> 
                                                                        <label>Knowledge Base (Enable/Disable)</label>                                                                          
                                                                    </div>
                                                                    <div> 
                                                                        <div className="auto-switch-btn form-check form-switch">
                                                                            <input
                                                                                className={`form-check-input check-size ${
                                                                                    editKnowledgeBaseData.editknowledgeBaseStatus === "Connected"
                                                                                        ? "switch-success"
                                                                                        : ""
                                                                                }`}
                                                                                type="checkbox"
                                                                                role="switch"
                                                                                checked={editKnowledgeBaseData.editknowledgeBaseStatus === "Connected"}
                                                                                onChange={() =>
                                                                                    setEditKnowledgeBaseData((prev) => ({
                                                                                        ...prev,
                                                                                        editknowledgeBaseStatus:
                                                                                            prev.editknowledgeBaseStatus === "Connected"
                                                                                                ? "notConnected"
                                                                                                : "Connected",
                                                                                    }))
                                                                                }
                                                                            /> 
                                                                        </div> 
                                                                    </div>                                                                    
                                                                </div>
                                                                <p className="f-m-light mt-1">
                                                                    Enable this if you want to automatically reply to message.
                                                                </p>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                                <div></div>                                  
                                                                <div className="d-flex gap-2">                                                                   
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-1 rounded px-3 py-2"
                                                                            onClick={() => handleSaveEdit(KnowledgebaseData.id, index)}
                                                                            disabled={savingIndex === index}
                                                                        >
                                                                            {savingIndex === index ? (
                                                                                <>
                                                                                    <div
                                                                                        className="spinner-border spinner-border-sm text-light"
                                                                                        role="status"
                                                                                        style={{ width: "1rem", height: "1rem" }}
                                                                                    >
                                                                                        <span className="sr-only">Loading...</span>
                                                                                    </div>
                                                                                    &nbsp;Saving
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="18"
                                                                                        height="18"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="2"
                                                                                        strokeLinejoin="round"
                                                                                        className="lucide lucide-save h-4 w-4 me-2"
                                                                                    >
                                                                                        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                                                                                        <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                                                                                        <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
                                                                                    </svg>
                                                                                    Save
                                                                                </>
                                                                            )}
                                                                        </button>                                                                        
                                                                        <button
                                                                            type="button"
                                                                            className="custom-outline-btn btn d-inline-flex align-items-center justify-content-center gap-2 rounded px-3 py-2"
                                                                            onClick={() => cancelEdit(index)} 
                                                                            disabled={savingIndex === index}
                                                                        >
                                                                            Cancel
                                                                        </button>                                                                        
                                                                    </>                                                                    
                                                                </div>                                                                
                                                            </div>

                                                        </div>
                                                    </div>
                                                    {/* Modal End */}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="card">
                                                <div className="card-body pt-0">
                                                    <div className="flex-grow">
                                                        <h6 className="text-danger mb-0 text-center pt-4">
                                                            Knowledge base not found.
                                                        </h6>
                                                    </div>
                                                </div>
                                            </div>
                                        )}                                         
                                        {/* End General Company Information card */}
                                        
                                        {/* Start Delete Knowledge Base Confirmation Modal */}
                                        {showDeleteModal && (
                                            <div
                                                className="modal fade show d-block"
                                                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                                            >
                                                <div className="modal-dialog modal-dialog-centered">
                                                    <div className="modal-content">
                                                        <div className="modal-header">
                                                            <h5 className="modal-title fw-bold">
                                                                Delete Knowledge Base
                                                            </h5>
                                                        </div>
                                                        <div className="modal-body">
                                                            <p className="fw-semibold text-danger mb-2">
                                                                Are you sure you want to delete{" "}
                                                                <strong>"{selectedKnowledgeBase?.knowledgeBase_title}"</strong>?
                                                            </p>  
                                                            <p className="mb-0">
                                                                {
                                                                    selectedKnowledgeBase?.knowledgeBase_content.split(' ').slice(0, 50).join(' ') + 
                                                                    (selectedKnowledgeBase?.knowledgeBase_content.split(' ').length > 50 ? '...' : '')
                                                                }
                                                            </p>                                                      
                                                        </div>
                                                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingBottom: '20px',paddingRight:'20px' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={handleCloseModal}
                                                                disabled={deleting}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger"
                                                                onClick={DeleteKnowledgeBase} 
                                                                disabled={deleting}                                                               
                                                            >
                                                               {deleting ? (
                                                                    <>
                                                                        <div className="spinner-border spinner-border-sm text-light" role="status">
                                                                            <span className="visually-hidden">Deleting...</span>
                                                                        </div> Deleting...
                                                                    </>
                                                                ) : (
                                                                    "Delete"
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* End Delete Knowledge Base Confirmation Modal */}

                                    </div>
                                    <div className="tab-pane fade" id="platforms">
                                        {/* Connected Platform */}
                                        {/* <ConnectedUserSocialAccountAndPage /> */}                  
                                        
                                        {savedKnowledgebaseData.length > 0 ? (() => {
                                            // Create a map to combine pages from all knowledgebase entries per account
                                            const accountMap = {};
                                            savedKnowledgebaseData.forEach((KnowledgebaseData) => {
                                                let socialData = KnowledgebaseData.socialDataDetail;
                                                // Parse JSON safely
                                                if (typeof socialData === "string") {
                                                    try {
                                                        socialData = JSON.parse(socialData);
                                                    } catch (error) {
                                                        console.error("Failed to parse socialDataDetail:", error);
                                                        socialData = [];
                                                    }
                                                }

                                                // Collect pages per social account
                                                if (Array.isArray(socialData)) {
                                                    socialData.forEach((item) => {
                                                        const accId = item.socialAccount;
                                                        const pages = Array.isArray(item.pages) ? item.pages : [];
                                                        if (!accountMap[accId]) accountMap[accId] = new Set();
                                                        pages.forEach((p) => accountMap[accId].add(p));
                                                    });
                                                }
                                            });

                                            // Now render each unique account once
                                            const uniqueAccounts = connectedSocialAccount.filter((account) =>
                                                Object.keys(accountMap).includes(account.social_id)
                                            );

                                            return uniqueAccounts.length > 0 ? (
                                                uniqueAccounts.map((account) => {
                                                    const pagesSelected = Array.from(accountMap[account.social_id] || []);
                                                    const connectedPages = (account.socialPage || []).filter(
                                                        (page) => page.status === "Connected" && pagesSelected.includes(page.pageId)
                                                    );

                                                    return (
                                                        <div className="card mb-3" key={account.social_id}>
                                                            <div className="card-header border-0 pb-0 mb-3">
                                                                <div className="d-flex justify-content-between">
                                                                    <div className="d-flex gap-3 align-items-center">
                                                                        {getPlatformIcon(account.social_user_platform)}
                                                                        <div className="flex-grow">
                                                                            <h6>{account.name}</h6>
                                                                            <div className="d-flex gap-2 pt-1 align-items-center">
                                                                                <div className="d-inline-flex align-items-center rounded-pill green-badge fw-semibold small">
                                                                                    Connected
                                                                                </div>
                                                                                <p className="text-muted small mb-0">
                                                                                    {connectedPages.length} page(s)
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="card-body pt-0">
                                                                <div className="flex-grow border-top pt-2">
                                                                    <p className="text-muted small mb-1">Connected Pages:</p>
                                                                </div>

                                                                {connectedPages.length > 0 ? (
                                                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                                                        {connectedPages.map((page) => (
                                                                            <div
                                                                                key={page.pageId}
                                                                                className="d-inline-flex align-items-center rounded-pill border px-2 py-1 fw-semibold text-dark small"
                                                                            >
                                                                                {page.pageName}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-muted small mt-2">
                                                                        No connected pages.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-gray-400 text-sm mt-4 italic">
                                                    No social accounts were selected for this knowledge base entry.
                                                </p>
                                            );
                                        })() : (
                                            <div className="card">
                                                <div className="card-header border-0 pb-0 mb-3">
                                                    <div className="d-flex justify-content-between">
                                                        <div className="align-items-center w-100">
                                                            <h6 className="text-center text-danger mb-0">
                                                                Account not connected
                                                            </h6>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}                                        
                                    </div>
                                    <div className="tab-pane fade" id="add">
                                        <div className="card">
                                            <div className="card-header border-0">
                                                <h5 className="d-flex align-items-center gap-1"> 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="me-2">
                                                        <path d="M5 12h14"></path>
                                                        <path d="M12 5v14"></path>
                                                    </svg> Add New Knowledge Base Entry
                                                </h5>
                                            </div>

                                            <div className="card-body pt-0">                                            
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="form-group w-100"><label>Entry Title</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control"
                                                            placeholder="e.g Pricing information"
                                                            value={knowledgeBaseData.knowledgeBaseTitle || ''}
                                                            onChange={(e) => {
                                                                setKnowledgeBaseData({ 
                                                                    ...knowledgeBaseData, 
                                                                    knowledgeBaseTitle: e.target.value 
                                                                });
                                                                //setErrorEmptyCampaign("");
                                                            }}
                                                        />
                                                    </div>
                                                    {/* <div className="form-group w-100">
                                                        <label htmlFor="categorySelect">Category</label>
                                                        <select className="form-control" id="categorySelect">
                                                            <option>All Categories</option>
                                                            <option>General</option>
                                                            <option>Pricing</option>
                                                            <option>Support</option>
                                                            <option>Features</option>
                                                            <option>Technical</option>
                                                        </select>
                                                    </div> */}
                                                </div>
                                                <div className="form-group w-100 mt-3"><label>Knowledge Base</label>
                                                    <textarea 
                                                        type="text" className="form-control"
                                                        placeholder="Enter the knowledge base content that will be uesd for automated responses..." 
                                                        rows={4}
                                                        value={knowledgeBaseData.knowledgeBaseContent || ''}
                                                        onChange={(e) => {
                                                            setKnowledgeBaseData({ 
                                                                ...knowledgeBaseData, 
                                                                knowledgeBaseContent: e.target.value 
                                                            });
                                                            //setErrorEmptyCampaign("");
                                                        }}
                                                    />                                                    
                                                </div>                                                
                                                <p className="text-dark mb-0 mt-3 pb-2" style={{ fontSize: '14px' }}>
                                                    Select specific platforms and pages:
                                                </p>
                                                {/* Facebook connected accounts */}
                                                <div className="card border form-group w-100">
                                                    <div className="card-header border-0 card-body">
                                                        <div className="container px-1">
                                                            <div className="row "> 
                                                                <div
                                                                    className={`card mb-0 border p-2 d-flex cursor-pointer rounded-3  ${
                                                                        isSelected("facebook") ? "bg-primary text-white col-md-8 col-xl-10" : "col-md-12"
                                                                    }`}
                                                                    data-bs-toggle="collapse"
                                                                    href="#collapseFacebook"
                                                                    onClick={() => {
                                                                        // toggle expansion state for facebook
                                                                        setExpandedAccounts((prev) => ({
                                                                        ...prev,
                                                                        facebook: !prev.facebook,
                                                                        }));
                                                                        selectPlatform("facebook");
                                                                    }}
                                                                    style={{ transition: "none" }}
                                                                >
                                                                    <div 
                                                                        className="d-flex align-items-center justify-content-between"
                                                                    >                                                                
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="20"
                                                                                height="20"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="lucide lucide-facebook"                                                                        
                                                                            >
                                                                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                                            </svg>
                                                                            <span>Facebook</span>
                                                                            {isSelected("facebook") && (
                                                                                <span className="ml-2 px-2 py-1 rounded" style={{backgroundColor:'rgb(219 234 254)',fontSize:'.75rem', fontWeight:'500', color:'rgb(29 78 216)'}}>
                                                                                    Platform selected
                                                                                </span>
                                                                            )}
                                                                        </div>                                                                       
                                                                    </div>                                                               
                                                                </div>
                                                                {isSelected("facebook") && (
                                                                    <div className="col-md-4 col-xl-2 text-end">
                                                                        <button
                                                                            className={`btn plateform-select-btn border rounded-3 ${
                                                                                (() => {
                                                                                // Extract all connected (available) page IDs
                                                                                const allConnectedPages = facebookAccounts.flatMap((account) =>
                                                                                    (account.socialPage || [])
                                                                                    .filter((p) => p.status === "Connected")
                                                                                    .map((p) => p.pageId)
                                                                                );

                                                                                // Extract all saved (disabled) page IDs from savedKnowledgebaseData
                                                                                const savedPageIds = savedKnowledgebaseData.flatMap((item) => {
                                                                                    try {
                                                                                        const details = JSON.parse(item.socialDataDetail || "[]");
                                                                                        return details.flatMap((d) => d.pages || []);
                                                                                    } catch {
                                                                                        return [];
                                                                                    }
                                                                                });

                                                                                // Only keep unsaved (selectable) pages
                                                                                const selectablePages = allConnectedPages.filter(
                                                                                    (id) => !savedPageIds.includes(id)
                                                                                );

                                                                                // Determine if all selectable pages are selected
                                                                                const allSelected =
                                                                                    selectablePages.length > 0 &&
                                                                                    selectablePages.every((id) =>
                                                                                    selectedPages.some((p) => p.pageId === id)
                                                                                    );

                                                                                return allSelected ? "bg-primary text-white" : "";
                                                                                })()
                                                                            }`}
                                                                            onClick={() => handleToggleAllPages("facebook", facebookAccounts)}
                                                                            style={{
                                                                                cursor: "pointer",
                                                                            }}
                                                                            >
                                                                            {(() => {
                                                                                const allConnectedPages = facebookAccounts.flatMap((account) =>
                                                                                (account.socialPage || [])
                                                                                    .filter((p) => p.status === "Connected")
                                                                                    .map((p) => p.pageId)
                                                                                );

                                                                                // Extract saved (disabled) page IDs
                                                                                const savedPageIds = savedKnowledgebaseData.flatMap((item) => {
                                                                                try {
                                                                                    const details = JSON.parse(item.socialDataDetail || "[]");
                                                                                    return details.flatMap((d) => d.pages || []);
                                                                                } catch {
                                                                                    return [];
                                                                                }
                                                                                });

                                                                                // Filter only selectable pages
                                                                                const selectablePages = allConnectedPages.filter(
                                                                                (id) => !savedPageIds.includes(id)
                                                                                );

                                                                                // Check if all selectable pages are already selected
                                                                                const allSelected =
                                                                                selectablePages.length > 0 &&
                                                                                selectablePages.every((id) =>
                                                                                    selectedPages.some((p) => p.pageId === id)
                                                                                );

                                                                                return allSelected ? "Deselect All Pages" : "Select All Pages";
                                                                            })()}
                                                                            </button>
                                                                    </div>
                                                                )}
                                                            </div>                                                           

                                                            {/* Collapse Content */}
                                                            
                                                            <div className={`collapse mt-2 ${expandedAccounts.facebook ? "show" : ""}`} id="collapseFacebook">
                                                                <div>
                                                                    <div className="d-flex align-items-center justify-content-between my-3">
                                                                        <p className="text-muted small mb-0">
                                                                            Connected accounts ({facebookAccounts.length}):
                                                                        </p>
                                                                    </div>

                                                                    {/* Accounts List */}
                                                                    <div className="d-grid gap-2">
                                                                        {facebookAccounts.length === 0 && (
                                                                            <p className="small text-danger">No Facebook accounts connected.</p>
                                                                        )}

                                                                        {facebookAccounts.map((account) => {
                                                                            const connectedPages = (account.socialPage || []).filter(
                                                                                (page) => page.status === "Connected"
                                                                            );
                                                                            const isExpanded = expandedAccounts[account.id];
                                                                            return (
                                                                                <div key={account.id}>
                                                                                    {/* Account Header */}
                                                                                    <div
                                                                                        className="d-flex align-items-center justify-content-between p-2 rounded border bg-light cursor-pointer"
                                                                                        onClick={() => toggleAccount(account.id)}
                                                                                    >
                                                                                        <div className="d-flex align-items-center">
                                                                                            <img
                                                                                                src={account.img_url}
                                                                                                alt={account.name}
                                                                                                className="rounded-circle me-2"
                                                                                                style={{
                                                                                                    width: "30px",
                                                                                                    height: "30px",
                                                                                                    objectFit: "cover",
                                                                                                }}
                                                                                            />
                                                                                            <span className="small fw-semibold text-dark">{account.name}</span>
                                                                                        </div>
                                                                                        <i
                                                                                            className={`bi ${
                                                                                                isExpanded ? "fas fa-chevron-up text-muted" : "fas fa-chevron-down text-muted"
                                                                                            }`}
                                                                                        ></i>
                                                                                    </div>

                                                                                    {/* Pages (Animated Expand/Collapse) */}
                                                                                    <AnimatePresence initial={false}>
                                                                                        {isExpanded && (
                                                                                            <motion.div
                                                                                                key={`pages-${account.id}`}
                                                                                                className="ms-4 mt-2"
                                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                            >
                                                                                                {connectedPages.length > 0 ? (
                                                                                                    connectedPages.map((page) => {
                                                                                                        // const savedMatch = savedKnowledgebaseData.find(
                                                                                                        //     (item) => item.page_id === page.pageId
                                                                                                        // );
                                                                                                        // --- Extract all saved page IDs from savedKnowledgebaseData ---
                                                                                                        const savedPageIds = savedKnowledgebaseData.flatMap((item) => {
                                                                                                        try {
                                                                                                            const details = JSON.parse(item.socialDataDetail || "[]");
                                                                                                            return details.flatMap((d) => d.pages || []);
                                                                                                        } catch {
                                                                                                            return [];
                                                                                                        }
                                                                                                        });

                                                                                                        // --- Check if this page is already saved ---
                                                                                                        const isSaved = savedPageIds.includes(page.pageId);
                                                                                                        // --- Checked if saved or currently selected ---
                                                                                                        const isChecked = isSaved || selectedPages.some((p) => p.pageId === page.pageId);
                                                                                                        // --- Disable if saved ---
                                                                                                        const isDisabled = isSaved;                                                                                                        

                                                                                                        return (
                                                                                                            <motion.div
                                                                                                                key={page.pageId}
                                                                                                                className={`d-flex align-items-center p-2 border rounded mb-1 bg-white cursor-pointer ${
                                                                                                                    isChecked ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20 text-dark" : ""
                                                                                                                }`}
                                                                                                                initial={{ opacity: 0, y: -5 }}
                                                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                                                exit={{ opacity: 0, y: -5 }}
                                                                                                                transition={{ duration: 0.2 }}
                                                                                                                onClick={() => {
                                                                                                                    if (!isDisabled) handlePageSelect(page);
                                                                                                                }}
                                                                                                                style={{
                                                                                                                    cursor: isDisabled ? "not-allowed" : "pointer",
                                                                                                                    opacity: isDisabled ? 0.6 : 1,
                                                                                                                }}
                                                                                                            >
                                                                                                                {/* Checkbox */}
                                                                                                                <input
                                                                                                                    type="checkbox"                                                                                                                    
                                                                                                                    className={`form-check-input me-2 d-none ${
                                                                                                                        isChecked ? "checkedGreen" : "bg-gray-300"
                                                                                                                    }`}
                                                                                                                    checked={isChecked}
                                                                                                                    disabled={isDisabled}
                                                                                                                    onChange={() => handlePageSelect(page)} // keeps React happy
                                                                                                                    onClick={(e) => e.stopPropagation()} // 👈 prevent double toggle
                                                                                                                    style={{borderRadius:'50px',border:'none'}}
                                                                                                                />                                                                                                                
                                                                                                                    <div 
                                                                                                                        className={`form-check-input ${
                                                                                                                            isChecked ? "checkedGreen d-flex justify-content-center align-items-center" : "bg-gray-300"
                                                                                                                        }`}
                                                                                                                        style={{marginRight:'8px', padding:'2px',borderRadius:'50px'}}
                                                                                                                    >
                                                                                                                        {isChecked && (
                                                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                                                                                                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                                                                                                                className="lucide lucide-check text-white"
                                                                                                                            >
                                                                                                                                <path d="M20 6 9 17l-5-5"></path>
                                                                                                                            </svg>
                                                                                                                        )}
                                                                                                                    </div>                                                                                                                
                                                                                                                    {/* Page Picture */}
                                                                                                                <img
                                                                                                                    src={page.page_picture}
                                                                                                                    alt={page.pageName}
                                                                                                                    className="rounded-circle me-2"
                                                                                                                    style={{
                                                                                                                        width: "24px",
                                                                                                                        height: "24px",
                                                                                                                        objectFit: "cover",
                                                                                                                    }}
                                                                                                                />
                                                                                                                {/* Page Name */}
                                                                                                                <div className="d-flex justify-content-between align-items-center w-100 mobile-responsive"> 
                                                                                                                    <span className="small fw-medium">{page.pageName}</span>
                                                                                                                    {isDisabled  && (
                                                                                                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium text-end">
                                                                                                                            Auto-replies enabled
                                                                                                                        </span>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            </motion.div>
                                                                                                        );
                                                                                                    })
                                                                                                    ) : (
                                                                                                    <motion.div
                                                                                                        className="ms-2 text-danger small"
                                                                                                        initial={{ opacity: 0 }}
                                                                                                        animate={{ opacity: 1 }}
                                                                                                        exit={{ opacity: 0 }}
                                                                                                    >
                                                                                                        No connected pages found.
                                                                                                    </motion.div>
                                                                                                    )}
                                                                                            </motion.div>
                                                                                        )}
                                                                                    </AnimatePresence>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* End Facebook connected accounts */}                                     

                                                
                                                {/* LinkedIn connected accounts */} 

                                                {/* <div className="form-group w-100 mt-3"><label>Tags (comma-separated)</label>
                                                    <input type="text" className="form-control"
                                                        placeholder="e.g. pricing, plans, cost"
                                                    />
                                                </div> */}
                                                
                                                <div className="mt-4"> 
                                                    <div className="d-flex gap-3 text-end justify-content-end ">
                                                        <button type="button"                                                        
                                                            className="custom-outline-btn btn d-inline-flex align-items-center justify-content-center gap-2 rounded px-3 py-2"
                                                            onClick={clearAddEntryData}
                                                        >
                                                            Clear
                                                        </button>
                                                        {loading ? ( 
                                                            <button className="btn rounded-3 btn-primary d-flex align-items-center justify-content-center">
                                                                Saving...
                                                            </button>
                                                        ) : (                      
                                                            <button
                                                                className={`btn rounded-3 d-flex align-items-center justify-content-center ${
                                                                    knowledgeBaseData.knowledgeBaseTitle?.trim() &&
                                                                    knowledgeBaseData.knowledgeBaseContent?.trim() &&
                                                                    selectedPages.length > 0
                                                                    ? "btn-primary"
                                                                    : "btn-primary opacity-50"
                                                                }`}
                                                                onClick={clickSaveKnowledgebase}
                                                                disabled={
                                                                    !(
                                                                    knowledgeBaseData.knowledgeBaseTitle?.trim() &&
                                                                    knowledgeBaseData.knowledgeBaseContent?.trim() &&
                                                                    selectedPages.length > 0
                                                                    )
                                                                }
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="lucide lucide-save h-4 w-4 me-3 ">
                                                                    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                                                                    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                                                                    <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
                                                                </svg> Save Entry 
                                                            </button>
                                                        )} 
                                                    </div>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </div>     
    )
}
