import React, { useState, useEffect } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { Link } from "react-router-dom";

export default function reports() {
   
  
    return (
        <div className="page-wrapper compact-wrapper">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">
                    {/* {fullScreenLoader && (
                        <div className="fullscreen-loader-overlay">
                            <div className="fullscreen-loader-content">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>                                
                            </div>
                        </div>
                    )} */}
                    <div className="container-fluid">
                        <div className="page-title">           
                            <div className="d-flex align-items-center">
                                <div>
                                    <h1 className="mb-0 h1-heading">Reports Generator</h1>
                                    <p> Create custom analytics reports with your data </p>
                                </div>                               
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid">
                        <div className="row"> 
                            <div className="col-md-7 col-xl-8">                                
                                <div className="card">  
                                    <div className="card-header border-0"> 
                                        <h5 className="h5-heading"> Choose Report Template</h5>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="report-card active mb-3 p-4 cursor-pointer bg-white bg-gradient d-flex flex-column"
                                            style={{
                                                background: "linear-gradient(to right, rgba(249,250,251,0.8), rgba(255,255,255,0.8))",
                                                transition: "all 0.3s ease",
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start  w-100">
                                                {/* Left Content */}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <h6 className="fw-semibold mb-0 text-dark">Weekly Performance Report</h6>
                                                        <span className="badge ms-2 px-3 py-1"
                                                            style={{ background: "linear-gradient(to right, #f97316, #ea580c)", fontWeight:"600",fontSize:"12px" }}
                                                        >
                                                            Popular
                                                        </span>
                                                    </div>
                                                    <p className="text-muted mb-3">
                                                        Comprehensive weekly analytics with key metrics and trends
                                                    </p>
                                                    {/* Tags */}
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Reach</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Engagement</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Followers</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">+1 more</span>
                                                    </div>
                                                </div>
                                                {/* Right Content */}
                                                <div className="text-end ms-3">
                                                    <span class="primary-badge badge rounded-pill py-1">Weekly</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="report-card my-3 p-4 cursor-pointer bg-white bg-gradient d-flex flex-column"
                                            style={{
                                                background: "linear-gradient(to right, rgba(249,250,251,0.8), rgba(255,255,255,0.8))",
                                                transition: "all 0.3s ease",
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start  w-100">
                                                {/* Left Content */}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <h6 className="fw-semibold mb-0 text-dark">
                                                            Monthly Growth Summary
                                                        </h6>
                                                        <span className="badge ms-2 px-3 py-1"
                                                            style={{ background: "linear-gradient(to right, #f97316, #ea580c)", fontWeight:"600",fontSize:"12px" }}
                                                        >
                                                            Popular
                                                        </span>
                                                    </div>
                                                    <p className="text-muted mb-3">
                                                        Monthly growth analysis with detailed insights and recommendations
                                                    </p>
                                                    {/* Tags */}
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Growth Rate</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Audience Demographics</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Top Content</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">+1 more</span>
                                                    </div>
                                                </div>
                                                {/* Right Content */}
                                                <div className="text-end ms-3">
                                                    <span class="primary-badge badge rounded-pill py-1">Monthly</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="report-card my-3 p-4 cursor-pointer bg-white bg-gradient d-flex flex-column"
                                            style={{
                                                background: "linear-gradient(to right, rgba(249,250,251,0.8), rgba(255,255,255,0.8))",
                                                transition: "all 0.3s ease",
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start  w-100">
                                                {/* Left Content */}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <h6 className="fw-semibold mb-0 text-dark">Campaign Performance Report</h6>                                               
                                                    </div>
                                                    <p className="text-muted mb-3">
                                                        Detailed campaign analysis with ROI and conversion metrics
                                                    </p>
                                                    {/* Tags */}
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Campaign Reach</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Conversion Rate</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Cost Analysis</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">+1 more</span>
                                                    </div>
                                                </div>
                                                {/* Right Content */}
                                                <div className="text-end ms-3">
                                                    <span class="primary-badge badge rounded-pill py-1">On-demand</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="report-card my-3 p-4 cursor-pointer bg-white bg-gradient d-flex flex-column"
                                            style={{
                                                background: "linear-gradient(to right, rgba(249,250,251,0.8), rgba(255,255,255,0.8))",
                                                transition: "all 0.3s ease",
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start  w-100">
                                                {/* Left Content */}
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <h6 className="fw-semibold mb-0 text-dark">Competitor Benchmarking</h6>                                                
                                                    </div>
                                                    <p className="text-muted mb-3">
                                                        Compare your performance against industry competitors
                                                    </p>
                                                    {/* Tags */}
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Market Share</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Engagement Comparison</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">Content Strategy</span>
                                                        <span className="badge rounded-pill px-3 py-2 fw-semibold custom-hashtag-badge">+1 more</span>
                                                    </div>
                                                </div>
                                                {/* Right Content */}
                                                <div className="text-end ms-3">
                                                    <span class="primary-badge badge rounded-pill py-1">Monthly</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header border-0"> 
                                        <h5> Select Metrics </h5>
                                    </div>
                                    <div className="card-body pt-0 p-4">                                 
                                        <div className="row"> 
                                            <div className="col-12 col-sm-12 col-xl-6">
                                                <div className="d-flex align-items-start p-3"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(249,250,251,0.6), rgba(255,255,255,0.6))",
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input me-3 mt-1 rounded-circle border-primary "
                                                        aria-checked="false"
                                                        value="on"
                                                    />
                                                    {/* Content */}
                                                    <div className="d-flex align-items-center flex-grow-1 gap-3">
                                                        {/* Icon Container */}
                                                        <div
                                                            className="p-2 rounded-3 d-flex align-items-center"
                                                            style={{
                                                                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                                                            }}
                                                        >
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
                                                                className="text-white"
                                                            >
                                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                        </div>
                                                        {/* Text Content */}
                                                        <div>
                                                            <p className="mb-0 fw-medium text-dark">Total Reach</p>
                                                            <p className="text-muted extra-small mb-0" style={{fontSize:'12px'}}>
                                                                Total number of unique accounts reached
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className="d-flex align-items-start p-3"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(249,250,251,0.6), rgba(255,255,255,0.6))",
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input me-3 mt-1 rounded-circle border-primary "
                                                        aria-checked="false"
                                                        value="on"
                                                    />
                                                    {/* Content */}
                                                    <div className="d-flex align-items-center flex-grow-1 gap-3">
                                                        {/* Icon Container */}
                                                        <div
                                                            className="p-2 rounded-3 d-flex align-items-center"
                                                            style={{
                                                                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                                                            }}
                                                        >
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
                                                                className="text-white"
                                                            >
                                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                            </svg>
                                                        </div>
                                                        {/* Text Content */}
                                                        <div>
                                                            <p className="mb-0 fw-medium text-dark">Follower Growth</p>
                                                            <p className="text-muted extra-small mb-0" style={{fontSize:'12px'}}>
                                                                New followers gained over period
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>                                    

                                                <div className="d-flex align-items-start p-3"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(249,250,251,0.6), rgba(255,255,255,0.6))",
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input me-3 mt-1 rounded-circle border-primary "
                                                        aria-checked="false"
                                                        value="on"
                                                    />
                                                    {/* Content */}
                                                    <div className="d-flex align-items-center flex-grow-1 gap-3">
                                                        {/* Icon Container */}
                                                        <div
                                                            className="p-2 rounded-3 d-flex align-items-center"
                                                            style={{
                                                                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                                                            }}
                                                        >
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
                                                                className="text-white"
                                                            >
                                                                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                                            </svg>
                                                        </div>
                                                        {/* Text Content */}
                                                        <div>
                                                            <p className="mb-0 fw-medium text-dark">Comments</p>
                                                            <p className="text-muted extra-small mb-0" style={{fontSize:'12px'}}>
                                                                Total comments received
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-12 col-sm-12 col-xl-6">
                                                <div className="d-flex align-items-start p-3"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(249,250,251,0.6), rgba(255,255,255,0.6))",
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox" 
                                                        className="form-check-input me-3 mt-1 rounded-circle border-primary"
                                                        aria-checked="false"
                                                        value="on"
                                                    />
                                                    {/* Content */}
                                                    <div className="d-flex align-items-center flex-grow-1 gap-3">
                                                        {/* Icon Container */}
                                                        <div
                                                            className="p-2 rounded-3 d-flex align-items-center"
                                                            style={{
                                                                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                                                            }}
                                                        >
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
                                                                className="text-white"
                                                            >
                                                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                                                            </svg>
                                                        </div>
                                                        {/* Text Content */}
                                                        <div>
                                                            <p className="mb-0 fw-medium text-dark">Engagement Rateh</p>
                                                            <p className="text-muted extra-small mb-0" style={{fontSize:'12px'}}>
                                                                Average engagement rate across posts
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-start p-3"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(249,250,251,0.6), rgba(255,255,255,0.6))",
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input me-3 mt-1 rounded-circle border-primary "
                                                        aria-checked="false"
                                                        value="on"
                                                    />
                                                    {/* Content */}
                                                    <div className="d-flex align-items-center flex-grow-1 gap-3">
                                                        {/* Icon Container */}
                                                        <div
                                                            className="p-2 rounded-3 d-flex align-items-center"
                                                            style={{
                                                                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                                                            }}
                                                        >
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
                                                                className="text-white"
                                                            >
                                                            <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                                            </svg>
                                                        </div>
                                                        {/* Text Content */}
                                                        <div>
                                                            <p className="mb-0 fw-medium text-dark">Content Shares</p>
                                                            <p className="text-muted extra-small mb-0" style={{fontSize:'12px'}}>
                                                                Total shares and reposts
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-start p-3"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(249,250,251,0.6), rgba(255,255,255,0.6))",
                                                        borderColor: "rgba(255,255,255,0.1)",
                                                    }}
                                                >
                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input me-3 mt-1 rounded-circle border-primary "
                                                        aria-checked="false"
                                                        value="on"
                                                    />
                                                    {/* Content */}
                                                    <div className="d-flex align-items-center flex-grow-1 gap-3">
                                                        {/* Icon Container */}
                                                        <div
                                                            className="p-2 rounded-3 d-flex align-items-center"
                                                            style={{
                                                                background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                                                            }}
                                                        >
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
                                                                className="text-white"
                                                            >
                                                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline>
                                                            </svg>
                                                        </div>
                                                        {/* Text Content */}
                                                        <div>
                                                            <p className="mb-0 fw-medium text-dark">Trending Content</p>
                                                            <p className="text-muted extra-small mb-0" style={{fontSize:'12px'}}>
                                                                Top performing content analysis
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>                                   
                                    </div>                   
                                </div>

                                <div className="card">
                                    <div className="card-header border-0"> 
                                        <h5> Report Settings </h5>
                                    </div>
                                    <div className="card-body pt-0 p-4" > 
                                        <div className="d-flex gap-3 w-100 border-bottom pb-3 mobile-responsive"> 
                                            <div className="form-group w-100">
                                                <label htmlFor="categorySelect">Date Range</label>
                                                <select className="form-control" id="categorySelect">
                                                    <option>Last 7 days </option>
                                                    <option>Last 30 days </option>
                                                    <option>Last 90 days</option>
                                                    <option>Last 6 months</option>
                                                    <option>Last year</option>
                                                </select>
                                            </div>

                                            <div className="form-group w-100">
                                                <label htmlFor="categorySelect">Export Format</label>
                                                <select className="form-control" id="categorySelect">
                                                    <option>Excel Spreadsheet</option>
                                                    <option>PDF Report</option>
                                                    <option>PowerPoint Slides</option>
                                                    <option>CSV Data</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="w-100"> 
                                            <button className="btn btn-hover-effect rounded-3 btn-primary d-flex align-items-center  justify-content-center w-100 my-3"> 
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"strokeLinejoin="round" className="lucide lucide-save h-4 w-4 me-3 "
                                                >
                                                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>
                                                </svg>
                                                Generate Report
                                            </button> 
                                        </div>
                                    </div>                                
                                </div>                            
                            </div> 

                            <div className="col-md-5 col-xl-4"> 
                                <div className="card">  
                                    <div className="card-header border-0"> 
                                        <h5> Saved Reports </h5>
                                    </div>
                                    <div className="card-body pt-0 p-4">
                                        <div className="d-flex flex-column gap-3 mb-4 p-2"> 
                                            <div className="w-100">
                                                <div className="d-flex align-items-center justify-content-between w-100"> 
                                                    <p className="fw-medium text-dark mb-0" style={{fontSize:'14px'}}>
                                                        Q1 Performance Review
                                                    </p>
                                                    <div class="d-inline-flex align-items-center rounded-pill green-badge  fw-semibold small px-3"> 
                                                        Ready 
                                                    </div>
                                                </div>
                                                <p className="text-muted small m-0 pt-2">
                                                    Monthly Growth Summary 
                                                </p>

                                                <div className="w-100 ">   
                                                    <div className="d-flex align-items-center justify-content-between w-100 mt-2">
                                                        <p className="text-muted small pb-0 mb-1">2 days ago </p>
                                                        <p className="text-muted small pb-0 mb-1">2.4 MB</p>
                                                    </div>
                                                    <button className="d-flex align-items-center justify-content-center security-privacy btn w-100 text-center">  
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18"
                                                            height="18" viewBox="0 0 24 24"
                                                            fill="none" stroke="currentColor"
                                                            strokeWidth="2" strokeLinecap="round"strokeLinejoin="round"
                                                            className="lucide lucide-download h-3 w-3 me-2"
                                                        >
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="7 10 12 15 17 10"></polyline>
                                                            <line x1="12" x2="12" y1="15" y2="3"></line>
                                                        </svg>  
                                                            Download 
                                                    </button>
                                                </div> 
                                            </div>
                                        </div>

                                        <div className="d-flex flex-column gap-3 mb-4 p-2"> 
                                            <div className="w-100">
                                                <div className="d-flex align-items-center justify-content-between w-100"> 
                                                    <p className="fw-medium text-dark mb-0" style={{fontSize:'14px'}}>
                                                        March Campaign Analysis
                                                    </p>
                                                    <div class="d-inline-flex align-items-center rounded-pill green-badge  fw-semibold small px-3"> 
                                                        Ready 
                                                    </div>
                                                </div>
                                                <p className="text-muted small m-0 pt-2">
                                                    Campaign Performance Report
                                                </p>
                                                <div className="w-100 ">   
                                                    <div className="d-flex align-items-center justify-content-between w-100 mt-2">
                                                        <p className="text-muted small pb-0 mb-1">1 week ago </p>
                                                        <p className="text-muted small pb-0 mb-1">1.8 MB</p>
                                                    </div>
                                                    <button className="d-flex align-items-center justify-content-center security-privacy btn w-100 text-center">  
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18"
                                                            height="18" viewBox="0 0 24 24"
                                                            fill="none" stroke="currentColor"
                                                            strokeWidth="2" strokeLinecap="round"strokeLinejoin="round"
                                                            className="lucide lucide-download h-3 w-3 me-2"
                                                        >
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                            <polyline points="7 10 12 15 17 10"></polyline>
                                                            <line x1="12" x2="12" y1="15" y2="3"></line>
                                                        </svg>  Download 
                                                    </button>
                                                </div> 
                                            </div>
                                        </div>                                      

                                        <div className="d-flex flex-column gap-3 p-2"> 
                                            <div className="w-100">
                                                <div className="d-flex align-items-center w-100"> 
                                                    <p className="fw-medium text-dark mb-0" style={{fontSize:'14px'}}>
                                                        Weekly Report - Week 12
                                                    </p> 
                                                    <span className="badge rounded-pill px-3 py-2 fw-semibold  bg-warning-subtle yellow-badge ms-2">
                                                        Processing
                                                    </span>
                                                </div>
                                                <p className="text-muted small m-0 pt-2">
                                                    Weekly Performance Report 
                                                </p>
                                                <div className="w-100">   
                                                    <div className="d-flex align-items-center justify-content-between w-100 mt-2">
                                                        <p className="text-muted small pb-0 mb-1">3 days ago </p>
                                                        <p className="text-muted small pb-0 mb-1">- MB</p>
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
