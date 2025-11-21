import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import Chart from 'react-apexcharts';

export default function PagesAnalytics() {
    const [connectedAccountInfo, setConnectedAccountInfo] = useState([]);
    const [showPagesList, setShowPagesList] = useState(false);    
    const [selectPage, setSelectPage] = useState('');
    const dropdownRef = useRef(null);
    const [analytics, setAnalytics] = useState([]); 
    const [fullScreenLoader, setFullScreenLoader] = useState(false);

    //const [weekRange, setWeekRange] = useState('');
    const [followerChartOptions, setFollowerChartOptions] = useState({});    
    const [followerChartSeries, setFollowerChartSeries] = useState([]);
    const [visitsChartOptions, setVisitsChartOptions] = useState({});    
    const [visitsChartSeries, setVisitsChartSeries] = useState([]);
    const [engagementsChartOptions, setEngagementsChartOptions] = useState({});    
    const [engagementsChartSeries, setEngagementsChartSeries] = useState([]);

    //const [weekLabels, setWeekLabels] = useState([]);
    const [weekDates, setWeekDates] = useState([]);  
    

    useEffect(() => {        
        const fetchData = async () => { 
            try {
                const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
                if (userInfoData?.socialData) {
                    const connectedAccounts = userInfoData.socialData.filter(
                        social => social.status === 'Connected'
                    );
                    setConnectedAccountInfo(connectedAccounts);
                }
            } catch (error) {
                console.error('Parsing error:', error);
            }
        }
        fetchData();        
        fetchAnalytics('all','0');
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

    const fetchAnalytics = async (platform,pageID) => {
        //console.log('ss',platform,pageID);
        setFullScreenLoader(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');     
        //console.log("Last week's Monday:", lastMonday.toISOString().split('T')[0]);
        //console.log("Last week's Sunday:", lastSunday.toISOString().split('T')[0]);            
        try {  
            const today = new Date();        
            // Calculate date range for last 7 days (excluding today)
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - 1); // Yesterday
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // 7 days back from yesterday
            // Format dates to YYYY-MM-DD
            const formatDate = (date) => date.toISOString().split('T')[0];
            const startDateISO = formatDate(startDate);
            const endDateISO = formatDate(endDate);
            //console.log('startDateISO',startDateISO,'endDateISO',endDateISO);
            const analyticsResponse = await fetch(`${BACKEND_URL}/api/get-analytics`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + authToken,
                },
                body: JSON.stringify({ 
                    lastMondayWeekDate:startDateISO,
                    lastSundayWeekDate:endDateISO,
                    platformPageId:pageID,
                    platform:platform  
                }),
            });                
            const response = await analyticsResponse.json();
            setAnalytics(response);
            setFullScreenLoader(false);
            //console.log('response',analytics.totals);
        } catch (error) {               
            console.error('Token Extension Error:', error);
        }
    };
    
    function formatK(num) {
        if (num >= 1000) {
          return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    }

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const platformColors = {
        facebook: '#1877F2', // Facebook blue
        instagram: '#FCAF45', // Instagram yellow (part of their gradient) 
        linkedIn: '#1a73e8',       
    };

    useEffect(() => {
        const generateLastWeekData = () => {
            const dates = [];
            // Generate last 7 days including today
            for(let i = 7; i >= 1; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date);
            }

            const weekLabels = dates.map(date => 
                `${date.getDate()} ${months[date.getMonth()]}`
            );

            const weekDates = dates.map(date => 
                `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
            );

            return {
                weekLabels,
                weekDates,
                weekData: new Array(7).fill(0),
                weekRangeText: `${dates[0].getDate()} ${months[dates[0].getMonth()]} - ${dates[6].getDate()} ${months[dates[6].getMonth()]}`
            };
        };

        const { weekLabels, weekDates, weekRangeText } = generateLastWeekData();
        setWeekDates(weekDates);

        setFollowerChartOptions({
            chart: {
                id: 'follower-chart',
                toolbar: { show: false }
            },
            xaxis: {
                categories: weekLabels,
                labels: { show: true }
            },
            yaxis: { labels: { show: true } },
            stroke: { width: 2, curve: 'smooth' },
            legend: { position: 'bottom' },
            tooltip: {
                x: { format: 'dd MMM' }
            }
        });

        setVisitsChartOptions({
            chart: {
                id: 'visits-chart',
                toolbar: { show: false }
            },
            xaxis: {
                categories: weekLabels,
                labels: { show: true }
            },
            yaxis: { 
                labels: { 
                    show: true,
                    formatter: function(value) {
                        return value.toLocaleString(); // Format numbers with commas
                    }
                }
            },
            stroke: { width: 2, curve: 'smooth' },
            legend: { position: 'bottom' },
            tooltip: {
                x: { format: 'dd MMM' },
                y: {
                    formatter: function(value) {
                        return value.toLocaleString() + " visits";
                    }
                }
            }
        });

        setEngagementsChartOptions({
            chart: {
                id: 'engagements-chart',
                toolbar: { show: false }
            },
            xaxis: {
                categories: weekLabels,
                labels: { show: true }
            },
            yaxis: { 
                labels: { 
                    show: true,
                    formatter: function(value) {
                        return value.toLocaleString(); // Format numbers with commas
                    }
                }
            },
            stroke: { width: 2, curve: 'smooth' },
            legend: { position: 'bottom' },
            tooltip: {
                x: { format: 'dd MMM' },
                y: {
                    formatter: function(value) {
                        return value.toLocaleString() + " Views";
                    }
                }
            }
        });

    }, []);

    useEffect(() => {
        if (analytics.fetchData && weekDates.length > 0) {
            // Group data by platform
            const groupedByPlatform = analytics.fetchData.reduce((acc, item) => {
                const platform = item.platform.toLowerCase();
                if (!acc[platform]) acc[platform] = [];
                    acc[platform].push(item);
                    return acc;
            }, {});
            // Create a series for each platform
            const series = Object.entries(groupedByPlatform).map(([platform, items]) => {
                // Initialize data array with 0s
                const dataForPlatform = new Array(weekDates.length).fill(0);        
                // Fill data where dates match
                items.forEach((item) => {
                    const itemDate = new Date(item.week_date).toISOString().split('T')[0];
                    const index = weekDates.indexOf(itemDate);
                    if (index !== -1) {
                        dataForPlatform[index] = item.total_page_followers || 0;
                    }
                });
                return {
                    name: platform.charAt(0).toUpperCase() + platform.slice(1), // "facebook" → "Facebook"
                    data: dataForPlatform,
                    color: platformColors[platform] || '#000000' // Fallback to black
                };
            });
            setFollowerChartSeries(series);

            // Create series for visits (using page_views_total)
            const visitsSeries = Object.entries(groupedByPlatform).map(([platform, items]) => {
                const dataForPlatform = new Array(weekDates.length).fill(0);
                
                items.forEach((item) => {
                    const itemDate = new Date(item.week_date).toISOString().split('T')[0];
                    const index = weekDates.indexOf(itemDate);
                    if (index !== -1) {
                        dataForPlatform[index] = item.total_page_views || 0;
                    }
                });

                return {
                    name: platform.charAt(0).toUpperCase() + platform.slice(1),
                    data: dataForPlatform,
                    color: platformColors[platform] || '#000000'
                };
            });
            setVisitsChartSeries(visitsSeries);

            const engagementsSeries = Object.entries(groupedByPlatform).map(([platform, items]) => {
                const dataForPlatform = new Array(weekDates.length).fill(0);
                
                items.forEach((item) => {
                    const itemDate = new Date(item.week_date).toISOString().split('T')[0];
                    const index = weekDates.indexOf(itemDate);
                    if (index !== -1) {
                        dataForPlatform[index] = item.page_post_engagements || 0;
                    }
                });

                return {
                    name: platform.charAt(0).toUpperCase() + platform.slice(1),
                    data: dataForPlatform,
                    color: platformColors[platform] || '#000000'
                };
            });         

            setEngagementsChartSeries(engagementsSeries);
        }
    }, [analytics, weekDates]);

    // const formatAsMidnightUTC = (date) => {
    //     const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    //     return Math.floor(utc.getTime() / 1000); // Unix timestamp
    // };

    function getUnixTimestampMidnight(dateStr, offsetHours) {
        const d = new Date(dateStr);
        d.setUTCHours(0, 0, 0, 0);
        d.setHours(d.getHours() + offsetHours);
        return Math.floor(d.getTime() / 1000);
    } 

    const PageAnalytics  = async (socialUser) => {
        setFullScreenLoader(true);
        const today = new Date();
        const untilDate = new Date(today);
        untilDate.setDate(today.getDate() - 1);
        const sinceDate = new Date(untilDate);
        sinceDate.setDate(untilDate.getDate() - 7);
        //const until = untilDate.toISOString().split("T")[0];
        //const since = sinceDate.toISOString().split("T")[0];
        //console.log('until',until, 'since',since) 

        // Convert to start-of-day UTC Unix timestamps
        const since = getUnixTimestampMidnight(sinceDate, 0); // Adjust to GMT+7
        const until = getUnixTimestampMidnight(untilDate, 0);
        
        
        const errors = [];
        const responses = [];

        try {        
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${socialUser.pageId}/insights`,
                {
                params: {
                    metric: 'page_daily_follows',
                    period: 'day',
                    access_token: socialUser.token,
                    since: since, // Unix timestamp
                    until: until
                }
                }
            ); 
            const analyticsData = response.data;
            //await saveAnalyticsData(analyticsData.data, 'page_daily_follows');
            responses.push({ analytic_type: 'page_daily_follows', data: analyticsData });
            //console.log('Daily follows saved:', analyticsData);
        } catch (error) {
            console.error('Daily follows API Error:', error);
            errors.push({ type: 'page_daily_follows', error });
        }

        try {           
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${socialUser.pageId}/insights`,
                {
                    params: {
                        metric: 'page_impressions',
                        period: 'day',
                        access_token: socialUser.token,
                        since: since, // Unix timestamp
                        until: until
                    }
                }
            ); 
            const analyticsData = response.data;            
            responses.push({ analytic_type: 'page_impressions', data: analyticsData });
            //console.log('Post engagements saved:', analyticsData);
        } catch (error) {
            console.error('Daily follows API Error:', error);
            errors.push({ type: 'page_impressions', error });
        }

        try {           
            
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${socialUser.pageId}/insights`,
                {
                    params: {
                        metric: 'page_impressions_unique',
                        period: 'day',
                        access_token: socialUser.token,
                        since: since, // Unix timestamp
                        until: until
                    }
                }
            ); 
            const analyticsData = response.data;
            responses.push({ analytic_type: 'page_impressions_unique', data: analyticsData });
            //console.log('Post engagements saved page_impressions_unique :', analyticsData);
        } catch (error) {
            console.error('Daily impressions unique API Error:', error);
            errors.push({ type: 'page_impressions_unique', error });
        }

        try {          
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${socialUser.pageId}/insights`,
                {
                    params: {
                        metric: 'page_views_total',
                        period: 'day',
                        access_token: socialUser.token,
                        since: since,
                        until: until
                    }
                }
            ); 
            const page_views_total = response.data;            
            //console.log('page_views_total :', page_views_total);
            responses.push({ analytic_type: 'page_views_total', data: page_views_total });
        } catch (error) {
            console.error('Daily page_views_total API Error:', error);
            errors.push({ type: 'page_views_total', error });
        }
        
        try {
            const response = await axios.get(
              `https://graph.facebook.com/v22.0/${socialUser.pageId}/insights`,
              {
                params: {
                  metric: 'page_post_engagements',
                  period: 'day',
                  access_token: socialUser.token,
                  since: since, 
                  until: until 
                }
              }
            );
                const page_post_engagements = response.data;
                //console.log('page_post_engagements:', page_post_engagements);
                responses.push({ analytic_type: 'page_post_engagements', data: page_post_engagements });
          } catch (error) {
                console.error('API Error:', error.response?.data || error.message);
          }

        // Handle final errors/responses
        if (errors.length > 0) {
            const errorMessage = errors.map(e => `${e.type}: ${e.error.message}`).join('\n');
            throw new Error(`Some analytics failed:\n${errorMessage}`);
        }
        //console.log('vvv', responses);
        await saveAnalyticsData(responses,socialUser.pageId);
    };
    
    const saveAnalyticsData = async (analyticsData,socialPageId) => {              
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');  
        //console.log('sss',analyticsData);     
        try {
            const formData = new FormData();  
            formData.append("analyticsData", JSON.stringify(analyticsData));            
            formData.append("platform", 'facebook');
            formData.append("socialPageId", socialPageId);
            const response = await fetch(`${BACKEND_URL}/api/create-analytics`, {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + authToken,
                },
                body: formData,
              });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response.json();
                await fetchAnalytics('facebook',socialPageId);                
                setShowPagesList(false);
                //console.log("saved successfully:", result); 
        } catch (error) {
            console.error("Error saving posts:", error);            
            throw error;
        }
    };

    return (
        <div className="page-wrapper compact-wrapper mt-3">
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
                            </div>
                        </div>
                    )}
                    {/* <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-sm-6">
                                    <h3>Analytics</h3>
                                </div>
                                <div className="col-sm-6">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item active">Analytics</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div> */}                
                    <div className="container-fluid dashboard-10">
                        <div className="dashboard-header p-4 mb-4 mt-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="h2 mb-1 text-white">Social Media Engagement</h1>
                                    <p className="mb-0 text-white">Track and analyze your social media performance</p>
                                </div>  
                                <div>
                                
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
                                                    <div className="row g-3 common-form mb-3">
                                                        <div className="col-12 col-lg-4 col-md-4 col-sm-4">                                                            
                                                            <h2 className="section-title text-primary"><i className="fas fa-chart-bar"></i>Analytics Overview</h2>
                                                            <div ref={dropdownRef} className="position-relative">
                                                                <div
                                                                    className="form-control pe-4 custom-select-input"
                                                                    onClick={() => setShowPagesList(!showPagesList)}
                                                                >
                                                                    <div className="selected-pages-container">                                                                  
                                                                        {selectPage ? (                                                                 
                                                                            <div key={selectPage.id} className="selected-page-item">
                                                                                <img 
                                                                                    src={selectPage.page_picture} 
                                                                                    alt={selectPage.pageName}
                                                                                    className="selected-page-image"                                                                                
                                                                                />
                                                                                <span className="selected-page-name">{selectPage.pageName}</span>
                                                                            </div>
                                                                        ) : (  
                                                                            <span className="text-muted">Select page for view analytics</span> 
                                                                        )}                                                                 
                                                                    </div>
                                                                </div>
                                                                {showPagesList ? (
                                                                    <span 
                                                                        className="position-absolute end-0 translate-middle-y me-2"
                                                                        style={{ cursor: 'pointer', pointerEvents: 'none', top: '20px' }}
                                                                    >
                                                                        <i className="fas fa-chevron-up text-muted" />
                                                                    </span>
                                                                ) : (  
                                                                    <span 
                                                                        className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                                        style={{ cursor: 'pointer', pointerEvents: 'none' }}
                                                                    >
                                                                        <i className="fas fa-chevron-down text-muted" />
                                                                    </span>
                                                                )}
                                                                
                                                                {showPagesList && (
                                                                    <div className="dropdown-content">                                                                        
                                                                        <ul className="nested-checkbox-list">
                                                                            {connectedAccountInfo.length === 0 ? (
                                                                                <li className="p-2 text-danger">Connect your account</li>
                                                                            ) : (
                                                                                connectedAccountInfo.map((socialUser) => (
                                                                                    <li key={socialUser.id} className="parent-item">
                                                                                        <div className="d-flex align-items-center">
                                                                                            <img
                                                                                                className="user-avatar"
                                                                                                src={socialUser.img_url}
                                                                                                alt="Profile"
                                                                                                onError={(e) => {
                                                                                                    e.target.src = '/default-avatar.png';
                                                                                                }}
                                                                                            />
                                                                                            <div>
                                                                                                <span className="user-name"><b>{socialUser.name}</b></span>
                                                                                                <p className="text-muted ">
                                                                                                    <small>Platform: {socialUser.social_user_platform}</small>
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                        {socialUser.socialPage?.length > 0 && (
                                                                                            <ul className="child-list ps-3">
                                                                                                {socialUser.socialPage.map((socialPages) => (
                                                                                                    <li key={socialPages.pageId} 
                                                                                                        className="child-item" 
                                                                                                        style={{cursor:'pointer'}}
                                                                                                        onClick={() => PageAnalytics(socialPages)}
                                                                                                    >
                                                                                                        <div className="d-flex align-items-center">
                                                                                                            <img
                                                                                                                src={socialPages.page_picture}
                                                                                                                alt="Page"
                                                                                                                className="page-image"
                                                                                                                onError={(e) => {
                                                                                                                    e.target.src = '/default-page.png';
                                                                                                                }}
                                                                                                            />
                                                                                                            <span className="page-name">
                                                                                                                {socialPages.pageName}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </li>
                                                                                                ))}
                                                                                            </ul>
                                                                                        )}
                                                                                    </li>
                                                                                ))
                                                                            )}
                                                                        </ul>
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
                        </div>
                        <div className="tab-content pt-3">
                            <div className="tab-pane fade show active" id="all" role="tabpanel">
                                <div className="row">
                                    <div className="col-xl-6 ord-md-v">
                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="card overflow-hidden analytics-tread-card">
                                                    <div className="card-header card-no-border">
                                                        <div className="header-top">
                                                            <div>
                                                                <span className="c-o-light mb-1">Total impressions </span>
                                                                <div className="common-align">
                                                                    <h5 className="mb-1">{analytics?.totals?.total_page_impressions}</h5>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="analytics-tread bg-light-primary">
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/images/engagement.png`} alt=""/>
                                                                </div>
                                                            </div>
                                                        </div>                                                        
                                                    </div> 
                                                    <div className="card-body pt-0">
                                                        <div>
                                                            <span className="common-align gap-1 justify-content-start">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                                    strokeLinejoin="round" className="feather feather-trending-up txt-success">
                                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                    <polyline points="17 6 23 6 23 12"></polyline>
                                                                </svg>
                                                                <span className="txt-success f-w-500">All platforms, last 7 days</span>
                                                            </span>
                                                        </div>
                                                        <a className="btn btn-primary mt-2" href="">View Details</a>
                                                    </div>           
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="card overflow-hidden analytics-tread-card">
                                                    <div className="card-header card-no-border">
                                                        <div className="header-top">
                                                            <div>
                                                                <span className="c-o-light mb-1">Unique impressions</span>
                                                                <div className="common-align">
                                                                    <h5 className="mb-1">{analytics?.totals?.total_page_impressions_unique}</h5>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="analytics-tread bg-light-primary">
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/images/subscription.png`} alt=""/>
                                                                </div>
                                                            </div>
                                                        </div>                                                        
                                                    </div> 
                                                    <div className="card-body pt-0">
                                                        <div>
                                                            <span className="common-align gap-1 justify-content-start">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                                    strokeLinejoin="round" className="feather feather-trending-up txt-success">
                                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                    <polyline points="17 6 23 6 23 12"></polyline>
                                                                </svg>
                                                                <span className="txt-success f-w-500">All platforms, last 7 days</span>
                                                            </span>
                                                        </div>
                                                        <a className="btn btn-primary mt-2" href="">View Details</a>
                                                    </div>           
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-xl-6 ord-md-v">
                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="card overflow-hidden analytics-tread-card">
                                                    <div className="card-header card-no-border">
                                                        <div className="header-top">
                                                            <div>
                                                                <span className="c-o-light mb-1">Total Followers</span>
                                                                <div className="common-align">
                                                                    <h5 className="mb-1">{formatK(analytics?.totals?.total_page_followers)}</h5>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="analytics-tread bg-light-primary">
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/images/followers.png`} alt=""/>
                                                                </div>
                                                            </div>
                                                        </div>                                                        
                                                    </div> 
                                                    <div className="card-body pt-0">
                                                        <div>
                                                            <span className="common-align gap-1 justify-content-start">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                                    strokeLinejoin="round" className="feather feather-trending-up txt-success">
                                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                    <polyline points="17 6 23 6 23 12"></polyline>
                                                                </svg>
                                                                <span className="txt-success f-w-500">All platforms, last 7 days</span>
                                                            </span>
                                                        </div>
                                                        <a className="btn btn-primary mt-2" href="">View Details</a>
                                                    </div>           
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="card overflow-hidden analytics-tread-card">
                                                    <div className="card-header card-no-border">
                                                        <div className="header-top">
                                                            <div>
                                                                <span className="c-o-light mb-1">Total Engagement</span>
                                                                <div className="common-align">
                                                                    <h5 className="mb-1">{formatK(analytics?.totals?.total_page_post_engagements)}</h5>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="analytics-tread bg-light-primary">
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/images/publishing.png`} alt=""/>
                                                                </div>
                                                            </div>
                                                        </div>                                                        
                                                    </div> 
                                                    <div className="card-body pt-0">
                                                        <div>
                                                            <span className="common-align gap-1 justify-content-start">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                                    strokeLinejoin="round" className="feather feather-trending-up txt-success">
                                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                    <polyline points="17 6 23 6 23 12"></polyline>
                                                                </svg>
                                                                <span className="txt-success f-w-500">All platforms, last 7 days</span>
                                                            </span>
                                                        </div>
                                                        <a className="btn btn-primary mt-2" href="">View Details</a>
                                                    </div>           
                                                </div>
                                            </div>
                                        </div>
                                    </div>                                                                
                                </div>
                            </div>                                    
                        </div>                   
                        <div className="row">
                            <div className="col-xxl-5 col-xl-4 col-md-6 ord-md-i box-col-4">
                                <div className="card visits-wrapper">
                                    <div className="card-header card-no-border">
                                        <div className="header-top">
                                            <h5>Followers</h5>
                                            {/* <div className="card-header-right-icon">
                                                <div className="dropdown custom-dropdown">
                                                    <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                        Year
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        <li><a className="dropdown-item" href="#!">Day</a></li>
                                                        <li><a className="dropdown-item" href="#!">Month</a></li>
                                                        <li><a className="dropdown-item" href="#!">Year</a></li>
                                                    </ul>
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="common-flex">
                                            <h6>Total: {analytics?.totals?.total_page_followers}</h6>
                                            <div className="d-flex">
                                                <p>( <span className="txt-success f-w-500 me-1">+6.7%</span>vs last week)</p>
                                            </div>
                                        </div>
                                        <div className="common-m-chart">
                                            <Chart
                                                options={followerChartOptions}
                                                series={followerChartSeries}
                                                type="line" // You can change this to "line", "area", "pie", etc.
                                                width="100%"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-3 col-xl-4 col-md-6 ord-md-ii box-col-4">
                                <div className="card visits-wrapper">
                                    <div className="card-header card-no-border">
                                        <div className="header-top">
                                            <h5>All Visits</h5>
                                            {/* <div className="card-header-right-icon">
                                                <div className="dropdown custom-dropdown">
                                                    <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                        Year
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        <li><a className="dropdown-item" href="#!">Day</a></li>
                                                        <li><a className="dropdown-item" href="#!">Month</a></li>
                                                        <li><a className="dropdown-item" href="#!">Year</a></li>
                                                    </ul>
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="common-flex">
                                            <h6>Total: {analytics?.totals?.total_page_views}</h6>
                                            <div className="d-flex">
                                                <p>( <span className="txt-success f-w-500 me-1">+6.7%</span>vs last week)</p>
                                            </div>
                                        </div>
                                        <div className="common-m-chart">
                                            <Chart
                                                options={visitsChartOptions}
                                                series={visitsChartSeries}
                                                type="line" // You can change this to "line", "area", "pie", etc.
                                                width="100%"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>                        
                            <div className="col-xxl-3 col-xl-4 col-md-6 ord-md-ii box-col-4">
                                <div className="card">
                                    <div className="card-header card-no-border">
                                        <div className="header-top">
                                            <h5>Engagement by Platform</h5>
                                            {/* <div className="card-header-right-icon">
                                                <div className="dropdown icon-dropdown">
                                                    <button className="btn dropdown-toggle" id="referralVisitOption" type="button"
                                                        data-bs-toggle="dropdown" aria-expanded="false">
                                                        <i className="icon-more-alt"></i>
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-end" aria-labelledby="referralVisitOption">
                                                        <a className="dropdown-item" href="#!">This Month</a>
                                                        <a className="dropdown-item" href="#!">Previous Month</a>
                                                        <a className="dropdown-item" href="#!">Last 3 Months</a>
                                                        <a className="dropdown-item" href="#!">Last 6 Months</a>
                                                    </div>
                                                </div>
                                            </div>                                             */}
                                        </div>
                                    </div>
                                    <div className="card-body px-0 pt-0 treading-product campaign-table">
                                        <div className="recent-table currency-table">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Platform</th>                                                      
                                                        <th>Visits</th>
                                                        <th>Growth</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border-icon facebook">
                                                            <div>
                                                                <div className="social-circle">
                                                                    <i className="fa-brands fa-facebook"></i>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='f-w-500'>10,000</td>
                                                        <td>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up me-1 font-success"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border-icon instagram-platform">
                                                            <div>
                                                                <div className="social-circle">
                                                                    <i className="fa-brands fa-instagram"></i>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='f-w-500'>10,000</td>
                                                        <td>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up me-1 font-success"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border-icon twitter">
                                                            <div>
                                                                <div className="social-circle">
                                                                    <i className="fa-brands fa-twitter"></i>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='f-w-500'>10,000</td>
                                                        <td>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up me-1 font-success"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 
                                                        </td>
                                                    </tr>
                                                    
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>                            
                        </div>
                       
                        <div className="row">                             
                            <div className="col-xxl-7 col-xl-5 col-md-5 ord-md-i box-col-5">
                                <div className="card visits-wrapper">
                                    <div className="card-header card-no-border">
                                        <div className="header-top">
                                            <h5>Engagements</h5>
                                            {/* <div className="card-header-right-icon">
                                                <div className="dropdown custom-dropdown">
                                                    <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                        Year
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        <li><a className="dropdown-item" href="#!">Day</a></li>
                                                        <li><a className="dropdown-item" href="#!">Month</a></li>
                                                        <li><a className="dropdown-item" href="#!">Year</a></li>
                                                    </ul>
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="common-flex">
                                            <h6>Total: {analytics?.totals?.total_page_post_engagements}</h6>
                                            <div className="d-flex">
                                                <p>( <span className="txt-success f-w-500 me-1">+6.7%</span>vs last week)</p>
                                            </div>
                                        </div>
                                        <div className="common-m-chart">
                                            <Chart
                                                options={engagementsChartOptions}
                                                series={engagementsChartSeries}
                                                type="line" // You can change this to "line", "area", "pie", etc.
                                                width="100%"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>                         
                            
                            {/* <div className="col-xl-4 col-sm-6 ord-md-vii box-col-4">
                                <div className="card">
                                    <div className="card-header card-no-border">
                                        <div className="header-top">
                                            <h5>Sessions by Countries</h5>
                                            <div className="card-header-right-icon">
                                                <div className="dropdown icon-dropdown">
                                                    <button className="btn dropdown-toggle" id="referralVisitOption" type="button"
                                                        data-bs-toggle="dropdown" aria-expanded="false">
                                                        <i className="icon-more-alt"></i>
                                                    </button>
                                                    <div className="dropdown-menu dropdown-menu-end" aria-labelledby="referralVisitOption">
                                                        <a className="dropdown-item" href="#!">This Month</a>
                                                        <a className="dropdown-item" href="#!">Previous Month</a>
                                                        <a className="dropdown-item" href="#!">Last 3 Months</a>
                                                        <a className="dropdown-item" href="#!">Last 6 Months</a>
                                                    </div>
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="common-m-chart">
                                            
                                        </div>
                                    </div>
                                </div>
                            </div>  */}
                        </div>
                    </div>              
                                        
                </div>
                <Footer />
            </div>
        </div>
    )
}