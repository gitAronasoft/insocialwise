import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Modal from 'react-modal';
import HoverPostPreview from './components/HoverPostPreview';

const localizer = momentLocalizer(moment);

export default function PostCalendar() {
    const [posts, setPosts] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null); // For storing the selected event
    const [isModalOpen, setIsModalOpen] = useState(false); // For controlling modal visibility
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));        
        const authToken = localStorage.getItem('authToken');
        if(userInfoData.socialData && userInfoData.socialData!=='' && userInfoData.socialData!==null)
        {
            const socialUserID = userInfoData.socialData.social_id;
            // Start Fetch scheduled posts
            try {
                fetch(`${BACKEND_URL}/api/scheduled-posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken,
                    },
                    body: JSON.stringify({ socialUserID }),
                })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data && Array.isArray(data.userSchedulePosts)) {
                        const formattedPosts = data.userSchedulePosts.map(post => {
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
                        setPosts(formattedPosts);
                    } else {
                        console.error("No posts data found or invalid structure");
                    }
                })
                .catch((error) => {
                    console.error('Post save error.', error);                    
                });
            } catch (error) {
                console.error("Error scheduling post:", error);                
            }
        }
    }, []);

    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event); // Set the selected event
        setIsModalOpen(true); // Open the modal
    }, []);

    // Customize event appearance, add an image if available
    // const eventStyleGetter = (event) => {
    //     const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    //     const style = {  
    //         backgroundColor: event.isExpired ? 'transparent' : '',     
    //         color: event.isExpired ? 'red' : '#333',
    //         borderRadius: '5px',
    //         padding: '5px',
    //         position: 'relative',
    //         overflow: 'hidden',
    //         opacity: event.isExpired ? '0.6' : '',            
    //     };        
    //     if (event.postMedia) {
    //         const postMediaObj = JSON.parse(event.postMedia);
    //         const imageUrl = `${BACKEND_URL}/uploads/posts/${postMediaObj.img_path}`;
    //         style.backgroundImage = `url(${imageUrl})`;
    //         style.backgroundSize = 'cover';
    //         style.backgroundPosition = 'center';
    //         style.height = '100px';         
    //     }

    //     return {
    //         style,
    //     };
    // };
    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: 'transparent',
                color: event.isExpired ? 'red' : '#333',
                border: 'none',
                borderLeft: '3px solid teal',
                borderRadius: 0,
                padding: 0,
                opacity: event.isExpired ? 0.6 : 1,
            },
        };
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // Close the modal
        setSelectedEvent(null); // Clear the selected event
    };
    
    const deletePost = async (post_PageID, post_ID) => { 
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;        
        setLoading(post_ID);        
        const postPageID = post_PageID;
        const postID = post_ID;        
        const token = localStorage.getItem('authToken');
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
        const socialUser_ID = userInfoData.socialData.social_id;
        try {
            const requestBody = {
                postID: postID,
                socialUserID: socialUser_ID,
                postPageID: postPageID
            };    
            // Send JSON instead of FormData
            fetch(`${BACKEND_URL}/api/delete-post`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json', // Set content type to JSON
                },
                body: JSON.stringify(requestBody) // Send the JSON payload
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setLoading(null);
                if (data && Array.isArray(data.userSchedulePosts)) {
                    const formattedPosts = data.userSchedulePosts.map(post => {
                        const scheduledTime = post.schedule_time 
                            ? new Date(post.schedule_time * 1000)  // Convert from Unix timestamp to Date object
                            : post.createdAt 
                            ? new Date(post.createdAt)  // Fallback to createdAt if schedule_time is missing
                            : new Date();  // Default to current date if neither exists
                        
                        if (!post.schedule_time) {
                            console.warn("Missing schedule_time for post:", post);
                        }

                        // Format the scheduled time
                        const formattedTime = moment(scheduledTime).format('hh:mm A');                       
                        return {
                            title: `${post.content || "No message"}`,
                            start: scheduledTime,
                            end: scheduledTime,
                            description: `${post.content} - ${formattedTime}`,
                            postPageID: post.page_id,
                            postID: post.id,
                            postMedia: `${post.post_media || ""}`,
                            postPageName: post.pageData.pageName,
                        };
                    }).filter(post => post !== null);
                    setPosts(formattedPosts);
                } else {
                    console.error("No posts data found or invalid structure");
                }
                handleCloseModal();
                // Optionally, handle success here
            })
            .catch((error) => {
                //console.error('Post delete error:', error);
                setLoading(null);
            });
        } catch (error) {
            //console.error("Error deleting post:", error);            
            setLoading(null);
        }
    }

    const CustomEvent = ({ event }) => {
        let imageUrl = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
        try {
            if (typeof event.postMedia === 'string') {
                if (event.postMedia.startsWith('https://')) {
                    imageUrl = event.postMedia;
                } else {
                    const parsed = JSON.parse(event.postMedia);
                    const imageUrlLocal = parsed?.[0].path;
                    if (imageUrlLocal) {
                        imageUrl =  `${process.env.REACT_APP_BACKEND_URL}${imageUrlLocal}`;
                    }
                }
            }
        } catch {
            imageUrl = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
        }

        const isExpired = moment.unix(event.schedule_time).isBefore(moment());

        return (
            // <HoverPostPreview post={event} platform={event?.platform?.toLowerCase()}>
            //     <div className="d-flex align-items-center" style={{ padding: 2 }}>
            //         {imageUrl && (
            //             <div className="position-relative" style={{ width: '30px', height: '30px' }} >
            //                 <img src={imageUrl} alt="preview" className="rounded-circle" style={{ width: '30px', height: '30px', objectFit: 'cover' }} />
            //                 <i className={`fab fa-${event.platform} position-absolute`}
            //                     style={{ bottom: '-4px', right: '-4px', fontSize: '10px', color: getPlatformColor(event.platform),
            //                         backgroundColor: '#fff', borderRadius: '50%', padding: '2px', boxShadow: '0 0 2px rgba(0,0,0,0.3)' }}
            //                     title={event.platform}
            //                 ></i>
            //             </div>
            //         )}
            //         <div className="d-flex flex-column ms-2">
            //             <span style={{ fontSize: '12px' }}> {event.title?.split(' ').slice(0, 4).join(' ')}... </span>
            //             <span style={{ fontSize: '10px', color: '#888' }}> 
            //                 <img src={event.postPagePicture} alt={event.postPageName} className="rounded-circle"
            //                     style={{ height:"10px" }} /> &nbsp; {event.postPageName} 
            //             </span>
            //         </div>
            //     </div>

            // </HoverPostPreview>
            /* Desktop View */
            <div className="d-none d-md-block">
                {posts.map((item) => (
                    <HoverPostPreview key={event.postID} post={event} platform={event?.platform?.toLowerCase()} >
                        <div className={`post-card ${isExpired ? "expired" : ""}`} style={{padding: '2px', borderRadius: '0px 5px 5px 0px'}}>
                            <div className="post-content d-flex" style={{ alignItems: 'center', marginTop: '0px' }}>
                                <div className="platform-icons me-1" style={{ color:"white", background:getPlatformColor(event.platform) }} >
                                    {platformSVGs[event.platform] || (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                            <path d="M2 12h20" />
                                        </svg>
                                    )}
                                </div>

                                <div className="platform-details position-relative flex-grow-1">
                                    <div className="platform-header">
                                        {/* <span className="platform-name">{capitalizeFirstLetter(event.platform)}</span> */}
                                        <span className="platform-name">
                                            <i className="fa-regular fa-clock"></i> {event.formattedTime}
                                        </span>
                                        <span className={`media-type-badge badge bg-${event.mediaType === "image" ? "success" : 
                                            event.mediaType === "video" ? "danger" : "info" }`} style={{right: '0'}} >
                                                {event.mediaType}
                                        </span>
                                    </div>

                                    {event.title === 'Expired' ? (
                                        <div className="post-title text-danger" style={{width:"100px"}}>{event.title}</div>
                                    ) : (
                                        <div className="post-title" style={{width:"100px"}}>{event.title}</div>
                                    )}
                                    
                                    {/* <div className="post-time">
                                        <i className="fa-regular fa-clock"></i> {event.formattedTime}
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </HoverPostPreview>
                ))}
            </div>

        );
    };

    const AgendaEvent = ({ event }) => {
        let imageUrl = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
        try {
            const media = JSON.parse(event.postMedia);
            imageUrl = media?.img_path ? `${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${media.img_path}` : null;
        } catch {}

        return (
            <tr>
                <td>
                    <HoverPostPreview post={event} platform={event?.platform?.toLowerCase()}>
                        <div className="d-flex align-items-center">
                            {imageUrl && (
                                <img src={imageUrl} alt="preview"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', marginRight: 10, }}
                                />
                            )}
                            <div className="d-flex flex-column">
                                <strong>
                                    {event.title?.split(' ').slice(0, 4).join(' ')}...
                                </strong>
                                <small style={{ fontSize: '12px', color: '#666' }}>{event.postPageName}</small>
                            </div>
                        </div>
                    </HoverPostPreview>
                </td>
                <td></td>
            </tr>
        );
    };

    function capitalizeFirstLetter(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

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

    return (
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-sm-12">
                                    <h1 className="h1-heading">Calendar Post</h1>
                                </div>
                               
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="row">
                                    <div className="card">
                                        <div className="card-body mobile-px-0">
                                            <div className="sidebar-body">
                                                <div className="row g-3 common-form custom-common-form">
                                                    <div style={{ height: '105vh'}}>
                                                        <Calendar
                                                            localizer={localizer}
                                                            events={posts}
                                                            startAccessor="start"
                                                            endAccessor="end"
                                                            // onSelectEvent={handleSelectEvent}
                                                            min={new Date()}
                                                            eventPropGetter={eventStyleGetter}
                                                            popup={true}
                                                            components={{
                                                                event:CustomEvent,
                                                                agenda: {
                                                                    event: AgendaEvent,
                                                                },
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <Modal
                                                    isOpen={isModalOpen}
                                                    onRequestClose={handleCloseModal}
                                                    contentLabel="Event Details"
                                                    ariaHideApp={false}
                                                    shouldCloseOnOverlayClick={false} 
                                                    style={{
                                                        content: {
                                                            top: '50%',
                                                            left: '50%',
                                                            right: 'auto',
                                                            bottom: 'auto',
                                                            transform: 'translate(-50%, -50%)',  // Center the modal
                                                            width: '50%',
                                                            height: '70%',
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
                                                    <div>                                                     
                                                        {selectedEvent && (
                                                            <div>                                                                
                                                                <div className="row">
                                                                    <div className="col-sm-8" style={{margin:"0 auto"}}>
                                                                        <div className="row">
                                                                            <div className="col-xxl-2 col-xl-2 text-center">
                                                                                <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} width={40} alt="avtar" />
                                                                            </div>
                                                                            <div className="col-xxl-8 col-xl-8 align-items-center">
                                                                                <h6>{selectedEvent.postPageName}</h6>
                                                                                {selectedEvent.title === 'Expired' ? (
                                                                                    <small className="text-danger">Expired at: {moment(selectedEvent.start).format('D MMMM YYYY [at] h:mm A')}</small>
                                                                                    
                                                                                ) : (
                                                                                    <small className="text-danger">Published on: {moment(selectedEvent.start).format('D MMMM YYYY [at] h:mm A')}</small>
                                                                                )}
                                                                                
                                                                            </div>
                                                                            <div className="col-xxl-2 col-xl-2 d-flex align-items-center">
                                                                                <div className='d-flex justify-content-end'>
                                                                                    <div className="d-flex" style={{paddingRight:10}}>
                                                                                        <div class="dropdown hideArrow">
                                                                                            <button className="btn btn-outline-dark dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                                                                <i className="fa fa-ellipsis-h"></i>
                                                                                            </button>
                                                                                            <ul className="dropdown-menu">                                                                                               
                                                                                                <li><Link class="dropdown-item" to={{pathname: '/edit-post',search: `?asset_id=${selectedEvent.postPageID}&ref=${selectedEvent.postID}`,}}><i className="fa fa-pencil"></i>  Edit Post</Link></li>
                                                                                                <li>
                                                                                                {loading === selectedEvent?.postID ? (
                                                                                                    <span className="dropdown-item text-danger">
                                                                                                        <div className="spinner-border spinner-border-sm" role="status">
                                                                                                            <span className="sr-only">Loading...</span>
                                                                                                        </div> Deleting...  
                                                                                                    </span>                                                                                                    
                                                                                                ) : (                                                                                                  
                                                                                                    <span className="dropdown-item" onClick={() => deletePost(selectedEvent.postPageID, selectedEvent.postID)}>
                                                                                                        <i className="fa fa-trash"></i> Delete Post
                                                                                                    </span>
                                                                                                )}                                                                                                   
                                                                                                </li>                                                                                                   
                                                                                            </ul>                                                                                            
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="d-flex">
                                                                                        <button className="btn btn-outline-danger" onClick={handleCloseModal}>
                                                                                            <i className="fa fa-close"></i>
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                                                                           
                                                                        <div className="row">
                                                                            {selectedEvent.title === 'Expired' ? (
                                                                                <p className="mt-3" style={{ fontSize: 13, fontWeight: 100, lineHeight: '16px', color: 'red' }}>
                                                                                    The post has expired, if you want to reschedule it then click on the three dots on the top right and select the Edit post option.
                                                                                </p>
                                                                            ) : (
                                                                                <p className="mt-3" style={{ fontSize: 13, fontWeight: 100, lineHeight: '18px' }}>
                                                                                    {selectedEvent.title}
                                                                                </p>
                                                                            )}
                                                                            {(() => {
                                                                                try {
                                                                                    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
                                                                                    const postMediaObj = JSON.parse(selectedEvent.postMedia);
                                                                                    const imgPath = `${BACKEND_URL}/uploads/posts/`+postMediaObj.img_path;
                                                                                    return (
                                                                                        <div>
                                                                                            <img src={imgPath} alt="Post Preview" className="img-fluid mb-3 w-100" />
                                                                                        </div>
                                                                                    );
                                                                                } catch (error) {                                                                                    
                                                                                    return (
                                                                                        <div>                                                                                            
                                                                                            <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} width={'100%'} alt="" className="img-fluid mb-3" />
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            })()}                                                                                                                                                                                                   
                                                                        </div> 
                                                                                                                                          
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
                                                        )}                                                        
                                                    </div>
                                                </Modal>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="row"> 
                                    <div className="card"> 
                                    
                                        <div className="d-block d-md-none">
                                            {posts.map((item) => (
                                                <HoverPostPreview key={item.postID} post={item} platform={item?.platform?.toLowerCase()}>
                                                <div className={`card  post-card mobile-view ${item.isExpired ? "expired" : ""}`}>
                                                    <div className="post-content d-flex gap-3 align-items-center p-2">
                                                    <div className="platform-icons mb-1" style={{ color:"white", background:getPlatformColor(item.platform) }}>
                                                        {platformSVGs[item.platform]}
                                                    </div>
                                                    <div className="platform-details">
                                                       
                                                        <div className="post-title">{item.title}</div>
                                                         <span className="platform-name mt-2">
                                                        <i className="fa-regular fa-clock"></i> {item.formattedTime}
                                                        </span>
                                                    </div>
                                                    </div>
                                                </div>
                                                </HoverPostPreview>
                                            ))}
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
