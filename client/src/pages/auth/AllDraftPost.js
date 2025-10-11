import React, { useState,useEffect } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import {Link} from 'react-router-dom';
import moment from 'moment';
import { toast } from 'react-toastify';

export default function AllDraftPost() {
    const [loading, setLoading] = useState(false);
    const [draftPosts, setIsDraftPosts] = useState([]); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [postingLoadingIds, setPostingLoadingIds] = useState({});
    const [visiblePosts, setVisiblePosts] = useState(12);

    useEffect(() => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;           
        setLoading(true);
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
                    const draftPosts = data.userPosts.map(post => {                                         
                        return {
                            content: `${post.content || "No message"}`,                           
                            postPageID: post.page_id,
                            postID: post.id,
                            user_uuid:post.user_uuid,
                            token: post.socialPages[0].token,
                            postPageName: post.socialPages[0].pageName,
                            postPagePicture: post.socialPages[0].page_picture,
                            platform:post.platform,
                            postMedia: `${post.post_media || "No message"}`,
                            createdAt:post.createdAt
                        };
                    }).filter(post => post !== null);
                    setIsDraftPosts(draftPosts);                                        
                    setLoading(false);
                } else {
                    setLoading(false);
                    console.error("No posts data found or invalid structure");
                }
            })
            .catch((error) => {
                setLoading(false);
                console.error('Post save error.', error);                    
            });
        } catch (error) {
            setLoading(false);
            console.error("Error scheduling post:", error);                
        }
    },[]);  

    const handleDelete = () => {
        if(postToDelete) {
            deletePostDB(postToDelete.postID);
            setShowDeleteModal(false);
        }
    };

    const deletePostDB = async (post_ID) => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const requestBody = {
                postID: post_ID,
            };
            const response = await fetch(`${BACKEND_URL}/api/post-delete`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }    
            await response.json(); // If you need the response data, assign it to a variable
            setShowDeleteModal(false);
            await getDraftPosts(); // Ensure getDraftPosts is an async function
        } catch (error) {
            console.error("Deletion failed:", error);
            // Optionally handle specific errors here (e.g., display a message)
        } finally {
            setLoading(false); // Always runs (success or failure)
        }
    };

    const getDraftPosts = async () => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;           
        setLoading(true);
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
                    const draftPosts = data.userPosts.map(post => {                                         
                        return {
                            content: `${post.content || "No message"}`,                           
                            postPageID: post.page_id,
                            postID: post.id,
                            user_uuid:post.user_uuid,
                            token: post.socialPages[0].token,
                            postPageName: post.socialPages[0].pageName,
                            postPagePicture: post.socialPages[0].page_picture,
                            platform:post.platform,
                            postMedia: `${post.post_media || "No message"}`,
                            createdAt:post.createdAt
                        };
                    }).filter(post => post !== null);
                    setIsDraftPosts(draftPosts);                                        
                    setLoading(false);
                } else {
                    setLoading(false);
                    console.error("No posts data found or invalid structure");
                }
            })
            .catch((error) => {
                setLoading(false);
                console.error('Post save error.', error);                    
            });
        } catch (error) {
            setLoading(false);
            console.error("Error scheduling post:", error);                
        } 
    }

    // const publishPost = async (postInfo, index) => {
    //     const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    //     setPostingLoadingIds(prev => ({ ...prev, [postInfo.postID]: true }));        
    //     const { token: pageAccessToken, postPageID: page_id, content, postMedia, postID } = postInfo;    
    //     try {
    //         let imageBlob = null;
    //         let mediaData = null;    
    //         // 1. Handle Media Processing
    //         if (postMedia && postMedia !== "No message") {
    //             try {
    //                 mediaData = JSON.parse(postMedia);
    //                 const imageUrl = `${BACKEND_URL}/uploads/posts/${mediaData.img_path}`;                    
    //                 // Fetch image from your server
    //                 const imageResponse = await fetch(imageUrl);
    //                 if (!imageResponse.ok) throw new Error(`HTTP error! Status: ${imageResponse.status}`);                    
    //                 // Convert to Blob for Facebook upload
    //                 imageBlob = await imageResponse.blob();                    
    //             } catch (error) {
    //                 console.error('Media processing error:', error);
    //                 throw new Error(`Image error: ${error.message}`);
    //             }
    //         }    
    //         // 2. Prepare Facebook API Request
    //         const formData = new FormData();
    //         formData.append('access_token', pageAccessToken);
    //         formData.append('message', content);    
    //         if(imageBlob) {
    //             formData.append('source', imageBlob, mediaData.img_path);
    //         }    
    //         const endpoint = imageBlob ? 'photos' : 'feed';
    //         const apiUrl = `https://graph.facebook.com/v18.0/${page_id}/${endpoint}`;    
    //         // 3. Execute Facebook Post
    //         const response = await fetch(apiUrl, {
    //             method: 'POST',
    //             body: formData,
    //         });    
    //         const responseData = await response.json();    
    //         // 4. Handle Facebook API Response
    //         if (!response.ok || responseData.error) {
    //             const errorMessage = responseData.error?.message || 'Unknown Facebook API error';
    //             const errorCode = responseData.error?.code || 'N/A';
    //             throw new Error(`Facebook Error ${errorCode}: ${errorMessage}`);
    //         }
    //         ///console.log('responseData',responseData);       
    //         await updatePost(postInfo.postID,responseData.post_id);
    //     } catch (error) {
    //         console.error('Publishing failed:', error);
    //         alert(`Publishing failed: ${error.message}`);
    //     } finally {
    //         setPostingLoadingIds(prev => ({ ...prev, [postID]: false }));
    //     }
    // };

    const publishDraftPostToPlatform = async (postInfo) => {
        setPostingLoadingIds(prev => ({ ...prev, [postInfo.postID]: true }));

        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const { postPageID: page_id, postMedia, postID, content } = postInfo;
        const selectedFile = postMedia; // Must be File or Blob (not JSON or string)
        const postContent = content;

        try {
            if (!postContent.trim() && !selectedFile) {
                toast.error('Please enter post content or select an image', { position: 'top-center' });
                return;
            }

            const authToken = localStorage.getItem('authToken');
            const formData = new FormData();

            if (selectedFile instanceof File || selectedFile instanceof Blob) {
                const filename = selectedFile.name || `upload_img-${Date.now()}.jpg`;
                formData.append('upload_img', selectedFile, filename);
            }

            formData.append('postContent', postContent);
            formData.append('page_id', page_id);
            formData.append('postID', postID);

            const response = await fetch(`${BACKEND_URL}/api/publish-draft-post`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to publish draft post');
            }

            if (result.platform_post_id) {
                toast.success('Post published successfully.', {
                    position: 'top-right', 
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
                await updatePost(postID, result.platform_post_id);
            }

        } catch (error) {
            toast.error(`Error: ${error.message}`, {
                position: 'top-center',
            });
            console.error(error);
        } finally {
            setPostingLoadingIds(prev => ({ ...prev, [postInfo.postID]: false }));
        }
    };

    const updatePost = async (postid,platform_post_id) => {        
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
        const authToken = localStorage.getItem('authToken');
        try {
            const requestBody = {
                postid: postid,
                platform_post_id: platform_post_id,
                postStatus:'1'
            };
            const response = await fetch(`${BACKEND_URL}/api/updatePost`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }    
            await response.json(); 
            getDraftPosts();                                 
            setPostingLoadingIds(prev => ({ ...prev, [postid]: false }));
        } catch (error) {            
            toast.error('Error while update posting.', {
                position: 'top-right', 
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            console.error('post save error.', error);            
        } finally {
            setPostingLoadingIds(prev => ({ ...prev, [postid]: false }));
        }      
    }

    const loadMorePosts = () => {
        setVisiblePosts(prev => prev + 5); // Load 5 more posts
    };

  return (
    <div className="page-wrapper compact-wrapper">
        <Header/>
        <div className="page-body-wrapper">
            <Sidebar/>
            <div className="page-body">
                <div className="container-fluid">
                    <div className="page-title">
                        <div className="row">
                            <div className="col-sm-12">
                                <h1 className="h1-heading">All Draft Posts</h1>
                            </div>
                                         
                        </div>
                    </div>
                </div>
                <div className="container-fluid default-dashboard">
                    <div className="content-wrapper">
                        <div className="row">
                            <ul className="nav nav-tabs mb-4 gap-2" id="socialTabs" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link active d-flex" id="facebook-tab" data-bs-toggle="tab" data-bs-target="#facebook" type="button" role="tab" aria-controls="facebook" aria-selected="false" tabIndex="-1">
                                        {/* <i className="fab fa-facebook-f me-2 facbook"></i> */}
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
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7
      a1 1 0 0 1 1-1h3z"></path>
  </svg>
</div>
                                         Facebook
                                    </button>
                                </li>
                                {/* <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="instagram-tab" data-bs-toggle="tab" data-bs-target="#instagram" type="button" role="tab" aria-controls="instagram" aria-selected="false" tabIndex="-1">
                                        <i className="fab fa-instagram me-2 instagram"></i> Instagram
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link" id="twitter-tab" data-bs-toggle="tab" data-bs-target="#twitter" type="button" role="tab" aria-controls="twitter" aria-selected="false" tabIndex="-1">
                                        <i className="fab fa-twitter me-2 twitter"></i> Twitter
                                    </button>
                                </li> */}
                                <li className="nav-item" role="presentation">
                                    <button className="nav-link d-flex" id="linkedin-tab" data-bs-toggle="tab" data-bs-target="#linkedin" type="button" role="tab" aria-controls="linkedin" aria-selected="true">
                                        {/* <i className="fab fa-linkedin-in me-2 linkedin"></i>  */}
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
                                        LinkedIn
                                    </button>
                                </li>
                            </ul>

                            <div className="tab-content p-3 border border-top-0 rounded-bottom custom-bg-color mb-3">
                                {/* Facebook posts */}
                                <div className="tab-pane fade active show" id="facebook" role="tabpanel" aria-labelledby="facebook-tab">
                                    {/* <h3>Facebook Draft</h3> */}                                    
                                    <div className="row d-flex flex-wrap align-items-stretch my-3">
                                        {/* loop  posts */} 
                                        {loading && (
                                            <div className="loading-container">
                                                <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                            </div>
                                        )}

                                        {(() => {
                                            const facebookPosts = draftPosts.filter(post => post.platform === 'facebook');
                                            return facebookPosts.length === 0 ? (
                                                <div className="col-12 text-center py-5">
                                                    <i className="fas fa-file-alt fs-1 text-muted mb-3"></i>
                                                    <p className="text-danger">No facebook draft posts found.</p>
                                                </div>
                                        ) : ( 
                                                <>
                                                {facebookPosts.slice(0, visiblePosts).map((post, index) => (
                                                    <div className="col-sm-12 col-md-6 col-xl-4 my-1" key={`${post.postID}-${index}`}>
                                                        <div className="card">
                                                            <div className="draft-post-preview">
                                                                <div className="platform-preview facebook-preview mb-0">
                                                                    <div className="d-flex align-items-center p-2 justify-content-between w-100">
                                                                        <div className="preview-header">
                                                                            <img src={`${post.postPagePicture}`} className="profile-pic img-fluid" alt="Page"/>
                                                                            <div className="profile-info">
                                                                                <strong>{post.postPageName}</strong>
                                                                                <span className="text-danger">
                                                                                    <i className="fas fa-calendar-alt"></i> {moment(post.createdAt).format('DD-MMM-YYYY, hh:mm A')}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div>                                                   
                                                                            <div className="position-relative">
                                                                                {postingLoadingIds[post.postID] ? (
                                                                                    <>
                                                                                        <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                                                                    </>                                                                            
                                                                                ) : (
                                                                                    <>
                                                                                        <button className="btn btn-link p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                                                                                        </button>
                                                                                        <ul className="dropdown-menu dropdown-menu-end shadow">
                                                                                            <li>
                                                                                                <Link className="dropdown-item" to={{pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}`}}><i className="fas fa-edit me-2"></i> Edit Post</Link>
                                                                                            </li>
                                                                                            <li>
                                                                                                {/* <span className="dropdown-item" onClick={() => publishPost(post,index)} style={{cursor:'pointer'}}> */}
                                                                                                <span className="dropdown-item" onClick={() => publishDraftPostToPlatform(post)} style={{cursor:'pointer'}}>
                                                                                                    <i className="fas fa-paper-plane me-2"></i> Publish Post
                                                                                                </span>
                                                                                            </li>
                                                                                            <li>
                                                                                                <Link className="dropdown-item" to="#" onClick={() => {
                                                                                                    setPostToDelete(post);
                                                                                                    setShowDeleteModal(true);
                                                                                                    }}
                                                                                                ><i className="fas fa-trash-alt me-2"></i> Delete Post</Link>
                                                                                            </li>
                                                                                        </ul>
                                                                                    </> 
                                                                                )}                                   
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="preview-content">
                                                                        {/* {post.content.split(' ').slice(0, 150).join(' ') + (post.content.split(' ').length > 150 ? '...' : '')} */}                                                                        
                                                                        {post.content.split('\n\n').map((paragraph, paraIndex) => {
                                                                            if (paraIndex === 0) {
                                                                                return (
                                                                                    <div key={`para-${paraIndex}`} className="main-text" style={{ whiteSpace: 'pre-line' }} >
                                                                                        {paragraph.split(' ').slice(0, 10).join(' ')}
                                                                                        {paragraph.split(' ').length > 10 && (
                                                                                            <Link 
                                                                                                to={{ pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}` }}
                                                                                                className="text-primary ms-1"
                                                                                            >
                                                                                                Read more
                                                                                            </Link>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <div key={`para-${paraIndex}`} className="hashtags mt-2">
                                                                                    {paragraph.split(/(\s+)/).map((part, partIndex) => {
                                                                                        if (part.startsWith('#')) {
                                                                                            return (
                                                                                                <span key={`tag-${paraIndex}-${partIndex}`} className="text-primary me-1" style={{ fontSize: '14px', color:'blue' }} >
                                                                                                    {part}
                                                                                                </span>
                                                                                            );
                                                                                        }
                                                                                        return part === ' ' ? ' ' : null;
                                                                                    })}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                                
                                                                    </div>
                                                                    {/* <div className="preview-hashtags">
                                                                        #socialmedia #preview #demo
                                                                    </div> */}
                                                                    <div className="preview-media">
                                                                        {post.postMedia && (                                                                            
                                                                            (() => {
                                                                                try {
                                                                                    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
                                                                                    const postMediaObj = JSON.parse(post.postMedia);
                                                                                    const imgPath = `${BACKEND_URL}/uploads/posts/` + postMediaObj.img_path;
                                                                                    return <img src={imgPath} alt="Preview" className="img-fluid mb-2" style={{ objectFit: 'cover', width: '100%',height:'217px' }} />;
                                                                                } catch (error) {
                                                                                    return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="defualt-image" className="img-fluid mb-2" style={{ objectFit: 'cover', width: '100%' }} />;
                                                                                }
                                                                            })()
                                                                        )}                                                                
                                                                    </div>
                                                                    <div className="preview-footer">
                                                                        <div className="draft-engagement-bar w-100">
                                                                            <span><i className="far fa-thumbs-up"></i> Like</span>
                                                                            <span><i className="far fa-comment"></i> Comment</span>
                                                                            <span><i className="far fa-share-square"></i> Share</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {visiblePosts < facebookPosts.length && (
                                                    <div className="text-center w-100 mt-3">
                                                        <button onClick={loadMorePosts} className="btn btn-primary">Load More</button>
                                                    </div>
                                                )}
                                                </>
                                            );
                                        })()}                                     
                                        {/* End loop  posts */}  
                                    </div>
                                </div>
                                {/* End Facebook posts */}

                                {/* Start instagram posts */}
                                <div className="tab-pane fade" id="instagram" role="tabpanel" aria-labelledby="instagram-tab">
                                    {/* <h3>Instagram Draft</h3> */}
                                    <div className="row d-flex flex-wrap align-items-stretch my-3">
                                        {/* loop  posts */}
                                        {(() => {
                                            const instagram = draftPosts.filter(post => post.platform === 'instagram');
                                            return instagram.length === 0 ? (
                                                <div className="col-12 text-center py-5">
                                                    <i className="fas fa-file-alt fs-1 text-muted mb-3"></i>
                                                    <p className="text-danger">No instagram draft posts found.</p>
                                                </div>
                                        ) : ( 
                                                <>
                                                {instagram.slice(0, visiblePosts).map((post, index) => (
                                                    <div className="col-sm-12 col-md-6 col-xl-4 my-1" key={`${post.postID}-${index}`}>
                                                        <div className="card h-100 instagram-preview shadow-sm border-0">
                                                            <div className="card-body p-0">                                               
                                                                <div className="d-flex align-items-center justify-content-between px-3 py-2">
                                                                    <div className="d-flex align-items-center">
                                                                        <img src={`${post.postPagePicture}`} className="profile-pic img-fluid rounded-circle" alt="Page"/>
                                                                        <div>                                                              
                                                                            <strong>{post.postPageName}</strong>
                                                                            <span className="text-danger">
                                                                                <i className="fas fa-calendar-alt"></i> {moment(post.createdAt).format('DD-MMM-YYYY, hh:mm A')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="position-relative">                                                    
                                                                        <button className="btn btn-link p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                            {/* <i className="fa-solid fa-gear fs-4"></i> */}
                                                                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                                                                        </button>                                                    
                                                                        <ul className="dropdown-menu dropdown-menu-end shadow">
                                                                            <li>
                                                                                <Link className="dropdown-item" to={{pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}`}}><i className="fas fa-edit me-2"></i> Edit Post</Link>
                                                                            </li>
                                                                            <li>
                                                                                <span className="dropdown-item" onClick={() => publishDraftPostToPlatform(post)} style={{cursor:'pointer'}}>
                                                                                    <i className="fas fa-paper-plane me-2"></i> Publish Post
                                                                                </span>
                                                                            </li>
                                                                            <li>
                                                                                <Link className="dropdown-item" to="#" onClick={() => {
                                                                                    setPostToDelete(post);
                                                                                    setShowDeleteModal(true);
                                                                                    }}
                                                                                ><i className="fas fa-trash-alt me-2"></i> Delete Post</Link>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>                                                
                                                                <div className="preview-media">
                                                                    {post.postMedia && (                                                                            
                                                                        (() => {
                                                                            try {
                                                                            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
                                                                            const postMediaObj = JSON.parse(post.postMedia);
                                                                            const imgPath = `${BACKEND_URL}/uploads/posts/` + postMediaObj.img_path;
                                                                            return <img src={imgPath} alt="Preview" className="img-fluid rounded mb-2" style={{ objectFit: 'cover', width: '100%',height:'217px' }} />;
                                                                            } catch (error) {
                                                                            return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="defualt-image" className="img-fluid rounded mb-2" style={{ objectFit: 'cover', width: '100%' }} />;
                                                                            }
                                                                        })()
                                                                    )}
                                                                </div>                                                
                                                                <div className="d-flex align-items-center px-3 py-2 gap-3">
                                                                    <i className="far fa-heart fs-5"></i>
                                                                    <i className="far fa-comment fs-5"></i>
                                                                    <i className="far fa-paper-plane fs-5"></i>
                                                                </div>                                              
                                                                                                            
                                                                <div className="px-3 py-2">
                                                                {post.content.split(' ').slice(0, 150).join(' ') + (post.content.split(' ').length > 150 ? '...' : '')}<br/>
                                                                    <span className="text-primary">#design #preview #instagram</span>
                                                                </div>                                          
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {visiblePosts < instagram.length && (
                                                    <div className="text-center w-100 mt-3">
                                                        <button onClick={loadMorePosts} className="btn btn-primary">Load More</button>
                                                    </div>
                                                )}
                                                </>
                                            );
                                        })()}                                        
                                        {/* End loop  posts */}  
                                    </div>
                                </div>
                                {/* End instagram posts */}
                                {/* Start Twitter  posts */}
                                <div className="tab-pane fade" id="twitter" role="tabpanel" aria-labelledby="twitter-tab">
                                    {/* <h3>Twitter Draft</h3> */}
                                    <div className="row d-flex flex-wrap align-items-stretch my-3">
                                        {/* loop  posts */}

                                        {(() => {
                                            const twitter = draftPosts.filter(post => post.platform === 'twitter');
                                            return twitter.length === 0 ? (
                                                <div className="col-12 text-center py-5">
                                                    <i className="fas fa-file-alt fs-1 text-muted mb-3"></i>
                                                    <p className="text-danger">No twitter draft posts found.</p>
                                                </div>
                                        ) : ( 
                                                <>
                                                {twitter.slice(0, visiblePosts).map((post, index) => (
                                                    <div className="col-sm-12 col-md-6 col-xl-4 my-1" key={`${post.postID}-${index}`}>
                                                        <div className="card h-100 twitter-preview shadow-sm border-0 mb-4">
                                                            <div className="card-body p-3">                                            
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div className="d-flex align-items-center">
                                                                        <img src={`${post.postPagePicture}`} className="profile-pic img-fluid rounded-circle" alt="Page"/>
                                                                        <div>                                                                
                                                                            <strong>{post.postPageName}</strong>
                                                                            <span className="text-danger">
                                                                                <i className="fas fa-calendar-alt"></i> {moment(post.createdAt).format('DD-MMM-YYYY, hh:mm A')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="position-relative">                                               
                                                                        <button className="btn btn-link p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                            <i className="fa-solid fa-gear fs-4"></i>
                                                                            
                                                                        </button>                                                
                                                                        <ul className="dropdown-menu dropdown-menu-end shadow">
                                                                            <li>
                                                                                <Link className="dropdown-item" to={{pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}`}}><i className="fas fa-edit me-2"></i> Edit Post</Link>
                                                                            </li>
                                                                            <li>
                                                                                <span className="dropdown-item" onClick={() => publishDraftPostToPlatform(post)} style={{cursor:'pointer'}}>
                                                                                    <i className="fas fa-paper-plane me-2"></i> Publish Post
                                                                                </span>
                                                                            </li>
                                                                            <li>
                                                                                <Link className="dropdown-item" to="#" onClick={() => {
                                                                                    setPostToDelete(post);
                                                                                    setShowDeleteModal(true);
                                                                                    }}
                                                                                ><i className="fas fa-trash-alt me-2"></i> Delete Post</Link>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>                                            
                                                                <div className="tweet-content mb-2">
                                                                    {post.content.split(' ').slice(0, 150).join(' ') + (post.content.split(' ').length > 150 ? '...' : '')}<br/>
                                                                    <span className="text-primary">#TwitterClone #Bootstrap #FrontendDev</span>
                                                                </div>
                                                                <div className="tweet-media mb-2">
                                                                    {post.postMedia && (                                                                            
                                                                        (() => {
                                                                            try {
                                                                            const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
                                                                            const postMediaObj = JSON.parse(post.postMedia);
                                                                            const imgPath = `${BACKEND_URL}/uploads/posts/` + postMediaObj.img_path;
                                                                            return <img src={imgPath} alt="Preview" className="img-fluid rounded mb-2" style={{ objectFit: 'cover', width: '100%',height:'217px' }} />;
                                                                            } catch (error) {
                                                                            return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="defualt-image" className="img-fluid rounded mb-2" style={{ objectFit: 'cover', width: '100%' }} />;
                                                                            }
                                                                        })()
                                                                    )}
                                                                </div>                                            
                                                                <div className="d-flex justify-content-between text-muted small px-1">
                                                                    <span><i className="far fa-comment"></i> 0</span>
                                                                    <span><i className="fas fa-retweet"></i> 0</span>
                                                                    <span><i className="far fa-heart"></i> 0</span>
                                                                    <span><i className="fas fa-chart-bar"></i> 0</span>
                                                                    <span><i className="fas fa-share"></i></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {visiblePosts < twitter.length && (
                                                    <div className="text-center w-100 mt-3">
                                                        <button onClick={loadMorePosts} className="btn btn-primary">Load More</button>
                                                    </div>
                                                )}
                                                </>
                                            );
                                        })()}                                        
                                        {/* End loop  posts */}  
                                    </div>
                                </div>
                                {/* End Twitter  posts */}
                                {/* Start LinkedIn posts */}
                                <div className="tab-pane fade" id="linkedin" role="tabpanel" aria-labelledby="linkedin-tab">
                                    {/* <h3>LinkedIn Draft</h3> */}
                                    <div className="row d-flex flex-wrap align-items-stretch my-3">
                                        {/* Start loop posts */}

                                        {(() => {
                                            const linkedin = draftPosts.filter(post => post.platform === 'linkedin');
                                            return linkedin.length === 0 ? (
                                                <div className="col-12 text-center py-5">
                                                    <i className="fas fa-file-alt fs-1 text-muted mb-3"></i>
                                                    <p className="text-danger">No linkedin draft posts found.</p>
                                                </div>
                                        ) : ( 
                                                <>
                                                {linkedin.slice(0, visiblePosts).map((post, index) => (
                                                    <div className="col-sm-12 col-md-6 col-xl-4 my-1" key={`${post.postID}-${index}`}>
                                                        <div className="card">
                                                            <div className="draft-post-preview">
                                                                <div className="platform-preview linkedin-preview mb-0">
                                                                    <div className="d-flex align-items-center p-2 justify-content-between w-100">
                                                                        <div className="preview-header">
                                                                            <div className="d-flex align-items-center">
                                                                                <img src={`${post.postPagePicture}`} alt="" className="rounded-circle me-2" width="40" height="40"/>
                                                                                <div>
                                                                                    <strong>{post.postPageName}</strong><br/>
                                                                                    <span className="text-danger">
                                                                                        <i className="fas fa-calendar-alt"></i> {moment(post.createdAt).format('DD-MMM-YYYY, hh:mm A')}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="position-relative">
                                                                                {postingLoadingIds[post.postID] ? (
                                                                                    <>
                                                                                        <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                                                                    </>                                                                            
                                                                                ) : (
                                                                                    <>
                                                                                        <button className="btn btn-link p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                            {/* <i className="fa-solid fa-gear fs-4"></i> */}
                                                                                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>
                                                                                        </button>                                                    
                                                                                        <ul className="dropdown-menu dropdown-menu-end shadow">
                                                                                            <li>
                                                                                                <Link className="dropdown-item" to={{pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}`}}><i className="fas fa-edit me-2"></i> Edit Post</Link>
                                                                                            </li>
                                                                                            <li>
                                                                                                <span className="dropdown-item" onClick={() => publishDraftPostToPlatform(post)} style={{cursor:'pointer'}}>
                                                                                                    <i className="fas fa-paper-plane me-2"></i> Publish Post
                                                                                                </span>
                                                                                            </li>
                                                                                            <li>
                                                                                                <Link className="dropdown-item" to="#" onClick={() => {
                                                                                                        setPostToDelete(post);
                                                                                                        setShowDeleteModal(true);
                                                                                                    }}
                                                                                                ><i className="fas fa-trash-alt me-2"></i> Delete Post</Link>
                                                                                            </li>
                                                                                        </ul>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="preview-content">
                                                                        {/* {post.content.split(' ').slice(0, 150).join(' ') + (post.content.split(' ').length > 150 ? '...' : '')} */}
                                                                        {post.content.split('\n\n').map((paragraph, paraIndex) => {
                                                                            if (paraIndex === 0) {
                                                                                return (
                                                                                    <div key={`para-${paraIndex}`} className="main-text" style={{ whiteSpace: 'pre-line' }} >
                                                                                        {paragraph.split(' ').slice(0, 10).join(' ')}
                                                                                        {paragraph.split(' ').length > 10 && (
                                                                                            <Link 
                                                                                                to={{ pathname: '/edit-post', search: `?asset_id=${post.postPageID}&ref=${post.postID}` }}
                                                                                                className="text-primary ms-1"
                                                                                            >
                                                                                                Read more
                                                                                            </Link>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return (
                                                                            <div key={`para-${paraIndex}`} className="hashtags mt-2">
                                                                                {paragraph.split(/(\s+)/).map((part, partIndex) => {
                                                                                    if (part.startsWith('#')) {
                                                                                        return (
                                                                                            <span key={`tag-${paraIndex}-${partIndex}`} className="text-primary me-1" style={{ fontSize: '14px' }} >
                                                                                                {part}
                                                                                            </span>
                                                                                        );
                                                                                    }
                                                                                    return part === ' ' ? ' ' : null;
                                                                                })}
                                                                            </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="preview-media">
                                                                        {post.postMedia && (                                                                            
                                                                            (() => {
                                                                                try {
                                                                                    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
                                                                                    const postMediaObj = JSON.parse(post.postMedia);
                                                                                    const imgPath = `${BACKEND_URL}/uploads/posts/` + postMediaObj.img_path;
                                                                                    return <img src={imgPath} alt="Preview" className="img-fluid mb-2" style={{ objectFit: 'cover', width: '100%',height:'217px' }} />;
                                                                                } catch (error) {
                                                                                    return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="defualt-image" className="img-fluid mb-2" style={{ objectFit: 'cover', width: '100%' }} />;
                                                                                }
                                                                            })()
                                                                        )}
                                                                    </div>
                                                                    <div className="preview-footer">
                                                                        <div className="draft-engagement-bar w-100">
                                                                            <span><i className="far fa-thumbs-up"></i> Likes</span>
                                                                            <span><i className="far fa-comment"></i> Comments</span>
                                                                            <span><i className="fas fa-share-square"></i> Repost</span>
                                                                            <span><i className="fas fa-paper-plane"></i> Share</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {visiblePosts < linkedin.length && (
                                                    <div className="text-center w-100 mt-3">
                                                        <button onClick={loadMorePosts} className="btn btn-primary">Load More</button>
                                                    </div>
                                                )}
                                                </>
                                            );
                                        })()}                                        
                                        {/* End loop  posts */} 
                                    </div>
                                </div>
                                {/* End LinkedIn posts */}
                            </div>                            

                        </div>
                    </div>
                </div>
            </div>
            {/* Add this delete confirmation modal */}
            {showDeleteModal && (
                <div className="modal-overlay" 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} >
                    <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '450px' }}>
                        <h5>Confirm Delete</h5>
                        <hr/>
                        <p>
                            Are you sure you want to delete "<strong>{postToDelete?.content.split(' ').slice(0, 3).join(' ') + (postToDelete?.content.split(' ').length > 3 ? '...' : '')}</strong>" from <strong>{postToDelete?.postPageName || ''}?</strong>
                        </p>
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} >
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleDelete} > Delete </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer/>
        </div>
    </div>
  )
}
