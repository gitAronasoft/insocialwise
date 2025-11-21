import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';

export default function ConnectedUserSocialAccountAndPage() {
    const [loading, setLoading] = useState([]);
    const [connectedSocialAccount, setConnectedSocialAccount] = useState([]);
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
    },[]);

    const handleDisconnectClick = async (social_account_id) => { 
        setLoading((prev) => [...prev, social_account_id]);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${BACKEND_URL}/api/user-disconnect`, {                        
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ discount_account: social_account_id }),                
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            if (data.message === 'Profile Disconnected successfully.') {                
                localStorage.setItem('userinfo', JSON.stringify(data.userInfo)); 
                const connectedAccounts = data.userInfo.socialData.filter(
                    (account) => account.status === "Connected"
                );
                setConnectedSocialAccount(connectedAccounts);
                toast.success('Account disconnected successfully.', {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        } catch (err) { 
            console.error("Something went wrong:", err);
        } finally {
            setLoading((prev) => prev.filter((id) => id !== social_account_id));
        }
    }; 

  return (
    <>
        {connectedSocialAccount && connectedSocialAccount.length > 0 ? (
            connectedSocialAccount.map((account) => {
            const isLoading = loading.includes(account.social_id);
            const connectedPages =
                account.socialPage?.filter((page) => page.status === "Connected") ||
            [];
            return (                      
                <div className="card" key={account.id}>
                    <div className="card-header border-0 pb-0 mb-3">
                        <div className="d-flex justify-content-between">
                            <div className="d-flex gap-3 align-items-center">
                                {getPlatformIcon(account.social_user_platform)}
                                <div className="flex-grow">
                                    <h6>{account.name}</h6>
                                    <div className="d-flex gap-2 pt-1 align-items-center">
                                        <div className="d-inline-flex align-items-center rounded-pill green-badge  fw-semibold small" > 
                                            {account.status}
                                        </div>
                                        <p className="text-muted small mb-0"> {connectedPages.length} page(s) </p>
                                    </div>
                                </div>
                            </div>
                            <div className="">
                                {isLoading ? (
                                    <button type="button" 
                                        className="custom-outline-btn btn text-danger d-inline-flex  align-items-center justify-content-center gap-2 rounded px-3 py-2"  
                                        disabled={isLoading}
                                    >                                    
                                        <div
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                        >
                                            <span className="sr-only">Loading...</span>
                                        </div>                                     
                                        Disconnect...
                                </button>
                                ) : (
                                    <button type="button" 
                                        className="custom-outline-btn btn text-danger d-inline-flex  align-items-center justify-content-center gap-2 rounded px-3 py-2"  
                                        onClick={() => handleDisconnectClick(account.social_id)}
                                        disabled={isLoading}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" 
                                            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                            className="lucide lucide-unplug h-4 w-4">
                                            <path d="m19 5 3-3"></path>
                                            <path d="m2 22 3-3"></path>
                                            <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"></path>
                                            <path d="M7.5 13.5 10 11"></path>
                                            <path d="M10.5 16.5 13 14"></path>
                                            <path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z">
                                            </path>
                                        </svg> 
                                        Disconnect
                                    </button>
                                )}                                    
                            </div>
                        </div>
                    </div>
                    <div className="card-body  pt-0">
                        <div className="flex-grow border-top pt-2" >
                            <p className="text-muted small">
                                Connected Pages:
                            </p>
                        </div>

                        <div className="gap-2 mt-2">
                            <div className="d-flex gap-2">
                                {(() => {
                                    const connectedPages = account.socialPage?.filter(
                                        (page) => page.status === "Connected"
                                    ) || [];
                                    return connectedPages.length > 0 ? (
                                        connectedPages.map((page) => (
                                        <div
                                            key={page.id}
                                            className="d-inline-flex align-items-center rounded-pill border px-2 py-1 fw-semibold text-dark small"
                                        >
                                            {page.pageName}
                                        </div>
                                        ))
                                    ) : (
                                        <span className="small text-danger">No pages connected</span>
                                    );
                                    })()}
                            </div>
                        </div>
                    </div>
                </div>
            );
                })
            ) : (
                <div className="card">
                    <div className="card-body pt-0">
                        <div className="text-center pt-3">
                            <p className="text-danger">No social accounts connected.</p>
                        </div>
                    </div>
                </div>
                
            )}
    </>
  )
}
