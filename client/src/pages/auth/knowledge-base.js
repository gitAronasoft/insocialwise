import React, { useState, useEffect } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ConnectedUserSocialAccountAndPage from "./components/ConnectedUserSocialAccountAndPage";

// export default function knowledgeBase() {
export default function KnowledgeBase() {   
    
    const [pages, setPages] = useState([
        { id: 1, name: "InSocialWise - Main Page", selected: false },
        { id: 2, name: "Customer Support Hub", selected: false },
        { id: 3, name: "InSocialWise Events", selected: false },
    ]);

    // Select all
    const handleSelectAll = () => {
        setPages(pages.map((p) => ({ ...p, selected: true })));
    };

    // Toggle single page
    const togglePage = (id) => {
        setPages(
        pages.map((p) =>
            p.id === id ? { ...p, selected: !p.selected } : p
        )
        );
    };   

    return (        
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className='d-flex gap-2 align-items-center'>
                                    <div className="facebook-ican">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-database text-primary" >
                                            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                            <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                                            <path d="M3 12A9 3 0 0 0 21 12"></path>
                                        </svg>
                                    </div>
                                    <div className='d-flex flex-column'>
                                        <h1 className='h1-heading'>
                                            Knowledge Base Management
                                        </h1>
                                        <div> <p className='pb-0 mb-0' style={{ fontSize: "16px" }}> Create and manage knowledge base entries for automated responses by platform </p></div>
                                    </div>
                                </div>
                                <div> <span className="primary-badge badge rounded-pill">
                                    2 Entries
                                </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-md-12">
                                <div className="">
                                    <ul className="nav nav-tabs gap-3">
                                        <li className="nav-item">
                                            <button className="nav-link active d-flex align-items-center" data-bs-toggle="tab" data-bs-target="#entries">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                    strokeLinejoin="round" className="me-2" >
                                                    <path d="M12 7v14"></path>
                                                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
                                                </svg> Knowledge Entries
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className="nav-link d-flex align-items-center" data-bs-toggle="tab" data-bs-target="#platforms">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                    className="me-2" >
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                </svg> Connected Platforms
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className="nav-link d-flex align-items-center" data-bs-toggle="tab" data-bs-target="#add">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="me-2" >
                                                    <path d="M5 12h14"></path>
                                                    <path d="M12 5v14"></path>
                                                </svg>  Add New Entry
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="tab-content rounded-bottom mt-4 custom-form-label">
                                    <div className="tab-pane fade show active" id="entries">
                                        <div className="card">
                                            <div className="card-header border-0">
                                                <h5>  Search & Filter </h5>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="form-group w-100"><label>Search Entries</label>
                                                        <div className="position-relative">
                                                            {/* SVG Icon */}
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="position-absolute"
                                                                style={{
                                                                    left: "12px",
                                                                    top: "50%",
                                                                    transform: "translateY(-50%)",
                                                                    width: "18px",
                                                                    height: "18px",
                                                                    color: "#6c757d"
                                                                }}
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle cx="11" cy="11" r="8"></circle>
                                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                            </svg>
                                                            <input
                                                                type="text"
                                                                className="form-control ps-5"
                                                                placeholder="Search bt title, content, or tags..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* <div className="form-group w-100">
                                                        <label htmlFor="categorySelect">Filter by Category</label>
                                                        <select className="form-control" id="categorySelect">
                                                            <option>All Categories</option>
                                                            <option>General</option>
                                                            <option>Pricing</option>
                                                            <option>Support</option>
                                                            <option>Features</option>
                                                            <option>Technical</option>
                                                        </select>
                                                    </div> */}
                                                </div>
                                            </div>
                                        </div>

                                        {/* General Company Information  card     */}
                                        <div className="card">
                                            <div className="card-header border-0 pb-0">
                                                <div className="d-flex justify-content-between">
                                                    <div className="flex-grow">
                                                        <h5> General Company Information </h5>
                                                        <div className="d-flex gap-2 pt-2 mb-3 align-items-center">
                                                            <div className="d-inline-flex align-items-center rounded-pill border px-2   py-1 fw-semibold text-dark small"> General </div>
                                                            <p className="text-muted small mb-0">
                                                                Created: 2024-01-15
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <button type="button" data-bs-toggle="collapse" href="#collapseExample" className="custom-outline-btn  btn  d-inline-flex  align-items-center justify-content-center gap-2 rounded px-3 py-2"  >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                <path d="M12 20h9"></path>
                                                                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"> </path>
                                                                {/* <a class="btn btn-primary" data-bs-toggle="collapse" href="#collapseExample" role="button" aria-expanded="false" aria-controls="collapseExample"> Link </a> */}
                                                            </svg>
                                                        </button>
                                                        <button type="button" className="custom-outline-btn  btn d-inline-flex align-items-center justify-content-center gap-2  rounded px-3 py-2 text-danger">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                <path d="M3 6h18"></path>
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                <line x1="10" x2="10" y1="11" y2="17"></line>
                                                                <line x1="14" x2="14" y1="11" y2="17"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="flex-grow">
                                                    <p className="text-dark mb-0" style={{ fontSize: '14px' }}>
                                                        We are a leading social media management platform that helps businesses grow their online presence...
                                                    </p>
                                                </div>

                                                <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                                                    <div className="d-flex gap-2">
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">
                                                            #company
                                                        </span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">
                                                            #about
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted small mb-0 d-flex align-items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                                                                <path d="M2 12h20"></path>
                                                            </svg>  All Platforms
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* modal General Company Information  card */}
                                            <div className="card custom-form-label border m-3 collapse" id="collapseExample">
                                                <div className="card-header border-0">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>  <h6 className="text-primary"> Editing Entry </h6> </div>
                                                        <div className="d-flex gap-2">
                                                            <button type="button" className=" btn btn-primary d-inline-flex  align-items-center justify-content-center gap-1 rounded px-3 py-2"  >
                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="lucide lucide-save h-4 w-4 me-2"
                                                                >
                                                                    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                                                                    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                                                                    <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
                                                                </svg> Save
                                                            </button>
                                                            <button type="button" className="custom-outline-btn  btn d-inline-flex align-items-center justify-content-center gap-2  rounded px-3 py-2">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="form-group w-100"><label>Title</label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                    <div className="form-group w-100 mt-3">
                                                        <label htmlFor="categorySelect">Filter by Category</label>
                                                        <select className="form-control" id="categorySelect">
                                                            <option>All Categories</option>
                                                            <option>General</option>
                                                            <option>Pricing</option>
                                                            <option>Support</option>
                                                            <option>Features</option>
                                                            <option>Technical</option>
                                                        </select>
                                                    </div>

                                                    <div className="form-group w-100 mt-3"><label>Content</label>
                                                        <textarea type="text" className="form-control" rows={4} />
                                                    </div>

                                                    <div className="form-group w-100 mt-3"><label>Tags (comma-separated)</label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* modal General Company Information  card end */}
                                        </div>

                                        {/* Pricing Information */}
                                        <div className="card ">
                                            <div className="card-header border-0 pb-0">
                                                <div className="d-flex justify-content-between">
                                                    <div className="flex-grow">
                                                        <h5> Pricing Information </h5>
                                                        <div className="d-flex gap-2 pt-2 mb-3 align-items-center">
                                                            <div className="d-inline-flex align-items-center rounded-pill border px-2   py-1 fw-semibold text-dark small"> Pricing </div>
                                                            <p className="text-muted small mb-0">
                                                                Created: 2024-01-16
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <button type="button" className="custom-outline-btn  btn  d-inline-flex  align-items-center justify-content-center gap-2 rounded px-3 py-2"  >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                <path d="M12 20h9"></path>
                                                                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"></path>
                                                            </svg>
                                                        </button>
                                                        <button type="button" className="custom-outline-btn  btn d-inline-flex align-items-center justify-content-center gap-2  rounded px-3 py-2 text-danger">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1" >
                                                                <path d="M3 6h18"></path>
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                                <line x1="10" x2="10" y1="11" y2="17"></line>
                                                                <line x1="14" x2="14" y1="11" y2="17"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">
                                                <div className="flex-grow">
                                                    <p className="text-dark mb-0" style={{ fontSize: '14px' }}>
                                                        Our pricing plans start at $29/month for the Basic plan, $79/month for Pro, and $199/month for Enterprise...
                                                    </p>
                                                </div>

                                                <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                                                    <div className="d-flex gap-2">
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">
                                                            #pricing
                                                        </span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">
                                                            #plans
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted small mb-0 d-flex align-items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                                                                <path d="M2 12h20"></path>
                                                            </svg>  2 Platform(s)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tab-pane fade" id="platforms">
                                        {/* Connected Platform */}                                                                                
                                        <ConnectedUserSocialAccountAndPage />                                  
                                    </div>
                                    <div className="tab-pane fade" id="add">
                                        <div className="card">
                                            <div className="card-header border-0">
                                                <h5 className="d-flex align-items-center gap-1"> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="me-2">
                                                    <path d="M5 12h14"></path>
                                                    <path d="M12 5v14"></path>
                                                </svg> Add New Knowledge Base Entry
                                                </h5>
                                            </div>

                                            <div className="card-body pt-0">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="form-group w-100"><label>Entry Title</label>
                                                        <input type="text" className="form-control"
                                                            placeholder="e.g Pricing information"
                                                        />
                                                    </div>
                                                    {/* <div className="form-group w-100">
                                                        <label htmlFor="categorySelect">Category</label>
                                                        <select className="form-control" id="categorySelect">
                                                            <option>All Categories</option>
                                                            <option>General</option>
                                                            <option>Pricing</option>
                                                            <option>Support</option>
                                                            <option>Features</option>
                                                            <option>Technical</option>
                                                        </select>
                                                    </div> */}
                                                </div>
                                                <div className="form-group w-100 mt-3"><label>Knowledge Base</label>
                                                    <textarea type="text" className="form-control"
                                                        placeholder="Enter the knowledge base content that will be uesd for automated responses..." rows={4}
                                                    />
                                                </div>
                                                <div className="form-group w-100 mt-3"><label>Target Platforms & Pages</label>
                                                    <div className="position-relative">                                                        
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="position-absolute"
                                                            style={{
                                                                left: "12px",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                width: "18px",
                                                                height: "18px",
                                                                color: "#6c757d"
                                                            }}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                                                            <path d="M2 12h20"></path>
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            className="form-control ps-5"
                                                            placeholder="Search bt title, content, or tags..."
                                                        />                                                        
                                                    </div>
                                                </div> 

                                                {/* <p className="text-dark mb-0 mt-3" style={{ fontSize: '14px' }}>
                                                        Or select specific platforms and pages:
                                                    </p> */}
                                                
                                                <p className="text-dark mb-0 mt-3 pb-2" style={{ fontSize: '14px' }}>
                                                    Or select specific platforms and pages:
                                                </p>
                                                <div className="card border form-group w-100  ">
                                                    <div className="card-header border-0 card-body">
                                                       
                                                        <div className="container">
                                                            {/* Collapse Trigger */}
                                                            <div
                                                                className="card mb-0 border p-2 d-flex cursor-pointer rounded-3"
                                                                data-bs-toggle="collapse"
                                                                href="#collapseExample"
                                                            >
                                                                <div className="d-flex align-items-center gap-2">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    className="lucide lucide-facebook"
                                                                >
                                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                                                </svg>
                                                                <span>Facebook</span>
                                                                </div>
                                                            </div>

                                                            {/* Collapse Content */}
                                                            <div className="collapse mt-2" id="collapseExample">
                                                                <div className="">
                                                                <div className="d-flex align-items-center justify-content-between my-3"> 

                                                                    <p className="text-muted small mb-0">
                                                                Choose specific pages (0/3 selected):
                                                                </p>
                                                                {/* All Select Button */}

                                                                <button
                                                                    className="btn btn-sm btn-success mb-2"
                                                                    onClick={handleSelectAll}
                                                                >
                                                                    Select All
                                                                </button>
                                                                
                                                                </div>
                                                                {/* Pages List */}

                                                                
                                                                <div className="d-grid gap-2">
                                                                    {pages.map((page) => (
                                                                    <div
                                                                        key={page.id}
                                                                        className={`d-flex align-items-center justify-content-between p-2 rounded border ${
                                                                        page.selected
                                                                            ? "border-success bg-success bg-opacity-10"
                                                                            : "border-secondary"
                                                                        } cursor-pointer`}
                                                                        onClick={() => togglePage(page.id)}
                                                                    >
                                                                        <div className="d-flex align-items-center">
                                                                        <div
                                                                            className={`d-flex align-items-center justify-content-center rounded-circle me-2 ${
                                                                            page.selected ? "bg-success" : "bg-secondary"
                                                                            }`}
                                                                            style={{ width: "12px", height: "12px" }}
                                                                        >
                                                                            {page.selected && (
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="10"
                                                                                height="10"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="white"
                                                                                strokeWidth="3"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <path d="M20 6 9 17l-5-5"></path>
                                                                            </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className="small">{page.name}</span>
                                                                        </div>
                                                                        {page.selected && (
                                                                        <span className="text-success small fw-medium">
                                                                            Auto-replies enabled
                                                                        </span>
                                                                        )}
                                                                    </div>
                                                                    ))}
                                                                </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>


                                                </div>

                                                 <div className="card border form-group w-100  ">
                                                    <div className="card-header border-0 card-body">
                                                       
                                                        <div className="container">
                                                            {/* Collapse Trigger */}
                                                            <div
                                                                className="card mb-0 border p-2 d-flex cursor-pointer rounded-3"
                                                                data-bs-toggle="collapse"
                                                                href="#linkedIn"
                                                            >
                                                                <div className="d-flex align-items-center gap-2">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    className="lucide lucide-facebook"
                                                                >
                                                                   <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                                    <rect width="4" height="12" x="2" y="9"></rect>
                                                                    <circle cx="4" cy="4" r="2"></circle>
                                                                </svg>
                                                                <span>LinkedIn</span>
                                                                </div>
                                                            </div>

                                                            {/* Collapse Content */}
                                                            <div className="collapse mt-2" id="linkedIn">
                                                                <div className="">
                                                                 <div className="d-flex align-items-center justify-content-between my-3"> 

                                                                    <p className="text-muted small mb-0">
                                                                Choose specific pages (0/3 selected):
                                                                </p>
                                                                {/* All Select Button */}

                                                                <button
                                                                    className="btn btn-sm btn-success mb-2"
                                                                    onClick={handleSelectAll}
                                                                >
                                                                    Select All
                                                                </button>
                                                                
                                                                </div>

                                                                {/* Pages List */}

                                                                
                                                                <div className="d-grid gap-2">
                                                                    {pages.map((page) => (
                                                                    <div
                                                                        key={page.id}
                                                                        className={`d-flex align-items-center justify-content-between p-2 rounded border ${
                                                                        page.selected
                                                                            ? "border-success bg-success bg-opacity-10"
                                                                            : "border-secondary"
                                                                        } cursor-pointer`}
                                                                        onClick={() => togglePage(page.id)}
                                                                    >
                                                                        <div className="d-flex align-items-center">
                                                                        <div
                                                                            className={`d-flex align-items-center justify-content-center rounded-circle me-2 ${
                                                                            page.selected ? "bg-success" : "bg-secondary"
                                                                            }`}
                                                                            style={{ width: "12px", height: "12px" }}
                                                                        >
                                                                            {page.selected && (
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="10"
                                                                                height="10"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="white"
                                                                                strokeWidth="3"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <path d="M20 6 9 17l-5-5"></path>
                                                                            </svg>
                                                                            )}
                                                                        </div>
                                                                        <span className="small">{page.name}</span>
                                                                        </div>
                                                                        {page.selected && (
                                                                        <span className="text-success small fw-medium">
                                                                            Auto-replies enabled
                                                                        </span>
                                                                        )}
                                                                    </div>
                                                                    ))}
                                                                </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>


                                                </div>                    
                                                


                                                <div className="form-group w-100 mt-3"><label>Tags (comma-separated)</label>
                                                    <input type="text" className="form-control"
                                                        placeholder="e.g. pricing, plans, cost"
                                                    />

                                                </div>

                                                <div className="mt-4"> 
                                                    <div className="d-flex gap-3 text-end justify-content-end ">
                                                        <button type="button" className="custom-outline-btn  btn  d-inline-flex  align-items-center justify-content-center gap-2 rounded px-3 py-2"  >
                                                         Clear

                                                        </button>

                                                        {/* <button type="button" className="custom-outline-btn  btn d-inline-flex align-items-center justify-content-center gap-2  rounded px-3 py-2">
                                                            
                                                            Save
                                                        </button> */}

                                                        <button className="btn rounded-3 btn-primary d-flex align-items-center  justify-content-center"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" class="lucide lucide-save h-4 w-4 me-3 "><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path></svg> Save Entry </button>

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
    )
}
