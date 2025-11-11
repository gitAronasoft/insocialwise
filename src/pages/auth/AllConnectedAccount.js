import React, { useState,useEffect,useRef } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useLocation } from 'react-router-dom';
import { Dropdown, Modal, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import queryString from 'query-string';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import AccountNotConnectedComponent from './components/AccountNotConnectedComponent';

export default function AllConnectedAccount() {
    const [loading, setLoading] = useState(false);
    const [AppLoading, setAppLoading] = useState(false);
    const [connectedAccountInfo, setIsConnectedAccountInfo] = useState(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState({ userId: null, socialId: null,accountName: null  });
    const [pageStatusMap, setPageStatusMap] = useState({});
    const [ReconnectPopup, setReconnectPopup] = useState(false);
    const location  = useLocation();
    const getlocation = useLocation();
    const pageURL = getlocation.pathname;
    const currentOrigin = window.location.origin;   
    const CLIENT_ID = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
    const REDIRECT_URI = `${currentOrigin}${pageURL}`;      
    const SCOPE = 'w_member_social w_organization_social r_organization_admin r_organization_social r_basicprofile openid email profile rw_organization_admin';
    const State = "linkedin";
    const [connectionProgress, setConnectionProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const liTriggerRef = useRef(null);
    const [accountSelected, setAccountSelected] = useState(false);

    useEffect(() => {        
        const fetchData = async () => {
            setLoading(true);
            try {
                const rawUserInfo = localStorage.getItem('userinfo');                
                const userInfoData = JSON.parse(rawUserInfo);                 
                if(userInfoData.socialData && Array.isArray(userInfoData.socialData)) {
                    setIsConnectedAccountInfo(userInfoData.socialData);
                } else {
                    setIsConnectedAccountInfo([]); 
                }
            } catch (error) {
                console.error('Parsing error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    },[]); 
    
    useEffect(() => {
        if (connectedAccountInfo) {
            const initialStatusMap = {};
            connectedAccountInfo.forEach(account => {
                if (account.socialPage) {
                    account.socialPage.forEach(page => {
                        // Use actual status from data
                        initialStatusMap[page.pageId] = page.status; 
                    });
                }
            });
            setPageStatusMap(initialStatusMap);
        }
    }, [connectedAccountInfo]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code   = params.get('code');
        const state  = params.get('state');
    
        if (code && state === 'linkedin' && liTriggerRef.current) {
          liTriggerRef.current.click();          // 🔹 programmatic click
    
          // optional: clean query‑string so refresh doesn’t re‑fire
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('code');
          cleanUrl.searchParams.delete('state');
          window.history.replaceState({}, '', cleanUrl);
        }
    }, [location.search]);

    const onClose = () => {
        setReconnectPopup(false);
    }

    // Start Facebook Account Connect Function
        const FB_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
        const responseFacebook = (response) => {
            // console.log('Facebook response:', response);
            // 1️⃣ Sanity‑check the payload
            if (!response) {
                console.error('No response received from Facebook SDK.');
                return;
            }
            // 2️⃣ Handle SDK‑level errors or user cancellations
            if (response.error || response.status === 'unknown') {
                console.error('Facebook authentication error:', response.error ?? response.status);
                return;
            }
            // 3️⃣ Normalise the access token location
            const accessToken =
                response.accessToken                     // FB Web SDK v17+
                ?? response.authResponse?.accessToken;   // FB Web SDK v16 and earlier
            if (!accessToken) {
                console.error('Unable to extract access token from Facebook response.');
                return;
            }
            setReconnectPopup(true);
            setAppLoading(true);
            // 4️⃣ Delegate to your own account‑linking logic
            connectAccount('Facebook',accessToken);
        };
        const socialUserToken = async (accessToken) => {        
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const authToken = localStorage.getItem('authToken');
            try {
                const responseData = await fetch(`${BACKEND_URL}/api/account-connection`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ 
                        data: accessToken,
                    }),
                });
                const response = await responseData.json();
                if(response.success===false){
                    toast.error('This account is already linked to our platform.', {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                    
                    return false;
                } else if(response.success===true){                                          
                    localStorage.removeItem('userinfo');
                    localStorage.setItem('userinfo', JSON.stringify(response.userInfo));          
                    const rawUserInfo = localStorage.getItem('userinfo');
                    const userInfoData = JSON.parse(rawUserInfo);
                    if(userInfoData.socialData && Array.isArray(userInfoData.socialData)) {
                        // setIsConnectedAccountInfo(userInfoData.socialData);
                        return true;
                    }
                    return true;
                } else {
                    toast.error('Server technical problem, try agian.', {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                    return false;
                } 
            } catch (error) {     
                setCurrentStep('Connection failed');
                setConnectionProgress(0);     
                console.error('Token Extension Error:', error);
                toast.error(error.message || 'Failed to connect Facebook account', {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });               
                return false;
            }
        };
    // End Facebook Account Connect Function

    // Start Linkedin Account Connect Function
        const handleLogin = () => {
            const authUrl = queryString.stringifyUrl({
              url: 'https://www.linkedin.com/oauth/v2/authorization',
              query: {
                response_type: 'code',
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                scope: SCOPE,
                state: State,
              },
            });
            window.location.href = authUrl;
        };
    // Ends Linkedin Account Connect Function

    // Simulate connection progress (replace with actual API calls)
    const connectAccount = async (platform, accessToken = null) => {
        try {
            setAppLoading(true);
            setConnectionProgress(0);
            setCurrentStep(`Initializing ${platform} connection...`);
    
            if (platform === 'Facebook' && accessToken) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setCurrentStep('Authenticating with Facebook...');
                setConnectionProgress(14);
        
                const tokenResult = await socialUserToken(accessToken); // Fetch and store userinfo in localStorage
        
                if (!tokenResult) {
                    toast.error('Failed to save account connection.', {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    }); 
                    
                    setAppLoading(false);
                    return;
                }
        
                setTimeout(() => {
                    setCurrentStep('Requesting page access...');
                    setConnectionProgress(28);
                }, 2000);
                setTimeout(() => {
                    setCurrentStep('Fetching Page Analytics data...');
                    setConnectionProgress(42);
                }, 4000);
                setTimeout(() => {
                    setCurrentStep('Fetching Posts and Comments data...');
                    setConnectionProgress(56);
                }, 6000);
                setTimeout(() => {
                    setCurrentStep('Syncing account data...');
                    setConnectionProgress(70);
                }, 8000);
                setTimeout(() => {
                    setCurrentStep('Syncing Inbox data...');
                    setConnectionProgress(84);
                }, 10000);
                setTimeout(() => {
                    setCurrentStep('Almost there...');
                    setConnectionProgress(98);
                }, 12000);
                setTimeout(() => {
                    setCurrentStep('Finalizing...');
                    setConnectionProgress(100);
                }, 14000);
        
                // ✅ Now refresh the data and close the modal after final step
                setTimeout(() => {
                    const rawUserInfo = localStorage.getItem("userinfo");
                    const userInfoData = JSON.parse(rawUserInfo || "{}");
                    const accountInfo = userInfoData.socialData || [];
            
                    setIsConnectedAccountInfo(accountInfo); // Now safely set in parent
                    setReconnectPopup(false);
                    setAppLoading(false);
                }, 16000);
            }
        } catch (error) {
            console.error('Connection failed:', error);
            toast.error('Connection failed. Please try again.', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });            
            setAppLoading(false);
        }
    };

    const disconnectSocialAccount = async (social_account_submit) => {
        setLoading(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;        
        const storedToken = localStorage.getItem('authToken');
        try {
            fetch(`${BACKEND_URL}/api/user-disconnect`, {                        
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+storedToken
                },
                body: JSON.stringify({discount_account:social_account_submit}),                
            })            
            // const data = await res.json();
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                //console.log('Response data:', data);                
                if(data.message==='Profile Disconnected successfully.') {                  
                    delete localStorage.getItem('userinfo');               
                    localStorage.setItem('userinfo', JSON.stringify(data.userInfo));
                    const rawUserInfo = localStorage.getItem('userinfo');
                    const userInfoData = JSON.parse(rawUserInfo);
                    if(userInfoData.socialData && Array.isArray(userInfoData.socialData)) {
                    setIsConnectedAccountInfo(userInfoData.socialData || []);                
                    }
                    toast.success('Account disconnected successfully.', {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                }
                setLoading(false);                     
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                setLoading(false);
            });            
        } catch (err) { 
            console.log("Something went wrong :- ",err);
            setLoading(false);
        }               
    };

    const removeAccount = async (user_uuid,social_account_id,accountPlatform) => {
        setLoading(true);
        //console.log('user_uuid', 'social_account_id', social_account_id);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;        
        const storedToken = localStorage.getItem('authToken');
        try {
            fetch(`${BACKEND_URL}/api/social-account-remove`, {                        
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+storedToken
                },
                body: JSON.stringify({social_account_id:social_account_id,accountPlatform:accountPlatform}),
            })            
            // const data = await res.json();
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                //console.log('Response data:', data);                
                if(data.message==='Account removed successfully.') {                  
                    delete localStorage.getItem('userinfo');               
                    localStorage.setItem('userinfo', JSON.stringify(data.userInfo));
                    const rawUserInfo = localStorage.getItem('userinfo');
                    const userInfoData = JSON.parse(rawUserInfo);                   
                    setIsConnectedAccountInfo(userInfoData.socialData || []);   
                    setSelectedAccount({ userId: null, socialId: null, accountName: null });           
                    toast.success('Account removed successfully.', {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        theme: "colored",
                    });
                }
                setLoading(false);                     
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                setLoading(false);
            });            
        } catch (err) { 
            console.log("Something went wrong :- ",err);
            setLoading(false);
        }  
    };
    
    const filterPages = (social_account_id, account_name) => {
        setSelectedAccount(prev => {
        //   if (prev.socialId === social_account_id) {
        //     return { userId: null, socialId: null, accountName: null };
        //   }
        setAccountSelected(true);
            return {
                userId: null, // Add actual user ID if needed
                socialId: social_account_id,
                accountName: account_name
            };
        });
    };

    const handlePageStatus = (pageId) => {
        return async () => {
            const oldStatus = pageStatusMap[pageId];
            let newStatus;
            if(oldStatus === "Connected"){
                newStatus = "notConnected";
            }else{
                newStatus = "Connected";
            }
            const authToken = localStorage.getItem('authToken');
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            
            // Store original data for potential revert
            const oldConnectedAccountInfo = [...connectedAccountInfo];
            const oldUserInfo = localStorage.getItem('userinfo');
            
            try {
                // 1. Update state and localStorage
                const updatedAccounts = connectedAccountInfo.map(account => {
                    if (account.socialPage) {
                        const updatedPages = account.socialPage.map(page => {
                            if (page.pageId === pageId) {
                            return { ...page, status: newStatus };
                            }
                            return page;
                        });
                        return { ...account, socialPage: updatedPages };
                    }
                    return account;
                });
                
                // Update state
                setIsConnectedAccountInfo(updatedAccounts);
                setPageStatusMap(prev => ({ ...prev, [pageId]: newStatus }));
                
                // Update localStorage
                const userInfo = JSON.parse(oldUserInfo);
                const updatedUserInfo = {
                    ...userInfo,
                    socialData: updatedAccounts
                };
                localStorage.setItem('userinfo', JSON.stringify(updatedUserInfo));
                
                // 2. Make API call
                const response = await fetch(`${BACKEND_URL}/api/page/status`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + authToken,
                    },
                    body: JSON.stringify({                    
                        pageId: pageId,
                        pageStatus: newStatus
                    }),
                });
                
                if (!response.ok) {
                    throw new Error('Failed to update status');
                }
                const result = await response.json();

                // 3. Handle success
                if (result.success) {
                    toast.success('Status updated successfully', {
                        position: 'top-right',
                        autoClose: 3000,
                        theme: "colored",
                    });
                } else {
                    throw new Error('Backend reported failure');
                }
            
            } catch (error) {
                // Revert changes on error
                setIsConnectedAccountInfo(oldConnectedAccountInfo);
                setPageStatusMap(prev => ({ ...prev, [pageId]: oldStatus }));
                localStorage.setItem('userinfo', oldUserInfo);
                toast.error('Error updating status. Please try again.', {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        };
    };

    return (
        <div className="page-wrapper compact-wrapper" >
            <Header/>
            <div className="page-body-wrapper">
                <Sidebar/>
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-sm-12">
                                    <h1 className="h1-heading">All Social Accounts</h1>
                                </div>
                                {/* <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">All Social Accounts</li>
                                    </ol>
                                </div>                */}
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12 col-sm-12 col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2 mobile-responsive">
                                            <div>
                                                <h5 className="mb-2"> Social accounts </h5>
                                                <p className="my-2"> These are the social accounts that only you can view and post to.</p>
                                            </div>
                                            <div>
                                                <p>
                                                    <button type="button" ref={liTriggerRef} onClick={() => setShowConnectModal(true)} className="btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center my-3">
                                                        <i className="fa-solid fa-plus fs-5 me-2"></i> Connect accounts
                                                    </button>
                                                </p>
                                            </div>
                                        </div>

                                        <AccountNotConnectedComponent
                                            show={showConnectModal}
                                            onHide={() => setShowConnectModal(false)}
                                            onSuccess={() => {
                                                // You can optionally reload dashboard data here
                                            }}
                                            setIsConnectedAccountInfo={setIsConnectedAccountInfo}
                                            pageURL={location.pathname}
                                        />
                                        {ReconnectPopup && (
                                            <Modal show={ReconnectPopup} centered backdrop="static" keyboard={false}>
                                                <Modal.Header closeButton onClick={()=>onClose(true)} >
                                                    <Modal.Title style={{fontSize:'15px'}} className="text-success">Saving Your Data</Modal.Title>
                                                </Modal.Header>
                                                <Modal.Body>            
                                                <div className="container">
                                                    {AppLoading ? (
                                                        <div className="connection-progress">
                                                            <h5 className="mb-3">{currentStep}</h5>
                                                            <ProgressBar 
                                                                now={connectionProgress} 
                                                                label={`${connectionProgress}%`}
                                                                animated 
                                                                striped
                                                                variant="success"
                                                            />
                                                            <div className="text-center mt-2">
                                                                <small>🪑 Sit relax and have a tea ☕, while we fetch your data.</small>
                                                                {/* <small>Step {Math.floor(connectionProgress/14)} of 7</small> */}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="loading-container">
                                                            <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                                            <p className="my-auto ms-2">Please wait, While we fetch your data.</p>
                                                        </div>
                                                    )} 
                                                </div>    
                                                </Modal.Body>
                                            </Modal>
                                        )}
                                        <div className="row g-3">
                                            {loading ? (
                                                <div className="loading-container mt-3">
                                                    <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                                </div>
                                            ) : connectedAccountInfo && connectedAccountInfo.length > 0 ? (
                                                connectedAccountInfo.map(account => (
                                                <div className="col-md-4">
                                                    <div className="card">
                                                        <div className="d-flex align-items-center border rounded p-2 justify-content-between h-100">
                                                            <div className={`d-flex align-items-center ${account.status !== 'Connected' ? 'opacity-50 pointer-events-none' : ''}`}
                                                                onClick={() => filterPages(account.social_id, account.name)} style={{cursor:'pointer'}}>
                                                                <div className="position-relative">               
                                                                    <img className="img-fluid rounded-circle border" style={{height:'50px'}} src={`${account.img_url}`} alt="vector woman with laptop"/>
                                                                    <span className="position-absolute start-100 bottom-0 translate-middle-x rounded-circle d-flex align-items-center justify-content-center custom-ican-bg">
                                                                        {account.social_user_platform === 'facebook' ? (
                                                                            // <i className="fa-brands fa-facebook text-primary fs-5"></i> 
                                                                            <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                                style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                                    width: "25px", height: "25px" }}
                                                                                >
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
                                                                                    className="text-white"
                                                                                >
                                                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7
                                                                                    a1 1 0 0 1 1-1h3z"></path>
                                                                                </svg>
                                                                                </div>
                                                                            
                                                                        ) : account.social_user_platform === 'instagram' ? (
                                                                            <i className="fa-brands fa-instagram text-primary fs-5"></i>
                                                                        ) : account.social_user_platform === 'linkedin' ? (
                                                                            // <i className="fa-brands fa-linkedin text-primary fs-5"></i>
                                                                            <div
                                                                            className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                            style={{
                                                                                background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                                width: "25px",
                                                                                height: "25px"
                                                                            }}
                                                                            >
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
                                                                                className="text-white"
                                                                            >
                                                                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4
                                                                                0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                                                <rect x="2" y="9" width="4" height="12"></rect>
                                                                                <circle cx="4" cy="4" r="2"></circle>
                                                                            </svg>
                                                                            </div>
                                                                        ) : null}
                                                                    </span>
                                                                </div>
                                                                <div className="ms-4">
                                                                    <h6>{account.name}</h6>
                                                                </div>
                                                            </div>
                                                            <div className="ms-4">
                                                                <Dropdown className="icon-dropdown">
                                                                    <Dropdown.Toggle 
                                                                        variant="link" 
                                                                        id="dropdown-custom-gear" 
                                                                        className="btn btn-lg border-0 p-1 custom-gear-btn"
                                                                    >
                                                                        {/* <i className="fa-solid fa-gear fs-5"></i> */}
                                                                        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu className="dropdown-menu-end p-2 rounded-3 border-0">                                                                
                                                                        <Dropdown.Item className="rounded-3 border-0 mb-1" onClick={() => {
                                                                                setSelectedAccount({
                                                                                    userId: account.user_id,
                                                                                    socialId: account.social_id,
                                                                                    accountName: account.name,
                                                                                    accountPlatform: account.social_user_platform
                                                                                });
                                                                                setShowDeleteModal(true);
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-trash"></i> Remove from Insocialwise
                                                                        </Dropdown.Item>
                                                                        {account.status === 'notConnected' ? (
                                                                            (() => {
                                                                                if (account.social_user_platform === 'facebook') {
                                                                                    return (
                                                                                        <Dropdown.Item className="rounded-3 border-0">
                                                                                        <FacebookLogin
                                                                                            appId={FB_APP_ID}
                                                                                            autoLoad={false}
                                                                                            fields="name,email,picture,accounts"
                                                                                            scope="pages_show_list,pages_manage_metadata,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement,read_insights,pages_messaging,ads_management,ads_read,business_management"
                                                                                            callback={responseFacebook}
                                                                                            render={renderProps => (
                                                                                                <span onClick={renderProps.onClick} style={{cursor:'pointer'}} > <i className="fas fa-link"></i>Reconnect</span>
                                                                                            )}
                                                                                        />
                                                                                        </Dropdown.Item>
                                                                                    );
                                                                                } else if (account.social_user_platform === 'linkedin') {
                                                                                    return (
                                                                                        <Dropdown.Item className="rounded-3 border-0 mb-1" onClick={() => handleLogin()}>
                                                                                        <i className="fas fa-link"></i> Reconnect
                                                                                        </Dropdown.Item>
                                                                                    );
                                                                                } else {
                                                                                    console.warn('Unknown platform:', account.social_user_platform);
                                                                                    return null;
                                                                                }
                                                                            })()
                                                                        ) : (
                                                                            <Dropdown.Item className="rounded-3 border-0 mb-1" onClick={() => {
                                                                                    if (account.social_user_platform === 'facebook') {
                                                                                        disconnectSocialAccount(account.social_id);
                                                                                    } else if (account.social_user_platform === 'linkedin') {
                                                                                        disconnectSocialAccount(account.social_id);
                                                                                    } else {
                                                                                        console.warn('Unknown platform:', account.social_user_platform);
                                                                                    }
                                                                                }}>
                                                                                <i className="fas fa-unlink"></i> Disconnect
                                                                            </Dropdown.Item>
                                                                        )}
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </div>                                            
                                                        </div> 
                                                    </div>                                               
                                                </div>
                                                ))
                                            ) : ( 
                                                <p className='text-danger text-center'>No account connected</p>
                                            )} 
                                            {/* Delete Confirmation Modal */}
                                            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static" keyboard={false}>
                                                <Modal.Header closeButton>
                                                    <Modal.Title>Confirm Delete</Modal.Title>
                                                </Modal.Header>
                                                <Modal.Body>
                                                    Are you sure you want to permanently remove <strong>{selectedAccount.accountName || 'this'}</strong> account from Insocialwise? You will lose all your data.
                                                </Modal.Body>
                                                <Modal.Footer>
                                                    <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger"
                                                        onClick={() => {
                                                            removeAccount(selectedAccount.userId, selectedAccount.socialId, selectedAccount.accountPlatform);
                                                            setShowDeleteModal(false);
                                                        }}
                                                    >
                                                        Delete Account
                                                    </button>
                                                </Modal.Footer>
                                            </Modal>  
                                            {/* Delete Confirmation Modal */}                                 
                                        </div>                    
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-12 col-md-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center justify-content-between gap-2 mobile-responsive">
                                            <div>
                                                <h5 className="mb-3">
                                                {selectedAccount.accountName ? 
                                                    `Showing Pages: ${selectedAccount.accountName}` : 
                                                    'Showing Pages: All'
                                                }
                                                </h5>                                         
                                            </div>
                                            {selectedAccount.accountName && (
                                                <button  
                                                className="btn  custom-outline-btn btn-sm"
                                                onClick={() => setSelectedAccount({ userId: null, socialId: null, accountName: null })}
                                                >
                                                Clear Filter
                                                </button>
                                            )}
                                        </div>

                                        <div className="table-responsive signal-table">
                                            <table className="table p-2 all-accounts-table">
                                                {/* <thead>
                                                    <tr>
                                                    <th className="text-center" scope="col">Image</th>
                                                    <th className="text-center" scope="col">Page Name</th>
                                                    <th className="text-center" scope="col">Category</th>
                                                    <th className="text-center" scope="col">Platform</th> 
                                                    <th className="text-center" scope="col">Status</th>                                                                                                                  
                                                    </tr>
                                                </thead> */}
                                                <tbody>
                                                    {loading ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center">
                                                        <div className="loading-container">
                                                            <i className="fas fa-spin fa-spinner" style={{ fontSize: '25px' }}></i>
                                                        </div>
                                                        </td>
                                                    </tr>
                                                    ) : (
                                                    (() => {
                                                        // No status filtering anymore
                                                        const connectedAccounts = connectedAccountInfo || [];

                                                        const filteredAccounts = selectedAccount.socialId
                                                        ? connectedAccounts.filter(account => account.social_id === selectedAccount.socialId)
                                                        : connectedAccounts;

                                                        const allPages = filteredAccounts.flatMap(account => 
                                                            (account.socialPage || []).map(page => ({
                                                                ...page,
                                                                accountStatus: account.status // attach account status to each page
                                                            }))
                                                        );

                                                        if (connectedAccounts.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center text-danger">
                                                                        No connected accounts found
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        if (allPages.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center text-danger">
                                                                        No pages found in connected accounts
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }

                                                        return allPages.map((page) => (
                                                            <tr key={page.id}>

                                                                <td className="text-center">
                                                                {page.page_platform === 'facebook' ? (
                                                                    // <i className="fa-brands fa-facebook text-primary fs-5"></i>
                                                                    <div className="p-2 rounded-3 d-inline-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        background: "linear-gradient(to right, #2563eb, #1e40af)", // Tailwind's blue-600 → blue-800
                                                                    }} >
                                                                    <svg  xmlns="http://www.w3.org/2000/svg"  width="15"   height="15"
                                                                        viewBox="0 0 24 24"  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"  strokeLinejoin="round" className="text-white"
                                                                    >
                                                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                                    </svg>
                                                                    </div>

                                                                ) : page.page_platform === 'instagram' ? (
                                                                    <i className="fa-brands fa-instagram text-primary fs-5"></i>
                                                                ) : page.page_platform === 'linkedin' ? (
                                                                    // <i className="fa-brands fa-linkedin text-primary fs-5"></i>
                                                                     <div className="p-2 rounded-3 d-inline-flex align-items-center justify-content-center"
                                                                style={{
                                                                    background: "linear-gradient(to right, #3b82f6, #1d4ed8)", // Tailwind blue-500 → blue-700
                                                                }}
                                                                >
                                                                <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15" viewBox="0 0 24 24"
                                                                    fill="none"  stroke="currentColor"  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"   className="text-white"
                                                                >
                                                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                                    <rect width="4" height="12" x="2" y="9"></rect>
                                                                    <circle cx="4" cy="4" r="2"></circle>
                                                                </svg>
                                                                </div>
                                                                ) : null}
                                                                </td>
                                                                <td className="text-center">
                                                                <img src={page.page_picture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} 
                                                                    alt="Preview" className="img-fluid" 
                                                                    style={{ objectFit: 'cover', height: '45px', width: '45px', borderRadius: '50%' }} />
                                                                </td>
                                                                <td className="text-center">{page.pageName}</td>
                                                                <td className="text-center">{page.category}</td>
                                                                {/* <td className="text-center">
                                                                {page.page_platform === 'facebook' ? (
                                                                    <i className="fa-brands fa-facebook text-primary fs-5"></i>
                                                                ) : page.page_platform === 'instagram' ? (
                                                                    <i className="fa-brands fa-instagram text-primary fs-5"></i>
                                                                ) : page.page_platform === 'linkedin' ? (
                                                                    <i className="fa-brands fa-linkedin text-primary fs-5"></i>
                                                                ) : null}
                                                                </td>                                                             */}
                                                                <td className="text-center">                                                                
                                                                    <div className="form-check form-switch form-check-inline">
                                                                        <input 
                                                                            className={`form-check-input check-size ${
                                                                                pageStatusMap[page.pageId] === "Connected" ? 'switch-success' : 'border-danger'
                                                                            }`}
                                                                            type="checkbox" 
                                                                            role="switch" 
                                                                            checked={pageStatusMap[page.pageId] === "Connected" ? true : false}
                                                                            onChange={handlePageStatus(page.pageId)}
                                                                            disabled={page.accountStatus === "notConnected"}                                                                        
                                                                        />                                                                    
                                                                        {pageStatusMap[page.pageId] === "Connected" ? (
                                                                            <span style={{marginLeft:'15px'}}>Connected</span> 
                                                                        ) : pageStatusMap[page.pageId] === "notConnected" ? ( 
                                                                            <span style={{marginLeft:'15px'}}>Reconnect</span> 
                                                                        ) : null}                                                                   
                                                                    </div>                                                               
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()
                                                    )}
                                                </tbody>
                                            </table>
                
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            <Footer/>
            </div>
        </div>
    )
}
