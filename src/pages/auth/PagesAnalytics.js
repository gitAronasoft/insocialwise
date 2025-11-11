import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { Link, useLocation } from 'react-router-dom';
import Chart from 'react-apexcharts';
import axios from 'axios';
import AccountNotConnectedComponent from './components/AccountNotConnectedComponent';
import PageAnalyticSkeleton from './components/PageAnalyticSkeleton';
// import SocialAccountDefaultMessage from './components/SocialAccountDefaultMessage';
import DataTable from 'react-data-table-component';
import HoverPostPreview from './components/HoverPostPreview';

export default function PagesAnalytics() { 
    const [connectedAccountInfo, setIsConnectedAccountInfo] = useState([]);    
    //const [selectPage, setSelectPage] = useState(''); 
    const [analytics, setAnalytics] = useState([]); 
    const [fullScreenLoader, setFullScreenLoader] = useState(false);     
    const [loading, setLoading] = useState(false);
    const [followerChartOptions, setFollowerChartOptions] = useState({});    
    const [followerChartSeries, setFollowerChartSeries] = useState([]); 
    const [visitsChartOptions, setVisitsChartOptions] = useState({});    
    const [visitsChartSeries, setVisitsChartSeries] = useState([]);
    const [impresionsChartOptions, setImpresionsChartOptions] = useState({});    
    const [impresionsChartSeries, setImpresionsChartSeries] = useState([]);   
    const [weekDates, setWeekDates] = useState([]);
    const [topPosts, setTopPosts] = useState([]);
    const [visiblePosts, setVisiblePosts] = useState(10);
    const hasRun = useRef(false);
    const RunTopPostAPI = useRef(false);
    const [columnChartOptions, setColumnChartOptions] = useState({});
    const [platformChartSeries, setPlatformChartSeries] = useState({
        facebook: [],
        linkedin: []
    });
    const [showConnectModal, setShowConnectModal] = useState(false);
    const location = useLocation();
    const [initialLoad, setInitialLoad] = useState(true);
    const [isCheckingConnection, setIsCheckingConnection] = useState(true);
    const timerRef = useRef(null); 
    
    // Modify the useEffect that checks connected accounts
    useEffect(() => {
        const fetchData = async () => {
            setFullScreenLoader(true);
            try {
            const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
                if (userInfoData?.socialData) {
                    const connectedAccounts = userInfoData.socialData.filter(account =>
                        account.status === 'Connected' &&
                        Array.isArray(account.socialPage) &&
                        account.socialPage.some(page => page.status === 'Connected')
                    );
                    setIsConnectedAccountInfo(connectedAccounts);
                    
                    // Small delay to prevent flickering
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    if (connectedAccounts.length > 0) {
                        fetchAnalytics('all', '0');
                        fetchTopPosts();
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setFullScreenLoader(false);
                setInitialLoad(false);
            }
        };
        
        fetchData();
    }, []);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const userInfo = JSON.parse(localStorage.getItem('userinfo'));
                const connected = userInfo?.socialData?.some(account => 
                    account.status === 'Connected' && 
                    account.socialPage?.some(page => page.status === 'Connected')
                );
                
                if (connected) {
                    await fetchAnalytics('all', '0');
                    await fetchTopPosts();
                }
            } catch (error) {
                console.error("Connection check failed:", error);
            } finally {
                // timerRef.current = setTimeout(() => {
                    setIsCheckingConnection(false);     // flips after full 2s
                // }, 2000);
            }
        };

        checkConnection();
        return () => clearTimeout(timerRef.current);
    }, []);

    const fetchAnalytics = async (platform,pageID) => { 
        if (hasRun.current) return;
        hasRun.current = true;
        // setLoading(true);       
        setFullScreenLoader(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');     
                    
        try {  
            const today = new Date();        
            // Calculate date range for last 7 days (excluding today)
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - 1);
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6);
            const formatDate = (date) => date.toISOString().split('T')[0];
            const startDateISO = formatDate(startDate);
            const endDateISO = formatDate(endDate);
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
        } catch (error) {               
            console.error('Token Extension Error:', error);
        }
    };

    const fetchTopPosts = async () => {
        if (RunTopPostAPI.current) return;
        RunTopPostAPI.current = true;
        setLoading(true);
        
        const userInfoData = JSON.parse(localStorage.getItem('userinfo'));
        if (!userInfoData?.socialData) return;

        // Date range setup
        const today = new Date();
        const untilDate = new Date(today);
        untilDate.setDate(today.getDate() - 1);
        const sinceDate = new Date(untilDate);
        sinceDate.setDate(untilDate.getDate() - 7);
        const since = getUnixTimestampMidnight(sinceDate, 0);
        const until = getUnixTimestampMidnight(untilDate, 0);

        try {
            const fetchPromises = [];
            const connectedAccounts = userInfoData.socialData.filter(
                social => social.status === 'Connected'
            );
            // Collect all API promises first
            connectedAccounts.forEach(account => {
                if (account.status === 'Connected') {
                    if (account.social_user_platform === 'facebook') {
                        account.socialPage.forEach(page => {
                            if (page.status === 'Connected') {
                                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                                const userUuid = account.user_id;
                                const { pageId, pageName:postPageName, page_picture: postPagePicture, page_platform: platform } = page;
                                fetchPromises.push(
                                    axios.post(`${BACKEND_URL}/api/top_posts`,
                                        { userUuid, pageId, platform },
                                        {
                                            headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                                            }
                                        }
                                    ).then(response => ({
                                        data: response.data.data,
                                        postPageName,
                                        postPagePicture,
                                        accountName: account.name || '',
                                        platform
                                    }))                                    
                                );
                            } else {
                                setLoading(false);
                            }
                        });
                    } else if (account.social_user_platform === 'linkedin') {
                        account.socialPage.forEach(page => {
                            if (page.status === 'Connected') {
                                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
                                const userUuid = account.user_id;
                                const { pageId, pageName:postPageName, page_picture: postPagePicture, page_platform: platform } = page;
                                fetchPromises.push(
                                    axios.post(`${BACKEND_URL}/api/top_posts`,
                                        { userUuid, pageId, platform },
                                        {
                                            headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                                            }
                                        }
                                    ).then(response => ({
                                        data: response.data.data,
                                        postPageName,
                                        postPagePicture,
                                        accountName: account.name || '',
                                        platform
                                    }))                                    
                                );
                            } else {
                                setLoading(false);
                            }
                        });
                    }
                }
            });

            // Process all API responses once
            const results = await Promise.allSettled(fetchPromises);
            let allPosts = [];

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    const { accountName, postPageName, postPagePicture, platform } = result.value;  
                    // console.log("Posts result:",result.value);
                    const data = result.value.data;              
                    const postsWithMetadata = data.map(post => {
                        if (platform === 'facebook') {
                            return {
                                id: post.id,
                                content: post.content,
                                form_id:post.form_id,
                                views: post.unique_impressions || 0,
                                postMedia: post.post_media || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`,
                                created_time: post.week_date,
                                postPageName,
                                postPagePicture,
                                accountName,
                                platform
                            };
                        }
                        
                        if (platform === 'linkedin') {
                            return {
                                id: post.id,
                                content: post.content || '',
                                form_id:post.form_id,
                                views: post.impressions || 0,
                                postMedia: post.post_media || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`,
                                created_time: post.week_date,
                                // message: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
                                // views: post.postStat?.impressionCount || 0,
                                // image: post.specificContent?.['com.linkedin.ugc.ShareContent']?.media?.[0]?.thumbnails?.[0]?.url || 
                                //     `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`,
                                // created_time: post.created?.time,
                                postPageName,
                                postPagePicture,
                                accountName,
                                platform
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    allPosts = [...allPosts, ...postsWithMetadata];
                }
            });
            const sortedPosts = allPosts.sort((a, b) => b.views - a.views);
            //console.log("Top Posts: ",sortedPosts);
            setTopPosts(sortedPosts);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setLoading(false);
        } finally {
            setLoading(false);
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
        facebook: '#1877F2',
        instagram: '#FCAF45', 
        linkedin: '#40b8f5'       
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
                        return (value >= 1000 
                        ? (value / 1000).toFixed(1).replace('.0', '') + 'k' 
                        : value);
                    }
                }
            },
            stroke: { width: 2, curve: 'smooth' },
            legend: { position: 'bottom' },
            tooltip: {
                x: { format: 'dd MMM' },
                y: {
                    formatter: function(value) {                        
                        return (value >= 1000 
                        ? (value / 1000).toFixed(1).replace('.0', '') + 'k' 
                        : value) + ' Views';
                    }
                }
            }
        });
        
        setImpresionsChartOptions({
            chart: {
                id: 'impresions-chart',
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
                        return (value >= 1000 
                        ? (value / 1000).toFixed(1).replace('.0', '') + 'k' 
                        : value);
                    }
                }
            },
            stroke: { width: 2, curve: 'smooth' },
            legend: { position: 'bottom' },
            tooltip: {
                x: { format: 'dd MMM' },
                y: {
                    formatter: function(value) {
                        return (value >= 1000 
                        ? (value / 1000).toFixed(1).replace('.0', '') + 'k' 
                        : value) + ' Impressions';
                    }
                    
                }
            }
        });

        setColumnChartOptions({
            chart: {
                type: 'bar',
                toolbar: { show: false }
            },
            xaxis: {
                categories: weekLabels,
                labels: { show: true }
            },
            yaxis: { 
                labels: { 
                    show: true,
                    formatter: function (value) {
                        return value >= 1000 ? (value / 1000).toFixed(1).replace('.0', '') + 'k' : value;
                    }
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                    endingShape: 'rounded'
                },
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent']
            },
            legend: {
                position: 'top',
                show: false
            },
            tooltip: {
                x: { format: 'dd MMM' },
                y: {
                    formatter: function (value) {
                        return value >= 1000 ? (value / 1000).toFixed(1).replace('.0', '') + 'k' : value;
                    }
                } 
            }
        });       

    }, []);

    useEffect(() => {
        if (!analytics?.fetchData || weekDates.length === 0 || connectedAccountInfo.length === 0) return;

        // DEBUG: Log raw connected account info
        // 1. Extract connected platforms where at least one socialPage is also connected
        const connectedPlatforms = connectedAccountInfo.filter(account =>
                account.status === 'Connected' &&
                Array.isArray(account.socialPage) &&
                account.socialPage.some(page => page.status === 'Connected')
            ).map(account => account.social_user_platform?.toLowerCase());

        // DEBUG: Log what platforms are considered connected
        // console.log("Connected Platforms Detected:", connectedPlatforms);
        const getMetricData = (platform, analyticType, metricKey) => {
            if (!connectedPlatforms.includes(platform.toLowerCase())) {
                console.log(`Skipping metric data for platform: ${platform} (not connected)`);
                return weekDates.map(() => 0);
            }

            const filtered = analytics.fetchData.filter(
                item => item.platform?.toLowerCase() === platform.toLowerCase() && item.analytic_type === analyticType
            );

            return weekDates.map(date => {
                const entry = filtered.find(d => new Date(d.week_date).toISOString().split('T')[0] === date );
                return entry ? entry[metricKey] || 0 : 0;
            });
        };

        const impressionsData = analytics.fetchData.filter(item => item.analytic_type === 'page_impressions');
        setImpresionsChartSeries(groupDataByPlatform(impressionsData, 'total_page_impressions'));

        const viewsData = analytics.fetchData.filter(item => item.analytic_type === 'page_views_total');
        setVisitsChartSeries(groupDataByPlatform(viewsData, 'total_page_views'));

        const followsData = analytics.fetchData.filter(item => item.analytic_type === 'page_daily_follows');
        setFollowerChartSeries(groupDataByPlatform(followsData, 'total_page_followers'));

        // 2. Build platform-specific chart series ONLY IF platform is in connected list
        const platformChartData = {};

        if (connectedPlatforms.includes('facebook')) {
            platformChartData.facebook = [
            {
                name: 'Views',
                data: getMetricData('facebook', 'page_views_total', 'total_page_views'),
                color: '#7366ff'
            },
            {
                name: 'Followers',
                data: getMetricData('facebook', 'page_daily_follows', 'total_page_followers'),
                color: '#838383'
            },
            {
                name: 'Impressions',
                data: getMetricData('facebook', 'page_impressions', 'total_page_impressions'),
                color: '#65c15c'
            }
            ];
        }

        if (connectedPlatforms.includes('linkedin')) {
            platformChartData.linkedin = [
            {
                name: 'Views',
                data: getMetricData('linkedin', 'page_views_total', 'total_page_views'),
                color: '#7366ff'
            },
            {
                name: 'Followers',
                data: getMetricData('linkedin', 'page_daily_follows', 'total_page_followers'),
                color: '#838383'
            },
            {
                name: 'Impressions',
                data: getMetricData('linkedin', 'page_impressions', 'total_page_impressions'),
                color: '#65c15c'
            }
            ];
        }

        setPlatformChartSeries(platformChartData);

    }, [analytics, weekDates, connectedAccountInfo]);

    function getUnixTimestampMidnight(dateStr, offsetHours) {
        const d = new Date(dateStr);
        d.setUTCHours(0, 0, 0, 0);
        d.setHours(d.getHours() + offsetHours);
        return Math.floor(d.getTime() / 1000);
    }

    const groupDataByPlatform = (data, metricKey) => {
        const connectedPlatforms = connectedAccountInfo.filter(account =>
            account.status === 'Connected' &&
            Array.isArray(account.socialPage) &&
            account.socialPage.some(page => page.status === 'Connected')
            ).map(account => account.social_user_platform.toLowerCase());

        const filteredData = data.filter(item =>
            connectedPlatforms.includes((item.platform || '').toLowerCase())
        );

        const grouped = filteredData.reduce((acc, item) => {
            const platform = (item.platform || '').toLowerCase();
            if (!acc[platform]) acc[platform] = [];
            acc[platform].push(item);
            return acc;
        }, {});

        return Object.entries(grouped).map(([platform, items]) => {
            const dataForPlatform = new Array(weekDates.length).fill(0);
            items.forEach((item) => {
                if (!item.week_date) return;
                const itemDate = new Date(item.week_date).toISOString().split('T')[0];
                const index = weekDates.indexOf(itemDate);
                if (index !== -1) {
                    dataForPlatform[index] = item[metricKey] || 0;
                }
            });
            return {
                name: platform.charAt(0).toUpperCase() + platform.slice(1),
                data: dataForPlatform,
                color: platformColors[platform] || '#000000'
            };
        });
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getUTCDate();
        const month = new Intl.DateTimeFormat('en', {
            month: 'short',
            timeZone: 'UTC'
        }).format(date);
        const year = date.getUTCFullYear();
        return `${day} ${month} ${year}`;
    }  

    /************* Top Posts columns *****************/
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
                padding:'10px 5px 10px 5px'
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
    const columns = [
        {
            name: 'Post Content',
            selector: row => row.content.split(' ').slice(0, 10).join(' ') + (row.content.split(' ').length > 10 ? '...' : '') || 'No content',
            cell: row => (                
                    <div className="d-flex my-2">
                        <HoverPostPreview platform={row.platform.toLowerCase()} post={row}>
                            {(() => {
                                try {
                                    const media = typeof row.postMedia === 'string'? JSON.parse(row.postMedia) : row.postMedia;
                                    if (Array.isArray(media) && media.length > 0) {
                                        const firstMedia = media[0];
                                        if (firstMedia.path) {
                                            return <img src={`${process.env.REACT_APP_BACKEND_URL}${firstMedia.path}`} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                        }
                                        if (firstMedia.img_path) {
                                            return <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${firstMedia.img_path}`} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                        }
                                        if (typeof firstMedia === 'string' && firstMedia.startsWith('https://') ) {
                                            return <img src={firstMedia} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                        }
                                    } else if (media.img_path) {
                                        return <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${media.img_path}`} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                    } else if (typeof media === 'string' && media.startsWith('https://')) {
                                        return <img src={media} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                    />;
                                    }
                                } catch (e) {
                                    if (typeof row.postMedia === 'string' && row.postMedia.startsWith('http')) {
                                        return <img src={row.postMedia} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                    }
                                }                                                                                        
                                return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;                                                                                        
                            })()}
                        </HoverPostPreview>
                        {/* <img src={row.postMedia} alt="preview" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                            className="rounded-lg"
                            onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
                        /> */}
                        <div className="d-flex flex-column ms-3">
                            <p className="mb-0 pb-0" style={{ fontSize: '12px' }}>
                                {(row.content || "No message").split(' ').slice(0, 12).join(' ')}...</p>                                 
                            <span className='mt-2' style={{ fontSize: '12px' }}>
                                <img src={row.postPagePicture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                    alt="" style={{ width: '15px', marginRight: '5px' }} className="rounded-circle" />
                                {row.postPageName || 'Page name'}                               
                            </span>                          
                        </div>
                    </div>                
            ),
            sortable: false,
            grow: 3,
        },
        
        {
            name: 'Account Name',
            selector: row => row.accountName || '--',
            sortable: false,
            grow: 1,
        },
        {
            name: 'Views',
            selector: row => row.views || '0',
            sortable: false,
            grow: 1,
        },
        {
            name: 'Date',
            selector: row => formatDate(row.created_time),
            sortable: false,
            grow: 1,
        },
    ];
    /************* End Top Posts columns *****************/

    return (
        <div className="page-wrapper compact-wrapper mt-3">
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                <div className="page-body">                  
                    <div className="container-fluid dashboard-10">
                        {/* <div className="dashboard-header p-4 mb-4 mt-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="h2 mb-1 text-white">Social Media Engagement dfgdgsd</h1>
                                    <p className="mb-0 text-white">Track and analyze your social media performance last 7 days.</p>
                                </div>         
                            </div>
                        </div> */}

                            <div className="d-flex align-items-center mb-3" >
                                <div><h1 className="mb-0 h1-heading">Social Media Engagement</h1>
                                <p> Track and analyze your social media performance last 7 days. </p></div> 
                                
                            </div>


                        {isCheckingConnection ? ( 
                            <PageAnalyticSkeleton /> 
                        ) : connectedAccountInfo.length === 0 && !initialLoad ? (
                            <div className="error-wrapper" style={{minHeight:'0px'}}>
                                <div className="container">
                                    <div className="col-md-8 offset-md-2">
                                        <p className="sub-content mt-0 text-danger">
                                            Social accounts or pages not connected
                                        </p>
                                        <p>This status indicates that one or more required social media accounts or pages have not been linked to the platform or service. As a result, features that rely on these connections—such as content publishing, analytics, or social engagement tracking—may be unavailable. Please ensure all necessary accounts (e.g., Facebook, Instagram, LinkedIn) are properly connected to enable full functionality.</p>
                                        <button className="btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center w-100"
                                            onClick={() => setShowConnectModal(true)} > 
                                                <i className="fa-solid fa-plus fs-5 me-2"></i> Connect accounts 
                                        </button>
                                    </div>
                                </div>
                                <AccountNotConnectedComponent
                                    show={showConnectModal}
                                    onHide={() => setShowConnectModal(false)}
                                    onSuccess={async () => {
                                        let retries = 0;
                                        const maxRetries = 10;
                                        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
                                        let connected = false;
                                        while (!connected && retries < maxRetries) {
                                            try {
                                                const posts = fetchTopPosts();
                                                const data = await fetchAnalytics('all', '0');
                                                if (data && posts && data.length > 0 && posts.length > 0) {
                                                    setIsConnectedAccountInfo(data);
                                                    connected = true;
                                                    break;
                                                } else {
                                                    retries++;
                                                    await delay(2000);
                                                }
                                            } catch (err) {
                                                retries++;
                                                await delay(2000);
                                            }
                                        }
                                    }}
                                    setIsConnectedAccountInfo={setIsConnectedAccountInfo}
                                    pageURL={`${location.pathname}`}
                                />
                            </div>
                        ) : ( 
                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-12 od-xl-1 mobile-px-0">
                                        <div className="row">
                                            {Array.isArray(connectedAccountInfo) &&
                                                connectedAccountInfo.some(account =>
                                                    account.status === 'Connected' &&
                                                    account.social_user_platform?.toLowerCase() === 'facebook' &&
                                                    Array.isArray(account.socialPage) &&
                                                    account.socialPage.some(page => page.status === 'Connected')
                                                ) && (
                                                <div className="col s-xxl-3 box-col-4 col-xl-4 col-xxl-4">
                                                    <div className="card social-widget widget-hover">
                                                        <div className="card-body">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {/* <div className="social-icons">
                                                                        <img src={`${process.env.PUBLIC_URL}/assets/icons/fb.png`} alt="facebook icon"/>
                                                                    </div> */}
                                                                    <div
                                                                        className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                        style={{
                                                                            background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                            width: "40px",
                                                                            height: "40px"
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
                                                                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7
                                                                            a1 1 0 0 1 1-1h3z"></path>
                                                                        </svg>
                                                                    </div>
                                                                    <span>Facebook </span>
                                                                </div>
                                                                <Link to="/facebook-analytics-detail" className="font-dark f-12">
                                                                    <i className="fa-solid fa-eye"></i>
                                                                </Link>
                                                            </div>
                                                            <div className="social-content">
                                                                <div> 
                                                                    <h6 className="mb-1 counter text-center h6-card-heading" data-target={analytics?.totals?.facebook?.total_page_views?? 0}>{formatK(analytics?.totals?.facebook?.total_page_views)?? 0}</h6>
                                                                    <span className="f-light text-center">Views</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.facebook?.total_page_views < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.facebook?.total_page_views > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.facebook?.total_page_views < 0 ? 'font-danger' :
                                                                        analytics?.growth?.facebook?.total_page_views > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.facebook?.total_page_views ?? 0}%
                                                                    </p>
                                                                </div>
                                                                <div> 
                                                                    <h6 className="mb-1 counter text-center h6-card-heading" data-target={analytics?.totals?.facebook?.total_page_followers ?? 0}>{formatK(analytics?.totals?.facebook?.total_page_followers)?? 0}</h6>
                                                                    <span className="f-light text-center">Followers</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.facebook?.total_page_followers < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.facebook?.total_page_views > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.facebook?.total_page_followers < 0 ? 'font-danger' :
                                                                        analytics?.growth?.facebook?.total_page_followers > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.facebook?.total_page_followers ?? 0}%
                                                                    </p>
                                                                </div>
                                                                <div> 
                                                                    <h6 className="mb-1 counter text-center h6-card-heading" data-target={analytics?.totals?.facebook?.total_page_impressions ?? 0}>{formatK(analytics?.totals?.facebook?.total_page_impressions) ?? 0}</h6>
                                                                    <span className="f-light text-center">Impresions</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.facebook?.total_page_impressions < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.facebook?.total_page_views > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.facebook?.total_page_impressions < 0 ? 'font-danger' :
                                                                        analytics?.growth?.facebook?.total_page_impressions > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.facebook?.total_page_impressions ?? 0}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {Array.isArray(connectedAccountInfo) &&
                                                connectedAccountInfo.some(account =>
                                                    account.status === 'Connected' &&
                                                    account.social_user_platform?.toLowerCase() === 'instagram' &&
                                                    Array.isArray(account.socialPage) &&
                                                    account.socialPage.some(page => page.status === 'Connected')
                                                ) && (
                                                <div className="col s-xxl-3 box-col-4 col-xl-4 col-xxl-4">
                                                    <div className="card social-widget widget-hover">
                                                        <div className="card-body">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <div className="social-icons">
                                                                        <img src={`${process.env.PUBLIC_URL}/assets/icons/insta.png`} alt="facebook icon"/>
                                                                    </div>
                                                                    <span>Instagram</span>
                                                                </div>
                                                                <span className="font-dark f-12 d-xxl-block" style={{cursor:'pointer'}}>
                                                                    <i className="fa-solid fa-eye"></i>
                                                                </span>
                                                            </div>
                                                            <div className="social-content">
                                                                <div> 
                                                                    <h5 className="mb-1 counter text-center" data-target={analytics?.totals?.instagram?.total_page_views ?? 0}>{formatK(analytics?.totals?.instagram?.total_page_views) ?? 0}</h5>
                                                                    <span className="f-light text-center">Views</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.instagram?.total_page_views < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.instagram?.total_page_views > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.instagram?.total_page_views < 0 ? 'font-danger' :
                                                                        analytics?.growth?.instagram?.total_page_views > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.instagram?.total_page_views ?? 0}%
                                                                    </p>                                                            
                                                                </div>
                                                                <div> 
                                                                    <h5 className="mb-1 counter text-center" data-target={analytics?.totals?.instagram?.total_page_followers ?? 0}>{formatK(analytics?.totals?.instagram?.total_page_followers) ?? 0}</h5>
                                                                    <span className="f-light text-center">Followers</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.instagram?.total_page_followers < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.instagram?.total_page_followers > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.instagram?.total_page_followers < 0 ? 'font-danger' :
                                                                        analytics?.growth?.instagram?.total_page_followers > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.instagram?.total_page_followers ?? 0}%
                                                                    </p>
                                                                </div>
                                                                <div> 
                                                                    <h5 className="mb-1 counter text-center" data-target={analytics?.totals?.instagram?.total_page_impressions ?? 0}>{formatK(analytics?.totals?.instagram?.total_page_impressions) ?? 0}</h5>
                                                                    <span className="f-light text-center">Impresions</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.instagram?.total_page_impressions < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.instagram?.total_page_impressions > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.instagram?.total_page_impressions < 0 ? 'font-danger' :
                                                                        analytics?.growth?.instagram?.total_page_impressions > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.instagram?.total_page_impressions ?? 0}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {Array.isArray(connectedAccountInfo) &&
                                                connectedAccountInfo.some(account =>
                                                    account.status === 'Connected' &&
                                                    account.social_user_platform?.toLowerCase() === 'linkedin' &&
                                                    Array.isArray(account.socialPage) &&
                                                    account.socialPage.some(page => page.status === 'Connected')
                                                ) && (
                                                <div className="col s-xxl-3 box-col-4 col-xl-4 col-xxl-4">
                                                    <div className="card social-widget widget-hover">
                                                        <div className="card-body">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {/* <div className="social-icons">
                                                                        <img src={`${process.env.PUBLIC_URL}/assets/icons/linked.png`} alt="facebook icon"/>
                                                                    </div> */}

                                                                    <div
                                                                        className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                        style={{
                                                                            background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                            width: "40px",
                                                                            height: "40px"
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
                                                                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4
                                                                            0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                                            <rect x="2" y="9" width="4" height="12"></rect>
                                                                            <circle cx="4" cy="4" r="2"></circle>
                                                                        </svg>
                                                                    </div>                                                                    
                                                                    <span>LinkedIn</span>
                                                                </div>
                                                                <Link to="/linkedin-analytics-detail" >
                                                                    <span className="font-dark f-12 d-xxl-block" style={{cursor:'pointer'}}>
                                                                        <i className="fa-solid fa-eye"></i>
                                                                    </span>
                                                                </Link>
                                                            </div>
                                                            <div className="social-content">
                                                                <div> 
                                                                    <h6 className="h6-card-heading mb-1 counter text-center" data-target={analytics?.totals?.linkedin?.total_page_views ?? 0}>{formatK(analytics?.totals?.linkedin?.total_page_views)?? 0}</h6>
                                                                    <span className="f-light text-center">Views</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.linkedin?.total_page_views < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.linkedin?.total_page_views > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.linkedin?.total_page_views < 0 ? 'font-danger' :
                                                                        analytics?.growth?.linkedin?.total_page_views > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.linkedin?.total_page_views ?? 0}%
                                                                    </p>
                                                                </div>
                                                                <div> 
                                                                    <h6 className="h6-card-heading mb-1 counter text-center" data-target={analytics?.totals?.linkedin?.total_page_followers ?? 0}>{formatK(analytics?.totals?.linkedin?.total_page_followers)?? 0}</h6>
                                                                    <span className="f-light text-center">Followers</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.linkedin?.total_page_followers < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.linkedin?.total_page_followers > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.linkedin?.total_page_followers < 0 ? 'font-danger' :
                                                                        analytics?.growth?.linkedin?.total_page_followers > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.linkedin?.total_page_followers ?? 0}%
                                                                    </p>                                                            
                                                                </div>
                                                                <div> 
                                                                    <h6 className="h6-card-heading mb-1 counter text-center" data-target={analytics?.totals?.linkedin?.total_page_impressions ?? 0}>{formatK(analytics?.totals?.linkedin?.total_page_impressions)?? 0}</h6>
                                                                    <span className="f-light text-center">Impresions</span>
                                                                    <p className="text-center mb-0">
                                                                        {analytics?.growth?.linkedin?.total_page_impressions < 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-down font-danger me-1">
                                                                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                                                <polyline points="17 18 23 18 23 12"></polyline>
                                                                            </svg>
                                                                        ) : analytics?.growth?.linkedin?.total_page_impressions > 0 ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trending-up font-success me-1">
                                                                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                                                <polyline points="17 6 23 6 23 12"></polyline>
                                                                            </svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-minus font-dark me-1">
                                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                            </svg>
                                                                        )}
                                                                    </p>
                                                                    <p className={`text-center f-12 ${
                                                                        analytics?.growth?.linkedin?.total_page_impressions < 0 ? 'font-danger' :
                                                                        analytics?.growth?.linkedin?.total_page_impressions > 0 ? 'font-success' : 'font-dark'
                                                                    }`}>
                                                                        {analytics?.growth?.linkedin?.total_page_impressions ?? 0}%
                                                                    </p>                                                            
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-xxl-6 col-xl-6 col-md-6 ord-md-i box-col-4 mobile-px-0">
                                        <div className="card visits-wrapper">
                                            <div className="card-header card-no-border">
                                                <div className="header-top">
                                                    <h5>Views </h5>                                                
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">                                            
                                                <div className="common-m-chart">
                                                    <Chart
                                                        options={visitsChartOptions}
                                                        series={visitsChartSeries}
                                                        type="line"
                                                        width="100%"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xxl-6 col-xl-6 col-md-6 ord-md-i box-col-4 mobile-px-0">
                                        <div className="card visits-wrapper">
                                            <div className="card-header card-no-border">
                                                <div className="header-top">
                                                    <h5>Followers</h5>                                                
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">                                            
                                                <div className="common-m-chart">
                                                    <Chart
                                                        options={followerChartOptions}
                                                        series={followerChartSeries}
                                                        type="line"
                                                        width="100%"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-xxl-6 col-xl-6 col-md-6 ord-md-i box-col-4 mobile-px-0">
                                        <div className="card visits-wrapper">
                                            <div className="card-header card-no-border">
                                                <div className="header-top">
                                                    <h5>Impresions</h5>                                                
                                                </div>
                                            </div>
                                            <div className="card-body pt-0">                                                                              
                                                <div className="common-m-chart">
                                                    <Chart
                                                        options={impresionsChartOptions}
                                                        series={impresionsChartSeries}
                                                        type="line"
                                                        width="100%"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>                                                                                          
                                </div>

                                <div className="row">
                                    <div className="col-xxl-12 col-xl-12 od-xl-12 box-col-12 mobile-px-0">
                                        <div className="card heading-space">
                                            <div className="card-header card-no-border">
                                                <div className="header-top" style={{marginLeft:'0px'}}>
                                                    <h5 className="m-0">Top posts by views</h5>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0 px-0 campaign-table">
                                                <div className="social-tabs" style={{paddingLeft:'20px',paddingRight:'20px'}}>
                                                    <div className="nav nav-pills" id="topPosts-pills-tab" role="tablist">
                                                        {connectedAccountInfo.some(account => account.social_user_platform === 'facebook' && account.status === 'Connected') && (
                                                            <a className="social-box bg-7-primary active" id="facebook-top-posts" href="#!" data-bs-toggle="pill" data-bs-target="#v-pills-facebook-top-posts" role="tab" aria-controls="v-pills-facebook-top-posts" aria-selected="false">
                                                                <div className="frame-image">
                                                                    {/* <div className="outline-10-primary">
                                                                        <div className="bg-10-primary"><i className="fa-brands fa-facebook-f bg-primary text-light m-0"></i></div>
                                                                    </div> */}

                                                                     <div
                                                                        className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                        style={{
                                                                            background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                            width: "30px",
                                                                            height: "30px"
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            width="18"
                                                                            height="18"
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
                                                                <span>Facebook</span>
                                                            </a>
                                                        )}
                                                        {connectedAccountInfo.some(account => account.social_user_platform === 'linkedin' && account.status === 'Connected') && (
                                                            <a className="social-box bg-7-info" id="linkedin-top-posts" href="#!" data-bs-toggle="pill" data-bs-target="#v-pills-linkedin-top-posts" role="tab" aria-controls="v-pills-linkedin-top-posts" aria-selected="false">
                                                                <div
                                                                    className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                    style={{
                                                                        background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                        width: "30px",
                                                                        height: "30px"
                                                                    }}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        width="18"
                                                                        height="18"
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
                                                                <span>Linkedin</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="tab-content" id="social-pills-tabContent">
                                                        <div className="tab-pane fade show active" id="v-pills-facebook-top-posts" role="tabpanel">                                                        
                                                            <div className="table-responsive currency-table custom-scrollbar mt-3 mb-2">
                                                                <div id="campaigns-table_wrapper" className="dt-container dt-empty-footer">
                                                                    {loading ? (
                                                                        <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                                                                            <div className="spinner-border text-primary" role="status">
                                                                                <span className="visually-hidden">Loading...</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <DataTable 
                                                                            columns={columns}
                                                                            data={topPosts.filter(post => post.platform === 'facebook').slice(0, visiblePosts)}
                                                                            customStyles={customStyles}
                                                                            conditionalRowStyles={conditionalRowStyles}
                                                                            pagination={false}
                                                                            responsive={true}                                                                            
                                                                            striped={true}
                                                                        />
                                                                    )}
                                                                    {/* <div className="dt-layout-row dt-layout-table">                                                                                                                             
                                                                        <table className="table px-3">
                                                                            <thead>
                                                                                <tr>                                                                                   
                                                                                    <th className='text-center'>Page</th>
                                                                                    <th className='text-center'>Account</th> 
                                                                                    <th className='text-center'>Image</th>                                                    
                                                                                    <th className='text-center'>Title</th>
                                                                                    <th className='text-center'>Views</th>
                                                                                    <th className='text-center'>Date</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {loading ? (
                                                                                    <tr>
                                                                                        <td colSpan="12" className="text-center">
                                                                                            <i className="fas fa-spin fa-spinner" style={{ fontSize: '25px' }}></i>
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : topPosts.filter(post => post.platform === 'facebook').slice(0, visiblePosts).length > 0 ? (topPosts
                                                                                        .filter(post => post.platform === 'facebook')
                                                                                        .slice(0, visiblePosts)
                                                                                        .map(post => (
                                                                                        <tr key={post.id}>                                                                                            
                                                                                            <td className="f-w-500 text-center" style={{ width: '150px' }}>
                                                                                                <img className="rounded-circle"
                                                                                                    src={post.postPagePicture}
                                                                                                    alt="Post visual"
                                                                                                    style={{ width: '25px', marginRight: '5px' }}
                                                                                                /> {post.postPageName}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center" style={{ width: '200px' }}>
                                                                                                {post.accountName}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center">
                                                                                                {post.image && (
                                                                                                    <img
                                                                                                        src={post.image}
                                                                                                        alt="Post visual"
                                                                                                        style={{ maxWidth: '50px', borderRadius: '8px' }}
                                                                                                    />
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center">
                                                                                                {post.content.split(' ').slice(0, 10).join(' ') + (post.content.split(' ').length > 10 ? '...' : '')}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center">{post.views}</td>
                                                                                            <td className="f-w-500 text-center">{formatDate(post.created_time)}</td>
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="12" className="text-center text-danger">Posts not found</td>
                                                                                    </tr>
                                                                                )}                                                            
                                                                            </tbody>
                                                                        </table>                                                        
                                                                    </div> */}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="tab-pane fade" id="v-pills-linkedin-top-posts" role="tabpanel">                                                        
                                                            <div className="table-responsive currency-table custom-scrollbar mt-3 mb-2">
                                                                <div id="campaigns-table_wrapper" className="dt-container dt-empty-footer">
                                                                    {loading ? (
                                                                        <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                                                                            <div className="spinner-border text-primary" role="status">
                                                                                <span className="visually-hidden">Loading...</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <DataTable 
                                                                            columns={columns}
                                                                            data={topPosts.filter(post => post.platform === 'linkedin').slice(0, visiblePosts)}
                                                                            customStyles={customStyles}
                                                                            conditionalRowStyles={conditionalRowStyles}
                                                                            pagination={false}
                                                                            responsive={true}                                                                            
                                                                            striped={true}
                                                                        />
                                                                    )}
                                                                    {/* <div className="dt-layout-row dt-layout-table">                                                        
                                                                        <table className="table px-2">                                                                            
                                                                            <tbody>
                                                                                {loading ? (
                                                                                    <tr>
                                                                                        <td colSpan="12" className="text-center">
                                                                                            <i className="fas fa-spin fa-spinner" style={{ fontSize: '25px' }}></i>
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : topPosts.filter(post => post.platform === 'linkedin').slice(0, visiblePosts).length > 0 ? (topPosts
                                                                                        .filter(post => post.platform === 'linkedin')
                                                                                        .slice(0, visiblePosts)
                                                                                        .map(post => (
                                                                                        <tr key={post.id}>                                                                                            
                                                                                            <td className="f-w-500 text-center" style={{ width: '150px' }}>
                                                                                                <img className="rounded-circle"
                                                                                                    src={post.postPagePicture}
                                                                                                    alt="Post visual"
                                                                                                    style={{ width: '25px', marginRight: '5px' }}
                                                                                                /> {post.postPageName}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center" style={{ width: '200px' }}>
                                                                                                {post.accountName}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center">
                                                                                                {post.image && (
                                                                                                    <img
                                                                                                        src={post.image}
                                                                                                        alt="Post visual"
                                                                                                        style={{ maxWidth: '50px', borderRadius: '8px' }}
                                                                                                    />
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center">
                                                                                                {post.content.split(' ').slice(0, 10).join(' ') + (post.content.split(' ').length > 10 ? '...' : '')}
                                                                                            </td>
                                                                                            <td className="f-w-500 text-center">{post.views}</td>
                                                                                            <td className="f-w-500 text-center">{formatDate(post.created_time)}</td>
                                                                                        </tr>
                                                                                    ))
                                                                                ) : (
                                                                                    <tr>
                                                                                        <td colSpan="12" className="text-center text-danger">Posts not found</td>
                                                                                    </tr>
                                                                                )}                                                            
                                                                            </tbody>
                                                                        </table>                                                        
                                                                    </div> */}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>                                            
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-12 od-xl-7 mobile-px-0">
                                        <div className="card sales-report">
                                        <div className="card-header card-no-border">
                                                <div className="header-top">
                                                    <h5>Social Analytics</h5>
                                                </div>
                                            </div>
                                            <div className="card-body pt-0 analytics-data">
                                                <ul className="balance-data"> 
                                                    <li><span className="circle bg-primary"></span><span className="c-light ms-1">Views</span></li>
                                                    <li><span className="circle bg-secondary"> </span><span className="c-light ms-1">Followers</span></li>
                                                    <li><span className="circle bg-success"></span><span className="c-light ms-1">Impresions</span></li>
                                                </ul>
                                                <div className="social-tabs">
                                                    <div className="nav nav-pills custom-scrollbar" id="social-pills-tab" role="tablist">
                                                        {connectedAccountInfo.some(account => account.social_user_platform === 'facebook' && account.status === 'Connected') && (
                                                            <a className="social-box bg-7-primary active" id="v-pills-facebook-tab" href="#!" data-bs-toggle="pill" data-bs-target="#v-pills-facebook" role="tab" aria-controls="v-pills-facebook" aria-selected="false">
                                                                {/* <div className="frame-image">
                                                                    <div className="outline-10-primary">
                                                                        <div className="bg-10-primary"><i className="fa-brands fa-facebook-f bg-primary text-light m-0"></i></div>
                                                                    </div>
                                                                </div> */}
                                                                 <div
  className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-circle"
  style={{
    background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
    width: "30px",
    height: "30px"
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-white"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7
      a1 1 0 0 1 1-1h3z"></path>
  </svg>
</div>
                                                                <span>Facebook</span>
                                                            </a>
                                                        )}
                                                        {connectedAccountInfo.some(account => account.social_user_platform === 'linkedin' && account.status === 'Connected') && (
                                                            <a className="social-box bg-7-info" id="v-pills-linkedin-tab" href="#!" data-bs-toggle="pill" data-bs-target="#v-pills-linkedin" role="tab" aria-controls="v-pills-linkedin" aria-selected="false">
                                                                {/* <div className="frame-image">
                                                                    <div className="outline-10-info">
                                                                        <div className="bg-10-info"><i className="fa-brands fa-linkedin-in bg-info text-light m-0"></i></div>
                                                                    </div>
                                                                </div> */}

                                                                <div
  className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-circle"
  style={{
    background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
    width: "30px",
    height: "30px"
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
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
                                                                <span>Linkedin</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="tab-content" id="social-pills-tabContent">
                                                        <div className="tab-pane fade show active" id="v-pills-facebook" role="tabpanel">                                                        
                                                            <div>
                                                                {/* <div id="facebook-analysis"></div> */}
                                                                <Chart
                                                                    options={columnChartOptions}
                                                                    series={platformChartSeries.facebook}
                                                                    type="bar"
                                                                    height={350}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="tab-pane fade" id="v-pills-linkedin" role="tabpanel">                                                        
                                                            <div>
                                                                {/* <div id="linked-analysis"></div> */}
                                                                <Chart
                                                                    options={columnChartOptions}
                                                                    series={platformChartSeries.linkedin}
                                                                    type="bar"
                                                                    height={350}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>                        
                                        </div>
                                    </div>
                                </div>
                                
                            </div> 
                        )}                    
                    </div>                                        
                </div>
                <Footer />
            </div>
        </div>
    )
}