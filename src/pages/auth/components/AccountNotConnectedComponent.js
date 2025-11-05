import React, { useState,useEffect,useRef } from 'react';
import { Modal, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from "axios";
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import {useLocation} from 'react-router-dom';
import queryString from 'query-string';
import { encryptToken } from '../utils/encryption';
import { decryptToken } from '../utils/decryption';
import PlatformStepLoader from './PlatformStepLoader';

const AccountNotConnectedComponent = ({ onSuccess, show, onHide, pageURL, setIsConnectedAccountInfo, selectedPlatform }) => {
  const [AppLoading, setAppLoading] = useState(false);
  const [LinkedinLoading, setLinkedinLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [linkedInPages, setLinkedInPages] = useState([]);
  const [linkedInProfile, setLinkedInProfile] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const location  = useLocation();
  const FB_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;
  const currentOrigin = window.location.origin;   
  const CLIENT_ID = process.env.REACT_APP_LINKEDIN_CLIENT_ID;
  const REDIRECT_URI = `${currentOrigin}${pageURL}`;      
  const SCOPE = 'w_member_social w_organization_social r_organization_social r_organization_admin r_basicprofile openid email profile rw_organization_admin';
  const State = "linkedin";
  const hasRun = useRef(false);       
  // LinkedIn Popup styles
  const styles = {
      overlay: {
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
      },
      popup: {
          background: '#fff',
          borderRadius: '10px',
          padding: '24px',
          width: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
      },
      pageList: {
          marginTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
      },
      pageItem: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 0',
          borderBottom: '1px solid #eee',
      },
      logo: {
          width: '50px',
          height: '50px',
          borderRadius: '6px',
          objectFit: 'cover',
      },
      pageDetails: {
          flexGrow: 1,
      },
      actions: {
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
      },
      cancelBtn: {
          padding: '8px 16px',
          backgroundColor: '#ddd',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
      },
      submitBtn: {
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
      },
  };    
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const fbLoginClickRef = useRef(null);

  useEffect(() => {
    if (show && selectedPlatform) {
      const timer = setTimeout(() => {
        if (selectedPlatform.toLowerCase() === 'facebook' && fbLoginClickRef.current) {
          setAppLoading(true);
          fbLoginClickRef.current();
        }
        if (selectedPlatform.toLowerCase() === 'linkedin') {
          setLinkedinLoading(true);
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (!code) {
            handleLogin();
          }
        }
      }, 400); // 0.4s delay
      return () => clearTimeout(timer);
    }
  }, [show, selectedPlatform]);


  // Start Facebook Account Connect Function
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
      // 4️⃣ Delegate to your own account‑linking logic
      connectAccount('Facebook', accessToken);
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
              position: 'top-center',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
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
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
          });
          return false;
        } 
      } catch (error) {     
        setCurrentStep('Connection failed');
        setConnectionProgress(0);     
        console.error('Token Extension Error:', error);
        toast.error(error.message || 'Failed to connect Facebook account');
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

    useEffect(() => {   
      if (hasRun.current) return;
      hasRun.current = true;

      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      if (code) {
        setLinkedinLoading(true);
        window.history.replaceState({}, '', pageURL);
        const { token: encrypted, iv } = encryptToken(code);
        axios.post(`${BACKEND_URL}/api/auth/linkedin`, {token: encrypted,iv,REDIRECT_URI}, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
          }
        })
        .then(async res => {
          // const token = decryptToken(res.data.token);
          const token = res.data.token;
          localStorage.setItem('accessToken', JSON.stringify(token));
          // localStorage.setItem('refreshToken', res.data.token.refresh_token);
          const userProfile = await fetchUserProfile(token);
          if (userProfile) {
            const linkedInBusinessPage = await fetchUserLinkedinPage(token);
            if(linkedInBusinessPage){
              popupforlinkedinPage(userProfile.profile,linkedInBusinessPage.organizations);
            }
          }
        })
        .catch(err => {
          setLinkedinLoading(false);
          onHide();
          toast.error('LinkedIn connect failed');
          window.history.replaceState({}, '', pageURL);
        });
      }
    }, [location.search]);

    const fetchUserProfile = async (token) => {
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      try {
        const res = await axios.post(`${BACKEND_URL}/api/auth/linkedin/profile`,{ token },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
            }
          }
        );
        
        return res.data;
      } catch (err) {
        setLinkedinLoading(false);
        toast.error('LinkedIn Profile fetch failed. Please try again later.');
        console.error('Profile fetch failed:', err.response?.data || err.message);
        return null;
      }
    };
    
    const fetchUserLinkedinPage = async (token) => {
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      try {
        const res = await axios.post(`${BACKEND_URL}/api/auth/linkedin/pages`,{ token },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
            }
          }
        );
  
        return res.data;
      } catch (err) {
        setLinkedinLoading(false);
        toast.error('LinkedIn Business Pages fetch failed. Please try again later.');
        console.error('Business Page fetch failed:', err.response?.data || err.message);
        return null;
      }
    };
  
    const popupforlinkedinPage = (profile,pages) => {
      setLinkedInProfile(profile);
      setLinkedInPages(pages);
      setLinkedinLoading(false);
      setShowPopup(true);
    };
  
    const handleCheckboxChange = (id) => {
      setSelectedPages((prev) =>
        prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
      );
    };
  
    const handleSubmit = async() => {
      setShowPopup(false);
      setLinkedinLoading(false);
      connectAccount('LinkedIn');
      const access_token = localStorage.getItem('accessToken');
      const selectedData = linkedInPages.filter((page) => selectedPages.includes(page.id));
      // console.log('Selected Pages to Save:', selectedData);
      await saveLinkedinProfileData(linkedInProfile, selectedData, access_token);
    };
  
    const saveLinkedinProfileData = async (profileData, pageData, accessToken) => { 
      // setAppLoading(true);
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken');
      const page_access_token = JSON.parse(accessToken);
      const userData = profileData;
      const social_user_platform = 'linkedin';
      try {
        const submissionResponse = await fetch(`${BACKEND_URL}/api/linkedin/save-social-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + storedToken
          },
          body: JSON.stringify({ 
            data: userData, 
            accessToken: page_access_token,
            social_user_platform: social_user_platform 
          }),
        });
  
        const response = await submissionResponse.json();
        if(response.createAccount===false){
          toast.error('This account is already linked to our platform.', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
          }); 
        }else if(response.createAccount===true){
          await saveLinkedinPages(pageData, page_access_token, userData.sub);                    
        }else if(response.createAccountError===false){
          toast.error('Server technical problem, try agian.', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
          });  
        }else {
          // setAppLoading(false);
          toast.error('Server technical problem, try agian.', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
          });                
        }
      } catch (error) {
        // setAppLoading(false);
        console.error('Token Extension Error:', error);
      }
    };
  
    const saveLinkedinPages = async (pagesListData, page_access_token, user_social_id) => { 
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken'); 
      const data = pagesListData;
      const page_platform = 'linkedin';
      try {    
          const postResponse = await fetch(`${BACKEND_URL}/api/linkedin/save-pages`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + storedToken
              },
              body: JSON.stringify({pagesData:data, social_id:user_social_id, token:page_access_token, page_platform:page_platform}),
          });
  
          if (!postResponse.ok) {
              throw new Error(`HTTP error! Status: ${postResponse.status}`);
          }
          const postData = await postResponse.json();
          await fetchLinkedinAnalytics(pagesListData, page_access_token, user_social_id);
          localStorage.removeItem('userinfo');
          localStorage.setItem('userinfo', JSON.stringify(postData.userInfo));          
          const rawUserInfo = localStorage.getItem('userinfo');
          const userInfoData = JSON.parse(rawUserInfo);
          if(userInfoData.socialData && Array.isArray(userInfoData.socialData)) {
            setIsConnectedAccountInfo(userInfoData.socialData);           
          }
          // setAppLoading(false); 
          // setShowConnectModal(false);                
      } catch (error) {
          // setAppLoading(false);
          console.error('Error processing page:', error);
      }
    };
  
    const fetchLinkedinAnalytics = async (pagesListData, page_access_token, user_social_id) => { 
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken'); 
      const data = pagesListData;
      try {    
        const getAnalytics = await fetch(`${BACKEND_URL}/api/linkedin/fetch-page-analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + storedToken
          },
          body: JSON.stringify({ pagesData:data, token:page_access_token}),
        });
  
        if (!getAnalytics.ok) {
          throw new Error(`HTTP error! Status: ${getAnalytics.status}`);
        }
        const analyticsData = await getAnalytics.json();
        saveLinkedinAnalytics(analyticsData, pagesListData, page_access_token, user_social_id);           
      } catch (error) {
        console.error('Error processing page:', error);
      }
    };
  
    const saveLinkedinAnalytics = async (analyticsData, pagesListData, page_access_token, user_social_id) => { 
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken');
      const platform = 'linkedin';

      analyticsData.analytics.map(async (item) => {
        const analyticData = item;
        console.log("Analytic per page:",analyticData);
        // page_daily_follows
        try {
            const page_daily_follows = await fetch(`${BACKEND_URL}/api/linkedin/create_analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                        analyticsData : analyticData.followerUpdates.data, 
                        platform : platform, 
                        analyticType : "page_daily_follows",
                        orgId : analyticData.orgId
                    }),
            });

            if (!page_daily_follows.ok) {
                throw new Error(`HTTP error! Status: ${page_daily_follows.status}`);
            }
            const message = await page_daily_follows.json();
            // console.log("page_daily_follows: ",message);             
        } catch (error) {
          console.error('Error processing page followers:', error);
        }

        // page_impressions
        try {
            const page_impressions = await fetch(`${BACKEND_URL}/api/linkedin/create_analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                        analyticsData : analyticData.shareStatisticsUpdates.data, 
                        platform : platform, 
                        analyticType : "page_impressions",
                        orgId : analyticData.orgId
                    }),
            });

            if (!page_impressions.ok) {
                throw new Error(`HTTP error! Status: ${page_impressions.status}`);
            }
            const message = await page_impressions.json();
            // console.log("page_impressions: ",message);             
        } catch (error) {
          console.error('Error processing page impressions :', error);
        }

        // page_impressions_unique
        try {
            const page_impressions_unique = await fetch(`${BACKEND_URL}/api/linkedin/create_analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                        analyticsData : analyticData.shareStatisticsUpdates.data, 
                        platform : platform, 
                        analyticType : "page_impressions_unique",
                        orgId : analyticData.orgId
                    }),
            });

            if (!page_impressions_unique.ok) {
                throw new Error(`HTTP error! Status: ${page_impressions_unique.status}`);
            }
            const message = await page_impressions_unique.json();
            // console.log("page_impressions_unique: ",message);             
        } catch (error) {
          console.error('Error processing page unique impressions :', error);
        }

        // page_views_total
        try {
            const pageViews = analyticData.pageViewUpdates.data;
            let filteredPageViews = [];
            pageViews.forEach((analyticItem) => {
                filteredPageViews.push({'pageStats':analyticItem.totalPageStatistics.views.allPageViews, 'timeRange':analyticItem.timeRange});
            });
            const page_views_total = await fetch(`${BACKEND_URL}/api/linkedin/create_analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                        analyticsData : filteredPageViews, 
                        platform : platform, 
                        analyticType : "page_views_total",
                        orgId : analyticData.orgId
                    }),
            });

            if (!page_views_total.ok) {
                throw new Error(`HTTP error! Status: ${page_views_total.status}`);
            }
            const message = await page_views_total.json();
            // console.log("page_views_total: ",message);             
        } catch (error) {
          console.error('Error processing page views :', error);
        }

        // page_post_engagements
        try {
            const page_post_engagements = await fetch(`${BACKEND_URL}/api/linkedin/create_analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                        analyticsData : analyticData.shareStatisticsUpdates.data, 
                        platform : platform, 
                        analyticType : "page_post_engagements",
                        orgId : analyticData.orgId
                    }),
            });

            if (!page_post_engagements.ok) {
                throw new Error(`HTTP error! Status: ${page_post_engagements.status}`);
            }
            const message = await page_post_engagements.json();
            // console.log("page_post_engagements: ",message);             
        } catch (error) {
          console.error('Error processing page engaged:', error);
        }

        // page_likes_total
        try {
            const page_likes_total = await fetch(`${BACKEND_URL}/api/linkedin/create_analytics`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                        analyticsData : analyticData.shareStatisticsUpdates.data, 
                        platform : platform, 
                        analyticType : "page_actions_post_reactions_like_total",
                        orgId : analyticData.orgId
                    }),
            });

            if (!page_likes_total.ok) {
                throw new Error(`HTTP error! Status: ${page_likes_total.status}`);
            }
            const message = await page_likes_total.json();
            // console.log("page_likes_total: ",message);             
        } catch (error) {
          console.error('Error processing page likes:', error);
        }
      });

      // trigger to post save of every page that users connects
      saveLinkedinPosts(pagesListData, page_access_token, user_social_id);
    };

    const saveLinkedinPosts = async ( pagesListData, page_access_token, user_social_id ) => {
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken');
      const data = pagesListData;
      try {
        const savePosts = await fetch(`${BACKEND_URL}/api/linkedin/save-posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + storedToken
          },
          body: JSON.stringify({ pagesData:data, token:page_access_token}),
        });
  
        if (!savePosts.ok) {
          throw new Error(`HTTP error! Status: ${savePosts.status}`);
        }
        const savePostsResponse = await savePosts.json();
        saveLinkedinPostsComments(pagesListData, page_access_token, user_social_id);             
      } catch (error) {
        console.error('Error saving posts:', error);
      }
    }

    const saveLinkedinPostsComments = async ( pagesListData, page_access_token, user_social_id ) => {
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken');
      const data = pagesListData;
      try {    
        const savePostsComments = await fetch(`${BACKEND_URL}/api/linkedin/save-posts-comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + storedToken
          },
          body: JSON.stringify({ pagesData:data, token:page_access_token}),
        });
  
        if (!savePostsComments.ok) {
          throw new Error(`HTTP error! Status: ${savePostsComments.status}`);
        }
        const savePostsCommentsResponse = await savePostsComments.json();
        saveLinkedinPageDemographics(pagesListData, page_access_token, user_social_id);
      } catch (error) {
        console.error('Error saving posts comments:', error);
      }
    }

    const saveLinkedinPageDemographics = async ( pagesListData, page_access_token, user_social_id ) => {
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const storedToken = localStorage.getItem('authToken');
      const data = pagesListData;
      try {    
        const savePostsDemogrphics = await fetch(`${BACKEND_URL}/api/linkedin/save-demographics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + storedToken
          },
          body: JSON.stringify({ pagesData:data, token:page_access_token, social_userid: user_social_id}),
        });
  
        if (!savePostsDemogrphics.ok) {
          throw new Error(`HTTP error! Status: ${savePostsDemogrphics.status}`);
        }
        const savePostsDemographicsResponse = await savePostsDemogrphics.json();
      } catch (error) {
        console.error('Error saving posts comments:', error);
      }
    }
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
          toast.error("Failed to save account connection.");
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
          onSuccess();  // Trigger parent fetch (optional if parent handles re-fetching)
          onHide();     // Close modal
          setAppLoading(false);
        }, 16000);
      }

      if (platform === 'LinkedIn') {
        // Your LinkedIn flow uses a different path via handleSubmit
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCurrentStep('Authenticating with LinkedIn...');
        setConnectionProgress(12);

        setTimeout(() => {
          setCurrentStep('Requesting page access...');
          setConnectionProgress(24);
        }, 2000);
        setTimeout(() => {
          setCurrentStep('Fetching Page Analytics data...');
          setConnectionProgress(36);
        }, 4000);
        setTimeout(() => {
          setCurrentStep('Fetching Posts and Comments data...');
          setConnectionProgress(48);
        }, 8000);
        setTimeout(() => {
          setCurrentStep('Syncing account data...');
          setConnectionProgress(60);
        }, 12000);
        setTimeout(() => {
          setCurrentStep('Syncing Inbox data...');
          setConnectionProgress(72);
        }, 16000);
        setTimeout(() => {
          setCurrentStep('Saving Demogrphics...');
          setConnectionProgress(84);
        }, 20000);
        setTimeout(() => {
          setCurrentStep('Almost there...');
          setConnectionProgress(96);
        }, 24000);
        setTimeout(() => {
          setCurrentStep('Finalizing...');
          setConnectionProgress(100);
        }, 26000);

        // ✅ Now refresh the data and close the modal after final step
        setTimeout(() => {
          const rawUserInfo = localStorage.getItem("userinfo");
          const userInfoData = JSON.parse(rawUserInfo || "{}");
          const accountInfo = userInfoData.socialData || [];

          setIsConnectedAccountInfo(accountInfo); // Now safely set in parent
          onSuccess();  // Trigger parent fetch (optional if parent handles re-fetching)
          onHide();     // Close modal
          setAppLoading(false);
        }, 28000);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Connection failed. Please try again.');
      setAppLoading(false);
    }
  };

  return (
    <div>
      {/* Only show Modal if showPopup is false */}
      {!showPopup && (
        <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
          <Modal.Header closeButton onHide={onHide}>
            {AppLoading ?
            ( <Modal.Title style={{fontSize:'15px'}} className="text-success">Saving Your Data Now.. 😉</Modal.Title> ) :
            ( <Modal.Title style={{fontSize:'15px'}} className="text-danger">Connect your account</Modal.Title> ) }
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
                // <PlatformStepLoader
                //   platform={selectedPlatform}
                //   steps={
                //     selectedPlatform?.toLowerCase() === 'facebook'
                //       ? [
                //           "Authenticating account",
                //           "Requesting page access",
                //           "Fetching Page Analytics",
                //           "Fetching Posts and Comments",
                //           "Syncing Account Data",
                //           "Syncing Inbox Messages",
                //           "Finalizing connection"
                //         ]
                //       : [
                //           "Authenticating LinkedIn account",
                //           "Requesting organization access",
                //           "Fetching Analytics",
                //           "Fetching Posts and Comments",
                //           "Syncing Account Data",
                //           "Saving Demographics",
                //           "Finalizing connection"
                //         ]
                //   }
                //   onComplete={() => {
                //     const rawUserInfo = localStorage.getItem("userinfo");
                //     const userInfoData = JSON.parse(rawUserInfo || "{}");
                //     const accountInfo = userInfoData.socialData || [];
                //     setIsConnectedAccountInfo(accountInfo);
                //     onSuccess();
                //     onHide();
                //     setAppLoading(false);
                //   }}
                // />
              ) : LinkedinLoading ? (
                <div className="loading-container">
                  <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                  <p className="my-auto ms-2">Please wait, While we fetch your data.</p>
                </div> 
              ) : (
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <button className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center">
                      <i className="fa-brands fa-facebook me-2"></i>
                      <FacebookLogin
                        appId={FB_APP_ID}
                        autoLoad={false}
                        fields="name,email,picture,accounts"
                        scope="pages_show_list,pages_manage_metadata,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement,read_insights,pages_messaging,ads_management,ads_read,business_management"
                        callback={responseFacebook}                                                            
                        render={renderProps => {
                          fbLoginClickRef.current = renderProps.onClick;
                          return <span onClick={renderProps.onClick} style={{cursor:'pointer'}} >Facebook</span>
                        }}                                                                     
                      />                                                                   
                    </button>                        
                  </div>
                  <div className="col-12 col-md-4">
                    <button onClick={handleLogin} className="btn btn-outline-info w-100 d-flex align-items-center justify-content-center">
                      <i className="fa-brands fa-linkedin me-2"></i>
                      LinkedIn
                    </button>
                  </div>
                  <div className="col-12 col-md-4">
                    <button className="btn btn-outline-danger disabled w-100 d-flex align-items-center justify-content-center">
                      <i className="fa-brands fa-instagram me-2"></i>
                      Instagram
                    </button>
                  </div>                                                    
                </div>
              )} 
            </div>    
          </Modal.Body>
        </Modal>
      )}

      {/* Popup for LinkedIn Pages */}
      {showPopup && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
          <h2>Select Your LinkedIn Pages</h2>
          <div style={styles.pageList}>
            {Array.isArray(linkedInPages) &&
            linkedInPages.map((page,key) => (
              <div key={page.id} style={styles.pageItem}>
              <img
                src={page.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier || 'https://via.placeholder.com/60'}
                alt={page.localizedName}
                style={styles.logo}
              />
              <div style={styles.pageDetails}>
                <strong>{page.localizedName}</strong>
                {/* <p style={{ margin: 0 }}>{page.localizedWebsite}</p> */}
              </div>
              <input
                type="checkbox"
                checked={selectedPages.includes(page.id)}
                onChange={() => handleCheckboxChange(page.id)}
              />
              </div>
            ))}
          </div>
          <div style={styles.actions}>
            {/* <button onClick={() => setShowPopup(false)} style={styles.cancelBtn}>
            Cancel
            </button> */}
            <button
            onClick={handleSubmit}
            disabled={selectedPages.length === 0}
            style={{
              ...styles.submitBtn,
              backgroundColor: selectedPages.length ? '#0073b1' : '#ccc',
              cursor: selectedPages.length ? 'pointer' : 'not-allowed',
            }}
            >
            Submit
            </button>
          </div>
          </div>
        </div>
      )}
      {/* end Popup for LinkedIn Pages */}
    </div>
  )
}

export default AccountNotConnectedComponent;