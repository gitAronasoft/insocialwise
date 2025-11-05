import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import moment from 'moment';
import { toast } from 'react-toastify';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import DataTable from 'react-data-table-component';
import HoverPostPreviewMultiple from './components/HoverPostPreviewMultiple';
import { useNavigate } from "react-router-dom";

export default function PostsList() {
    ModuleRegistry.registerModules([AllCommunityModule]);
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [selectedPageIds, setSelectedPageIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

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

            // Backend already provides grouped data - just need to sort it properly
            const sortedPosts = sortGroupedPosts(data.posts || []);
            setPosts(sortedPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    };

    // Normalize post date based on status and available fields
    const normalizePostDate = (post = {}) => {
        try {
            const s = String(post.status || '').trim();

            // Published: use week_date if present (YYYY-MM-DD). Parse as UTC midnight.
            if (s === '1') {
                if (post.week_date) {
                    // ensure we parse day-only as UTC to avoid local offset
                    return new Date(`${post.week_date}T00:00:00Z`);
                }
                if (post.published_date) return new Date(post.published_date); // optional field
                if (post.updatedAt) return new Date(post.updatedAt);
                if (post.createdAt) return new Date(post.createdAt);
                return null;
            }

            // Scheduled: schedule_time (seconds) -> convert to ms
            if (s === '2') {
                if (post.schedule_time) {
                    const t = Number(post.schedule_time);
                    if (!Number.isNaN(t) && t > 0) return new Date(t * 1000);
                }
                // fallback
                if (post.updatedAt) return new Date(post.updatedAt);
                if (post.createdAt) return new Date(post.createdAt);
                return null;
            }

            // Draft or unknown: prefer updatedAt
            if (post.updatedAt) return new Date(post.updatedAt);
            if (post.createdAt) return new Date(post.createdAt);
            return null;
        } catch (err) {
            return null;
        }
    };

    // Sort grouped posts based on status and date
    const sortGroupedPosts = (groups = []) => {
        // Normalize groups -> compute per-post date, group date, and displayMode
        const normalized = groups.map(group => {
            const posts = (group.posts || []).map(p => {
                const postDate = normalizePostDate(p); // Date or null
                return { ...p, postDate };
            });

            // timestamps (ms) for valid dates
            const timestamps = posts.map(p => (p.postDate ? p.postDate.getTime() : null)).filter(Boolean);

            // dateSortValue = newest date across posts in group (ms)
            const dateSortValue = timestamps.length ? Math.max(...timestamps) : (group.updatedAt ? new Date(group.updatedAt).getTime() : 0);

            // identify which post gave the dateSortValue (to decide displayMode)
            const latestPost = posts.reduce((best, cur) => {
                const bestTs = best?.postDate?.getTime?.() || 0;
                const curTs = cur?.postDate?.getTime?.() || 0;
                return curTs > bestTs ? cur : best;
            }, posts[0] || null);

            let displayMode = 'draft'; // default
            if (latestPost) {
                const s = String(latestPost.status || '').trim();
                if (s === '1') displayMode = 'published';
                else if (s === '2') displayMode = 'scheduled';
                else displayMode = 'draft';
            }

            const displayDate = dateSortValue ? new Date(dateSortValue) : (group.updatedAt ? new Date(group.updatedAt) : null);

            // preview image reuse existing method
            const previewImage = getGroupPreviewImage(group);
            const firstPost = group.posts?.[0] || {};

            return {
                ...group,
                posts,
                previewImage,
                // pageName: firstPost.pageInfo?.pageName || firstPost.pageName || '',
                // pagePicture: firstPost.pageInfo?.page_picture || firstPost.page_picture || '',
                displayDate,
                dateSortValue,
                displayMode
            };
        });

        // Sort by dateSortValue descending (newest first)
        normalized.sort((a, b) => (b.dateSortValue || 0) - (a.dateSortValue || 0));
        return normalized;
    };

    const getGroupPreviewImage = (group) => {
        const fallbackImg = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
        if (!group || !Array.isArray(group.posts) || group.posts.length === 0) return fallbackImg;

        // Try to find the first post with media
        for (const post of group.posts) {
            if (post.postMedia) {
                try {
                    const media = typeof post.postMedia === 'string' ? 
                        JSON.parse(post.postMedia) : post.postMedia;
                    
                    if (Array.isArray(media) && media.length > 0) {
                        const firstMedia = media[0];
                        if (firstMedia.path) {
                            return `${process.env.REACT_APP_BACKEND_URL}${firstMedia.path}`;
                        }
                        if (firstMedia.img_path) {
                            return `${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${firstMedia.img_path}`;
                        }
                        if (typeof firstMedia === 'string' && firstMedia.startsWith('http')) {
                            return firstMedia;
                        }
                    } else if (media.img_path) {
                        return `${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${media.img_path}`;
                    } else if (typeof media === 'string' && media.startsWith('http')) {
                        return media;
                    }
                } catch (e) {
                    if (typeof post.postMedia === 'string' && post.postMedia.startsWith('http')) {
                        return post.postMedia;
                    }
                }
            }
        }
        
        return fallbackImg;
    };

    const customStyles = {
        rows: {
            style: {
                border: "0 !important",
                margin: "8px 0px",
                height: "100px",
                background: "#fff !important",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0px 9px 20px rgba(46, 35, 94, 0.07)",
                padding: "10px 0",
                boxSize: "border-box !important",
                overflowX: "hidden",
            },
        },
    };
    const conditionalRowStyles = [
        {
        when: row => true, // applies to all rows
            style: {
                "&:hover": { boxShadow:" 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" },
            },
        },
    ];

    // const columns = [
    //     {
    //         headerName: 'Post Content',
    //         field: 'content',
    //         flex: 2,
    //         cellRenderer: ({ data }) => (
    //             <HoverPostPreviewMultiple platform={data.posts?.[0]?.platform?.toLowerCase()} post={data} >
    //                 <div className="d-flex my-2">
    //                     <img src={data.previewImage} alt="preview" style={{ width: '50px', height: '50px', objectFit: 'cover' }} className="rounded-circle"
    //                         onError={(e) => { 
    //                             e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; 
    //                         }} />
    //                     <div className="d-flex flex-column ms-3">
    //                         <p className="mb-0 pb-0">
    //                             {(data.content || "No message").split(' ').slice(0, 8).join(' ')}...
    //                         </p>
    //                         {data.posts && data.posts.length > 1 ? (
    //                             <span style={{ fontSize: '12px' }}>{'Multiple pages'}</span>
    //                         ) : (
    //                             <p style={{ fontSize: '12px' }}>
    //                                 <img src={data.posts[0].pagePicture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} 
    //                                     alt="" style={{ width: '15px', marginRight: '5px' }} className="rounded-circle" />
    //                                 {data.posts[0].pageName || 'Multiple pages'}
    //                             </p>
    //                         )}
    //                     </div>
    //                 </div>
    //             </HoverPostPreviewMultiple>
    //         )
    //     },
    //     {
    //         headerName: 'Platforms',
    //         field: 'platforms',
    //         flex: 1,
    //         cellRenderer: ({ data }) => {
    //             // Ensure posts exist and filter unique platforms
    //             const uniquePosts = data.posts
    //                 ? data.posts.filter((post, index, self) => index === self.findIndex((p) => p.platform === post.platform)) : [];

    //             return (
    //                 <div className="d-flex align-items-center" style={{ gap: 8, flexWrap: 'wrap', margin: "10px 0px" }} >
    //                     {uniquePosts.map((p, idx) => (
    //                         <div key={idx} className={`${p.platform}-profile-img`}
    //                             style={{ width: '24px', height: '24px', borderRadius: "8px", padding: "5px" }} >
    //                             {platformSVGs[p.platform] || (
    //                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
    //                                     <circle cx="12" cy="12" r="10" />
    //                                     <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    //                                     <path d="M2 12h20" />
    //                                 </svg>
    //                             )}
    //                         </div>
    //                     ))}
    //                 </div>
    //             );
    //         }
    //     },
    //     {
    //         headerName: 'Status',
    //         field: 'status',
    //         flex: 1,
    //         cellRenderer: ({ data }) => {
    //             const statuses = (data.posts || []).map(p => p.status || '0');
    //             if (statuses.every(s => s === '0')) {
    //                 return <span className="text-primary">Draft</span>;
    //             } else if (statuses.every(s => s === '1')) {
    //                 return <span className="text-success">Posted</span>;
    //             } else if (statuses.every(s => s === '2')) {
    //                 const now = new Date();
    //                 const scheduledTime = new Date(data.displayDate);
    //                 const isExpired = scheduledTime < now;
    //                 return (
    //                     <span className={ isExpired ? 'text-danger' : 'text-info' }>
    //                         {isExpired ? 'Expired' : 'Scheduled'}
    //                     </span>
    //                 );
    //                 // return <span className="text-info">Scheduled</span>;
    //             } else if (statuses.some(s => s === '1')) {
    //                 return <span className="text-warning">Partially Posted</span>;
    //             } else {
    //                 return <span className="text-secondary">Mixed</span>;
    //             }
    //         }
    //     },
    //     {
    //         headerName: 'Date',
    //         field: 'displayDate',
    //         flex: 1,
    //         // Let grid use our numeric key for sorting
    //         comparator: (valA, valB, nodeA, nodeB) => {
    //             const a = nodeA?.data?.dateSortValue || 0;
    //             const b = nodeB?.data?.dateSortValue || 0;
    //             return b - a; // newest first
    //         },
    //         cellRenderer: ({ data }) => {
    //             if (!data || !data.displayDate) return '-';
    //             if (data.displayMode === 'published') {
    //                 // Published: show day only
    //                 return moment(data.displayDate).format('DD-MMM-YYYY');
    //             }
    //             // Scheduled & Draft: show date + time
    //             return moment(data.displayDate).format('DD-MMM-YYYY, hh:mm A');
    //         }
    //     },
    //     {
    //         headerName: 'Action',
    //         field: 'actions',
    //         flex: 1,
    //         filter: false,
    //         cellRenderer: ({ data }) => (
    //             <ul className="action" style={{ flexDirection: 'row', justifyContent: 'center' }}>
    //                 <li className="edit" style={{ cursor: 'pointer' }}>
    //                     {/* <Link to={{ pathname: '/edit-post', search: `?form_id=${data.form_id}` }}>
    //                         <i className="fa-regular fa-pen-to-square"></i>
    //                     </Link> */}
    //                     <span onClick={() => {handleEdit(data.form_id)} } >
    //                         <i className="fa-regular fa-pen-to-square"></i>
    //                     </span>
    //                 </li>
    //                 <li className="delete" style={{ cursor: 'pointer' }}>
    //                     <span onClick={() => openDeleteModal(data)}>
    //                         <i className="fa-solid fa-trash-can"></i>
    //                     </span>
    //                 </li>
    //             </ul>
    //         )
    //     }
    // ];

    const columns = [
        {
            name: 'Post Content',
            selector: row => row.content || 'No message',
            cell: row => (
                <HoverPostPreviewMultiple platform={row.posts?.[0]?.platform?.toLowerCase()} post={row}>
                    <div className="d-flex my-2">
                        <img src={row.previewImage} alt="preview" style={{ width: '70px', height: '70px', objectFit: 'cover' }} className="rounded"
                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
                        />
                        <div className="d-flex flex-column ms-3">
                            <p className="mb-0 pb-0" style={{ fontSize: '12px' }}>
                                {(row.content || "No message").split(' ').slice(0, 8).join(' ')}...
                            </p>
                            {row.posts && row.posts.length > 1 ? (
                                <span style={{ fontSize: '12px' }}>Multiple pages</span>
                            ) : (
                                <span style={{ fontSize: '12px' }}>
                                    <img src={row.posts?.[0]?.pagePicture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                        alt="" style={{ width: '15px', marginRight: '5px' }} className="rounded-circle" />
                                    {row.posts?.[0]?.pageName || 'Multiple pages'}
                                </span>
                            )}
                        </div>
                    </div>
                </HoverPostPreviewMultiple>
            ),
            sortable: true,
            grow: 2,
        },
        {
            name: 'Platforms',
            selector: row => row.platforms || '',
            cell: row => {
                const uniquePosts = row.posts
                    ? row.posts.filter((post, index, self) => index === self.findIndex((p) => p.platform === post.platform))
                    : [];
                return (
                    <div className="d-flex align-items-center" style={{ gap: 8, flexWrap: 'wrap', margin: "10px 0px" }}>
                        {uniquePosts.map((p, idx) => (
                            <div key={idx} className={`${p.platform}-profile-img`}
                                    style={{ width: '24px', height: '24px', borderRadius: "8px", padding: "5px" }} >
                                {platformSVGs[p.platform] || (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                        <path d="M2 12h20" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                );
            },
            grow: 1,
        },
        {
            name: 'Status',
            selector: row => row.status || '',
            cell: row => {
                const statuses = (row.posts || []).map(p => p.status || '0');
                if (statuses.every(s => s === '0')) return <span className="text-primary">Draft</span>;
                if (statuses.every(s => s === '1')) return <span className="text-success">Posted</span>;
                if (statuses.every(s => s === '2')) {
                    const now = new Date();
                    const scheduledTime = new Date(row.displayDate);
                    const isExpired = scheduledTime < now;
                    return <span className={isExpired ? 'text-danger' : 'text-info'}>{isExpired ? 'Expired' : 'Scheduled'}</span>;
                }
                if (statuses.some(s => s === '1')) return <span className="text-warning">Partially Posted</span>;
                return <span className="text-secondary">Mixed</span>;
            },
        },
        {
            name: 'Date',
            selector: row => row.displayDate || '',
            sortFunction: (a, b) => (b.dateSortValue || 0) - (a.dateSortValue || 0),
            cell: row => {
                if (!row || !row.displayDate) return '-';
                if (row.displayMode === 'published') return moment(row.displayDate).format('DD-MMM-YYYY');
                return moment(row.displayDate).format('DD-MMM-YYYY, hh:mm A');
            },
            grow: 1,
        },
        {
            name: 'Action',
            cell: row => (
                <ul className="action" style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <li className="edit" style={{ cursor: 'pointer' }}>
                        <span onClick={() => handleEdit(row.form_id)}>
                            <i className="fa-regular fa-pen-to-square"></i>
                        </span>
                    </li>
                    <li className="delete" style={{ cursor: 'pointer' }}>
                        <span onClick={() => openDeleteModal(row)}>
                            <i className="fa-solid fa-trash-can"></i>
                        </span>
                    </li>
                </ul>
            ),
            grow: 1,
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ];

    const handleEdit = (formId) => {
        navigate("/edit-post", { state: { formId } });
    };

    const openDeleteModal = (group) => {
        setPostToDelete(group);
        const allPageIds = (group.posts || []).map(p => p.page_id);
        setSelectedPageIds(allPageIds);
        setShowDeleteModal(true);
    };

    const toggleSelectedPages = (pageId) => {
        setSelectedPageIds(prev => {
            if (prev.includes(pageId)) {
                return prev.filter(p => p !== pageId);
            } else {
                return [...prev, pageId];
            }
        });
    };

    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        if (!postToDelete || !selectedPageIds.length) {
            toast.error("Select at least one page to delete.");
            return;
        }

        setDeleting(true);  // disable modal actions
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
            
            toast.success("Selected posts deleted successfully.");
            setShowDeleteModal(false);
            setPostToDelete(null);
            setSelectedPageIds([]);
            fetchPosts();
        } catch (err) {
            console.error("Deletion failed:", err);
            toast.error("Failed to delete selected posts.");
        } finally {
            setDeleting(false);  // enable modal actions again
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
                                    <h1 className="h1-heading">Posts List</h1>
                                </div>
                                {/* <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Posts list</li>
                                    </ol>
                                </div> */}
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-md-12">
                                {/* <div className="ag-theme-alpine mb-4" style={{ height: 600, width: '100%' }}> */}
                                <div className="card table-wrapper p-3" style={{ borderRadius: "12px", padding: "16px", }}>
                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <DataTable 
                                            columns={columns}
                                            data={posts}
                                            customStyles={customStyles}
                                            conditionalRowStyles={conditionalRowStyles}
                                            pagination={true}
                                            responsive={true}
                                            highlightOnHover={true}
                                            striped={true}
                                        />
                                        // <AgGridReact
                                        //     rowData={posts}
                                        //     columnDefs={columns}
                                        //     defaultColDef={{
                                        //         sortable: true,
                                        //         resizable: true,
                                        //         filter: true
                                        //     }}
                                        //     // rowStyle={rowStyle}
                                        //     getRowStyle={getRowStyle}
                                        //     getRowClass={getRowClass}
                                        //     // getRowClass={(params) => params.node.rowIndex % 2 === 0 ? 'table-row-striped' : ''}
                                        //     paginationPageSize={20}
                                        //     pagination={true}
                                        //     rowHeight={80}
                                        //     // suppressHorizontalScroll={false}
                                        //     // domLayout="normal"
                                        //     // rowSelection="multiple"
                                        // />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Delete confirmation modal */}
                    {showDeleteModal && postToDelete && (
                        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                            <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '100%' }}>
                                <h5>Delete Posts from Pages</h5>
                                <hr />
                                <p className="text-danger mb-2">
                                    <strong>Are you sure you want to delete?</strong>
                                </p>
                                <p>
                                    {postToDelete.content && postToDelete.content.split(' ').slice(0, 20).join(' ') + 
                                        (postToDelete.content.split(' ').length > 20 ? '...' : '')}
                                </p>
                                <p><strong>Choose which pages (belonging to this post group) you want to delete the post from:</strong></p>
                                <form onSubmit={handleDeleteSubmit}>
                                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                        {(postToDelete.posts || []).map((p) => {
                                            const pageId = p.page_id;
                                            return (
                                                <div key={pageId} className="form-check d-flex justify-content-between" style={{ padding: '8px 20px' }}>
                                                    <label className="form-check-label d-flex align-items-center" htmlFor={`del-${pageId}`}>
                                                        <img src={p.pageInfo?.page_picture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} 
                                                            alt="" style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 10 }} 
                                                            onError={(e) => {
                                                                e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
                                                            }} />
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{p.pageInfo?.pageName || 'Unknown Page'}</div>
                                                            <div style={{ fontSize: 12, color: '#666' }}>
                                                                {p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : 'Platform'}
                                                            </div>
                                                        </div>
                                                    </label>
                                                    <input type="checkbox" id={`del-${pageId}`} checked={selectedPageIds.includes(pageId)}
                                                        onChange={() => toggleSelectedPages(pageId)} />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-danger" disabled={deleting}>
                                            {deleting ? (
                                                <div className="spinner-border spinner-border-sm text-light" role="status">
                                                    <span className="visually-hidden">Deleting...</span>
                                                </div>
                                            ) : (
                                                "Delete Selected"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        </div>
    );
}