import React, { useState, useEffect,useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import moment from 'moment';

export default function EditPost() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const postPageID = queryParams.get('asset_id');
    const postID = queryParams.get('ref');
    const [pageLoading, setPageLoading] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postDetailData, setPostDetailData] = useState(null);
    //const [imagePreview, setImagePreview] = useState(null);
    const [hashTagLoader, setHashTagLoader] = useState(false);
    const [hashTags, setHashTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [emojiPicker, setEmojiPicker] = useState(false);
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0); 
    const [scheduleLater, setScheduleLater] = useState(false);
    const [loading, setLoading] = useState(false);

    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileUrl, setSelectedFileUrl] = useState(null);

    const maxCharacters = 2000;
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);

    const isJSON = (str) => {
        try {
            const parsed = JSON.parse(str);
            return parsed && typeof parsed === 'object';
        } catch {
            return false;
        }
    };

    const isHttpsUrl = (str) => {
        try {
            const url = new URL(str);
            return url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const fetchPostDetails = async () => {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const authToken = localStorage.getItem('authToken');
            const page_id = postPageID;
            const post_id = postID;
            setPageLoading(true);
            if (!authToken || !page_id || !post_id) {
                console.warn("Missing required parameters.");
                return;
            }
            try {
                const response = await fetch(`${BACKEND_URL}/api/edit-post`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({ page_id, post_id }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                if (data?.postDetail) {
                    const postDetail = data.postDetail;
                    // console.log(postDetail);
                    setPostDetailData(postDetail);
                    setPostContent(postDetail.content);

                    if (postDetail.post_media) {
                        const isJson = isJSON(postDetail.post_media);
                        const isUrl = isHttpsUrl(postDetail.post_media);

                        if (postDetail.source === 'Platform') {
                            if (isJson) {
                                const mediaObj = JSON.parse(postDetail.post_media);
                                setSelectedFileUrl(`${BACKEND_URL}/uploads/posts/${mediaObj.img_path}`);
                            } else if (isUrl) {
                                setSelectedFileUrl(postDetail.post_media);
                            }
                        } else {
                            setSelectedFileUrl(postDetail.post_media);
                        }
                    }

                    if (postDetail.status === '2' && postDetail.schedule_time) {
                        const scheduleTimestamp = postDetail.schedule_time * 1000;
                        const date = new Date(scheduleTimestamp);
                        const formattedDate = date.toISOString().split('T')[0];
                        const formattedTime = date.toTimeString().slice(0, 5);
                        setScheduledDate(formattedDate);
                        setScheduledTime(formattedTime);
                        setScheduleLater(true);
                    }
                } else {
                    console.error("No post detail found in response.");
                }
            } catch (error) {
                console.error("Error fetching post details:", error);
            } finally {
                setPageLoading(false);
            }
        };

        fetchPostDetails();
    }, [postPageID, postID]);

    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
                !e.target.closest('.emoji-picker-btn')) {
            setEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleContentChange = (e) => {
        setPostContent(e.target.value);
        setSelectionStart(e.target.selectionStart);
        setSelectionEnd(e.target.selectionEnd);
    };

    // Handle emoji selection
    const handleEmojiSelect = (emojiData) => {        
        const emoji = emojiData.emoji;
        const newContent = postContent.slice(0, selectionStart) + emoji + postContent.slice(selectionEnd);    
            setPostContent(newContent);        
        // Update cursor position after insertion
        const newPosition = selectionStart + emoji.length;
        setTimeout(() => {
            textareaRef.current.setSelectionRange(newPosition, newPosition);
            textareaRef.current.focus();
        }, 0);
    };

    const handleAddCustomTag = () => {
        const tag = customTagInput.trim();
        if (tag && !hashTags.includes(tag)) {
            setHashTags(prev => [...prev, '#'+tag]);
            setCustomTagInput('');
        }
    };

    const handleHashtagWebhook = async () => {        
        if(!postContent.trim()) {
            toast.error('Please enter some content before using hashtags', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            })
            return;
        }
        const HASHTAGS_WEBHOOK_URL = `${process.env.REACT_APP_HASHTAGS_WEBHOOK_URL}`;
        setHashTags([]);
        setHashTagLoader(true);
        try {
            const response = await axios.post(`${HASHTAGS_WEBHOOK_URL}`,
                {
                    event: 'hashtag_button_clicked',
                    timestamp: new Date().toISOString(),
                    text: postContent
                }
            );
            setHashTagLoader(false);
            setHashTags(response.data[0].output.tags);
            //console.log('Received Hashtags:', response.data[0].output.tags);                
        } catch (error) {
            console.error('Error triggering webhook:', error);
            toast.error('Failed to trigger hashtag webhook', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            })
            setHashTagLoader(false);
        }
    };    

    const handleHashtagClick = (tag) => {
        const textarea = textareaRef.current;
        if (!textarea) return;         
            const contentParts = postContent.split('\n\n');        
        if (contentParts.length < 2) {          
            setPostContent(prev => `${prev}\n\n${tag}`);
        } else {          
            const [firstPara, secondPara] = contentParts;
            const newSecondPara = `${secondPara} ${tag}`;
            setPostContent(`${firstPara}\n\n${newSecondPara}`);
        }        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(postContent.length + tag.length + 1, postContent.length + tag.length + 1);
        }, 0);
    };

    // Start of skeleton for Post Preview
    const SkeletonPostPreview = () => {
        return (
        <div className="post-preview skeleton-container">
            <div className="platform-preview facebook-preview">
                {/* Header Skeleton */}
                <div className="d-flex align-items-center p-2 justify-content-between w-100">
                    <div className="preview-header">
                        <div className="skeleton-profile-pic skeleton"></div>
                        <div className="profile-info">
                            <div className="skeleton skeleton-text"></div>
                            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                        </div>
                    </div>
                    <div className="skeleton skeleton-icon"></div>
                </div>    
                {/* Content Skeleton */}
                <div className="preview-content disabled">
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                </div>    
                {/* Hashtags Skeleton */}
                <div className="preview-hashtags">
                    <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                </div>    
                {/* Media Skeleton */}
                <div className="preview-media">
                    <div className="skeleton media-skeleton"></div>
                </div>    
                {/* Footer Skeleton */}
                <div className="preview-footer">
                    <div className="engagement-bar w-100">
                        {[1, 2, 3].map((i) => (
                            <span key={i} className="skeleton skeleton-button"></span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        );
    };
    // End of skeleton for Post Preview

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedFileUrl(reader.result);  // Set image preview URL
            };
            reader.readAsDataURL(file);
            setSelectedFile(file);
        }
    };    

    const clickPostDraft = async () => {                 
        setLoading(true);        
        const page_id = postDetailData.page_id;
        const postID = postDetailData.id;
        const content = postContent;
        const socialUserID = postDetailData.social_user_id;
        const schedule_time = "NULL";            
        const status = "0";

        const formData = new FormData();
        formData.append('postID', postID);
        formData.append('pageid', page_id);
        formData.append('socialUserID', socialUserID);
        formData.append('content', content);
        formData.append('schedule_time', schedule_time);                
        formData.append('status', status); 
        if (selectedFile) {
            const filename = `upload_img-${Date.now()}.${selectedFile.name.split('.').pop()}`;
            formData.append("upload_img", selectedFile, filename);
            formData.append("mediaUrl", "true");
        }
        if (postContent !== '' && page_id!=='') {
            await updatePostDB(formData);
        } else {
            setLoading(false);                    
            setPostContent(postDetailData.content);
            toast.error('Post content reqired.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        }        
    };

    const clickPostNow = async () => {
        console.log("empty function.");
    };

    const SchedulePostToFacebookPage = async () => {
        setLoading(true); 
        const scheduleDateInput = document.getElementById('scheduleDate').value;
        const scheduleTimeInput = document.getElementById('scheduleTime').value;
        //console.log('scheduleDateInput',scheduleDateInput,scheduleTimeInput);
        if (!scheduleDateInput || !scheduleTimeInput) {
            toast.error('Please select both date and time.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            setLoading(false);
            return;
        }   
        const scheduledDateTime = `${scheduleDateInput}T${scheduleTimeInput}`;
        const dateObject = new Date(scheduledDateTime);        
        const unixTimestamp = new Date(dateObject.getTime());
        const scheduledPublishTime = Math.floor(unixTimestamp.getTime() / 1000);

        if (dateObject < new Date()) {
            toast.error('Please select a future date and time', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            })
            setLoading(false);
            return;
        }        
        
        const page_id = postDetailData.page_id;
        const postID = postDetailData.id;
        const content = postContent;
        const socialUserID = postDetailData.social_user_id;
        const schedule_time = scheduledPublishTime || null          
        const status = "2";

        const formData = new FormData();
        formData.append('postID', postID);
        formData.append('pageid', page_id);
        formData.append('socialUserID', socialUserID);
        formData.append('content', content);
        formData.append('schedule_time', schedule_time);                
        formData.append('status', status); 
        if (selectedFile) {
            const filename = `upload_img-${Date.now()}.${selectedFile.name.split('.').pop()}`;
            formData.append("upload_img", selectedFile, filename);
            formData.append("mediaUrl", "true");
        }
        if (postContent !== '' && page_id!=='') {
            await updatePostDB(formData);
        } else {
            setLoading(false);                    
            setPostContent(postDetailData.content);
            toast.error('Post content reqired.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        }  
    };

    const updatePostDB = async (formData) => {        
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');       
        try {              
            const response = await fetch(`${BACKEND_URL}/api/update-post`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }    
            const data = await response.json();
            //console.log('update content data DB',data); 
            setLoading(false);
            toast.success('Post update successfully.', {
                position: 'top-center', 
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });                  
        } catch (error) {
            //console.error("Error updating scheduling post:", error);
            //alert("Error scheduling post: " + error.message);
            setLoading(false);
        }
    }

    const clickPostUpdate = async () => {
        setLoading(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        
        const postID = postDetailData.id;
        const content = postContent;
        const pageAccessToken = postDetailData.pageData.token;
        const postPlatform = postDetailData.post_platform;

        try {              
            const response = await fetch(`${BACKEND_URL}/api/update-published-posts`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                        postID:postID,
                        content:content,
                        pageAccessToken:pageAccessToken,
                        postPlatform:postPlatform
                    }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }    
            const data = await response.json();
            // console.log('update content data DB',data); 
            setLoading(false);
            toast.success('Post updated successfully.', {
                position: 'top-center', 
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });                  
        } catch (error) {
            toast.error("Error Updating Post:", {
                position: 'top-center', 
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            setLoading(false);
        }
    }

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
                                    <h3>Edit Post</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Edit Post</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                {pageLoading && (
                                    <div className="row" style={{ height: '250px' }}>
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="loading-container">
                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                        <span className="sr-only">Loading...</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!pageLoading && (
                                    <div className="row">
                                        <div className="col-md-7">
                                            <div className="card">
                                                <div className="card-body">
                                                    <div className="sidebar-body">
                                                        <div className="row g-3 common-form">
                                                            <div className="col-6">
                                                                <h2 className="section-title text-primary"><i className="fas fa-share-alt"></i>Publish to</h2>
                                                            </div>
                                                            {postDetailData && (
                                                                <div className="col-6 text-right">
                                                                    <h2 className="section-title text-dark pull-right">
                                                                    Status: {postDetailData.status === '0' && <span className="text-danger">Draft</span>}
                                                                    {postDetailData.status === '1' && <span className="text-success">Posted</span>}
                                                                    {postDetailData.status === '2' && <span className="text-info">Post Later</span>}</h2>
                                                                </div>
                                                            )}
                                                            <div className="col-12 mt-0">                                                                
                                                                <select className="form-control" disabled>
                                                                    {postDetailData && (
                                                                        <option value="" selected>{postDetailData.pageData.pageName}</option>
                                                                    )}
                                                                </select>
                                                            </div>
                                                            <div className="col-12">
                                                                <h2 className="section-title text-primary"><i className="fas fa-edit"></i>Post content</h2>
                                                                <textarea ref={textareaRef} className="form-control" rows={8}
                                                                    id="postContent" placeholder="What's on your mind?" value={postContent}
                                                                    onChange={handleContentChange} maxLength={maxCharacters}
                                                                    onClick={(e) => {
                                                                        setSelectionStart(e.target.selectionStart);
                                                                        setSelectionEnd(e.target.selectionEnd);
                                                                    }}
                                                                    onSelect={(e) => {
                                                                        setSelectionStart(e.target.selectionStart);
                                                                        setSelectionEnd(e.target.selectionEnd);
                                                                    }}
                                                                />

                                                                <div className="d-flex align-items-center justify-content-between mt-3">
                                                                    <div className="d-flex gap-2">
                                                                        {hashTagLoader ? (
                                                                            <button type="button" className="tool-btn border" title="hashtag">
                                                                                <i className="fas fa-hashtag"></i>
                                                                            </button>
                                                                        ) : (
                                                                            <button type="button" className="tool-btn border" title="hashtag" onClick={handleHashtagWebhook}>
                                                                                <i className="fas fa-hashtag"></i>
                                                                            </button>
                                                                        )}
                                                                        <div className="emoji-picker-btn position-relative" ref={emojiPickerRef}>
                                                                            <button type="button" className="tool-btn border" title="Emoji" 
                                                                                onClick={() => setEmojiPicker(!emojiPicker)}                                                                           
                                                                            >
                                                                                <i className="far fa-smile"></i>
                                                                            </button>
                                                                            {emojiPicker && (
                                                                                <div className="emoji-picker-popup">
                                                                                    <EmojiPicker
                                                                                        searchDisabled={true}
                                                                                        emojiStyle="google"
                                                                                        onEmojiClick={(emojiData) => {
                                                                                            handleEmojiSelect(emojiData);
                                                                                            setEmojiPicker(true); // Close picker after selection
                                                                                        }}
                                                                                        previewConfig={{ showPreview: false }}
                                                                                        categories={[
                                                                                            'smileys_people',
                                                                                            'animals_nature',
                                                                                            'food_drink',
                                                                                            'travel_places',
                                                                                            'activities',
                                                                                            'objects',
                                                                                            'symbols',
                                                                                            'flags',
                                                                                            // 'frequently_used', // Exclude this line to hide "Frequently Used"
                                                                                        ]}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {postDetailData?.status !== '1' && (
                                                                            <div className="upload-cemera">
                                                                                <div className="media-upload border" id="mediaUploadArea">
                                                                                    <div className="upload-icon" onClick={() => fileInputRef.current.click()} style={{ cursor: 'pointer' }}>
                                                                                        <i className="fa-solid fa-camera"></i>
                                                                                    </div>
                                                                                    <input type="file" ref={fileInputRef} onChange={handleFileChange}
                                                                                        style={{ display: 'none' }} 
                                                                                        accept="image/jpeg, image/png, .jpg, .jpeg, .png"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="character-count"><span id="char-count">{postContent.length}</span>/{maxCharacters} characters</div>
                                                                        {/* <div className="character-count"><span id="char-count">0</span>/2000 characters</div> */}
                                                                    </div>
                                                                </div>
                                                                <div className="row mt-3">
                                                                    <div className="col-12">
                                                                        {hashTagLoader && (
                                                                            <div className="text-center">
                                                                                <div className="spinner-grow spinner-grow-sm" role="status">
                                                                                    <span className="visually-hidden">Loading...</span>
                                                                                </div>
                                                                                <div className="spinner-grow spinner-grow-sm" role="status">
                                                                                    <span className="visually-hidden">Loading...</span>
                                                                                </div>
                                                                                <div className="spinner-grow spinner-grow-sm" role="status">
                                                                                    <span className="visually-hidden">Loading...</span>
                                                                                </div>
                                                                            </div>  
                                                                        )}
                                                                        {hashTags.length > 0 && (
                                                                            <>
                                                                                <p className="mb-0">Suggested Hashtags:</p>
                                                                                {hashTags.map((tag, index) => (                                                        
                                                                                    <span className="badge badge-light-primary done-badge p-2 mt-2" 
                                                                                        key={index} onClick={() => handleHashtagClick(tag)}
                                                                                        style={{cursor:'pointer'}}
                                                                                    >
                                                                                        {tag}
                                                                                    </span>
                                                                                ))}
                                                                                <hr/>
                                                                                <div className="todo-list-header">
                                                                                    <div className="new-task-wrapper input-group">
                                                                                        <input className="form-control"  id="new-task" 
                                                                                            placeholder="Enter custom tag here. . ."
                                                                                            value={customTagInput}
                                                                                            onChange={(e) => setCustomTagInput(e.target.value)}
                                                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                                                                                        />
                                                                                        <span className="btn btn-primary add-new-task-btn" 
                                                                                            id="add-task" onClick={handleAddCustomTag}
                                                                                        >
                                                                                            Add custom tag
                                                                                        </span>
                                                                                    </div> 
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {postDetailData?.status !== '1' && (
                                                            <div className="col-12">
                                                                <div className="d-flex align-items-center p-2 justify-content-between w-100">
                                                                    <div className="schedule-option">
                                                                        <h2 className="section-title text-primary"><i className="fa-regular fa-clock"></i>Schedule for Later</h2>
                                                                    </div>
                                                                    <div className="toggle-switch">
                                                                        <input type="checkbox" id="schedule-later" name="schedule" className="toggle-input" 
                                                                            checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)}                                                                       
                                                                        />
                                                                        <label for="schedule-later" className="toggle-label"></label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            )}
                                                            {postDetailData?.status !== '1' && scheduleLater && (
                                                                <div className="row">
                                                                    <div className="col-md-6">                                                                        
                                                                        <input type="date" id="scheduleDate" className="form-control"
                                                                            min={new Date().toISOString().slice(0, 16)} value={scheduledDate}
                                                                            onChange={(e) => setScheduledDate(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-6">                                                                        
                                                                        <input type="time" id="scheduleTime" className="form-control"
                                                                            min={new Date().toLocaleTimeString('en-US', { 
                                                                                hour12: false, hour: '2-digit', minute: '2-digit' 
                                                                            }).slice(0, 5)}
                                                                            value={scheduledTime}
                                                                            onChange={(e) => setScheduledTime(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {loading ? (
                                                                <div className="action-buttons">
                                                                    <button className="btn btn-primary" disabled={loading} >
                                                                        <div className="spinner-border spinner-border-sm" role="status">
                                                                            <span className="sr-only">Loading...</span>
                                                                        </div>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="action-buttons">
                                                                        {postDetailData?.status === '0' && (
                                                                            <>
                                                                                <button className="btn btn-dark" onClick={clickPostDraft}>
                                                                                    <i className="fas fa-save"></i> Save as Draft 
                                                                                </button>
                                                                                <button className="btn btn-primary" onClick={clickPostNow}>
                                                                                    <i className="fas fa-paper-plane"></i> Post Now
                                                                                </button>
                                                                                {scheduleLater && (
                                                                                    <button className="btn btn-dark" onClick={SchedulePostToFacebookPage}>
                                                                                        <i className="fa-regular fa-clock"></i> Post later
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {postDetailData?.status === '1' && (
                                                                            <>                                                                                
                                                                                <button className="btn btn-primary" onClick={clickPostUpdate}>
                                                                                    <i className="fas fa-save"></i> Update Post
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {postDetailData?.status === '2' && (
                                                                            <>
                                                                                <button className="btn btn-dark" onClick={clickPostDraft}>Save as Draft </button>                                                                        
                                                                                <button className="btn btn-primary" onClick={clickPostNow}>
                                                                                    <i className="fas fa-paper-plane"></i> Post Now
                                                                                </button>
                                                                                {scheduleLater && (
                                                                                    <button className="btn btn-dark" onClick={SchedulePostToFacebookPage}>
                                                                                        <i className="fa-regular fa-clock"></i> Post later
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}                                                            
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5">
                                            <div className="card">
                                                <div className="preview-container card-body">
                                                    <h2 className="section-title text-primary"><i className="fas fa-eye"></i>Post Preview</h2>
                                                    <div className="custom-preview-height">
                                                        {!postDetailData && (
                                                            <SkeletonPostPreview />
                                                        )}
                                                        {postDetailData && (
                                                            <div className="post-preview">                                                                
                                                                <div className="platform-preview facebook-preview">
                                                                    <div className="d-flex align-items-center p-2 justify-content-between w-100">
                                                                        <div className="preview-header">
                                                                            <img src={postDetailData.pageData.page_picture} className="profile-pic img-fluid" alt={postDetailData.pageData.pageName}/>
                                                                            <div className="profile-info">
                                                                                <strong>{postDetailData.pageData.pageName}</strong>
                                                                                <span><i className="fas fa-globe"></i> {moment(postDetailData.createdAt).format('DD-MMM-YYYY, hh:mm A')}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div> <i className="fa-solid fa-ellipsis fs-4"></i> </div>
                                                                    </div>
                                                                    <div className="preview-content">
                                                                        {/* {postContent.split('\n\n').map((paragraph, paraIndex) => (
                                                                            <div key={`para-${paraIndex}`} className={paraIndex === 0 ? "main-text" : "hashtags mt-2"}
                                                                                style={{ whiteSpace: 'pre-line' }}
                                                                            >
                                                                            {paraIndex === 0 ? (
                                                                                paragraph
                                                                            ) : (
                                                                                <>
                                                                                    {paragraph.split(/(#\w+)/g).map((part, partIndex) => {
                                                                                        if (part.startsWith('#') && part.length > 1) {
                                                                                            return (
                                                                                                <span key={`tag-${paraIndex}-${partIndex}`} className="text-primary me-1"
                                                                                                    style={{ fontSize: '14px' }}
                                                                                                >
                                                                                                    {part}
                                                                                                </span>
                                                                                            );
                                                                                        }
                                                                                        return part; // Return plain text directly
                                                                                    })}
                                                                                </>
                                                                            )}
                                                                            </div>
                                                                        ))} */}
                                                                        <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                                                            {postContent?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => (
                                                                                <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0" }}>
                                                                                {line.split(/(#\w+)/g).map((part, partIndex) =>
                                                                                    part.startsWith("#") && part.length > 1 ? (
                                                                                    <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary" style={{ fontWeight: 500 }} >
                                                                                        {part}
                                                                                    </span>
                                                                                    ) : (
                                                                                    <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                                                                                    )
                                                                                )}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    {selectedFileUrl && (
                                                                        <div className="preview-media">                                                                        
                                                                            <img src={selectedFileUrl} alt="Selected content" className="img-fluid"
                                                                                style={{ 
                                                                                    maxHeight: '300px', objectFit: 'cover', width: '100%'
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div className="preview-footer">
                                                                        <div className="engagement-bar w-100">
                                                                            <span><i className="far fa-thumbs-up"></i> Like</span>
                                                                            <span><i className="far fa-comment"></i> Comment</span>
                                                                            <span><i className="far fa-share-square"></i> Share</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>                                                
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
