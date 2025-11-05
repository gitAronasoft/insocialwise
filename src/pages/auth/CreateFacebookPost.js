import React, { useState,useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
//import axios from "axios";
import { toast } from 'react-toastify';

export default function CreateFacebookPost() {
    const [loading, setLoading] = useState(false);
    const [postContent, setPostContent] = useState('');     
    const [pagesList, setPagesList] = useState([]); 
    const [selectedPage, setSelectedPage] = useState({ token: "", pageId: "" });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));            
        // if (userInfoData.socialPage) {            
        //     setPagesList(userInfoData.socialPage);
        // } else {
        //     console.log('No social page found in user data.');
        // }
        if(userInfoData && userInfoData.socialData) { 
            if(userInfoData.socialData.status==="Connected"){
                if(userInfoData.socialPage) {            
                    setPagesList(userInfoData.socialPage);
                } else {
                    console.log('No social page found in user data.');
                }
            } else {
                console.log('Facebook APP not connected.');
            }                
        } else {
            console.log('No social page found in user data.');
        }
    },[]);
    
    const setPageId = async (e) => {
        const selectedPageId = e.target?.value;
        const selectedPage = pagesList.find(page => page.pageId === selectedPageId);
        //console.log(e.target?.value);
        if (selectedPage) {
            //console.log("Selected Page:", selectedPage.token,selectedPage.pageId);  // Log the selected page object
            setSelectedPage({ token: selectedPage.token, pageId: selectedPage.pageId });
        } else {
            console.log("Page not found in the list");
        }
    }

    const handleContentChange = (event) => {
        setPostContent(event.target.value);
    }; 
    
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);  // Set image preview URL
            };
            reader.readAsDataURL(file);  // Read the file as data URL for preview
            setImageFile(file);  // Save the file to state
        }
    };

    // Function to post to Facebook page
    const clickPostNow = async () => {  
        //const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        //const authToken = localStorage.getItem('authToken');        
        setLoading(true);
        const pageAccessToken = selectedPage.token;
        const page_id = selectedPage.pageId; 
        const content = postContent; 
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
        const socialUserID = userInfoData.socialData.social_id;
        const status = "1";      

        const formData = new FormData();
        formData.append('access_token', pageAccessToken);
        formData.append('page_id', page_id);
        formData.append('socialUserID', socialUserID);
        formData.append('content', content);
        formData.append('status', status);
        if(imageFile) {
            formData.append('upload_img', imageFile);            
        }         

        if(postContent!=='' && page_id!=='' && imageFile) {                           
            try {
                const fbFormData = new FormData();
                fbFormData.append('source', imageFile);
                fbFormData.append('message', content);
                const response = await fetch(
                    `https://graph.facebook.com/me/photos?access_token=${pageAccessToken}`,
                    { method: 'POST', body: fbFormData }
                );
                const data = await response.json();
                //console.log('first log',data);
                if (data.id) {
                    formData.append('platform_post_id', data.post_id);
                    await savePost(formData); 
                } else {
                    toast.error('Something worng.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });
                }               
                                      
            } catch (error) {
                setLoading(false);
                console.error('Error posting to Facebook:', error);                
                toast.error('An error occurred while posting to Facebook.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            }            
        } else if(postContent!=='' && page_id!=='' && !imageFile) {             
            try {
                const url = `https://graph.facebook.com/${page_id}/feed`;
                const normalPostData = new FormData();
                normalPostData.append('message', content);
                normalPostData.append('access_token', pageAccessToken);            
                const postResponse = await fetch(url, {
                    method: 'POST',
                    body: normalPostData,
                });
                const postResult = await postResponse.json();
                //console.log('second log',postResult);
                //console.log('postResult',postResult);
                if (postResult.id) { 
                    formData.append('platform_post_id', postResult.id);            
                    await savePost(formData);                   
                } else {
                    setLoading(false);
                    //alert(`Failed to post: ${postResult.error.message}`);
                    toast.error('Something worng.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });
                }
            } catch (error) {
                setLoading(false);
                console.error('Error posting to Facebook:', error);
                //alert('An error occurred while posting to Facebook.');
                toast.error('An error occurred while posting to Facebook.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            } 
        }
        else {
            //alert('Post content reqired.');
            setLoading(false);
            toast.error('Select page and post content reqired.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        }
    };

    const savePost = async (formData) => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
        const authToken = localStorage.getItem('authToken'); 
        try {           
            fetch(`${BACKEND_URL}/api/create-post`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + authToken,
            },
            body: formData, 
        }).then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {                                  
            setLoading(false);
            setPostContent('');
            setImageFile(null);
            setImagePreview(null);
            toast.success('Post upload successfully.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });  
            console.log('Post Save successfully.');                     
        })
        .catch((error) => {
            console.error('post save error.', error);
        })
        } catch (error) {
            setLoading(false);
            console.error('post save error.', error);
        }

    }

    const clickPostDraft = async () => { 
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;         
        setLoading(true);
        //const pageAccessToken = selectedPage.token;
        const page_id = selectedPage.pageId; 
        const content = postContent; 
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
        const socialUserID = userInfoData.socialData.social_id;
        const authToken = localStorage.getItem('authToken');
        const status = "0";
        const platform_post_id ="";
        if(postContent!=='' && page_id!=='') { 
            try {
                const formData = new FormData();
                formData.append('page_id', page_id);
                formData.append('socialUserID', socialUserID);
                formData.append('content', content);
                formData.append('status', status);
                formData.append('platform_post_id', platform_post_id); 
                if(imageFile) {
                    formData.append('upload_img', imageFile); // Append the selected image file
                }
    
                fetch(`${BACKEND_URL}/api/create-post`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + authToken,
                    },
                    body: formData, // Send FormData which includes the file
                }).then((response) => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    setLoading(false);
                    setPostContent('');
                    setImageFile(null);
                    setImagePreview(null);
                    //console.log('Post save successfully.'); 
                    toast.success('Post save successfully.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });                      
                })
                .catch((error) => {
                    console.error('post save error.', error);
                })
            } catch (error) {
                setLoading(false);
                //console.error('post save error.', error);
                toast.error('Post save error.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            }                
        } else {
            //alert('Post content reqired.');
            setLoading(false);
            toast.error('Select page and post content reqired.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        }
    };
    
    // Function to schedule post to Facebook page
    const SchedulePostToFacebookPage = async () => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
        setLoading(true);
        //console.log('cc',selectedPage.token);              
        const scheduleTimeInput = document.getElementById('scheduleTime').value;  // Get scheduled time from input
        //console.log('scheduleTimeInput',scheduleTimeInput);
        if (!scheduleTimeInput) {
            //alert("Please select a scheduled time.");
            setLoading(false);
            toast.error('Please select a scheduled time.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            return;
        }        
        const scheduleDate = new Date(scheduleTimeInput); // Local time (IST)    
        // Convert IST (Indian Standard Time) to UTC
        //const utcDate = new Date(scheduleDate.getTime() - (330 * 60 * 1000)); // IST is UTC +5:30, so subtract 5.5 hours
        const utcDate = new Date(scheduleDate.getTime());
        const scheduledPublishTime = Math.floor(utcDate.getTime() / 1000);  // Convert to seconds (required by Facebook)
        //console.log('scheduledPublishTime',scheduledPublishTime);

        //const pageAccessToken = selectedPage.token;
        const page_id = selectedPage.pageId; 
        const content = postContent; 
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
        const socialUserID = userInfoData.socialData.social_id;
        const authToken = localStorage.getItem('authToken');
        const schedule_time = scheduledPublishTime;
        const status = "2";
        const platform_post_id ="";
        if(postContent!=='' && page_id!=='')
        {
            try {
                const formData = new FormData();
                formData.append('page_id', page_id);
                formData.append('socialUserID', socialUserID);
                formData.append('content', content);
                formData.append('schedule_time', schedule_time);
                formData.append('status', status);
                formData.append('platform_post_id', platform_post_id);
                   
                if(imageFile) {
                    formData.append('upload_img', imageFile); // Append the selected image file
                }
    
                fetch(`${BACKEND_URL}/api/create-post`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + authToken,
                    },
                    body: formData, // Send FormData which includes the file
                }).then((response) => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    setLoading(false);
                    setPostContent('');
                    setImageFile(null);
                    setImagePreview(null);
                    document.getElementById('scheduleTime').value="";
                    //alert('Post save successfully.');
                    toast.success('Post save successfully.', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                    });
                })
                .catch((error) => {
                    console.error('post save error.', error);
                })
            } catch (error) {
                console.error("Error scheduling post:", error);
                //alert("Error scheduling post:", error);
                setLoading(false);
                toast.error('Error scheduling post.', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            }            
        } else {
            setLoading(false);
            //alert("Post content required.");
            toast.error('Select page and post content reqired.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        }            
        
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
                                    <h3>Create Facebook Post</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Create Facebook Post</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="row">
                                    <div className="col-xxl-9 col-xl-8 box-col-8">
                                        <div className="card">
                                            <div className="card-body">                                            
                                                <div className="sidebar-body">
                                                    <div className="row g-3 common-form">
                                                        <div className="col-12">
                                                            <label className="form-label fw-bold">Select Page</label>
                                                            <select className="form-control" onChange={(e) => setPageId(e)}>
                                                                <option value="">Select a page</option>
                                                                {pagesList.length > 0 ? (
                                                                    pagesList.map((page, index) => (
                                                                        <option key={index} value={page.pageId}>{page.pageName}</option>
                                                                    ))
                                                                ) : (
                                                                    <option value="" style={{color:'red'}} disabled>Connect your Facebook APP</option>
                                                                )}
                                                            </select>
                                                        </div>
                                                        <div className="col-12">
                                                            <label className="form-label fw-bold" htmlFor="postContent">Post content</label>
                                                            <textarea
                                                                className="form-control"
                                                                rows={8}
                                                                id="postContent"
                                                                type="text"
                                                                placeholder="What's on your mind?"
                                                                value={postContent}
                                                                onChange={handleContentChange}                                                                
                                                            />
                                                        </div> 

                                                        <div className="col-12">
                                                            <label className="form-label fw-bold" htmlFor="imageFile">Choose an Image</label>
                                                            <input 
                                                                type="file" 
                                                                id="imageFile" 
                                                                className="form-control"
                                                                accept="image/jpeg, image/png, .jpg, .jpeg, .png"
                                                                onChange={handleImageChange}
                                                            />                                                            
                                                        </div>                                                       

                                                        {/* Schedule Time Picker */}                                     
                                                        <div className="col-12">
                                                            <label className="form-label fw-bold" htmlFor="scheduleTime">Schedule Time (IST)</label>
                                                            <input 
                                                                type="datetime-local" 
                                                                id="scheduleTime" 
                                                                className="form-control"
                                                                min={new Date().toISOString().slice(0, 16)} 
                                                            />
                                                        </div>                                                       
                                                        <div className="common-flex justify-content-end">
                                                            {loading ? (
                                                                <button 
                                                                    className="btn btn-primary"                            
                                                                    disabled={loading}
                                                                >
                                                                    Posting <div className="spinner-border spinner-border-sm" role="status">
                                                                        <span className="sr-only">Loading...</span>
                                                                    </div>
                                                                </button>
                                                                
                                                            ) : (
                                                                <>
                                                                    <button className="btn btn-dark" onClick={clickPostDraft}>Save as Draft</button>
                                                                    <button className="btn btn-primary" onClick={clickPostNow}>
                                                                        Post Now
                                                                    </button>
                                                                    <button className="btn btn-info" onClick={SchedulePostToFacebookPage}>Schedule for later</button>
                                                                </>                                                                    
                                                            )}
                                                            
                                                        </div>
                                                    </div>
                                                </div>                                            
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xxl-3 col-xl-4 box-col-4e">
                                        <div className="card">
                                            <div className="card-body">
                                                <h6>Post preview</h6>
                                                <hr />
                                                <div className="postPreview">
                                                    <div className="row">
                                                        <div className="col-xxl-2 col-xl-2 text-center">
                                                            <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} width={40} alt="avtar" />
                                                        </div>
                                                        <div className="col-xxl-10 col-xl-10 d-flex align-items-center">
                                                            <h6>Aronasoft</h6>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="row">                                                        
                                                        <p className="mt-2 mb-0">{postContent}</p> 
                                                        {imagePreview && (
                                                            <div className="col-12 mt-3">
                                                                <img 
                                                                    src={imagePreview} 
                                                                    alt="Preview" 
                                                                    className="img-fluid" 
                                                                    style={{ maxHeight: '200px', objectFit: 'cover',width:'100%' }} 
                                                                />
                                                            </div>
                                                        )}                       
                                                    </div>                                                    
                                                    <hr />
                                                    <div className="row" style={{color:"#75758acc"}}>
                                                        <div className='d-flex justify-content-between'> 
                                                            <div className="d-flex align-items-center">
                                                                <i className="fa fa-thumbs-up" style={{paddingRight:"3px"}}></i> Like
                                                            </div>
                                                            <div className=" d-flex align-items-center">
                                                                <i className="fa fa-comment" style={{paddingRight:"3px"}}></i> Comment
                                                            </div>                                                            
                                                            <div className="d-flex align-items-center">
                                                                <i className="fa fa-share" style={{paddingRight:"3px"}}></i> Share
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
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
}
