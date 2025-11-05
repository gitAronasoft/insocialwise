import React, { useState,useEffect } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Modal from 'react-modal';

export default function InsightsFacebook() {
    const [loading, setLoading] = useState(false);
    const [insightsData, setInsightsData] = useState([]);
    const [pageData, setpageData] = useState(null);
    const [pageId, setpageId] = useState(null);
    const [pageToken, setPageToken] = useState(null);

    const [selectedPost, setSelectedPost] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const [commentText, setCommentText] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    //const [optionsVisible, setOptionsVisible] = useState(null); // To track which post's options are visible
   

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
            if (userInfoData && userInfoData.socialPage && userInfoData.socialPage[0]) {
                setpageId(userInfoData.socialPage[0].pageId);
                setPageToken(userInfoData.socialPage[0].token);
            }

            if(userInfoData && userInfoData.socialData) {
                setCurrentUser({
                    name: userInfoData.socialData.name,
                    avatar: userInfoData.socialData.img_url || `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`
                });
            }

            if(pageId && pageToken) {                
                try {
                    const response = await fetch(`https://graph.facebook.com/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares,attachments&access_token=${pageToken}&limit=8`);
                    const data = await response.json();
                    //console.log('facebook posts data', data);
                    await fetchPageData();
                    setInsightsData(data.data || []);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        const fetchPageData = async () => {            
            if (pageId && pageToken) {
                setLoading(true);
                try {
                    const response = await fetch(`https://graph.facebook.com/v20.0/${pageId}?fields=name,picture,cover,followers_count,fan_count&access_token=${pageToken}`);
                    const data = await response.json();                    
                    setpageData(data);
                    //console.log('facebook page data', data);
                    //console.log('pageData',pageData);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }           
            } 
        };
         fetchData();         
    }, [pageId, pageToken,refreshTrigger]);

    
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric', // Include the year in the format
            hour: '2-digit',
            minute: '2-digit',
            hour12: true, // 24-hour time format
        };
        return date.toLocaleString('en-GB', options); // Format as day month year hour:minute
    };  
    

    const postComment = async (postId, message) => {
        try {
            const response = await fetch(
                `https://graph.facebook.com/${postId}/comments?message=${encodeURIComponent(message)}&access_token=${pageToken}`,
                { method: 'POST' }
            );
            
            if (!response.ok) {
                throw new Error('Failed to post comment');
            }
            
            const data = await response.json();
            //console.log('data',data);
            if(data){
                return data;
            }
            
        } catch (error) {
            console.error('Error posting comment:', error);
            throw error; // Re-throw to handle in the caller
        }
    };

    // Add this delete function in your component
    const deleteComment = async (commentId) => {
        try {
            const response = await fetch(
                `https://graph.facebook.com/${commentId}?access_token=${pageToken}`,
                { method: 'DELETE' }
            );
            
            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }
            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    };

    // const handleEdit = (postId) => {
    //     console.log("Editing post with ID:", postId);        
    // };

    // const handleDelete = async (postId) => {
    //     setLoading(true); 
    //     const pageAccessToken = pageToken;
    //     const postID = postId;       
    //     try {
    //         setInsightsData(prev => prev.filter(post => post.id !== postId));
    //         const response = await fetch(`https://graph.facebook.com/${postID}`, {
    //           method: 'DELETE',
    //           headers: {
    //             'Content-Type': 'application/json',
    //           },
    //           body: JSON.stringify({                
    //             access_token: pageAccessToken,
    //           }),
    //         });
        
    //         const result = await response.json();
    //         if (response.ok) {                
    //           console.log('Post delete successfully:', result);
    //           setRefreshTrigger(prev => prev + 1);
    //           setLoading(false); 
    //         } else {
    //           console.log('Error delete post:', result);
    //           setInsightsData(insightsData);
    //           setLoading(false); 
    //         }
    //     } catch (error) {
    //         console.error('Error:', error);
    //         setLoading(false); 
    //     }  
    // };
    
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
                                <h3>Facebook Feeds</h3>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item">Dashboard</li>
                                    <li className="breadcrumb-item active">Facebook Feeds</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="row">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="sidebar-body">
                                            <div className="row g-3 common-form">
                                                {loading ? (
                                                    <div className="loading-container">
                                                        <i className="fas fa-spin fa-spinner" style={{fontSize:'25px'}}></i>
                                                    </div>
                                                ) : insightsData.length > 0 ? ( 
                                                    <>                                               
                                                        <div className="row mt-4"> 
                                                            <div className="col col-md-4 col-lg-4 col-xl-4 col-xxl-4 box-col-4">
                                                                <div className="card social-widget widget-hover">
                                                                    <div className="card-body">                                                                        
                                                                        <div className="d-flex align-items-center justify-content-between"> 
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <div className="social-icons">
                                                                                    {pageData.picture ? (
                                                                                        <img src={`${pageData.picture.data.url}`} alt="facebook icon"/>
                                                                                    ) : (
                                                                                        <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt="facebook icon"/>
                                                                                    )}
                                                                                </div> 
                                                                                <span style={{fontSize:'16px'}}> {pageData.name} </span>   
                                                                            </div>                                                                            
                                                                        </div>
                                                                        <div className="social-content"> 
                                                                            <div> 
                                                                                <h5 className="mb-1 counter" data-target={pageData.fan_count}> {pageData.fan_count}</h5>
                                                                                <span className="f-light"> Likes </span>
                                                                            </div>
                                                                            <div className="text-end"> 
                                                                                <div> 
                                                                                    <h5 className="mb-1 counter" data-target={pageData.followers_count}> {pageData.followers_count}</h5>
                                                                                    <span className="f-light"> Followers</span>
                                                                                </div>
                                                                            </div>                                                                            
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row"> 
                                                            <h5 className="mt-3 mb-3">Recent Posts <i className="fa-solid fa-rss"></i></h5>
                                                            <hr/>
                                                            {insightsData.map((post) => (
                                                                <div key={post.id} className="col-md-3 col-xxl-3 box-col-3 p-3">
                                                                    <div className="card">
                                                                        <div className="blog-box blog-grid text-center">                                                                            
                                                                            <div style={{
                                                                                    backgroundImage: post.attachments && post.attachments.data[0] 
                                                                                        ? `url(${post.attachments.data[0].media.image.src})`
                                                                                        :  `url(${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg)`, // Set default image if no attachment is available
                                                                                    backgroundSize: 'contain',
                                                                                    backgroundPosition: 'center',
                                                                                    height: '200px', 
                                                                                    backgroundRepeat:'no-repeat',
                                                                                    marginTop:'10px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                                onClick={() => {
                                                                                    setSelectedPost(post);
                                                                                    setModalIsOpen(true);
                                                                                }}
                                                                            >
                                                                            </div>
                                                                            {/* <button 
                                                                                className="btn btn-link text-dark position-absolute top-0 end-0 p-1"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    //console.log('Post options clicked', post.id);
                                                                                    setOptionsVisible(optionsVisible === post.id ? null : post.id);
                                                                                }}
                                                                                style={{
                                                                                    zIndex: 1,
                                                                                    borderRadius: '50%',
                                                                                    width: '50px',
                                                                                    height: '50px',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)'
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-ellipsis-h"></i>
                                                                            </button> */}

                                                                            {/* {optionsVisible === post.id && (
                                                                                <div
                                                                                    className="options-dropdown"
                                                                                    style={{
                                                                                        position: 'absolute',
                                                                                        top: '60px',
                                                                                        right: '10px',
                                                                                        backgroundColor: '#fff',
                                                                                        border: '1px solid #ccc',
                                                                                        borderRadius: '5px',
                                                                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                                                        zIndex: 2,
                                                                                    }}
                                                                                >
                                                                                    <ul
                                                                                        style={{
                                                                                            listStyle: 'none',
                                                                                            margin: 0,
                                                                                            padding: '10px',
                                                                                            textAlign: 'left',
                                                                                        }}
                                                                                    >
                                                                                        <li
                                                                                            //onClick={() => handleEdit(post.id)}                                                                                            
                                                                                            style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #ddd' }}
                                                                                        >                                                                                           
                                                                                            Edit
                                                                                        </li>
                                                                                        <li
                                                                                            onClick={() => handleDelete(post.id)}
                                                                                            style={{ cursor: 'pointer', padding: '8px' }}
                                                                                        >
                                                                                            Delete
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>
                                                                            )} */}

                                                                            <div className="blog-details-main">
                                                                                <p style={{fontSize:'12px',paddingTop:'10px',marginBottom:'0px'}}><i className="fa fa-calendar fw-bold"></i> {formatDate(post.created_time)}</p>
                                                                                <ul className="blog-social" style={{marginTop:'5px'}}>
                                                                                    <li><i className="far fa-thumbs-up fw-bold"></i>: {post.likes.summary.total_count}</li>
                                                                                    <li><i className="fa-regular fa-comment fw-bold"></i>: {post.comments.summary.total_count}</li>
                                                                                </ul>
                                                                                <hr style={{marginBottom:'10px'}} />                                                                           
                                                                                <p className="text-left pl-2 pr-2 pb-2">
                                                                                    {post.message 
                                                                                    ? (post.message.split(' ').length > 10 
                                                                                        ? post.message.split(' ').slice(0, 10).join(' ') + '...'
                                                                                        : post.message)
                                                                                    : null}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>                                                   
                                                            ))}
                                                        </div>
                                                        <Modal
                                                            isOpen={modalIsOpen}
                                                            onRequestClose={() => setModalIsOpen(false)}                                                                                                                        
                                                            shouldCloseOnOverlayClick={false}
                                                            style={{
                                                                content: {
                                                                    top: '50%',
                                                                    left: '50%',
                                                                    right: 'auto',
                                                                    bottom: 'auto',
                                                                    transform: 'translate(-50%, -50%)',  // Center the modal
                                                                    width: '80%',
                                                                    height: '80%',
                                                                    padding: '20px',
                                                                    borderRadius: '8px',
                                                                    backgroundColor: 'white',
                                                                    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                                                                    zIndex: 9999,  // Add z-index to ensure it's on top
                                                                    overflowY: 'auto',
                                                                    scrollbarWidth: 'none',
                                                                },
                                                                overlay: {
                                                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Dark background overlay
                                                                    zIndex: 9998, // Ensure the overlay is below the modal
                                                                }
                                                            }}
                                                        >
                                                            <div className="modal-content">
                                                                
                                                                <div className="modal-body">
                                                                    {selectedPost && (
                                                                        <div className="row">
                                                                            <div className="col-md-6">
                                                                                <div 
                                                                                    className="modal-image"
                                                                                    style={{
                                                                                        backgroundImage: selectedPost.attachments?.data[0] 
                                                                                            ? `url(${selectedPost.attachments.data[0].media.image.src})`
                                                                                            : `url(${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg)`,
                                                                                        backgroundSize: 'cover',
                                                                                        backgroundPosition: 'center',
                                                                                        height: '300px',
                                                                                        borderRadius: '5px'
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                            <div className="col-md-6">
                                                                                <div className="post-details">
                                                                                    <div className="row">
                                                                                        <div className="col-xxl-2 col-xl-2 text-center">
                                                                                            <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} width={40} alt="avtar" />
                                                                                        </div>
                                                                                        <div className="col-xxl-8 col-xl-8 align-items-center">
                                                                                            <h6>{pageData.name}</h6>
                                                                                            <small><i className="fa fa-calendar"></i> {formatDate(selectedPost.created_time)}</small>
                                                                                        </div>
                                                                                        <div className="col-xxl-2 col-xl-2 d-flex align-items-center">
                                                                                            <div className='d-flex justify-content-end'>
                                                                                                <div className="d-flex">
                                                                                                <button 
                                                                                                    type="button" 
                                                                                                    className="btn btn-danger close" 
                                                                                                    onClick={() => setModalIsOpen(false)}
                                                                                                >
                                                                                                    <span>&times;</span>
                                                                                                </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>                                                                                    
                                                                                    <div className="post-message mt-2">
                                                                                        {selectedPost.message || 'No message available'}
                                                                                    </div>
                                                                                    <div className="stats mb-3 mt-3">
                                                                                        <span className="me-3">
                                                                                            <i className="far fa-thumbs-up me-1"></i>
                                                                                            {selectedPost.likes.summary.total_count}
                                                                                        </span>
                                                                                        <span className="me-3">
                                                                                            <i className="far fa-comment me-1"></i>
                                                                                            {selectedPost.comments.summary.total_count}
                                                                                        </span>                                                                                        
                                                                                    </div>
                                                                                    <hr/>
                                                                                    
                                                                                    <h5>Comments</h5>
                                                                                    {selectedPost.comments?.data?.map((comment) => (
                                                                                        <div className="row mt-1" key={comment.id}>
                                                                                            <div className="col-xxl-2 col-xl-2 text-center">
                                                                                                <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} width={40} alt="avtar" />
                                                                                            </div>
                                                                                            <div className="col-xxl-10 col-xl-10 align-items-center">
                                                                                                <h6>{comment.from?.name}</h6>
                                                                                                <p>{comment.message}</p> 
                                                                                                <button 
                                                                                                    className="btn btn-link text-danger position-absolute top-0 end-0"
                                                                                                    onClick={async () => {
                                                                                                        if (window.confirm('Are you sure you want to delete this comment?')) {
                                                                                                            try {
                                                                                                                // Optimistic update
                                                                                                                setSelectedPost(prev => ({
                                                                                                                    ...prev,
                                                                                                                    comments: {
                                                                                                                        ...prev.comments,
                                                                                                                        data: prev.comments.data.filter(c => c.id !== comment.id),
                                                                                                                        summary: {
                                                                                                                            ...prev.comments.summary,
                                                                                                                            total_count: prev.comments.summary.total_count - 1
                                                                                                                        }
                                                                                                                    }
                                                                                                                }));
                                                                                                                
                                                                                                                await deleteComment(comment.id);
                                                                                                                
                                                                                                            } catch (error) {
                                                                                                                // Rollback on error
                                                                                                                setSelectedPost(prev => ({
                                                                                                                    ...prev,
                                                                                                                    comments: {
                                                                                                                        ...prev.comments,
                                                                                                                        data: [...prev.comments.data, comment],
                                                                                                                        summary: {
                                                                                                                            ...prev.comments.summary,
                                                                                                                            total_count: prev.comments.summary.total_count + 1
                                                                                                                        }
                                                                                                                    }
                                                                                                                }));
                                                                                                                alert('Failed to delete comment. Please try again.');
                                                                                                            }
                                                                                                        }
                                                                                                    }}
                                                                                                    style={{
                                                                                                        padding: '2px 5px',
                                                                                                        fontSize: '0.8rem',
                                                                                                    }}
                                                                                                >
                                                                                                    <i className="fa fa-trash"></i>
                                                                                                </button>                                                                                           
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                    {!selectedPost.comments?.data?.length && (
                                                                                        <p className="text-muted">No comments yet</p>
                                                                                    )}
                                                                                    
                                                                                    <div className="comment-input-section mb-4">
                                                                                            <form onSubmit={async (e) => {
                                                                                                e.preventDefault();
                                                                                                if (!commentText.trim()) return;

                                                                                                // Create temporary comment for optimistic update
                                                                                                const tempComment = {
                                                                                                    id: `temp-${Date.now()}`, // Temporary ID
                                                                                                    from: { 
                                                                                                        name: currentUser.name,
                                                                                                        id: 'current-user-id' 
                                                                                                    },
                                                                                                    message: commentText.trim(),
                                                                                                    created_time: new Date().toISOString()
                                                                                                };

                                                                                                // Optimistically update UI
                                                                                                setSelectedPost(prev => ({
                                                                                                    ...prev,
                                                                                                    comments: {
                                                                                                        ...prev.comments,
                                                                                                        data: [tempComment, ...prev.comments.data],
                                                                                                        summary: {
                                                                                                            ...prev.comments.summary,
                                                                                                            total_count: prev.comments.summary.total_count + 1
                                                                                                        }
                                                                                                    }
                                                                                                }));
                                                                                                setCommentText('');

                                                                                                try {
                                                                                                    // Post to Facebook API
                                                                                                    const result = await postComment(selectedPost.id, commentText.trim());
                                                                                                    
                                                                                                    // Replace temporary comment with actual data from API response
                                                                                                    setSelectedPost(prev => ({
                                                                                                        ...prev,
                                                                                                        comments: {
                                                                                                            ...prev.comments,
                                                                                                            data: prev.comments.data.map(comment => 
                                                                                                                comment.id === tempComment.id 
                                                                                                                    ? { ...comment, id: result.id } // Update with real ID
                                                                                                                    : comment
                                                                                                            )
                                                                                                        }
                                                                                                    }));
                                                                                                    
                                                                                                } catch (error) {
                                                                                                    // Rollback on error
                                                                                                    setSelectedPost(prev => ({
                                                                                                        ...prev,
                                                                                                        comments: {
                                                                                                            ...prev.comments,
                                                                                                            data: prev.comments.data.filter(c => c.id !== tempComment.id),
                                                                                                            summary: {
                                                                                                                ...prev.comments.summary,
                                                                                                                total_count: prev.comments.summary.total_count - 1
                                                                                                            }
                                                                                                        }
                                                                                                    }));
                                                                                                    alert('Failed to post comment. Please try again.');
                                                                                                }
                                                                                            }}>
                                                                                            <div className="d-flex align-items-start gap-2">
                                                                                                <img 
                                                                                                    src={currentUser?.avatar} 
                                                                                                    alt="User avatar"
                                                                                                    className="rounded-circle"
                                                                                                    style={{
                                                                                                        width: '32px',
                                                                                                        height: '32px',
                                                                                                        objectFit: 'cover'
                                                                                                    }}
                                                                                                />
                                                                                                <div className="flex-grow-1 position-relative">
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        className="form-control rounded-pill ps-3 pe-5"
                                                                                                        placeholder="Write a comment..."
                                                                                                        value={commentText}
                                                                                                        onChange={(e) => setCommentText(e.target.value)}
                                                                                                        style={{
                                                                                                            height: '38px',
                                                                                                            borderRadius: '20px',
                                                                                                            backgroundColor: '#f0f2f5',
                                                                                                            border: 'none'
                                                                                                        }}
                                                                                                    />
                                                                                                    <button 
                                                                                                        type="submit"
                                                                                                        className="btn btn-primary rounded-pill position-absolute"
                                                                                                        style={{
                                                                                                            right: '5px',
                                                                                                            top: '50%',
                                                                                                            transform: 'translateY(-50%)',
                                                                                                            padding: '2px 12px',
                                                                                                            fontSize: '0.875rem',
                                                                                                            display: commentText ? 'block' : 'none'
                                                                                                        }}
                                                                                                        disabled={!commentText.trim()}
                                                                                                    >
                                                                                                        Comment
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </form>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>                                                                
                                                            </div>
                                                        </Modal>
                                                    </>
                                                ) : (
                                                    <div className="loading-container">
                                                        <p className="text-danger">Connect your Facebook APP.</p>
                                                    </div>
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
            <Footer />
        </div>
    </div>
  )
}
