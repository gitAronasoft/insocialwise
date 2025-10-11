import React, { useState,useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import {Link} from 'react-router-dom';
import axios from "axios";
import { toast } from 'react-toastify';

export default function ConnectFacebook() {
    const [loading, setLoading] = useState(false);    
    const [accessToken, setAccessToken] = useState(null);
    const [connectedAccountInfo, setIsConnectedAccountInfo] = useState([]);
    const [pagePostsInfo, setpagePostsInfo] = useState([]);
    //const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const userInfoData = JSON.parse(localStorage.getItem('userinfo')); 
            //console.log('cc',userInfoData);                
            if(userInfoData && userInfoData.socialData) {             
                if(userInfoData.socialData.status==="Connected"){                                                     
                    setAccessToken(userInfoData.socialData.user_token);
                    setIsConnectedAccountInfo([userInfoData] || []); 
                    await fetchPageActivity(userInfoData.socialPage[0].pageId, userInfoData.socialPage[0].token);
                    //await fetchPageDetails(userInfoData.socialPage[0].pageId, userInfoData.socialPage[0].token);               
                    //setIsConnected(true);
                    setLoading(false);                
                } else {
                    setIsConnectedAccountInfo([]);  
                    //setIsConnected(false);               
                    setLoading(false);
                }                
            } else { 
                setIsConnectedAccountInfo([]); 
                //setIsConnected(false);           
                setLoading(false);
            }
        };
        fetchData();
    },[]);

    const responseFacebook = (response) => {
        setLoading(true);              
         const { accessToken } = response;
         //console.log('response',accessToken);
        if (accessToken) { 
            setAccessToken(accessToken);            
            //extentUserFBtoken(accessToken);
            fetchUserData(accessToken);
            //fetchBusinessPageData(accessToken);
        } else {
            setAccessToken(null); 
            //setIsConnected(false);
            setLoading(false);         
            console.error('Failed to retrieve access token.');
        }
    };  

    const fetchUserData = async (accessToken) => {
        const fbAccessToken = accessToken;
        setLoading(true);
        try {
            // Fetch Facebook user data
            const userResponse = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${accessToken}&fields=name,email,picture,accounts`);
            const userData = await userResponse.json();               
            if(userData.accounts){
                await extentUserFBtoken(fbAccessToken, userData);
            } else {
                setLoading(false);
                toast.error('This account does not have any pages.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            }          
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
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
            setLoading(false);
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
        try {
            const submissionResponse = await fetch(`${BACKEND_URL}/api/social_account_submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ 
                    data: userData, 
                    accessToken: longLivedToken 
                }),
            });
            const response = await submissionResponse.json();
            if(response.createAccount===false){
                setLoading(false);
                toast.error('This account is already linked to our platform.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                }); 
            } else if(response.createAccount===true){
                setLoading(false);
                await fetchBusinessPageData(longLivedToken, userData.id);                    
            } else if(response.createAccountError===false){
                setLoading(false);
                toast.error('Server technical problem, try agian.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });  
            } else {
                setLoading(false);
                toast.error('Server technical problem, try agian.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });                
            } 
            // if(!submissionResponse.ok) {
            //     setLoading(false);
            //     toast.error('Server technical problem, try agian.', {
            //         position: 'top-center',
            //         autoClose: 5000,
            //         hideProgressBar: false,
            //         closeOnClick: true,
            //     });                
            // }
            // await fetchBusinessPageData(longLivedToken, userData.id);
            // console.log('Social media account connected successfully');
        } catch (error) {
            setLoading(false);
            console.error('Token Extension Error:', error);
        }
    };

    const fetchBusinessPageData = async (accessToken, user_social_id) => { 
        setLoading(true);
        //const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;      
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

    //const fetchPageDetails = async (pageId, pageAccessToken) => { 
    const fetchPageDetails = async (pagesList,user_social_id) => { 
        //console.log('pagesList',pagesList);
        setLoading(true);
        for (const page of pagesList) {
            const page_id = page.id;
            const page_access_token = page.access_token;
            try {                  
                const response = await fetch(`https://graph.facebook.com/v22.0/${page_id}?fields=name,category,picture,cover,followers_count,fan_count,posts.summary(true)&access_token=${page_access_token}`);
                const data = await response.json();
                //console.log(`Get Metadata for Page`,data);           
                setpagePostsInfo([data] || []);
                await saveSocialPages(data,page_access_token,user_social_id);               
                //setLoading(false);          
            } catch (error) {
                console.error(`Error fetching metadata for Page ${page_id}: `, error);
                setLoading(false);
                throw error; // Re-throw to handle in the parent function            
            } 
            finally {
                //setLoading(false);
            }
        }   
    };
    
    const fetchPageActivity = async (pageId, pageAccessToken) => {
        try {                  
            const response = await fetch(`https://graph.facebook.com/v22.0/${pageId}?fields=name,category,picture,cover,followers_count,fan_count,posts.summary(true)&access_token=${pageAccessToken}`);
            const data = await response.json();
            //console.log(`Get Metadata for Page`,data);           
            setpagePostsInfo([data] || []);                           
            setLoading(false);          
        } catch (error) {
            console.error(`Error fetching metadata for Page ${pageId}: `, error);
            setLoading(false);
            throw error; // Re-throw to handle in the parent function            
        } 
        finally {
            setLoading(false);
        }
    };
    
    const saveSocialPages = async (pagesListData,page_access_token,user_social_id) => { 
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const storedToken = localStorage.getItem('authToken'); 
        const data = pagesListData;
        try {    
            const postResponse = await fetch(`${BACKEND_URL}/api/social_page_submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({pagesData:data,social_id:user_social_id, token:page_access_token}),
            });

            if (!postResponse.ok) {
                throw new Error(`HTTP error! Status: ${postResponse.status}`);
            }

            const postData = await postResponse.json();
            //setpagePostsInfo([data] || []);                                            
            localStorage.removeItem('userinfo');
            localStorage.setItem('userinfo', JSON.stringify(postData.userInfo));
            const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
            setIsConnectedAccountInfo([userInfoData] || []); 
            if(connectedAccountInfo.length>0)
            {
                setLoading(false);
            }
        } catch (error) {
            setLoading(false);
            console.error('Error processing page:', error);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        if (accessToken) {
            // Revoke permissions from Facebook
            fetch(`https://graph.facebook.com/v22.0/me/permissions?access_token=${accessToken}`, {
                method: 'DELETE',
            })
            .then((response) => response.json())
            .then((data) => {
                //console.log("Facebook permissions revoked: ", data);
                disconnectSocialAPP(); 
                //setLoading(false);                                         
            })
            .catch((error) => {
                console.error("Error revoking Facebook permissions: ", error);                
            });
        } else {
            console.warn("No access token found to disconnect.");            
        }
    };
    
    const disconnectSocialAPP = async () => {
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
                body: JSON.stringify({token:accessToken}),
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
                    const userinfoJson = localStorage.getItem('userinfo');
                    if(userinfoJson) {
                        const userinfo = JSON.parse(userinfoJson);
                        delete userinfo.socialData;
                        delete userinfo.socialPage;
                        localStorage.setItem('userinfo', JSON.stringify(userinfo));
                    }        
                    setIsConnectedAccountInfo([]); 
                    if(connectedAccountInfo.length>0)
                    {
                        setLoading(false);
                    }
                    //setIsConnected(false);
                    
                }                     
            })
            .catch((error) => {
                console.error('Fetch error:', error);
            });            
        } catch (err) { 
            console.log("Something went wrong :- ",err);
        } 
        // finally {            
        //     setLoading(false);
        // }         
    };

    return (
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-sm-6">
                                    <h3>Connect Account</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Connect Account</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12 od-xl-1"> 
                                <div className="row"> 
                                    <div className="col s-xxl-3 box-col-4">
                                        <div className="card social-widget widget-hover">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="social-icons">                             
                                                            <img src={`${process.env.PUBLIC_URL}/assets/icons/fb.png`} alt="facebook icon"/>
                                                        </div>
                                                        <span>Facebook</span>                                                        
                                                    </div>                                                     
                                                    <span className="font-danger f-12 d-xxl-block">                                    
                                                        <FacebookLogin
                                                            appId="1177681116717331" // Replace with your Facebook App ID
                                                            autoLoad={false}
                                                            fields="name,email,picture,pages_manage_posts,pages_read_engagement"
                                                            scope="pages_show_list,pages_manage_metadata,pages_read_engagement,
                                                                    pages_read_user_content,pages_manage_posts,pages_manage_engagement,read_insights
                                                                    "
                                                            callback={responseFacebook}                                                            
                                                            render={renderProps => (
                                                                <span onClick={renderProps.onClick} style={{cursor:'pointer'}} >Connect Account</span>
                                                            )}                                                                     
                                                        /> 
                                                    </span>
                                                </div>                                                            
                                            </div>                                            
                                        </div>                                        
                                    </div>
                                    {/* <div className="col s-xxl-3 box-col-4">
                                        <div className="card social-widget widget-hover">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="social-icons">
                                                            <img src={`${process.env.PUBLIC_URL}/assets/icons/insta.png`} alt="instagram icon"/>
                                                        </div><span>Instagram</span>
                                                    </div><span className="font-danger f-12 d-xxl-block"> Not Connected </span>
                                                </div>                                                            
                                            </div>
                                        </div>
                                    </div> */}
                                </div>  
                                {loading ? (
                                    <div className="card">                                     
                                        <div className="card-body">
                                            <div className="loading-container">
                                                <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                            </div> 
                                        </div>
                                    </div>
                                ) : connectedAccountInfo.length > 0 && connectedAccountInfo[0].socialData ? (                                         
                                    <>                                   
                                        <div className="card">                                     
                                            <div className="card-body">                                                                          
                                                <div className="row mt-4"> 
                                                    <h5>Social User Account Detail</h5> 
                                                    <div className="col col-md-5 col-lg-5 col-xl-5 col-xxl-5 box-col-5">
                                                        <div className="card social-widget widget-hover">                                                    
                                                            <div className="card-body">
                                                                <div className='d-flex align-items-center  gap-1'> 
                                                                    <div className='w-25'>
                                                                        <img src={`${connectedAccountInfo[0].socialData.img_url}`} alt="facebook icon"/>
                                                                    </div>
                                                                    <div className='w-75 d-flex gap-1 flex-column'> 
                                                                        <div className="c-o-light"><b>Name:</b> {connectedAccountInfo[0].socialData.name}</div> 
                                                                        <div className="c-o-light"><b>Social ID:</b> {connectedAccountInfo[0].socialData.social_id}</div>
                                                                        <div className="c-o-light">  
                                                                            <button className="btn btn-danger" onClick={handleDisconnect}>
                                                                                <i className="fas fa-unlink"></i> Disconnect Account
                                                                            </button> 
                                                                        </div>                                                       
                                                                    </div>
                                                                </div>              
                                                            </div>
                                                        </div>
                                                    </div>                                                                                                                    
                                                </div>  
                                                <hr/>                                     
                                                <div className="container-fluid social-user-cards"> 
                                                    <h5 className="mb-3">Page Detail</h5>                                           
                                                    <div className="row"> 
                                                    {connectedAccountInfo[0].socialPage.length > 0 && connectedAccountInfo[0].socialPage.map((socialPageData, index) => (                                    
                                                            <div className="col-xl-6 col-sm-6 col-xxl-3 col-ed-4 box-col-6">                                                                
                                                                <div className="card social-profile">
                                                                    <div className="card-body">
                                                                    {socialPageData.page_picture ? (
                                                                        <img src={`${socialPageData.page_picture}`} alt="facebook icon"/>                                                                        
                                                                    ) : (
                                                                        <div className="social-img-wrap" style={{backgroundColor:'#ccc',padding:'12px 18px 10px 18px',fontSize:'25px'}}>
                                                                            <i className="fa-solid fa-flag"></i>                                                                            
                                                                        </div> 
                                                                    )}
                                                                        
                                                                        <div className="social-details">
                                                                            {/* <h5 className="mb-1">{socialPageData.pageName}</h5> */}
                                                                            <p className="c-o-light mb-0"><b>Page Name:</b> {socialPageData.pageName}</p>
                                                                            <p className="c-o-light mb-0"><b>Page ID:</b> {socialPageData.pageId}</p>                                                                            
                                                                            <p className="c-o-light mb-0"><b>Name:</b> {connectedAccountInfo[0].socialData.name}</p>
                                                                            <p className="c-o-light mb-0"><b>Social ID:</b> {socialPageData.social_userid}</p>
                                                                            {/* <ul className="social-follow"> 
                                                                                <li> 
                                                                                    <h5 className="mb-0">{pagePostsInfo[0].posts.data.length}</h5>
                                                                                    <span className="c-o-light">Posts</span>
                                                                                                                                                                           
                                                                                </li>
                                                                                <li>
                                                                                    <h5 className="mb-0">{pagePostsInfo[0].fan_count}</h5><span className="c-o-light">Likes</span>
                                                                                </li>
                                                                                <li>
                                                                                    <h5 className="mb-0">{pagePostsInfo[0].followers_count}</h5><span className="c-o-light">Followers</span>
                                                                                </li>
                                                                            </ul> */}
                                                                        </div>
                                                                        <div className="d-flex gap-2 mt-2"> 
                                                                            <div className="text-start text-wrap"> 
                                                                                <Link to="/fb-feeds" className="btn btn-info"><i className="fas fa-list"></i> Posts</Link>
                                                                            </div>
                                                                            <div className="text-end"> 
                                                                                <div className="text-wrap"> 
                                                                                    <Link to="/create-post" className="btn btn-primary"><i className="fa-solid fa-edit"></i> Create</Link>
                                                                                </div>
                                                                            </div>
                                                                            <button className="btn btn-danger" onClick={handleDisconnect}>
                                                                            <i className="fas fa-unlink"></i> Disconnect Account
                                                                            </button>                                                                            
                                                                        </div>                                                                        
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }                                               
                                                    </div>
                                                </div>                                                
                                            </div>
                                        </div>
                                    </>   
                                ) : (
                                    <></>
                                    // <div className="card">                                     
                                    //     <div className="card-body">
                                    //         <p className="text-danger text-center">Connect your Facebook APP.</p> 
                                    //     </div>
                                    // </div>                                    
                                )}

                               

                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
}