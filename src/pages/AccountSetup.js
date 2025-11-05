import React, { useState, useEffect,useRef } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import AccountNotConnectedComponent from './auth/components/AccountNotConnectedComponent';
import axios from "axios";

export default function AccountSetup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [AppLoading, setAppLoading] = useState(false);
    const FB_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
    const [pageStatusMap, setPageStatusMap] = useState({});
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [connectedAccountInfo, setIsConnectedAccountInfo] = useState(null);
    const liTriggerRef = useRef(null);
    const location  = useLocation();
    const pageURL = location.pathname;
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);

    useEffect(() => {        
        //const emailVerification = localStorage.getItem('emailVerification'); 
        // const accountCreate = localStorage.getItem('accountCreate');       
        // if(!accountCreate) {            
        //     navigate('/login');
        // }    
    }, [navigate]);

    useEffect(() => {
        let initialStatusMap = {};
        let platforms = [];

        const extractFromAccounts = (accounts) => {
            accounts.forEach(account => {
                if (account.status === 'Connected') {
                    platforms.push(account); // Push the full object, not just the string
                }

                if (Array.isArray(account.socialPage)) {
                    account.socialPage.forEach(page => {
                        initialStatusMap[page.pageId] = page.status;
                    });
                }
            });
        };

        if (Array.isArray(connectedAccountInfo) && connectedAccountInfo.length > 0) {
            extractFromAccounts(connectedAccountInfo);
        } else {
            const userInfo = localStorage.getItem('userinfo');
            if (userInfo) {
                try {
                    const parsedUserInfo = JSON.parse(userInfo);
                    if (Array.isArray(parsedUserInfo.socialData)) {
                        extractFromAccounts(parsedUserInfo.socialData);
                    }
                } catch (e) {
                    console.error('Failed to parse userinfo from localStorage:', e);
                }
            }
        }

        // Apply state updates
        setPageStatusMap(initialStatusMap);
        setConnectedPlatforms(platforms);
    }, [connectedAccountInfo]);

    useEffect(() => {
        if (!location || !location.search) return;

        const params = new URLSearchParams(location.search);
        const code = params.get("code");
        const state = params.get("state");

        if (code && state === "linkedin") {
            setStep(3);

            setTimeout(() => {
                if (liTriggerRef.current) {
                    liTriggerRef.current.click();
                }
            }, 200); // Slight delay to ensure DOM has rendered

            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("code");
            cleanUrl.searchParams.delete("state");
            window.history.replaceState({}, "", cleanUrl);
        }
    }, [location]);


    const handleNext = (e) => {
        e.preventDefault();
        setStep(prev => Math.min(prev + 1, 3));
    }; 
    
    const resendVerificationEmail = async (e) => {
        e.preventDefault();
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
        const email = localStorage.getItem('email');
        setLoading(true);
        try {
              const res = await fetch(`${BACKEND_URL}/resend-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if(res.ok) {
                toast.success(data.message, {
                    position: 'top-center', 
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });             
            } else {
                toast.error(data.message, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });        
            }
        } catch (err) {
            toast.error('Failed to sending email, please try again.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });       
        } finally {
            setLoading(false);
        }
    };

    const handleStartOver = () => {
        localStorage.removeItem('email');
        localStorage.removeItem('accountCreate');
        localStorage.removeItem('emailVerification');        
        localStorage.removeItem('authToken');
        localStorage.removeItem('userinfo');
        navigate('/create-account');   
    };
    
    const continueSettingUp = () => {
        localStorage.removeItem('email');
        localStorage.removeItem('accountCreate'); 
        // localStorage.removeItem('emailVerification');        
        setStep(2);    
    }; 
    
    const clickAddMoreLater = () => {
        navigate('/dashboard');    
    };


    // Fetch Facebook user data
        const responseFacebook = (response) => {                        
            const { accessToken } = response;      
            if(accessToken){  
            fetchUserData(accessToken); 
            } else {        
            console.error('Failed to retrieve access token.');
            }
        };

        const fetchUserData = async (accessToken) => {
            setAppLoading(true);
            const fbAccessToken = accessToken;
            try {            
                const userResponse = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${fbAccessToken}&fields=name,email,picture,accounts`);
                const userData = await userResponse.json();               
                if(userData.accounts){
                    await extentUserFBtoken(fbAccessToken, userData);
                } else {
                setAppLoading(false);              
                    toast.error('This account does not have any pages.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });
                }          
            } catch (error) {
                setAppLoading(false);
                toast.error('Technical issue, try again after some time.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
                console.error('Error:', error);
            } finally {          
            }
        };

        const extentUserFBtoken = async (accessToken, userData) => {
            const shortFBtoken = accessToken;
            const appId = process.env.REACT_APP_FACEBOOK_APP_ID;
            const appSecret = process.env.REACT_APP_FACEBOOK_APP_SECRET; 
            const FBuserData = userData;
            const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortFBtoken}`;
            try {
                const response = await axios.get(url);            
                if (response.data.error) {
                    throw new Error(`Facebook API Error: ${response.data.error.message}`);
                }
      
                if (!response.data.access_token) {
                    throw new Error("Invalid token response from Facebook");
                }
                const longLivedToken = response.data.access_token;            
                await socialAccountSave(FBuserData,longLivedToken);
            } catch (error) {
                setAppLoading(false);
                console.error('Token Extension Error:', error);
                let errorMessage = "Failed to connect account. Please try again.";
                if (error.message.includes("invalid grant_type")) {
                    errorMessage = "Invalid authentication configuration. Contact support.";
                } else if (error.message.includes("invalid access token")) {
                    errorMessage = "Your Facebook session expired. Please reconnect.";
                }
                toast.error(errorMessage, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
                throw error;
            } 
        };

        const socialAccountSave = async (FBuserData, accessToken) => { 
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const storedToken = localStorage.getItem('authToken');
            const longLivedToken = accessToken;
            const userData = FBuserData;
            const social_user_platform = 'facebook';
            try {
                const submissionResponse = await fetch(`${BACKEND_URL}/api/social_account_submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + storedToken
                    },
                    body: JSON.stringify({ 
                        data: userData, 
                        accessToken: longLivedToken,
                        social_user_platform:social_user_platform 
                    }),
                });
                const response = await submissionResponse.json();
                if(response.createAccount===false){
                    setAppLoading(false);
                    toast.error('This account is already linked to our platform.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    }); 
                } else if(response.createAccount===true){
                    setAppLoading(false);
                    await fetchBusinessPageData(longLivedToken, userData.id);                    
                } else if(response.createAccountError===false){
                    setAppLoading(false);
                    toast.error('Server technical problem, try agian.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });  
                } else {
                    setAppLoading(false);
                    toast.error('Server technical problem, try agian.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });                
                }          
            } catch (error) {
                setAppLoading(false);
                console.error('Token Extension Error:', error);
            }
        };

        const fetchBusinessPageData = async (accessToken, user_social_id) => { 
            setAppLoading(true);                 
            try {
                const response = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${accessToken}`);
                const data = await response.json();
                //console.log('data fb page',data);
                if (data?.data?.length > 0) {
                    const pagesList= data.data;
                    await fetchPageDetails(pagesList, user_social_id);                
                } else {
                    console.warn("No business pages found.");
                }
            } catch (error) {
                console.error("Error fetching business pages: ", error);
            } 
            // finally {
            //     setLoading(false); // Ensure loading is turned off
            // }
        };

        const fetchPageDetails = async (pagesList,user_social_id) => { 
            //console.log('pagesList',pagesList);
            setAppLoading(true);
            for (const page of pagesList) {
                const page_id = page.id;
                const page_access_token = page.access_token;
                try {                  
                    const response = await fetch(`https://graph.facebook.com/v22.0/${page_id}?fields=name,category,picture,cover,followers_count,fan_count,posts.summary(true)&access_token=${page_access_token}`);
                    const data = await response.json();
                    //console.log(`Get Metadata for Page`,data);         
                    //await saveSocialPages(data,page_access_token,user_social_id);
                    await facebookPageAnalytics(data,page_id,page_access_token,user_social_id);               
                    //setLoading(false);          
                } catch (error) {
                    console.error(`Error fetching metadata for Page ${page_id}: `, error);
                    setAppLoading(false);
                    throw error; // Re-throw to handle in the parent function            
                } 
                finally {
                    //setLoading(false);
                }
            }   
        };

        // fetch facebook pages analytic
        const facebookPageAnalytics  = async (pagesInfoData,page_id, page_access_token,user_social_id) => {
           const today = new Date();
            const untilDate = new Date(today);
            untilDate.setDate(today.getDate() - 1);
            const sinceDate = new Date(untilDate);
            sinceDate.setDate(untilDate.getDate() - 7);        
            const since = getUnixTimestampMidnight(sinceDate, 0);
            const until = getUnixTimestampMidnight(untilDate, 0);     
            
            const errors = [];
            const responses = []; 
            try {        
                const response = await axios.get(
                    `https://graph.facebook.com/v22.0/${page_id}/insights`,
                    {
                        params: {
                            metric: 'page_daily_follows',
                            period: 'day',
                            access_token: page_access_token,
                            since: since, // Unix timestamp
                            until: until
                        }
                    }
                ); 
                const analyticsData = response.data;
                //await saveAnalyticsData(analyticsData.data, 'page_daily_follows');
                responses.push({ analytic_type: 'page_daily_follows', data: analyticsData });
                //console.log('Daily follows saved:', analyticsData);
            } catch (error) {
                console.error('Daily follows API Error:', error);
                errors.push({ type: 'page_daily_follows', error });
            }

            try {           
                const response = await axios.get(
                    `https://graph.facebook.com/v22.0/${page_id}/insights`,
                    {
                        params: {
                            metric: 'page_impressions',
                            period: 'day',
                            access_token: page_access_token,
                            since: since, // Unix timestamp
                            until: until
                        }
                    }
                ); 
                const analyticsData = response.data;            
                responses.push({ analytic_type: 'page_impressions', data: analyticsData });
                //console.log('Post engagements saved:', analyticsData);
            } catch (error) {
                console.error('Daily follows API Error:', error);
                errors.push({ type: 'page_impressions', error });
            }

            try {        
                const response = await axios.get(
                    `https://graph.facebook.com/v22.0/${page_id}/insights`,
                    {
                        params: {
                            metric: 'page_impressions_unique',
                            period: 'day',
                            access_token: page_access_token,
                            since: since, // Unix timestamp
                            until: until
                        }
                    }
                ); 
                const analyticsData = response.data;
                responses.push({ analytic_type: 'page_impressions_unique', data: analyticsData });
                //console.log('Post engagements saved page_impressions_unique :', analyticsData);
            } catch (error) {
                console.error('Daily impressions unique API Error:', error);
                errors.push({ type: 'page_impressions_unique', error });
            }

            try {          
                const response = await axios.get(
                    `https://graph.facebook.com/v22.0/${page_id}/insights`,
                    {
                        params: {
                            metric: 'page_views_total',
                            period: 'day',
                            access_token: page_access_token,
                            since: since,
                            until: until
                        }
                    }
                ); 
                const page_views_total = response.data;            
                //console.log('page_views_total :', page_views_total);
                responses.push({ analytic_type: 'page_views_total', data: page_views_total });
            } catch (error) {
                console.error('Daily page_views_total API Error:', error);
                errors.push({ type: 'page_views_total', error });
            }

            try {
                const response = await axios.get(
                    `https://graph.facebook.com/v22.0/${page_id}/insights`,
                    {
                    params: {
                        metric: 'page_post_engagements',
                        period: 'day',
                        access_token: page_access_token,
                        since: since, 
                        until: until 
                    }
                    }
                );
                const page_post_engagements = response.data;
                //console.log('page_post_engagements:', page_post_engagements);
                responses.push({ analytic_type: 'page_post_engagements', data: page_post_engagements });
            } catch (error) {
                console.error('API Error:', error.response?.data || error.message);
            }

            //console.log('responses',responses);

            // Handle final errors/responses
            if (errors.length > 0) {
                const errorMessage = errors.map(e => `${e.type}: ${e.error.message}`).join('\n');
                throw new Error(`Some analytics failed:\n${errorMessage}`);
            }
            await savefaceBookAnalyticsData(responses,page_id,page_access_token,pagesInfoData,user_social_id);

        };

        const savefaceBookAnalyticsData = async (analyticsData,socialPageId,page_access_token,pagesInfoData,user_social_id) => { 
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const authToken = localStorage.getItem('authToken'); 
            try {
                const formData = new FormData();  
                formData.append("analyticsData", JSON.stringify(analyticsData));            
                formData.append("platform", 'facebook');
                formData.append("socialPageId", socialPageId);
                const response = await fetch(`${BACKEND_URL}/api/create-analytics`, {
                    method: "POST",
                    headers: {
                    Authorization: "Bearer " + authToken,
                    },
                    body: formData,
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response.json();                
                //console.log("saved successfully:", result); 
                await saveSocialPages(pagesInfoData,page_access_token,user_social_id);
            } catch (error) {
                console.error("Error saving posts:", error);            
                throw error;
            }
        };

        function getUnixTimestampMidnight(dateStr, offsetHours) {
            const d = new Date(dateStr);
            d.setUTCHours(0, 0, 0, 0);
            d.setHours(d.getHours() + offsetHours);
            return Math.floor(d.getTime() / 1000);
        }

        // end fetch facebook pages analytic

        const saveSocialPages = async (pagesListData,page_access_token,user_social_id) => { 
            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
            const storedToken = localStorage.getItem('authToken'); 
            const data = pagesListData;
            const page_platform = 'facebook';
            try {    
                const postResponse = await fetch(`${BACKEND_URL}/api/social_page_submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + storedToken
                    },
                    body: JSON.stringify({pagesData:data,social_id:user_social_id, token:page_access_token,page_platform:page_platform}),
                });
      
                if (!postResponse.ok) {
                    throw new Error(`HTTP error! Status: ${postResponse.status}`);
                }
                const postData = await postResponse.json();
                //setpagePostsInfo([data] || []); 
                localStorage.removeItem('email');
                localStorage.removeItem('accountCreate');
                localStorage.removeItem('emailVerification');
                localStorage.setItem('userinfo', JSON.stringify(postData.userInfo));        
                setAppLoading(false); 
                navigate('/dashboard');             
            } catch (error) {
                setAppLoading(false);
                console.error('Error processing page:', error);
            }
        };

    // End Fetch Facebook user data

    const renderStepContent = () => {
        switch (step) {            
            case 1:
                return (
                    <>                    
                        {localStorage.getItem('emailVerification')==='verified' ? (
                            <div className="custom-preview-height">
                                <div className="verify-email-card">
                                    <div className="custom-card-header">
                                        <div className="envelope-icon">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill="#3B82F6"></path>
                                                <path d="M22 6L12 13L2 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </div>
                                        <h2 className="mb-2">Your email has been verified!</h2>
                                        <small className="text-grey mb-2">You can go ahead and finish setting up your account.</small>
                                        <button className="btn-resend w-100 text-center mt-2" onClick={continueSettingUp}>Continue setting up your account</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h4 className='text-primary'>Please verify your email</h4>
                                <div className="custom-preview-height">
                                    <div className="verify-email-card">
                                        <div className="custom-card-header">
                                            <div className="envelope-icon">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill="#3B82F6"></path>
                                                    <path d="M22 6L12 13L2 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                </svg>
                                            </div>
                                            <h2>Almost there! Verify your email</h2>
                                            <p className="subtext">We sent a magic link to <span className="user-email">{localStorage.getItem('email')}</span></p>
                                        </div>
                                        <div className="verification-steps">
                                            <div className="step active">
                                                <div className="step-number">1</div>
                                                <div className="step-content">
                                                    <h4>Check your inbox</h4>
                                                    <p>Look for an email from us with subject "Verify your account"</p>
                                                </div>
                                            </div>
                                            <div className="step">
                                                <div className="step-number">2</div>
                                                <div className="step-content">
                                                    <h4>Click the link</h4>
                                                    <p>This will confirm your email address instantly</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="troubleshoot-section">
                                            <div className="divider">
                                                <span>Didn't get it?</span>
                                            </div>
                                            <div className="troubleshoot-options">
                                                {loading ? (
                                                    <button 
                                                        className="btn-resend"                           
                                                        disabled
                                                        style={{backgroundColor:'#e7e9eb',color:"GrayText"}}
                                                    > 
                                                        <div className="spinner-border spinner-border-sm" role="status">
                                                            <span className="sr-only">Loading...</span> 
                                                        </div> Sending
                                                    </button>
                                                ) : (
                                                    <button className="btn-resend" onClick={resendVerificationEmail}>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M23 4L23 10L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                            <path d="M1 20L1 14L7 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                            <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1112 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        </svg>
                                                        Resend Email
                                                    </button>
                                                )}
                                            </div>
                                            <div className="tips">
                                                <div className="tip">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M12 8V12" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M12 16H12.01" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                    <span>Check spam/junk folder</span>
                                                </div>
                                                <div className="tip">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22 12H18L15 21L9 3L6 12H2" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                    <span>Wrong email? <span className="start-over" onClick={handleStartOver} style={{cursor:'pointer'}}>Start over</span></span>
                                                </div>
                                            </div>
                                        </div>                        
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                );
            case 2:
                return (
                    <>
                        <h4 className='text-primary'>We'd like to learn more about you.</h4>
                        <div className="step-custom-preview-height">
                            <div className="form-group">
                                <label className="form-label custom-label">1. What is your primary goal when using social media?</label>
                                <div className="radio-button-group mt-3">
                                    <input type="radio" name="goal" id="goal1" value="planning" className="custom-radio-input"/>
                                    <label for="goal1" className="custom-radio-label">Planning and publishing my social media content</label>

                                    <input type="radio" name="goal" id="goal2" value="analyzing" className="custom-radio-input"/>
                                    <label for="goal2" className="custom-radio-label">Analyzing the performance of my social media posts</label>

                                    <input type="radio" name="goal" id="goal3" value="engaging" className="custom-radio-input"/>
                                    <label for="goal3" className="custom-radio-label">Engaging with customers and/or followers</label>

                                    <input type="radio" name="goal" id="goal4" value="ads" className="custom-radio-input"/>
                                    <label for="goal4" className="custom-radio-label">Building brand awareness</label>

                                    <input type="radio" name="goal" id="goal5" value="other" className="custom-radio-input"/>
                                    <label for="goal5" className="custom-radio-label">Other</label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label custom-label">2. Which best describes your role?</label>
                                <div className="radio-button-group mt-3">
                                    <input type="radio" name="role" id="role1" value="organization" className="custom-radio-input" />
                                    <label for="role1" className="custom-radio-label">I manage social media for my organization</label>

                                    <input type="radio" name="role" id="role2" value="I-manage-my" className="custom-radio-input"/>
                                    <label for="role2" className="custom-radio-label">I manage my own social media accounts</label>

                                    <input type="radio" name="role" id="role3" value="lead" className="custom-radio-input"/>
                                    <label for="role3" className="custom-radio-label">I lead a team that manages social media</label>

                                    <input type="radio" name="role" id="role4" value="other" className="custom-radio-input"/>
                                    <label for="role4" className="custom-radio-label">Other</label>
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <div className="form-section">
                            <h4 className='text-primary'>Expand Your Social Reach</h4>
                            <div className="custom-preview-height">
                                <div className="social-connect-grid ">
                                    <div className="connect-header">
                                        <p>Connect a third social account now to save time on cross-posting, engaging
                                            with your audience, and growing your brand across platforms.</p>
                                    </div>
                                    <div className="platform-grid">
                                        <div className="platform-grid d-flex flex-wrap gap-3 my-3">
                                            {connectedPlatforms
                                                .filter(acc => ['facebook', 'linkedin'].includes(acc.social_user_platform))
                                                .map((acc, idx) => {
                                                const platform = acc.social_user_platform;
                                                const isConnected = acc.status === 'Connected';

                                                return (
                                                    <div key={idx} className={`platform-card ${platform}`} style={{ minWidth: '180px', position: 'relative' }} >
                                                        <div className="platform-icon">
                                                            {platform === 'facebook' && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                                </svg>
                                                            )}
                                                            {platform === 'linkedin' && (
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                                    <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5v15H0v-15zM7.5 8.98H12v2.1h.07c.63-1.2 2.18-2.46 4.49-2.46 4.8 0 5.68 3.16 5.68 7.28v8.08h-5v-7.16c0-1.71-.03-3.91-2.39-3.91-2.39 0-2.76 1.87-2.76 3.79v7.28h-5v-15z"/>
                                                                </svg>
                                                            )}
                                                        </div>

                                                        {AppLoading ? (
                                                            <div className="connect-badge">
                                                                <span><i className="fas fa-spin fa-spinner"></i></span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                            {platform === 'facebook' && (
                                                                <div className="connect-badge">
                                                                    <span>{isConnected ? 'Connected' : 'Connect'}</span>
                                                                </div>
                                                            )}

                                                            {platform === 'linkedin' && (
                                                                <div className="connect-badge">
                                                                    <span>{isConnected ? 'Connected' : 'Connect'}</span>
                                                                </div>
                                                            )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                    <div className="">
                                        <button type="button" ref={liTriggerRef} onClick={() => setShowConnectModal(true)} className="btn btn-hover-effect btn-primary w-100 d-flex align-items-center justify-content-center my-3">
                                            <i className="fa-solid fa-plus fs-5 me-2"></i> Connect accounts
                                        </button>
                                        <AccountNotConnectedComponent
                                            show={showConnectModal}
                                            onHide={() => setShowConnectModal(false)}
                                            onSuccess={() => {
                                                // You can optionally reload dashboard data here
                                                toast.success('Account connected successfully.', {
                                                    position: 'top-center',
                                                    autoClose: 5000,
                                                    hideProgressBar: false,
                                                    closeOnClick: true,
                                                });
                                            }}
                                            setIsConnectedAccountInfo={setIsConnectedAccountInfo}
                                            pageURL={pageURL}
                                        />
                                        {/* <div className="platform-card facebook">
                                            <div className="platform-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                </svg>
                                            </div>
                                            {AppLoading ? (
                                                <div className="connect-badge">
                                                    <span><i className="fas fa-spin fa-spinner"></i></span>
                                                </div> 
                                            ) : (
                                                <FacebookLogin
                                                    appId={FB_APP_ID}
                                                    autoLoad={false}
                                                    fields="name,email,picture,accounts"
                                                    scope="pages_show_list,pages_manage_metadata,pages_read_engagement,
                                                            pages_read_user_content,pages_manage_posts,pages_manage_engagement,read_insights
                                                            "
                                                    callback={responseFacebook}                                                            
                                                    render={renderProps => (
                                                        <div className="connect-badge" onClick={renderProps.onClick}>
                                                            <span>Connect</span>
                                                        </div>                                                        
                                                    )}                                                                     
                                                /> 
                                            )}                                           
                                                                                           
                                        </div> */}
                                        {/* <div className="platform-card instagram">
                                            <div className="platform-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                                                    <defs>
                                                        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stop-color="#feda75"></stop>
                                                            <stop offset="25%" stop-color="#fa7e1e"></stop>
                                                            <stop offset="50%" stop-color="#d62976"></stop>
                                                            <stop offset="75%" stop-color="#962fbf"></stop>
                                                            <stop offset="100%" stop-color="#4f5bd5"></stop>
                                                        </linearGradient>
                                                    </defs>
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient)"></rect>
                                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="url(#instagram-gradient)"></path>
                                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#instagram-gradient)" stroke-width="2"></line>
                                                </svg>
                                            </div>
                                            <div className="connect-badge">
                                                <span>Connect</span>
                                            </div>
                                        </div>
                                        <div className="platform-card twitter">
                                            <div className="platform-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                                </svg>
                                            </div>
                                            <div className="connect-badge">
                                                <span>Connect</span>
                                            </div>
                                        </div> */}
                                        {/* <div className="platform-card linkedin">
                                            <div className="platform-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                    <rect x="2" y="9" width="4" height="12"></rect>
                                                    <circle cx="4" cy="4" r="2"></circle>
                                                </svg>
                                            </div>
                                            <div className="connect-badge">
                                                <span>Connect</span>
                                            </div>
                                        </div> */}
                                    </div>
                                    <div className="benefits-section">
                                        <div className="benefit-item">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                            </svg>
                                            <p className="mb-1">Cross-post to multiple platforms simultaneously</p>
                                        </div>
                                        <div className="benefit-item">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                            </svg>
                                            <p className="mb-1">Engage with all your audiences from one dashboard</p>
                                        </div>
                                        <div className="benefit-item">
                                            <svg viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                            </svg>
                                            <p className="mb-1">Grow your brand presence across platforms</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>                    
                    </>
                );
            default:
            return null;
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="row m-0">
                <div
                    className="col-xl-7 p-0"
                    style={{
                        backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/login/sign-up.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="col-xl-5 p-0">
                    <div className="login-card login-dark">
                        <div>
                            <LoginSignupLogo />
                            <div className="login-main multi-step-container">                                
                                <div className="progress mb-3" style={{ height: '6px' }}>
                                    <div className="progress-bar"
                                        style={{ width: `${(step / 3) * 100}%` }} role="progressbar" aria-valuenow={step} aria-valuemin="1" aria-valuemax="3"/>
                                    </div>
                                    { renderStepContent()}
                                    
                                <div className="d-flex justify-content-between mt-4">
                                    {step === 1 && (  
                                        // <button type="button" onClick={handleNext} className="btn btn-primary ms-auto">
                                        //     Next
                                        // </button>
                                        <></>
                                    )}
                                    {step === 2 && (
                                        <>
                                            <button type="button" onClick={handleNext} className="btn btn-outline-secondary">
                                                skip
                                            </button>  
                                            <button type="button" onClick={handleNext} className="btn btn-primary ms-auto">
                                                Next
                                            </button>
                                        </>                                                    
                                    )}
                                    {step === 3 && (
                                        <button type="button" className="btn btn-primary ms-auto" onClick={clickAddMoreLater}>
                                            {connectedPlatforms && connectedPlatforms.length > 0 ? 'Add later' : 'Done'}
                                        </button>
                                    )}
                                </div>                                                          
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
