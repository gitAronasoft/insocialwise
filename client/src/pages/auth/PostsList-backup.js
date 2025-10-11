import React, { useState,useEffect } from "react";
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import moment from 'moment';
import { toast } from 'react-toastify';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import HoverPostPreview from './components/HoverPostPreview';

export default function PostsList() {
    ModuleRegistry.registerModules([AllCommunityModule]);
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [selectedPageIds, setSelectedPageIds] = useState([]);

    useEffect(() => {
        fetchPosts();
    }, []);

    // const fetchPosts = async () => {
    //     const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    //     const authToken = localStorage.getItem('authToken');
    //     setLoading(true);
    //     try {
    //         const response = await fetch(`${BACKEND_URL}/api/posts`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': 'Bearer ' + authToken,
    //             },
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }

    //         const data = await response.json();

    //         if (data && Array.isArray(data.userPosts)) {
    //             const formattedPosts = data.userPosts.map(post => {
    //                 let scheduledTime;
    //                 let sortTimestamp;

    //                 if (post.schedule_time) {
    //                     const scheduleTimestamp = Number(post.schedule_time);
    //                     scheduledTime = new Date(scheduleTimestamp * 1000); // from seconds to ms
    //                     sortTimestamp = scheduledTime.getTime();
    //                 } else if (post.week_date) {
    //                     scheduledTime = new Date(post.week_date);
    //                     sortTimestamp = scheduledTime.getTime();
    //                 } else {
    //                     scheduledTime = new Date(post.updatedAt);
    //                     sortTimestamp = scheduledTime.getTime();
    //                 }

    //                 return {
    //                     content: post.content || "No message",
    //                     start: scheduledTime,
    //                     end: scheduledTime,
    //                     sortTimestamp,
    //                     postPageID: post.page_id,
    //                     postID: post.id,
    //                     source: post.source,
    //                     user_uuid: post.user_uuid,
    //                     postMedia: post.post_media || null,
    //                     postStatus: post.status,
    //                     platform: post.platform,
    //                     platform_post_id: post.platform_post_id,
    //                     token: post.socialPages?.[0]?.token,
    //                     postPageName: post.socialPages?.[0]?.pageName,
    //                     postPagePicture: post.socialPages?.[0]?.page_picture,
    //                     createdAt: post.createdAt,
    //                     published_date: post.week_date || null,
    //                     draft_date: post.updatedAt || null,
    //                 };
    //             });

    //             // Descending sort: future first, past last
    //             const sortedPosts = formattedPosts.sort(
    //                 (a, b) => b.sortTimestamp - a.sortTimestamp
    //             );

    //             setPosts(sortedPosts);
    //         } else {
    //             console.error("No posts data found or invalid structure");
    //         }
    //     } catch (error) {
    //         console.error("Error fetching posts:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchPosts = async () => {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken,
                },
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            // Backend may return grouped posts as data.posts OR older flat list as data.userPosts
            const rawGroups = data.posts || data.userPosts || [];

            let grouped = [];

            if (data.posts) {
                // Already grouped at backend: ensure normalization
                grouped = (data.posts || []).map(g => ({
                    form_id: g.form_id || null,
                    content: g.content || "",
                    createdAt: g.createdAt,
                    updatedAt: g.updatedAt,
                    schedule_time: g.schedule_time || null,
                    posts: (g.posts || []).map(p => ({
                        postID: p.id || p.postID || null,
                        page_id: p.page_id || p.pageId || null,
                        pageName: p.pageInfo?.pageName || p.pageName || p.page_name || '',
                        pagePicture: p.pageInfo?.page_picture || p.page_picture || '',
                        token: p.pageInfo?.token || null,
                        platform: p.platform || p.post_platform || p.platform_name || '',
                        platform_post_id: p.platform_post_id || p.platform_postid || p.platform_post_id || null,
                        post_media: p.post_media || p.postMedia || null,
                        status: p.status || '0'
                    }))
                }));
            } else {
                // data.userPosts is a flat list: group by form_id
                const groupedMap = {};
                for (const post of rawGroups) {
                    const formKey = post.form_id || post.formId || String(post.id);
                    if (!groupedMap[formKey]) {
                        groupedMap[formKey] = {
                            form_id: formKey,
                            content: post.content || "",
                            createdAt: post.createdAt,
                            updatedAt: post.updatedAt,
                            schedule_time: post.schedule_time || null,
                            posts: []
                        };
                    }
                    const pageInfo = (post.socialPages && post.socialPages[0]) || {};
                    groupedMap[formKey].posts.push({
                        postID: post.id,
                        page_id: post.page_id,
                        pageName: pageInfo.pageName || '',
                        pagePicture: pageInfo.page_picture || '',
                        token: pageInfo.token || '',
                        platform: post.post_platform || post.platform || '',
                        platform_post_id: post.platform_post_id || '',
                        post_media: post.post_media || '',
                        status: post.status || '0'
                    });
                }
                grouped = Object.values(groupedMap);
            }

            // Derive preview fields to be used in grid rows
            const formatted = grouped.map(g => {
                // choose first post's page as representative for preview image/name
                const first = g.posts[0] || {};
                const previewImage = getGroupPreviewImage(g);
                const nextDate = g.schedule_time ? new Date(Number(g.schedule_time) * 1000) : (g.week_date ? new Date(g.week_date) : new Date(g.updatedAt));
                return {
                    ...g,
                    previewImage,
                    postPageName: first.pageName || '',
                    postPagePicture: first.pagePicture || '',
                    token: first.token || '',
                    sortTimestamp: nextDate.getTime(),
                };
            });

            // Sort descending by createdAt/sortTimestamp
            const sorted = formatted.sort((a, b) => (b.sortTimestamp || 0) - (a.sortTimestamp || 0));

            setPosts(sorted);

        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    };

    const getGroupPreviewImage = (group) => {
        // Try to get an image from first post's post_media
        const fallbackImg = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
        if (!group || !Array.isArray(group.posts) || group.posts.length === 0) return fallbackImg;

        const first = group.posts[0];
        const mediaStr = first.post_media;
        if (!mediaStr) return fallbackImg;

        try {
            // If it's a JSON array or object string
            const parsed = typeof mediaStr === 'string' ? JSON.parse(mediaStr) : mediaStr;
            // if array of objects with file or path
            if (Array.isArray(parsed) && parsed.length > 0) {
                const candidate = parsed[0];
                // if candidate has path or img_path
                if (candidate.path) return `${process.env.REACT_APP_BACKEND_URL}${candidate.path}`;
                if (candidate.img_path) return `${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${candidate.img_path}`;
                if (typeof candidate === 'string' && candidate.startsWith('http')) return candidate;
            } else if (parsed && parsed.img_path) {
                return `${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${parsed.img_path}`;
            } else if (typeof parsed === 'string' && parsed.startsWith('http')) {
                return parsed;
            }
        } catch (e) {
            // not JSON — maybe it's a direct URL
            if (typeof mediaStr === 'string' && mediaStr.startsWith('http')) return mediaStr;
        }
        return fallbackImg;
    };

    const getPostImage = (post) => {
        const fallbackImg = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

        if (post.source === 'Platform') {
            if (isJSON(post.postMedia)) {
                const mediaObj = JSON.parse(post.postMedia);
                if (mediaObj?.img_path) {
                    return `${BACKEND_URL}/uploads/posts/${mediaObj.img_path}`;
                }
            } else if (isHttpsUrl(post.postMedia)) {
                return post.postMedia;
            }
        } else if (post.source === 'API' && isHttpsUrl(post.postMedia)) {
            return post.postMedia;
        }

        return fallbackImg;
    };

    // const columns = [
    //     {
    //         headerName: 'Post Content',
    //         field: 'content',
    //         flex: 2,
    //         cellRenderer: ({ data }) => (
    //             <HoverPostPreview platform={data.platform?.toLowerCase()} post={data}>
    //                 <div className="d-flex my-2">
    //                     {/* Render image preview + content like your original table */}
    //                     <img src={getPostImage(data)} alt="preview" style={{ width: '50px', height: '50px', objectFit: 'cover' }} className="rounded-circle"
    //                         onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>
    //                     <div className="d-flex flex-column ms-3">
    //                         <p className="mb-0 pb-0">
    //                             {data.content.split(' ').slice(0, 4).join(' ')}...
    //                         </p>
    //                         <p style={{ fontSize: '12px' }}>
    //                             <img src={data.postPagePicture} alt="" style={{ width: '15px', marginRight: '5px' }} className="rounded-circle" />
    //                             {data.postPageName}
    //                         </p>
    //                     </div>
    //                 </div>
    //             </HoverPostPreview>
    //         )
    //     },
    //     {
    //         headerName: 'Platform',
    //         field: 'platform',
    //         flex: 1,
    //         cellRenderer: ({ data }) => {
    //             return (
    //                 <p className={
    //                     data.platform === 'facebook' ? 'badge bg-primary' :
    //                     data.platform === 'instagram' ? 'badge bg-danger' :
    //                     data.platform === 'linkedin' ? 'badge bg-info' :
    //                     'badge bg-secondary'
    //                 }>
    //                     {data.platform ? data.platform.charAt(0).toUpperCase() + data.platform.slice(1) : 'Unknown'}
    //                 </p>
    //             );
    //         }
    //     },
    //     {
    //         headerName: 'Status',
    //         field: 'postStatus',
    //         flex: 1,
    //         cellRenderer: ({ data }) => {
    //         const status = data.postStatus;
    //         if (status === '0') return <span className="text-danger">Draft</span>;
    //         if (status === '1') return <span className="text-success">Posted</span>;
    //         return moment(data.start).isBefore(moment())
    //             ? <span className="text-danger">Expired</span>
    //             : <span className="text-info">Post Later</span>;
    //         }
    //     },
    //     {
    //         headerName: 'Date Published',
    //         field: 'published_date',
    //         flex: 1,
    //         cellRenderer: ({ data }) => {
    //             const status = data.postStatus;
    //             return (
    //                 <span>
    //                     {
    //                         status === '0' ? moment(data.draft_date).format('DD-MMM-YYYY, hh:mm A') : 
    //                         status === '1' ? moment(data.published_date).format('DD-MMM-YYYY') : 
    //                         moment(data.start).format('DD-MMM-YYYY, hh:mm A')
    //                     }
    //                 </span>
    //             );
    //         }
    //     },
    //     {
    //         headerName: 'Action',
    //         field: 'actions',
    //         flex: 1,
    //         filter: false,
    //         cellRenderer: ({ data }) => (
    //         <ul className="action" style={{ flexDirection: 'row', justifyContent: 'center' }}>
    //             <li className="edit">
    //                 {/* <Link to={{ pathname: '/edit-post', search: `?asset_id=${data.postPageID}&ref=${data.postID}` }}>
    //                     <i className="fa-regular fa-pen-to-square"></i>
    //                 </Link> */}
    //                 <Link to={{ pathname: '/edit-post', search: `?form_id=${data.form_id}` }}>
    //                     <i className="fa-regular fa-pen-to-square"></i>
    //                 </Link>
    //             </li>
    //             <li className="delete" style={{ cursor: 'pointer' }}>
    //                 <span onClick={() => {
    //                     setPostToDelete(data);
    //                     setShowDeleteModal(true);
    //                 }}>
    //                     <i className="fa-solid fa-trash-can"></i>
    //                 </span>
    //             </li>
    //         </ul>
    //         )
    //     }
    // ];

    const columns = [
        {
            headerName: 'Post Content',
            field: 'content',
            flex: 2,
            cellRenderer: ({ data }) => (
                <HoverPostPreview platform={data.posts?.[0]?.platform?.toLowerCase()} post={data}>
                    <div className="d-flex my-2">
                        <img src={data.previewImage} alt="preview" style={{ width: '50px', height: '50px', objectFit: 'cover' }} className="rounded-circle"
                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                        <div className="d-flex flex-column ms-3">
                            <p className="mb-0 pb-0">
                                {(data.content || "No message").split(' ').slice(0, 8).join(' ')}...
                            </p>
                            <p style={{ fontSize: '12px' }}>
                                <img src={data.postPagePicture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="" style={{ width: '15px', marginRight: '5px' }} className="rounded-circle" />
                                {data.postPageName || 'Multiple pages'}
                            </p>
                        </div>
                    </div>
                </HoverPostPreview>
            )
        },
        {
            headerName: 'Platforms',
            field: 'platforms',
            flex: 1,
            cellRenderer: ({ data }) => (
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    {data.posts?.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className={
                                p.platform === 'facebook' ? 'badge bg-primary' :
                                p.platform === 'instagram' ? 'badge bg-danger' :
                                p.platform === 'linkedin' ? 'badge bg-info' : 'badge bg-secondary'
                            } style={{ padding: '0.25em 0.5em', fontSize: '0.75rem' }}>
                                {p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'Unknown'}
                            </span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            headerName: 'Status',
            field: 'status',
            flex: 1,
            cellRenderer: ({ data }) => {
                // Determine aggregated status for group
                const statuses = (data.posts || []).map(p => p.status || '0');
                const allDraft = statuses.every(s => s === '0');
                const allPosted = statuses.every(s => s === '1');
                if (allDraft) return <span className="text-danger">Draft</span>;
                if (allPosted) return <span className="text-success">Posted</span>;
                // mixed
                if (statuses.some(s => s === '1')) return <span className="text-warning">Partially Posted</span>;
                return <span className="text-info">Scheduled</span>;
            }
        },
        {
            headerName: 'Date Published',
            field: 'published_date',
            flex: 1,
            cellRenderer: ({ data }) => {
                if (data.postStatus === '0')
                    return moment(data.draft_date).format('DD-MMM-YYYY, hh:mm A');
                if (data.postStatus === '1' && data.published_date)
                    return moment(data.published_date).format('DD-MMM-YYYY');
                if (data.schedule_time)
                    return moment(new Date(Number(data.schedule_time) * 1000)).format('DD-MMM-YYYY, hh:mm A');
                return moment(data.createdAt).format('DD-MMM-YYYY, hh:mm A');
            }
        },
        {
            headerName: 'Action',
            field: 'actions',
            flex: 1,
            filter: false,
            cellRenderer: ({ data }) => (
                <ul className="action" style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <li className="edit">
                        <Link to={{ pathname: '/edit-post', search: `?form_id=${data.form_id}` }}>
                            <i className="fa-regular fa-pen-to-square"></i>
                        </Link>
                    </li>
                    <li className="delete" style={{ cursor: 'pointer' }}>
                        <span onClick={() => openDeleteModal(data)}>
                            <i className="fa-solid fa-trash-can"></i>
                        </span>
                    </li>
                </ul>
            )
        }
    ];

    // const handleDelete = () => {
    //     if (postToDelete) {
    //         deletePost(postToDelete.postID, postToDelete.platform_post_id, postToDelete.token);
    //         setShowDeleteModal(false);
    //     }
    // };

    // const deletePost = async (post_ID, platform_post_id, postPageToken) => {
    //     setLoading(true);

    //     const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    //     const token = localStorage.getItem('authToken');
    //     const pageAccessToken = postPageToken;
    //     const platformPostID = platform_post_id;

    //     try {
    //         const response = await fetch(`${BACKEND_URL}/api/post-delete`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ postID: post_ID, accessToken:pageAccessToken, platformPostID:platformPostID }),
    //         });

    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }

    //         const data = await response.json();
    //         if (data && Array.isArray(data.userPostlist)) {
    //             fetchPosts();
    //             setShowDeleteModal(false);
    //             toast.success(`✅ Posted deleted successfully. `,
    //                 {
    //                     position: 'top-center',
    //                     autoClose: 4000,
    //                 });
    //         } else {
    //             toast.success(`✅ Posted deleted successfully. `,
    //                 {
    //                     position: 'top-center',
    //                     autoClose: 4000,
    //                 });
    //         }
    //     } catch (error) {
    //         console.error("Post deletion failed:", error.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Open modal, preselect all pages in group
    const openDeleteModal = (group) => {
        setPostToDelete(group);
        const allPageIds = (group.posts || []).map(p => p.page_id || p.pageId || p.pageID);
        setSelectedPageIds(allPageIds);
        setShowDeleteModal(true);
    };

    // toggleSelectedPages implementation (fixes the undefined error)
    const toggleSelectedPages = (pageId) => {
        setSelectedPageIds(prev => {
            if (!prev) return [pageId];
            if (prev.includes(pageId)) return prev.filter(p => p !== pageId);
            return [...prev, pageId];
        });
    };

    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        if (!postToDelete) return;
        if (!selectedPageIds || selectedPageIds.length === 0) {
            toast.error("Select at least one page to delete.");
            return;
        }

        setLoading(true);
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');

        try {
            const payload = {
                form_id: postToDelete.form_id,
                pageIds: selectedPageIds
            };

            const response = await fetch(`${BACKEND_URL}/api/post-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            toast.success("Selected pages deleted successfully.");
            setShowDeleteModal(false);
            setPostToDelete(null);
            setSelectedPageIds([]);
            fetchPosts();
        } catch (err) {
            console.error("Deletion failed:", err);
            toast.error("Failed to delete selected pages.");
        } finally {
            setLoading(false);
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
                                    <h3>Posts List</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Posts list</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="ag-theme-alpine mb-4" style={{ height: 600, width: '100%' }}>
                                    <AgGridReact
                                        rowData={posts}
                                        columnDefs={columns}
                                        defaultColDef={{
                                            sortable: true,
                                            resizable: true,
                                            filter: true
                                        }}
                                        // getRowClass={(params) => {
                                        //     return params.node.rowIndex % 2 === 0 ? 'table-row-striped' : '';
                                        // }}
                                        getRowClass={(params) => params.node.rowIndex % 2 === 0 ? 'table-row-striped' : ''}
                                        paginationPageSize={20}
                                        pagination={true}
                                        rowHeight={80}
                                        domLayout="normal"
                                        suppressHorizontalScroll={false}
                                        rowSelection="multiple"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
                {/* Add this delete confirmation modal */}
                {/* {showDeleteModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
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
                )} */}
                {showDeleteModal && postToDelete && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '100%' }}>
                            <h5>Delete Posts from Pages</h5>
                            <hr />
                            <p className="text-danger">
                                Are you sure you want to delete "<strong>{postToDelete?.content.split(' ').slice(0, 3).join(' ') + (postToDelete?.content.split(' ').length > 3 ? '...' : '')}</strong>" ?
                            </p>
                            <p>Choose which pages (belonging to this post group) you want to delete the post from:</p>

                            <form onSubmit={handleDeleteSubmit}>
                                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                    {(postToDelete.posts || []).map((p) => {
                                        const pageId = p.page_id || p.pageId || p.pageID;
                                        return (
                                            <div key={pageId} className="form-check d-flex justify-content-between" style={{ padding: '8px 20px' }}>
                                                <label className="form-check-label d-flex align-items-center" htmlFor={`del-${pageId}`}>
                                                    <img src={p.pagePicture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="" style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 10 }} />
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{p.pageName || 'Unknown Page'}</div>
                                                        <div style={{ fontSize: 12, color: '#666' }}>{p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'Platform'}</div>
                                                    </div>
                                                </label>
                                                <input type="checkbox" id={`del-${pageId}`} checked={selectedPageIds.includes(pageId)}
                                                    onChange={() => toggleSelectedPages(pageId)} />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-danger">Delete Selected</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
