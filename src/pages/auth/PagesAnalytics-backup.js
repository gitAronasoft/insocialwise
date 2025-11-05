import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import Chart from 'react-apexcharts';

export default function PagesAnalytics() {
    const [connectedAccountInfo, setConnectedAccountInfo] = useState([]);
    const [showPagesList, setShowPagesList] = useState(false);
    const [analyticsLoader, setAnalyticsLoader] = useState(false);
    const [selectPage, setSelectPage] = useState('');
    const dropdownRef = useRef(null);
    const [analytics, setAnalytics] = useState([]);

    const [weekRange, setWeekRange] = useState('');
    const [followerChartOptions, setFollowerChartOptions] = useState({});    
    const [followerChartSeries, setFollowerChartSeries] = useState([]);

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
        const generateLastWeekData = () => {
          const today = new Date();
          const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)    
          let lastMonday = new Date(today);
          let lastSunday = new Date(today);    
          if (day === 0) {
            lastSunday.setDate(today.getDate() - 7);
            lastMonday.setDate(today.getDate() - 13);
          } else {
            lastSunday.setDate(today.getDate() - day);
            lastMonday.setDate(lastSunday.getDate() - 6);
          }
    
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
    
          let weekLabels = [];
          let weekData = [];
    
          for (let i = 0; i < 7; i++) {
            const current = new Date(lastMonday);
            current.setDate(current.getDate() + i);    
            //const dayName = days[current.getDay()];
            const dayNumber = current.getDate();
            const monthName = months[current.getMonth()];    
            // Generate label for chart
            weekLabels.push(`${dayNumber} ${monthName}`);    
            // 🔥 Simulate some data for each day
            // If you have real API data, fetch it here instead of random
            const randomValue = Math.floor(Math.random() * 100) + 1; // Random between 1-100
            weekData.push(randomValue);
          }
    
          // Prepare week range text
          const startDay = lastMonday.getDate();
          const startMonth = months[lastMonday.getMonth()];
          const endDay = lastSunday.getDate();
          const endMonth = months[lastSunday.getMonth()];    
          const weekRangeText = `${startDay} ${startMonth} to ${endDay} ${endMonth}`;    
          return { weekLabels, weekData, weekRangeText };
        };
    
        const { weekLabels, weekData, weekRangeText } = generateLastWeekData();    
        setWeekRange(weekRangeText);    
        setFollowerChartOptions({
          chart: {
            id: 'last-week-bar'
          },
          xaxis: {
            categories: weekLabels
          }
        });     
        
        setFollowerChartSeries([
          {
            name: 'Daily Data',
            data: weekData
          }
        ]);
    }, []);

    const PageAnalytics  = async (socialUser) => {
        try {          
            const today = new Date();
            const until = new Date(today.setDate(today.getDate() - 1)); // Yesterday
            const since = new Date(today.setDate(today.getDate() - 8)); // 4 weeks back
            //console.log('until',until, 'since',since)
            const response = await axios.get(
                `https://graph.facebook.com/v22.0/${socialUser.pageId}/insights`,
                {
                params: {
                    metric: 'page_daily_follows',
                    period: 'day',
                    access_token: socialUser.token,
                    since: Math.floor(since.getTime() / 1000), // Unix timestamp
                    until: Math.floor(until.getTime() / 1000)
                }
                }
            ); 
            const analyticsData = response.data;
            const facebook_page_analytics_type= 'page_daily_follows';
            await saveAnalyticsData(analyticsData.data,facebook_page_analytics_type);   
            //return response.data;
            console.log('analyticsData',analyticsData);
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }; 
    
    const saveAnalyticsData = async (analyticsData,facebook_page_analytics_type) => {        
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');       
        try {
            const formData = new FormData();  
            formData.append("analyticsData", JSON.stringify(analyticsData));
            formData.append("analytic_type", facebook_page_analytics_type);
            formData.append("platform", 'facebook');
            const response = await fetch(`${BACKEND_URL}/api/create-analytics`, {
                method: "POST",
                headers: {
                  Authorization: "Bearer " + authToken,
                },
                body: formData,
              });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const result = await response.json();
                console.log("saved successfully:", result); 
        } catch (error) {
            console.error("Error saving posts:", error);            
            throw error;
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
                    </div>
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12">
                                <div className="row">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="sidebar-body">
                                                <div className="row g-3 common-form mb-3">
                                                    <div className="col-12 col-lg-4 col-md-4 col-sm-6">                                                            
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
                                                {analyticsLoader ? (
                                                    <div className="row g-3 common-form">
                                                        <div className='text-center mb-3'>
                                                            <i className="fas fa-spin fa-spinner text-dark w-100" style={{fontSize:'25px'}}></i>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="row g-3 common-form">
                                                        <div className="col-lg-6 col-md-6 col-sm-6">
                                                            <h4>Follows</h4>
                                                            <hr/>
                                                            <Chart
                                                                options={followerChartOptions}
                                                                series={followerChartSeries}
                                                                type="area" // You can change this to "line", "area", "pie", etc.
                                                                width="500"
                                                            />
                                                        </div>

                                                        <div className="col-lg-6 col-md-6 col-sm-6">
                                                            <h4>Follows</h4>
                                                            <hr/>
                                                            <Chart
                                                                options={followerChartOptions}
                                                                series={followerChartSeries}
                                                                type="line" // You can change this to "line", "area", "pie", etc.
                                                                width="500"
                                                            />
                                                        </div>
                                                        
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
                <Footer />
            </div>
        </div>
    )
}