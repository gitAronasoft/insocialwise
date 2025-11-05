import React, { useState,useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import {Link,useNavigate,useLocation} from 'react-router-dom';
import moment from 'moment';
import { toast } from 'react-toastify';
//import axios from "axios";
import 'react-multi-carousel/lib/styles.css';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AccountNotConnectedComponent from './components/AccountNotConnectedComponent';
import HoverPostPreview from './components/HoverPostPreview';
import HoverPostPreviewMultiple from './components/HoverPostPreviewMultiple';
import ConnectedPlatforms from './components/ConnectedPlatforms';
import RecentActivitySkeleton from './components/RecentActivitySkeleton';
import Carousel from "react-multi-carousel";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [draftPostLoading, setdraftPostLoading] = useState(false);
  const [authInfo, setauthInfo] = useState(null);
  const [connectedAccountInfo, setIsConnectedAccountInfo] = useState([]);
  const [draftPosts, setIsDraftPosts] = useState([]);  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [trendingTopic, setTrendingTopic] = useState('Software Company');
  const [trendingTopicLoading, setTrendingTopicLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [trendingTopicList, setTrendingTopicList] = useState([]);
  const [fullScreenLoader, setFullScreenLoader] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const navigate = useNavigate();
  const location  = useLocation();
  
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState(null);

  // modal visibility and (optional) which platform user clicked
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(true);
  const [recentActivities, setrecentActivities] = useState([]);

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 2,
      slidesToSlide: 2
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state === 'linkedin') {
      // Only open the modal — AccountNotConnectedComponent will handle the code
      setSelectedPlatform(null); 
      setShowConnectModal(true);

      // Clean URL
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('code');
      cleanUrl.searchParams.delete('state');
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [location.search]);

  useEffect(() => {
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
    
    // Set authInfo
    if (userInfoData && userInfoData.userData) { 
      setauthInfo(userInfoData.userData);
    } else {
      setauthInfo(null);
    }

    // Set connected social accounts
    const rawUserInfo = localStorage.getItem('userinfo');
    if (rawUserInfo) {
      const userInfo = JSON.parse(rawUserInfo);
      const socialAccounts = userInfo?.socialData;
      if (!Array.isArray(socialAccounts) || socialAccounts.length === 0) {
        setShowConnectModal(false);
      } else {
        setIsConnectedAccountInfo(socialAccounts);
      }
    } else {
      setShowConnectModal(false);
    }

    // === Fetch Draft Posts ===
    setdraftPostLoading(true);
    const authToken = localStorage.getItem('authToken');

    try {
      fetch(`${BACKEND_URL}/api/draftPosts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data && Array.isArray(data.userPosts)) {
            // Step 1: Normalize post data
            const draftPostsList = data.userPosts
              .map(post => {
                if (!post || !post.socialPages || post.socialPages.length === 0) return null;
                return {
                  form_id: post.form_id,
                  content: post.content || "No message",
                  postPageID: post.page_id,
                  postID: post.id,
                  user_uuid: post.user_uuid,
                  token: post.socialPages[0]?.token || "",
                  postPageName: post.socialPages[0]?.pageName || "",
                  postPagePicture: post.socialPages[0]?.page_picture || "",
                  postMedia: post.post_media || "No media",
                  platform: post.platform,
                  createdAt: post.createdAt,
                  updatedAt: post.updatedAt,
                };
              })
              .filter(post => post !== null);

            // Step 2: Group posts by form_id
            const groupedPosts = draftPostsList.reduce((acc, post) => {
              if (!acc[post.form_id]) {
                acc[post.form_id] = {
                  form_id: post.form_id,
                  createdAt: post.createdAt,
                  updatedAt: post.updatedAt,
                  content: post.content,
                  posts: []
                };
              }
              acc[post.form_id].posts.push({
                postID: post.postID,
                pageID: post.postPageID,
                pageName: post.postPageName,
                pagePicture: post.postPagePicture,
                token: post.token,
                platform: post.platform,
                postMedia: post.postMedia
              });
              return acc;
            }, {});

            // Step 3: Convert object to array
            const groupedArray = Object.values(groupedPosts);
            setIsDraftPosts(groupedArray);
            setdraftPostLoading(false);
          } else {
            setdraftPostLoading(false);
            console.error("No posts data found or invalid structure");
          }
        })
        .catch((error) => {
          setdraftPostLoading(false);
          console.error('Post save error.', error);
        });
    } catch (error) {
      setdraftPostLoading(false);
      console.error("Error scheduling post:", error);
    }

    // Fetch trending topics
    const fetchTrendingTopic = async () => {
      await trendingTopics();
    };
    fetchTrendingTopic();
  }, []);

  useEffect(() => {
    //console.log('Updated connectedAccountInfo:', connectedAccountInfo);
  }, [connectedAccountInfo]);

  useEffect(() => {
    setAnalyticsLoading(true);
    fetchPlatforms();    
  },[])

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem("authToken");
        const formattedDateTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
        setRecentActivitiesLoading(true);
        const activitiesRes = await fetch(`${BACKEND_URL}/api/recent/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({ dateTime: formattedDateTime }),
        });

        const result = await activitiesRes.json();
        if (result.success) {
          //console.log("recent activities:", result.data);
          setrecentActivities( result.data);
        } else {
          console.log("error fetching recent activities:", result.message);
        }
      } catch (error) {
        console.log("response error: ", error);
      } finally {
        setRecentActivitiesLoading(false);
      }
    };
    fetchRecentActivities();
  }, []);

  const fetchPlatforms = async()=>{
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    const authToken = localStorage.getItem('authToken');
    try {
      fetch(`${BACKEND_URL}/api/fetch-profileAnalytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken,
        },
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.profileAnalytics) {
          setAnalytics(data.profileAnalytics);
          if (data && Array.isArray(data.scheduledPostsThisWeek)) {
            // console.log("schedule data: ",data.scheduledPostsThisWeek);
            const formattedPosts = data.scheduledPostsThisWeek.map(post => {
              const scheduledTime = post.schedule_time 
                ? new Date(post.schedule_time * 1000)  // Convert from Unix timestamp to Date object
                : post.createdAt 
                ? new Date(post.createdAt)  // Fallback to createdAt if schedule_time is missing
                : new Date();  // Default to current date if neither exists
              
              if (!post.schedule_time) {
                console.warn("Missing schedule_time for post:", post);
              }

              const currentTime = new Date();
              const isExpired = scheduledTime < currentTime;

              // Detect media type
              let mediaType = "text";
              try {
                  if (post.post_media) {
                      const parsed = typeof post.post_media === "string" ? JSON.parse(post.post_media) : post.post_media;

                      if (Array.isArray(parsed) && parsed.length > 0) {
                          const firstMedia = parsed[0];
                          if (firstMedia.type) {
                              // Use type field if exists
                              mediaType = firstMedia.type;
                          } else if (firstMedia.path) {
                              // Fallback: detect from file extension
                              if (/\.(mp4|mov|avi|webm)$/i.test(firstMedia.path)) mediaType = "video";
                              else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(firstMedia.path)) mediaType = "image";
                              else mediaType = "file";
                          }
                      }
                  }
              } catch (err) {
                  console.log("Media type detection error:", err);
              }

              // Format the scheduled time
              const formattedTime = moment(scheduledTime).format('hh:mm A');                       
              return {
                title: isExpired ? "Expired" : `${post.content || "No message"}`,
                start: scheduledTime,
                end: scheduledTime,
                description: `${post.content} - ${formattedTime}`,
                postPageID: post.page_id,
                postID: post.id,
                postMedia: `${post.post_media || ""}`, 
                postPageName: post.pageData.pageName,
                postPagePicture: post.pageData.page_picture,
                platform: post.post_platform,
                content: post.content,
                form_id: post.form_id,
                isExpired,
                schedule_time: post.schedule_time,
                formattedTime: formattedTime,
                mediaType 
              };
            }).filter(post => post !== null);
            setScheduledPosts(formattedPosts);
          } else {
            console.error("No posts data found or invalid structure");
          }                                     
          setAnalyticsLoading(false);
        } else {
          setAnalyticsLoading(false);
          console.error("No posts data found or invalid structure");
        }
      })
      .catch((error) => {
        setAnalyticsLoading(false);
        console.error('Post save error.', error);                    
      });
    } catch (error) {
      setAnalyticsLoading(false);
      console.error("Error scheduling post:", error);                
    }
  }

  // Facebook Account Connect Funcation
  const disconnectFacebookSocialAccount = async (social_account_submit) => {
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
            setIsConnectedAccountInfo(userInfoData.socialData);
            fetchPlatforms();
          }
          toast.success('Account disconnected successfully.', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
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
  // End of Facebook Account Connect Functions  

  const handleChangeTopic = (e) => {
    const value = e.target.value;
    setTrendingTopic(value);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const trendingTopics = async () => {
    setTrendingTopicLoading(true);
    if(!trendingTopic) {      
      setHasInteracted(true);
      setTrendingTopicLoading(false);
      return;
    }  
    setHasInteracted(false);       
    setTrendingTopicList([]);
    try {
      // const response = await axios.post('https://n8n.socialwize.in/webhook/get-topics',
      //     {
      //       topic: trendingTopic
      //     }
      // );
      setTrendingTopicLoading(false);
      // setTrendingTopicList(response.data.output.topics);
      // console.log('Received trending topics:', response); 

      setTrendingTopicList([
            {
              "title": "The Future of [Specific Software Category]",
              "description": "Explore emerging trends in a specific software category relevant to the company (e.g., \"The Future of Cloud Computing,\" \"The Future of AI-Powered Marketing Software\"). Discuss market predictions, new technologies, and how these changes will impact businesses and users."
            },
            {
              "title": "Behind the Code: A Day in the Life",
              "description": "Offer a behind-the-scenes look at the company culture and development process. Showcasing employee stories, office life, and the challenges and triumphs of software creation can increase engagement. This could include Instagram stories, short LinkedIn videos, or Facebook live Q&As with developers."
            },
            {
              "title": "Software Solutions for [Industry] Challenges",
              "description": "Create content focusing on how the company's software solves specific problems within a particular industry. This could involve case studies, webinars, or blog posts demonstrating the software's value proposition."
            },
            {
              "title": "Productivity Hacks & Software Tips",
              "description": "Provide valuable, actionable advice and tips for using the software effectively. This can include tutorials, how-to guides, and quick tips on maximizing efficiency, driving user engagement."
            },
            {
              "title": "The Evolution of [Company's Software Product]",
              "description": "Highlight updates, new features, and the product's development journey. This is a great way to keep current users informed and attract potential customers."
            }
          ]
      );
      console.log("trending topics working.");               
    } catch (error) {
      console.error('Error triggering webhook:', error);
      setTrendingTopicLoading(false);
    }
  };

  const handleCreateDraft = (topic) => {
    setFullScreenLoader(true);
    navigate('/create-post', { state: { topic } });
    //console.log("title:", topic.title, 'description',topic.description);
  };

  function formatK(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num;
  }

  const getPlatformTextColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return '#1877F2'; // Facebook Blue
      case 'linkedin':
        return '#0A66C2'; // LinkedIn Blue
      case 'instagram':
        return '#C13584'; // Instagram Pink
      case 'twitter':
      case 'x': // In case you store it as "x"
        return '#1DA1F2'; // Twitter/X Blue
      case 'youtube':
        return '#FF0000'; // YouTube Red
      case 'tiktok':
        return '#010101'; // TikTok Black
      default:
        return '#6B7280'; // Neutral Gray (Tailwind Gray-500)
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'facebook':
        return 'linear-gradient(135deg, #2563EB, #1E40AF)'; // Facebook Blue gradient
      case 'linkedin':
        return 'linear-gradient(135deg, #2563EB, #1E40AF)'; // LinkedIn gradient
      case 'instagram':
        return 'linear-gradient(135deg, #C13584, #E1306C)'; // Instagram gradient
      case 'twitter':
      case 'x':
        return 'linear-gradient(135deg, #60A5FA, #2563EB)'; // Twitter gradient
      case 'youtube':
        return 'linear-gradient(135deg, #EF4444, #B91C1C)'; // YouTube gradient
      case 'tiktok':
        return 'linear-gradient(135deg, #000000, #FF0050)'; // TikTok gradient (black → red/pink)
      default:
        return 'linear-gradient(135deg, #6B7280, #374151)'; // Neutral gray gradient
    }
  };

  const platformSVGs = { 
    instagram: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram h-6 w-6 text-white">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    facebook: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook h-6 w-6 text-white">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    twitter: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter h-6 w-6 text-white">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
    linkedin: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin h-6 w-6 text-white">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    youtube: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube h-6 w-6 text-white">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    ),
  };

  const currentWeekDays = Array.from({ length: 7 }, (_, i) =>
    moment().startOf('isoWeek').add(i, 'days')
  );

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const openConnectModalFor = (platform) => {
    setSelectedPlatform(platform);
    setShowConnectModal(true);
  };

  const handleConnectHide = () => {
    setShowConnectModal(false);
    setSelectedPlatform(null);
  };

  const handleConnectSuccess = () => {
    // optional: re-fetch anything you need here after modal finishes its workflow
    // e.g., refetchConnectedAccounts();
    fetchPlatforms();
  };

  // delete model handle functions
    const handleDisconnectClick = (account) => {
      setAccountToDisconnect(account);
      setShowDisconnectModal(true);
    };

    const confirmDisconnect = () => {
      if (accountToDisconnect) {
        disconnectFacebookSocialAccount(accountToDisconnect.social_id);
        setShowDisconnectModal(false);
        setAccountToDisconnect(null);
      }
    };

    const cancelDisconnect = () => {
      setShowDisconnectModal(false);
      setAccountToDisconnect(null);
    };
  // delete model handle functions ends here

  const handleEdit = (formId) => {
    navigate("/edit-post", { state: { formId } });
  };

  return (
    <div className="page-wrapper compact-wrapper" >
        <Header/>
        <div className="page-body-wrapper">        
            <Sidebar/>
            <div className="page-body" style={{background: "#b6b6d50a"}}>
              {fullScreenLoader && (
                <div className="fullscreen-loader-overlay">
                  <div className="fullscreen-loader-content">
                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <h5 className="mt-3">Creating Draft Post...</h5>
                  </div>
                </div>
              )}

              <div className='row'> 
                <div className='col-md-12 col-xl-12'> 
                  <div className="grid-container animate-slide-up delay-1">
                    <div className="custom-grid-box">
                      <div className='total-post'> 
                        <div className='d-flex align-items-center justify-content-between'> 
                          <div> 
                            <div className='bell-ican'> <i className="fa-solid fa-file-lines"></i> </div> 
                          </div>
                          <div className='custom-badge'> {analytics?.posts?.summary?.growthRate ?? 0}% last week </div>
                        </div>
                        <div>
                          <div className='mt-2'>
                            {analyticsLoading? (
                              <Skeleton width={40} height={40} baseColor="#e0e0e0" highlightColor="#f5f6f7" />
                            ) : (
                              <h2>{formatK(analytics?.posts?.summary?.totalPosts) ?? 0}</h2>
                            )}
                          </div>
                          <span> Total Posts</span>
                        </div>
                      </div>
                    </div>
                    <div className="custom-grid-box">
                      <div className='engagement-rate'> 
                        <div className='d-flex align-items-center justify-content-between'> 
                          <div> 
                            <div className='engagement-ican'> <i className="fa-solid fa-chart-line"></i> </div> 
                          </div>
                          <div className='custom-badge'> {analytics?.engagement?.summary?.growthRate ?? 0}% last week </div>
                        </div>
                        <div>
                          <div className='mt-2'>
                            {analyticsLoading? (
                              <Skeleton width={40} height={40} baseColor="#e0e0e0" highlightColor="#f5f6f7" />
                            ) : (
                              <h2>{formatK(analytics?.engagement?.summary?.engagementRate) ?? 0}%</h2>
                            )}
                          </div>
                          <span> Engagement Rate</span>
                        </div>
                      </div>
                    </div>
                    <div className="custom-grid-box">
                      <div className='followers'> 
                        <div className='d-flex align-items-center justify-content-between'> 
                          <div> 
                            <div className='icon-users'> <i className="fa-solid fa-users"></i> </div> 
                          </div>
                          <div className='custom-badge'> {analytics?.followers?.summary?.growthRate ?? 0}% last week </div>
                        </div>
                        <div> 
                          <div className='mt-2'>
                            {analyticsLoading? (
                              <Skeleton width={40} height={40} baseColor="#e0e0e0" highlightColor="#f5f6f7" />
                            ) : (
                              <h2>{formatK(analytics?.followers?.summary?.totalFollowers) ?? 0}</h2>
                            )}
                          </div>
                          <span> Followers</span>
                        </div>
                      </div>
                    </div>
                    <div className="custom-grid-box">
                      <div className='reach'> 
                        <div className='d-flex align-items-center justify-content-between'> 
                          <div> 
                            <div className='reach-icon'> <i className="fa-solid fa-eye"></i> </div> 
                          </div>
                          <div className='custom-badge'> {analytics?.reach?.summary?.growthRate ?? 0}% last week </div>
                        </div>
                        <div> 
                          <div className='mt-2'>
                            {analyticsLoading? (
                              <Skeleton width={40} height={40} baseColor="#e0e0e0" highlightColor="#f5f6f7" />
                            ) : (
                              <h2>{formatK(analytics?.reach?.summary?.totalReach) ?? 0}</h2>
                            )}
                          </div>
                          <span> Reach</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-xl-8 col-md-8 col-sm-12 d-flex align-items-stretch">
                  <div className="card w-100 bg-white">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <div> 
                          <h5 className="mb-2"> Connected Platforms </h5> 
                          <p> Monitor all your social media accounts in one place </p>
                        </div>
                        <div>
                          <div className="dropdown my-3 remove-dropdown-ican">
                            <ConnectedPlatforms onPlatformSelect={openConnectModalFor} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="my-3 custom-accounts-card">
                      {loading ? (
                        <>
                          <p className="text-center"><i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i></p>                                              
                        </>
                        ) : connectedAccountInfo.filter(account => account.status === "Connected").slice(0, 3).length > 0 ? (
                          connectedAccountInfo.filter(account => account.status === "Connected").slice(0, 3).map((account) => (
                            <>
                              <div className='card addPlatform-card'>
                                <div className="d-flex align-items-center justify-content-between p-3">
                                  <div className="d-flex align-items-center"> 
                                    <div className="position-relative">
                                      <img className="img-fluid rounded-circle border" src={`${account.img_url}`} alt="PageImage" style={{width:'50px',height:'50px'}} />
                                      <div className={`${account.social_user_platform}-profile-img`} 
                                        style={{width:'30px',height:'30px',position:"absolute",right:"-12px",bottom:"-8px"}}>
                                        {platformSVGs[account.social_user_platform] || (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                            <path d="M2 12h20" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                    <div className="ms-4"> 
                                      <h6>{account.name}</h6>
                                      {analyticsLoading? (
                                        <Skeleton width={100} height={15} baseColor="#e0e0e0" highlightColor="#f5f6f7" /> 
                                      ) : (
                                        <p> {formatK(analytics?.followers?.socialUsers?.find( user => user.id === account.social_id )?.totalFollowers ?? 0 )} followers </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-3"> 
                                    <div className='d-flex align-items-center justify-content-between gap-3'>
                                      {analyticsLoading? (
                                        <>
                                          <div> <p> Posts: <span> <Skeleton width={40} height={15} baseColor="#e0e0e0" highlightColor="#f5f6f7" /> </span> </p> </div>
                                          <div> <p> Reach: <span className='green-text'><Skeleton width={40} height={15} baseColor="#e0e0e0" highlightColor="#f5f6f7" /> </span> </p> </div>
                                        </>
                                      ) : (
                                        <>
                                          <div> <p> Posts: <span> {formatK(analytics?.posts?.socialUsers?.find( user => user.id === account.social_id )?.totalPosts ?? 0 )} </span> </p> </div>
                                          <div> <p> Reach: <span className='green-text'>{Math.round(analytics?.reach?.socialUsers?.find( user => user.id === account.social_id )?.totalReach) || 0} </span> </p> </div>
                                        </>
                                      )} 
                                      
                                    </div>
                                    <button type="button" className='disconnect-btn' style={{ background: "transparent" }}
                                        onClick={(e) => { e.stopPropagation(); handleDisconnectClick(account); }} > 
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-unplug h-4 w-4"><path d="m19 5 3-3"></path><path d="m2 22 3-3"></path><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"></path><path d="M7.5 13.5 10 11"></path><path d="M10.5 16.5 13 14"></path><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"></path></svg>
                                    </button>
                                  </div>

                                </div>  
                              </div>                   
                            </>
                            ))
                          ) : (
                            <p className='text-danger'>No Account Connected</p>
                          )}
                      </div>

                    </div>
                  </div>

                  <AccountNotConnectedComponent
                    show={showConnectModal}
                    onHide={handleConnectHide}
                    onSuccess={handleConnectSuccess}
                    setIsConnectedAccountInfo={setIsConnectedAccountInfo}
                    pageURL={location.pathname}
                    selectedPlatform={selectedPlatform}
                  />

                </div>

                <div className='col-xl-4 col-md-4 col-sm-12'> 
                  <div className='card w-100 card-bg'>
                    <div className='card-body'> 
                      <h5> Recent Activity </h5> 
                      <div style={recentActivities.length > 3 ? {height:'400px',overflowY:'scroll'} : {height:'400px'}}>
                        {recentActivitiesLoading ? (
                          <RecentActivitySkeleton 
                            recentActivitiesLoading={recentActivitiesLoading}
                            activityType={''}
                            activitySubType={''}
                            title={''} 
                            platform={''} 
                            DateTimes={''}
                            typeAction={''}
                            activityByUserName={''}
                            activityData={''}
                            baseColor="#e0e0e0" 
                            highlightColor="#f5f6f7"
                          />
                        ) : recentActivities.length > 0 ? (
                          recentActivities.map((activity, idx) => (
                            <RecentActivitySkeleton 
                              key={idx}
                              recentActivitiesLoading={recentActivitiesLoading}
                              activityType={activity.activity_type}
                              activitySubType={activity.activity_subType}
                              title={activity.pageOrSocialUserName} 
                              platform={activity.account_platform} 
                              DateTimes={dayjs(activity.activity_dateTime).fromNow()}
                              typeAction={activity.activity_action}
                              activityByUserName={activity.activityByUserName}
                              activityData={activity.references}
                              baseColor="#e0e0e0" 
                              highlightColor="#f5f6f7"
                            />
                          ))
                        ) : (
                          <div className="d-flex align-items-center justify-content-center" style={{height:'300px'}}>                          
                            <div className="text-card-foreground h-full">
                              <div className="text-center">
                                {/* <svg xmlns="http://www.w3.org/2000/svg" 
                                    width="48" 
                                    height="48" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="#4B5563" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    className="lucide lucide-file-plus h-12 w-12 text-gray-400 mx-auto">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="12" y1="18" x2="12" y2="12"></line>
                                  <line x1="9" y1="15" x2="15" y2="15"></line>
                                </svg> */}
                                <h6 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                  Create a post to see your activity here.
                                </h6>                                
                                <Link to="/create-post" className='btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center'>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus h-5 w-5"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                  <span>Create post</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* <div className='d-flex recent-activity-card gap-2 addPlatform-card'> 
                        <div className='green-dot'> </div>
                        <div> <span> New product launch announcement ...</span>
                          <div className='d-flex align-items-center justify-content-between my-1'>  
                            <div className='d-flex align-items-center gap-2'> 
                              <div> <p> Instagram </p>   </div>
                              <div> <p> • 2 hours ago </p> </div>
                            </div> 
                            <div className='published'> published </div>
                          </div>
                          <div> <p> 24 likes, 5 comments </p> </div>
                        </div>
                      </div> */}
                    
                    </div>
                  </div>
                </div>
              </div>     

              <div className="row">
                <div className="col-12 col-md-12"> 
                  <div className="card card-body">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h5 className="mb-3"><i className="fa fa-calendar"></i> Scheduled Posts </h5>
                        <span>View and manage your upcoming posts for the next 7 days</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <Link to="/post-calendar" className="custom-light-btn">
                          <small><i className="fa-solid fa-eye me-2"></i>View scheduled</small>
                        </Link>
                        <Link to="/create-post" className="btn btn-primary">
                          <small><i className="fa-solid fa-plus me-2"></i>Scheduled Post</small>
                        </Link>
                      </div>
                    </div> 

                    <div className="scheduled-posts-week">
                      <div className="week-row">
                        {currentWeekDays.map((day) => {
                          const isToday = day.isSame(moment(), "day");
                          const dayEvents = scheduledPosts.filter((post) =>
                            moment.unix(post.schedule_time).isSame(day, "day")
                          );

                          return (
                            <div key={day.format()} className="day-column">
                              {/* Day Header */}
                              <div className={`day-column p-2 flex-grow-1 rounded mb-1 text-center ${isToday ? "today-highlight" : "border-highlight"}`} >
                                <div className="day-name">{day.format("ddd")}</div>
                                <div className="day-date">{day.format("DD")}</div>
                                <div className="post-count">{dayEvents.length} {dayEvents.length === 1 ? "post" : "posts"}</div>
                              </div>

                              {/* Posts */}
                              <div className="day-posts">
                                {dayEvents.length ? (
                                  dayEvents.map((event) => {
                                    const isExpired = moment.unix(event.schedule_time).isBefore(moment());

                                    return (
                                      <HoverPostPreview key={event.postID} post={event} platform={event?.platform?.toLowerCase()} >
                                        <div className={`post-card ${isExpired ? "expired" : ""}`}>
                                          <div className="post-content d-flex">
                                            
                                            {/* Column 1: Big platform icon */}
                                            <div className="platform-icons me-2"
                                              style={{ color:"white", background:getPlatformColor(event.platform) }}
                                            >
                                              {/* <i className={`fab fa-${event.platform}`} ></i> */}
                                              {platformSVGs[event.platform] || (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                                  <circle cx="12" cy="12" r="10" />
                                                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                                  <path d="M2 12h20" />
                                                </svg>
                                              )}
                                            </div>

                                            {/* Column 2: Details */}
                                            <div className="platform-details position-relative flex-grow-1">
                                              {/* Platform name + media type badge */}
                                              <div className="platform-header mb-1">
                                                <span className="platform-name">{capitalizeFirstLetter(event.platform)}</span>
                                                <span className={`media-type-badge badge bg-${
                                                    event.mediaType === "image" ? "success" : event.mediaType === "video" ? "danger" : "info"
                                                  }`}
                                                >
                                                  {event.mediaType}
                                                </span>
                                              </div>

                                              {/* Title */}
                                              {event.title === 'Expired' ? (
                                                <div className="post-title text-danger mb-1">{event.title}</div>
                                              ) : (
                                                <div className="post-title mb-1">{event.title}</div>
                                              )}
                                              
                                              {/* Time */}
                                              <div className="post-time">
                                                <i className="fa-regular fa-clock"></i> {event.formattedTime}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </HoverPostPreview>
                                    );
                                  })
                                ) : (
                                  <div className="no-posts">No posts</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className='d-flex align-items-center justify-content-between draft-footer'> 
                      <div className='d-flex align-items-center gap-3'> 
                        <div className='d-flex align-items-center flex-column '> 
                          <h2 style={{ color: getPlatformTextColor('instagram') }}> { scheduledPosts.length ?? 0 } </h2> 
                          <p> Total Posts </p>
                        </div>
                        {Array.from(new Set(scheduledPosts?.map(post => post.platform))).map(platform => (
                          <div key={platform} className='d-flex align-items-center flex-column'> 
                            <h2 style={{ color: getPlatformTextColor(platform) }}>
                              {scheduledPosts.filter(post => post.platform === platform).length}
                            </h2> 
                            <p>{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                          </div>
                        ))}
                        <div className='d-flex align-items-center flex-column'> 
                          <h2 style={{color:"#159711ff"}}>
                            {scheduledPosts?.filter(post => post.mediaType === "image").length}
                          </h2> 
                          <p>Image Posts</p>
                        </div>
                      </div>
                      <div className="d-flex"> 
                        <Link to="/analytics" className='custom-light-btn'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-activity h-4 w-4 mr-1"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
                          View Analytics 
                        </Link>&nbsp;
                        <span className="custom-light-btn">•••</span>
                      </div>

                    </div>

                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-12 col-md-8 align-items-stretch">
                  <div className="card w-100 mb-0"> 

                    <div className="card-body pb-0">
                      <div className="d-flex gap-3">
                        <div className="">
                          <div className="d-flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-flame h-6 w-6 mr-2 text-red-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                            <h5 className="ms-2">Trending Topics</h5>
                          </div>
                          <p className="mb-3 mt-1">Discover trending topics in your industry to create engaging content that resonates with your audience.</p>
                        </div>
                        {/* <Link to="javascript:void(0);" className='custom-light-btn'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-hash h-4 w-4 mr-1"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
                          <span>All Categories</span>
                        </Link>
                        <Link to="javascript:void(0);" className='custom-light-btn'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-trending-up h-4 w-4 mr-1"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                          <span>Refresh</span>
                        </Link> */}
                      </div>
                      <div className="input-group mb-3 search-bar"> 
                        <input type="text" className={`form-control border-none search-industry-input ${
                            !hasInteracted ? '' : trendingTopic ? 'border-success' : 'border-danger'
                          }`}
                          placeholder="Search topics, keywords, or industries..." value={trendingTopic} onChange={handleChangeTopic}
                        />                       
                        {trendingTopicLoading ? (
                          <span className="input-group-text border-none">
                            <i className="fa-solid fa-magnifying-glass"></i>
                          </span>
                        ) : (
                          <span className="input-group-text border-none" onClick={trendingTopics} style={{cursor:'pointer'}}>
                            <i className="fa-solid fa-magnifying-glass"></i>
                          </span>
                        )}
                      </div>                    
                    </div>
                    {trendingTopicLoading ? (
                      <div className='text-center mb-3'>
                        <i className="fas fa-spin fa-spinner text-dark w-100" style={{fontSize:'25px'}}></i>
                      </div>                    
                    ) : (
                      <>
                        {trendingTopicList.length > 0 && (
                          <div className="row overflow-auto" style={{height:480}}>
                            {trendingTopicList.map((topic, index) => (
                              <>
                                <div className="col-md-12" style={{padding:"5px 30px"}} key={index}>
                                  {/* <div className='software-development card'> */}
                                  <div className="card addPlatform-card">
                                    <div className="card shadow-sm rounded-4 border-0 p-3 m-0">
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div className="flex-grow-1">
                                          <div className="d-flex gap-2">
                                            <h6 className="card-title fw-semibold text-dark mb-1">{topic.title}</h6>
                                            <span className="custom-badge">Trending</span>
                                          </div>
                                          <p className="card-text text-muted small mb-2">
                                            {topic.description}
                                          </p>
                                        </div>
                                        <button className="btn btn-hover-effect btn-primary btn-sm" onClick={() => handleCreateDraft(topic)}>
                                          <div className="d-flex gap-1">
                                            <div className="d-flex">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles h-4 w-4 mr-2">
                                                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                                                <path d="M20 3v4"></path>
                                                <path d="M22 5h-4"></path>
                                                <path d="M4 17v2"></path>
                                                <path d="M5 18H3"></path>
                                              </svg>
                                            </div>
                                            <span>Draft Post</span>
                                          </div>
                                        </button>
                                      </div>
                                      
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="text-muted small">
                                          Engagement Rate: <span className="fw-semibold text-dark">50%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div> 
                                </div> 
                              </>
                            ))}
                          </div>
                        )} 
                      </>
                    )}

                    <div className="card-body">
                      <div className='d-flex align-items-center justify-content-between draft-footer'> 
                        <div className='d-flex align-items-center gap-3'> 
                          <div className='d-flex align-items-center flex-column '> 
                            <h2 style={{ color: getPlatformTextColor('tiktok') }}> { scheduledPosts.length ?? 0 } </h2> 
                            <p> Total Topics </p>
                          </div>
                          <div className='d-flex align-items-center flex-column '> 
                            <h2 style={{ color: getPlatformTextColor('instagram') }}> 5 </h2> 
                            <p> Trending </p>
                          </div>
                          <div className='d-flex align-items-center flex-column '> 
                            <h2 style={{ color: getPlatformTextColor('youtube') }}> 2 </h2> 
                            <p> Hot Topics </p>
                          </div>
                          <div className='d-flex align-items-center flex-column'> 
                            <h2 style={{color:"#159711ff"}}>
                              58%
                            </h2> 
                            <p>Avg Engagement</p>
                          </div>
                        </div>
                        <div className="d-flex"> 
                          <Link to="/analytics" className='custom-light-btn'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap h-4 w-4 mr-1"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
                            Auto-Generate Posts
                          </Link>&nbsp;
                          <span className="custom-light-btn">•••</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="col-12 col-sm-4 col-md-4 d-flex align-items-stretch">
                  {/* <div className="card">
                    <div className="card-body d-flex align-items-center justify-content-center flex-column text-center" style={{height:325}}>
                      <div className="align-middle">
                        <h5> Social Proformance Score </h5>
                        <div className="d-flex align-items-center justify-content-center flex-column text-center mt-2">
                          <div className=""> 
                            <p> Add a social account to unlock your personalized score and recommendations.</p> 
                          </div>
                          <div>
                            <button className="btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center my-3"> <i className="fa-solid fa-plus fs-5 me-2"></i> Add a social account </button>
                          </div>
                        </div>
                      </div>                   
                    </div>
                  </div> */}
                  <div className="card shadow-sm h-100 border-0 rounded-3">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                        <div className="w-100">
                          <h5 className="card-title mb-1 d-flex align-items-center fw-semibold text-dark">
                            <div className="">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="me-2 text-primary">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                <polyline points="16 7 22 7 22 13"></polyline>
                              </svg>
                            </div>
                            <span>Social Performance Score</span>
                          </h5>
                          <small className="text-muted">Monitor your overall social media performance</small>
                        </div>
                        {/* <div className="w-100">
                          <button className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center">
                            <div className="">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="me-1">
                                <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                                <path d="M18 17V9"></path>
                                <path d="M13 17V5"></path>
                                <path d="M8 17v-3"></path>
                              </svg>
                            </div>
                            <span>View Report</span>
                          </button>
                        </div> */}
                      </div>

                      {/* Circular Score */}
                      <div className="d-flex justify-content-center my-4">
                        <div className="position-relative" style={{width: "150px", height: "150px"}}>
                          <svg className="w-100 h-100 position-absolute top-0 start-0" viewBox="0 0 100 100" style={{transform: "rotate(-90deg)"}}>
                            <circle cx="50" cy="50" r="40" stroke="#e9ecef" stroke-width="8" fill="none"></circle>
                            <circle cx="50" cy="50" r="40" stroke="#32cd32" stroke-width="8" fill="none" stroke-dasharray="213.35 251"></circle>
                          </svg>
                          <div className="position-absolute top-50 start-50 translate-middle text-center">
                            <div className="h2 fw-bold text-dark">85</div>
                            <div className="small text-muted">Score</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="row g-3 mb-4">
                        <div className="col-6">
                          <div className="p-3 rounded d-flex align-items-center shadow ">
                            <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #3b82f6, #8b5cf6)" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users h-5 w-5 text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <div>
                              <div className="fw-semibold">+12.5%</div>
                              <small className="text-muted">Follower Growth</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 rounded d-flex align-items-center shadow ">
                            <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #22c55e, #14b8a6)" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart h-5 w-5 text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                            </div>
                            <div>
                              <div className="fw-semibold">8.7%</div>
                              <small className="text-muted">Engagement Rate</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 rounded d-flex align-items-center shadow ">
                            <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #a855f7, #ec4899)" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share2 h-5 w-5 text-white"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
                            </div>
                            <div>
                              <div className="fw-semibold">234</div>
                              <small className="text-muted">Shares This Week</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 rounded d-flex align-items-center shadow ">
                            <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #f97316, #ef4444)" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye h-5 w-5 text-white"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </div>
                            <div>
                              <div className="fw-semibold">45.2K</div>
                              <small className="text-muted">Total Social Reach</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Insights */}
                      <h6 className="fw-semibold mb-3">Performance Insights</h6>
                      <div className="d-flex align-items-center rounded py-2 mb-3" 
                        style={{ 
                          backgroundColor: "rgba(101, 193, 92, 0.1)", 
                          borderColor: "rgba(101, 193, 92, 1)", 
                          color: "rgba(101, 193, 92, 1)"
                        }}>
                        <div className="px-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up h-4 w-4">
                            <path d="m5 12 7-7 7 7"></path>
                            <path d="M12 19V5"></path>
                          </svg>
                        </div>
                        <small>Your engagement rate increased by 15% this week</small>
                      </div>
                      <div className="d-flex align-items-center rounded py-2 mb-3" 
                        style={{
                          backgroundColor: "rgba(115, 102, 255, 0.1)",
                          borderColor: "rgba(115, 102, 255, 1)",
                          color: "rgba(115, 102, 255, 1)"
                        }}>
                        <div className="px-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up h-4 w-4">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                            <polyline points="16 7 22 7 22 13"></polyline>
                          </svg>
                        </div>
                        <small>Best posting time: 2-4 PM on weekdays</small>
                      </div>
                      <div className="d-flex align-items-center rounded py-2 mb-3"
                        style={{
                          backgroundColor: "rgba(64, 184, 245, 0.1)",
                          borderColor: "rgba(64, 184, 245, 1)",
                          color: "rgba(64, 184, 245, 1)"
                        }}>
                        <small className="px-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles h-4 w-4">
                            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                            <path d="M20 3v4"></path>
                            <path d="M22 5h-4"></path>
                            <path d="M4 17v2"></path>
                            <path d="M5 18H3"></path>
                          </svg>
                        </small>
                        <small>Video content performs 3x better than images</small>
                      </div>

                    </div>
                  </div>
                </div>
              </div>                     

              <div className="row mt-4">
                <div className="col-12 col-md-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-4">
                        <div className='d-flex flex-column'> 
                          <div className='d-flex gap-2'>
                            <div style={{color: "#9333EA" }}> <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-pen-line h-6 w-6 mr-2 text-purple-500"><path d="M12 20h9"></path><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path></svg>   </div>
                            <div>
                              <h5> Draft Posts </h5> 
                            </div>
                          </div>
                          <div className='mt-1'> <p> Continue working on your saved draft content </p> </div>
                        </div>
                        <div>
                          <Link to="/create-post" className='custom-light-btn'> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus h-4 w-4 mr-1"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>  New Draft</Link>
                        </div>
                      </div>
                    
                      <div style={{maxHeight: "500px", overflowY: "scroll"}}>
                        {draftPostLoading ? (
                          <div className="text-center">
                            <i className="fas fa-spin fa-spinner text-dark w-100" style={{fontSize:'25px'}}></i>
                          </div>
                        ) : draftPosts.length > 0 ? (
                          draftPosts.slice(0, 10).map(post => (
                            <div className='custom-draft-post card mt-2'> 
                              <div className="d-flex justify-content-between gap-2 p-2">
                                <div className="d-flex"> 
                                  <div className="me-3">
                                    <div>
                                      <div className="custom-draft-img">
                                        <span>Draft</span>
                                        {/* With Images Crousel */}
                                        {/* {(() => {
                                          try {
                                            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                                            const firstPost = post.posts[0];
                                            if (!firstPost || !firstPost.postMedia) return null;

                                            const mediaArray = JSON.parse(firstPost.postMedia || "[]");
                                            if (!Array.isArray(mediaArray) || mediaArray.length === 0) return null;

                                            const carouselResponsive = {
                                              desktop: {
                                                breakpoint: { max: 3000, min: 1024 }, items: 1,
                                              },
                                              tablet: {
                                                breakpoint: { max: 1024, min: 465 }, items: 1,
                                              },
                                              mobile: {
                                                breakpoint: { max: 465, min: 0 }, items: 1,
                                              },
                                            };

                                            return (
                                              <HoverPostPreviewMultiple key={firstPost.postID} post={post} platform={firstPost.platform?.toLowerCase()} >
                                                <div style={{ width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", position: "relative", }} >
                                                  <Carousel responsive={carouselResponsive} showDots={false} infinite={true} arrows={false} autoPlay={true} 
                                                    containerClass="carousel-container" dotListClass="custom-dot-list-style" itemClass="carousel-item-padding-40-px" >
                                                    {mediaArray.map((mediaItem, idx) => (
                                                      <div key={`${firstPost.postID}-${idx}`} style={{ width: "100%", height: "90px", position: "relative", overflow: "hidden", }} >
                                                        {mediaItem.type === "image" ? (
                                                          <img src={`${BACKEND_URL}${mediaItem.path}`} alt={`draft-media-${idx}`}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", }}
                                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
                                                          />
                                                        ) : (
                                                          <video src={`${BACKEND_URL}${mediaItem.path}`} autoPlay loop muted playsInline controls={false}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", }}
                                                          />
                                                        )}
                                                      </div>
                                                    ))}
                                                  </Carousel>
                                                </div>
                                              </HoverPostPreviewMultiple>
                                            );
                                          } catch (err) {
                                            console.error("Invalid postMedia JSON for first post:", err);
                                            return null;
                                          }
                                        })()} */}

                                        {/* Without Images Crousel */}
                                        {(() => {
                                          try {
                                            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                                            const firstPost = post.posts[0];
                                            if (!firstPost || !firstPost.postMedia) return null;

                                            const mediaArray = JSON.parse(firstPost.postMedia || "[]");
                                            if (!Array.isArray(mediaArray) || mediaArray.length === 0) return null;
                                            const firstMedia = mediaArray[0];
                                            
                                            // console.log("Posts Data:", post);
                                            return (
                                              <HoverPostPreviewMultiple key={firstPost.postID} post={post} platform={firstPost.platform?.toLowerCase()} >
                                                <div style={{ width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", position: "relative" }} >
                                                  {firstMedia.type === "image" ? (
                                                    <img src={`${BACKEND_URL}${firstMedia.path}`} alt="draft-media"
                                                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                      onError={(e) => {
                                                        e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                      }}
                                                    />
                                                  ) : (
                                                    <video src={`${BACKEND_URL}${firstMedia.path}`} autoPlay loop muted playsInline controls={false}
                                                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                                                    />
                                                  )}
                                                </div>
                                              </HoverPostPreviewMultiple>
                                            );
                                          } catch (err) {
                                            console.error("Invalid postMedia JSON for first post:", err);
                                            return null;
                                          }
                                        })()}

                                      </div>
                                    </div>
                                  </div>                             
                                  <div className="d-flex flex-column">
                                    <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", minHeight:"70px" }}>
                                      {(() => {
                                        const maxLength = 200; // limit in characters
                                        const truncatedContent =
                                          post?.content?.length > maxLength ? post.content.substring(0, maxLength) + "..." : post?.content;

                                        return truncatedContent?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => {
                                            const isFirstLine = lineIndex === 0;
                                            return isFirstLine ? (
                                              <h6 key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
                                                {line.split(/(#\w+)/g).map((part, partIndex) =>
                                                  part.startsWith("#") && part.length > 1 ? (
                                                    <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary mt-1" style={{ fontWeight: 600 }} >
                                                      {part}
                                                    </span>
                                                  ) : (
                                                    <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                                                  )
                                                )}
                                              </h6>
                                            ) : (
                                              <p key={`line-${lineIndex}`} style={{ margin: "0 0 2px 0" }}>
                                                {line.split(/(#\w+)/g).map((part, partIndex) =>
                                                  part.startsWith("#") && part.length > 1 ? (
                                                    <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary mt-1" style={{ fontWeight: 500 }} >
                                                      {part}
                                                    </span>
                                                  ) : (
                                                    <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                                                  )
                                                )}
                                              </p>
                                            );
                                          });
                                      })()}
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <div className="d-flex" style={{ gap: '10px' }}>
                                        {Array.from( new Set(post.posts.map(p => p.platform)) ).map(platform => (
                                          <div key={platform} className="d-flex align-items-center">
                                            <div style={{ width: '24px', height: '24px', borderRadius: '8px', padding: '3px', background:getPlatformColor(platform) , display: 'flex', justifyContent: 'center', alignItems: 'center' }} >
                                              {platformSVGs[platform] || (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe">
                                                  <circle cx="12" cy="12" r="10" />
                                                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                                  <path d="M2 12h20" />
                                                </svg>
                                              )}
                                            </div>
                                            {/* <p style={{ fontSize: '12px', marginLeft: '5px' }}>{platform}</p> */}
                                          </div>
                                        ))}
                                      </div>
                                      <p className="ms-3">
                                        Last edited: {moment(post.updatedAt).format('DD-MMM-YYYY, hh:mm A')}
                                      </p>
                                    </div>
                                    
                                  </div> 
                                </div>
                                <div>
                                  <span onClick={() => {handleEdit(post.form_id)} } className="btn draft-edit-btn btn-hover-effect ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-pen-line h-4 w-4 mr-1">
                                      <path d="M12 20h9"></path>
                                      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>
                                    </svg> Edit 
                                  </span>
                                  {/* <Link to={{pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}`}} className="btn draft-edit-btn btn-hover-effect ">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-pen-line h-4 w-4 mr-1">
                                      <path d="M12 20h9"></path>
                                      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>
                                    </svg> Edit 
                                  </Link>   */}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="d-flex align-items-center justify-content-between gap-2 bg-light p-2 mt-3">
                              <p className="text-danger text-center w-100">Posts not found</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className='d-flex align-items-center justify-content-between draft-footer'> 
                        <div className='d-flex align-items-center gap-3'> 
                          <div className='d-flex align-items-center flex-column '> 
                            <h2> { draftPosts.length ?? 0 } </h2> 
                            <p> Total Drafts </p>
                          </div>
                          <div className='d-flex align-items-center flex-column '> 
                            <h2 style={{color:"#9333EA"}}>
                              {(() => {
                                const posts = draftPosts.slice(0, 10);
                                if (!posts.length) return 0;

                                const totalWords = posts.reduce((sum, post) => {
                                  if (post?.content) { return sum + post.content.trim().split(/\s+/).length; }
                                  return sum;
                                }, 0);

                                return Math.round(totalWords / posts.length);
                              })()}
                            </h2> 
                            <p> Avg Words </p>
                          </div>
                          <div className='d-flex align-items-center flex-column '> 
                            <h2 style={{color:"#DB2777"}}>
                              {(() => {
                                const posts = draftPosts.slice(0, 10);
                                if (!posts.length) return 0;
                                const platforms = posts.flatMap(post =>
                                  (post.posts || []).map(p => p.platform).filter(Boolean)
                                );
                                const uniquePlatforms = new Set(platforms);
                                return uniquePlatforms.size;
                              })()}
                            </h2> 
                            <p> Platforms </p>
                          </div>
                          {/* <div className='d-flex align-items-center flex-column'> 
                            <h2 style={{color:"#2563EB"}}> 6 </h2> 
                            <p> Categories </p>
                          </div> */}
                          </div>
                        <div> <Link to="/draft-posts" className='custom-light-btn'> View all Drafts </Link> </div>
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>

              {showDisconnectModal && (
                <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
                  }}
                >
                  <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Disconnect Account</h5>
                          <button type="button" className="btn-close" onClick={cancelDisconnect}></button>
                        </div>
                        <div className="modal-body">
                          <p>
                            Are you sure you want to disconnect{" "}
                            <strong>{accountToDisconnect?.name}</strong> from{" "}
                            <strong>{accountToDisconnect?.social_user_platform}</strong>?
                          </p>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={cancelDisconnect}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-danger" onClick={confirmDisconnect}>
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          <Footer/>
        </div>
    </div>
  )
}
