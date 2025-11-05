import React, { useState, useEffect, useCallback } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { formatPostTimeForDisplay } from "./utils/postUtils";
import moment from "moment";
import { toast } from 'react-toastify';
import Carousel from "react-multi-carousel";
import HoverPostPreview from './components/HoverPostPreview';

export default function AllDraftPost() {

    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]); 
    const [visiblePosts, setVisiblePosts] = useState(8);
    const [platformFilter, setPlatformFilter] = useState('All'); // e.g., 'All', 'Instagram', 'Facebook'
    const [statusFilter, setStatusFilter] = useState('All');     // e.g., 'All', 'Draft', 'Scheduled', 'Posted'
    const [actionMenu, setActionMenu] = useState({ visible: false, x: 10, y: 10, data: null });
    const navigate = useNavigate();
    const [copiedId, setCopiedId] = useState(null);

    const loadMorePosts = () => setVisiblePosts((prev) => prev + 4);
    const fetchPosts = useCallback(async () => {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/all-user-posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    platform: platformFilter === 'All' ? null : platformFilter,
                    status: statusFilter === 'All' ? null : statusFilter,
                })
            });

            const data = await response.json();
            if (data.message === "success" && Array.isArray(data.posts)) {
                setPosts(data.posts);
            } else {
                console.error("API response format error:", data);
            }
        } catch (error) {
            console.error("Fetch posts error:", error);
            toast.error("An error occurred while fetching posts.");
            setPosts([]);
        } finally {
            setLoading(false);
            setVisiblePosts(8);
        }
    }, [platformFilter, statusFilter]);

    // 💡 useEffect to trigger fetching when the filter dependencies change
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const carouselResponsive = {
        desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
        tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
        mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
    };

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

    const handleDelete = (row) => {
        console.log('Delete clicked:', row);
    }

    const openActionMenu = (post) => {
        const { clientX, clientY } = window.event;
        setActionMenu({
            visible: true,
            x: clientX,
            y: clientY,
            data: post.data
        });
    };

    const closeActionMenu = () => {
        setActionMenu({ visible: false, x: 0, y: 0, data: null });
    };

    useEffect(() => {
        const handleClickOutside = () => closeActionMenu();
        if (actionMenu.visible) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [actionMenu.visible]);

    useEffect(() => {
        const handleScroll = () => closeActionMenu();
        if (actionMenu.visible) {
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [actionMenu.visible]);

    const renderMediaPreview = (platform = "", mediaToUse = null) => {
        const filteredMedia = mediaToUse;
        if (filteredMedia.length === 0) return null;

        // ---------- Instagram ----------
        if (platform === "instagram") {
            return (
                <Carousel responsive={carouselResponsive} showDots infinite={true} arrows={false} >
                    {filteredMedia.map((m) => (
                        <div key={m.order} className="position-relative" style={{ aspectRatio: "1 / 1" }} >
                            {m.type === "image" ? (
                                <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} alt="insta-img" className="w-100" style={{ height: "300px", objectFit: "cover"}} 
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                            ) : (
                                <video src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} className="w-100" style={{ height: "300px", objectFit: "cover", objectPosition: "center" }} autoPlay loop muted playsInline />
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
                        <img src={m.thumbnail || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="video-thumb"
                            className="w-100" style={{ height: boxSize, objectFit: "cover" }}/>
                        <div className="position-absolute top-50 start-50 translate-middle"
                            style={{ fontSize: 40, opacity: .85, color: "white" }}>
                            <i className="fa-solid fa-circle-play"></i>
                        </div>
                    </div>
                ) : (
                    <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} className="w-100 h-100" alt="facebook-img" style={{ objectFit: "cover", objectPosition: "center" }} 
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                );
            }

            // 2 media → up and down
            if (filteredMedia.length === 2) {
                return (
                    <div className="d-flex flex-column gap-1">
                        {filteredMedia.map((m) => (
                            <div key={m.order} className="flex-fill position-relative" style={{ maxHeight: boxSize, width:"100%" }} >
                                {m.type === "video" ? (
                                    <div className="position-relative w-100 h-100">
                                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                    </div>
                                ) : (
                                    <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
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
                    <div className="d-flex flex-column gap-1" style={{ maxHeight: boxSize * 2 }}>
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
                                <img src={`${process.env.REACT_APP_BACKEND_URL}${filteredMedia[0].path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                            )}
                        </div>
                        {/* Second row - two images side by side */}
                        <div className="row g-1" style={{ height: "auto" }}>
                            {filteredMedia.slice(1, 3).map((m) => (
                                <div key={m.order} className="col-6 position-relative">
                                    {m.type === "video" ? (
                                        <div className="position-relative w-100 h-100">
                                            <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" 
                                                style={{ objectFit: "cover", objectPosition: "center" }} 
                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                            <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                        </div>
                                    ) : (
                                        <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }} 
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
                                    <img src={filteredMedia[0].thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                    <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                </div>
                            ) : (
                                <img src={`${process.env.REACT_APP_BACKEND_URL}${filteredMedia[0].path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                            )}
                        </div>
                        {/* Second row - three images side by side */}
                        <div className="row g-1" style={{ height: boxSize }}>
                            {filteredMedia.slice(1, 4).map((m) => (
                                <div key={m.order} className="col-4 position-relative" style={{ height: "100%" }}>
                                    {m.type === "video" ? (
                                        <div className="position-relative w-100 h-100">
                                            <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                            <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                        </div>
                                    ) : (
                                        <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
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
                            <div key={m.order} className="ratio ratio-1x1 position-relative">
                                {m.type === "video" ? (
                                    <div className="position-relative w-100 h-100">
                                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                    </div>
                                ) : (
                                    <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Second column - 3 stacked images */}
                    <div className="col-6 d-flex flex-column gap-1">
                        {filteredMedia.slice(2, 5).map((m, idx) => (
                            <div key={m.order} className="flex-fill position-relative" style={{ minHeight: 0 }}>
                                {m.type === "video" ? (
                                    <div className="position-relative w-100 h-100">
                                        <img src={m.thumbnail} alt="Video thumbnail" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
                                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                                        <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                                    </div>
                                ) : (
                                    <img src={`${process.env.REACT_APP_BACKEND_URL}${m.path}`} alt="facebook-img" className="w-100 h-100" style={{ objectFit: "cover", objectPosition: "center" }}
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

    function buildCustomURL(post) {
        if (post.platform === 'facebook')
            return `https://www.facebook.com/${post.platform_post_id}`;
        if (post.platform === 'linkedin')
            return `https://www.linkedin.com/feed/update/${post.platform_post_id}/`;
        if (post.platform === 'instagram')
            return post.permalink;
        return null;
    }

    const handleEdit = (formId) => {
        navigate("/edit-post", { state: { formId } });
    };

    const handleCopy = async (content, form_id) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(form_id);
            toast.success("Post content copied to clipboard!");
            setTimeout(() => setCopiedId(null), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error("Failed to copy: ", err);
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
                                <div className="col-md-5">
                                    <div className='d-flex flex-column'>
                                        <h1 className='h1-heading'> Published Posts </h1>
                                        <div> 
                                            <p className='pb-0 mb-0' style={{ fontSize: "16px" }}> Track performance of your published content </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-7">
                                    <div className='d-flex gap-2 justify-content-end'>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-primary">
                                                <a className="txt-light d-flex align-items-center gap-2" href="/analytics" data-discover="true">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-column" >
                                                        <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                                                        <path d="M18 17V9"></path>
                                                        <path d="M13 17V5"></path>
                                                        <path d="M8 17v-3"></path>
                                                    </svg>Analytics Report
                                                </a>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid default-dashboard">
                        <div className="content-wrapper">
                            <div className="row pb-4">
                                <div className="row">
                                    <div className="col-3 mb-4">
                                        <div className="search-container d-flex align-items-center gap-2 pt-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search h-4 w-4 text-gray-400" >
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <path d="m21 21-4.3-4.3"></path>
                                            </svg>
                                            <input type="text" className="form-control search-input" placeholder="Search posts..." />
                                        </div>

                                    </div>
                                    <div className="col-9 mb-4 d-flex justify-content-end align-items-center gap-2">
                                        <select className="form-control" id="categorySelect" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
                                            <option value="All"> All Platforms </option>
                                            <option value="facebook">Facebook </option>
                                            <option value="instagram">Instagram</option>
                                            <option value="linkedin">LinkedIn</option>
                                        </select>

                                        <select className="form-control" id="categorySelect">
                                            <option> All Performance  </option>
                                            <option>Very High </option>
                                            <option>High</option>
                                            <option>Medium</option>
                                            <option>Low</option>
                                        </select>

                                        <select className="form-control" id="categorySelect" >
                                            <option>Most Recent</option>
                                            <option>Best Performance</option>
                                            <option>Hightest Engagement</option>
                                            <option>Most Reach</option>
                                        </select>

                                        <select className="form-control" id="categorySelect" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                            <option value="All">All Statuses</option>
                                            <option value="published">Published </option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="draft">Draft</option>
                                        </select>

                                        <div className="w-100">
                                            <ul className="nav nav-tabs gap-2 bg-white justify-content-center p-2 rounded-3" id="socialTabs" role="tablist">
                                                <li className="nav-item" role="presentation">
                                                    <button className="nav-link layout-btn  active d-flex" id="grid-tab" data-bs-toggle="tab" 
                                                        data-bs-target="#grid" type="button" role="tab" aria-controls="grid" aria-selected="true" >
                                                        {/* <div className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                            style={{
                                                                background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                width: "25px", height: "25px",
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" >
                                                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7 a1 1 0 0 1 1-1h3z"></path>
                                                            </svg>
                                                        </div> */}
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid3x3" >
                                                            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                            <path d="M3 9h18"></path>
                                                            <path d="M3 15h18"></path>
                                                            <path d="M9 3v18"></path>
                                                            <path d="M15 3v18"></path>
                                                        </svg>
                                                    </button>
                                                </li>

                                                <li className="nav-item" role="presentation">
                                                    <button className="nav-link layout-btn d-flex" id="rows-tab" data-bs-toggle="tab" data-bs-target="#rows" type="button" role="tab" aria-controls="rows" aria-selected="false" >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list" >
                                                            <path d="M3 12h.01"></path>
                                                            <path d="M3 18h.01"></path>
                                                            <path d="M3 6h.01"></path>
                                                            <path d="M8 12h13"></path>
                                                            <path d="M8 18h13"></path>
                                                            <path d="M8 6h13"></path>
                                                        </svg>
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="tab-content p-3 rounded-bottom  mb-3">
                                    <div className="tab-pane fade active show" id="grid" role="tabpanel" aria-labelledby="grid-tab">
                                        {loading ? (
                                            <div className="text-center my-5">
                                                <div className="spinner-border" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        ) : posts.length === 0 ? (
                                            <div className="text-center my-5">No posts found for the selected filters.</div>
                                        ) : (
                                            <div className="row g-3">
                                                {console.log("Posts: ",posts)}
                                                {posts.slice(0, visiblePosts).map(post => (
                                                    <div key={post.id} className="col-md-12 col-sm-6 col-lg-4 col-xl-3 d-flex">
                                                        <div className="card w-100 published-card-posts">
                                                            <div className="card-header rounded-3 border-0">
                                                                <div className="d-flex d-flex justify-content-between align-items-center">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <div className="">
                                                                            <div className={`${post.platform}-profile-img platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-3`} style={{width:'40px',height:'40px'}}>
                                                                                {platformSVGs[post.platform] || (
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                                                                        <circle cx="12" cy="12" r="10" />
                                                                                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                                                                        <path d="M2 12h20" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            {/* <span>
                                                                                <img src={post.pageUserInfo?.img_url || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                                    alt="" style={{ width: '30px', marginRight: '5px' }} className="rounded-circle" />
                                                                            </span>  */}
                                                                            <h6 className="h6-heading">
                                                                                {post.pageUserInfo?.name}
                                                                            </h6>
                                                                            <p className="text-muted small m-0">{formatPostTimeForDisplay(post.sort_date_string)} </p>
                                                                            {/* <p className="text-muted small m-0">• {post.platform} </p> */}
                                                                        </div>
                                                                    </div>

                                                                    <div className="action-button-wrapper"
                                                                        onClick={(e) => { e.stopPropagation(); openActionMenu(post); }}
                                                                        style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            borderRadius: '50%',
                                                                            // backgroundColor: '#f1f1f1',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical" >
                                                                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                                                            <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                                                            <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                                                            <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                                                                        </svg>
                                                                    </div>
                                                                    {actionMenu.visible && (
                                                                        <div className="dropdown-menu show"
                                                                            style={{
                                                                                position: 'fixed',
                                                                                top: actionMenu.y,
                                                                                left: actionMenu.x,
                                                                                zIndex: 9999,
                                                                                minWidth: '160px',
                                                                                background: '#fff',
                                                                                border: '1px solid #ddd',
                                                                                // boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            // onMouseLeave={closeActionMenu}
                                                                        >
                                                                            <button className="dropdown-item" onClick={() => handleEdit(post.form_id)}>
                                                                                <i className="fas fa-pencil me-2"></i> &nbsp; Edit
                                                                            </button>
                                                                            <button className="dropdown-item text-danger" onClick={() => handleDelete(post.form_id)}>
                                                                                <i className="fas fa-trash me-2"></i> &nbsp; Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="card m-3 mt-0">
                                                                <div className="card-header rounded-3 border-0 p-2">
                                                                    {/* <div className="d-flex d-flex justify-content-between align-items-center"> */}
                                                                    <div className="d-flex gap-2">
                                                                        {/* <div className="">
                                                                            <div className={`${post.platform}-profile-img platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-3`} style={{width:'40px',height:'40px'}}>
                                                                                {platformSVGs[post.platform] || (
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                                                                        <circle cx="12" cy="12" r="10" />
                                                                                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                                                                        <path d="M2 12h20" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                        </div> */}
                                                                        <div>
                                                                            <div className="d-flex justify-content-between p-2">
                                                                                <div className="d-flex text-start">
                                                                                    <span>
                                                                                        <img src={post.pageInfo?.page_picture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                                            alt="" style={{ width: '30px', marginRight: '5px' }} className="rounded-circle" />
                                                                                    </span>
                                                                                    <div className="d-flex flex-column">
                                                                                        <h6 className="h6-heading"> {post.pageInfo?.pageName} </h6>
                                                                                        {/* <p className="text-muted small m-0">Business Page</p> */}
                                                                                        <p className="text-muted small m-0">{formatPostTimeForDisplay(post.sort_date_string)}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-end" style={{ position: "absolute", top: "10px", right: "-10px" }}>
                                                                                    <span className={`badge bg-${post.status === '1' ? 'success' : post.status === '2' ? 'info' : 'warning' } text-capitalize py-1 px-2`}>
                                                                                        {post.status === "0" ? "draft" : post.status === "1" ? "published" : post.status === "2" ? "scheduled" : post.status}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="container p-0">
                                                                                {(() => {
                                                                                    const maxLength = 70;
                                                                                    const truncatedContent = post?.content?.length > maxLength ? post.content.substring(0, maxLength) + "..." : post?.content;

                                                                                    return truncatedContent?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => {
                                                                                        const isFirstLine = lineIndex === 0;
                                                                                        return isFirstLine ? (
                                                                                            <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
                                                                                                {line.split(/(#\w+)/g).map((part, partIndex) =>
                                                                                                    part.startsWith("#") && part.length > 1 ? (
                                                                                                        <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary mt-1" style={{ fontWeight: 600 }} >
                                                                                                        {part}
                                                                                                        </span>
                                                                                                    ) : (
                                                                                                        <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                                                                                                    )
                                                                                                )}
                                                                                            </p>
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
                                                                                {/* <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop" alt="Preview" 
                                                                                    className="img-fluid d-block mx-auto" style={{ objectFit: "contain", width: "100%", height: "100%" }} /> */}
                                                                                <div className="preview-media" style={{ padding: "0px" }}>
                                                                                    {(() => {
                                                                                        try {
                                                                                            if (typeof post.postMedia === 'string') {
                                                                                                if (post.postMedia.startsWith('https://')) {
                                                                                                    return <img src={post.postMedia} alt="Post Media" className="post-image rounded" 
                                                                                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                                                                } else {
                                                                                                    const media = typeof post.postMedia === 'string' ? 
                                                                                                        JSON.parse(post.postMedia) : post.postMedia;
                                                                                                    return renderMediaPreview(post.platform, media);
                                                                                                }
                                                                                            }
                                                                                        } catch (err) {
                                                                                            console.log("Post image rendering error: ",err);
                                                                                        }
                                                                                        return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default post-image" className="post-image rounded" 
                                                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                    </div>
                                                                    {/* </div> */}
                                                                </div>
                                                            </div>

                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <div className="p-2 rounded-3 text-center"
                                                                        style={{ background: "linear-gradient(to right, rgba(191, 219, 254, 0.23), rgba(204, 251, 241, 0.3))" }} >
                                                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye text-primary me-1" style={{ width: "16px", height: "16px" }} >
                                                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                                                <circle cx="12" cy="12" r="3"></circle>
                                                                            </svg>
                                                                            <span className="small fw-medium text-primary">Reach</span>
                                                                        </div>
                                                                        <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.875rem" }}>{post.postData?.reach}</p>
                                                                    </div>
                                                                    <div className="p-2 rounded-3 text-center "
                                                                        style={{ background: "linear-gradient(to right, rgba(187, 209, 236, 0.1), rgba(204, 251, 241, 0.8))" }} >
                                                                        <div className="d-flex align-items-center justify-content-center mb-1">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-purple me-1" style={{ width: "16px", height: "16px" }} >
                                                                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                                                                <polyline points="16 7 22 7 22 13"></polyline>
                                                                            </svg>
                                                                            <span className="small fw-medium text-purple">Engagement</span>
                                                                        </div>
                                                                        <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.875rem" }}>
                                                                            {post.postData?.engagement !== undefined && post.postData?.engagement !== null
                                                                                ? Number(post.postData.engagement).toFixed(2)
                                                                                : '0.00'}%
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="card-footer border-0 pt-0">
                                                                <div className="d-flex justify-content-between align-items-center pt-2 border-top"
                                                                    style={{ fontSize: "0.75rem", color: "#6b7280" }}  >
                                                                    {/* Likes */}
                                                                    <div className="d-flex align-items-center me-3" title="Likes">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                                                                        </svg>
                                                                        <span>{post.postData?.likes}</span>
                                                                    </div>

                                                                    {/* Comments */}
                                                                    <div className="d-flex align-items-center me-3" title="Comments">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                                                        </svg>
                                                                        <span>{post.postData?.comments}</span>
                                                                    </div>

                                                                    {/* Shares */}
                                                                    <div className="d-flex align-items-center me-3" title="Shares">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                            <circle cx="18" cy="5" r="3"></circle>
                                                                            <circle cx="6" cy="12" r="3"></circle>
                                                                            <circle cx="18" cy="19" r="3"></circle>
                                                                            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                                                                            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                                                        </svg>
                                                                        <span>{post.postData?.shares}</span>
                                                                    </div>

                                                                    {/* Impressions */}
                                                                    <div className="d-flex align-items-center" title="Impressions">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                                                            <circle cx="9" cy="7" r="4"></circle>
                                                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                                        </svg>
                                                                        <span>{post.postData?.impressions}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="d-flex gap-1 justify-content-between mt-3">
                                                                    {/* View Post Button */}
                                                                    {post.status === "1" ? (
                                                                        <a href={buildCustomURL(post)} target="_blank" style={{ height: "36px", fontSize: "12px", }} title={`View this post on ${post.platform}`}
                                                                                className="btn custom-outline-btn d-flex align-items-center text-xs rounded-pill" >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                                                                <path d="M15 3h6v6"></path>
                                                                                <path d="M10 14 21 3"></path>
                                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                            </svg> View Post
                                                                        </a>
                                                                    ) : (
                                                                        <button type="button" disabled="true" style={{ height: "36px", fontSize: "12px", }} title={`View this post on ${post.platform}`}
                                                                                className="btn custom-outline-btn d-flex align-items-center text-xs rounded-pill" >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                                                                <path d="M15 3h6v6"></path>
                                                                                <path d="M10 14 21 3"></path>
                                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                            </svg> View Post
                                                                        </button>
                                                                    )}

                                                                    {/* Copy Button */}
                                                                    <button type="button" style={{ height: "36px" }} onClick={() => handleCopy(post.content, post.form_id) } title="Copy Content"
                                                                            className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill" >
                                                                        {copiedId === post.form_id ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
                                                                                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                                <circle cx="12" cy="12" r="10" stroke="currentColor" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3l5-5" />
                                                                            </svg>

                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                                                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                                                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                                                                            </svg>
                                                                        )}
                                                                    </button>

                                                                    {/* Edit Button */}
                                                                    <button type="button" style={{ height: "36px" }} onClick={() => handleEdit(post.form_id)}
                                                                            className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill" >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                                                                            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                            </div>
                                        )}

                                        {posts.length > visiblePosts && (
                                            <div className="d-flex justify-content-center align-items-center my-4">
                                                <button type="button" className="btn custom-outline-btn d-flex align-items-center rounded-pill bg-white" onClick={loadMorePosts}>
                                                    Load More Posts
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="tab-pane fade" id="rows" role="tabpanel" aria-labelledby="rows-tab" >
                                        {posts.slice(0, visiblePosts).map(post => (
                                            <div key={post.id} className="card my-3 published-card-posts">
                                                <div className="row card-body">
                                                    <div className="col-md-6">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div style={{ position: "relative" }} >
                                                                <span className={`badge bg-${post.status === '1' ? 'success' : post.status === '2' ? 'info' : 'warning' } text-capitalize`}
                                                                    style={{ position:"absolute", right: "-15px", top: "5px", zIndex: "10" }} >
                                                                    { post.status === '1' ? "Published" : post.status === '2' ? "Scheduled" : "Draft" }
                                                                </span>
                                                                {(() => {
                                                                    try {
                                                                        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                                                                        if (typeof post.postMedia === 'string') {
                                                                            if (post.postMedia.startsWith('https://')) {
                                                                                return (
                                                                                    <HoverPostPreview key={post.id} post={post} platform={post.platform?.toLowerCase()} >
                                                                                        <div style={{ width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", position: "relative" }} >
                                                                                            <img src={post.postMedia} alt="Post Media" className="post-image rounded w-100 h-100" 
                                                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                                                        </div>
                                                                                    </HoverPostPreview>
                                                                                );
                                                                            } else {
                                                                                const mediaArray = JSON.parse(post.postMedia || "[]");
                                                                                if (!Array.isArray(mediaArray) || mediaArray.length === 0) return null;
                                                                                const firstMedia = mediaArray[0];
                                                                                
                                                                                return (
                                                                                    <HoverPostPreview key={post.id} post={post} platform={post.platform?.toLowerCase()} >
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
                                                                                    </HoverPostPreview>
                                                                                );
                                                                            }
                                                                        }
                                                                    } catch (err) {
                                                                        console.error("Invalid postMedia JSON for first post:", err);
                                                                        return null;
                                                                    }
                                                                })()}
                                                            </div>
                                                            <div className="d-flex flex-column ms-2">
                                                                {(() => {
                                                                    const maxLength = 200;
                                                                    const truncatedContent = post?.content?.length > maxLength ? post.content.substring(0, maxLength) + "..." : post?.content;

                                                                    return truncatedContent?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => {
                                                                        const isFirstLine = lineIndex === 0;
                                                                        return isFirstLine ? (
                                                                            <h6 className="mb-1 h6-heading" key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
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
                                                                            <p className="text-muted mb-2" key={`line-${lineIndex}`} style={{ margin: "0 0 2px 0" }}>
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
                                                                {/* <h6 className="mb-1 h6-heading">Behind the Scenes: Our Creative Process</h6>
                                                                <p className="text-muted mb-2">
                                                                    Take a peek into how we bring ideas to life! Our creative team's journey from concept to execution ✨ #BehindTheScenes #Creativity
                                                                </p> */}

                                                                {/* Post Info */}
                                                                <div className="d-flex align-items-center text-muted small gap-3 mb-2">
                                                                    <div className={`${post.platform}-profile-img platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-3`} style={{width:'40px',height:'40px'}}>
                                                                        {platformSVGs[post.platform] || (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                                                                <circle cx="12" cy="12" r="10" />
                                                                                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                                                                <path d="M2 12h20" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <div className="d-flex p-2">
                                                                        <span>
                                                                            <img src={post.pageInfo?.page_picture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                                alt="" style={{ width: '30px', marginRight: '5px' }} className="rounded-circle" />
                                                                        </span>
                                                                        <div className="d-flex flex-column my-auto">
                                                                            <h6 className="h6-heading"> {post.pageInfo?.pageName} </h6>
                                                                            {/* <p className="text-muted small m-0">{formatPostTimeForDisplay(post.sort_date_string)}</p> */}
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex">
                                                                        <svg role="img" aria-label="Calendar" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                            <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
                                                                            <path d="M16 3v4M8 3v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                                                            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1"/>
                                                                        </svg>
                                                                        <span className="my-auto ms-1"> {formatPostTimeForDisplay(post.sort_date_string)} </span>
                                                                    </div>
                                                                    {/* <span> • Instagram</span>
                                                                    <div class="d-inline-flex align-items-center rounded-pill primary-badge  fw-semibold small"> High</div> */}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="d-flex align-items-center">
                                                            <div className="d-flex align-items-center text-muted small mt-2">

                                                                {/* Likes */}
                                                                <div className="d-flex align-items-center me-3" title="Likes">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                                                                    </svg>
                                                                    <span>{post.postData?.likes}</span>
                                                                </div>

                                                                {/* Comments */}
                                                                <div className="d-flex align-items-center me-3" title="Comments">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                                                    </svg>
                                                                    <span>{post.postData?.comments}</span>
                                                                </div>

                                                                {/* Shares */}
                                                                <div className="d-flex align-items-center me-3" title="Shares">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
                                                                        <circle cx="18" cy="5" r="3"></circle>
                                                                        <circle cx="6" cy="12" r="3"></circle>
                                                                        <circle cx="18" cy="19" r="3"></circle>
                                                                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                                                                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                                                    </svg>
                                                                    <span>{post.postData?.shares}</span>
                                                                </div>

                                                                {/* Impressions */}
                                                                <div className="d-flex align-items-center me-3" title="Impressions">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="me-1">
                                                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                                                        <circle cx="9" cy="7" r="4"></circle>
                                                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                                    </svg>
                                                                    <span>{post.postData?.impressions}</span>
                                                                </div>

                                                                {/* Reach */}
                                                                <div className="d-flex align-items-center me-3" title="Reach">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                                        <circle cx="12" cy="12" r="3"></circle>
                                                                    </svg>
                                                                    <span>{post.postData?.reach}</span>
                                                                </div>

                                                                {/* Engagements */}
                                                                <div className="d-flex align-items-center me-3" title="Engagement">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                                                        <polyline points="16 7 22 7 22 13"></polyline>
                                                                    </svg>
                                                                    <span>
                                                                        {post.postData?.engagement !== undefined && post.postData?.engagement !== null
                                                                                ? Number(post.postData.engagement).toFixed(2) : '0.00'}%
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="d-flex gap-1 justify-content-between mt-3">
                                                                    {/* View Post Button */}
                                                                    {post.status === "1" ? (
                                                                        <a href={buildCustomURL(post)} target="_blank" style={{ height: "36px", fontSize: "12px", }} title={`View this post on ${post.platform}`}
                                                                                className="btn custom-outline-btn d-flex align-items-center text-xs rounded-pill" >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                                                                <path d="M15 3h6v6"></path>
                                                                                <path d="M10 14 21 3"></path>
                                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                            </svg> View
                                                                        </a>
                                                                    ) : (
                                                                        <button type="button" disabled="true" style={{ height: "36px", fontSize: "12px", }} title={`View this post on ${post.platform}`}
                                                                                className="btn custom-outline-btn d-flex align-items-center text-xs rounded-pill" >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                                                                <path d="M15 3h6v6"></path>
                                                                                <path d="M10 14 21 3"></path>
                                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                            </svg> View
                                                                        </button>
                                                                    )}

                                                                    {/* Dropdown Edit/Delete Button */}
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); openActionMenu(post); }} style={{ height: "36px" }} className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill" >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ellipsis" >
                                                                            <circle cx="12" cy="12" r="1"></circle>
                                                                            <circle cx="19" cy="12" r="1"></circle>
                                                                            <circle cx="5" cy="12" r="1"></circle>
                                                                        </svg>
                                                                    </button>
                                                                    {actionMenu.visible && (
                                                                        <div className="dropdown-menu show"
                                                                            style={{
                                                                                position: 'fixed',
                                                                                top: actionMenu.y,
                                                                                left: actionMenu.x,
                                                                                zIndex: 9999,
                                                                                minWidth: '160px',
                                                                                background: '#fff',
                                                                                border: '1px solid #ddd',
                                                                                // boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            // onMouseLeave={closeActionMenu}
                                                                        >
                                                                            <button className="dropdown-item" onClick={() => handleEdit(post.form_id)}>
                                                                                <i className="fas fa-pencil me-2"></i> &nbsp; Edit
                                                                            </button>
                                                                            <button className="dropdown-item text-danger" onClick={() => handleDelete(post.form_id)}>
                                                                                <i className="fas fa-trash me-2"></i> &nbsp; Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {posts.length > visiblePosts && (
                                            <div className="d-flex justify-content-center align-items-center my-4">
                                                <button type="button" className="btn custom-outline-btn d-flex align-items-center rounded-pill bg-white" onClick={loadMorePosts}>
                                                    Load More Posts
                                                </button>
                                            </div>
                                        )}
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


// first tabs cards

{/* twitter */}
<div className="col-12 col-sm-6 col-lg-4 col-xl-3 d-flex">
    <div className="card w-100 published-card-posts">
        <div className="card-header rounded-3 border-0">
            <div className="d-flex d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <div className="">
                        <div className="p-2 rounded-3 d-inline-block"
                            style={{
                                background: "linear-gradient(to right, #60a5fa, #2563eb)", width: "40px",
                                height: "40px"
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-twitter text-white"
                            >
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 
                                    2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5
                                    c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 
                                    7-3.8 1.1 0 3-1.2 3-1.2z" />
                            </svg>
                        </div>

                    </div>
                    <div className="d-flex flex-column">
                        <h6 className="h6-heading">Quick Tips: Boosting...</h6>
                        <p className="text-muted small m-0">2 days ago </p>
                        <p className="text-muted small m-0">• Twitter </p>
                    </div>
                </div>

                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                        <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                        <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                    </svg>
                </div>
            </div>
        </div>
        <div className="card m-3 mt-0">
            <div className="card-header rounded-3 border-0">
                {/* <div className="d-flex d-flex justify-content-between align-items-center"> */}
                <div className="d-flex gap-2">
                    <div className="">
                        <div className="p-2 rounded-circle d-inline-block"
                            style={{
                                background: "linear-gradient(to right, #60a5fa, #2563eb)", width: "35px",
                                height: "35px"
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-twitter text-white"
                            >
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 
                                    2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5
                                    c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 
                                    7-3.8 1.1 0 3-1.2 3-1.2z" />
                            </svg>
                        </div>
                    </div>
                    <div className="d-flex flex-column">
                        <h6 className="h6-heading"> Twitter User </h6>

                        <p className="text-muted small m-0">• 1 week ago </p>

                        {/* <p>
                            Our latest research reveals key insights into digital transformation across ...
                        </p>

                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop"
                            alt="Preview" className="img-fluid d-block mx-auto"
                            style={{ objectFit: "contain", width: "100%", height: "100%" }}
                        /> */}
                    </div>
                </div>

                <p className="mt-2">
                    🚀 3 proven strategies to increase your social media engagement: 1️⃣ Post at ...
                </p>
            </div>
        </div>

        <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
                <div className="p-2 rounded-3 text-center"
                    style={{
                        background: "linear-gradient(to right, rgba(191, 219, 254, 0.23), rgba(204, 251, 241, 0.3))",
                    }}
                >
                    <div className="d-flex align-items-center justify-content-center mb-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-eye text-primary me-1"
                            style={{ width: "16px", height: "16px" }}
                        >
                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span className="small fw-medium text-primary">Reach</span>
                    </div>
                    <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.875rem" }}>6.4K</p>
                </div>
                <div className="p-2 rounded-3 text-center "
                    style={{
                        background: "linear-gradient(to right, rgba(187, 209, 236, 0.1), rgba(204, 251, 241, 0.8))",
                    }}
                >
                    <div className="d-flex align-items-center justify-content-center mb-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-trending-up text-purple me-1"
                            style={{ width: "16px", height: "16px" }}
                        >
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                            <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span className="small fw-medium text-purple">Engagement</span>
                    </div>
                    <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.875rem" }}>9.8%</p>
                </div>

            </div>

        </div>
        <div className="card-footer border-0 pt-0">

            <div
                className="d-flex justify-content-between align-items-center pt-2 border-top"
                style={{ fontSize: "0.75rem", color: "#6b7280" }} // text-gray-500
            >
                {/* Likes */}
                <div className="d-flex align-items-center me-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </svg>
                    <span>289</span>
                </div>

                {/* Comments */}
                <div className="d-flex align-items-center me-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                    </svg>
                    <span>13</span>
                </div>

                {/* Shares */}
                <div className="d-flex align-items-center me-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                    </svg>
                    <span>58</span>
                </div>

                {/* Users */}
                <div className="d-flex align-items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>37.7K</span>
                </div>
            </div>

            <div className="d-flex gap-1 justify-content-between mt-3">
                {/* View Post Button */}
                <button
                    type="button"
                    className="btn custom-outline-btn  d-flex align-items-center text-xs rounded-pill"
                    style={{ height: "36px", fontSize: "12px", }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-2"
                    >
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    </svg>
                    View Post
                </button>

                {/* Copy Button */}
                <button
                    type="button"
                    className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill"
                    style={{ height: "36px" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                    </svg>
                </button>

                {/* Edit Button */}
                <button
                    type="button"
                    className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill"
                    style={{ height: "36px" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                    </svg>
                </button>
            </div>


        </div>

    </div>
</div>

{/* instagram */}
<div className="col-12 col-sm-6 col-lg-4 col-xl-3 d-flex">
    <div className="card w-100 published-card-posts">
        <div className="card-header rounded-3 border-0">
            <div className="d-flex d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <div className="">
                        <div className="p-2 rounded-3 d-inline-block"
                            style={{
                                background: "linear-gradient(to right, #a855f7, #ec4899)", width: "40px",
                                height: "40px"
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-instagram text-white"
                            >
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </div>
                    </div>
                    <div className="d-flex flex-column">
                        <h6 className="h6-heading">Behind the...</h6>
                        <p className="text-muted small m-0">1 day ago </p>
                        <p className="text-muted small m-0">• Instagram </p>
                    </div>
                </div>

                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                        <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                        <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                    </svg>
                </div>
            </div>
        </div>
        <div className="card m-3 mt-0">
            <div className="card-header rounded-3 border-0">
                {/* <div className="d-flex d-flex justify-content-between align-items-center"> */}
                <div className="d-flex gap-2 align-items-center mb-3">
                    <div className="">
                        <div className="p-2 rounded-circle d-inline-block"
                            style={{
                                background: "linear-gradient(to right, #a855f7, #ec4899)", width: "35px",
                                height: "35px"
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-instagram text-white"
                            >
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <h6 className="h6-heading">instagram_user </h6>
                    </div>
                </div>

                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop"
                    alt="Preview" className="img-fluid d-block mx-auto"
                    style={{ objectFit: "contain", width: "100%", height: "100%" }}
                />

                <p className="mt-2">
                    <strong> instagram_user </strong> Take a peek into how we bring ideas to life! Our creative...
                </p>



            </div>
        </div>

        <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
                <div className="p-2 rounded-3 text-center"
                    style={{
                        background: "linear-gradient(to right, rgba(191, 219, 254, 0.23), rgba(204, 251, 241, 0.3))",
                    }}
                >
                    <div className="d-flex align-items-center justify-content-center mb-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-eye text-primary me-1"
                            style={{ width: "16px", height: "16px" }}
                        >
                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span className="small fw-medium text-primary">Reach</span>
                    </div>
                    <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.875rem" }}>9.6K</p>
                </div>
                <div className="p-2 rounded-3 text-center "
                    style={{
                        background: "linear-gradient(to right, rgba(187, 209, 236, 0.1), rgba(204, 251, 241, 0.8))",
                    }}
                >
                    <div className="d-flex align-items-center justify-content-center mb-1">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-trending-up text-purple me-1"
                            style={{ width: "16px", height: "16px" }}
                        >
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                            <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span className="small fw-medium text-purple">Engagement</span>
                    </div>
                    <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.875rem" }}>15.3%</p>
                </div>



            </div>

        </div>
        <div className="card-footer border-0 pt-0">

            <div
                className="d-flex justify-content-between align-items-center pt-2 border-top"
                style={{ fontSize: "0.75rem", color: "#6b7280" }} // text-gray-500
            >
                {/* Likes */}
                <div className="d-flex align-items-center me-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    </svg>
                    <span>436</span>
                </div>

                {/* Comments */}
                <div className="d-flex align-items-center me-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                    </svg>
                    <span>67</span>
                </div>

                {/* Shares */}
                <div className="d-flex align-items-center me-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                    </svg>
                    <span>87</span>
                </div>

                {/* Users */}
                <div className="d-flex align-items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-1"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>45.7K</span>
                </div>
            </div>

            <div className="d-flex gap-1 justify-content-between mt-3">
                {/* View Post Button */}
                <button
                    type="button"
                    className="btn custom-outline-btn  d-flex align-items-center text-xs rounded-pill"
                    style={{ height: "36px", fontSize: "12px", }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="me-2"
                    >
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    </svg>
                    View Post
                </button>

                {/* Copy Button */}
                <button
                    type="button"
                    className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill"
                    style={{ height: "36px" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                    </svg>
                </button>

                {/* Edit Button */}
                <button
                    type="button"
                    className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill"
                    style={{ height: "36px" }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                    </svg>
                </button>
            </div>


        </div>

    </div>
</div>

// second tab cards
{/* facebook */}
<div className="card my-3 published-card-posts">
    <div className="row card-body">
        <div className="col-7">
            <div className="d-flex align-items-center gap-3">
                <div>
                    <div className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-3"
                        style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                            width: "45px", height: "45px" }} >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                        >
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7 a1 1 0 0 1 1-1h3z"></path>
                        </svg>
                    </div>

                </div>
                <div className="d-flex flex-column">
                    <h6 className="mb-1 h6-heading">Industry Report: Digital Transformation Trends</h6>
                    <p className="text-muted mb-2">
                        Our latest research reveals key insights into digital transformation across industries. Download the full report to see what's driving change in 2024.
                    </p>

                    {/* Post Info */}
                    <div className="d-flex align-items-center text-muted small gap-3 mb-2">
                        <span>1 week ago</span>
                        <span> • Facebook</span>
                        <div class="d-inline-flex align-items-center rounded-pill primary-badge  fw-semibold small"> High</div>
                    </div>

                </div>
            </div>
        </div>
        <div className="col-5">
            <div className="d-flex align-items-center">
                <div className="d-flex align-items-center text-muted small mt-2">
                    {/* Views */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>32.7K</span>
                    </div>

                    {/* Likes */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                        </svg>
                        <span>472</span>
                    </div>

                    {/* Comments */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                        </svg>
                        <span>88</span>
                    </div>

                    {/* Trending */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                            <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span>8.2%</span>
                    </div>
                </div>

                <div>

                    <div className="d-flex gap-1 justify-content-between mt-3">
                        {/* View Post Button */}
                        <button
                            type="button"
                            className="btn custom-outline-btn  d-flex align-items-center text-xs rounded-pill"
                            style={{ height: "36px", fontSize: "12px", }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="me-2"
                            >
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14 21 3"></path>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            </svg>
                            View
                        </button>

                        {/* Copy Button */}
                        <button type="button" style={{ height: "36px" }}
                            className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-ellipsis"
                            >
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{/* linkedin */}
<div className="card my-3 published-card-posts">
    <div className="row card-body">
        <div className="col-6">
            <div className="d-flex align-items-center gap-3">
                <div>
                    <div className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-3"
                        style={{
                            background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                            width: "45px",
                            height: "45px"
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
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

                </div>
                <div className="d-flex flex-column">
                    <h6 className="mb-1 h6-heading">5 Marketing Trends to Watch in 2024</h6>
                    <p className="text-muted mb-2">
                        The marketing landscape is evolving rapidly. Here are the top 5 trends that will shape digital marketing in 2024... #Marketing #Trends #2024
                    </p>

                    {/* Post Info */}
                    <div className="d-flex align-items-center text-muted small gap-3 mb-2">
                        <span>2 hours ago</span>
                        <span> • LinkedIn</span>
                        <div class="d-inline-flex align-items-center rounded-pill green-badge  fw-semibold small"> Very High</div>
                    </div>

                </div>
            </div>
        </div>
        <div className="col-6">
            <div className="d-flex align-items-center">
                <div className="d-flex align-items-center text-muted small mt-2">
                    {/* Views */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>12.4K</span>
                    </div>

                    {/* Likes */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                        </svg>
                        <span>234</span>
                    </div>

                    {/* Comments */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                        </svg>
                        <span>18</span>
                    </div>

                    {/* Trending */}
                    <div className="d-flex align-items-center me-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="me-1"
                        >
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                            <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                        <span>7.8%</span>
                    </div>
                </div>

                <div>

                    <div className="d-flex gap-1 justify-content-between mt-3">
                        {/* View Post Button */}
                        <button
                            type="button"
                            className="btn custom-outline-btn  d-flex align-items-center text-xs rounded-pill"
                            style={{ height: "36px", fontSize: "12px", }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="me-2"
                            >
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14 21 3"></path>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            </svg>
                            View
                        </button>

                        {/* Copy Button */}
                        <button
                            type="button"
                            className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill"
                            style={{ height: "36px" }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-ellipsis"
                            >
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                        </button>


                    </div>

                </div>
            </div>
        </div>
    </div>
</div>