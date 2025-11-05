import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Carousel from "react-multi-carousel";
import { toast } from 'react-toastify';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export default function EditPost() {
    const location = useLocation();
    // const queryParams = new URLSearchParams(location.search);
    // const postPageID = queryParams.get('asset_id');
    // const postID = queryParams.get('ref');
    const formId = location.state?.formId;
    // const formId = queryParams.get('form_id');
    const [pageLoading, setPageLoading] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postDetailData, setPostDetailData] = useState(null);
    const [hashTagLoader, setHashTagLoader] = useState(false);
    const [hashTags, setHashTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState('');
    // const [emojiPicker, setEmojiPicker] = useState(false);
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0); 
    // const [scheduleLater, setScheduleLater] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const maxCharacters = 2000;
    const textareaRef = useRef(null);

    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [checkedPages, setCheckedPages] = useState([]);
    const selectedCount = platforms.filter(p => p.selected).length;

    // scheduling state (for disable logic + “Best Time” buttons)
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // selection + content guards
    const isContentEmpty = postContent.trim().length === 0;

    // const platformsRequiringMediaSelection = ['facebook', 'linkedin'];
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]); // [{id,type,file,url}]
    const [existingMediaFiles, setExistingMediaFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const [videoThumbnails, setVideoThumbnails] = useState({});

    const [globalMediaChoiceOpen, setGlobalMediaChoiceOpen] = useState(false);
    const [globalMediaType, setGlobalMediaType] = useState(null);
    const [hasMixedMediaGlobal, setHasMixedMediaGlobal] = useState(false);
    const mediaCounts = React.useMemo(() => {
        const images = mediaFiles.filter(m => m.type === 'image').length;
        const videos = mediaFiles.filter(m => m.type === 'video').length;
        return { images, videos };
    }, [mediaFiles]);

    // const [conflictingFiles, setConflictingFiles] = useState([]);
    const platformsInitRef = useRef(false);
    const lastFormIdRef = useRef(null);
    const allMedia = [...existingMediaFiles, ...mediaFiles];

    const hasMixedMedia = mediaCounts.images > 0 && mediaCounts.videos > 0;
    const carouselResponsive = {
        desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
        tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
        mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
    };

    const handleFiles = async (files) => {
        let fileArray = Array.from(files);
        
        // Check video constraints
        const hasExistingVideo = mediaFiles.some(m => m.type === 'video' && !m.isFromDatabase);
        const newVideos = fileArray.filter(file => file.type.startsWith("video"));
        
        if (hasExistingVideo && newVideos.length > 0) {
            toast.error("Only one video is allowed per post. The new videos will not be added.", {
                position: 'top-center',
                autoClose: 5000,
            });
            fileArray = fileArray.filter(file => !file.type.startsWith("video"));
            if (fileArray.length === 0) return;
        }

        if (fileArray.length === 0) return;
        
        setMediaLoading(true);
        const tempIds = fileArray.map((file, index) => `temp-${Date.now()}-${index}`);
        const tempMediaItems = tempIds.map(id => ({
            id, type: 'skeleton', isLoading: true
        }));
        
        setMediaFiles(prev => [...prev, ...tempMediaItems]);

        try {
            const mapped = await Promise.all(
                fileArray.map(async (file, index) => {
                    const type = file.type.startsWith("video") ? "video" : "image";
                    const url = URL.createObjectURL(file);
                    
                    if (type === "video") {
                        let thumbnail;
                        try {
                            thumbnail = await getVideoThumbnail(file);
                        } catch {
                            thumbnail = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                        }
                        return { 
                            id: `${file.name}-${file.lastModified}-${Math.random()}`, 
                            type, file, url, thumbnail, isFromDatabase: false
                        };
                    } else {
                        return { 
                            id: `${file.name}-${file.lastModified}-${Math.random()}`, type, file, url, isFromDatabase: false
                        };
                    }
                })
            );

            setMediaFiles(prev => {
                const filteredMedia = prev.filter(item => !tempIds.includes(item.id));
                return [...filteredMedia, ...mapped];
            });
            
            // Clear the file inputs after processing
            if (photoInputRef.current) photoInputRef.current.value = '';
            if (videoInputRef.current) videoInputRef.current.value = '';
            
        } catch (error) {
            console.error("Error processing files:", error);
            toast.error("Failed to process media files", {
                position: 'top-center',
                autoClose: 5000,
            });
            setMediaFiles(prev => prev.filter(item => !tempIds.includes(item.id)));
        } finally {
            setMediaLoading(false);
        }
    };

    // Skeleton component for media preview
    const MediaSkeleton = () => (
        <div className="position-relative" style={{ width: 120, height: 90 }}>
            <div className="skeleton-media-preview rounded">
                <div className="skeleton-media-content"></div>
            </div>
        </div>
    );

    const handlePhotoChange = (e) => {
        if (e.target.files?.length) handleFiles(e.target.files);
    };

    const handleVideoChange = (e) => {
        if (e.target.files?.length) handleFiles(e.target.files);
    };

    const removeMedia = (id) => {
        setMediaFiles(prev => {
            const target = prev.find(m => m.id === id);
            if (target && target.url && !target.isFromDatabase) {
                URL.revokeObjectURL(target.url);
            }
            return prev.filter(m => m.id !== id);
        });
        setExistingMediaFiles(prev => prev.filter(m => m.id !== id));

        // Cleanup loading state
        if (mediaLoading[id]) {
            const updatedLoading = { ...mediaLoading };
            delete updatedLoading[id];
            setMediaLoading(updatedLoading);
        }
    };

    // Filter media based on global selection
    const getFilteredMedia = () => {
        if (globalMediaType) {
            return mediaFiles.filter(m => m.type === globalMediaType);
        }
        return mediaFiles;
    };

    // DnD handlers
    const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
    const onDrop = (e) => {
        e.preventDefault(); setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files?.length) handleFiles(files);
    };

    useEffect(() => {
        const userInfoData = JSON.parse(localStorage.getItem("userinfo"));
        if (userInfoData?.socialData) {
            const connectedSocial = userInfoData.socialData.filter(s => s.status === "Connected");
            const platformMap = {};
            connectedSocial.forEach(social => {
                (social.socialPage || []).filter(p => p.status === "Connected").forEach(p => {
                    const key = (p.page_platform || "unknown").toLowerCase();
                    if (!platformMap[key]) {
                        platformMap[key] = {
                            id: key,
                            name: p.page_platform || "Unknown",
                            followers: 0,
                            pages: [],
                            selected: false,
                        };
                    }
                    const followersCount = parseInt(p.total_followers, 10) || 0;
                    platformMap[key].followers += followersCount;

                    platformMap[key].pages.push({
                        id: p.pageId,
                        name: p.pageName,
                        type: "Business",
                        image: p.page_picture,
                        followers: followersCount || "0",
                        social_userid: p.social_userid,     // 🔑 needed for save/publish
                        page_platform: (p.page_platform || "").toLowerCase(),
                        status: p.status,
                    });
                });
            });

            setPlatforms(Object.values(platformMap));       // normalized list
            // setPagesList(connectedSocial);                  // you still use this elsewhere
        }
    }, []);

    // Update useEffect to detect mixed media globally
    useEffect(() => {
        const hasImages = mediaFiles.some(m => m.type === 'image');
        const hasVideos = mediaFiles.some(m => m.type === 'video');
        const mixed = hasImages && hasVideos;
        
        setHasMixedMediaGlobal(mixed);
        
        // If mixed media and no global selection, show modal
        if (mixed && !globalMediaType) {
            setGlobalMediaChoiceOpen(true);
        } else if (!mixed) {
            // Reset if conflict is resolved
            setGlobalMediaType(null);
        }
    }, [mediaFiles, globalMediaType]);

    // Function to process database media files
    const processDatabaseMedia = async (postMedia) => {
        const processedFiles = [];
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        if (!postMedia) return processedFiles;

        // CASE 1: If it's a string and starts with 'http'
        if (typeof postMedia === 'string') {
            if (postMedia.startsWith('http')) {
                processedFiles.push({
                    id: `db-${Date.now()}-${Math.random()}`,
                    type: "image", // assume image
                    url: postMedia,
                    isFromDatabase: true,
                });
            } else {
                console.warn("Invalid single media string:", postMedia);
            }
            return processedFiles;
        }

        // CASE 2: If it's an array of local files
        if (Array.isArray(postMedia)) {
            for (const media of postMedia) {
                try {
                    const mediaUrl = `${BACKEND_URL}${media.path}`;

                    // Optional: Verify that the file exists
                    const response = await fetch(mediaUrl, { method: 'HEAD' });
                    if (!response.ok) {
                        console.warn(`File not found: ${mediaUrl}`);
                        continue;
                    }

                    processedFiles.push({
                        id: `${media.file || 'db'}-${Date.now()}-${Math.random()}`, // unique ID
                        type: media.type,
                        url: mediaUrl,
                        isFromDatabase: true,
                        originalName: media.originalname || media.file || 'unknown',
                    });
                } catch (error) {
                    console.warn(`Error loading file: ${media.path}`, error);
                }
            }
        }
        return processedFiles;
    };

    useEffect(() => {
        const fetchPostDetails = async () => {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const authToken = localStorage.getItem('authToken');
            const userUUID = localStorage.getItem('userinfo') 
                ? JSON.parse(localStorage.getItem('userinfo')).userData.uuid 
                : null;

            setPageLoading(true);
            if (!authToken || !formId || !userUUID) {
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
                    body: JSON.stringify({ formId, userUUID }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                if (data?.postDetails?.length) {
                    // Save all posts (multi-page/platform) in state
                    setPostDetailData(data.postDetails);

                    // Example: prefill editor with content of the first post
                    const firstPost = data.postDetails[0];
                    setPostContent(firstPost.content);

                    // Handle media if exists
                    if (firstPost.post_media) {
                        try {
                            const postMedia = JSON.parse(firstPost.post_media);
                            const processedMedia = await processDatabaseMedia(postMedia);
                            setExistingMediaFiles(processedMedia);
                            setMediaFiles(processedMedia);
                        } catch (error) {
                            console.error('Error parsing post media:', error);
                        }
                    }

                    // Handle scheduled time if any (all posts in form share the same)
                    if (firstPost.status === '2' && firstPost.schedule_time) {
                        const scheduleTimestamp = firstPost.schedule_time * 1000;
                        const date = new Date(scheduleTimestamp);
                        setScheduleDate(date.toISOString().split('T')[0]);
                        setScheduleTime(date.toTimeString().slice(0, 5));
                        // setScheduleLater(true);
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
    }, [formId]);

    useEffect(() => {
        if (postDetailData && postDetailData.length > 0) {
            // Assuming the first record holds the schedule info
            const firstPost = postDetailData[0];

            if (firstPost.schedule_date) {
            // Format date as YYYY-MM-DD for input[type="date"]
            const formattedDate = new Date(firstPost.schedule_date).toISOString().split('T')[0];
                setScheduleDate(formattedDate);
            }

            if (firstPost.schedule_time) {
                // Ensure HH:mm format for input[type="time"]
                const formattedTime = firstPost.schedule_time.slice(0, 5);
                setScheduleTime(formattedTime);
            }
        }
    }, [postDetailData]);


    useEffect(() => {
        if (!platforms?.length || !postDetailData || !postDetailData.length) return;
        if (platformsInitRef.current && lastFormIdRef.current === formId) return;

        // normalize page ids from postDetailData -> Set of strings
        const extractPageId = (p) => (p.page_id ?? p.pageId ?? p.pageIdNumber ?? p.pageIdString);
        const selectedPageIds = new Set(
            postDetailData.map(p => String(extractPageId(p))).filter(Boolean)
        );

        // update platforms: mark selected if any of its pages are in selectedPageIds
        const updatedPlatforms = platforms.map(pl => {
            const hasCheckedPage = Array.isArray(pl.pages) && pl.pages.some(pg => selectedPageIds.has(String(pg.id)));
            return { ...pl, selected: hasCheckedPage };
        });
        setPlatforms(updatedPlatforms);

        // build checkedPages array from platform pages that are present in postDetailData
        const newCheckedPages = [];
        platforms.forEach(pl => {
            if (!Array.isArray(pl.pages)) return;
            pl.pages.forEach(pg => {
                if (selectedPageIds.has(String(pg.id))) {
                    newCheckedPages.push({
                        id: pg.id,
                        name: pg.name,
                        page_platform: pg.page_platform,
                        pageSocialUser: pg.social_userid || pg.pageSocialUser || pg.socialUser,
                    });
                }
            });
        });
        setCheckedPages(newCheckedPages);
        platformsInitRef.current = true;
        lastFormIdRef.current = formId;
    }, [postDetailData, platforms, formId]);

    const handleContentChange = (e) => {
        setPostContent(e.target.value);
        setSelectionStart(e.target.selectionStart);
        setSelectionEnd(e.target.selectionEnd);
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

    // Post update functions starts here
    const clickPostNow = async () => {
        if (!postContent.trim()) {
            toast.error('Post content is required.', { position: 'top-center' });
            return;
        }

        if (!checkedPages || checkedPages.length === 0) {
            toast.error('Please select at least one platform/page.', { position: 'top-center' });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('form_id', postDetailData.form_id);
            formData.append('content', postContent);
            formData.append('status', "1"); // Published
            formData.append('type', "publish_now");

            // Append existing media filenames
            formData.append('existingMedia', JSON.stringify(existingMediaFiles.map(m => m.originalName)));

            // Append new media files
            mediaFiles
                .filter(file => !file.isFromDatabase)
                .forEach(file => {
                    formData.append("upload_img[]", file.file, file.file.name);
                });

            // Append selected pages
            formData.append('pages', JSON.stringify(checkedPages));

            await updatePostDB(formData);

            toast.success('Post published successfully!', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        } catch (error) {
            console.error(error);
            toast.error('Error publishing the post.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const clickPostUpdate = async () => {
        if (!postContent.trim()) {
            toast.error('Post content is required.', { position: 'top-center' });
            return;
        }

        setLoading(true);

        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${BACKEND_URL}/api/update-published-posts`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postID: postDetailData.id,
                    form_id: postDetailData.form_id,
                    content: postContent,
                    pageAccessToken: postDetailData.pageData.token,
                    postPlatform: postDetailData.post_platform,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            toast.success('Published post updated successfully!', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });

            return data;
        } catch (error) {
            console.error('Error updating published post:', error);
            toast.error('Error updating the published post.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const clickPostDraft = async () => {
        if (!postContent.trim()) {
            toast.error('Post content is required.', { position: 'top-center' });
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('content', postContent);
        formData.append('status', "0"); // Draft
        formData.append('existingMedia', JSON.stringify(existingMediaFiles.map(m => m.originalName)));

        // Append new media files
        mediaFiles
            .filter(m => !m.isFromDatabase)
            .forEach(file => {
                formData.append("upload_img[]", file.file, file.file.name);
            });

        // Append selected pages
        formData.append('pages', JSON.stringify(checkedPages));

        try {
            await updatePostDB(formData);
        } finally {
            setLoading(false);
        }
    };

    const clickPostSchedule = async () => {
        if (!validateSchedule()) return;

        const scheduleTimestamp = Math.floor(new Date(`${scheduleDate}T${scheduleTime}`).getTime() / 1000);

        const formData = new FormData();
        formData.append('content', postContent);
        formData.append('status', "2"); // Scheduled
        formData.append('schedule_time', scheduleTimestamp);
        formData.append('existingMedia', JSON.stringify(existingMediaFiles.map(m => m.originalName)));

        mediaFiles.filter(m => !m.isFromDatabase).forEach(file => {
            formData.append("upload_img[]", file.file, file.file.name);
        });

        formData.append('pages', JSON.stringify(checkedPages));

        await updatePostDB(formData);
    };

    const updatePostDB = async (formData) => {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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

            toast.success('Post updated successfully.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });

            return data;
        } catch (error) {
            console.error('Error updating post:', error);
            toast.error('Error updating the post.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            throw error;
        }
    };
    // Post update functions ends here

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case "facebook":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7 a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                );
            case "linkedin":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                );
            case "instagram":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                );
            case "twitter":
            case "x":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.51 2-4.51 4.5 0 .35.04.7.11 1.03A12.94 12.94 0 0 1 3.15 1.64a4.48 4.48 0 0 0-.61 2.27c0 1.57.8 2.96 2.02 3.77a4.48 4.48 0 0 1-2.05-.56v.05c0 2.2 1.56 4.03 3.63 4.45a4.48 4.48 0 0 1-2.04.08c.58 1.8 2.26 3.11 4.26 3.15A9.06 9.06 0 0 1 0 19.54a12.78 12.78 0 0 0 6.92 2.03c8.3 0 12.85-6.87 12.85-12.83 0-.2 0-.39-.01-.58A9.19 9.19 0 0 0 23 3z"></path>
                    </svg>
                );
            case "youtube":
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.97C18.88 4 12 4 12 4s-6.88 0-8.6.45A2.78 2.78 0 0 0 1.46 6.42 29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 1.97C5.12 20 12 20 12 20s6.88 0 8.6-.45a2.78 2.78 0 0 0 1.94-1.97A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z"></path>
                        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
                    </svg>
                );
            default:
                return null;
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform?.toLowerCase()) {
            case 'facebook':
                return 'linear-gradient(135deg, #2563EB, #1E40AF)';
            case 'linkedin':
                return 'linear-gradient(135deg, #2563EB, #1E40AF)';
            case 'instagram':
                return 'linear-gradient(135deg, #C13584, #E1306C)';
            case 'twitter':
            case 'x':
                return 'linear-gradient(135deg, #60A5FA, #2563EB)';
            case 'youtube':
                return 'linear-gradient(135deg, #EF4444, #B91C1C)';
            case 'tiktok':
                return 'linear-gradient(135deg, #000000, #FF0050)';
            default:
                return 'linear-gradient(135deg, #6B7280, #374151)';
        }
    };

    function capitalizeFirstLetter(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const setBestTime = (label) => {
        // label like: "9:00 AM", "1:00 PM", "7:30 PM"
        const [time, meridiem] = label.split(' ');
        let [h, m] = time.split(':').map(Number);
        const isPM = meridiem?.toUpperCase() === 'PM';
        if (isPM && h !== 12) h += 12;
        if (!isPM && h === 12) h = 0;
        const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        setScheduleTime(v);
        const el = document.getElementById('scheduleTime');
        if (el) el.value = v; // keep your existing DOM-read code happy
    };

    const validateSchedule = () => {
        if (!scheduleDate || !scheduleTime) {
            alert('Please select both date and time to schedule the post.');
            return false;
        }
        const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduleDateTime <= new Date()) {
            alert('Schedule date and time must be in the future.');
            return false;
        }
        return true;
    };

    useEffect(() => {
        if (postDetailData && postDetailData.length > 0) {
            setPlatforms(prev =>
                prev.map(p => {
                    // check if this platform has any posts
                    const hasPost = postDetailData.some( pd => pd.post_platform === p.id );
                    if (hasPost) {
                        // gather all pageIds for this platform from postDetailData
                        const checkedPages = postDetailData.filter(pd => pd.post_platform === p.id).map(pd => pd.page_id);

                        // ✅ mark platform as selected + pre-check pages
                        setSelectedPlatforms(prevPages => [
                            ...new Set([...prevPages, ...checkedPages])
                        ]);

                        setCheckedPages(prevChecked => [
                            ...prevChecked,
                            ...p.pages.filter(pg => checkedPages.includes(pg.id))
                        ]);
                        return { ...p, selected: true };
                    }
                    return p;
                })
            );
        }
    }, [postDetailData]);

    const togglePlatform = (id) => {
        setPlatforms(prev => {
            return prev.map(p => {
                if (p.id === id) {
                    const newSelectedState = !p.selected;
                    // If unselecting a platform, remove all its pages from selection
                    if (!newSelectedState) {
                        const platformPages = p.pages.map(page => page.id);
                        // Remove pages from selectedPlatforms state
                        setSelectedPlatforms(prevPages => 
                            prevPages.filter(pageId => !platformPages.includes(pageId))
                        );
                        // Remove pages from checkedPages state (payload)
                        setCheckedPages(prevChecked => 
                            prevChecked.filter(page => !platformPages.includes(page.id))
                        );
                    }
                    return { ...p, selected: newSelectedState };
                }
                return p;
            });
        });
    };

    const togglePageSelection = (page) => {
        // 1) Maintain the highlight state (IDs)
        setSelectedPlatforms(prev =>
            prev.includes(page.id) ? prev.filter(id => id !== page.id) : [...prev, page.id]
        );

        // 2) Maintain the payload/preview state (objects)
        setCheckedPages(prev => {
            const exists = prev.some(p => p.id === page.id);
            if (exists) {
                return prev.filter(p => p.id !== page.id);
            }
            return [
                ...prev,
                {
                    id: page.id,
                    pageSocialUser: page.social_userid,
                    name: page.name,
                    image: page.image,
                    page_platform: page.page_platform || (page.type || "").toLowerCase(),
                    status: page.status || "Connected",
                },
            ];
        });
    };

    const getVideoThumbnail = (file) => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            const fileURL = URL.createObjectURL(file);
            video.src = fileURL;
            video.preload = "metadata";
            video.muted = true;
            video.onloadedmetadata = () => {
                video.currentTime = Math.min(1, video.duration / 2);
            };

            video.onseeked = () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL("image/png");
                URL.revokeObjectURL(fileURL);
                resolve(imageUrl);
            };
            video.onerror = (e) => reject("Error generating thumbnail: " + e);
        });
    };

    // Media preview renderer based on platform
    const renderMediaPreview = (platform = "", mediaToUse = null) => {
        const filteredMedia = mediaToUse || getFilteredMedia();
        if (filteredMedia.length === 0) return null;

        // ---------- Instagram ----------
        if (platform === "instagram") {
            return (
                <Carousel responsive={carouselResponsive} showDots infinite={true} arrows={false} >
                    {filteredMedia.map((m) => (
                        <div key={m.id} className="position-relative" style={{ aspectRatio: "1 / 1" }} >
                            {m.type === "image" ? (
                                <img src={m.url} alt="insta-img" className="w-100" style={{ height: "300px", objectFit: "cover"}} 
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                            ) : (
                                <video src={m.url} className="w-100" style={{ height: "300px", objectFit: "cover", objectPosition: "center" }} autoPlay loop muted playsInline />
                            )}
                        </div>
                    ))}
                </Carousel>
            );
        }

        // ---------- Facebook && LinkedIn----------
        if (platform === "facebook" || platform === "linkedin") {
            const boxSize = "200px"; // static square size

            // 1 media
            if (filteredMedia.length === 1) {
                const m = filteredMedia[0];
                return m.type === "video" ? (
                    <div className="position-relative w-100 h-100">
                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                    </div>
                ) : (
                    <img src={m.url} className="w-100 h-100" alt="facebook-img" style={{ objectFit: "cover", objectPosition: "center" }} 
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                );
            }

            // 2 media → up and down
            if (filteredMedia.length === 2) {
                return (
                    <div className="d-flex flex-column gap-1">
                        {filteredMedia.map((m) => (
                            <div key={m.id} className="flex-fill position-relative" style={{ height: boxSize, width:"100%" }} >
                                {m.type === "video" ? (
                                    <div className="position-relative w-100 h-100">
                                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                    </div>
                                ) : (
                                    <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                )}
                            </div>
                        ))}
                    </div>
                );
            }

            // 3 media → 2 in a column & 2 in row of second column
            if (filteredMedia.length === 3) {
                return (
                    <div className="d-flex flex-column gap-1" style={{ height: boxSize * 2 }}>
                        {/* First row - single image */}
                        <div className="position-relative" style={{ height: boxSize }}>
                            {filteredMedia[0].type === "video" ? (
                                <div className="position-relative w-100 h-100">
                                    <img src={filteredMedia[0].thumbnail} alt="Video thumbnail" className="w-100 h-100" 
                                        style={{ objectFit: "cover", objectPosition: "center" }} 
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                </div>
                            ) : (
                                <img src={filteredMedia[0].url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                            )}
                        </div>
                        {/* Second row - two images side by side */}
                        <div className="row g-1" style={{ height: "auto" }}>
                            {filteredMedia.slice(1, 3).map((m) => (
                                <div key={m.id} className="col-6 position-relative">
                                    {m.type === "video" ? (
                                        <div className="position-relative w-100 h-100">
                                            <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" 
                                                style={{ objectFit: "cover", objectPosition: "center" }} 
                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                            <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                        </div>
                                    ) : (
                                        <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // 4 media → 2 in a column & 3 in row of second column
            if (filteredMedia.length === 4) {
                return (
                    <div className="d-flex flex-column gap-1" style={{ height: boxSize * 2 }}>
                        {/* First row - single image */}
                        <div className="position-relative" style={{ height: boxSize }}>
                            {filteredMedia[0].type === "video" ? (
                                <div className="position-relative w-100 h-100">
                                    <img src={filteredMedia[0].thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                </div>
                            ) : (
                                <img src={filteredMedia[0].url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                            )}
                        </div>
                        {/* Second row - three images side by side */}
                        <div className="row g-1" style={{ height: boxSize }}>
                            {filteredMedia.slice(1, 4).map((m) => (
                                <div key={m.id} className="col-4 position-relative" style={{ height: "100%" }}>
                                    {m.type === "video" ? (
                                        <div className="position-relative w-100 h-100">
                                            <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                            <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                        </div>
                                    ) : (
                                        <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            // 5+ media → First column: 2 square images, Second column: 3 stacked images
            return (
                <div className="row g-1">
                    {/* First column - 2 square images */}
                    <div className="col-6 d-flex flex-column gap-1">
                        {filteredMedia.slice(0, 2).map((m) => (
                            <div key={m.id} className="ratio ratio-1x1 position-relative">
                                {m.type === "video" ? (
                                    <div className="position-relative w-100 h-100">
                                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                    </div>
                                ) : (
                                    <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Second column - 3 stacked images */}
                    <div className="col-6 d-flex flex-column gap-1">
                        {filteredMedia.slice(2, 5).map((m, idx) => (
                            <div key={m.id} className="flex-fill position-relative" style={{ minHeight: 0 }}>
                                {m.type === "video" ? (
                                    <div className="position-relative w-100 h-100">
                                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                    </div>
                                ) : (
                                    <img src={m.url} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                )}

                                {/* Show +X overlay on the last item if more than 5 */}
                                {idx === 2 && filteredMedia.length > 5 && (
                                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                                        style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "white", fontSize: "2rem", fontWeight: "bold", }} >
                                            +{filteredMedia.length - 5}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            );
        }
        return null;
    };

    const livePreviewData = useMemo(() => {
        // If no selections and no DB data, show empty
        if ((!checkedPages || checkedPages.length === 0) && (!postDetailData || postDetailData.length === 0)) {
            return [];
        }

        const combined = [];

        // 1. Include DB pages **only if platform is still active AND at least one page is checked**
        if (postDetailData && postDetailData.length > 0) {
            postDetailData.forEach(post => {
                const platformStillSelected = platforms.some(
                    p => p.id === post.post_platform && p.selected
                );

                // ✅ Add DB page only if platform is selected
                if (platformStillSelected) {
                    const isPageSelected = checkedPages.some(pg => pg.id === post.pageData.pageId);

                    // If at least one page is selected for this platform, show DB pages
                    if (isPageSelected) {
                        combined.push(post);
                    }
                }
            });
        }

        // 2. Add pages from currently checked selections
        if (checkedPages && checkedPages.length > 0) {
            checkedPages.forEach(pg => {
                combined.push({
                    post_platform: pg.page_platform,
                    pageData: {
                        pageId: pg.id,
                        pageName: pg.name,
                        page_picture: pg.image || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`,
                    },
                });
            });
        }

        // 3. Deduplicate by platform + pageId
        const uniqueMap = new Map();
        combined.forEach(item => {
            const key = `${item.post_platform}-${item.pageData.pageId}`;
            uniqueMap.set(key, item);
        });

        return Array.from(uniqueMap.values());
    }, [postDetailData, checkedPages, platforms]);

    const isDraftDisabled   = isContentEmpty || livePreviewData.length === 0;
    const isPublishDisabled = isContentEmpty || livePreviewData.length === 0;
    const isScheduleDisabled = isContentEmpty || !scheduleDate || !scheduleTime || livePreviewData.length === 0;

    return (
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title p-0">
                            <div className="row">
                                <div className="col-sm-6">
                                    <h1 className="fw-bolder">Edit Post</h1>
                                    <span className="mt-2">Update your post content and scheduling</span>
                                </div>
                                <div className="col-sm-6">
                                    {loading ? (
                                        <div className="action-buttons">
                                            <button className="btn btn-primary" disabled={loading} >Updating &nbsp;
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="action-buttons m-0">
                                            {postDetailData?.[0]?.status === '0' && (
                                                <>
                                                    <button type="button" onClick={clickPostDraft} disabled={isDraftDisabled} className="custom-light-btn">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save h-4 w-4 mr-2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                                                        Update Draft
                                                    </button>
                                                    <button type="button" onClick={clickPostSchedule} disabled={isScheduleDisabled} className="custom-light-btn"> 
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-calendar h-4 w-4 mr-2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                                                        Schedule
                                                    </button>
                                                    <button type="submit" className="custom-primary-btn" onClick={clickPostNow} disabled={isPublishDisabled}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-send h-4 w-4 mr-2"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                                                        Publish Now
                                                    </button>
                                                </>
                                            )}
                                            {postDetailData?.[0]?.status === '1' && (
                                                <button type="submit" className="custom-primary-btn" onClick={clickPostUpdate} disabled={isPublishDisabled}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save h-4 w-4 mr-2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                                                    Update Post
                                                </button>
                                            )}
                                            {postDetailData?.[0]?.status === '2' && (
                                                <>
                                                    <button type="button" onClick={clickPostDraft} disabled={isDraftDisabled} className="custom-light-btn">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-save h-4 w-4 mr-2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                                                        Save Draft
                                                    </button>
                                                    <button type="button" onClick={clickPostSchedule} disabled={isScheduleDisabled} className="custom-light-btn"> 
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-calendar h-4 w-4 mr-2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                                                        Update Schedule
                                                    </button>
                                                    <button type="submit" className="custom-primary-btn" onClick={clickPostNow} disabled={isPublishDisabled}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-send h-4 w-4 mr-2"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                                                        Publish Now
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
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
                                        <div className="col-md-8">
                                            <div className="card">
                                                <div className="card-body">
                                                    <div className="sidebar-body">
                                                        <div className="row g-3 common-form">
                                                            <div className="col-md-12 d-flex align-items-center justify-content-between">
                                                                <h3 className="fw-bold text-dark">Post Content</h3>
                                                                <button type="button" className='custom-light-btn'>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path></svg>
                                                                    AI Assist
                                                                </button>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <h2 className="section-title text-dark">Write your post</h2>
                                                                    <span className="badge ms-2">
                                                                        {postDetailData?.[0]?.status === '0' && <span className="text-danger">Draft</span>}
                                                                        {postDetailData?.[0]?.status === '1' && <span className="text-success">Posted</span>}
                                                                        {postDetailData?.[0]?.status === '2' && <span className="text-info">Scheduled</span>}
                                                                    </span>
                                                                </div>
                                                                
                                                                <textarea ref={textareaRef} className="form-control" rows={6} id="postContent"
                                                                    placeholder="What's happening? Share your thoughts..." value={postContent} 
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
                                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                                    <div className="character-count"><span id="char-count">{postContent.length}</span>/{maxCharacters} characters</div>
                                                                    <span className="text-muted"> Recommended: 200-700 characters for best engagement </span>
                                                                </div>
                                                            </div>

                                                            {postDetailData?.[0]?.status !== '1' && 
                                                                <div className="col-md-12">
                                                                    <div className="upload-container">
                                                                        <div className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                                                                            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                                                                            <div className="upload-content">
                                                                                {mediaLoading && (
                                                                                    <div className="media-loading-overlay">
                                                                                        <div className="spinner-border text-primary" role="status">
                                                                                            <span className="sr-only">Loading...</span>
                                                                                        </div>
                                                                                        <p>Processing media files...</p>
                                                                                    </div>
                                                                                )}
                                                                                <div className="upload-buttons">
                                                                                    <button className="upload-btn-custom" onClick={() => document.getElementById('photo-upload').click()}>
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="btn-icon">
                                                                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                                                                            <circle cx="9" cy="9" r="2"></circle>
                                                                                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                                                                        </svg>
                                                                                        Photo
                                                                                    </button>
                                                                                    <button className="upload-btn-custom" onClick={() => document.getElementById('video-upload').click()}>
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="btn-icon">
                                                                                            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
                                                                                            <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                                                                                        </svg>
                                                                                        Video
                                                                                    </button>
                                                                                </div>
                                                                                
                                                                                {/* Media preview grid */}
                                                                                {mediaFiles.length > 0 ? (
                                                                                    <div className="mt-3 d-flex flex-wrap gap-2">
                                                                                        {getFilteredMedia().map(m => (
                                                                                            m.type === 'skeleton' ? (
                                                                                                <MediaSkeleton key={m.id} />
                                                                                            ) : (
                                                                                                <div key={m.id} className="position-relative" style={{ width: 120 }}>
                                                                                                    {m.type === 'image' ? (
                                                                                                        <img src={m.url} alt="" className="img-fluid rounded" style={{ height: 90, width: 120, objectFit: 'cover' }} 
                                                                                                            onError={(e) => {
                                                                                                                e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                                                                            }}
                                                                                                        />
                                                                                                    ) : (
                                                                                                        <video src={m.url} controls style={{ height: 90, width: 120, objectFit: 'cover' }} />
                                                                                                    )}
                                                                                                    <button type="button" className="rounded-circle btn-danger text-light position-absolute top-0 end-0 m-1"
                                                                                                        onClick={(e) => { e.stopPropagation(); removeMedia(m.id); }}> × </button>
                                                                                                    {/* {m.isFromDatabase && (
                                                                                                        <div className="position-absolute top-0 start-0 m-1">
                                                                                                            <span className="badge bg-info" style={{ fontSize: '8px' }}>DB</span>
                                                                                                        </div>
                                                                                                    )} */}
                                                                                                </div>
                                                                                            )
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="mt-3">
                                                                                        <span className="text-muted"> Drag and drop media files or click to upload </span>
                                                                                    </div>
                                                                                )}

                                                                            </div>
                                                                            <input id="photo-upload" type="file" accept="image/*" multiple className="d-none" onChange={handlePhotoChange} />
                                                                            <input id="video-upload" type="file" accept="video/*" className="d-none" onChange={handleVideoChange} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            }

                                                            <div className="col-md-12">
                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                    <div className="d-flex align-items-center">
                                                                        <div className="d-flex me-2">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-hash h-5 w-5 text-gray-700 dark:text-gray-300"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
                                                                        </div>
                                                                        <h6 className="card-title mb-0">AI Suggested Hashtags</h6>
                                                                        <span className="badge ai-badge rounded-pill ms-2 d-flex align-items-center gap-1">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-sparkles h-3 w-3 mr-1"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                                                                            AI Generated
                                                                        </span>
                                                                    </div>
                                                                    <button className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center" onClick={handleHashtagWebhook} disabled={hashTagLoader || !postContent.trim()}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-refresh-cw h-3 w-3 mr-1"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
                                                                        <span className="ms-2">{hashTagLoader ? 'Generating…' : 'Refresh'}</span>
                                                                    </button>
                                                                </div>

                                                                <div className="container-bg p-3 rounded-3 mb-3">
                                                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                                                        {(hashTags?.length ? hashTags : []).map(tag => (
                                                                                <span key={tag} className="badge hashtag-badge rounded-pill px-3 py-1" 
                                                                                    onClick={() => handleHashtagClick(tag)} style={{ cursor: 'pointer' }} >
                                                                                    {tag}
                                                                                </span>
                                                                            ))
                                                                        }
                                                                    </div>

                                                                    <div className="border-top border-top-custom pt-3">
                                                                        <label className="text-label mb-3">Add Custom Hashtags</label>
                                                                        <div className="d-flex gap-2 mb-2">
                                                                            <input type="text" className="form-control form-control-sm custom-input rounded-3" placeholder="Type hashtag and press Enter..."
                                                                                id="new-task" value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()} />
                                                                            <button className="custom-success-btn w-25" id="add-task" onClick={handleAddCustomTag}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus h-3 w-3 mr-1"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                                                                                <span className="">Add to Post</span>
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-muted text-muted-custom mb-0 small">Hashtags will be added directly to your post content above</p>
                                                                    </div>

                                                                    <div className="border-top border-top-custom pt-3 mt-3">
                                                                        <p className="text-muted text-muted-custom text-center small mb-0">💡 Start typing your post content to get personalized hashtag recommendations powered by AI</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="col-md-12 px-3">
                                                                <div className="mb-4">
                                                                    {platforms.length > 0 ? (
                                                                        <>
                                                                            <label className="form-label fw-medium">Select platforms to publish</label>
                                                                            <div className="row g-3 mt-2">
                                                                                {platforms.map(platform => {
                                                                                    // console.log("platforms:", platform);
                                                                                    // console.log("postDetailData:", postDetailData);
                                                                                    return (
                                                                                        <div key={platform.id} className="col-md-6 col-lg-4">
                                                                                            <div className={`platform-select-card ${platform.selected ? 'selected' : ''}`}
                                                                                                    style={{ cursor: 'pointer' }} onClick={() => togglePlatform(platform.id)} >
                                                                                                <div className="d-flex align-items-center">
                                                                                                    <div className={`platform-icon-custom me-3 mb-0`} style={{ background: getPlatformColor(platform.name)}} >
                                                                                                        {getPlatformIcon(platform.name)}
                                                                                                    </div>
                                                                                                    <div className="flex-grow-1">
                                                                                                        <h6 className="mb-0">{capitalizeFirstLetter(platform.name)}</h6>
                                                                                                        <small className="text-muted">{platform.followers} followers</small>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="position-absolute top-0 end-0 m-3">
                                                                                                    <div className={`custom-checkbox ${platform.selected ? 'checked' : ''}`}>
                                                                                                        {platform.selected && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg>}
                                                                                                    </div>
                                                                                                </div>
                                                                                                
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="h5 text-danger">No connected platforms. Please connect your social accounts.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {selectedCount > 0 ? (
                                                                <div className="col-md-12 px-3">
                                                                    <div className="pages-container">
                                                                        <div className="mb-4">
                                                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                                                <label className="form-label mb-0">Select pages/accounts to post to</label>
                                                                                <span className="card-time fw-bold p-1 text-orange-medium rounded"><small>Select pages to publish</small></span>
                                                                            </div>
                                                                            {platforms.filter(p => p.selected).length > 0 ? (
                                                                                platforms.filter(p => p.selected).map(platform => (
                                                                                    <div key={platform.id} className="mb-4">
                                                                                        <div className="d-flex align-items-center mb-2">
                                                                                            <div className={`me-3 mb-0 p-1 d-flex align-items-center justify-content-center rounded`} 
                                                                                                style={{ background: getPlatformColor(platform.name), width: '20px', height: '20px',
                                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', }} >
                                                                                                {getPlatformIcon(platform.name)}
                                                                                            </div>
                                                                                            <h5 className="mb-0 fs-6">{capitalizeFirstLetter(platform.name)} Pages</h5>
                                                                                        </div>

                                                                                        <div className="ms-4 row row-cols-1 g-2">
                                                                                            {platform.pages.length > 0 ? (
                                                                                                platform.pages.map(page => (
                                                                                                <div key={page.id} className={`page-card card p-3 rounded platform-select-card addPlatform-card ${
                                                                                                    selectedPlatforms.includes(page.id) ? "selected" : "" }`} onClick={() => togglePageSelection(page)}
                                                                                                >
                                                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                                                        <div className="d-flex align-items-center gap-3">
                                                                                                            <img src={page.image} alt="pageProfileImg" className="img-fluid rounded-circle"
                                                                                                                style={{ width: '40px', height: '40px', border: "1px solid lightgray"}}
                                                                                                                onError={(e) => {
                                                                                                                    e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                                                                                }}
                                                                                                            />
                                                                                                            <div>
                                                                                                                <h6 className="mb-1">{page.name}</h6>
                                                                                                                <div className="d-flex align-items-center gap-2">
                                                                                                                    <span className="badge bg-light text-dark">{page.type}</span>
                                                                                                                    <small className="text-muted">{page.followers} followers</small>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div> 
                                                                                                        <input type="checkbox" className="form-check-input" checked={selectedPlatforms.includes(page.id)} readOnly />
                                                                                                    </div>
                                                                                                </div>
                                                                                                ))
                                                                                            ) : (
                                                                                                <div className="text-muted">No pages available for this platform.</div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="text-muted">No platforms selected.</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div></div>
                                                            )}

                                                            {postDetailData?.[0]?.status !== '1' && (
                                                                <div className="col-md-12 px-3">
                                                                    <div className="row">
                                                                        <div className="col-md-3">
                                                                            <label className="form-label fw-medium"><small>Schedule Date</small></label>
                                                                            <input type="date" id="scheduleDate" className="form-control"
                                                                                value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="col-md-3">
                                                                            <label className="form-label fw-medium"><small>Schedule Time</small></label>
                                                                            <input type="time" id="scheduleTime" className="form-control"
                                                                                value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                                                                            />
                                                                        </div>
                                                                        <div className="col-md-6">
                                                                            <label className="form-label fw-medium"><small>Best Time</small></label>
                                                                            <small>
                                                                                <div className="d-flex flex-wrap gap-2">
                                                                                    <button type="button" className="custom-light-btn" onClick={() => {
                                                                                        const time = "09:00";
                                                                                        setBestTime(time);
                                                                                        document.getElementById('scheduleTime').value = time;
                                                                                    }}>9:00 AM</button>
                                                                                    <button type="button" className="custom-light-btn" onClick={() => {
                                                                                        const time = "13:00";
                                                                                        setBestTime(time);
                                                                                        document.getElementById('scheduleTime').value = time;
                                                                                    }}>1:00 PM</button>
                                                                                    <button type="button" className="custom-light-btn" onClick={() => {
                                                                                        const time = "19:30";
                                                                                        setBestTime(time);
                                                                                        document.getElementById('scheduleTime').value = time;
                                                                                    }}>7:30 PM</button>
                                                                                </div>
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {postDetailData?.[0]?.status !== '1' ? (
                                                                <div className="col-md-12 px-3">
                                                                    <div className="mt-2">
                                                                        <div className="d-flex align-items-center gap-2 mb-4">
                                                                            <span style={{ color: '#9333ea' }}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className=""><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                                                                            </span>
                                                                            <h4 className="mb-0 text-dark fw-bolder">AI Insights</h4>
                                                                            {/* <span className="badge badge-purple rounded-pill px-2 py-1">
                                                                                {selectedCount} platform{selectedCount !== 1 ? 's' : ''} selected
                                                                            </span> */}
                                                                        </div>
                                                                        
                                                                        <div className="row g-4">
                                                                            <div className="col-md-4">
                                                                                <div className="card card-insight card-reach p-3 rounded-3">
                                                                                    <div className="d-flex align-items-center gap-2">
                                                                                        <span className="fw-medium text-green-medium d-flex align-items-center gap-2">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                                                            Predicted Reach
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="fs-4 fw-bold mb-0 text-green">2.4K - 3.8K</p>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="col-md-4">
                                                                                <div className="card card-insight card-engagement p-3 rounded-3">
                                                                                    <div className="d-flex align-items-center gap-2">
                                                                                        <span className="fw-medium text-blue-medium d-flex align-items-center gap-2">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                                                                                            Engagement Score
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="fs-4 fw-bold mb-0 text-blue">87%</p>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="col-md-4">
                                                                                <div className="card card-insight card-time p-3 rounded-3">
                                                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                                                        <span className="fw-medium text-orange-medium d-flex align-items-center gap-2">
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                                                            Best Time
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="fw-bold mb-0 text-orange">Today at 2:00 PM</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>  
                                                            ) : (
                                                                <div></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card">
                                                <div className="preview-container card-body">
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <h2 className="h5 fw-bolder mb-0">Post Preview</h2>
                                                    </div>
                                                    <div className="custom-preview-height">
                                                        {livePreviewData && livePreviewData.length > 0 ? (
                                                            <div className="draft-post-preview" style={{ border:"none"}}>
                                                                {livePreviewData.map((postData, index) => {
                                                                    console.log("PostData for preview:", postData);
                                                                    return (
                                                                        <div key={index} className={`${index === 0 ? '' : 'mt-4'}`}>
                                                                            <div className="platform-header d-flex align-items-center mb-2 px-2 py-1">
                                                                                <div className={`me-2 mb-0 p-1 d-flex align-items-center justify-content-center`} 
                                                                                    style={{ 
                                                                                        background: getPlatformColor(postData.post_platform),
                                                                                        width: '25px',
                                                                                        height: '25px',
                                                                                        borderRadius: '50%',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                    }} >
                                                                                    {getPlatformIcon(postData.post_platform)}
                                                                                </div>
                                                                                <h6 className="mb-0">{capitalizeFirstLetter(postData.post_platform)} Preview</h6>
                                                                            </div>
                                                                            {postData.post_platform === "facebook" && (
                                                                                <div className="fb-post border rounded bg-white">
                                                                                    <div className="d-flex align-items-center p-2">
                                                                                        <img src={postData.pageData.page_picture} alt="" className="rounded-circle me-2" width="40" height="40" 
                                                                                            onError={(e) => {
                                                                                                e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                                                            }}
                                                                                        />
                                                                                        <div>
                                                                                            <strong>{postData.pageData.pageName}</strong>
                                                                                            <div className="text-muted" style={{ fontSize: "12px" }}>Just now · <i className="fas fa-globe"></i></div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="p-2" style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                                                                                        {postContent}
                                                                                    </div>
                                                                                    <div className="preview-content" style={{ padding: "0px"}}>
                                                                                        {renderMediaPreview(postData.post_platform, getFilteredMedia())}
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-around border-top p-2 text-muted" style={{ fontSize: "13px" }}>
                                                                                        <span><i className="far fa-thumbs-up"></i> Like</span>
                                                                                        <span><i className="far fa-comment"></i> Comment</span>
                                                                                        <span><i className="fas fa-share"></i> Share</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {postData.post_platform === "linkedin" && (
                                                                                <div className="linkedin-post border rounded bg-white">
                                                                                    <div className="d-flex align-items-center p-2">
                                                                                        <img src={postData.pageData.page_picture} alt="" className="rounded-circle me-2" width="40" height="40" 
                                                                                            onError={(e) => {
                                                                                                e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                                                            }}
                                                                                        />
                                                                                        <div>
                                                                                            <strong>{postData.pageData.pageName}</strong>
                                                                                            <div className="text-muted" style={{ fontSize: "12px" }}>Just now · <i className="fas fa-globe"></i></div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="p-2" style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                                                                                        {postContent}
                                                                                    </div>
                                                                                    <div className="preview-content" style={{ padding: "0px"}}>
                                                                                        {renderMediaPreview(postData.post_platform, getFilteredMedia())}
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-around border-top p-2 text-muted" style={{ fontSize: "13px" }}>
                                                                                        <span><i className="far fa-thumbs-up"></i> Like</span>
                                                                                        <span><i className="far fa-comment"></i> Comment</span>
                                                                                        <span><i className="fas fa-share-square"></i> Repost</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {postData.post_platform === "instagram" && (
                                                                                <div className="instagram-post border rounded bg-white">
                                                                                    <div className="d-flex align-items-center p-2">
                                                                                        <img src={postData.pageData.page_picture} alt="" className="rounded-circle me-2" width="40" height="40" 
                                                                                            onError={(e) => {
                                                                                                e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                                                            }}
                                                                                        />
                                                                                        <strong>{postData.pageData.pageName}</strong>
                                                                                    </div>
                                                                                    <div className="preview-content" style={{ padding: "0px"}}>
                                                                                        {renderMediaPreview(postData.post_platform, getFilteredMedia())}
                                                                                    </div>
                                                                                    <div className="p-2" style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                                                                                        {postContent}
                                                                                    </div>
                                                                                    <div className="d-flex justify-content-around border-top p-2 text-muted" style={{ fontSize: "13px" }}>
                                                                                        <span><i className="far fa-heart"></i></span>
                                                                                        <span><i className="far fa-comment"></i></span>
                                                                                        <span><i className="far fa-paper-plane"></i></span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <SkeletonPostPreview />
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
                    {globalMediaChoiceOpen && (
                        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
                            }}
                        >
                            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                                <div className="modal-dialog modal-dialog-centered" role="document">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Choose Media Type</h5>
                                        </div>
                                        <div className="modal-body">
                                            <p className="mb-3">
                                                You've selected both images and videos. The selected platforms require only one media type per post.
                                                Please choose which one to use for this post.
                                            </p>

                                            <div className="form-check mb-2">
                                                <input id="global-choose-image" type="radio" className="form-check-input" name="globalMediaType" 
                                                    value="image" checked={globalMediaType === 'image'} onChange={() => setGlobalMediaType('image')} />
                                                <label className="form-check-label" htmlFor="global-choose-image"> 
                                                    Use Images ({mediaFiles.filter(m => m.type === 'image').length})
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <input id="global-choose-video" type="radio" className="form-check-input" name="globalMediaType" 
                                                    value="video" checked={globalMediaType === 'video'} onChange={() => setGlobalMediaType('video')} />
                                                <label className="form-check-label" htmlFor="global-choose-video"> 
                                                    Use Video ({mediaFiles.filter(m => m.type === 'video').length})
                                                </label>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button type="button" className="btn btn-primary" disabled={!globalMediaType}
                                                onClick={() => { 
                                                    setGlobalMediaChoiceOpen(false); 
                                                    if (globalMediaType) {
                                                        setMediaFiles(prev => prev.filter(m => m.type === globalMediaType));
                                                    }
                                                    // setConflictingFiles([]);
                                                }}
                                            > Apply </button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        </div>
    );
}