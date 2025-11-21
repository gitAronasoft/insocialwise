import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import EmojiPicker from 'emoji-picker-react';
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { useLocation, useNavigate } from 'react-router-dom';

export default function CreatePost() {
    const [pagesList, setPagesList] = useState([]);
    const [showPagesList, setShowPagesList] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [checkedPages, setCheckedPages] = useState([]);
    const dropdownRef = useRef(null);
    const [postContent, setPostContent] = useState('');  
    const maxCharacters = 2000;
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileUrl, setSelectedFileUrl] = useState(null);
    const [scheduleLater, setScheduleLater] = useState(false);
    const [emojiPicker, setEmojiPicker] = useState(false);    
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);
    const [hashTagLoader, setHashTagLoader] = useState(false);
    const [hashTags, setHashTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [fullScreenLoader, setFullScreenLoader] = useState(false);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const topic = location.state?.topic;

    const [selectedPages, setSelectedPages] = useState([]);
    const [platforms, setPlatforms] = useState([]);

    // scheduling state (for disable logic + “Best Time” buttons)
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // selection + content guards
    const hasPlatform = platforms.filter(p => p.selected).length > 0;
    const hasPage = checkedPages.length > 0;
    const hasSelection = hasPlatform && hasPage;
    const isContentEmpty = postContent.trim().length === 0;

    const isDraftDisabled   = !hasSelection || isContentEmpty;
    const isPublishDisabled = !hasSelection || isContentEmpty;
    const isScheduleDisabled = !hasSelection || isContentEmpty || !scheduleDate || !scheduleTime;

    const platformsRequiringMediaSelection = ['facebook', 'linkedin'];
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]); // [{id,type,file,url}]
    const [isDragOver, setIsDragOver] = useState(false);

    const [globalMediaChoiceOpen, setGlobalMediaChoiceOpen] = useState(false);
    const [globalMediaType, setGlobalMediaType] = useState(null);
    const [hasMixedMediaGlobal, setHasMixedMediaGlobal] = useState(false);
    const mediaCounts = React.useMemo(() => {
        const images = mediaFiles.filter(m => m.type === 'image').length;
        const videos = mediaFiles.filter(m => m.type === 'video').length;
        return { images, videos };
    }, [mediaFiles]);

    const [conflictingFiles, setConflictingFiles] = useState([]);

    const hasMixedMedia = mediaCounts.images > 0 && mediaCounts.videos > 0;
    const carouselResponsive = {
        desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
        tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
        mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
    };

    const [showAIAssist, setShowAIAssist] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);

    const [showAIQuestionnaire, setShowAIQuestionnaire] = useState(false);
    const [aiFormData, setAiFormData] = useState({
        topic: "",
        industry: "",
        objective: "",
        tone: "",
        audience: "",
    });

    const [showAIImagePopup, setShowAIImagePopup] = useState(false);
    const [imagePrompt, setImagePrompt] = useState("");
    const [generatedImage, setGeneratedImage] = useState(null);
    const [aiImageLoading, setAiImageLoading] = useState(false);

    const [showRecreatePopup, setShowRecreatePopup] = useState(false);
    const [previousPrompts, setPreviousPrompts] = useState([]);
    const [newPrompt, setNewPrompt] = useState("");

    useEffect(() => {
        if(topic) {       
            setFullScreenLoader(true);
            setPostContent(topic.title+'\n'+topic.description);
            if(postContent){                
                navigate(location.pathname, { replace: true });
            }
        } else {
            setFullScreenLoader(false);
        }
    }, [postContent,topic, navigate]);    

    useEffect(() => {
        if(postContent) {
          setFullScreenLoader(false);
        }
      }, [postContent]);

    // Load initial data
    useEffect(() => {
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
        if (userInfoData?.socialData) {
            const connectedPages = userInfoData.socialData.filter(
                social => social.status === 'Connected'
            );
            setPagesList(connectedPages);
        }
    }, []);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowPagesList(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (mediaFiles.length > 0) {
            setSelectedFile(mediaFiles[0].file);
            setSelectedFileUrl(mediaFiles[0].url);
        } else {
            setSelectedFile(null);
            setSelectedFileUrl(null);
        }
    }, [mediaFiles]);

    const getImageDataUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // useEffect(() => {
    //     // Check if any selected platform requires media selection
    //     const selectedPlatformsNeedingMediaChoice = platforms
    //         .filter(p => p.selected)
    //         .filter(p => platformsRequiringMediaSelection.includes(p.id.toLowerCase()));
        
    //     if (selectedPlatformsNeedingMediaChoice.length > 0 && hasMixedMediaGlobal && !globalMediaType) {
    //         setGlobalMediaChoiceOpen(true);
    //     }
    // }, [mediaFiles, platforms, hasMixedMediaGlobal, globalMediaType]);

    const handleFiles = async (files) => {
        let fileArray = Array.from(files);
        
        // Check if we're trying to add videos when one already exists
        const hasExistingVideo = mediaFiles.some(m => m.type === 'video');
        const newVideos = fileArray.filter(file => file.type.startsWith("video"));
        
        if (hasExistingVideo && newVideos.length > 0) {
            toast.error("Only one video is allowed per post. The new videos will not be added.", {
                position: 'top-center',
                autoClose: 5000,
            });
            
            // Filter out videos from the new files
            fileArray = fileArray.filter(file => !file.type.startsWith("video"));
            if (fileArray.length === 0) return;
        }

        if (fileArray.length === 0) return;
        
        // Set loading state to true
        setMediaLoading(true);
        
        // Create temporary IDs for skeleton loaders
        const tempIds = fileArray.map((file, index) => `temp-${Date.now()}-${index}`);
        
        // Add temporary skeleton items to mediaFiles
        const tempMediaItems = tempIds.map(id => ({
            id,
            type: 'skeleton',
            isLoading: true
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
                            type, 
                            file, 
                            url, 
                            thumbnail 
                        };
                    } else {
                        // For images, use URL.createObjectURL for immediate preview
                        return { 
                            id: `${file.name}-${file.lastModified}-${Math.random()}`, 
                            type, 
                            file, 
                            url 
                        };
                    }
                })
            );

            // Replace temporary items with actual media files
            setMediaFiles(prev => {
                // Remove temporary skeleton items
                const filteredMedia = prev.filter(item => !tempIds.includes(item.id));
                
                const newMediaFiles = [...filteredMedia, ...mapped];
                const videos = newMediaFiles.filter(m => m.type === 'video');
                if (videos.length > 1) {
                    const firstVideoId = videos[0].id;
                    return newMediaFiles.filter(m => m.type !== 'video' || m.id === firstVideoId);
                }
                
                // Check if we need to show the media selection modal
                const hasImages = newMediaFiles.some(m => m.type === 'image');
                const hasVideos = newMediaFiles.some(m => m.type === 'video');
                const hasMixedMedia = hasImages && hasVideos;
                
                // Get selected platforms that don't support mixed media
                const selectedPlatformsNeedingMediaChoice = platforms
                    .filter(p => p.selected)
                    .filter(p => platformsRequiringMediaSelection.includes(p.id.toLowerCase()));
                
                // Show modal only if needed and store the conflicting files
                if (selectedPlatformsNeedingMediaChoice.length > 0 && hasMixedMedia && !globalMediaType) {
                    setConflictingFiles(mapped);
                    setHasMixedMediaGlobal(true);
                    setGlobalMediaChoiceOpen(true);
                }
                
                return newMediaFiles;
            });
        } catch (error) {
            console.error("Error processing files:", error);
            toast.error("Failed to process media files", {
                position: 'top-center',
                autoClose: 5000,
            });
            
            // Remove temporary items on error
            setMediaFiles(prev => prev.filter(item => !tempIds.includes(item.id)));
        } finally {
            // Clear loading state
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
        setMediaFiles((prev) => {
            const target = prev.find((m) => m.id === id);
            if (target && target.url) {
                URL.revokeObjectURL(target.url);
            }
            return prev.filter((m) => m.id !== id);
        });
        
        // Also remove from loading state if it exists
        if (mediaLoading[id]) {
            const updatedLoadingState = {...mediaLoading};
            delete updatedLoadingState[id];
            setMediaLoading(updatedLoadingState);
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
            setPagesList(connectedSocial);                  // you still use this elsewhere
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

    // skeleton for Post Preview
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
    // End skeleton for Post Preview

    // Filter pages based on search
    const filteredPages = pagesList.filter(page =>
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.socialPage.some(sp => 
            sp.pageName.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission behavior
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;            
            // Insert newline at cursor position
            const newContent = 
                postContent.slice(0, start) + 
                '\n' + 
                postContent.slice(end);            
            setPostContent(newContent);            
            // Update cursor position after state update
            setTimeout(() => {
                textareaRef.current.selectionStart = start + 1;
                textareaRef.current.selectionEnd = start + 1;
            }, 0);
        }
    };

    useEffect(() => {
        return () => {
            if (selectedFileUrl) {
                URL.revokeObjectURL(selectedFileUrl);
            }
        };
    }, [selectedFileUrl]); 
    
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

    // create hash tags function
        // ✅ Custom hashtags go directly into the post content
        const handleAddCustomTag = () => {
            const tag = customTagInput.trim();
            if (tag) {
                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                const updatedContent = postContent.trim() + ` ${formattedTag}`;
                setPostContent(updatedContent);   // Append directly to content
                setCustomTagInput('');           // Clear input field

                // Keep cursor at the end of the textarea
                const textarea = textareaRef.current;
                setTimeout(() => {
                    if (textarea) {
                        const cursorPos = updatedContent.length;
                        textarea.focus();
                        textarea.setSelectionRange(cursorPos, cursorPos);
                    }
                }, 0);
            }
        };

        // ✅ Fetch hashtags dynamically from webhook
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

        // ✅ When user clicks a hashtag from the list, append it to the end of content
        const handleHashtagClick = (tag) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            // Trim and append hashtag to the very end of the post
            const updatedContent = postContent.trim() + ` ${tag}`;
            setPostContent(updatedContent);

            // Set cursor to end
            setTimeout(() => {
                textarea.focus();
                const cursorPos = updatedContent.length;
                textarea.setSelectionRange(cursorPos, cursorPos);
            }, 0);
        };
    // end create hash tags function

    // Add this function to validate media before upload
    const validateMediaForPlatform = (platform, mediaFiles) => {
        const videos = mediaFiles.filter(m => m.type === 'video');
        const images = mediaFiles.filter(m => m.type === 'image');
        
        const platformId = platform.toLowerCase();
        
        if (platformId === 'facebook') {
            // Facebook only allows one video per post
            if (videos.length > 1) {
                throw new Error("Facebook only supports one video per post. Please select only one video.");
            }
            
            // Facebook has limits on mixed media
            if (videos.length > 0 && images.length > 0) {
                throw new Error("Facebook does not support mixing videos and images in the same post.");
            }
        } else if (platformId === 'linkedin') {
            // LinkedIn only allows one video per post
            if (videos.length > 1) {
                throw new Error("LinkedIn only supports one video per post. Please select only one video.");
            }
            
            // LinkedIn doesn't support mixed media
            if (videos.length > 0 && images.length > 0) {
                throw new Error("LinkedIn does not support mixing videos and images in the same post.");
            }
        } else if (platformId === 'instagram') {
            // Instagram supports multiple videos in a carousel
            // No restrictions needed
        }
        
        return true;
    };

    const clickPostNow = async () => {
        setLoading(true);

        try {
            // Filter media files based on global selection
            let mediaToSend = globalMediaType 
                ? mediaFiles.filter(m => m.type === globalMediaType)
                : [...mediaFiles];

            const videos = mediaToSend.filter(m => m.type === 'video');
            if (videos.length > 1) {
                toast.error("Only one video is allowed per post. Please select only one video.", {
                    position: 'top-right',
                });
                setLoading(false);
                return;
            }
            
            // Input validation
            if (!postContent.trim() && mediaToSend.length === 0) {
                toast.error('Please enter post content or select media', { position: 'top-right' });
                return;
            }

            if (checkedPages.length === 0) {
                toast.error('Please select at least one page', { position: 'top-right' });
                return;
            }

            const authToken = localStorage.getItem('authToken');
            const userInfo = JSON.parse(localStorage.getItem('userinfo'));

            const formData = new FormData();

            // Attach ALL selected media files
            if (mediaToSend.length > 0) {
                mediaToSend.forEach((m, i) => {
                    const safeName = m.file?.name || `media-${i}`;
                    formData.append('upload_img', m.file, safeName);
                });
            }

            // Prepare payload
            formData.append('postContent', postContent);
            formData.append('platforms', JSON.stringify(checkedPages));
            formData.append('mediaType', globalMediaType || '');

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/publish-posts`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` },
                body: formData,
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to publish post');
            }

            if (response.ok && result.results) {
                result.results.forEach(res => {
                    if (res.status === 'success') {
                        toast.success(`✅ Posted to ${res.platform} (${res.pageName})`, {
                            position: 'top-right',
                            autoClose: 4000,
                        });
                    } else {
                        toast.error(`❌ Failed on ${res.platform} (${res.pageName}): ${res.error}`, {
                            position: 'top-right',
                            autoClose: 5000,
                        });
                    }
                });
            } else {
                toast.error('Unexpected error during publishing.');
            }

            // Optional: Reset form if all went well
            if (result.results.every(r => r.status === 'success')) {
                setPostContent('');
                setCheckedPages([]);
                setSelectedPages([]);
                setMediaFiles([]);
                setPlatforms(prev => prev.map(platform => ({
                    ...platform,
                    selected: false
                })));
            }

        } catch (error) {
            toast.error(`Error: ${error.message}`, {
                position: 'top-right',
            });
        } finally {
            setLoading(false);
        }
    };

    // Function to schedule post to Facebook page
    const schedulePostToPages = async () => {
        setLoading(true);
        
        // Filter media files based on global selection
        let mediaToSend = globalMediaType 
            ? mediaFiles.filter(m => m.type === globalMediaType)
            : [...mediaFiles];

        const videos = mediaToSend.filter(m => m.type === 'video');
        if (videos.length > 1) {
            toast.error("Only one video is allowed per post. Please select only one video.", {
                position: 'top-right',
            });
            setLoading(false);
            return;
        }
        
        if(checkedPages.length === 0) {
            toast.error('Please select at least one page', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            setLoading(false);
            return;
        }
        
        const scheduleDateInput = document.getElementById('scheduleDate').value;
        const scheduleTimeInput = document.getElementById('scheduleTime').value;
        
        if (!scheduleDateInput || !scheduleTimeInput) {
            toast.error('Please select both date and time.', {
                position: 'top-right',
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
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            })
            setLoading(false);
            return;
        }

        const userInfo = JSON.parse(localStorage.getItem('userinfo'));
        const socialData = userInfo?.socialData || [];

        const postsData = await Promise.all(
            checkedPages.map(async (page) => {
                try {                   
                    socialData.find(user => 
                        user.socialPage.some(p => p.pageId === page.id)
                    );
                    return {
                        social_userid: page.pageSocialUser,
                        pageId: page.id,
                        pageName: page.name,
                        content: postContent,
                        mediaFiles: mediaToSend, // Send array of media files instead of single mediaUrl
                        platform_post_id: null,
                        socialPlatform: page.page_platform,
                        status: '2',
                        schedule_time: scheduledPublishTime || null
                    };
                } catch (error) {
                    console.error(`Error posting to ${page.name}:`, error);
                    setLoading(false);
                    throw error;
                }
            })
        );           
        await savePost(postsData);
    };

    const clickPostDraft = async () => { 
        setLoading(true);
        
        // Filter media files based on global selection
        let mediaToSend = globalMediaType 
            ? mediaFiles.filter(m => m.type === globalMediaType)
            : [...mediaFiles];

        const videos = mediaToSend.filter(m => m.type === 'video');
        if (videos.length > 1) {
            toast.error("Only one video is allowed per post. Please select only one video.", {
                position: 'top-right',
            });
            setLoading(false);
            return;
        }
        
        if (!postContent.trim() && mediaToSend.length === 0) {
            toast.error('Please enter post content or select media', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            })
            setLoading(false);
            return;
        }            
        if (checkedPages.length === 0) {
            toast.error('Please select at least one page', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            })
            setLoading(false);
            return;
        }       
        
        const userInfo = JSON.parse(localStorage.getItem('userinfo'));
        const socialData = userInfo?.socialData || [];       

        const postsData = await Promise.all(
            checkedPages.map(async (page) => {
                try {                   
                    socialData.find(user => 
                        user.socialPage.some(p => p.pageId === page.id)
                    );
                    return {
                        social_userid: page.pageSocialUser,
                        pageId: page.id,
                        pageName: page.name,
                        content: postContent,
                        mediaFiles: mediaToSend, // Send array of media files instead of single mediaUrl
                        platform_post_id: null,
                        socialPlatform: page.page_platform,
                        status: '0', // Draft status
                        schedule_time: null
                    };
                } catch (error) {
                    console.error(`Error posting to ${page.name}:`, error);
                    setLoading(false);
                    throw error;
                }
            })
        );           
        await savePost(postsData);
    };

    const savePost = async (postsData) => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');        
        try {
            const formData = new FormData();

            // Collect unique media files once
            const mediaUrls = [];
            if (postsData.length > 0 && postsData[0].mediaFiles?.length > 0) {
                for (let i = 0; i < postsData[0].mediaFiles.length; i++) {
                    const media = postsData[0].mediaFiles[i];
                    if (media.url) {
                        const filename = `upload_img-${Date.now()}-${i}.${media.type === 'video' ? 'mp4' : 'jpg'}`;
                        const blob = await fetch(media.url).then(r => r.blob());
                        formData.append("upload_img", blob, filename);
                        mediaUrls.push(filename);
                    }
                }
            }

            // Attach posts with shared mediaUrls
            const postsWithMedia = postsData.map(post => ({
                ...post,
                mediaUrls
            }));

            formData.append("posts", JSON.stringify(postsWithMedia));

            const response = await fetch(`${BACKEND_URL}/api/create-post`, {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + authToken,
                },
                body: formData,
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const result = await response.json();

            toast.success("Posts saved successfully", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });

            // Reset form
            setPostContent('');
            setCheckedPages([]);
            setSelectedPages([]);
            setMediaFiles([]);
            setPlatforms(prev => prev.map(platform => ({
                ...platform,
                selected: false
            })));
            setLoading(false);

            return result;
        } catch (error) {
            console.error("Error saving posts:", error);
            toast.error("Failed to save posts", {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
            throw error;
        }
    };

    const getPlatformIcon = (platform) => {
        switch (platform?.toLowerCase()) {
            case "facebook":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7
                a1 1 0 0 1 1-1h3z"></path>
                </svg>
            );
            case "linkedin":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4
                0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
                </svg>
            );
            case "instagram":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8
                4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
            );
            case "twitter":
            case "x":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M23 3a10.9 10.9 0 0 1-3.14
                1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88
                1.1A4.52 4.52 0 0 0 16.11 0c-2.5
                0-4.51 2-4.51 4.5 0 .35.04.7.11
                1.03A12.94 12.94 0 0 1 3.15
                1.64a4.48 4.48 0 0 0-.61
                2.27c0 1.57.8 2.96 2.02
                3.77a4.48 4.48 0 0 1-2.05-.56v.05c0
                2.2 1.56 4.03 3.63 4.45a4.48 4.48 0 0
                1-2.04.08c.58 1.8 2.26 3.11 4.26
                3.15A9.06 9.06 0 0 1 0
                19.54a12.78 12.78 0 0 0 6.92
                2.03c8.3 0 12.85-6.87
                12.85-12.83 0-.2 0-.39-.01-.58A9.19
                9.19 0 0 0 23 3z"></path>
                </svg>
            );
            case "youtube":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.97C18.88
                4 12 4 12 4s-6.88 0-8.6.45A2.78
                2.78 0 0 0 1.46 6.42 29.94
                29.94 0 0 0 1 12a29.94
                29.94 0 0 0 .46 5.58 2.78
                2.78 0 0 0 1.94 1.97C5.12
                20 12 20 12 20s6.88 0
                8.6-.45a2.78 2.78 0 0
                0 1.94-1.97A29.94 29.94 0 0 0
                23 12a29.94 29.94 0 0 0-.46-5.58z"></path>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75
                15.02"></polygon>
                </svg>
            );
            default:
            return null;
        }
    };

    const togglePlatform = (id) => {
        setPlatforms(prev => {
            const platform = prev.find(p => p.id === id);
            
            // For all cases, proceed with normal toggle
            const next = prev.map(p => {
                if (p.id === id) {
                    const newSelectedState = !p.selected;
                    // If unselecting a platform, remove all its pages from selection
                    if (!newSelectedState) {
                        const platformPages = p.pages.map(page => page.id);
                        // Remove pages from selectedPages state
                        setSelectedPages(prevPages => 
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
            return next;
        });
    };

    useEffect(() => {
        // Get all selected platform IDs
        const selectedPlatformIds = platforms.filter(p => p.selected).map(p => p.id);
        
        // Get all page IDs from selected platforms
        const allowedPageIds = platforms.filter(p => p.selected).flatMap(p => p.pages.map(page => page.id));
        
        // Remove any pages that don't belong to selected platforms
        setSelectedPages(prev => prev.filter(pageId => allowedPageIds.includes(pageId)));
        setCheckedPages(prev => prev.filter(page => 
            allowedPageIds.includes(page.id)
        ));
    }, [platforms]);

    const selectedCount = platforms.filter(p => p.selected).length;

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

    const togglePageSelection = (page) => {
        // 1) Maintain the highlight state (IDs)
        setSelectedPages(prev =>
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
    const renderMediaPreview = (platform = "") => {
        const filteredMedia = getFilteredMedia();
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
                        <div className="position-relative" style={{ height: boxSize, width: "100%" }}>
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
                        <div className="position-relative" style={{ height: boxSize, width: "100%" }}>
                            {filteredMedia[0].type === "video" ? (
                                <div className="position-relative w-100 h-100">
                                    <img
                                        src={filteredMedia[0].thumbnail}
                                        alt="Video thumbnail"
                                        className="w-100 h-100"
                                        style={{ objectFit: "cover", objectPosition: "center" }}
                                        onError={(e) => {
                                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                        }}
                                    />
                                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                </div>
                            ) : (
                                <img
                                    src={filteredMedia[0].url}
                                    alt="facebook-img"
                                    className="w-100 h-100"
                                    style={{ objectFit: "cover", objectPosition: "center" }}
                                    onError={(e) => {
                                        e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                    }}
                                />
                            )}
                        </div>

                        {/* Second row - three images side by side */}
                        <div className="row g-1" style={{ height: boxSize }}>
                            {filteredMedia.slice(1, 4).map((m) => (
                                <div key={m.id} className="col-4 position-relative" style={{ height: "100%" }}>
                                    {m.type === "video" ? (
                                        <div className="position-relative w-100 h-100">
                                            <img
                                                src={m.thumbnail}
                                                alt="Video thumbnail"
                                                className="w-100 h-100"
                                                style={{ objectFit: "cover", objectPosition: "center" }}
                                                onError={(e) => {
                                                    e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                }}
                                            />
                                            <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                        </div>
                                    ) : (
                                        <img
                                            src={m.url}
                                            alt="facebook-img"
                                            className="w-100 h-100"
                                            style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => {
                                                e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                            }}
                                        />
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
                        <img
                            src={m.thumbnail}
                            alt="Video thumbnail"
                            className="w-100 h-100"
                            style={{ objectFit: "cover", objectPosition: "center" }}
                            onError={(e) => {
                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                            }}
                        />
                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                        </div>
                    ) : (
                        <img
                        src={m.url}
                        alt="facebook-img"
                        className="w-100 h-100"
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => {
                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                        }}
                        />
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
                        <img
                            src={m.thumbnail}
                            alt="Video thumbnail"
                            className="w-100 h-100"
                            style={{ objectFit: "cover", objectPosition: "center" }}
                            onError={(e) => {
                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                            }}
                        />
                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                        </div>
                    ) : (
                        <img
                        src={m.url}
                        alt="facebook-img"
                        className="w-100 h-100"
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => {
                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                        }}
                        />
                    )}

                    {/* Show +X overlay on the last item if more than 5 */}
                    {idx === 2 && filteredMedia.length > 5 && (
                        <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                        style={{
                            backgroundColor: "rgba(0,0,0,0.5)",
                            color: "white",
                            fontSize: "2rem",
                            fontWeight: "bold",
                        }}
                        >
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

    const handleAIAssist = async () => {
        if (!postContent.trim()) {
            setShowAIQuestionnaire(true);
            return;
        }

        setShowAIAssist(true);
        setAiLoading(true);

        try {
            const AI_WEBHOOK_URL = `${process.env.REACT_APP_AI_ASSIST_WEBHOOK_URL}`;
            const response = await axios.post(`${AI_WEBHOOK_URL}`,{
                event: 'assist_button_clicked',
                user_text: postContent,
            });

            // ✅ Error handling if API returns error
            if (response.data?.error) {
                toast.error(response.data.error);
                setAiSuggestions([]);
                setShowAIAssist(false);
                return;
            }

            // Ensure the output is parsed safely
            let suggestions = response.data?.output?.suggestions;
            if (typeof suggestions === 'string') {
                try {
                    suggestions = JSON.parse(suggestions);
                } catch (e) {
                    console.error('Failed to parse suggestions JSON:', e);
                }
            }
            // console.log("Response Suggestions:", suggestions);
            setAiSuggestions(suggestions || []);
        } catch (error) {
            console.error('Error fetching AI Assist suggestions:', error);
            toast.error('Failed to fetch AI suggestions');
        } finally {
            setAiLoading(false);
        }
    };

    const AIPopup = () => (
        showAIAssist && (
            <div className="ai-assist-overlay">
                <div className="ai-assist-popup">
                    <div className="popup-header d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                            </svg>&nbsp;
                            AI Content Assistant
                        </h5>
                        <button className="btn-close" style={{border:"1px solid lightgray", borderRadius:"50%", fontSize:"12px", padding:"10px"}} 
                            onClick={() => setShowAIAssist(false)}></button>
                    </div>
                    <p className="text-muted">Here are AI-powered improvements for your post content</p>
                    <div className="d-flex justify-content-between mt-1">
                        <h6 className="my-auto">Content Suggestions</h6>
                        <div className="d-flex justify-content-end" style={{fontSize:"12px"}}>
                            <button className="custom-light-btn" onClick={handleAIAssist}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw h-3 w-3 mr-1">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                    <path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>
                                </svg>&nbsp;
                                Generate Again
                            </button>
                            {/* <button className="custom-light-btn" onClick={handleAIAssist}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                    <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                                </svg>&nbsp;
                                Rewrite
                            </button> */}
                        </div>
                    </div>

                    {aiLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2">Generating suggestions...</p>
                        </div>
                    ) : (
                        <div className="suggestion-list mt-3" style={{maxHeight: 300, overflowY: "scroll"}}>
                            {aiSuggestions.length > 0 ? (
                                aiSuggestions.map((s, i) => (
                                    <div key={i} className="suggestion-card p-3 mb-2 rounded border" 
                                            onMouseEnter={(e) =>e.currentTarget.querySelector(".use-this-btn")?.classList.add("show-btn") }
                                            onMouseLeave={(e) => e.currentTarget.querySelector(".use-this-btn")?.classList.remove("show-btn")}>
                                        <div className="row">
                                            <div className="col-md-10 mobile-px-0">
                                                <p className="mb-0 px-2">{s.post_text}</p>
                                            </div>
                                            <div className="col-md-2 my-auto mobile-px-0">
                                                <button className="btn btn-primary btn-sm use-this-btn w-100" style={{fontSize:"12px"}}
                                                    onClick={() => { setPostContent(s.post_text); setShowAIAssist(false);}}>
                                                        Use this
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <p className="mb-0">Not able to generate content at this moment.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        )
    );

    const AIQuestionnaire = () => (
        showAIQuestionnaire && (
            <div className="ai-assist-overlay">
                <div className="ai-assist-popup" style={{ maxWidth: "550px" }}>
                    <div className="popup-header d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                            </svg>&nbsp;
                            AI Content Assistant
                        </h5>
                        <button className="btn-close" onClick={() => setShowAIQuestionnaire(false)}></button>
                    </div>
                    <p className="text-muted mb-2">Tell us about your post — answer a few questions so AI can create the perfect content for you. </p>

                    <div className="mb-2">
                        <label className="form-label">What topic do you want to write about?</label>
                        <input type="text" className="form-control" placeholder="e.g., AI in business, healthy recipes, investment tips..."
                            value={aiFormData.topic} onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })} />
                    </div>

                    <div className="mb-2">
                        <label className="form-label">What industry are you in?</label>
                        <select className="form-select" value={aiFormData.industry} onChange={(e) => setAiFormData({ ...aiFormData, industry: e.target.value })}>
                            <option value="">Select your industry</option>
                            <option>Technology</option>
                            <option>Finance</option>
                            <option>Health & Wellness</option>
                            <option>Education</option>
                            <option>Marketing</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">What's your main objective?</label>
                        <select className="form-select" value={aiFormData.objective} onChange={(e) => setAiFormData({ ...aiFormData, objective: e.target.value })} >
                            <option value="">Select goal</option>
                            <option>Increase engagement</option>
                            <option>Promote a product</option>
                            <option>Build brand awareness</option>
                            <option>Educate audience</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className="form-label">What tone do you prefer?</label>
                        <select className="form-select" value={aiFormData.tone} onChange={(e) => setAiFormData({ ...aiFormData, tone: e.target.value })} >
                            <option value="">Select tone</option>
                            <option>Professional</option>
                            <option>Friendly</option>
                            <option>Inspirational</option>
                            <option>Funny</option>
                            <option>Bold</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Who is your target audience?</label>
                        <input type="text" className="form-control" placeholder="e.g., entrepreneurs, parents, students, professionals..."
                            value={aiFormData.audience} onChange={(e) => setAiFormData({ ...aiFormData, audience: e.target.value })} />
                    </div>

                    <div className="d-flex justify-content-end">
                        {/* <button className="btn btn-outline-secondary me-2" onClick={() => setShowAIQuestionnaire(false)}> Cancel</button> */}
                        <button className="custom-light-btn" style={{background: "linear-gradient(to right, #9333EA, #2563EB)", color: "white"}}
                            onClick={async () => {
                                if (!aiFormData.topic || !aiFormData.industry || !aiFormData.objective || !aiFormData.tone || !aiFormData.audience) {
                                    toast.error('Please fill all fields before continuing');
                                    return;
                                }

                                setShowAIQuestionnaire(false);
                                setShowAIAssist(true);
                                setAiLoading(true);

                                try {
                                    const AI_WEBHOOK_URL = `${process.env.REACT_APP_AI_ASSIST_WEBHOOK_URL}`;
                                    const response = await axios.post(AI_WEBHOOK_URL, {
                                        event: 'ai_questionnaire',
                                        formData: aiFormData,
                                    });

                                    // ✅ Error handling if API returns error
                                    if (response.data?.error) {
                                        toast.error(response.data.error);
                                        setAiSuggestions([]);
                                        setShowAIAssist(false);
                                        return;
                                    }

                                    let suggestions = response.data?.output?.suggestions;
                                    if (typeof suggestions === 'string') {
                                        try {
                                            suggestions = JSON.parse(suggestions);
                                        } catch (e) {
                                            console.error('Failed to parse suggestions JSON:', e);
                                        }
                                    }

                                    if (suggestions.length > 0) {
                                        setAiSuggestions(suggestions || []);
                                        // toast.success('AI suggestions generated successfully!');
                                    } else {
                                        toast.error('No suggestions could be generated. Please try again.');
                                        setShowAIAssist(false);
                                    }

                                    // ✅ Reset form fields after success
                                    setAiFormData({
                                        topic: "",
                                        industry: "",
                                        objective: "",
                                        tone: "",
                                        targetAudience: "",
                                    });

                                } catch (error) {
                                    console.error('AI generation failed:', error);
                                    toast.error('Failed to generate content');
                                } finally {
                                    setAiLoading(false);
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                            </svg>&nbsp;
                            Generate New
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    const handleAIImageGenerate = async () => {
        if (!imagePrompt.trim()) {
            toast.error("Please describe the image you want to create.");
            return;
        }

        setAiImageLoading(true);
        setGeneratedImage(null);
        
        try {
            const AI_IMAGE_WEBHOOK_URL = `${process.env.REACT_APP_AI_IMAGE_WEBHOOK_URL}`;
            const response = await axios.post(AI_IMAGE_WEBHOOK_URL, { prompt: imagePrompt }, { responseType: "arraybuffer" });
            const contentType = response.headers["content-type"];
            
            const blob = new Blob([response.data], { type: contentType || 'image/png' });
            const imageUrl = URL.createObjectURL(blob);

            if (generatedImage?.url) { URL.revokeObjectURL(generatedImage.url); }
            setGeneratedImage({ url: imageUrl, file: blob, prompt: imagePrompt, });
            
        } catch (error) {
            console.error("AI image generation failed:", error);
            toast.error("Failed to generate image. Please try again.");
        } finally {
            setAiImageLoading(false);
        }
    };

    /**
     * Compresses an image Blob by reducing its quality and/or size using Canvas.
     * @param {Blob} blob The image Blob to compress (from generatedImage.file)
     * @param {number} quality The JPEG quality (0.0 to 1.0). Use 0.7 for a good balance.
     * @param {number} maxWidth The maximum width to resize the image to (maintains aspect ratio).
     * @returns {Promise<Blob>} A promise that resolves to the compressed Blob.
     */
    const compressImageBlob = (blob, quality = 0.7, maxWidth = 1500) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 1. Calculate new dimensions while preserving aspect ratio
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = height * (maxWidth / width);
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;

                    // 2. Draw the image at the new size
                    ctx.drawImage(img, 0, 0, width, height);

                    // 3. Export the canvas content as a new Blob with the specified quality
                    canvas.toBlob(
                        (newBlob) => {
                            if (newBlob) {
                                if (newBlob.size < blob.size) {
                                    resolve(newBlob);
                                } else {
                                    resolve(blob); 
                                }
                            } else {
                                reject(new Error("Canvas toBlob failed to create new Blob."));
                            }
                        }, 
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleRecreate = async () => {
        if (!newPrompt.trim()) {
            toast.error("Please enter a new prompt for recreation.");
            return;
        }
        if (!generatedImage || !generatedImage.file) {
            toast.error("No image found to recreate.");
            return;
        }
        setAiImageLoading(true);
        
        try {
            const originalBlob = generatedImage.file;
            // console.log(`Original Size: ${(originalBlob.size / 1024 / 1024).toFixed(2)} MB`);
            
            const compressedBlob = await compressImageBlob(originalBlob, 0.7, 1500);
            // console.log(`Compressed Size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB`);
            
            const formData = new FormData();
            formData.append('sourceImage', compressedBlob, 'image-to-recreate.jpeg');
            formData.append('prompt', newPrompt);
            const response = await axios.post(`${process.env.REACT_APP_AI_IMAGE_WEBHOOK_URL}`, formData, { responseType: "arraybuffer" });

            const contentType = response.headers["content-type"];
            const recreatedBlob = new Blob([response.data], { type: contentType || 'image/png' });
            const recreatedUrl = URL.createObjectURL(recreatedBlob);

            if (generatedImage?.url) { URL.revokeObjectURL(generatedImage.url); }

            setGeneratedImage({ url: recreatedUrl, file: recreatedBlob, prompt: newPrompt, });

            setPreviousPrompts((prev) => [...prev, newPrompt]);
            setNewPrompt("");
            toast.success("Image successfully recreated!");

        } catch (error) {
            // ... (Error handling logic) ...
            console.error("Failed to recreate image:", error);
            toast.error(`Failed to recreate image: ${error.message || 'An unknown error occurred'}`);
        } finally {
            setAiImageLoading(false);
        }
    };

    const setResetImagePopup = () => {
        setShowAIImagePopup(false);
        setImagePrompt("");
        setGeneratedImage(null);
        setPreviousPrompts([]); 
    };

    const setResetRecreatePopup = () => {
        setShowRecreatePopup(false);
        setNewPrompt("");
    };

    const GenerateAIImagePopup = () =>
    showAIImagePopup && (
        <div className="ai-assist-overlay">
            <div className="ai-assist-popup" style={{ maxWidth: "680px" }}>
                <div className="popup-header d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">
                        <span style={{color: "#9333EA"}}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-3 w-3 mr-1"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg></span>
                        &nbsp; Generate AI Image
                    </h5>
                    <button className="btn-close" onClick={() => setResetImagePopup() }></button>
                </div>
                <p className="text-muted mb-3">Describe the image you want to create, and AI will generate it for you.</p>

                {generatedImage && (
                    <div className="d-flex justify-content-end gap-2 mb-4 mobile-responsive">
                        <button className="btn btn-primary" onClick={() => {
                                setMediaFiles((prev) => [
                                    ...prev, { id: Date.now(), type: "image", file: generatedImage.file, url: generatedImage.url },
                                ]);
                                setShowAIImagePopup(false);
                                setResetImagePopup();
                                toast.success("AI-generated image added to your post!");
                            }}> Use this Image 
                        </button>
                        <button className="custom-light-btn" onClick={handleAIImageGenerate}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                            </svg> Generate Another
                        </button>
                        <button className="custom-light-btn" onClick={() => { setShowRecreatePopup(true);  }}> 
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw h-3 w-3 mr-1">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                <path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>
                            </svg> Recreate Image
                        </button>
                    </div>
                )}

                <div className="" style={{ maxHeight:"400px",overflowY:"scroll"}}>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Image Description</label>
                        <textarea className="form-control" rows="5" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder="e.g., A modern minimalist workspace with a laptop and coffee, sunset lighting, professional photography style">
                        </textarea>
                        <small className="text-muted"> 💡 Tip: Be specific about style, colors, mood, and details for best results </small>
                    </div>

                    {!generatedImage && (
                        <div className="example-prompts p-2 rounded mb-3" style={{background: "linear-gradient(to right, #faf5ff, #eff6ff)",
                                border: "1px solid #e165e161" }}>
                            <strong className="text-dark">Example Prompts:</strong>
                            <ul className="mb-0 mt-1 small">
                                <li>"A vibrant social media graphic with abstract shapes and gradients"</li>
                                <li>"Professional business team collaborating in modern office"</li>
                                <li>"Minimalist product photography of a smartphone on white background"</li>
                            </ul>
                        </div>
                    )}
                    
                    {aiImageLoading ? (
                        // <div className="text-center py-4">
                        //     <div className="spinner-border text-primary" role="status"></div>
                        //     <p className="mt-2">Generating image...</p>
                        // </div>
                        <div className="d-flex justify-content-between gap-1">
                            <button className="custom-light-btn me-2" disabled="true"> Cancel</button>
                            <button className="custom-light-btn" disabled="true" style={{background: "linear-gradient(to right, #9333EA, #2563EB)", color: "white"}}>
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>&nbsp;Generate Image
                            </button>
                        </div>
                    ) : generatedImage ? (
                        <div className="text-center">
                            <img src={generatedImage.url} alt="AI Generated" className="img-fluid rounded border mb-3" style={{ maxHeight: "300px" }} />
                        </div>
                    ) : (
                        <div className="d-flex justify-content-between">
                            <button className="custom-light-btn me-2" onClick={() => setResetImagePopup() }> Cancel</button>
                            <button className="custom-light-btn" onClick={handleAIImageGenerate}  style={{background: "linear-gradient(to right, #9333EA, #2563EB)", color: "white"}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                    <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                                </svg>&nbsp;Generate Image
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );

    const RecreateImagePopup = () => {
        if (!showRecreatePopup) return null;

        // Determine all unique, non-empty prompts used so far to display history
        let allPrompts = [];
        if (imagePrompt && !previousPrompts.includes(imagePrompt)) {
            allPrompts.push(imagePrompt);
        }
        allPrompts = [...allPrompts, ...previousPrompts].filter(p => p && p.trim() !== '');
        // Remove duplicates and keep order
        allPrompts = Array.from(new Set(allPrompts)); 

        return (
            <div className={`modal fade ${showRecreatePopup ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title d-flex align-items-center gap-2">
                                <span><i className="fas fa-magic"></i></span> &nbsp; Recreate Image
                            </h5>
                            <button className="btn-close" onClick={setResetRecreatePopup}></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted mb-3">Modify the current image by providing a new prompt. The generated image below will be used as the base.</p>
                            
                            {/* Generated Image Preview */}
                            {generatedImage && (
                                <div className="text-center mb-4">
                                    <h6 className='text-primary fw-bold'>Current Image</h6>
                                    <img 
                                        src={generatedImage.url} 
                                        alt="AI Generated" 
                                        className="img-fluid rounded border" 
                                        style={{ maxHeight: "250px", maxWidth: "100%", objectFit: "contain" }} 
                                    />
                                    <div className="d-flex justify-content-center gap-2 mt-3">
                                        <button className="btn btn-success btn-sm" 
                                            onClick={() => {
                                                setMediaFiles((prev) => [
                                                    ...prev,
                                                    { id: Date.now(), type: "image", file: generatedImage.file, url: generatedImage.url },
                                                ]);
                                                setResetRecreatePopup();
                                                setResetImagePopup();
                                                setImagePrompt("");
                                                setShowAIImagePopup(false);
                                                toast.success("Recreated image added to your post!");
                                            }}
                                            disabled={aiImageLoading}
                                        > Use this Image </button>
                                    </div>
                                </div>
                            )}

                            {/* Prompt History (Correction for "messages/prompts in wrong way") */}
                            {allPrompts.length > 0 && (
                                <div className="mb-4 p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #eee' }}>
                                    <h6 className="mb-2 fw-bold text-dark">Prompt History (Image Basis)</h6>
                                    <div className="list-group list-group-flush">
                                        {allPrompts.map((p, index) => (
                                            <div key={index} className="list-group-item d-flex justify-content-between align-items-start px-0" style={{ border: 'none', backgroundColor: 'transparent' }}>
                                                <small className="text-muted text-break d-block">
                                                    {/* Display "LAST" badge on the last prompt used to generate the image */}
                                                    {index === allPrompts.length - 1 ? (
                                                        <span className="badge bg-primary me-2">LAST</span>
                                                    ) : (
                                                        <span className="badge bg-secondary me-2">{index + 1}</span>
                                                    )}
                                                    {p}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Prompt Input */}
                            <div className="mb-3">
                                <label className="form-label fw-bold">New Prompt for Recreation</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    placeholder="e.g., Change the style to oil painting, add a small robot in the corner..." 
                                    value={newPrompt} 
                                    onChange={(e) => setNewPrompt(e.target.value)} 
                                />
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="d-flex justify-content-between">
                                <button className="custom-light-btn" onClick={setResetRecreatePopup} disabled={aiImageLoading}> Cancel</button>
                                <button className="btn btn-primary" onClick={handleRecreate} disabled={!newPrompt.trim() || aiImageLoading}>
                                    {aiImageLoading ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                            Recreating...
                                        </>
                                    ) : (
                                        <span><i className="fas fa-redo-alt"></i> Recreate Image</span>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
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
                    <div className="container-fluid">
                        <div className="page-title p-0">
                            <div className="row">
                                <div className="col-sm-12 col-md-12 col-xl-6 mobile-px-0">
                                    <h1 className="fw-bolder h1-heading">Create Post</h1>
                                    <span className="mt-2">Craft engaging content for your social media platforms</span>
                                </div>
                                <div className="col-sm-12 col-md-12 col-xl-6 mobile-px-0">
                                    {filteredPages.length === 0 ? (
                                        <></>
                                    ) : (
                                        loading ? (
                                            <div className="action-buttons ">
                                                <button className="btn btn-primary" disabled={loading} >Posting &nbsp;
                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                        <span className="sr-only">Loading...</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="action-buttons m-0">
                                                <button type="button" onClick={clickPostDraft} disabled={isDraftDisabled} className="custom-light-btn">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save h-4 w-4 mr-2"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg>
                                                    Save Draft
                                                </button>
                                                <button type="button" className="custom-light-btn" onClick={schedulePostToPages} disabled={isScheduleDisabled}> 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar h-4 w-4 mr-2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                                                    Schedule
                                                </button>
                                                <button type="submit" className="custom-primary-btn" onClick={clickPostNow} disabled={isPublishDisabled}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send h-4 w-4 mr-2"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                                                    Publish Now
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>                            
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="row">
                                    <div className="col-md-12 col-xl-8">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="sidebar-body">
                                                    <div className="row g-3 common-form">
                                                        <div className="col-md-12 d-flex align-items-center justify-content-between mobile-responsive ">
                                                            <h3 className="fw-bold text-dark">Post Content</h3>
                                                            <button type="button" className='custom-light-btn my-lg-3' onClick={handleAIAssist} style={{background: "linear-gradient(to right, #9333EA, #2563EB)", color: "white"}}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-sparkles h-4 w-4 mr-2">
                                                                    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"></path>
                                                                    <path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
                                                                </svg>
                                                                AI Assist
                                                            </button>
                                                            {AIPopup()}
                                                            {AIQuestionnaire()}
                                                            {GenerateAIImagePopup()}
                                                            {RecreateImagePopup()}
                                                        </div>
                                                        <div className="col-md-12">
                                                            <h2 className="section-title text-dark">Write your post</h2>                                                            
                                                            <textarea ref={textareaRef} className="form-control" rows={6} id="postContent"
                                                                placeholder="What's happening? Share your thoughts..." value={postContent} 
                                                                onChange={handleContentChange} maxLength={maxCharacters}
                                                                onKeyDown={handleKeyDown}
                                                                onClick={(e) => {
                                                                    setSelectionStart(e.target.selectionStart);
                                                                    setSelectionEnd(e.target.selectionEnd);
                                                                }}
                                                                onSelect={(e) => {
                                                                    setSelectionStart(e.target.selectionStart);
                                                                    setSelectionEnd(e.target.selectionEnd);
                                                                }}
                                                            />
                                                            <div className="d-flex justify-content-between align-items-center mt-2 mobile-responsive">
                                                                <div className="character-count"><span id="char-count">{postContent.length}</span>/{maxCharacters} characters</div>
                                                                <span className="text-muted"> Recommended: 200-700 characters for best engagement </span>
                                                            </div>
                                                        </div>

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
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                                                                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                                                                    <circle cx="9" cy="9" r="2"></circle>
                                                                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                                                                </svg>
                                                                                Photo
                                                                            </button>
                                                                            <button className="upload-btn-custom" onClick={() => document.getElementById('video-upload').click()}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                                                                                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"></path>
                                                                                    <rect x="2" y="6" width="14" height="12" rx="2"></rect>
                                                                                </svg>
                                                                                Video
                                                                            </button>
                                                                            <button className="upload-btn-custom" onClick={() => setShowAIImagePopup(true)} style={{background: "linear-gradient(to right, #9333EA, #2563EB)", color: "white"}}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-3 w-3 mr-1"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg> 
                                                                                Generate AI Image
                                                                            </button>
                                                                        </div>
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
                                                                                        </div>
                                                                                    )
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="mt-3">
                                                                                <div className="text-center">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                                                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                                                        <polyline points="17 8 12 3 7 8"></polyline>
                                                                                        <line x1="12" x2="12" y1="3" y2="15"></line>
                                                                                    </svg>
                                                                                    <p className="mb-0">Drag & drop files here or click to browse</p>
                                                                                    <small className="text-muted">Supports images and videos</small>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <input id="photo-upload" type="file" accept="image/*" multiple className="d-none" onChange={handlePhotoChange} />
                                                                    <input id="video-upload" type="file" accept="video/*" className="d-none" onChange={handleVideoChange} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="col-md-12">
                                                            <div className="d-flex justify-content-between align-items-center mb-3 mobile-responsive">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="d-flex me-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hash h-5 w-5 text-gray-700 dark:text-gray-300"><line x1="4" x2="20" y1="9" y2="9"></line><line x1="4" x2="20" y1="15" y2="15"></line><line x1="10" x2="8" y1="3" y2="21"></line><line x1="16" x2="14" y1="3" y2="21"></line></svg>
                                                                    </div>
                                                                    <h6 className="card-title mb-0">AI Suggested Hashtags</h6>
                                                                    <span className="badge ai-badge rounded-pill ms-2 d-flex align-items-center gap-1">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-3 w-3 mr-1"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                                                                        AI Generated
                                                                    </span>
                                                                </div>
                                                                <button className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center my-lg-3" onClick={handleHashtagWebhook} disabled={hashTagLoader || !postContent.trim()}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw h-3 w-3 mr-1"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
                                                                    <span className="ms-2">{hashTagLoader ? 'Generating…' : hashTags?.length ? 'Refresh' : 'Generate'}</span>
                                                                </button>
                                                            </div>

                                                            <div className="container-bg p-3 rounded-3 mb-3">
                                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                                    {(hashTags?.length ? hashTags : []).map(tag => (
                                                                        <span key={tag} className="badge hashtag-badge rounded-pill px-3 py-1" 
                                                                            onClick={() => handleHashtagClick(tag)} style={{ cursor: 'pointer' }} >
                                                                            {tag}
                                                                        </span>
                                                                    )) }
                                                                </div>

                                                                <div className="border-top border-top-custom pt-3">
                                                                    <label className="text-label mb-3">Add Custom Hashtags</label>
                                                                    <div className="d-flex gap-2 mb-2 mobile-responsive">
                                                                        <input type="text" className="form-control form-control-sm custom-input rounded-3" placeholder="Type hashtag and press Enter..."
                                                                            id="new-task" value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()} />
                                                                        <button className="custom-success-btn" id="add-task" onClick={handleAddCustomTag}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus h-3 w-3 mr-1"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
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
                                                                            {platforms.map(platform => (
                                                                                <div key={platform.id} className="col-12 col-sm-12 col-md-4 col-lg-4 col-xl-5 col-xxl-4">
                                                                                    <div className={`platform-select-card ${platform.selected ? 'selected' : ''}`}
                                                                                        onClick={() => togglePlatform(platform.id)}
                                                                                        // style={{ paddingBottom: "2rem" }}
                                                                                    >
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
                                                                                                {platform.selected && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-4 w-4"><path d="M20 6 9 17l-5-5"></path></svg>}
                                                                                            </div>
                                                                                        </div>
                                                                                        {/* {platform.name.toLowerCase() === 'facebook' && (
                                                                                            <div className="position-absolute bottom-0 end-0 m-2">
                                                                                                <small className="text-danger" 
                                                                                                    title={
                                                                                                        "Facebook:\n" +
                                                                                                        "1. Supports single or multiple images in a post.\n" +
                                                                                                        "2. Supports only one video per post.\n" +
                                                                                                        "3. Does NOT support mixed media (images + video) in the same post.\n" +
                                                                                                        "4. Multiple videos will be posted separately."
                                                                                                    }
                                                                                                >
                                                                                                    <i className="fas fa-info-circle"></i> Media Limitations
                                                                                                </small>
                                                                                            </div>
                                                                                        )} */}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
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
                                                                        <div className="d-flex align-items-center justify-content-between mb-2 mobile-responsive">
                                                                            <label className="form-label mb-0">Select pages/accounts to post to</label>
                                                                            <span className="card-time fw-bold p-1 text-orange-medium rounded "><small>Select pages to publish</small></span>
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
                                                                                                    selectedPages.includes(page.id) ? "selected" : "" }`} onClick={() => togglePageSelection(page)}
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
                                                                                                        <input type="checkbox" className="form-check-input" checked={selectedPages.includes(page.id)} readOnly />
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

                                                        <div className="col-md-12 px-3">
                                                            <div className="row">
                                                                <div className="col-md-3">
                                                                    <label className="form-label fw-medium"><small>Schedule Date</small></label>
                                                                    <input type="date" id="scheduleDate" className="form-control" 
                                                                        value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}/>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <label className="form-label fw-medium"><small>Schedule Time</small></label>
                                                                    <input type="time" id="scheduleTime" className="form-control"
                                                                        value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label fw-medium"><small>Best Time</small></label>
                                                                    <small>
                                                                        <div className="d-flex flex-wrap gap-2">
                                                                            <button type="button" className="custom-light-btn" onClick={() => setBestTime("9:00 AM")}>9:00 AM</button>
                                                                            <button type="button" className="custom-light-btn" onClick={() => setBestTime("1:00 PM")}>1:00 PM</button>
                                                                            <button type="button" className="custom-light-btn" onClick={() => setBestTime("7:30 PM")}>7:30 PM</button>
                                                                        </div>
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {selectedCount > 0 ? (
                                                            <div className="col-md-12 px-3">
                                                                <div className="mt-2">
                                                                    <div className="d-flex align-items-center gap-2 mb-4">
                                                                        <span style={{ color: '#9333ea' }}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className=""><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                                                                        </span>
                                                                        <h4 className="mb-0 text-dark fw-bolder">AI Insights</h4>
                                                                        <span className="badge badge-purple rounded-pill px-2 py-1">
                                                                            {selectedCount} platform{selectedCount !== 1 ? 's' : ''} selected
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="row g-4 custom-row-gap">
                                                                        <div className="col-md-4">
                                                                            <div className="card card-insight card-reach p-3 rounded-3">
                                                                                <div className="d-flex align-items-center gap-2">
                                                                                    <span className="fw-medium text-green-medium d-flex align-items-center gap-2">
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
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
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
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

                                    <div className="col-md-8 col-xl-4">
                                        <div className="card">                                            
                                            <div className="preview-container card-body">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <h2 className="h5 fw-bolder mb-0">Post Preview</h2>
                                                    {selectedCount > 0 && (
                                                        <span className="badge bg-secondary text-light">
                                                            {selectedCount} platform{selectedCount !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="custom-preview-height">
                                                    {checkedPages.length === 0 ? (
                                                        <SkeletonPostPreview />                                       
                                                    ) : (checkedPages.map((page) => {
                                                            const isLinkedIn = String(page.page_platform).toLowerCase() === 'linkedin';
                                                            const isFacebook = String(page.page_platform).toLowerCase() === 'facebook';
    
                                                            // Don't show LinkedIn preview if there's mixed media without selection
                                                            if (isFacebook && isLinkedIn && hasMixedMedia) {
                                                                return (
                                                                    <div className="draft-post-preview" key={page.id}>
                                                                        <div className="platform-header d-flex align-items-center mb-2 px-2 py-1">
                                                                            <div className={`me-2 mb-0 p-1 d-flex align-items-center justify-content-center`} 
                                                                                style={{ 
                                                                                    background: getPlatformColor(page.page_platform),
                                                                                    width: '25px',
                                                                                    height: '25px',
                                                                                    borderRadius: '50%',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                }} >
                                                                                {getPlatformIcon(page.page_platform)}
                                                                            </div>
                                                                            <h6 className="mb-0">LinkedIn Preview</h6>
                                                                        </div>
                                                                        <div className="alert alert-info">
                                                                            <small>
                                                                                Please choose a media type for LinkedIn in the popup to see the preview.
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } 
                                                            
                                                            return (
                                                                <div className="draft-post-preview" key={page.id}>
                                                                    <div className="platform-header d-flex align-items-center mb-2 px-2 py-1">
                                                                        <div className={`me-2 mb-0 p-1 d-flex align-items-center justify-content-center`} 
                                                                            style={{ 
                                                                                background: getPlatformColor(page.page_platform),
                                                                                width: '25px',
                                                                                height: '25px',
                                                                                borderRadius: '50%',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                            }} >
                                                                            {getPlatformIcon(page.page_platform)}
                                                                        </div>
                                                                        <h6 className="mb-0">{capitalizeFirstLetter(page.page_platform)} Preview</h6>
                                                                    </div>
                                                                    {page.page_platform === "facebook" && (
                                                                        <div className="fb-post border rounded bg-white">
                                                                            <div className="d-flex align-items-center p-2">
                                                                                <img src={page.image} alt="" className="rounded-circle me-2" width="40" height="40" />
                                                                                <div>
                                                                                    <strong>{page.name}</strong>
                                                                                    <div className="text-muted" style={{ fontSize: "12px" }}>Just now · <i className="fas fa-globe"></i></div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-2" style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                                                                                {postContent}
                                                                            </div>
                                                                            <div className="preview-content" style={{ padding: "0px"}}>
                                                                                {renderMediaPreview(page.page_platform)}
                                                                            </div>
                                                                            <div className="d-flex justify-content-around border-top p-2 text-muted" style={{ fontSize: "13px" }}>
                                                                                <span><i className="far fa-thumbs-up"></i> Like</span>
                                                                                <span><i className="far fa-comment"></i> Comment</span>
                                                                                <span><i className="fas fa-share"></i> Share</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {page.page_platform === "linkedin" && (
                                                                        <div className="linkedin-post border rounded bg-white">
                                                                            <div className="d-flex align-items-center p-2">
                                                                                <img src={page.image} alt="" className="rounded-circle me-2" width="40" height="40" />
                                                                                <div>
                                                                                    <strong>{page.name}</strong>
                                                                                    <div className="text-muted" style={{ fontSize: "12px" }}>Just now · <i className="fas fa-globe"></i></div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="p-2" style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>
                                                                                {postContent}
                                                                            </div>
                                                                            <div className="preview-media" style={{ padding: "0px"}}>
                                                                                {renderMediaPreview(page.page_platform)}
                                                                            </div>
                                                                            <div className="d-flex justify-content-around border-top p-2 text-muted" style={{ fontSize: "13px" }}>
                                                                                <span><i className="far fa-thumbs-up"></i> Like</span>
                                                                                <span><i className="far fa-comment"></i> Comment</span>
                                                                                <span><i className="fas fa-share-square"></i> Repost</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {page.page_platform === "instagram" && (
                                                                        <div className="instagram-post border rounded bg-white">
                                                                            <div className="d-flex align-items-center p-2">
                                                                                <img src={page.image} alt="" className="rounded-circle me-2" width="40" height="40" />
                                                                                <strong>{page.name}</strong>
                                                                            </div>
                                                                            <div className="preview-media" style={{ padding: "0px"}}>
                                                                                {renderMediaPreview(page.page_platform)}
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
                                                            )
                                                        })                                                
                                                    )}
                                                </div>
                                            </div>                                         
                                         </div>
                                    </div>
                                </div>
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
                                            {/* <button type="button" className="btn btn-outline-secondary" 
                                                onClick={() => {
                                                    setMediaFiles(prev => prev.filter(file => !conflictingFiles.some(cf => cf.id === file.id)));
                                                    setGlobalMediaType(null);
                                                    setGlobalMediaChoiceOpen(false);
                                                    setConflictingFiles([]);
                                                }}
                                            > Cancel </button> */}
                                            <button type="button" className="btn btn-primary" disabled={!globalMediaType}
                                                onClick={() => { 
                                                    setGlobalMediaChoiceOpen(false); 
                                                    if (globalMediaType) {
                                                        setMediaFiles(prev => prev.filter(m => m.type === globalMediaType));
                                                    }
                                                    setConflictingFiles([]); // Reset conflicting files
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