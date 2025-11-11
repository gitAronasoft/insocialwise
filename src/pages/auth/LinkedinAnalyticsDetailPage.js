import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Footer from "../../components/Footer";
import axios from "axios";
import Chart from "react-apexcharts";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import Modal from "react-modal";
import { Dropdown } from "react-bootstrap";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, subDays, set } from "date-fns";
import DataTable from "react-data-table-component";
import DateRangePickerComponent from "./components/DateRangePickerComponent";
import dayjs from "dayjs";
import { getCustomStaticRanges } from "./utils/dateRanges";
import LinkedinDetailSkeleton from './components/LinkedinDetailSkeleton';
import HoverPostPreview from './components/HoverPostPreview';
import CommentSentimentComponent from './components/CommentSentimentComponent';
import Carousel from "react-multi-carousel";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

export default function LinkedinAnalyticsDetailPage() {
  const RunGetAnalyticsAPI = useRef(false);
  const [fullScreenLoader, setFullScreenLoader] = useState(false);
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Summary");
  const [visiblePosts, setVisiblePosts] = useState(10);
  const [connectedAccountInfo, setConnectedAccountInfo] = useState([]);
  const [showPagesList, setShowPagesList] = useState(false);
  const [selectPage, setSelectPage] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [weekly_post_analytics, setweeklyAnalytics] = useState([]);
  const [postDataGrowth, setGrowthPercentage] = useState([]);
  const [demographicData, setDemoData] = useState([]);
  const [pageLinkedinTotalFollowersCount, setPageLinkedinTotalFollowersCount] = useState(0);
  const [weekDates, setWeekDates] = useState([]);
  const [columnChartOptions, setColumnChartOptions] = useState({});
  const [platformChartSeries, setPlatformChartSeries] = useState({linkedin: [],});
  const localizer = momentLocalizer(moment);
  const hasRun = useRef(false);

  const [postToDelete, setPostToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postView, setPostView] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [postListBy, setpostListBy] = useState("publishedPost");
  const [postListByFilter, setpostListByFilter] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentsSentiment, setCommentsSentiment] = useState(null);
  const [posts, setPosts] = useState([]);

  const [locationOption, setlocationOptions] = useState({});
  const [locationSeries, setlocationSeries] = useState({});
  const [locationGraphLoading, setlocationGraphLoading] = useState(true);

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const datePickerRef = useRef(null);
  const [showDatePickerCalendar, setShowDatePickerCalendar] = useState(false);

  const today = new Date();
  const endDate = subDays(today, 1);
  const startDate = subDays(endDate, 6);

  const [selectedRange, setSelectedRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: subDays(new Date(), 1),
    key: "selection",
  });
  const [selectedDays, setSelectedDays] = useState([selectedRange]);
  const [showSelectedDays, setshowSelectedDays] = useState(null);
  const [showCalendarFilterText, setShowCalendarFilterText] = useState(null);
  const [PageToken, setPageToken] = useState(null);

  const [commentPosts, setCommentPosts] = useState([]);
  const [allComments, setAllComments] = useState([]); // Store original comments
  const [commentCurrentFilter, setCommentCurrentFilter] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [totalComments, setTotalPostCommentNumber] = useState("");
  const [selectCommentPost, setSelectCommentPost] = useState([]);
  const [commentPostModal, setCommentPostModal] = useState(false);
  const [deleteCommentModal, setDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingComment, setEditingComment] = useState({id: null, text: "",});

  // State for reply functionality
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [deleteMultipleCommentsModel, setDeleteMultipleCommentsModel] = useState(false);

  const topLevel = [];
  const repliesMap = {};

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const handleEdit = (formId) => {
    navigate("/edit-post", { state: { formId } });
  };
  const carouselResponsive = {
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
    tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
    mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
  };

  const shortRelativeTime = (inputTime) => {
    const now = dayjs();
    const time = dayjs(inputTime);
    const diffInMinutes = now.diff(time, "minute");
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = now.diff(time, "hour");
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = now.diff(time, "day");
    return `${diffInDays}d ago`;
  };

  useEffect(() => {
    if (selectedRange) {
      setSelectedDays([selectedRange]);
    }
  }, [selectedRange]);

  useEffect(() => {
    setSelectPage("");
    setlocationGraphLoading(true);
    if ( hasRun.current || !connectedAccountInfo?.length || !connectedAccountInfo[0].socialPage?.[0]?.status === "Connected" )
      hasRun.current = true;

    const fetchSocialData = async () => {
      try {
        const userInfoData = JSON.parse(localStorage.getItem("userinfo"));
        if (userInfoData?.socialData) {
          const connectedAccounts = userInfoData.socialData.filter(
            (social) => social.status === "Connected" && social.social_user_platform === "linkedin"
          );
          setConnectedAccountInfo(connectedAccounts);

          if (connectedAccounts.length > 0) {
            if (connectedAccounts[0].socialPage[0].status === "Connected") {
              setShowDatePickerCalendar(false);
              const formattedStart = format(selectedDays[0].startDate, 'dd MMM yyyy');
              const formattedEnd = format(selectedDays[0].endDate, 'dd MMM yyyy');
              setshowSelectedDays(`Last 7 days: ${formattedStart} - ${formattedEnd}`);
              setShowCalendarFilterText('Last 7 days');

              setPageLinkedinTotalFollowersCount(connectedAccounts[0].socialPage[0].total_followers);
              setSelectPage(connectedAccounts[0].socialPage[0]); 
              await fetchLinkedinAnalyticsData(connectedAccounts[0].socialPage[0].pageId);
              await fetchDemographicData(connectedAccounts[0].socialPage[0].pageId, connectedAccounts[0].social_id);
              // await fetchPosts(); 
              //await FetchPostsComments(connectedAccounts[0].socialPage[0]);
              
              const getDataFormDate = format(selectedDays[0].startDate, 'yyyy-MM-dd');
              const getDataToDate = format(selectedDays[0].endDate, 'yyyy-MM-dd');              
              await FetchPostsComments('linkedin', connectedAccounts[0].socialPage[0].pageId, getDataFormDate, getDataToDate);
              setPageToken(connectedAccounts[0].socialPage[0].token);
            }
          }
        }
      } catch (error) {
        console.error("Parsing error:", error);
      }
    };

    fetchSocialData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPagesList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let totalComments = 0;
    if (Array.isArray(commentPosts) && selectCommentPost?.id) {
      commentPosts.forEach((cp) => {
        if (cp.post_id === selectCommentPost.post_id) {
          totalComments += 1;
        }
      });
    }
    setTotalPostCommentNumber(totalComments);
  });

  // Update selected comments when commentPosts changes (filtering)
    useEffect(() => {
        // If all visible comments are selected, keep selectAll true
        const allVisibleIds = commentPosts.map(comment => comment.id);
        const allSelected = allVisibleIds.length > 0 && 
                            allVisibleIds.every(id => selectedComments.includes(id));
        setSelectAll(allSelected);
    }, [commentPosts, selectedComments]);

  function formatK(num) {
    // if (num >= 1000) {
    //   return (num / 1000).toFixed(1) + "K";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }else{
      return num;
    }
  }

  const generateLastWeekData = useCallback(() => {
    if (!selectedDays.length) return { weekLabels: [], weekDates: [] };
    const dates = [];
    const startDate = new Date(selectedDays[0].startDate);
    const endDate = new Date(selectedDays[0].endDate);

    for (let d = new Date(startDate); d <= endDate; ) {
      dates.push(new Date(d.getTime()));
      d.setDate(d.getDate() + 1);
    }

    const weekLabels = dates.map(
      (date) => `${date.getDate()} ${months[date.getMonth()]}`
    );

    const weekDates = dates.map(
      (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0" )}-${String(date.getDate()).padStart(2, "0")}`
    );

    return { weekLabels, weekDates };
  }, [selectedDays]);

  useEffect(() => {
    const { weekLabels, weekDates, weekRangeText } = generateLastWeekData();
    setWeekDates(weekDates);

    setColumnChartOptions({
      chart: {
        type: "bar",
        toolbar: { show: false },
      },
      xaxis: {
        categories: weekLabels,
        labels: { show: true },
        type: "datetime",
      },
      yaxis: {
        labels: {
          show: true,
          formatter: function (value) {
            return value >= 1000
              ? (value / 1000).toFixed(1).replace(".0", "") + "k"
              : value;
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "70%",
          endingShape: "rounded",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 3,
        colors: ["transparent"],
      },
      legend: {
        position: "top",
        show: false,
      },
      tooltip: {
        x: { format: "dd MMM" },
        y: {
          formatter: function (value) {
            return value >= 1000
              ? (value / 1000).toFixed(1).replace(".0", "") + "k"
              : value;
          },
        },
      },
    });
  }, [generateLastWeekData]);

  useEffect(() => {
    if (analytics.fetchData && weekDates.length > 0) {
      const getMetricData = (platform, analyticType, metricKey) => {
        const filtered = analytics.fetchData.filter(
          (item) => item.platform === platform && item.analytic_type === analyticType
        );
        return weekDates.map((date) => {
          const entry = filtered.find(
            (d) => new Date(d.week_date).toISOString().split("T")[0] === date
          );
          return entry ? entry[metricKey] || 0 : 0;
        });
      };

      setPlatformChartSeries({
        linkedin: [
          {
            name: "Views",
            data: getMetricData("linkedin","page_views_total","total_page_views"),
            color: "#7366ff",
          },
          {
            name: "Followers",
            data: getMetricData("linkedin","page_daily_follows","total_page_followers"),
            color: "#838383",
          },
          {
            name: "Impressions",
            data: getMetricData("linkedin","page_impressions","total_page_impressions"),
            color: "#65c15c",
          },
          {
            name: "Reach",
            data: getMetricData("linkedin","page_impressions_unique","total_page_impressions_unique"),
            color: "#3f475a",
          },
          {
            name: "Likes",
            data: getMetricData("linkedin","page_actions_post_reactions_like_total","page_actions_post_reactions_like_total"),
            color: "#fc564a",
          },
        ],
      });
    }
  }, [analytics, weekDates]);

  // Fetch anlaytics data on data change by user manually
  const fetchAnalytics = async (platform, pageID, getDataFromDate, getDataToDate) => {
    setFullScreenLoader(true);
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const authToken = localStorage.getItem("authToken");
    try {
      const analyticsResponse = await fetch(
        `${BACKEND_URL}/api/get-analytics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({
            lastMondayWeekDate: getDataFromDate,
            lastSundayWeekDate: getDataToDate,
            platformPageId: pageID,
            platform: platform,
          }),
        }
      );
      const response = await analyticsResponse.json();

      if ( response.publishedPostList?.length > 0 && response.prevPublishedPostList?.length > 0 ) {
        const sumStats = (posts) =>
          posts.reduce(
            (acc, post) => {
              acc.likes += parseInt(post.likes || 0, 10);
              acc.impressions += parseInt(post.impressions || 0, 10);
              acc.unique_impressions += parseInt( post.unique_impressions || 0, 10 );
              return acc;
            },
            { likes: 0, impressions: 0, unique_impressions: 0 }
          );

        const current = sumStats(response.publishedPostList);
        const previous = sumStats(response.prevPublishedPostList);

        const calculateGrowthPercent = (currentVal, prevVal) => {
          if (prevVal === 0) return currentVal > 0 ? 100 : 0;
          return +(((currentVal - prevVal) / prevVal) * 100).toFixed(2);
        };

        const growthPercentage = {
          likes: calculateGrowthPercent(current.likes, previous.likes),
          impressions: calculateGrowthPercent(current.impressions, previous.impressions),
          unique_impressions: calculateGrowthPercent(current.unique_impressions, previous.unique_impressions),
        };

        setweeklyAnalytics(current);
        setGrowthPercentage(growthPercentage);
        RunGetAnalyticsAPI.current = false;
      } else if (response.publishedPostList?.length > 0) {
        const singleStats = response.publishedPostList.reduce(
          (acc, post) => {
            acc.likes += parseInt(post.likes || 0, 10);
            acc.impressions += parseInt(post.impressions || 0, 10);
            acc.unique_impressions += parseInt(post.unique_impressions || 0, 10);
            return acc;
          },
          { likes: 0, impressions: 0, unique_impressions: 0 }
        );

        setweeklyAnalytics(singleStats);
        setGrowthPercentage({ likes: 100, impressions: 100, unique_impressions: 100 });
        RunGetAnalyticsAPI.current = false;
      }

      setAnalytics(response);
      setFullScreenLoader(false);
      setShowDeleteModal(false);
      setLoading(false);
      scheduledPost(response);
      if (response) {
        switch (postListBy) {
          case "draftPost":
            //console.log("draftPost");
            setpostListByFilter(response.latestDraftPost || []);
            break;
          case "scheduledPost":
            //console.log("scheduledPost");
            setpostListByFilter(response.latestScheduledPost || []);
            break;
          case "publishedPost":
            setpostListByFilter(response.publishedPostList || []);
            break;
          default:
            //console.log("else");
            setpostListByFilter(response.publishedPostList || []);
        }
      }
    } catch (error) {
      console.error("Get Analytics Error:", error);
    }
  };

  const fetchDemographicData = async ( organizationId, social_userid ) => {
    try {
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      const authToken = localStorage.getItem("authToken");
      const demographicResponse = await fetch(`${BACKEND_URL}/api/linkedin/demographics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({
            organizationId,
            social_userid,
          }),
        }
      );

      const demographicData = await demographicResponse.json();
      if (demographicData?.data) {
        setDemoData(demographicData.data);
        LocationBarChart(demographicData.data.geo || []);
        setlocationGraphLoading(false);
      }
    } catch (error) {
      console.error("Error fetching demographic data:", error);
    }
  };

  // start old fetching comments
    // const FetchPostsComments = async (socialUser) => {
    //   if (!socialUser?.pageId || !socialUser?.token) return;
    //   const authToken = localStorage.getItem("authToken");
    //   const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    //   try {
    //     const commentsResponse = await fetch(
    //       `${BACKEND_URL}/api/linkedin/get-post-comments`,
    //       {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json",
    //           Authorization: "Bearer " + authToken,
    //         },
    //         body: JSON.stringify({
    //           pageID: socialUser.pageId,
    //         }),
    //       }
    //     );
    //     const postsComments = await commentsResponse.json();
    //     if(postsComments?.postsData.length > 0){
    //       setCommentPosts(postsComments.postsData);
    //       setAllComments(postsComments.postsData); // Store original
    //       setCommentCurrentFilter('All');
    //       setSelectedComments([]); // Reset selection when new data loads
    //       setSelectAll(false);
    //     }else{
    //       setCommentPosts([]);
    //     }
    //   } catch (error) {
    //     console.error("Posts comments Error:", error);
    //     toast.error("Something went wrong fetching comments.", {
    //       position: "top-right",
    //       autoClose: 5000,
    //       hideProgressBar: false,
    //       closeOnClick: true,
    //     });
    //   }

    //   const getFormDate = format(selectedDays[0].startDate, 'yyyy-MM-dd');
    //   const getToDate = format(selectedDays[0].endDate, 'yyyy-MM-dd');
    //   const selectPageId = socialUser.pageId;
    //   const selectPagePlatform = "linkedin";
    //   await fetchCommentsSentiment(selectPagePlatform, selectPageId, getFormDate, getToDate);
    // };
  // end old fetching comments
  
  // start new function fetching comments 
    const FetchPostsComments = async (platform, pageID, getDataFormDate, getDataToDate) => {
      const authToken = localStorage.getItem("authToken");
      const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
      try {
        const analyticsResponse = await fetch(`${BACKEND_URL}/api/getPlatformPostComments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + authToken,
            },
            body: JSON.stringify({
                pageInfoID: pageID,
                platform: platform,
                getDataFormDate: getDataFormDate,
                getDataToDate: getDataToDate
            }),
        });
        const postsComments = await analyticsResponse.json();
        if(postsComments?.commentData.length > 0){
          setAllComments(postsComments.commentData);
          setCommentPosts(postsComments.commentData);
          setCommentCurrentFilter('All');
          setSelectedComments([]); 
          setSelectAll(false);
          await fetchCommentsSentiment(platform, pageID, getDataFormDate, getDataToDate);
        }else{
          setCommentPosts([]);
        }      
      } catch (error) {
        console.error('Posts comments Error:', error);        
        toast.error('Something went wrong fetching comments.', {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
        });
      }
    }
  // end new function fetching comments

  const fetchCommentsSentiment = async (platform, pageID, getDataFormDate, getDataToDate) => {
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const authToken = localStorage.getItem('authToken');
    try {
      const analyticsResponse = await fetch(`${BACKEND_URL}/api/get-comments-sentiment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
        body: JSON.stringify({
          lastMondayWeekDate: getDataFormDate,
          lastSundayWeekDate: getDataToDate,
          platformPageId: pageID,
          platform: platform
        }),
      });
      const response = await analyticsResponse.json();
      //console.log('response',response);
      if (response.success === true) {
        setCommentsSentiment(response.percentages);
      }
    } catch (error) {
      console.error('Token Extension Error:', error);
    }
  }

  // fetch analytics data on load by system default days ( 7 days )
  const fetchLinkedinAnalyticsData = async (socialPageId) => {
    if (selectedDays[0]) {
      const getDataFormDate = format(selectedDays[0].startDate, "yyyy-MM-dd");
      const getDataToDate = format(selectedDays[0].endDate, "yyyy-MM-dd");
      const selectPageId = socialPageId;
      await fetchAnalytics("linkedin", selectPageId, getDataFormDate, getDataToDate);            
      //await FetchPostsComments('linkedin', selectPageId, getDataFormDate, getDataToDate);
    }
    setShowPagesList(false);
  };

  const handleSelectedPage = async(socialPage) => {
    if (!socialPage?.pageId || !socialPage?.token || !socialPage?.social_userid) return;
    setPageLinkedinTotalFollowersCount(socialPage.total_followers);
    setSelectPage(socialPage);
    await fetchLinkedinAnalyticsData(socialPage.pageId);
    await fetchDemographicData(socialPage.pageId, socialPage.social_userid);
    const formattedStart = format(selectedDays[0].startDate, 'yyyy-MM-dd');
    const formattedEnd = format(selectedDays[0].endDate, 'yyyy-MM-dd');
    await FetchPostsComments('linkedin', socialPage.pageId, formattedStart, formattedEnd);    
  }

  const PostsByType = async (postType) => {
    setpostListByFilter("");
    if (postType === "publishedPost") {
      setpostListBy("publishedPost");
      setpostListByFilter(analytics.publishedPostList);
    } else if (postType === "draftPost") {
      setpostListBy("draftPost");
      setpostListByFilter(analytics.latestDraftPost);
    } else if (postType === "scheduledPost") {
      setpostListBy("scheduledPost");
      setpostListByFilter(analytics.latestScheduledPost);
    } else {
      setpostListBy("publishedPost");
      setpostListByFilter("");
    }
  };

  const handleDelete = () => {
    if (postToDelete) {
      deletePostDB(postToDelete, postToDelete.id);
      //setShowDeleteModal(false);
    }
  };

  const deletePostDB = async (postToDelete, post_ID) => {
    setLoading(true);
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const token = localStorage.getItem("authToken");
    try {
      const requestBody = {
        postID: post_ID,
        accessToken: PageToken,
        platformPostID: postToDelete.platform_post_id,
      };
      // console.log(requestBody);
      const response = await fetch(`${BACKEND_URL}/api/post-delete`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      await response.json();
      if (selectedDays[0]) {
        // const formattedStart = format(selectedDays[0].startDate, "dd MMM yyyy");
        // const formattedEnd = format(selectedDays[0].endDate, "dd MMM yyyy");
        // setshowSelectedDays(`Last 7 days: ${formattedStart} - ${formattedEnd}`);

        const getDataFormDate = format(selectedDays[0].startDate, "yyyy-MM-dd");
        const getDataToDate = format(selectedDays[0].endDate, "yyyy-MM-dd");
        await fetchAnalytics(postToDelete.post_platform, postToDelete.page_id, getDataFormDate, getDataToDate);
        toast.success("Post Deleted Successfully.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
        });
      }
    } catch (error) {
      toast.error("Deletion failed.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      console.error("Deletion failed:", error);
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const scheduledPost = async (data) => {
    try {
      const scheduledPosts = data?.latestScheduledPost;
      if (!Array.isArray(scheduledPosts)) {
        console.error("Invalid or missing 'latestScheduledPost' array in data.");
        return;
      }

      const formattedPosts = scheduledPosts.map(post => {
        const scheduledTime = post.schedule_time 
            ? new Date(post.schedule_time * 1000): post.createdAt 
            ? new Date(post.createdAt)
            : new Date();  // Default to current date if neither exists
        
        if (!post.schedule_time) {
          console.warn("Missing schedule_time for post:", post);
        }

        const currentTime = new Date();
        const isExpired = scheduledTime < currentTime;

        // Detect media type
        let mediaType = "text";
        try {
          if (post.post_media) {
            const parsed = typeof post.post_media === "string" ? JSON.parse(post.post_media) : post.post_media;
            if (Array.isArray(parsed) && parsed.length > 0) {
              const firstMedia = parsed[0];
              if (firstMedia.type) {
                // Use type field if exists
                mediaType = firstMedia.type;
              } else if (firstMedia.path) {
                // Fallback: detect from file extension
                if (/\.(mp4|mov|avi|webm)$/i.test(firstMedia.path)) mediaType = "video";
                else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(firstMedia.path)) mediaType = "image";
                else mediaType = "file";
              }
            }
          }
        } catch (err) {
          console.log("Media type detection error:", err);
        }

        // Format the scheduled time
        const formattedTime = moment(scheduledTime).format('hh:mm A');                       
        return {
            title: isExpired ? "Expired" : `${post.content || "No message"}`,
            start: scheduledTime,
            end: scheduledTime,
            description: `${post.content} - ${formattedTime}`,
            postPageID: post.page_id,
            postID: post.id,
            postMedia: `${post.post_media || ""}`, 
            postPageName: post.pageName,
            postPagePicture: post.page_picture,
            platform: post.post_platform,
            content: post.content,
            form_id: post.form_id,
            week_date: post.week_date,
            isExpired,
            schedule_time: post.schedule_time,
            formattedTime: formattedTime,
            mediaType 
        };
      }).filter(post => post !== null);
      //console.log("ScheduledPosts: ",formattedPosts);
      setPosts(formattedPosts);
    } catch (err) {
      console.error("Error in scheduledPost function:", err);
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

  const CustomEvent = ({ event }) => {
    let imageUrl;
    try {
      if (typeof event.postMedia === 'string') {
        if (event.postMedia.startsWith('https://')) {
          imageUrl = event.postMedia;
        } else {
          const parsed = JSON.parse(event.postMedia);
          const imageUrlLocal = parsed?.[0].path;
          if (imageUrlLocal) {
            imageUrl = `${process.env.REACT_APP_BACKEND_URL}${imageUrlLocal}`;
          }
        }
      }
    } catch {
      imageUrl = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
    }
    const isExpired = moment.unix(event.schedule_time).isBefore(moment());
    return (
      <HoverPostPreview key={event.postID} post={event} platform={event?.platform?.toLowerCase()} >
        <div className={`post-card ${isExpired ? "expired" : ""}`} style={{padding: '2px', borderRadius: '0px 5px 5px 0px'}}>
          <div className="post-content d-flex" style={{ alignItems: 'center', marginTop: '0px' }}>
            <div className="platform-icons me-1" style={{ color:"white", background:getPlatformColor(event.platform) }} >
              {platformSVGs[event.platform] || (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              )}
            </div>

            <div className="platform-details position-relative flex-grow-1">
              <div className="platform-header">
                {/* <span className="platform-name">{capitalizeFirstLetter(event.platform)}</span> */}
                <span className="platform-name">
                  <i className="fa-regular fa-clock"></i> {event.formattedTime}
                </span>
                <span className={`media-type-badge badge bg-${event.mediaType === "image" ? "success" : 
                  event.mediaType === "video" ? "danger" : "info" }`} style={{right: '0'}} >
                      {event.mediaType}
                </span>
              </div>

              {event.title === 'Expired' ? (
                <div className="post-title text-danger" style={{width:"100px"}}>{event.title}</div>
              ) : (
                <div className="post-title" style={{width:"100px"}}>{event.title}</div>
              )}
                
              {/* <div className="post-time">
                <i className="fa-regular fa-clock"></i> {event.formattedTime}
              </div> */}
            </div>
          </div>
        </div>
      </HoverPostPreview>
    );
  };

  const AgendaEvent = ({ event }) => {
    let imageUrl;
    try {
      if (typeof event.postMedia === 'string') {
        if (event.postMedia.startsWith('https://')) {
          imageUrl = event.postMedia;
        } else {
          const parsed = JSON.parse(event.postMedia);
          const imageUrlLocal = parsed?.[0].path;
          if (imageUrlLocal) {
            imageUrl = `${process.env.REACT_APP_BACKEND_URL}${imageUrlLocal}`;
          }
        }
      }
    } catch {
      imageUrl = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
    }

    return (
      <tr>
        <td>
          <HoverPostPreview post={event} platform={event?.platform?.toLowerCase()}>
            <div className="d-flex align-items-center">
              {imageUrl && (
                <img src={imageUrl} alt="preview"
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', marginRight: 10, }}
                />
              )}
              <div className="d-flex flex-column">
                <strong>
                  {event.content?.split(' ').slice(0, 4).join(' ')}...
                </strong>
                <small style={{ fontSize: '12px', color: '#666' }}>{event.postPageName}</small>
              </div>
            </div>
          </HoverPostPreview>
        </td>
        <td></td>
      </tr>
    );
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: 'transparent',
        color: event.isExpired ? 'red' : '#333',
        border: 'none',
        borderLeft: '3px solid teal',
        borderRadius: 0,
        padding: 0,
        opacity: event.isExpired ? 0.6 : 1,
      },
    };
  };

  const handleSelectEvent = useCallback((event) => {
    //console.log("onClick Event: ", event);
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedEvent(null); // Clear the selected event
  };

  const LocationBarChart = (geoData) => {
    const locations = geoData.map((item) => item.metric_key);
    const values = geoData.map((item) => item.metric_value);

    const locationOptions = {
      chart: {
        type: "bar",
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          distributed: true,
          dataLabels: {
            position: "center",
            color: "#fff",
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val;
        },
        offsetX: 0,
        style: {
          fontSize: "12px",
          color: "#000000",
        },
      },
      xaxis: {
        categories: locations,
        labels: {
          trim: true,
          hideOverlappingLabels: true,
          rotate: -45,
        },
        // title: {
        //   text: ''
        // }
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: function (val) {
            return `${val} followers`;
          },
        },
      },
      colors: [
        "#7366ff", "#ff8c00", "#20c997", "#6f42c1", "#fd7e14",
        "#198754", "#0dcaf0", "#dc3545", "#ffc107", "#6610f2"
      ],
    };

    const locationSeries = [
      {
        name: "Followers",
        data: values,
      },
    ];
    setlocationOptions(locationOptions);
    setlocationSeries(locationSeries);
  };

  const customStyles = {
    rows: {
      style: {
        border: "0 !important",
        margin: "8px 20px",
        height: "70px",
        background: "#fff !important",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0px 9px 20px rgba(46, 35, 94, 0.07)",
        padding: "10px 0",
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
      name: "Page",
      selector: (row) => row.page,
      center: true,
      minWidth: "200px",
      maxWidth: "250px",
      wrap: true,
      grow: 0,
    },
    {
      name: "Image",
      selector: (row) => row.image,
      cell: (row) => (
        <img src={row.image} alt="Preview" className="rounded-circle me-2" width="60" height="60" />
      ),
      center: true,
      minWidth: "100px",
      maxWidth: "120px",
      wrap: true,
      grow: 0,
    },
    {
      name: "Content",
      selector: (row) => row.content,
      center: true,
      minWidth: "300px",
      maxWidth: "350px",
    },
    {
      name: "Likes",
      selector: (row) => row.likes,
      center: true,
      minWidth: "100px",
      maxWidth: "150px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Comments",
      selector: (row) => row.comments,
      center: true,
      minWidth: "200px",
      maxWidth: "200px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Shares",
      selector: (row) => row.shares,
      center: true,
      minWidth: "100px",
      maxWidth: "150px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Engagement",
      selector: (row) => row.engagement + "%",
      center: true,
      minWidth: "200px",
      maxWidth: "200px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Reach",
      selector: (row) => row.reach,
      center: true,
      minWidth: "150px",
      maxWidth: "150px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Impressions",
      selector: (row) => row.impressions,
      center: true,
      minWidth: "200px",
      maxWidth: "200px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Source",
      selector: (row) => row.source,
      cell: (row) =>
        row.source === "API" ? (
          <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
            style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))", width: "30px", height: "30px" }} >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
          </div>
        ) : (
          <img className="img-fluid" style={{ width: 20 }} src="/assets/images/logo/logo.svg" alt="source" />
        ),
      center: true,
      minWidth: "100px",
      maxWidth: "150px",
      wrap: true,
      grow: 0,
    },
    {
      name: "Date",
      selector: (row) => row.date,
      center: true,
      minWidth: "100px",
      maxWidth: "120px",
      wrap: true,
      grow: 0,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      center: true,
      minWidth: "150px",
      maxWidth: "200px",
      wrap: true,
      grow: 0,
    },
    {
      name: "Action",
      cell: (row) => (
        <>
          <i className="fa fa-solid fa-eye me-2" style={{ cursor: "pointer" }} onClick={() => row.onView(row)} ></i>
          <span onClick={() => {handleEdit(row.form_id)} }><i className="fa fa-solid fa-pencil me-2"></i></span>
          <i className="fa fa-solid fa-trash-alt text-danger" style={{ cursor: "pointer" }} onClick={() => row.onDelete(row)} ></i>
        </>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      center: true,
    },
  ];

  const formattedPosts = postListByFilter.map((post) => ({
    page:
      selectPage?.page_picture && selectPage?.pageName ? (
        <div className="">
          <div className="preview-header">
            <img src={selectPage.page_picture} alt={selectPage.pageName}
              style={{ width: "25px", height: "25px", marginRight: "8px", borderRadius: "50%", objectFit: "cover" }}
            />
            <strong>{selectPage.pageName}</strong>
          </div>
        </div>
      ) : (
        <span>—</span>
      ),
    image: (() => {
      try {
        let media = post.post_media;
        // ✅ If it's a valid direct URL
        if (typeof post.post_media === "string" && post.post_media.trim().startsWith("http")) {
          return post.post_media;
        }
        if (typeof media === "string") { media = JSON.parse(media); }
        // ✅ Check if it's a valid array and has at least one item with `path`
        if (Array.isArray(media) && media.length > 0 && media[0].path) {
          return `${process.env.REACT_APP_BACKEND_URL}${media[0].path}`;
        }
        // ❌ Fallback to placeholder
        return `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
      } catch (error) {
        console.error("Image handling error:", error);
        return `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`;
      }
    })(),
    content: post.content,
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    engagement: parseFloat(post.engagements).toFixed(2),
    reach: post.unique_impressions,
    impressions: post.impressions,
    source: post.source,
    platform_post_id: post.platform_post_id,
    platform: post.post_platform,
    postMedia: post.post_media ? post.post_media : `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`,
    postPageName: selectPage?.pageName || null,
    postPagePicture: selectPage?.page_picture || null,
    date: post.week_date || new Date(post.createdAt).toISOString().split("T")[0],
    status: post.status === "1" ? "Published" : post.status === "0" ? "Draft" : "Scheduled",
    onView: () => {
      setPostView(post);
      setViewModal(true);
    },
    onDelete: () => {
      setPostToDelete(post);
      setShowDeleteModal(true);
      //console.log("Data of Post User Want to delete: ", post);
    },
    form_id: post.form_id,
    page_id: post.page_id,
    id: post.id,
  }));

  const renderMediaPreview = (platform = "", mediaToUse = null) => {
    // If mediaToUse is a JSON string, parse it
    let filteredMedia = [];
    try {
      if (typeof mediaToUse === "string") {
        filteredMedia = JSON.parse(mediaToUse);
      } else if (Array.isArray(mediaToUse)) {
        filteredMedia = mediaToUse;
      }
    } catch (err) {
      console.error("Failed to parse media JSON:", err);
      return null;
    }
  
    // Map and add URL + unique ID
    filteredMedia = filteredMedia.map((item, index) => ({
      id: index,
      type: item.type,
      url: `${BACKEND_URL}${item.path}`,
      thumbnail: item.type === "video" ? `${BACKEND_URL}${item.path}-thumbnail.jpg` : null
    }));

    if (filteredMedia.length === 0) return null;
  
    // === Instagram Carousel ===
    if (platform === "instagram") {
      return (
        <Carousel responsive={carouselResponsive} showDots infinite={true} arrows={false}>
          {filteredMedia.map((m) => (
            <div key={m.id} className="position-relative" style={{ aspectRatio: "1 / 1" }}>
              {m.type === "image" ? (
                <img src={m.url} alt="insta-img" className="w-100" style={{ height: "300px", objectFit: "cover" }}
                  onError={(e) => {e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
              ) : (
                <video src={m.url} className="w-100" style={{ height: "300px", objectFit: "cover", objectPosition: "center" }}
                  autoPlay loop muted playsInline />
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
                      <img src={filteredMedia[0].thumbnail} alt="Video thumbnail" className="w-100 h-100"
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />
                      <i className="fa fa-play-circle position-absolute top-50 start-50 translate-middle text-white fs-1"></i>
                  </div>
              ) : (
                  <img src={filteredMedia[0].url} alt="facebook-img" className="w-100 h-100"
                    style={{ objectFit: "cover", objectPosition: "center" }}
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

  // by default 7 days functions
  useEffect(() => {
    if (selectPage && selectedDays[0]) {
      setShowDatePickerCalendar(false);
      //console.log('selectPage updated:', selectPage);
      // const formattedStart = format(selectedDays[0].startDate, "dd MMM yyyy");
      // const formattedEnd = format(selectedDays[0].endDate, "dd MMM yyyy");
      // setshowSelectedDays(`Last 7 days: ${formattedStart} - ${formattedEnd}`);
      // setShowCalendarFilterText("Last 7 days");      
      // console.log('formattedStart',formattedStart, 'formattedEnd',formattedEnd);

      const getDataFormDate = format(selectedDays[0].startDate, "yyyy-MM-dd");
      const getDataToDate = format(selectedDays[0].endDate, "yyyy-MM-dd");
      const selectPageId = selectPage.pageId;
      const selectPagePlatform = selectPage.page_platform;
      fetchAnalytics(selectPagePlatform,selectPageId,getDataFormDate,getDataToDate);             
      //await FetchPostsComments('linkedin', selectPageId, getDataFormDate, getDataToDate);
    }
  }, [selectPage]);

  // linkedin handle date change function
  const handleDateChange = async (ranges) => {
    const customStaticRanges = getCustomStaticRanges();
    const selected = ranges;
    const selectedStart = selected.startDate.toISOString().slice(0, 10);
    const selectedEnd = selected.endDate.toISOString().slice(0, 10);

    const matchedLabel = customStaticRanges.find((range) => {
      const rangeResult = range.range();
      const start = rangeResult.startDate.toISOString().slice(0, 10);
      const end = rangeResult.endDate.toISOString().slice(0, 10);
      return start === selectedStart && end === selectedEnd;
    })?.label || "Custom Range";

    const formattedStart = format(selected.startDate, "dd MMM yyyy");
    const formattedEnd = format(selected.endDate, "dd MMM yyyy");
    setshowSelectedDays(`${matchedLabel}: ${formattedStart} - ${formattedEnd}`);
    setShowCalendarFilterText(`${matchedLabel}`);
    setSelectedDays([selected]);
    setSelectedRange(ranges);

    const getDataFormDate = format(selected.startDate, "yyyy-MM-dd");
    const getDataToDate = format(selected.endDate, "yyyy-MM-dd");
    const selectPageId = selectPage.pageId;
    const selectPagePlatform = selectPage.page_platform;

    await fetchAnalytics(selectPagePlatform, selectPageId, getDataFormDate, getDataToDate);
    await FetchPostsComments('linkedin', selectPageId, getDataFormDate, getDataToDate); 
    setShowDatePickerCalendar(false);
  };

  // linkedin on page load function to get comments from database
  const PagePostsComments = async () => {
    setFullScreenLoader(true);
    const getPageInfo = selectPage;
    const authToken = localStorage.getItem("authToken");
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;

    try {
      const commentsResponse = await fetch(
        `${BACKEND_URL}/api/linkedin/fetch-comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + authToken,
          },
          body: JSON.stringify({
            pageID: getPageInfo.pageId,
            accessToken: getPageInfo.token,
          }),
        }
      );
      const postsComments = await commentsResponse.json();
      //console.log('response',postsComments);
      setCommentPosts(postsComments.postsData);
      //console.log("Posts Comment Data: ", postsComments.postsData);
      setFullScreenLoader(false);
    } catch (error) {
      console.error("Posts comments Error:", error);
      setFullScreenLoader(false);
      toast.error("Something went wrong fetching comments.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };
  // end linkedin on page load function to get comments from database

  // linkedin handle top-level comment function from model
  const submitComment = async (selectPost) => {
    const authToken = localStorage.getItem("authToken");
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    if (!commentText.trim()) {
      toast.warn("Comment cannot be empty.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setCommentLoading(true);

    try {
      const commentResponse = await fetch(`${BACKEND_URL}/api/linkedin/create-comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          post_id: selectPost.post_id,
          pageID: selectPost.platform_page_Id,
          comment: commentText.trim(),
        }),
      });

      const response = await commentResponse.json();

      if (!commentResponse.ok) {
        throw new Error(response?.message || "Failed to submit comment.");
      }

      const newReply = response.reply;

      // Update full comments list
      setCommentPosts(prev => {
        const updated = [...prev, newReply];
        return updated.sort((a, b) => new Date(b.comment_created_time) - new Date(a.comment_created_time));
      });

      setCommentText("");
    } catch (error) {
      console.error("submit comment Error:", error);
      toast.error("Something went wrong while submitting the comment.", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setCommentLoading(false);
    }
  };

  // Function to handle edit cancel
  const handleCancelEdit = () => {
    setEditingComment({ id: null, text: "" });
  };

  // linkedin handle post reply from list and model function
  const handlePostReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    setCommentLoading(true);
    const authToken = localStorage.getItem("authToken");
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const getPageInfo = selectPage;
    try {
      const commentResponse = await fetch(`${BACKEND_URL}/api/linkedin/comment-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
        body: JSON.stringify({
          message: replyText,
          commentId: parentCommentId,
          page_id: getPageInfo.pageId,
        }),
      });
      const response = await commentResponse.json();
      if (response && response.reply) {
        const newReply = response.reply;
        setCommentPosts(prev => {
          const updated = [...prev, newReply];
          return updated.sort((a, b) => new Date(b.comment_created_time) - new Date(a.comment_created_time));
        });
        setReplyingToComment(null);
        setReplyText("");
        setCommentLoading(false);
      } else {
        toast.error("Reply was not created. Please try again.", {
          position: "top-right",
          autoClose: 5000,
        });
        setCommentLoading(false);
      }
    } catch (error) {
      console.error("submit comment Error:", error);
      setCommentLoading(false);
      toast.error("Something went wrong .", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
      });
    }
  };

  // Sort both top-level and replies
    commentPosts.forEach(comment => {
      if (comment.comment_type === "top_level") {
        topLevel.push(comment);
      } else if (comment.comment_type === "reply") {
        const decoded = decodeURIComponent(comment.parent_comment_id || "");
        const match = decoded.match(/urn:li:comment:\(urn:li:activity:\d+,(\d+)\)/);
        const parentId = match ? match[1] : null;

        if (parentId) {
          if (!repliesMap[parentId]) repliesMap[parentId] = [];
          repliesMap[parentId].push(comment);
        }
      }
    });
    topLevel.sort((a, b) => new Date(b.comment_created_time) - new Date(a.comment_created_time));
    // console.log("TopLevel Comments: ",topLevel);
    Object.values(repliesMap).forEach(replyList => {
      replyList.sort((a, b) => new Date(b.comment_created_time) - new Date(a.comment_created_time));
    });
    // console.log("ReplyList: ",repliesMap);
  // sorting function ends here

  // Linkedin Post Comments update functions
  const handleUpdateComment = async (commentId) => {
    setCommentLoading(true);
    const authToken = localStorage.getItem("authToken");
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    try {
      const response = await fetch(`${BACKEND_URL}/api/linkedin/comment-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message: editingComment.text.trim(),
          commentId: commentId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.comment) {
        handleCancelEdit();
        toast.error("Users can only edit their own comments.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
        });
        return;
      }

      const updatedComment = result.comment;

      // Update the main comments list
      setCommentPosts(prev =>
        prev.map(comment =>
          comment.id === updatedComment.id ? updatedComment : comment
        )
      );

      // Clear editing state
      setEditingComment({ id: null, text: "" });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment. Please try again later.", {
        position: "top-right",
      });
    } finally {
      setCommentLoading(false);
    }
  };

  // Linkedin function to handle deleted comments
  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      setLoading(true);
      const deletedCommentIds = await deleteCommentAPI(commentId); // Array of deleted comment IDs
      // 🟢 1. Update flat list of all comments
      setCommentPosts(prevComments => {
        return prevComments.filter(comment => !deletedCommentIds.includes(comment.id));
      });
      // 🟢 2. Update selected comment post if it has nested comments
      setSelectCommentPost(prevPost => {
        if (!prevPost || !prevPost.comments) return prevPost;
        const updatedComments = prevPost.comments.filter(
          comment => !deletedCommentIds.includes(comment.id)
        );

        return {
          ...prevPost,
          comments: updatedComments,
        };
      });

      setLoading(false);
    } catch (error) {
      console.error("Delete failed:", error);
      setLoading(false);
      toast.error("Something went wrong while deleting the comment.", {
        position: "top-right",
      });
    }
  }, []);

  // Linkedin post comments deletion api function
  const deleteCommentAPI = async (commentId) => {
    const authToken = localStorage.getItem("authToken");
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    try {
      const res = await fetch(`${BACKEND_URL}/api/linkedin/comment-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ commentId }),
      });

      const result = await res.json();

      if (res.ok && result.deletedIds) {
        setDeleteCommentModal(false);
        setCommentToDelete(null);
        return result.deletedIds;
      } else {
        throw new Error(result.message || "Delete failed.");
      }
    } catch (error) {
      console.error("API Delete Error:", error);
      toast.error("Something went wrong while deleting comment.", {
        position: "top-right",
      });
      return [];
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const loadMorePosts = () => setVisiblePosts((prev) => prev + 4);

  const CommentsFilterBySentiment = (sentiment) => {
    setCommentCurrentFilter(sentiment);        
    setSelectedComments([]);
    setSelectAll(false);
    setIsOpen(false);                 
    try {
        if (sentiment === 'All') {
            setCommentPosts(allComments);
            //console.log('sentiment All - showing all comments:', allComments.length);
        } else {
            const filteredComments = allComments.filter(comment => {
                // Use toUpperCase for case-insensitive comparison
                const sentimentValue = comment.comment_behavior?.toUpperCase();
                return sentimentValue === sentiment.toUpperCase();
            });
            setCommentPosts(filteredComments);                
            //console.log(`sentiment ${sentiment} and count: ${filteredComments.length}`);
        }
    } catch (error) {
        console.error('Error filtering comments:', error);
        toast.error('Error filtering comments');
    }
  };
  
  // Toggle individual comment selection
  const toggleCommentSelection = (commentId) => {
      setSelectedComments(prev => {
          if (prev.includes(commentId)) {
              return prev.filter(id => id !== commentId);
          } else {
              return [...prev, commentId];
          }
      });
  };
  
  // Add this useEffect to log when selectedComments changes
  useEffect(() => {
    //console.log('selectedComments updated:', selectedComments);
    //console.log('selectAll state:', selectAll);
  }, [selectedComments, selectAll]);
  
  // Toggle select all comments
  const toggleSelectAll = () => {
    if (selectAll) {
        // Deselect all
        setSelectedComments([]);            
    } else {
        // Select all visible comments
        const allCommentIds = commentPosts.map(comment => comment.id);
        setSelectedComments(allCommentIds);
    }
    setSelectAll(!selectAll);
  };

  // Start Delete selected comments 
  const deleteSelectedComments = async () => {
      setLoading(true);
      const authToken = localStorage.getItem("authToken");
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const socketId = window?.socket?.id || '';
      const deleteComments = selectedComments;
      const commentPlatform = 'linkedin';   
      const selectPageID = selectPage.pageId;     
      //console.log('deleteComments:', deleteComments, 'commentPlatform:',commentPlatform);
      try {
        const res = await fetch(`${BACKEND_URL}/api/delete-selected-comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                'X-Socket-Id': socketId
            },
            body: JSON.stringify({ 
                deleteComments:deleteComments, 
                commentPlatform:commentPlatform,
                selectPageID: selectPageID
            }),
        });

        const result = await res.json();      

        if(res.ok && result.deletedIds) {
          setDeleteMultipleCommentsModel(false);
          setSelectedComments([]);
          setCommentPosts((prevPosts) => 
              prevPosts.filter((comment) => !result.deletedIds.includes(comment.id)
              )
          );
          setLoading(false);
          // toast.success(`${result.message}`, {
          //     position: 'top-right',
          //     autoClose: 5000,
          //     autoClose: true,
          //     hideProgressBar: false,
          //     closeOnClick: true,
          //     theme: "colored",
          // });
        } else {
            setLoading(false);
            throw new Error(result.message || "Delete failed.");
        }
      } catch (error) {
        console.error("API Delete Error:", error);            
        toast.error(`Something went wrong while deleting comment.`, {
            position: 'top-right',
            autoClose: 5000,
            autoClose: true,
            hideProgressBar: false,
            closeOnClick: true,
            theme: "colored",
        });
        setDeleteMultipleCommentsModel(false);
        setSelectedComments([]);
        setLoading(false);          
    }
  }
  // End Delete selected comments

  return (
    <div className="page-wrapper compact-wrapper mt-3">
      <Header />
      <div className="page-body-wrapper">
        <Sidebar />
        <div className="page-body">          
            <div className="container-fluid default-dashboard">
              <div className="content-wrapper">
                <div className="row">
                  <div className="page-title"> 
                    <div className="row" style={{ marginTop: "0px" }}>
                      <div className="col-md-12 col-lg-12 col-xl-5 col-xxl-5 ">                        
                        <div className="d-flex gap-3 align-items-center"> 
                          <div className="linkedin-ican" style={{ backgroundImage: "linear-gradient(to right, #2563eb, #1e40af)" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                              <rect width="4" height="12" x="2" y="9"></rect>
                              <circle cx="4" cy="4" r="2"></circle>
                            </svg>
                          </div>
                          <div className='d-flex flex-column'>  
                            <h1 className='h1-heading'>LinkedIn Summary</h1> 
                            <div> <p className='pb-0 mb-0' style={{ fontSize: "16px" }}> Detailed analytics and performance insights </p></div>
                          </div>
                        </div>
                      </div>
                      {/* <div> Select page for view analytics </div> */}
                      <div className="col-md-12 col-lg-12 col-xl-7 col-xxl-7 my-lg-3">
                        <div className="d-flex  gap-2 justify-content-between justify-content-xl-end mobile-responsive">
                          <div className="">
                            {/* <h2 className="section-title text-primary mb-0">
                                <i className="fas fa-chart-bar"></i> Choose Social Page For View Analytics                                                                
                            </h2> */}
                            <div ref={dropdownRef} className="position-relative">
                              <div className="form-control pe-2 custom-select-input custom-selected-pages" onClick={() => setShowPagesList(!showPagesList)}>
                                <div className="selected-pages-container">
                                  {selectPage ? (
                                    <div key={selectPage.id} className="selected-page-item">
                                      <img src={selectPage.page_picture} alt={selectPage.pageName} className="selected-page-image"/>
                                      <span className="selected-page-name d-flex ga-2">
                                        {/* <i className="fa-brands fa-linkedin text-primary" style={{ fontSize: "13px" }} ></i>&nbsp; */}
                                          <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                              style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                width: "20px", height: "20px" }} >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" >
                                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                <rect x="2" y="9" width="4" height="12"></rect>
                                                <circle cx="4" cy="4" r="2"></circle>
                                              </svg>
                                          </div>
                                        {selectPage.pageName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted">
                                      Select page for view analytics
                                    </span>
                                  )}
                                </div>
                              </div>
                              {showPagesList ? (
                                <span className="position-absolute end-0 translate-middle-y me-2"
                                  style={{ cursor: "pointer", pointerEvents: "none", top: "20px" }}
                                >
                                  <i className="fas fa-chevron-up text-muted" />
                                </span>
                              ) : (
                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                  style={{ cursor: "pointer", pointerEvents: "none" }}
                                >
                                  <i className="fas fa-chevron-down text-muted" />
                                </span>
                              )}
                              {showPagesList && (
                                <div className="dropdown-content">
                                  <ul className="nested-checkbox-list">
                                    {connectedAccountInfo.length === 0 ? (
                                      <li className="p-2 text-danger">
                                        Connect your account
                                      </li>
                                    ) : (
                                      connectedAccountInfo.map((socialUser) => (
                                        <li key={socialUser.id} className="parent-item" >
                                          <div className="d-flex align-items-center">
                                            <img className="user-avatar" src={socialUser.img_url} alt="Profile"
                                              onError={(e) => { e.target.src = "/default-avatar.png"; }}
                                              style={{ width: "40px", height: "40px" }} />
                                            <span className="mr-2">
                                              {/* <i className="fa-brands fa-linkedin text-primary fs-5"></i> */}
                                              <div className="platform-icon-custom mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                  style={{ background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                      width: "25px", height: "25px" }} >
                                                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white" >
                                                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                      <rect x="2" y="9" width="4" height="12"></rect>
                                                      <circle cx="4" cy="4" r="2"></circle>
                                                  </svg>
                                              </div>
                                            </span>
                                            <div style={{ marginLeft: "10px" }}>
                                              <span className="user-name">
                                                <b>{socialUser.name}</b>
                                              </span>
                                            </div>
                                          </div>
                                          {socialUser.socialPage?.length > 0 && (
                                            <ul className="child-list ps-3">
                                              {socialUser.socialPage.filter( (socialPages) => socialPages.status === "Connected" ).length > 0 ? (
                                                socialUser.socialPage.filter( (socialPages) => socialPages.status === "Connected" ).map((socialPages) => (
                                                    <li key={socialPages.pageId} className="child-item" style={{ cursor: "pointer" }}
                                                      onClick={() => handleSelectedPage(socialPages) }
                                                    >
                                                      <div className="d-flex align-items-center">
                                                        <img src={ socialPages.page_picture } alt="Page" className="page-image"
                                                          onError={(e) => { e.target.src = "/default-page.png"; }} />
                                                        <span className="page-name">
                                                          {socialPages.pageName}
                                                        </span>
                                                      </div>
                                                    </li>
                                                  ))
                                              ) : (
                                                <li className="child-item text-danger">
                                                  Pages not connected
                                                </li>
                                              )}
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
                          <div className="custom-seleted-date" ref={datePickerRef}>
                            {/* <h2 className="section-title text-primary mb-0">
                                <i className="fa-solid fa-calendar-days"></i> Select Date Range                                                                 
                            </h2> */}
                            <div className="form-control calendarPicker custom-calendarPicker" style={{ minHeight: "45px", padding:"13px" }}
                              onClick={() => setShowDatePickerCalendar(!showDatePickerCalendar) }>
                              {showDatePickerCalendar ? (
                                <>
                                  <i className="fas fa-calendar-alt"></i>&nbsp;
                                  {showSelectedDays}
                                  <i className="fas fa-chevron-up text-muted calendar-icon"
                                    style={{ float: "right", position: "absolute", top: "18px", right: "20px" }}
                                  />
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-calendar-alt"></i>&nbsp;
                                  {showSelectedDays}
                                  <i className="fas fa-chevron-down text-muted calendar-icon"
                                    style={{ float: "right", position: "absolute", top: "18px", right: "20px" }}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {showDatePickerCalendar && (
                        <div style={{ position: "absolute", top: "100%", left: 0,zIndex: 1000, backgroundColor: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }} >
                          <button onClick={() => setShowDatePickerCalendar(false)}
                            style={{ position: "absolute", top: 10, right: 10, zIndex: 10, background: "transparent", border: "none", fontSize: "18px", cursor: "pointer" }}
                            aria-label="Close Date Picker" > ❌ </button>
                          <h2 className="py-2">Select Date Range</h2>
                          <DateRangePickerComponent onDateChange={handleDateChange} selectedRange={selectedRange} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between w-100 mobile-responsive">
                    <div className="custom-width-100">
                      <ul className="nav nav-tabs mb-4 gap-2" id="socialTabs" role="tablist">
                        <li className="nav-item" role="presentation">
                          <button className={`nav-link ${activeTab === 'Summary' ? "active" : ""}`} id="Summary-tab" 
                            data-bs-toggle="tab"  data-bs-target="#Summary" type="button" role="tab" aria-controls="Summary" 
                            aria-selected="true"
                            onClick={() => handleTabClick('Summary')}
                          >
                            Summary
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button className={`nav-link ${activeTab === 'Post' ? "active" : ""}`} id="Post-tab" 
                            data-bs-toggle="tab" data-bs-target="#Post" type="button" role="tab" aria-controls="Post" 
                            aria-selected="false"
                            onClick={() => handleTabClick('Post')}
                          >
                            Post
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button className={`nav-link ${activeTab === 'Comments' ? "active" : ""}`} id="Comments-tab" 
                            data-bs-toggle="tab" data-bs-target="#Comments"
                            type="button" role="tab" aria-controls="Comments" aria-selected="false"
                            onClick={() => handleTabClick('Comments')}
                          >
                            Comments
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button className={`nav-link ${activeTab === 'Calendar' ? "active" : ""}`} 
                            id="Calendar-tab" data-bs-toggle="tab" data-bs-target="#Calendar"
                            type="button" role="tab" aria-controls="Calendar" aria-selected="false"
                            onClick={() => handleTabClick('Calendar')}
                          >
                            Calendar
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <button className="btn btn-primary">
                        <Link to="/create-post" className="txt-light">
                        <i className="fa-solid fa-plus me-2"></i>
                          Create Post
                        </Link>
                      </button>
                    </div>
                  </div>
                   {fullScreenLoader ? (
                    <LinkedinDetailSkeleton activeTab={activeTab}/>
                  ):(   
                    <div className="tab-content p-3 rounded-bottom custom-bg-color mb-3" id="socialTabsContent"
                      style={{ backgroundColor: "transparent" }}>
                      <div className={`tab-pane fade ${activeTab === 'Summary' ? "show active" : ""}`} id="Summary" role="tabpanel" aria-labelledby="summary-tab" >
                        {/* <!--  frist row style start --> */}
                        <div className="row d-flex flex-wrap align-items-stretch my-3">
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      <div className="">
                                        {/* <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/add (1).png`} alt="" /> */}
                                        <div className="p-3 rounded d-inline-flex align-items-center justify-content-center"
                                          style={{
                                            background: "linear-gradient(to right, rgb(239, 246, 255), rgb(236, 254, 255))",
                                            borderRadius: "1rem",
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                          </svg>
                                        </div>
                                      
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Followers </span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( pageLinkedinTotalFollowersCount ) ?? 0 }
                                          >
                                            {formatK( pageLinkedinTotalFollowersCount ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="view circular-progress" style={{ "--progress": "100%", "--size": "60px", "--thickness": "6px" }} >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              100.0%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total Follwers on this page
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/add (1).png`} alt="" />
                                      </div> */}
                                      <div className="">
                                      <div className="p-3 rounded d-inline-flex align-items-center justify-content-center"
                                          style={{background: "linear-gradient(to right, rgb(250, 245, 255), rgb(253, 242, 248))",
                                            borderRadius: "1rem" }} >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                          </svg>
                                        </div>
                                        </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">New Followers </span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( analytics?.totals?.linkedin ?.total_page_followers ) ?? 0 }
                                          >
                                            { formatK( analytics?.totals?.linkedin?.total_page_followers ) ?? 0 }
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="custom-followers circular-progress"
                                          style={{ "--progress": `${ analytics?.growth?.linkedin ?.total_page_followers ?? 0 }%`,
                                            "--size": "60px", "--thickness": "6px", }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {analytics?.growth?.linkedin ?.total_page_followers ?? 0} %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total new followers of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/impression-ican.png`} alt="" />
                                      </div> */}
                                      <div className="p-3 rounded d-inline-flex align-items-center justify-content-center"
                                        style={{
                                          background: "linear-gradient(to right, rgb(240, 253, 244), rgb(236, 253, 245))",
                                          borderRadius: "1rem",
                                        }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green" >
                                          <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                                          <path d="M18 17V9"></path>
                                          <path d="M13 17V5"></path>
                                          <path d="M8 17v-3"></path>
                                        </svg>
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className=""> Impressions </span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK(analytics?.totals?.linkedin ?.total_page_impressions) ?? 0 }
                                          >
                                            {formatK( analytics?.totals?.linkedin ?.total_page_impressions ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="impressions circular-progress"
                                          style={{
                                            "--progress": `${ analytics?.growth?.linkedin ?.total_page_impressions ?? 0 }%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              { formatK(analytics?.growth?.linkedin ?.total_page_impressions) ?? 0} %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total impressions of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        {/* </div>

                        <div className="row d-flex flex-wrap align-items-stretch my-3"> */}
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/view.png`} alt="" />
                                      </div> */}
                                      <div className="p-3 rounded d-inline-flex align-items-center justify-content-center"
                                          style={{
                                            background: "linear-gradient(to right, rgb(255, 247, 237), rgb(254, 242, 242))",
                                            borderRadius: "1rem",
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange" >
                                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                        </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Views</span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( analytics?.totals?.linkedin ?.total_page_views ) ?? 0 }
                                          >
                                            {formatK( analytics?.totals?.linkedin ?.total_page_views ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="custom-reach circular-progress"
                                          style={{
                                            "--progress": `${ analytics?.growth?.linkedin?.total_page_views ?? 0 }%`,
                                            "--size": "60px",
                                            "--thickness": "6px",

                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {formatK(analytics?.growth?.linkedin ?.total_page_views) ?? 0} %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total view of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/social-reach.png`} alt="" />
                                      </div> */}

                                      <div className="p-3 rounded d-inline-flex align-items-center justify-content-center"
                                        style={{
                                          background: "linear-gradient(to right, rgb(238, 242, 255), rgb(250, 245, 255))",
                                          borderRadius: "1rem",
                                        }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo" >
                                          <circle cx="12" cy="12" r="10"></circle>
                                          <circle cx="12" cy="12" r="6"></circle>
                                          <circle cx="12" cy="12" r="2"></circle>
                                        </svg>
                                      </div>

                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Reach</span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( analytics?.totals?.linkedin ?.total_page_impressions_unique ) ?? 0 }
                                          >
                                            {formatK( analytics?.totals?.linkedin ?.total_page_impressions_unique ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="comments circular-progress"
                                          style={{
                                            "--progress": `${ analytics?.growth?.linkedin ?.total_page_impressions_unique ?? 0 }%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {formatK(analytics?.growth?.linkedin ?.total_page_impressions_unique) ?? 0} %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total reach of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/thumbs-up.png`} alt=""/>
                                      </div> */}

                                      <div className="p-3 rounded d-inline-flex align-items-center justify-content-center"
                                          style={{
                                            background: "linear-gradient(to right, rgb(255, 241, 242), rgb(253, 242, 248))",
                                            borderRadius: "1rem",
                                          }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose" >
                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                                          </svg>
                                        </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Likes</span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( analytics?.totals?.linkedin?.page_actions_post_reactions_like_total ) ?? 0 }
                                          >
                                            {formatK( analytics?.totals?.linkedin?.page_actions_post_reactions_like_total ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="likes circular-progress"
                                          style={{
                                            "--progress": `${ analytics?.growth?.linkedin?.page_actions_post_reactions_like_total ?? 0 }%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {formatK(analytics?.growth?.linkedin?.page_actions_post_reactions_like_total) ?? 0} %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total likes of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-12">
                            <div className="card sales-report">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <h5>Social Analytics</h5>
                                  <div className="card-header-right-icon">
                                  </div>
                                </div>
                              </div>
                              <div className="card-body pt-0 analytics-data">
                                <ul className="balance-data">
                                  <li>
                                    <span className="circle bg-primary"></span>
                                    <span className="c-light ms-1">View</span>
                                  </li>
                                  <li>
                                    <span className="circle bg-secondary"> </span>
                                    <span className="c-light ms-1">Followers</span>
                                  </li>
                                  <li>
                                    <span className="circle bg-success"></span>
                                    <span className="c-light ms-1"> Impressions </span>
                                  </li>
                                  <li>
                                    <span className="circle bg-dark"></span>
                                    <span className="c-light ms-1">Reach</span>
                                  </li>
                                  <li>
                                    <span className="circle bg-secondary"> </span>
                                    <span className="c-light ms-1">Comments</span>
                                  </li>
                                  <li>
                                    <span className="circle bg-danger"></span>
                                    <span className="c-light ms-1">Likes</span>
                                  </li>
                                </ul>
                                <div className="social-tabs">
                                  <div className="tab-content" id="social-pills-tabContent" >
                                    <div className="tab-pane fade show active" id="v-pills-linkedin" role="tabpanel" >
                                      <div>
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

                        <div className="row d-flex flex-wrap align-items-stretch my-3">
                          <div className="my-4">
                            <h5> LinkedIn Post </h5>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/thumbs-up.png`} alt="" />
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Likes</span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( weekly_post_analytics?.likes ) ?? 0 }
                                          >
                                            {formatK( weekly_post_analytics?.likes ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="circular-progress"
                                          style={{
                                            "--progress": `${ postDataGrowth?.likes ?? 0 }%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {postDataGrowth?.likes ?? 0}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total posts likes of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/followers.png`} alt="" />
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Reach</span>
                                          <h6 className="mb-1 counter h6-card-heading"
                                            data-target={ formatK( weekly_post_analytics?.unique_impressions ) ?? 0 }
                                          >
                                            {formatK( weekly_post_analytics?.unique_impressions ) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="circular-progress"
                                          style={{
                                            "--progress": `${ postDataGrowth?.unique_impressions ?? 0 }%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {postDataGrowth?.unique_impressions ?? 0} %
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total posts reach of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/impression-ican.png`} alt="" />
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between" />
                                      <div className="ms-3">
                                        <span className=""> Impressions</span>
                                        <h6 className="mb-1 counter h6-card-heading"
                                          data-target={ formatK( weekly_post_analytics?.impressions ) ?? 0 }
                                        >
                                          {formatK( weekly_post_analytics?.impressions ) ?? 0}
                                        </h6>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-end mt-2">
                                      <div className="circular-progress"
                                        style={{
                                          "--progress": `${ postDataGrowth?.impressions ?? 0 }%`,
                                          "--size": "60px",
                                          "--thickness": "6px",
                                        }}
                                      >
                                        <div className="progress-value">
                                          <span className="txt-success f-w-500">
                                            {postDataGrowth?.impressions ?? 0}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total posts impressions of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="my-4">
                            <h5> LinkedIn Demographics </h5>
                          </div>
                          <div className="col-sm-6">
                            <div className="card">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <h6>Followers from Top 10 Industries 🏭</h6>
                                  <div className="card-header-right-icon">
                                  </div>
                                </div>
                              </div>
                              <div className="card-body main-session-devices pt-0">
                                <div className="row justify-content-center align-items-center gap-sm-0 gap-4">
                                  <div className="col-sm-12 box-col-none">
                                    {demographicData?.industry && demographicData.industry.length > 0 ? (
                                      <div className="common-align">
                                        {demographicData.industry.map(
                                          (demoData) => {
                                            let percentage = (demoData.metric_value / pageLinkedinTotalFollowersCount) * 100;
                                            return (
                                              <div key={demoData.metric_key}>
                                                <div className="card p-3 mb-0"> 
                                                  <div className="common-space mb-2">
                                                    <p className="p-0"> {demoData.metric_key} </p>
                                                    <span> {demoData.metric_value} ( {percentage.toFixed(2)}%) </span>
                                                  </div>
                                                  
                                                  <div className="progress">
                                                    <div className="progress-bar bg-primary" role="progressbar"
                                                      style={{ width: `${percentage.toFixed(2)}%` }} // optional dynamic width
                                                      aria-valuenow={percentage.toFixed(2)} aria-valuemin={0} aria-valuemax={100}
                                                    ></div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    ) : (
                                      <p className="p-0">Data Not Found.</p>
                                    )}
                                  </div>
                                  <div className="col-sm-6 box-col-none"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-6">
                            <div className="card">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <h6>Followers from Top 10 Countries 📍</h6>
                                </div>
                              </div>
                              <div className="card-body pt-0">
                                {/* <div className="common-m-chart"> */}
                                  {locationGraphLoading ? (
                                    <div className="text-center p-3">
                                      <span>Loading chart...</span>
                                    </div>
                                  ) : (
                                    demographicData?.geo && demographicData.geo.length > 0 ? (
                                      <Chart options={locationOption} series={locationSeries} type="bar" height={400} />
                                    ) : (
                                      <div className="row justify-content-center align-items-center gap-sm-0 gap-4">
                                        <p className="text-center">Data Not Found. </p>
                                      </div>
                                    )
                                  )}
                                {/* </div> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`tab-pane fade ${activeTab === 'Post' ? "show active" : ""}`} id="Post" role="tabpanel" aria-labelledby="post-tab" >
                        {/* <!--  frist row style start --> */}
                        <div className="row d-flex flex-wrap align-items-stretch my-3">
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/picture.png`} alt=""/>
                                      </div> */}
                                      <div className="p-3 rounded-4 d-inline-flex align-items-center justify-content-center"
                                          style={{ background: "linear-gradient(to right, #ecfdf5, #d1fae5)", // green-50 → emerald-50
                                              width: "60px", height: "60px" }}
                                          >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-green"
                                          style={{ background: "linear-gradient(to right, #22c55e, #10b981)",
                                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                        >
                                          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                          <path d="M10 9H8" />
                                          <path d="M16 13H8" />
                                          <path d="M16 17H8" />
                                        </svg>
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Published Post</span>
                                          <h6 className="mb-1 counter h6-card-heading" data-target={ formatK(analytics?.publishedPost) ?? 0 } >
                                            {formatK(analytics?.publishedPost) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="circular-progress"
                                          style={{
                                            "--progress": `${formatK(analytics?.postGrowthByPlatform?.publishedGrowth) ?? 0}%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {formatK(analytics?.postGrowthByPlatform?.publishedGrowth) ?? 0}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total post of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range"? showSelectedDays: showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/calendar.png`} alt=""/>
                                      </div> */}
                                      <div className="p-3 rounded-4 d-inline-flex align-items-center justify-content-center"
                                          style={{ background: "linear-gradient(to right, #eff6ff, #ecfeff)" }}
                                        >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" >
                                          <path d="M8 2v4"></path>
                                          <path d="M16 2v4"></path>
                                          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                          <path d="M3 10h18"></path>
                                        </svg>
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className="">Scheduled Post</span>
                                          <h6 className="mb-1 counter h6-card-heading" data-target={ formatK(analytics?.scheduledCount) ?? 0 } >
                                            {formatK(analytics?.scheduledCount) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="circular-progress"
                                          style={{
                                            "--progress": `${formatK(analytics?.postGrowthByPlatform?.scheduledGrowth) ?? 0}%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {formatK(analytics?.postGrowthByPlatform?.scheduledGrowth) ?? 0}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total scheduled post of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card social-widget widget-hover">
                              <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-2 justify-content-between w-100">
                                    <div className="d-flex align-items-center">
                                      {/* <div className="social-icons analytics-tread bg-light-primary">
                                        <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/draft.png`} alt=""/>
                                      </div> */}
                                      <div className="p-3 rounded-4 d-inline-flex align-items-center justify-content-center"
                                          style={{ background: "linear-gradient(to right, #eff6ff, #ecfeff)", // blue-50 → cyan-50
                                            width: "60px", height: "60px" }}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-orange"
                                            style={{ background: "linear-gradient(to right, #3b82f6, #06b6d4)", // blue-500 → cyan-500
                                              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                          >
                                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                            <path d="M10 9H8" />
                                            <path d="M16 13H8" />
                                            <path d="M16 17H8" />
                                          </svg>
                                      </div>
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="ms-3">
                                          <span className=""> Draft Post</span>
                                          <h6 className="mb-1 counter h6-card-heading" data-target={ formatK(analytics?.draftCount) ?? 0 } >
                                            {formatK(analytics?.draftCount) ?? 0}
                                          </h6>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-end mt-2">
                                        <div className="circular-progress"
                                          style={{
                                            "--progress": `${formatK(analytics?.postGrowthByPlatform?.draftGrowth) ?? 0}%`,
                                            "--size": "60px",
                                            "--thickness": "6px",
                                          }}
                                        >
                                          <div className="progress-value">
                                            <span className="txt-success f-w-500">
                                              {formatK(analytics?.postGrowthByPlatform?.draftGrowth) ?? 0}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span className="f-light my-3">
                                  Total draft post of{" "}
                                  <span style={{ textTransform: "lowercase" }}>
                                    {showCalendarFilterText === "Custom Range" ? showSelectedDays : showCalendarFilterText}{" "}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* <!-- frist row style end  --> */}
                        <div className="row d-flex flex-wrap align-items-stretch my-3">
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card overflow-hidden analytics-tread-card">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <div>
                                    <span className="c-o-light mb-1"> Published{" "} </span>
                                    <div className="common-align">
                                      {analytics.publishedPost > 0 ? (
                                        <h5 className="mb-1">
                                          {analytics.publishedPostList[0].content.split(" ").slice(0, 3).join(" ") +
                                            (analytics.publishedPostList[0].content.split(" ").length > 3 ? "..." : "")}
                                        </h5>
                                      ) : (
                                        <h5 className="mb-1"></h5>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    {/* <div className="analytics-tread bg-light-primary">
                                      <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/publishing (1).png`} alt="" />
                                    </div> */}
                                    <div className="analytics-tread p-3 rounded d-inline-flex align-items-center justify-content-center"
                                        style={{ background: "linear-gradient(to right, #faf5ff, #fdf2f8)", borderRadius: "1rem" }} >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success" >
                                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                                        <path d="M9 11l3 3L22 4" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card-body pt-0">
                                <div>
                                  {analytics.publishedPost > 0 ? (
                                    <>
                                      <p>
                                        {analytics.publishedPostList[0].likes} likes{" "}
                                        - {analytics.publishedPostList[0].comments} comments{" "}
                                        - {analytics.publishedPostList[0].shares} shares
                                      </p>
                                      <div className="d-flex gap-2 align-items-center">
                                        <div>
                                          <button className="btn btn-outline-primary"
                                            onClick={() => { setPostView(analytics.publishedPostList[0]); setViewModal(true); }}
                                          > View </button>
                                        </div>
                                        <div>
                                          <span className="btn btn-outline-primary" onClick={() => 
                                            { handleEdit(analytics.publishedPostList[0].form_id) } 
                                          }>Edit</span>
                                        </div>
                                        <div>
                                          <button type="button" className="btn btn-outline-primary"> Boost </button>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p>No published post for last 7 days</p>
                                      <div className="d-flex flex-wrap gap-3 align-items-center">
                                        <div style={{ margin: "0 auto" }}>
                                          <Link className="btn btn-primary" to="/create-post"> Create post </Link>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card overflow-hidden analytics-tread-card">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <div>
                                    <span className="c-o-light mb-1"> Scheduled </span>
                                    <div className="common-align">
                                      {analytics.scheduledCount > 0 ? (
                                        <h5 className="mb-1">
                                          {analytics.latestScheduledPost[0].content.split(" ").slice(0, 3).join(" ") +
                                            (analytics.latestScheduledPost[0].content.split(" ").length > 3 ? "..." : "")}
                                        </h5>
                                      ) : (
                                        <h5 className="mb-1"></h5>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    {/* <div className="analytics-tread bg-light-primary">
                                      <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/calendar.png`} alt=""/>
                                    </div> */}
                                    <div className="analytics-tread p-3 rounded d-inline-flex align-items-center justify-content-center"
                                      style={{ background: "linear-gradient(to right, #eff6ff, #ecfeff)",
                                        borderRadius: "1rem", width: "60px", height: "60px" }} >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple" >
                                        <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card-body pt-0">
                                <div>
                                  {analytics.scheduledCount > 0 ? (
                                    <>
                                      <p> Scheduled for{" "}
                                        {moment.unix(analytics.latestScheduledPost[0].schedule_time).format("D MMMM YYYY [at] h:mm A")}
                                      </p>
                                      <div className="d-flex gap-2 align-items-center">
                                        <div>
                                          <button type="button" className="btn btn-outline-primary"
                                            onClick={() => { setPostView(analytics.latestScheduledPost[0]); setViewModal(true); }}
                                          > View </button>
                                        </div>
                                        <div>
                                          <span className="btn btn-outline-primary" onClick={() => 
                                            { handleEdit(analytics.latestScheduledPost[0].form_id) } 
                                          }>Edit</span>
                                        </div>
                                        <div>
                                          <button type="button" className="btn btn-outline-primary"
                                            onClick={() => { setPostToDelete(analytics.latestScheduledPost[0]);setShowDeleteModal(true); }}
                                          > Delete </button>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p>No scheduled post for last 7 days</p>
                                      <div className="d-flex flex-wrap gap-3 align-items-center">
                                        <div style={{ margin: "0 auto" }}>
                                          <Link className="btn btn-primary" to="/create-post"> Create post </Link>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-sm-12 col-md-6 col-xl-4 my-1">
                            <div className="card overflow-hidden analytics-tread-card">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <div>
                                    <span className="c-o-light mb-1">Draft</span>
                                    <div className="common-align">
                                      {analytics.draftCount > 0 ? (
                                        <h5 className="mb-1">
                                          {analytics.latestDraftPost[0].content.split(" ").slice(0, 3).join(" ") +
                                            (analytics.latestDraftPost[0].content.split(" ").length > 3 ? "..." : "")}
                                        </h5>
                                      ) : (
                                        <h5 className="mb-1"></h5>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    {/* <div className="analytics-tread bg-light-primary">
                                      <img src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/draft.png`} alt=""/>
                                    </div> */}
                                    <div className="analytics-tread p-3 rounded-4 d-inline-flex align-items-center justify-content-center"
                                      style={{ background: "linear-gradient(to right, #eff6ff, #ecfeff)", width: "60px", height: "60px" }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose"
                                        style={{ background: "linear-gradient(to right, #3b82f6, #06b6d4)", // blue → cyan
                                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                                      >
                                        <path d="M4 4h16v16H4z" />
                                        <path d="M8 8h8M8 12h8M8 16h8" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="card-body pt-0">
                                <div>
                                  {analytics.draftCount > 0 ? (
                                    <>
                                      <p>Draft - saved but not published</p>
                                      <div className="d-flex gap-2 align-items-center">
                                        <div>
                                          <button type="button" className="btn btn-outline-primary"
                                            onClick={() => { setPostView(analytics.latestDraftPost[0]); setViewModal(true); }}
                                          > View </button>
                                        </div>
                                        <div>
                                          <span className="btn btn-outline-primary" onClick={() => 
                                            { handleEdit(analytics.latestDraftPost[0].form_id) } 
                                          }>Edit</span>
                                        </div>
                                        <div>
                                          <button type="button" className="btn btn-outline-primary"
                                            onClick={() => { setPostToDelete(analytics.latestDraftPost[0]); setShowDeleteModal(true);  }}
                                          > Delete </button>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p>No draft post for last 7 days</p>
                                      <div className="d-flex flex-wrap gap-3 align-items-center">
                                        <div style={{ margin: "0 auto" }}>
                                          <Link className="btn btn-primary" to="/create-post"> Create post </Link>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-12">
                            <div className="card heading-space">
                              <div className="card-header card-no-border">
                                <div className="header-top m-0">
                                  <h5 className="m-0">
                                    {postListBy === "publishedPost" ? (
                                      <span>Posts List: Published</span>
                                    ) : postListBy === "draftPost" ? (
                                      <span>Posts List: Draft</span>
                                    ) : postListBy === "scheduledPost" ? (
                                      <span>Posts List: Scheduled</span>
                                    ) : null}
                                  </h5>
                                  <div className="card-header-right-icon">
                                    <div className="dropdown icon-dropdown">
                                      <button className="btn dropdown-toggle" id="campaignDropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        <span style={{ fontSize: "18px" }}> Filter </span>
                                        <i className="fa-solid fa-filter ms-1"></i>
                                      </button>
                                      <div className="dropdown-menu dropdown-menu-end rounded-3 border-0 p-1 m-1" aria-labelledby="campaignDropdown">
                                        <a className="dropdown-item rounded-3 border-0 mb-1" style={{ cursor: "pointer" }} onClick={() => { PostsByType("publishedPost"); }} > Published </a>
                                        <a className="dropdown-item rounded-3 border-0 mb-1" style={{ cursor: "pointer" }} onClick={() => { PostsByType("draftPost"); }} > Draft </a>
                                        <a className="dropdown-item rounded-3 border-0 " style={{ cursor: "pointer" }} onClick={() => { PostsByType("scheduledPost"); }} > Scheduled </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Old posts list view */} 
                              {/* <div className="card-body pt-0 px-0 campaign-table">
                                <div className="recent-table table-responsive currency-table custom-scrollbar">
                                  {fullScreenLoader ? (
                                    <div className="fullscreen-loader-overlay">
                                      <div className="fullscreen-loader-content">
                                        <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                                          <span className="sr-only">
                                            Loading...
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <DataTable
                                      columns={columns}
                                      data={formattedPosts}
                                      customStyles={customStyles}
                                      conditionalRowStyles={conditionalRowStyles}
                                      pagination={true}
                                      responsive={true}
                                      striped={true}
                                      highlightOnHover={true}
                                    />
                                  )}
                                </div>
                              </div> */}
                              {/* End Old posts list view */} 
                            </div>
                            
                            {/* start new design */}                                                    
                            {fullScreenLoader ? (
                                <div className="fullscreen-loader-content">
                                    <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>                                                                                                              
                            ) : formattedPosts?.length > 0 ? (                                                        
                                formattedPosts.slice(0, visiblePosts).map((post, index) => (
                                    <div className="card my-3 published-card-posts" key={index}>
                                        <div className="row card-body">
                                          
                                            <div className="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-6">                                                                                                                                                                                                 
                                              <div className="d-flex align-items-center gap-3 mobile-responsive">
                                                  <div>
                                                    <HoverPostPreview platform={post.platform.toLowerCase()} post={post}>
                                                      <div className="mb-0 d-flex justify-content-center align-items-center rounded-3 mobile-devise-img">
                                                          {(() => {
                                                              try {
                                                                  const media = typeof post.postMedia === 'string'? JSON.parse(post.postMedia) : post.postMedia;
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
                                                                  if (typeof post.postMedia === 'string' && post.postMedia.startsWith('http')) {
                                                                      return <img src={post.postMedia} alt="Post Media" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                                                  onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                                  }
                                                              }                                                                                        
                                                              return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="rounded-lg" style={{ maxWidth: '70px', height: '70px', objectFit: 'cover',borderRadius:'8px' }}
                                                                      onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;                                                                                        
                                                          })()}                                                                                        
                                                      </div>
                                                    </HoverPostPreview>
                                                  </div>
                                                  <div className="d-flex flex-column">
                                                      <p className="text-muted mb-2">
                                                          {(() => {
                                                              const maxLength = 170; // character limit
                                                              const truncatedContent =
                                                                  post?.content?.length > maxLength
                                                                  ? post.content.substring(0, maxLength) + "..."
                                                                  : post?.content || "";
                                                              // Split by line breaks and remove empty lines
                                                              const lines = truncatedContent.split(/\n+/).filter((line) => line.trim() !== "");
                                                              // Helper to extract text before first hashtag and all hashtags separately
                                                              const extractContentAndTags = (text) => {
                                                                  const hashtagMatch = text.match(/#\w+/g) || [];
                                                                  const beforeHashtag = text.split(/#\w+/)[0].trim();
                                                                  return { beforeHashtag, hashtags: hashtagMatch };
                                                              };
                                                              return lines.map((line, lineIndex) => {
                                                                  const { beforeHashtag, hashtags } = extractContentAndTags(line);
                                                                  const isFirstLine = lineIndex === 0;
                                                                  return (
                                                                  <div key={`line-${lineIndex}`} style={{ marginBottom: "4px" }}>
                                                                      {isFirstLine ? (
                                                                      <h5
                                                                          className="mb-1 h6-heading"
                                                                          style={{ margin: "0 0 6px 0", fontWeight: 600 }}
                                                                      >
                                                                          {beforeHashtag}
                                                                      </h5>
                                                                      ) : (
                                                                      <p
                                                                          key={`text-${lineIndex}`}
                                                                          style={{ margin: "0 0 2px 0", color: "#555" }}
                                                                      >
                                                                          {beforeHashtag} {/* Hashtags (each separate) */}
                                                                              {hashtags.length > 0 && (
                                                                                  <div className="d-flex flex-wrap gap-1 mt-1">
                                                                                      {hashtags.map((tag, tagIndex) => (
                                                                                      <span
                                                                                          key={`tag-${lineIndex}-${tagIndex}`}
                                                                                          style={{
                                                                                              fontWeight: 500,
                                                                                          }}
                                                                                      >
                                                                                          {tag}
                                                                                      </span>
                                                                                      ))}
                                                                                  </div>
                                                                              )}
                                                                      </p>
                                                                      )}                                                                                                
                                                                  </div>
                                                                  );
                                                              });
                                                          })()}
                                                      </p>                                                                                
                                                      {/* Post Info */}
                                                      <div className="d-flex align-items-center text-muted small gap-3 mb-2">                                                                                        
                                                          <span className='d-inline-flex align-items-center'>
                                                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-calendar h-5 w-5">
                                                                  <path d="M8 2v4"></path>
                                                                  <path d="M16 2v4"></path>
                                                                  <rect width="18" height="18" x="2" y="4" rx="2"></rect>
                                                                  <path d="M3 10h18"></path>
                                                              </svg> 
                                                                  {shortRelativeTime(post.date)}
                                                          </span>
                                                          <span> 
                                                              <img src={post.postPagePicture || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                  alt="" style={{ width: '15px', marginRight: '5px' }} className="rounded-circle" />
                                                              {post.postPageName || 'Page name'}                                                                                            
                                                          </span>
                                                          <div className="d-inline-flex align-items-center rounded-pill fw-semibold small">
                                                              {post.source === "API" ? (
                                                                  <div
                                                                      className="platform-icon-custom d-flex justify-content-center align-items-center rounded-circle me-2"
                                                                      style={{
                                                                      background: "linear-gradient(135deg, #2563EB, #1E40AF)",
                                                                      width: "20px",
                                                                      height: "20px",
                                                                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                                                      }}
                                                                  >
                                                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-white">
                                                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                                        <rect x="2" y="9" width="4" height="12"></rect>
                                                                        <circle cx="4" cy="4" r="2"></circle>
                                                                      </svg>
                                                                  </div>
                                                              ) : (
                                                                  <img className="img-fluid" style={{ width: 16 }} src="/assets/images/logo/logo.svg" alt="source" /> 
                                                              )}                                                                                                                                                                                       
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>                                              
                                            </div>
                                            <div className="col-12 col-md-12 col-lg-12 col-xl-12 col-xxl-6">
                                                <div className="d-flex align-items-center justify-content-between mobile-responsive">
                                                    <div className="d-flex align-items-center text-muted  small mt-2 custom-width-100">                                                 
                                                       <div className="d-flex gap-3 mobile-responsive custom-width-100"> 
                                                        <div className="d-flex gap-3 justify-content-between custom-width-100 "> 
                                                          {/* Likes */}
                                                          <OverlayTrigger
                                                              placement="top"
                                                              overlay={
                                                                  <Tooltip id="tooltip-fb">                                                                                    
                                                                      Likes                                                                                    
                                                                  </Tooltip>
                                                              }
                                                              delay={{ show: 100, hide: 150 }}
                                                              transition={true}                                                                            
                                                          >
                                                              <div className="d-flex align-items-center " style={{ cursor: "pointer" }}>                                                                            
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
                                                                  <span>{post.likes}</span>                                                                            
                                                              </div>
                                                          </OverlayTrigger>
                                                          {/* Comments */}
                                                          <OverlayTrigger
                                                              placement="top"
                                                              overlay={
                                                                  <Tooltip id="tooltip-fb">                                                                                    
                                                                      Comments                                                                                    
                                                                  </Tooltip>
                                                              }
                                                              delay={{ show: 100, hide: 150 }}
                                                              transition={true}                                                                            
                                                          >
                                                              <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>
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
                                                                  <span>{post.comments}</span>
                                                              </div>
                                                          </OverlayTrigger>
                                                          {/* Shares */}
                                                          <OverlayTrigger
                                                              placement="top"
                                                              overlay={
                                                                  <Tooltip id="tooltip-fb">                                                                                    
                                                                      Shares                                                                                    
                                                                  </Tooltip>
                                                              }
                                                              delay={{ show: 100, hide: 150 }}
                                                              transition={true}                                                                            
                                                          >
                                                              <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>
                                                                  <svg xmlns="http://www.w3.org/2000/svg" 
                                                                      width="24"
                                                                      height="24"
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
                                                                  <span>{post.shares}</span>
                                                              </div>
                                                          </OverlayTrigger>
                                                        </div>
                                                        <div className="d-flex gap-3 justify-content-between w-100"> 
                                                          {/* reach */}
                                                          <OverlayTrigger
                                                              placement="top"
                                                              overlay={
                                                                  <Tooltip id="tooltip-fb">                                                                                    
                                                                      Reach                                                                                    
                                                                  </Tooltip>
                                                              }
                                                              delay={{ show: 100, hide: 150 }}
                                                              transition={true}                                                                            
                                                          >
                                                              <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>
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
                                                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                      <circle cx="12" cy="12" r="3" />
                                                                  </svg> <span>{post.reach}</span>
                                                              </div>                                                                                           
                                                          </OverlayTrigger>
                                                          {/* engagement */}
                                                          <OverlayTrigger
                                                              placement="top"
                                                              overlay={
                                                                  <Tooltip id="tooltip-fb">                                                                                    
                                                                      Engagement                                                                                    
                                                                  </Tooltip>
                                                              }
                                                              delay={{ show: 100, hide: 150 }}
                                                              transition={true}                                                                            
                                                          >
                                                              <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>                                                                            
                                                                  <svg xmlns="http://www.w3.org/2000/svg" 
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
                                                                  <span>{post.engagement}%</span> 
                                                              </div>
                                                          </OverlayTrigger>
                                                          {/* impressions */}
                                                          <OverlayTrigger
                                                              placement="top"
                                                              overlay={
                                                                  <Tooltip id="tooltip-fb">                                                                                    
                                                                      Impressions                                                                                    
                                                                  </Tooltip>
                                                              }
                                                              delay={{ show: 100, hide: 150 }}
                                                              transition={true}                                                                            
                                                          >
                                                              <div className="d-flex align-items-center" style={{ cursor: "pointer" }}>                                                                            
                                                                  <svg xmlns="http://www.w3.org/2000/svg" 
                                                                      width="24"
                                                                      height="24"
                                                                      fill="none"
                                                                      stroke="currentColor"
                                                                      strokeWidth="2"
                                                                      strokeLinecap="round"
                                                                      strokeLinejoin="round"
                                                                      className="me-1"
                                                                  >
                                                                      <path d="M16 19h4a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-2m-2.236-4a3 3 0 1 0 0-4"></path>
                                                                      <path d="M3 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"></path>
                                                                      <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
                                                                  </svg>
                                                                  <span>{post.impressions}</span> 
                                                              </div>
                                                          </OverlayTrigger>
                                                        </div> 
                                                        </div>                                                         
                                                    </div> 
                                                     <div className="d-flex gap-1 justify-content-between my-lg-3">
                                                            {/* View Post Button */}                                                                                    
                                                            {post.status === 'Published' ? (
                                                                <a
                                                                    href={`https://www.linkedin.com/feed/update/${post.platform_post_id}`}
                                                                    className="btn custom-outline-btn  d-flex align-items-center text-xs rounded-pill"
                                                                    style={{ height: "36px", fontSize: "12px", }}
                                                                    target='_blank'
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
                                                                </a> 
                                                            ) : (
                                                                <button type="button"
                                                                    className="btn custom-outline-btn  d-flex align-items-center text-xs rounded-pill"
                                                                    style={{ height: "36px", fontSize: "12px", }}
                                                                    disabled="true"
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
                                                            )}                                                          
                                                            {/* Copy Button */}
                                                            <Dropdown align="end">
                                                                <Dropdown.Toggle
                                                                    as="button"
                                                                    type="button"
                                                                    className="btn custom-outline-btn d-flex align-items-center gap-1 text-xs rounded-pill w-100"
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
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu className="rounded-3 border-0 p-1 m-1">
                                                                    <Dropdown.Item className="rounded-3 border-0 mb-1" onClick={() => {handleEdit(post.form_id)} }>
                                                                        <i className="fa fa-solid fa-pencil"></i> Edit
                                                                    </Dropdown.Item>
                                                                    <Dropdown.Item className="rounded-3 border-0 " onClick={() => post.onDelete(post)}>
                                                                        <i className="fa fa-solid fa-trash-alt text-danger"></i> Delete
                                                                    </Dropdown.Item>                                                                                             
                                                                </Dropdown.Menu>
                                                            </Dropdown>
                                                        </div>                                                                    
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-danger my-4">No posts found</p>
                            )}

                            <>
                              {formattedPosts.length > visiblePosts && (
                                  <div className="d-flex justify-content-center align-items-center my-4">
                                      <button type="button" className="btn custom-outline-btn d-flex align-items-center rounded-pill bg-white" onClick={loadMorePosts}>
                                          Load More Posts
                                      </button>
                                  </div>
                              )}
                            </>

                            {/* end new design */}

                          </div>
                        </div>

                        {/* new card style start  */}
                        {/* <div className='row'>
                          <div className='col-md-6'>
                            <div className='card'>
                              <div className='card-header card-no-border d-flex align-items-center justify-content-between'>
                                <div>
                                  <h5 className='h5-heading d-flex align-items-center gap-2'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success" >
                                      <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                                      <path d="m9 11 3 3L22 4"></path>
                                    </svg> Published
                                  </h5>
                                </div>
                                <div>
                                  <span className="badge rounded-pill text-success">5 posts </span>
                                </div>
                              </div>
                              <div className='card-body pt-0'>
                                <div className='card'>
                                  <div className='card-body'>
                                    <div className='d-flex align-items-center justify-content-between gap-2'>
                                      <div>
                                        <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop" alt="Post" 
                                          className="img-fluid rounded-4" style={{ width: "90px", height: "70px", objectFit: "cover" }} />
                                      </div>
                                      <div className='d-flex gap-2'>
                                        <div className='d-flex flex-column gap-2'>
                                          <div>
                                            <p> 🎉 Thrilled to announce that we've reached 50K followers! Thank you for.... </p>
                                          </div>
                                          <div className='d-flex align-items-center justify-content-between w-100'>
                                            <div className="d-flex align-items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-primary" >
                                                <path d="M8 2v4"></path>
                                                <path d="M16 2v4"></path>
                                                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                                <path d="M3 10h18"></path>
                                              </svg>
                                              <p className="" style={{ fontSize: "12px" }}>Aug 6 at 3:30 PM</p>
                                            </div>
                                            <div className="d-flex align-items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-primary" >
                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>
                                              </svg>
                                              <p className="" style={{ fontSize: "12px" }}>3.2K reach</p>
                                            </div>
                                            <div className="d-inline-flex align-items-center rounded-pill green-badge fw-semibold small"> Excellent </div>
                                          </div>
                                        </div>
                                        <div className='d-flex align-items-center gap-2'>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen" >
                                            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                                          </svg>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-column" >
                                            <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                                            <path d="M18 17V9"></path>
                                            <path d="M13 17V5"></path>
                                            <path d="M8 17v-3"></path>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>

                                    <div className='d-flex align-items-center justify-content-between mt-3'>
                                      <div className="d-flex align-items-center gap-3">
                                        //  Likes 
                                        <span className="d-flex align-items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1 text-danger">
                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                                          </svg> 847
                                        </span>

                                        // Comments 
                                        <span className="d-flex align-items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1 text-primary" >
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                          </svg> 23
                                        </span>

                                        // Shares 
                                        <span className="d-flex align-items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1 text-success" >
                                            <circle cx="18" cy="5" r="3"></circle>
                                            <circle cx="6" cy="12" r="3"></circle>
                                            <circle cx="18" cy="19" r="3"></circle>
                                            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                                            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                          </svg> 12
                                        </span>
                                      </div>
                                      <p> LinkedIn </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          // Scheduled card 
                          <div className='col-md-6'>
                            <div className='card'>
                              <div className='card-header card-no-border d-flex align-items-center justify-content-between'>
                                <div>
                                  <h5 className='h5-heading d-flex align-items-center gap-2'>  
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg> Scheduled
                                  </h5>
                                </div>
                                <div>
                                  <span className="primary-badge badge rounded-pill">1 post</span>
                                </div>
                              </div>
                              <div className='card-body pt-0'>
                                <div className='card'>
                                  <div className='card-body'>
                                    <div className='d-flex align-items-center justify-content-between gap-2'>
                                      <div>
                                        <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop" alt="Post"
                                          className="img-fluid rounded-4" style={{ width: "90px", height: "70px", objectFit: "cover" }} />
                                      </div>
                                      <div className='d-flex gap-2'>
                                        <div className='d-flex flex-column gap-2'>
                                          <div>
                                            <p> 🚀 Exciting news! Our new feature is launching next week. Stay tuned for more... </p>
                                          </div>
                                          <div className='d-flex align-items-center justify-content-between w-100'>
                                            <div className="d-flex align-items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary me-2" >
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                              </svg>
                                              <p className="" style={{ fontSize: "12px" }}>Tomorrow at 9:00 AM</p>
                                            </div>
                                            <div className="d-flex align-items-center">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2 text-primary" >
                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>
                                              </svg>
                                              <p className="" style={{ fontSize: "12px" }}>Estimated reach: 2.5K</p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className='d-flex align-items-center gap-2'>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square-pen">
                                            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"></path>
                                          </svg>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark" >
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            <line x1="10" x2="10" y1="11" y2="17"></line>
                                            <line x1="14" x2="14" y1="11" y2="17"></line>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div className='d-flex align-items-center mt-3'>
                                      <span className="primary-badge badge rounded-pill">Scheduled</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div> */}
                        {/* new card style end */}
                      </div>

                      <div className={`tab-pane fade ${activeTab === 'Comments' ? "show active" : ""}`} id="Comments" role="tabpanel" aria-labelledby="comments-tab">
                        <div className="row mobile-align-items">
                          {connectedAccountInfo.length === 0 ? (
                            <></>
                          ) : (
                            <>
                              <CommentSentimentComponent
                                  commentsSentiment={commentsSentiment}
                                  fetchCommentsSentiment={fetchCommentsSentiment}
                                  selectedRange={selectedRange}
                                  platform={selectPage.page_platform}
                                  pageID={selectPage.pageId}
                                  showSelectedDays={showSelectedDays}
                                  showCalendarFilterText={showCalendarFilterText}
                              />
                            </>
                          )}
                        </div>

                        {/* {Array.isArray(commentPosts) && commentPosts.length > 0 && (
                          <div className="row">
                            <div className="col-md-10">
                              <p className="text-danger mt-0 pt-0">
                                Note: To fetch the latest comments, please click on the{" "}
                                <b>Sync</b> button. 
                              </p>
                            </div>

                            <div className="col-md-2 d-flex justify-content-end">
                              <button className="btn btn-primary w-auto" 
                                onClick={() => {
                                  PagePostsComments("getPostsComments");
                                }}>
                                <i className="fas fa-redo fa-spin"></i>{" "}Sync
                              </button>
                            </div>
                          </div>
                        )} */}
                        <div className='comments-container my-3 '>
                          <div className="row d-flex flex-wrap align-items-stretch  my-3 gap-3 card ">
                            <div className="card-header border-0 pb-0 comments-sticky-header">

                               <div className='d-flex justify-content-between align-items-center'> 
                                  <div className='d-flex gap-2'> 
                                      <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="22"
                                          height="22"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="lucide lucide-message-square h-5 w-5 mr-2"
                                      >
                                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                      </svg>
                                      <span className="dropdown icon-dropdown">
                                          <h5 className='h5-heading dropdown-toggle text-dark' 
                                              id="campaignDropdown" 
                                              type="button"
                                              data-bs-toggle="dropdown" 
                                              aria-expanded={isOpen}
                                              onClick={() => setIsOpen((prev) => !prev)}
                                          > 
                                              Comments: <span>{commentCurrentFilter ? commentCurrentFilter.charAt(0).toUpperCase() + commentCurrentFilter.slice(1).toLowerCase(): ""}</span>
                                              {isOpen ? (
                                                  <i className="fa-solid fa-angle-up" style={{marginLeft:'10px'}}></i>                                                                    
                                              ) : (
                                                  <i className="fa-solid fa-angle-down" style={{marginLeft:'10px'}}></i>
                                              )}
                                          </h5> 
                                          <div className="dropdown-menu dropdown-menu-end rounded-3 border-0 p-1 " aria-labelledby="campaignDropdown">
                                              <a className="dropdown-item rounded-3 border-0 mb-1"
                                                  style={{ cursor: 'pointer' }} 
                                                  onClick={() => {
                                                      CommentsFilterBySentiment('All');
                                                  }}                                                               
                                              >
                                              All
                                              </a>
                                              <a className="dropdown-item rounded-3 border-0 mb-1"
                                                  style={{ cursor: 'pointer' }}
                                                  onClick={() => {
                                                      CommentsFilterBySentiment('POSITIVE');
                                                  }}                                                               
                                              >
                                                  Positive
                                              </a>
                                              <a className="dropdown-item rounded-3 border-0 mb-1"
                                                  style={{ cursor: 'pointer' }}
                                                  onClick={() => {
                                                      CommentsFilterBySentiment('NEUTRAL');
                                                  }}                                                                
                                              >
                                                  Neutral
                                              </a>
                                              <a className="dropdown-item rounded-3 border-0"
                                                  style={{ cursor: 'pointer' }}
                                                  onClick={() => {
                                                      CommentsFilterBySentiment('NEGATIVE');
                                                  }}                                                                
                                              >
                                                  Negative
                                              </a>
                                          </div> 
                                      </span>                                                                                                            
                                  </div>                                                   
                                  
                                  <div>
                                      <span className="badge rounded-pill custom-blue-badge">
                                          {commentPosts.length} comments
                                      </span>
                                  </div>  

                              </div>
                              {/* <div className=" d-flex gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-square h-5 w-5 mr-2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span className="dropdown icon-dropdown">
                                  <h5 className='h5-heading dropdown-toggle text-dark'
                                      id="campaignDropdown" 
                                      type="button"
                                      data-bs-toggle="dropdown" 
                                      aria-expanded={isOpen}
                                      onClick={() => setIsOpen((prev) => !prev)}
                                  > 
                                    Comments: <span>{commentCurrentFilter ? commentCurrentFilter.charAt(0).toUpperCase() + commentCurrentFilter.slice(1).toLowerCase(): ""}</span>
                                    {isOpen ? (
                                      <i className="fa-solid fa-angle-up" style={{marginLeft:'10px'}}></i>                                                                    
                                    ) : (
                                      <i className="fa-solid fa-angle-down" style={{marginLeft:'10px'}}></i>
                                    )} 
                                  </h5>
                                  <div className="dropdown-menu dropdown-menu-end" aria-labelledby="campaignDropdown">
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => { CommentsFilterBySentiment('All'); }} > All </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => { CommentsFilterBySentiment('POSITIVE'); }} > Positive </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => { CommentsFilterBySentiment('NEUTRAL'); }} > Neutral </a>
                                    <a className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => { CommentsFilterBySentiment('NEGATIVE'); }} > Negative </a>
                                  </div>
                                </span>                                
                              </div>
                              <div>
                                <span className="badge rounded-pill custom-blue-badge">{commentPosts.length} comments</span>
                              </div> */}

                                {commentPosts.length > 0 && (
                              <div className='col-sm-12 col-md-12 col-xl-12'>
                                  <div className='px-1 py-1 my-3' style={{boxShadow:'none',marginLeft:'0px',marginRight:'0px'}}>
                                      <div className="d-flex justify-content-between mobile-responsive">
                                          <div className="form-check">
                                              <label className="form-check-label small" htmlFor="selectAllComments" style={{fontSize:'15px'}}>
                                                  <input
                                                      className="form-check-input"
                                                      type="checkbox"
                                                      id="selectAllComments"                                                           
                                                      checked={selectAll}
                                                      onChange={toggleSelectAll}
                                                  />                                                                
                                                  Select All  ({selectedComments.length} selected)
                                              </label>
                                          </div>
                                          {Array.isArray(selectedComments) && selectedComments.length > 0 ? (
                                              <button type='button' className='btn btn-pill btn-outline-danger'
                                                  onClick={() => { setDeleteMultipleCommentsModel(true); }} >
                                                <i className="fas fa-trash-alt"></i> Delete Comments
                                              </button>
                                          ) : (
                                              <></>
                                          )}
                                      </div>
                                  </div>
                              </div>
                            )}

                            </div>
                            
                            

                            {Array.isArray(commentPosts) && commentPosts.length > 0 ? (
                              <>
                                {commentPosts.map((commentPost) => {
                                  const latestComment = commentPost;
                                  const commentMessage = latestComment?.comment || "No comments available";
                                  const commentAuthor = latestComment?.from_name || "Anonymous User";
                                  const commentTime = latestComment?.comment_created_time ? shortRelativeTime(latestComment.comment_created_time) : "";
                                  //let randomNum = Math.floor(Math.random() * 100) + 1;                                
                                  const postPreview = commentPost?.UserPost?.content
                                                      ? `${commentPost.UserPost.content.split("#")[0]?.trim().split(" ").slice(0, 50).join(" ")}${commentPost.UserPost.content.split("#")[0]?.trim().split(" ").length > 15 ? "..." : ""
                                                      }`
                                                      : "";
                                  const isSelected = selectedComments.includes(commentPost.id);

                                  return (
                                    <div className="col-sm-12 col-md-12 col-xl-12 my-1" key={commentPost.id}>
                                      <div className={`comments-card ${isSelected ? 'selected-comment' : ''}`} style={{margin:'0px'}}> 
                                        <div className="d-flex justify-content-between mobile-responsive">
                                          <div className="d-flex gap-2 mobile-responsive custom-width-100">
                                            <div className="form-check mt-1">
                                              <input
                                                  className="form-check-input"
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  onChange={() => toggleCommentSelection(commentPost.id)}
                                                  id={`comment-${commentPost.id}`}
                                                  style={{fontSize:'15px'}}
                                              />
                                            </div>
                                            {/* Profile Image */}
                                            <div>
                                              {/* <img src={commentPost?.UserPost?.post_media ||`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg` }
                                                alt="Profile" className="me-2 comments-card-img" width="30" height="30"
                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}
                                              /> */}
                                              {(() => {
                                                try {
                                                  const media = typeof commentPost?.UserPost.post_media === 'string'? JSON.parse(commentPost?.UserPost.post_media) : commentPost?.UserPost.postMedia;
                                                  if (Array.isArray(media) && media.length > 0) {
                                                    const firstMedia = media[0];
                                                    if (firstMedia.path) {
                                                      return <img src={`${process.env.REACT_APP_BACKEND_URL}${firstMedia.path}`} alt="Post Media" className="me-2 comments-card-img" width="30" height="30"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                    }
                                                    if (firstMedia.img_path) {
                                                      return <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${firstMedia.img_path}`} alt="Post Media" className="me-2 comments-card-img" width="30" height="30"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                    }
                                                    if (typeof firstMedia === 'string' && firstMedia.startsWith('http')) {
                                                      return <img src={firstMedia} alt="Post Media" className="me-2 comments-card-img" width="30" height="30"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                    }
                                                  } else if (media.img_path) {
                                                    return <img src={`${process.env.REACT_APP_BACKEND_URL}/uploads/posts/${media.img_path}`} alt="Post Media" className="me-2 comments-card-img" width="30" height="30"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                  } else if (typeof media === 'string' && media.startsWith('https://')) {
                                                    return <img src={media} alt="Post Media" className="me-2 comments-card-img" width="30" height="30"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                  }
                                                } catch (e) {
                                                  if (typeof commentPost?.UserPost.post_media === 'string' && commentPost?.UserPost.post_media.startsWith('http')) {
                                                    return <img src={commentPost?.UserPost.post_media} alt="Post Media" className="me-2 comments-card-img" width="30" height="30"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                  }
                                                }
                                                return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="me-2 comments-card-img" width="30" height="30"
                                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
                                              })()}
                                            </div>

                                            {/* Comment Content */}
                                            <div>
                                              <div className='d-flex gap-2 align-items-center'>   
                                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=melo18`}
                                                    alt={commentAuthor} className="rounded-circle p-1"
                                                    style={{ width: "45px", height: "45px", objectFit: "cover" }}
                                                  />
                                                  {" "} <span className="text-primary"> {commentAuthor}
                                                  </span> <span style={{ fontSize: '12px',color:'#4B5563' }}> {" "} - {commentTime} </span>
                                                </div>
                                              <h6 className='my-2' style={{ fontSize: "15px" }}> {commentMessage} </h6>
                                              <p> {postPreview && ` on "${postPreview}"`} </p>
                                            </div>
                                            <div>
                                              {/* <h6 style={{ fontSize: "15px" }}>
                                                {commentMessage}
                                              </h6>
                                              <p>by{" "} <span className="badge bg-success"> {commentAuthor}
                                                </span> {" "} - {commentTime} {postPreview && ` - on "${postPreview}"`}
                                              </p> */}

                                              {/* Reply Section */}
                                              {/* {replyingToComment === latestComment?.id && (
                                                <div className="d-flex">
                                                  <div className="me-2 mt-2">
                                                    <img src={selectPage?.page_picture} width={32} height={32} alt="Page" className="rounded-circle"/>
                                                  </div>
                                                  <div className="flex-grow-1 position-relative">
                                                    <input type="text" className="form-control rounded-pill ps-3 pe-5" placeholder="Write a reply..."
                                                      value={replyText} onChange={(e) => setReplyText(e.target.value)} 
                                                      style={{ height: "50px", border: "1px solid #ddd",}}/>
                                                    {commentLoading ? (
                                                      <button className="btn btn-primary rounded-pill position-absolute"
                                                        style={{
                                                          right: "15px",
                                                          top: "50%",
                                                          transform: "translateY(-50%)",
                                                          padding: "2px 12px",
                                                          fontSize: "0.875rem",
                                                        }}
                                                      >
                                                        <i className="fas fa-spin fa-spinner"></i>
                                                      </button>
                                                    ) : (
                                                      replyText && (
                                                        <button className="btn btn-primary rounded-pill position-absolute"
                                                          style={{
                                                            right: "15px",
                                                            top: "50%",
                                                            transform:"translateY(-50%)",
                                                            padding: "2px 12px",
                                                            fontSize: "0.875rem",
                                                          }}
                                                          // onClick={() => handlePostReply(latestComment.id)}
                                                          onClick={() => {
                                                            const decodedUrn = decodeURIComponent(latestComment.parent_comment_id || "");
                                                            const match = decodedUrn.match(/,\s*(\d+)\)/);
                                                            const parentId = match ? match[1] : null;
                                                            const replyToId = parentId || latestComment.comment_id;
                                                            handlePostReply(replyToId);
                                                          }}
                                                        >
                                                          Reply
                                                        </button>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )} */}
                                            </div>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="d-flex gap-1 p-3">

                                            <div className='comments-btn btn btn-sm btn-light' 
                                              onClick={() => { 
                                                setSelectCommentPost(commentPost); 
                                                setCommentPostModal(true); 
                                                setReplyingToComment(null);
                                                setReplyText('');
                                              }}
                                            > 
                                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye h-3 w-3" >
                                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                              </svg>
                                            </div>

                                            <div className='comments-btn btn btn-sm btn-light' style={{ cursor: "pointer" }}
                                              onClick={() => {
                                                setSelectCommentPost(commentPost); 
                                                setReplyingToComment(latestComment?.id);
                                                setReplyText('');
                                              }}
                                            >
                                              <span> Reply </span>
                                            </div>

                                            <div className='comments-btn btn btn-sm btn-light' onClick={() => { setCommentToDelete(latestComment); setDeleteCommentModal(true); }} > 
                                              <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" data-iconid="bin-cancel-close-delete-garbage-remove" data-svgname="Bin cancel close delete garbage remove"><path d="M11.8489 22.6922C11.5862 22.7201 11.3509 22.5283 11.3232 22.2638L10.4668 14.0733C10.4392 13.8089 10.6297 13.5719 10.8924 13.5441L11.368 13.4937C11.6307 13.4659 11.8661 13.6577 11.8937 13.9221L12.7501 22.1126C12.7778 22.3771 12.5873 22.614 12.3246 22.6418L11.8489 22.6922Z" fill="#000000"></path><path d="M16.1533 22.6418C15.8906 22.614 15.7001 22.3771 15.7277 22.1126L16.5841 13.9221C16.6118 13.6577 16.8471 13.4659 17.1098 13.4937L17.5854 13.5441C17.8481 13.5719 18.0387 13.8089 18.011 14.0733L17.1546 22.2638C17.127 22.5283 16.8916 22.7201 16.6289 22.6922L16.1533 22.6418Z" fill="#000000"></path><path clip-rule="evenodd" d="M11.9233 1C11.3494 1 10.8306 1.34435 10.6045 1.87545L9.54244 4.37037H4.91304C3.8565 4.37037 3 5.23264 3 6.2963V8.7037C3 9.68523 3.72934 10.4953 4.67218 10.6145L7.62934 26.2259C7.71876 26.676 8.11133 27 8.56729 27H20.3507C20.8242 27 21.2264 26.6513 21.2966 26.1799L23.4467 10.5956C24.3313 10.4262 25 9.64356 25 8.7037V6.2963C25 5.23264 24.1435 4.37037 23.087 4.37037H18.4561L17.394 1.87545C17.1679 1.34435 16.6492 1 16.0752 1H11.9233ZM16.3747 4.37037L16.0083 3.50956C15.8576 3.15549 15.5117 2.92593 15.1291 2.92593H12.8694C12.4868 2.92593 12.141 3.15549 11.9902 3.50956L11.6238 4.37037H16.3747ZM21.4694 11.0516C21.5028 10.8108 21.3154 10.5961 21.0723 10.5967L7.1143 10.6285C6.86411 10.6291 6.67585 10.8566 6.72212 11.1025L9.19806 24.259C9.28701 24.7317 9.69985 25.0741 10.1808 25.0741H18.6559C19.1552 25.0741 19.578 24.7058 19.6465 24.2113L21.4694 11.0516ZM22.1304 8.7037C22.6587 8.7037 23.087 8.27257 23.087 7.74074V7.25926C23.087 6.72743 22.6587 6.2963 22.1304 6.2963H5.86957C5.34129 6.2963 4.91304 6.72743 4.91304 7.25926V7.74074C4.91304 8.27257 5.34129 8.7037 5.86956 8.7037H22.1304Z" fill="#000000" fill-rule="evenodd"></path></svg>
                                            </div>

                                            {/* <Dropdown className="icon-dropdown">
                                              <Dropdown.Toggle variant="link">
                                                <i className="fa fa-solid fa-ellipsis-vertical text-dark"></i>
                                              </Dropdown.Toggle>
                                              <Dropdown.Menu className="dropdown-menu-end">
                                                <Dropdown.Item
                                                  onClick={() => {
                                                    setSelectCommentPost(commentPost);
                                                    setCommentPostModal(true);
                                                  }}>
                                                  <i className="fas fa-eye"></i> View
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                  onClick={() => {
                                                    setCommentToDelete(latestComment);
                                                    console.log("To be deleted:",latestComment);
                                                    setDeleteCommentModal(true);
                                                  }}>
                                                  <i className="fas fa-trash"></i> Delete
                                                </Dropdown.Item>
                                              </Dropdown.Menu>
                                            </Dropdown> */}
                                          </div>
                                        </div>
                                        {/* Reply Section */}
                                        {replyingToComment === latestComment?.id && (
                                          <div className="card comments-reply-card">
                                            <div className="d-flex gap-2">
                                              <div className="me-2 mt-2">
                                                <img src={selectPage?.page_picture} width={32} height={32} alt="Page" className="rounded-circle"/>
                                              </div>
                                              <div className="flex-grow-1 position-relative">
                                                <input 
                                                  type="text" 
                                                  className="form-control ps-3" 
                                                  placeholder="Write a reply..."
                                                  value={replyText} 
                                                  onChange={(e) => setReplyText(e.target.value)}
                                                  style={{ 
                                                      height: "50px", 
                                                      border: "1px solid #ddd",
                                                      paddingRight: "170px" // Add this to create space for buttons
                                                  }}  
                                                />
                                                {commentLoading ? (
                                                  <button className="btn btn-primary rounded-pill position-absolute"
                                                    style={{
                                                        right: "15px", top: "50%", transform: "translateY(-50%)",
                                                        padding: "2px 12px", fontSize: "0.875rem",
                                                    }} 
                                                  >
                                                    <i className="fas fa-spin fa-spinner"></i>
                                                  </button>
                                                ) : (                                                                                          
                                                  replyText && (
                                                    <div className="position-absolute" 
                                                      style={{ 
                                                          right: "15px", 
                                                          top: "50%", 
                                                          transform: "translateY(-50%)", 
                                                          display: 'flex', 
                                                          gap: '5px',
                                                          alignItems: 'center'
                                                      }}
                                                    >
                                                      <button
                                                        className="btn btn-outline-secondary rounded-pill"
                                                        onClick={() => {
                                                          setReplyingToComment(null);
                                                          setReplyText('');
                                                        }}
                                                        style={{ 
                                                          padding: "2px 12px", 
                                                          fontSize: "0.875rem",
                                                          border: '1px solid #6c757d'
                                                        }}
                                                      >
                                                        Cancel
                                                      </button>
                                                      <button 
                                                        className="btn btn-primary rounded-pill"
                                                        style={{ 
                                                          padding: "2px 12px", 
                                                          fontSize: "0.875rem" 
                                                        }}                                                      
                                                        onClick={() => {
                                                          const decodedUrn = decodeURIComponent(latestComment.parent_comment_id || "");
                                                          const match = decodedUrn.match(/,\s*(\d+)\)/);
                                                          const parentId = match ? match[1] : null;
                                                          const replyToId = parentId || latestComment.comment_id;
                                                          handlePostReply(replyToId);
                                                        }}
                                                      >
                                                        Reply
                                                      </button>
                                                    </div>                                                                                               
                                                  )
                                                )}                                     
                                                
                                              </div>
                                            </div>

                                            {/* <div className="my-2 d-flex justify-content-end align-items-center">
                                              <div className="d-flex gap-2">
                                                {replyingToComment && (
                                                  <button className="" onClick={() => setReplyingToComment(null)} > Cancel </button>
                                                )}
                                                <button className="reply-btn ">Reply </button>
                                              </div>
                                            </div> */}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                <Modal isOpen={commentPostModal} onRequestClose={() => {
                                    setCommentPostModal(false); 
                                    setEditingComment({ id: null, text: "" });
                                    setReplyingToComment(null);
                                    setReplyText('');
                                  }}
                                  shouldCloseOnOverlayClick={false}
                                  style={{
                                    content: {
                                      top: "50%", left: "50%", right: "auto", bottom: "auto",
                                      transform: "translate(-50%, -50%)", width: "80%", height: "80%", padding: "20px",
                                      borderRadius: "8px", backgroundColor: "white", scrollbarWidth: "none",
                                      boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", zIndex: 9999,
                                    },
                                    overlay: { backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 9998, },
                                  }}
                                >
                                  <div className="modal-content">
                                    <div className="modal-body">
                                      {selectCommentPost && (
                                        <>
                                          <div className="row">
                                            <div className="col-sm-6 col-md-12 col-xl-6"> </div>
                                            <div className="col-sm-6 col-md-12 col-xl-6">
                                              {selectPage ? (
                                                <div className="row">
                                                  <div className="col-2 col-md-2 col-xl-2 text-center">
                                                    <img src={selectPage.page_picture} width={40} alt="avtar"/>
                                                  </div>
                                                  <div className="col-5 col-md-5 col-xl-5 align-items-center">
                                                    <h6>{selectPage.pageName}</h6>
                                                    <small>
                                                      <i className="fa fa-calendar"></i>{" "}
                                                      {shortRelativeTime(selectCommentPost?.UserPost?.week_date)}
                                                    </small>
                                                  </div>
                                                  <div className="col-5 col-md-5 col-xl-5 align-items-center">
                                                    <div className="d-flex justify-content-end">
                                                      <div className="d-flex">
                                                        <button type="button" className="btn btn-danger close"                                                          
                                                          onClick={() => {
                                                              setCommentPostModal(false);
                                                              setReplyingToComment(null);
                                                              setReplyText('');
                                                          }}
                                                        >
                                                          <span>&times;</span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="row">
                                                  <div className="col-2 text-center">
                                                    <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} width={40} alt="avtar"/>
                                                  </div>
                                                  <div className="col-xxl-8 col-xl-8 align-items-center">
                                                    <h6>No page</h6>
                                                    <small>
                                                      <i className="fa fa-calendar"></i>{" "}
                                                      {shortRelativeTime(selectCommentPost?.UserPost?.week_date)}
                                                    </small>
                                                  </div>
                                                  <div className="col-xxl-2 col-xl-2 align-items-center">
                                                    <div className="d-flex justify-content-end">
                                                      <div className="d-flex">
                                                        <button type="button" className="btn btn-danger close" 
                                                            //onClick={() => setCommentPostModal(false)}
                                                            onClick={() => {
                                                              setCommentPostModal(false); 
                                                              setReplyingToComment(null);
                                                              setReplyText('');
                                                            }}
                                                        >
                                                          <span>&times;</span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            <div className="col-md-12 col-xl-6">
                                              <div className="modal-image">
                                                {(() => {
                                                  try {
                                                    if (typeof selectCommentPost.UserPost?.post_media === 'string') {
                                                      if (selectCommentPost.UserPost?.post_media.startsWith('https://')) {
                                                        return <img src={selectCommentPost.UserPost.post_media} alt="Post Media" className="post-image w-100"
                                                                onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                      } else {
                                                        return renderMediaPreview('linkedin', selectCommentPost.UserPost.post_media);
                                                      }
                                                    }
                                                  } catch (err) {
                                                    console.log("Post image rendering error: ",err);
                                                  }
                                                  return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image"
                                                          onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
                                                })()}
                                              </div>
                                            </div>
                                            <div className="col-md-12 col-xl-6">
                                              <div className="post-details">
                                                
                                                <div className="post-message mt-2">
                                                  {selectCommentPost?.UserPost?.content?.split(/\n+/) .filter(line => line.trim() !== "").map((line, lineIndex) => (
                                                      <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0" }}>
                                                          {line.split(/(#\w+)/g).map((part, partIndex) =>
                                                          part.startsWith("#") && part.length > 1 ? (
                                                              <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary" style={{ fontWeight: 500,marginRight:'5px' }} >
                                                                  {part}
                                                              </span>
                                                          ) : (
                                                              <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                                                          )
                                                          )}
                                                      </p>
                                                  ))}
                                                </div>
                                                <div className="stats mt-3">
                                                  <span className="me-3">
                                                    <i className="far fa-thumbs-up me-1"></i>
                                                    {selectCommentPost?.UserPost?.likes ?? 0}
                                                  </span>
                                                  <span className="me-3">
                                                    <i className="far fa-comment me-1"></i>
                                                    {totalComments}
                                                  </span>
                                                </div>
                                              </div>
                                              <hr />
                                              <h6>Comments ({totalComments})</h6>

                                              {commentPosts?.length > 0 && (
                                                <div className="commentBox"
                                                  style={{
                                                    height: totalComments > 2 ? "250px" : "80px",
                                                    overflowY: totalComments > 2 ? "auto" : "visible",
                                                    transition: "height 0.3s ease", // optional smooth animation
                                                  }}
                                                >
                                                  {topLevel.map((comment) =>
                                                    comment.post_id === selectCommentPost.post_id ? (
                                                      <div >
                                                        <div className="row mt-3" key={comment.comment_id}>
                                                          <div className="col-12 d-flex">
                                                            <div className="me-2">
                                                              {comment?.from_id && selectPage?.pageId &&
                                                              comment.from_id === selectPage.pageId ? (
                                                                <img src={`${selectPage?.page_picture}`}
                                                                  width={28} height={28} alt="reply-avatar" className="rounded-circle"/>
                                                              ) : (
                                                                <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`}
                                                                  width={28} height={28} alt="reply-avatar" className="rounded-circle"/>
                                                              )}
                                                            </div>
                                                            <div className="flex-grow-1">
                                                              <div className="bg-light p-2 rounded shadow-sm comment-item position-relative">
                                                                <h6 className="mb-1" style={{fontSize:"0.9rem",}}>
                                                                  {comment.from_name || "Linkedin User"}
                                                                </h6>
                                                                <p className="mb-0" style={{fontSize:"0.9rem",}}>
                                                                  {editingComment.id === comment.id ? (
                                                                    <>
                                                                      {commentLoading && comment.from_name === "Page Admin" ? (
                                                                        <div className="position-relative">
                                                                          <input type="text" className="form-control rounded-pill ps-3 pe-3"
                                                                            placeholder="Write a comment..." value={editingComment.text} readOnly
                                                                            style={{border:"none",}}/>
                                                                          <span className="text-primary"
                                                                            style={{ fontSize:"12px", cursor:"pointer",}}
                                                                            onClick={handleCancelEdit}>
                                                                            Cancel
                                                                          </span>
                                                                          <button
                                                                            className="btn btn-primary rounded-pill position-absolute"
                                                                            style={{
                                                                              right:"15px",
                                                                              top: "90%",
                                                                              transform:"translateY(-50%)",
                                                                              padding:"2px 12px",
                                                                              fontSize:"0.875rem",
                                                                            }}
                                                                          >
                                                                            <i className="fas fa-spin fa-spinner"></i>
                                                                          </button>
                                                                        </div>
                                                                      ) : (
                                                                        <div className="position-relative">
                                                                          <input
                                                                            type="text"
                                                                            className="form-control rounded-pill ps-3 pe-3"
                                                                            placeholder="Write a comment..."
                                                                            value={editingComment.text}
                                                                            onChange={(e) => setEditingComment({...editingComment, text: e.target.value,})}
                                                                            style={{ border:"none",}}
                                                                          />
                                                                          <button
                                                                            className="btn btn-primary rounded-pill position-absolute"
                                                                            style={{
                                                                              right:"15px",
                                                                              top: "90%",
                                                                              transform:"translateY(-50%)",
                                                                              padding:"2px 12px",
                                                                              fontSize:"0.875rem",
                                                                              display:editingComment.text? "block": "none",
                                                                            }}
                                                                            onClick={() => handleUpdateComment(comment.id)}
                                                                          >
                                                                            Update
                                                                          </button>
                                                                          <span
                                                                            className="text-primary"
                                                                            style={{
                                                                              fontSize: "12px",
                                                                              cursor: "pointer",
                                                                            }}
                                                                            onClick={handleCancelEdit}
                                                                          >
                                                                            Cancel
                                                                          </span>
                                                                        </div>
                                                                      )}
                                                                    </>
                                                                  ) : (
                                                                    comment.comment
                                                                  )}
                                                                </p>

                                                                {comment?.platform_page_Id && selectPage?.pageId && comment.platform_page_Id === selectPage.pageId &&
                                                                  comment.from_name === "Page Admin" ? (
                                                                  <Dropdown className="icon-dropdown ellipsis-icon position-absolute"
                                                                    style={{ top: "10px", right: "10px",}}>
                                                                    <Dropdown.Toggle variant="link" className="p-0">
                                                                      <i className="fa fa-solid fa-ellipsis-vertical text-dark"></i>
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu className="dropdown-menu-end">
                                                                      <Dropdown.Item
                                                                        onClick={() => setEditingComment({id: comment.id,text: comment.comment,})}
                                                                      >
                                                                        <i className="fas fa-pencil me-2"></i>{" "}
                                                                        Edit
                                                                      </Dropdown.Item>
                                                                      <Dropdown.Item
                                                                        onClick={() => {
                                                                          setCommentToDelete(comment);
                                                                          setDeleteCommentModal(true);
                                                                        }}
                                                                      >
                                                                        <i className="fas fa-trash me-2"></i>{" "}
                                                                        Delete
                                                                      </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                  </Dropdown>
                                                                ) : (
                                                                  <i className="fa fa-solid fa-ellipsis-vertical ellipsis-icon position-absolute text-dark"
                                                                    style={{
                                                                      top: "10px",
                                                                      right: "10px",
                                                                      cursor:"not-allowed",
                                                                    }}
                                                                  ></i>
                                                                )}
                                                              </div>
                                                              <div className="d-flex gap-3 mt-1 align-items-center">
                                                                <span className="text-muted small">
                                                                  {shortRelativeTime( comment.comment_created_time)}
                                                                </span>
                                                                <span>
                                                                  <i className={`far fa-thumbs-up me-1 ${ comment.reaction_like > 0 ? "text-primary" : ""}`}></i>
                                                                  <small>
                                                                    {comment.reaction_like || ""}
                                                                  </small>
                                                                </span>
                                                                <span className="text-primary small" style={{cursor: "pointer",}}
                                                                  //onClick={() => { setReplyingToComment(comment.id); }}
                                                                  onClick={() => { 
                                                                    setReplyingToComment(comment.id);
                                                                    setReplyText(''); 
                                                                  }}
                                                                >
                                                                  Reply
                                                                </span>
                                                              </div>

                                                              {/* Reply input for this comment */}
                                                              {replyingToComment === comment.id && 
                                                                (commentLoading  ? (
                                                                  <div className="d-flex">
                                                                    <div className="me-2 mt-2">
                                                                      <img src={`${selectPage?.page_picture}`} width={32} height={32} alt="avatar" className="rounded-circle"/>
                                                                    </div>
                                                                    <div className="flex-grow-1 position-relative">
                                                                      <input type="text" className="form-control rounded-pill ps-3 pe-5" placeholder="Write a reply..."
                                                                        value={replyText} style={{ height:"50px", border:"1px solid #ddd",}} readOnly/>
                                                                      <button className="btn btn-primary rounded-pill position-absolute"
                                                                        style={{
                                                                          right:"15px",
                                                                          top:"50%",
                                                                          transform:"translateY(-50%)",
                                                                          padding:"2px 12px",
                                                                          fontSize:"0.875rem",
                                                                        }}
                                                                      >
                                                                        <i className="fas fa-spin fa-spinner"></i>
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                ) : (
                                                                  <div className="d-flex">
                                                                    <div className="me-2 mt-2">
                                                                      <img
                                                                        src={`${selectPage?.page_picture}`}
                                                                        width={32}
                                                                        height={32}
                                                                        alt="avatar"
                                                                        className="rounded-circle"
                                                                      />
                                                                    </div>
                                                                    <div className="flex-grow-1 position-relative">
                                                                      <input 
                                                                        type="text" 
                                                                        className="form-control rounded-pill ps-3" 
                                                                        placeholder="Write a reply..."
                                                                        value={replyText} 
                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                        style={{ 
                                                                            height: "50px", 
                                                                            border: "1px solid #ddd",
                                                                            paddingRight: "140px" // Add space for buttons
                                                                        }}  
                                                                      /> 
                                                                      {replyText && (
                                                                        <div className="position-absolute" 
                                                                          style={{ 
                                                                            right: "15px", 
                                                                            top: "50%", 
                                                                            transform: "translateY(-50%)", 
                                                                            display: 'flex', 
                                                                            gap: '5px',
                                                                            alignItems: 'center'
                                                                          }}
                                                                        >
                                                                          <button
                                                                            className="btn btn-outline-secondary rounded-pill"
                                                                            onClick={() => {
                                                                                setReplyingToComment(null);
                                                                                setReplyText('');
                                                                            }}
                                                                            style={{ 
                                                                                padding: "2px 12px", 
                                                                                fontSize: "0.875rem",
                                                                                border: '1px solid #6c757d'
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>                                                                   
                                                                          <button className="btn btn-primary rounded-pill position-absolute"
                                                                            style={{
                                                                              right:"15px",
                                                                              top: "50%",
                                                                              transform:"translateY(-50%)",
                                                                              padding:"2px 12px",
                                                                              fontSize:"0.875rem",
                                                                              display: replyText? "block": "none",
                                                                            }}
                                                                            // onClick={() => handlePostReply(comment.id)}
                                                                            onClick={() => {
                                                                              const decodedUrn = decodeURIComponent(comment.parent_comment_id || "");
                                                                              const match = decodedUrn.match(/,\s*(\d+)\)/);
                                                                              const parentId = match ? match[1] : null;

                                                                              // Use parentId if available; else fallback to current comment ID
                                                                              const replyToId = parentId || comment.comment_id;

                                                                              handlePostReply(replyToId);
                                                                            }}
                                                                          >
                                                                            Reply
                                                                          </button>
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                ))}
                                                              {/* End Reply input for this comment */}
                                                            </div>
                                                          </div>
                                                          {repliesMap[comment.comment_id]?.map(reply => (
                                                            <div className="col-11 mt-2" key={reply.comment_id} style={{ marginLeft: "45px",}}>
                                                              <div className="d-flex mt-2">
                                                                <div className="me-2 mt-2">
                                                                  {reply?.platform_page_Id && selectPage?.pageId && reply.platform_page_Id === selectPage.pageId ? (
                                                                    <img src={`${selectPage?.page_picture}`} width={28}
                                                                      height={28} alt="reply-avatar" className="rounded-circle"/>
                                                                  ) : (
                                                                    <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`}
                                                                      width={28} height={28} alt="reply-avatar" className="rounded-circle"/>
                                                                  )}
                                                                </div>
                                                                <div className="flex-grow-1">
                                                                  <div className="bg-white p-2 rounded border comment-item position-relative">
                                                                    <h6 className="mb-1" style={{ fontSize: "0.85rem",}}>
                                                                      {reply.from_name || "Linkedin User"}
                                                                    </h6>
                                                                    <p className="mb-0" style={{fontSize:"0.85rem",}}>
                                                                      {editingComment.id === reply.id ? (
                                                                        <>
                                                                          {reply.from_name !== "Page Admin" ? (
                                                                            <div className="position-relative">
                                                                              <input type="text" className="form-control rounded-pill ps-3 pe-3"
                                                                                placeholder="Write a comment..."
                                                                                value={editingComment.text} readOnly
                                                                                style={{ border:"none",}}
                                                                              />
                                                                              <span className="text-primary"
                                                                                style={{
                                                                                  fontSize:"12px",
                                                                                  cursor:"pointer",
                                                                                }}
                                                                                onClick={ handleCancelEdit}>
                                                                                Cancel
                                                                              </span>
                                                                              <button className="btn btn-primary rounded-pill position-absolute"
                                                                                style={{
                                                                                  right:"15px",
                                                                                  top: "90%",
                                                                                  transform:"translateY(-50%)",
                                                                                  padding: "2px 12px",
                                                                                  fontSize:"0.875rem",
                                                                                }}
                                                                              >
                                                                                <i className="fas fa-spin fa-spinner"></i>
                                                                              </button>
                                                                            </div>
                                                                          ) : (
                                                                            <div className="position-relative">
                                                                              <input type="text" className="form-control rounded-pill ps-3 pe-3"
                                                                                placeholder="Write a comment..." value={ editingComment.text}
                                                                                onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value,})}
                                                                                style={{ border:"none",}}
                                                                              />
                                                                              <span className="text-primary"
                                                                                style={{
                                                                                  fontSize:"12px",
                                                                                  cursor:"pointer",
                                                                                }}
                                                                                onClick={ handleCancelEdit }>
                                                                                Cancel
                                                                              </span>
                                                                              <button className="btn btn-primary rounded-pill position-absolute"
                                                                                style={{
                                                                                  right:"15px",
                                                                                  top: "90%",
                                                                                  transform:"translateY(-50%)",
                                                                                  padding:"2px 12px",
                                                                                  fontSize:"0.875rem",
                                                                                  display: editingComment.text? "block" : "none",
                                                                                }}
                                                                                onClick={() => handleUpdateComment(reply.id)}
                                                                              > Update </button>
                                                                            </div>
                                                                          )}
                                                                        </>
                                                                      ) : (
                                                                        reply.comment
                                                                      )}
                                                                    </p>

                                                                    {reply?.platform_page_Id && selectPage?.pageId && reply.platform_page_Id === selectPage.pageId
                                                                      && reply.from_name === "Page Admin"? (
                                                                      <Dropdown className="icon-dropdown ellipsis-icon position-absolute" style={{ top: "10px", right:"10px",}}>
                                                                        <Dropdown.Toggle variant="link" className="p-0">
                                                                          <i className="fa fa-solid fa-ellipsis-vertical text-dark"></i>
                                                                        </Dropdown.Toggle>
                                                                        <Dropdown.Menu className="dropdown-menu-end">
                                                                          <Dropdown.Item onClick={() => setEditingComment( {id: reply.id,text: reply.comment,} )}>
                                                                            <i className="fas fa-pencil me-2"></i>{" "}
                                                                            Edit
                                                                          </Dropdown.Item>
                                                                          <Dropdown.Item
                                                                            onClick={() => {
                                                                              setCommentToDelete(reply);
                                                                              setDeleteCommentModal(true);
                                                                            }}
                                                                          >
                                                                            <i className="fas fa-trash me-2"></i>{" "}
                                                                            Delete
                                                                          </Dropdown.Item>
                                                                        </Dropdown.Menu>
                                                                      </Dropdown>
                                                                    ) : (
                                                                      <i className="fa fa-solid fa-ellipsis-vertical ellipsis-icon position-absolute text-dark"
                                                                        style={{ top: "10px", right:"10px", cursor:"not-allowed",}}
                                                                      ></i>
                                                                    )}
                                                                  </div>
                                                                  <div className="d-flex gap-3 mt-1 align-items-center">
                                                                    <span className="text-muted small">
                                                                      {shortRelativeTime(reply.comment_created_time)}
                                                                    </span>
                                                                    <span>
                                                                      <i className={`far fa-thumbs-up me-1 ${reply.reaction_like? "text-primary" : ""}`}></i>
                                                                      <small>
                                                                        {reply.reaction_like ||""}
                                                                      </small>
                                                                    </span>
                                                                    <span className="text-primary small" style={{ cursor:"pointer",}}
                                                                      onClick={() => { setReplyingToComment(reply.id); }}>
                                                                      Reply
                                                                    </span>
                                                                  </div>
                                                                  {/* Reply input for this reply */}
                                                                  {replyingToComment === reply.id && (
                                                                    <div className="d-flex mt-3">
                                                                      <div className="me-2">
                                                                        <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`}
                                                                          width={28} height={28} alt="avatar" className="rounded-circle"/>
                                                                      </div>
                                                                      <div className="flex-grow-1 position-relative">
                                                                        <input type="text" className="form-control rounded-pill ps-3 pe-5"
                                                                          placeholder="Write a reply..." value={replyText}
                                                                          onChange={(e) => setReplyText(e.target.value)}
                                                                          style={{
                                                                            height:"50px",
                                                                            border:"1px solid #ddd",
                                                                          }}
                                                                        />
                                                                        <button className="btn btn-primary rounded-pill position-absolute"
                                                                          style={{
                                                                            right:"15px",
                                                                            top: "50%",
                                                                            transform:"translateY(-50%)",
                                                                            padding:"2px 12px",
                                                                            fontSize:"0.875rem",
                                                                            display: replyText? "block" : "none",
                                                                          }}
                                                                          // onClick={() => handlePostReply(reply.id) }
                                                                          onClick={() => {
                                                                            const decodedUrn = decodeURIComponent(reply.parent_comment_id || "");
                                                                            const match = decodedUrn.match(/,\s*(\d+)\)/);
                                                                            const parentId = match ? match[1] : null;

                                                                            // Use parentId if available; else fallback to current comment ID
                                                                            const replyToId = parentId || reply.comment_id;

                                                                            handlePostReply(replyToId);
                                                                          }}
                                                                        >
                                                                          Reply
                                                                        </button>
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                  {/* End Reply input for this reply */}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    ) : null
                                                  )}
                                                </div>
                                              )}

                                              {!commentPosts?.length && (
                                                <p className="text-muted">
                                                  No comments yet
                                                </p>
                                              )}
                                              <hr />
                                              {commentLoading ? (
                                                <>
                                                  <div className="flex-grow-1 position-relative mt-3">
                                                    <input
                                                      type="text"
                                                      className="form-control rounded-pill ps-3 pe-5"
                                                      placeholder="Write a comment..."
                                                      value={commentText}
                                                      style={{
                                                        height: "50px",
                                                        borderRadius: "20px",
                                                        backgroundColor: "#f0f2f5",
                                                        border: "none",
                                                      }}
                                                      readOnly
                                                    />
                                                    <button type="submit" className="btn btn-primary rounded-pill position-absolute"
                                                      style={{
                                                        right: "5px",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        padding: "2px 12px",
                                                        fontSize: "0.875rem",
                                                        display: commentText? "block" : "none",
                                                      }}
                                                    >
                                                      <i className="fas fa-spin fa-spinner"></i>{" "}
                                                      Comment
                                                    </button>
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <div className="flex-grow-1 position-relative mt-3">
                                                    <input
                                                      type="text"
                                                      className="form-control rounded-pill ps-3 pe-5"
                                                      placeholder="Write a comment..."
                                                      value={commentText}
                                                      onChange={(e) =>
                                                        setCommentText(e.target.value)
                                                      }
                                                      style={{
                                                        height: "50px",
                                                        borderRadius: "20px",
                                                        backgroundColor: "#f0f2f5",
                                                        border: "none",
                                                      }}
                                                    />
                                                    <button
                                                      type="submit"
                                                      className="btn btn-primary rounded-pill position-absolute"
                                                      style={{
                                                        right: "5px",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        padding: "2px 12px",
                                                        fontSize: "0.875rem",
                                                        display: commentText? "block": "none",
                                                      }}
                                                      disabled={!commentText.trim()}
                                                      onClick={() => {
                                                        submitComment(selectCommentPost);
                                                      }}
                                                    >
                                                      Comment
                                                    </button>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </Modal>
                              </>
                            ) : (
                              <div className="row">
                                <div className="col-md-12">
                                  <p className="text-center text-danger">
                                    🤔 No comments to show yet!! 🧐
                                  </p>
                                </div>
                                {/* <div className="col-md-2 d-flex justify-content-end">
                                  <button className="btn btn-primary w-auto" onClick={() => { PagePostsComments("getPostsComments"); }}>
                                    <i className="fas fa-redo fa-spin"></i>{" "}Sync
                                  </button>
                                </div> */}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`tab-pane fade ${activeTab === 'Calendar' ? "show active" : ""}`} id="Calendar" role="tabpanel" aria-labelledby="Calendar-tab">
                        <div className="row">
                          <div className="col-md-12">
                            <div className="card">
                              <div className="card-header card-no-border">
                                <div className="header-top">
                                  <h5>Scheduled Post</h5>
                                </div>
                              </div>
                              <div className="card-body">
                                <div className="sidebar-body">
                                  <div className="row g-3 common-form">
                                    <div style={{ height: "105vh" }}>
                                      <Calendar
                                        localizer={localizer}
                                        events={posts}
                                        startAccessor="start"
                                        endAccessor="end"
                                        onSelectEvent={handleSelectEvent}
                                        eventPropGetter={eventStyleGetter}
                                        popup={true}
                                        components={{
                                            event:CustomEvent,
                                            agenda: {
                                              event: AgendaEvent,
                                            },
                                        }}
                                        views={["month", "agenda"]}
                                      />
                                    </div>
                                  </div>
                                </div>
                                {/* calendar post selected */}
                                {selectedEvent && (
                                  <div className="row">
                                    <div className="col-sm-8" style={{ margin: "0 auto" }} >
                                      <Modal isOpen={isModalOpen} onRequestClose={handleCloseModal} shouldCloseOnOverlayClick={false} contentLabel="Event Details"
                                        ariaHideApp={false} style={{
                                          content: { top: "50%", left: "50%", right: "auto", bottom: "auto", transform: "translate(-50%, -50%)",
                                            width: "40%", height: "60%", padding: "20px", borderRadius: "8px", backgroundColor: "white",
                                            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", zIndex: 9999, overflowY: "auto", scrollbarWidth: "none" },
                                          overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9998 },
                                        }}
                                      >
                                        <div className="modal-content">
                                          <div className="modal-body">
                                            {selectPage ? (
                                              <div className="d-flex align-items-center justify-content-between w-100">
                                                <div className="preview-header">
                                                  <img src={selectPage.page_picture} className="profile-pic-popup img-fluid" alt={selectPage.postPageName} />
                                                  <div className="profile-info">
                                                    <strong> {selectPage.pageName} </strong>
                                                    <small className="text-info">
                                                      Scheduled on:{" "}
                                                      {moment(selectedEvent.start).format( "D MMMM YYYY [at] h:mm A" )}
                                                    </small>
                                                  </div>
                                                </div>
                                                <div className="d-flex justify-content-end">
                                                  <div className="d-flex" style={{ paddingRight: 10 }} >
                                                    <div className="dropdown hideArrow">
                                                      <button className="btn btn-outline-dark dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                                        <i className="fa fa-ellipsis-h"></i>
                                                      </button>
                                                      <ul className="dropdown-menu">
                                                        <li>
                                                          <span className="dropdown-item" onClick={() => {handleEdit(selectedEvent.form_id)} } >
                                                            <i className="fa fa-pencil"></i>{" "}Edit Post
                                                          </span>
                                                        </li>
                                                        <li style={{ cursor: "pointer" }} >
                                                          <span className="dropdown-item"
                                                            onClick={() => {
                                                              setPostToDelete(selectedEvent.postData);
                                                              setShowDeleteModal(true);
                                                            }}
                                                          >
                                                            <i className="fa fa-trash"></i>{" "}
                                                            Delete Post
                                                          </span>
                                                        </li>
                                                      </ul>
                                                    </div>
                                                  </div>
                                                  <div className="d-flex">
                                                    <button className="btn btn-outline-danger" onClick={handleCloseModal} >
                                                      <i className="fa fa-close"></i>
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="row"></div>
                                            )}
                                            <div className="row">
                                              <div className="post-content">
                                                <div style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                                  {selectedEvent?.content?.split(/\n+/).filter(line => line.trim() !== "").map((line, lineIndex) => (
                                                      <p key={`line-${lineIndex}`} style={{ margin: "0 0 8px 0" }}>
                                                        {line.split(/(#\w+)/g).map((part, partIndex) =>
                                                          part.startsWith("#") && part.length > 1 ? (
                                                            <span key={`tag-${lineIndex}-${partIndex}`} className="text-primary" style={{ fontWeight: 500 }} >
                                                              {part}
                                                            </span>
                                                          ) : (
                                                            <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>
                                                          )
                                                        )}
                                                      </p>
                                                    ))}
                                                </div>
                                              </div>
                                              {(() => {
                                                try {
                                                  if (typeof selectedEvent.postMedia === 'string') {
                                                    if (selectedEvent.postMedia.startsWith('https://')) {
                                                      return <img src={selectedEvent.postMedia} alt="Post Media" className="post-image" 
                                                              onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                                    } else {
                                                      return renderMediaPreview(selectedEvent.platform, selectedEvent.postMedia);
                                                    }
                                                  }
                                                } catch (err) {
                                                  console.log("Post image rendering error: ",err);
                                                }
                                                return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image" 
                                                        onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
                                              })()}
                                              <div className="linkedin-footer">
                                                <div className="d-flex justify-content-between align-items-center">
                                                  <span className="likes"><i className="far fa-thumbs-up"></i> Likes</span>
                                                  <span className="comments"><i className="far fa-comment"></i> Comments</span>
                                                  <span className="repost"><i className="fas fa-share-square"></i> Reposts</span>
                                                  <span className="send"><i className="fas fa-paper-plane"></i> Shares</span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                          </div>
                                        </div>
                                      </Modal>
                                    </div>
                                  </div>
                                )}
                                {/* end calendar post selected */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>          
        </div>

        {/* post view modal */}
        {viewModal && (
          <div className="row">
            <div className="col-sm-8" style={{ margin: "0 auto" }}>
                <Modal isOpen={viewModal} onRequestClose={() => setViewModal(false)} shouldCloseOnOverlayClick={false}
                  style={{
                    content: {
                      top: "50%", left: "50%", right: "auto", bottom: "auto", transform: "translate(-50%, -50%)",
                      width: "40%", height: "80%", padding: "20px", borderRadius: "8px", backgroundColor: "white",
                      boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)", zIndex: 9999, overflowY: "auto", scrollbarWidth: "none",
                    },
                    overlay: {
                      backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark background overlay
                      zIndex: 9998, // Ensure the overlay is below the modal
                    },
                  }}
                >
                  <div className="modal-content">
                    <div className="modal-body">
                      {selectPage ? (
                        <div className="d-flex align-items-center justify-content-between w-100">
                          <div className="preview-header">
                            <div style={{ position: 'relative', display: 'inline-block', marginRight: 10 }}>
                              <img src={selectPage.page_picture} className="profile-pic-popup img-fluid" alt={selectPage.postPageName} />
                              <div title={"linkedin"} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '25px', height: '25px', borderRadius: '50%',
                                  background: getPlatformColor("linkedin"), display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                  boxShadow: '0 0 2px rgba(0,0,0,0.3)', padding: "5px" }} >
                                {platformSVGs["linkedin"] || (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-6 w-6 text-white" >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                                    <path d="M2 12h20" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="profile-info">
                              <strong>{selectPage.pageName}</strong>
                              <span>
                                {postView.status === "0" ? (
                                  <span className="text-danger">
                                    Last Updated At:{" "}
                                    {moment(postView.updatedAt).format( "D MMMM YYYY [at] h:mm A" )}
                                  </span>
                                ) : postView.status === "2" ? (
                                  <span className="text-info">
                                    Scheduled on:{" "}
                                    {moment.unix(postView.schedule_time).format("D MMMM YYYY [at] h:mm A")}
                                  </span>
                                ) : 
                                  <span className="text-success">
                                    Published on:{" "}
                                    {moment(postView.week_date).format("D MMMM YYYY")}
                                  </span>
                                }
                                
                              </span>
                            </div>
                          </div>
                          <div>
                            <button className="btn btn-outline-danger" onClick={() => setViewModal(false)} >
                              <i className="fa fa-close"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                          <div className="row"></div>
                      )}
                      <div className="row">
                          <div className="row">
                            {postView.content.split(/\n{1,2}/).map((paragraph, i) => {
                              if (i === 0) {
                                return (
                                  <div key={i} className="main-text" style={{ whiteSpace: 'pre-line' }}>
                                    {paragraph}
                                  </div>
                                );
                              }
                              return (
                                <div key={i} className="hashtags mt-2">
                                  {paragraph.split(/(\s+)/).map((part, idx) =>
                                    part.startsWith('#') ? (
                                      <span key={idx} className="text-primary me-1" style={{ fontSize: 14 }} >
                                        {part}
                                      </span>
                                    ) : (
                                      part
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {(() => {
                            try {
                              if (typeof postView.post_media === 'string') {
                                if (postView.post_media.startsWith('https://')) {
                                  return <img src={postView.post_media} alt="Post Media" className="post-image" 
                                          onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }} />;
                                } else {
                                  return renderMediaPreview(postView.post_platform, postView.post_media);
                                }
                              }
                            } catch (err) {
                              console.log("Post image rendering error: ",err);
                            }
                            return <img src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt="Default" className="post-image" 
                                    onError={(e) => { e.target.src = `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`; }}/>;
                          })()}
                          <div className="linkedin-footer">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="likes"><i className="far fa-thumbs-up"></i> Likes</span>
                              <span className="comments"><i className="far fa-comment"></i> Comments</span>
                              <span className="repost"><i className="fas fa-share-square"></i> Reposts</span>
                              <span className="send"><i className="fas fa-paper-plane"></i> Shares</span>
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </Modal>
            </div>
          </div>
        )}
        {/* end post view modal */}
        {/* post delete confirmation modal */}
        {showDeleteModal && (
          <div className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div className="modal-content" style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", maxWidth: "450px" }} >
              <h5>Confirm Delete</h5>
              <hr />
              <p> Are you sure you want to delete ? " <strong> {postToDelete?.content.split(" ").slice(0, 3).join(" ") +
                    (postToDelete?.content.split(" ").length > 3 ? "..." : "")} </strong>" </p>
              {loading ? (
                <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }} >
                  <button className="btn btn-danger" disabled>
                    <i className="fas fa-spin fa-spinner"></i> Deleting
                  </button>
                </div>
              ) : (
                <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }} >
                  <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}> Cancel </button>
                  <button className="btn btn-danger" onClick={handleDelete}> Delete </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* end post delete confirmation modal */}
        {/* Add this modal component at the end of your JSX (before Footer) */}
        {deleteCommentModal && (
          <div className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div className="modal-content" style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", maxWidth: "450px" }} >
              <h5>Confirm Delete</h5>
              <hr />
              <p> Are you sure you want to delete <span style={{fontWeight: "bold"}}>"{commentToDelete.comment}"</span> comment?</p>
              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", }} >
                {loading ? (
                  <>
                    <button className="btn btn-secondary" disabled> Cancel </button>
                    <button className="btn btn-danger" disabled>
                      <i className="fas fa-spin fa-spinner"></i> Deleting...
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => setDeleteCommentModal(false)}> Cancel </button>
                    <button className="btn btn-danger"
                      onClick={async () => {
                        await handleDeleteComment(commentToDelete.id);
                        setDeleteCommentModal(false);
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* End this modal component at the end of your JSX (before Footer) */}

        {/* delete selected comments modal */}
        {deleteMultipleCommentsModel && (
            <div className="modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div className="modal-content" style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    maxWidth: '450px'
                }}>
                    <h5>Confirm Delete</h5>
                    <hr />
                    <p className='mb-2'>Are you sure you want to delete selected comments?</p>
                    {loading ? (
                        <div className="modal-actions" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '20px'
                        }}>
                            <button className="btn btn-danger" disabled>
                                <i className="fas fa-spin fa-spinner"></i> Deleting
                            </button>
                        </div>
                    ) : (
                        <div className="modal-actions" style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '20px'
                        }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setDeleteMultipleCommentsModel(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={deleteSelectedComments}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
        {/* end delete selected comments modal */}

        <Footer />
      </div>
    </div>
  );
}
