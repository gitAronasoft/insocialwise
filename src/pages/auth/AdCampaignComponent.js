import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import CreateAdsCampaign from './components/CreateAdsCampaign';
import AccountNotConnectedComponent from './components/AccountNotConnectedComponent';
import DateRangePickerComponent from "./components/DateRangePickerComponent";
import { getCustomStaticRanges } from "./utils/dateRanges";
import { format, subDays, set } from "date-fns";
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import EditCampaignData from './components/EditCampaignData';

export default function AdCampaignComponent() {
    ModuleRegistry.registerModules([AllCommunityModule]);
    const [connectedAccount, setIsConnectedAccount] = useState(null);
    const [showCreateAdsModal, setShowCreateAdsModal] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const dropdownRef = useRef(null);
    const dropdownAdRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [showPlatformList, setShowPlatformsList] = useState(false);
    const [showAdPlatformList, setShowAdPlatformsList] = useState(false);
    const [selectedPlatform, setSelectPlatform] = useState(null);
    const [selectedAdPlatform, setSelectAdPlatform] = useState(null);
    const [campaigns, setCampaigns] = useState(null);

    const [connectedAccountInfo, setIsConnectedAccountInfo] = useState([]);
    const [showDatePickerCalendar, setShowDatePickerCalendar] = useState(false);
    const [selectedRange, setSelectedRange] = useState({
        startDate: subDays(new Date(), 7),
        endDate: subDays(new Date(), 1),
        key: "selection",
    });

    const [actionMenu, setActionMenu] = useState({ visible: false, x: 0, y: 0, data: null });
    const currentOrigin = window.location.origin;
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [showDanger, setShowDanger] = useState(false);

    const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
    const [showEditCampaignData, setShowEditCampaignData] = useState(null);
    
    const [campaignDataDeleteModal, setCampaignDataDeleteModal] = useState(false);
    const [campaignDataToDelete, setcampaignDataToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [loadingRowId, setLoadingRowId] = useState(null);

    useEffect(() => {
        fetchAdsAccounts();
    }, []);

    useEffect(() => {
        //console.log('Updated connectedAccountInfo:', connectedAccountInfo);
    }, [connectedAccount]);

    const fetchAdsAccounts = async () => {
        const storedToken = localStorage.getItem('authToken');
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const social_user_platform = 'facebook';
        try {
            const fetchAdsAccounts = await fetch(`${BACKEND_URL}/api/adsAccounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ platform: social_user_platform })
            });
            const response = await fetchAdsAccounts.json();
            if (response.socialData && response.socialData.length > 0) {
                const defaultPlatform = response.socialData[0];
                setIsConnectedAccount(response.socialData);
                setSelectPlatform(response.socialData[0]);

                // Automatically select the first connected ad account
                const defaultAdAccount = defaultPlatform.AdsAccounts?.find(ad => ad.isConnected === 'Connected');
                if (defaultAdAccount) {
                    setSelectAdPlatform(defaultAdAccount);
                    fetchCampaigns(defaultAdAccount);
                } else {
                    console.warn("No connected ad account found for the default platform.");
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const fetchCampaigns = (adData) => {
        setLoading(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const storedToken = localStorage.getItem('authToken');
        try {
            fetch(`${BACKEND_URL}/api/get-campaigns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + storedToken
                },
                body: JSON.stringify({ adData: adData }),
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    setLoading(false);
                    setCampaigns(data.campaigns);
                })
                .catch((error) => {
                    console.error('Fetch error:', error);
                    setLoading(false);
                });
        } catch (err) {
            console.log("Something went wrong :- ", err);
            setLoading(false);
        }
    }

    const handleToggleStatus = async (row, newStatus) => {
        //console.log(`Toggling status of ${row.campaign_name} to ${newStatus}`);
        const rowID = row.id;
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');        
        const payload = {
            dataID: row.id,
            socialUserid: row.account_social_userid,
            platform: 'facebook',
            campaignID: row.campaign_id,
            newStatus
        };
        try {
            setLoadingRowId(rowID);
            const response = await fetch(`${BACKEND_URL}/api/campaign/updateStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if(data.success === true) {
                setLoadingRowId(null);
                return data.success === true;
            } else if(data.success === false){
                setLoadingRowId(null);
                toast.error(`${data.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }  
        } catch (err) {
            //console.error("Network error while updating status:", err);
            setLoadingRowId(null);
            toast.error(`Network error while updating status`, {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });
            return false;
        }        
    };

    const handleView = (row) => {
        const campaignId = row.campaign_id;
        const socialUserId = row.account_social_userid;
        navigate(`/ads-campaign-detail?asset_id=${campaignId}&ref=${socialUserId}`);
    };

    const handleEditCloseModal = () => {
        setShowEditCampaignModal(false);
        setShowEditCampaignModal(null);
    };

    const handleEdit = (row) => {
        //console.log('Edit campaign clicked:', row);
        setShowEditCampaignData(row);
        setShowEditCampaignModal(true);
        // You can pass the row data to the modal if needed
    }

    const handleDelete = (row) => {
        //console.log('Delete campaign:', row);
        setcampaignDataToDelete(row);
        setCampaignDataDeleteModal(true);        
    }

    const openActionMenu = (params) => {
        const { clientX, clientY } = window.event;
        setActionMenu({
            visible: true,
            x: clientX,
            y: clientY,
            data: params.data
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

    const campaignColumns = [
        {
            headerName: 'Campaign Name',
            field: 'campaign_name',
            filter: false,
            pinned: 'left',
            width: 220,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <img className="user-avatar" alt={params.value} style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        src={params.data.campaign_image || `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`;
                        }}
                    />
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            <Link to={{ pathname: '/ads-campaign-detail', search: `?asset_id=${params.data.campaign_id}&ref=${params.data.account_social_userid}` }}>
                                <strong><small className="text-dark">{params.value}</small></strong>
                            </Link>
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            <span>
                                {
                                    params.data.campaign_objective === 'OUTCOME_TRAFFIC' ? 'Traffic' :
                                        params.data.campaign_objective === 'OUTCOME_LEADS' ? 'Leads' :
                                            params.data.campaign_objective === 'OUTCOME_ENGAGEMENT' ? 'Engagements' :
                                                params.data.campaign_objective === 'OUTCOME_AWARENESS' ? 'Awareness' :
                                                    params.data.campaign_objective === 'OUTCOME_APP_PROMOTION' ? 'App Promotion' :
                                                        params.data.campaign_objective === 'OUTCOME_MESSAGES' ? 'Messages' :
                                                            params.data.campaign_result_type !== null ? params.data.campaign_result_type : 'Sales'
                                }
                            </span>
                            <span className="px-1">·</span>
                            <span>{params.data.ads_count} {params.data.ads_count > 1 ? 'ads' : 'ad'}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Status',
            field: 'campaign_effective_status',
            filter: false,
            sort: 'asc',
            width: 150,
            cellRenderer: (params) => {
                const isLoading = loadingRowId === params.data.id;
                return (
                    <div className="d-flex align-items-center justify-content-center my-2">                               
                        {isLoading ? (
                            <>
                                <i className="fas fa-spin fa-spinner" style={{ fontSize: '15px',marginRight:'5px' }}></i> wait... 
                            </>
                        ) : (
                            <div className="form-check form-switch d-flex align-items-center justify-content-center">
                                <input className="form-check-input" type="checkbox" role="switch" id={`status-switch-${params.data.id}`}
                                    checked={params.value === 'ACTIVE'}
                                    onChange={async (e) => {
                                        e.stopPropagation(); // prevent grid row selection
                                        const newStatus = e.target.checked ? 'ACTIVE' : 'PAUSED';
                                        // ⏳ WAIT FOR API RESPONSE
                                        const success = await handleToggleStatus(params.data, newStatus);
                                        if (!success) {                                    
                                            params.api.refreshCells({
                                                rowNodes: [params.node],
                                                force: true
                                            });
                                            return;
                                        }

                                        // ✅ API SUCCESS — update AG-Grid row
                                        params.api.applyTransaction({
                                            update: [{
                                                ...params.data,
                                                campaign_effective_status: newStatus
                                            }]
                                        });                                
                                    }}
                                />
                                <label className="form-check-label ms-2 my-auto" htmlFor={`status-switch-${params.data.id}`} style={{ fontSize: '0.8rem', lineHeight: '1.2' }} >
                                    <span className={`badge ${params.value === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                        {params.value === 'ACTIVE' ? 'Active' : 'Paused'}
                                    </span>
                                </label>
                            </div>
                        )}
                        {params.value === 'COMPLETED' &&
                            <span className="text-success" style={{ lineHeight: '1.2', width: '100%', textAlign: 'center' }}>✔ Completed</span>
                        }
                    </div>
                );
            }
        },
        {
            headerName: 'Start Date',
            field: 'campaign_start_time',
            filter: false,
            valueFormatter: (params) => {
                if (!params.value) return '-';
                const timeZone = selectedAdPlatform.timezone;
                const date = new Date(params.value);
                return new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone,
                    timeZoneName: 'short'
                }).format(date);
            }
        },
        {
            headerName: 'End Date',
            field: 'campaign_end_time',
            filter: false,
            valueFormatter: (params) => {
                if (!params.value) return '-';
                const timeZone = selectedAdPlatform.timezone;
                const date = new Date(params.value);
                return new Intl.DateTimeFormat('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone,
                    timeZoneName: 'short'
                }).format(date);
            }
        },
        {
            headerName: 'Main Result',
            field: 'campaign_insights_results',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {params.value}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {params.data.campaign_result_type != null ? (
                                <span>
                                    {
                                        params.data.campaign_result_type === 'lead' ? 'On Facebook Leads' :
                                            params.data.campaign_result_type === 'link_click' ? 'Links Clicked' : `${params.data.campaign_result_type}`
                                    }
                                </span>
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Cost Per Result',
            field: 'campaign_insights_cost_per_result',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {params.data.campaign_result_type != null ? (
                                <span>
                                    {
                                        params.data.campaign_result_type === 'lead' ? 'per on Facebook Leads' :
                                            params.data.campaign_result_type === 'link_click' ? 'per links clicks' : `${params.data.campaign_result_type}`
                                    }
                                </span>
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Budget',
            field: 'campaign_lifetime_budget',
            filter: false,
            valueGetter: (params) => {
                const budgetNotNull = params.data.campaign_lifetime_budget != null;
                return budgetNotNull
                    ? params.data.campaign_lifetime_budget || 0
                    : params.data.campaign_daily_budget || 0;
            },
            // valueFormatter: (params) => `₹${Number(params.value).toLocaleString()}`,
            width: 120,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {params.data.campaign_lifetime_budget != null || params.data.campaign_daily_budget != null ? (
                                <span>
                                    {
                                        params.data.campaign_lifetime_budget > 0 || params.data.campaign_lifetime_budget != null ? 'Lifetime' :
                                            params.data.campaign_daily_budget > 0 || params.data.campaign_daily_budget != null ? 'Daily' : `${params.data.campaign_daily_budget}`
                                    }
                                </span>
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Amount Spent',
            field: 'campaign_insights_spend',
            filter: false,
            cellRenderer: (params) => {
                const currencySymbol = selectedAdPlatform?.currency === 'INR' ? '₹ ' : '$ ';
                const spend = Number(params.value) || 0;

                const dailyBudget = Number(params.data.campaign_daily_budget) || 0;
                const lifetimeBudget = Number(params.data.campaign_lifetime_budget) || 0;

                const totalBudget = lifetimeBudget > 0 ? lifetimeBudget : dailyBudget;
                const percentSpent = totalBudget > 0 ? Math.min((spend / totalBudget) * 100, 100) : 0;

                return (
                    <div className="d-flex flex-column justify-content-center" style={{ width: '100%', lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-1">
                            {currencySymbol}{spend.toLocaleString()}
                        </div>
                        <div className="progress" style={{ height: '6px', width: '100%' }}>
                            <div
                                className="progress-bar bg-warning"
                                role="progressbar"
                                style={{ width: `${percentSpent.toFixed(1)}%` }}
                                aria-valuenow={percentSpent}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            ></div>
                        </div>
                        {lifetimeBudget > 0 ?
                            <small className="text-muted my-1">{percentSpent.toFixed(1)}% of total budget</small> :
                            <small className="text-muted my-1">{percentSpent.toFixed(1)}% of budget (estimated)</small>
                        }
                    </div>
                );
            }
        },
        {
            headerName: 'CPP',
            field: 'campaign_insights_cpp',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toFixed(2).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'CPM',
            field: 'campaign_insights_cpm',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toFixed(2).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'CTR',
            field: 'campaign_insights_ctr',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toFixed(2).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'CPC',
            field: 'campaign_insights_cpc',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toFixed(2).toLocaleString()} %`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Reach',
            field: 'campaign_insights_reach',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Impressions',
            field: 'campaign_insights_impressions',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Page Engagements',
            field: 'campaign_insights_actions',
            filter: false,
            // width: 100,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.campaign_insights_actions || '[]');
                    const commentObj = actions.find(a => a.action_type === 'page_engagement');
                    return commentObj?.value || 0;
                } catch (e) {
                    return 0;
                }
            },
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Post Engagements',
            field: 'campaign_insights_actions',
            filter: false,
            // width: 100,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.campaign_insights_actions || '[]');
                    const commentObj = actions.find(a => a.action_type === 'post_engagement');
                    return commentObj?.value || 0;
                } catch (e) {
                    return 0;
                }
            },
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Click (ALL)',
            field: 'campaign_insights_clicks',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Reactions',
            field: 'campaign_insights_actions',
            filter: false,
            // width: 100,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.campaign_insights_actions || '[]');
                    const commentObj = actions.find(a => a.action_type === 'post_reaction');
                    return commentObj?.value || 0;
                } catch (e) {
                    return 0;
                }
            },
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Comments',
            field: 'campaign_insights_actions',
            filter: false,
            // width: 100,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.campaign_insights_actions || '[]');
                    const commentObj = actions.find(a => a.action_type === 'comment');
                    return commentObj?.value || 0;
                } catch (e) {
                    return 0;
                }
            },
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Action',
            pinned: 'right',
            selectable: false,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="action-button-wrapper"
                    onClick={(e) => {
                        e.stopPropagation();
                        openActionMenu(params); // Custom handler
                    }}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f1f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <i className="fas fa-ellipsis-h text-secondary" />
                </div>
            ),
            width: 100
        }

    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowPlatformsList(false);
            }
            if (dropdownAdRef.current && !dropdownAdRef.current.contains(event.target)) {
                setShowAdPlatformsList(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowPlatformsList(false);
                setShowAdPlatformsList(false);
                setShowDatePickerCalendar(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const formatCurrency = (amount, currencyCode = 'USD') => {
        const locale = navigator.language || 'en-IN'; // dynamic locale from browser
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const percentSpent = selectedAdPlatform?.spend_cap || selectedAdPlatform?.spend_cap > 0
        ? (parseFloat(selectedAdPlatform.amount_spent || 0) / parseFloat(selectedAdPlatform.spend_cap)) * 100
        : 0;

    useEffect(() => {
        const timer = setTimeout(() => {
            if (selectedAdPlatform) {
                const spent = parseFloat(selectedAdPlatform.amount_spent || 0);
                const cap = parseFloat(selectedAdPlatform.spend_cap || 0);

                if (cap > 0) {
                    const percent = (spent / cap) * 100;

                    setShowWarning(percent >= 80 && percent < 100);
                    setShowDanger(percent >= 100);
                } else {
                    setShowWarning(false);
                    setShowDanger(false);
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [selectedAdPlatform]);

    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        setDeleting(true);
        //console.log('campaignDataToDelete', campaignDataToDelete);
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');
        try {
            const payload = {                
                ids: campaignDataToDelete.id,
                socialUserid:campaignDataToDelete.account_social_userid,
                accountid: campaignDataToDelete.ad_account_id,
                campaign: campaignDataToDelete.campaign_id
            };

            const responseData = await fetch(`${BACKEND_URL}/api/campaign-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(payload)
            });

            const response = await responseData.json();
            if(response.success===true){
                // ✅ Remove the deleted campaign from the list
                setCampaigns((prevCampaigns) => {
                    if (!prevCampaigns) return [];
                        return prevCampaigns.filter(
                        (campaign) => campaign.campaign_id !== campaignDataToDelete.campaign_id
                    );
                });
                setDeleting(false);
                setCampaignDataDeleteModal(false);
            } else if(response.success===false){
                setDeleting(false);
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else {
                setDeleting(false);
                toast.error(`Internal server error.`, {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        } catch (err) {
            console.error("Deletion failed:", err);
            setDeleting(false);            
            toast.error(`Failed to delete campaign.`, {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });
        } 
    };

    return (
        <div className="page-wrapper compact-wrapper" >
            <Header />
            <div className="page-body-wrapper">
                <Sidebar />
                {connectedAccount && connectedAccount.length > 0 ? (
                    <div className="page-body">                        
                        {/* <div className="container-fluid">
                            <div className="page-title">
                                <div className="row">
                                    <div className="col-sm-6">
                                        <h3>Ads Campaigns</h3>
                                    </div>
                                    <div className="col-sm-6">
                                        <ol className="breadcrumb">
                                            <li className="breadcrumb-item">Dashboard</li>
                                            <li className="breadcrumb-item active">Ads Campaigns</li>
                                        </ol>
                                    </div>               
                                </div>
                            </div>
                        </div> */}
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-12 col-sm-12 col-md-12">
                                    {/* <div className="card">
                                        <div className="card-body"> */}
                                    <div className="page-title" style={{ marginBottom: "20px" }}>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <h1 className='h1-heading'>Ads Campaigns </h1>
                                            </div>
                                            <div className="col-7 col-md-6">
                                                {/* <div className="row">
                                                    <div className="col-md-6">
                                                     
                                                        <div ref={dropdownRef} className="position-relative">
                                                            <div className="form-control pe-4 custom-select-input" onClick={() => setShowPlatformsList(!showPlatformList)}>
                                                                <div className="selected-pages-container">
                                                                    {selectedPlatform && selectedPlatform.status === 'Connected' ? (
                                                                        <div key={selectedPlatform.id} className="selected-page-item">
                                                                            <img src={selectedPlatform.img_url} alt={selectedPlatform.name} className="selected-page-image" />
                                                                            <span className="mr-2">
                                                                                <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`} style={{ fontSize: "13px" }}></i>
                                                                            </span>
                                                                            <div style={{ marginLeft: "10px" }}>
                                                                                <span className="user-name">
                                                                                    <b>{selectedPlatform.name}</b>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            Select your facebook account
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {showPlatformList ? (
                                                                <span className="position-absolute end-0 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", top: "20px", }}>
                                                                    <i className="fas fa-chevron-up text-muted" />
                                                                </span>
                                                            ) : (
                                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", }} >
                                                                    <i className="fas fa-chevron-down text-muted" />
                                                                </span>
                                                            )}
                                                            {showPlatformList && (
                                                                <div className="dropdown-content">
                                                                    <ul className="nested-checkbox-list">
                                                                        {connectedAccount.length === 0 ? (
                                                                            <li className="p-2 text-danger">Connect your account</li>
                                                                        ) : (
                                                                            connectedAccount.map((socialUser) => (
                                                                                <li key={socialUser.id} className="parent-item" onClick={() => { setSelectPlatform(socialUser); setShowPlatformsList(false); }}
                                                                                    style={{ cursor: "pointer", padding: "10px 15px", display: "flex", alignItems: "center" }}>
                                                                                    <div className="d-flex align-items-center">
                                                                                        <img className="user-avatar" src={socialUser.img_url} alt="Profile"
                                                                                            onError={(e) => { e.target.src = "/default-avatar.png"; }}
                                                                                            style={{ width: "40px", height: "40px", }} />
                                                                                        <span className="mr-2">
                                                                                            <i className={`fa-brands fa-${socialUser.social_user_platform} text-primary fs-5`}></i>
                                                                                        </span>
                                                                                        <div style={{ marginLeft: "10px" }}>
                                                                                            <span className="user-name">
                                                                                                <b>{socialUser.name}</b>
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </li>
                                                                            ))
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div ref={dropdownAdRef} className="position-relative">
                                                            <div className="form-control pe-4 custom-select-input" onClick={() => setShowAdPlatformsList(!showAdPlatformList)}>
                                                                <div className="selected-pages-container">
                                                                    {selectedAdPlatform && selectedAdPlatform.isConnected === 'Connected' ? (
                                                                        <div key={selectedAdPlatform.account_id} className="selected-page-item">
                                                                            <span className="mr-2">
                                                                                <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`}></i>
                                                                            </span>
                                                                            <div style={{ marginLeft: "10px" }}>
                                                                                <span className="user-name">
                                                                                    <b>{selectedAdPlatform.account_name}</b>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            Select Your Ad Account
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {showAdPlatformList ? (
                                                                <span className="position-absolute end-0 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", top: "20px", }}>
                                                                    <i className="fas fa-chevron-up text-muted" />
                                                                </span>
                                                            ) : (
                                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", }} >
                                                                    <i className="fas fa-chevron-down text-muted" />
                                                                </span>
                                                            )}
                                                            {showAdPlatformList && (
                                                                <div className="dropdown-content">
                                                                    <ul className="nested-checkbox-list">
                                                                        {selectedPlatform?.social_id &&
                                                                            connectedAccount.filter(acc => acc.social_id === selectedPlatform.social_id)
                                                                                .flatMap(account => account.AdsAccounts?.filter(ad => ad.isConnected === 'Connected') || [])
                                                                                .map(ad => (
                                                                                    <li key={ad.account_id} className="parent-item"
                                                                                        onClick={() => {
                                                                                            setSelectAdPlatform(ad);
                                                                                            fetchCampaigns(ad);
                                                                                            setShowAdPlatformsList(false);
                                                                                        }}
                                                                                        style={{ cursor: "pointer", padding: "10px 15px", display: "flex", alignItems: "center" }}
                                                                                    >
                                                                                        <div className="d-flex align-items-center">
                                                                                            <span className="mr-2">
                                                                                                <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`}></i>
                                                                                            </span>
                                                                                            <div className="row" style={{ marginLeft: "10px" }}>
                                                                                                <span className="user-name">
                                                                                                    <b>{ad.account_name}</b>
                                                                                                </span>
                                                                                                <small>{ad.account_id}</small>
                                                                                            </div>
                                                                                        </div>
                                                                                    </li>
                                                                                ))
                                                                        }

                                                                        {(!selectedPlatform || !connectedAccount.find(acc =>
                                                                            acc.social_id === selectedPlatform.social_id &&
                                                                            acc.AdsAccounts?.some(ad => ad.isConnected === 'Connected')
                                                                        )) && (
                                                                                <li className="p-2 text-danger">No Connected Ad Accounts for this account</li>
                                                                            )}

                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div> */}
                                                <div className='d-flex justify-content-start justify-content-sm-end'> 
                                                    <button type="button" className="btn btn-hover-effect btn-primary my-lg-3 
                                                        d-flex align-items-center justify-content-center"
                                                        onClick={() => setShowCreateAdsModal(true)}
                                                    >
                                                        <i className="fa-solid fa-plus fs-5 me-2"></i> Create ad campaign
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    {/* </div>
                                    </div> */}

                                    {/* new card style start  */}
                                    <div className='card'>
                                        <div className='card-header border-0 pb-0'> 
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div><h5 className="mb-0 ">Account Selection</h5><p className='mb-0'> Select your Facebook account and ads account to manage campaigns </p></div>
                                            <div>
                                            </div>
                                        </div>
                                        </div>
                                        <div className='card-body'> 
                                            <div className="row">
                                                    <div className="col-md-6">
                                                        {/* <label htmlFor="pages-dropdown" className="my-auto" style={{ marginRight: 12, fontWeight: 500 }}>Select Account:</label> */}
                                                        <span className='mb-2 fw-medium'> Facebook Account </span>
                                                        <div ref={dropdownRef} className="position-relative">
                                                            <div className="form-control pe-4 custom-select-input" onClick={() => setShowPlatformsList(!showPlatformList)}>
                                                                <div className="selected-pages-container">
                                                                    {selectedPlatform && selectedPlatform.status === 'Connected' ? (
                                                                        <div key={selectedPlatform.id} className="selected-page-item">
                                                                            <img src={selectedPlatform.img_url} alt={selectedPlatform.name} className="selected-page-image" />
                                                                            <span className="mr-1">
                                                                                {/* <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`} style={{ fontSize: "13px" }}></i> */}
                                                                                <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                                    style={{
                                                                                        background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                                        width: "25px",
                                                                                        height: "25px"
                                                                                    }}
                                                                                    >
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="15"
                                                                                        height="15"
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
                                                                            </span>
                                                                            <div style={{ marginLeft: "10px" }}>
                                                                                <span className="user-name">
                                                                                    <b>{selectedPlatform.name}</b>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            Select your facebook account
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {showPlatformList ? (
                                                                <span className="position-absolute end-0 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", top: "20px", }}>
                                                                    <i className="fas fa-chevron-up text-muted" />
                                                                </span>
                                                            ) : (
                                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", }} >
                                                                    <i className="fas fa-chevron-down text-muted" />
                                                                </span>
                                                            )}
                                                            {showPlatformList && (
                                                                <div className="dropdown-content">
                                                                    <ul className="nested-checkbox-list">
                                                                        {connectedAccount.length === 0 ? (
                                                                            <li className="p-2 text-danger">Connect your account</li>
                                                                        ) : (
                                                                            connectedAccount.map((socialUser) => (
                                                                                <li key={socialUser.id} className="parent-item" onClick={() => { setSelectPlatform(socialUser); setShowPlatformsList(false); }}
                                                                                    style={{ cursor: "pointer", padding: "10px 15px", display: "flex", alignItems: "center" }}>
                                                                                    <div className="d-flex align-items-center">
                                                                                        <img className="user-avatar" src={socialUser.img_url} alt="Profile"
                                                                                            onError={(e) => { e.target.src = "/default-avatar.png"; }}
                                                                                            style={{ width: "40px", height: "40px", }} />
                                                                                        <span className="mr-1">
                                                                                            {/* <i className={`fa-brands fa-${socialUser.social_user_platform} text-primary fs-5`}></i> */}
                                                                                            <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                                                style={{
                                                                                                    background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                                                    width: "25px",
                                                                                                    height: "25px"
                                                                                                }}
                                                                                            >
                                                                                                <svg
                                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                                    width="15"
                                                                                                    height="15"
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
                                                                                        </span>
                                                                                        <div style={{ marginLeft: "10px" }}>
                                                                                            <span className="user-name">
                                                                                                <b>{socialUser.name}</b>
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </li>
                                                                            ))
                                                                        )}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        {/* <label htmlFor="pages-dropdown" className="my-auto" style={{ marginRight: 12, fontWeight: 500 }}>Select Ad Account:</label> */}
                                                        <span className='mb-2 fw-medium'> Ads Account </span>
                                                        <div ref={dropdownAdRef} className="position-relative">
                                                            <div className="form-control pe-4 custom-select-input" onClick={() => setShowAdPlatformsList(!showAdPlatformList)}>
                                                                <div className="selected-pages-container">
                                                                    {selectedAdPlatform && selectedAdPlatform.isConnected === 'Connected' ? (
                                                                        <div key={selectedAdPlatform.account_id} className="selected-page-item">
                                                                            <span className="mr-1">
                                                                                {/* <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`}></i> */}
                                                                                <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                                    style={{
                                                                                        background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                                        width: "25px",
                                                                                        height: "25px"
                                                                                    }}
                                                                                    >
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="15"
                                                                                        height="15"
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
                                                                            </span>
                                                                            <div style={{ marginLeft: "10px" }}>
                                                                                <span className="user-name">
                                                                                    <b>{selectedAdPlatform.account_name}</b>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            Select Your Ad Account
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {showAdPlatformList ? (
                                                                <span className="position-absolute end-0 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", top: "20px", }}>
                                                                    <i className="fas fa-chevron-up text-muted" />
                                                                </span>
                                                            ) : (
                                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                                    style={{ cursor: "pointer", pointerEvents: "none", }} >
                                                                    <i className="fas fa-chevron-down text-muted" />
                                                                </span>
                                                            )}
                                                            {showAdPlatformList && (
                                                                <div className="dropdown-content">
                                                                    <ul className="nested-checkbox-list">
                                                                        {selectedPlatform?.social_id &&
                                                                            connectedAccount.filter(acc => acc.social_id === selectedPlatform.social_id)
                                                                                .flatMap(account => account.AdsAccounts?.filter(ad => ad.isConnected === 'Connected') || [])
                                                                                .map(ad => (
                                                                                    <li key={ad.account_id} className="parent-item"
                                                                                        onClick={() => {
                                                                                            setSelectAdPlatform(ad);
                                                                                            fetchCampaigns(ad);
                                                                                            setShowAdPlatformsList(false);
                                                                                        }}
                                                                                        style={{ cursor: "pointer", padding: "10px 15px", display: "flex", alignItems: "center" }}
                                                                                    >
                                                                                        <div className="d-flex align-items-center">
                                                                                            <span className="mr-1">
                                                                                                {/* <i className={`fa-brands fa-${selectedPlatform.social_user_platform} text-primary fs-5`}></i> */}
                                                                                                <div className="platform-icon-custom me-2 mb-0 d-flex justify-content-center align-items-center rounded-circle"
                                                                                                    style={{
                                                                                                        background: "linear-gradient(135deg, rgb(37, 99, 235), rgb(30, 64, 175))",
                                                                                                        width: "25px",
                                                                                                        height: "25px"
                                                                                                    }}
                                                                                                >
                                                                                                    <svg
                                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                                        width="15"
                                                                                                        height="15"
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
                                                                                            </span>
                                                                                            <div className="row" style={{ marginLeft: "10px" }}>
                                                                                                <span className="user-name">
                                                                                                    <b>{ad.account_name}</b>
                                                                                                </span>
                                                                                                <small>{ad.account_id}</small>
                                                                                            </div>
                                                                                        </div>
                                                                                    </li>
                                                                                ))
                                                                        }

                                                                        {(!selectedPlatform || !connectedAccount.find(acc =>
                                                                            acc.social_id === selectedPlatform.social_id &&
                                                                            acc.AdsAccounts?.some(ad => ad.isConnected === 'Connected')
                                                                        )) && (
                                                                            <li className="p-2 text-danger">No Connected Ad Accounts for this account</li>
                                                                        )}

                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ads Campaigns */}
                                                
                                                {selectedAdPlatform ? (                                                        
                                                    <div className='mt-4'>
                                                        <div className='d-flex align-items-center justify-content-between'> 
                                                            <h6 className="text-dark mb-2"><strong>Ads Account Details</strong></h6>
                                                            <div className="d-inline-flex align-items-center rounded-pill green-badge  fw-semibold small px-3"> Active </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 mobile-responsive">
                                                            <small><b>ID:</b> {selectedAdPlatform.account_id}</small>
                                                            <small><b>TimeZone:</b> {selectedAdPlatform.timezone} </small>
                                                            <small><b>Currency:</b> {selectedAdPlatform.currency}</small>
                                                        </div>
                                                    </div>                                                   
                                                ) : (
                                                    <>                                                        
                                                    </>
                                                )}

                                                {selectedAdPlatform ? (
                                                    <div className='card card-body mt-4'> 
                                                        <div className="col-md-12">
                                                            <div className="row">
                                                                <div className="col-md-6">
                                                                    <div className="row mt-2">
                                                                        {/* Total Spend */}
                                                                        <div className="col-md-12 mb-2">
                                                                            <div className="d-flex justify-content-between">
                                                                                <p className="mb-0">This Ad Account has spent a total of&nbsp;
                                                                                    <span className="fw-bold">
                                                                                        {formatCurrency(
                                                                                            parseFloat(selectedAdPlatform.amount_spent || 0) / 100,
                                                                                            selectedAdPlatform.currency || 'USD'
                                                                                        )}
                                                                                    </span>
                                                                                </p>
                                                                                <span><small>{percentSpent.toFixed(1)}%</small></span>
                                                                            </div>

                                                                            <div className="progress" style={{ height: '12px', width: '100%' }}>
                                                                                <div
                                                                                    className={`progress-bar ${selectedAdPlatform.spend_cap === '0' || selectedAdPlatform.spend_cap === 0 ? '' : 'bg-warning'}`}
                                                                                    role="progressbar"
                                                                                    style={{
                                                                                        width:
                                                                                            selectedAdPlatform.spend_cap === '0' || selectedAdPlatform.spend_cap === 0
                                                                                                ? '0%'
                                                                                                : `${percentSpent?.toFixed(1) || 0}%`
                                                                                    }}
                                                                                    aria-valuenow={percentSpent}
                                                                                    aria-valuemin="0"
                                                                                    aria-valuemax="100"
                                                                                ></div>
                                                                            </div>
                                                                            {selectedAdPlatform.spend_cap === '0' || selectedAdPlatform.spend_cap === 0 ? (
                                                                                <small className="text-muted">No spending limit is set</small>
                                                                            ) : selectedAdPlatform.amount_spent >= selectedAdPlatform.spend_cap ? (
                                                                                <small className="text-danger">This ad account is reached to it's spending limit.</small>
                                                                            ) : (
                                                                                <small className="text-muted">{percentSpent.toFixed(1)}% of spend limit used</small>
                                                                            )}
                                                                        </div>

                                                                        {/* Balance */}
                                                                        <div className="col-md-12">
                                                                            <p className="mb-0 d-flex align-items-center">
                                                                                Balance:&nbsp;
                                                                                <span className={`fw-bold ${parseFloat(selectedAdPlatform?.balance || 0) / 100 < 100 ? 'text-danger' : ''
                                                                                    }`}
                                                                                >
                                                                                    {selectedAdPlatform.balance > 0 ?
                                                                                        formatCurrency(parseFloat(selectedAdPlatform.balance) / 100, selectedAdPlatform.currency || 'USD') :
                                                                                        formatCurrency(0, selectedAdPlatform.currency || 'USD')
                                                                                    }
                                                                                </span>

                                                                                {/* Low Balance Badge */}
                                                                                {parseFloat(selectedAdPlatform?.balance) / 100 < 100 && selectedAdPlatform?.balance != 0 ? (
                                                                                    <span className="badge bg-danger text-white ms-2">Low Balance</span>
                                                                                ) : (
                                                                                    <span className="badge bg-danger text-white ms-2">Fund Required</span>
                                                                                )}
                                                                            </p>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6"> </div>
                                                                <div className="col-md-12 mt-3">
                                                                    {showWarning && (
                                                                        <div className="alert alert-warning alert-dismissible fade show" role="alert" style={{ padding: "5px 15px" }}>
                                                                            <i className="fa-solid fa-circle-exclamation my-auto p-2"
                                                                                style={{
                                                                                    background: 'goldenrod',
                                                                                    borderRadius: '50%'
                                                                                }}>
                                                                            </i>
                                                                            <div>
                                                                                <span><strong>Warning:</strong> This account has reached 80% of it's spending limit.</span>
                                                                                <span><small>The Ad Campiagns will get paused until you raise(or remove) your spending limit. </small></span>
                                                                            </div>
                                                                            <button type="button" className="btn-close" onClick={() => setShowWarning(false)} ></button>
                                                                        </div>
                                                                    )}

                                                                    {showDanger && (
                                                                        <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ padding: "5px 15px" }}>
                                                                            <div className="d-flex gap-3">
                                                                                <i className="fas fa-exclamation-triangle my-auto p-2"
                                                                                    style={{
                                                                                        background: 'red',
                                                                                        borderRadius: '50%'
                                                                                    }}>
                                                                                </i>
                                                                                <div>
                                                                                    <span><strong>Alert:</strong> This account has reached to its spending limit.</span>
                                                                                    <span><small>This ad account has been reached to its spending limit. Ad Campiagns won't resume until you raise(or remove) your spending limit. </small></span>
                                                                                </div>
                                                                            </div>
                                                                            <button type="button" className="btn-close my-auto" onClick={() => setShowDanger(false)} ></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // <div className='card card-body mt-4'>
                                                    //     <div className="col-md-12"></div>
                                                    // </div>
                                                    <></>
                                                )}
                                                
                                            {/* Ads Campaigns  end*/}
                                        </div>
                                    </div>

                                    {/* new card style end  */}


                                    <div className="card">
                                        <div className="card-body">
                                            {/* <div className="row">
                                                {selectedAdPlatform ? (
                                                    <div className='col-md-6'>
                                                        <h6 className="text-dark mb-2"><strong>Ads Account Details</strong></h6>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <small><b>ID:</b> {selectedAdPlatform.account_id}</small>
                                                            <small><b>TimeZone:</b> {selectedAdPlatform.timezone} </small>
                                                            <small><b>Currency:</b> {selectedAdPlatform.currency}</small>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className='col-md-6'>
                                                        <h6 className="mb-2"><strong>Ads Account Details</strong></h6>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <small>ID: </small>
                                                            <small>TimeZone: </small>
                                                            <small>Currency: </small>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className='col-md-6 d-flex justify-content-end'>
                                                    <p className="text-end">
                                                        <button type="button" className="btn btn-hover-effect btn-primary 
                                                            d-flex align-items-center justify-content-center"
                                                            onClick={() => setShowCreateAdsModal(true)}
                                                        >
                                                            <i className="fa-solid fa-plus fs-5 me-2"></i> Create ad campaign
                                                        </button>
                                                    </p>

                                                    <div className="d-inline-flex align-items-center rounded-pill green-badge  fw-semibold small px-3"> Active </div>
                                                </div>

                                                {selectedAdPlatform ? (
                                                    <div className="col-md-12">
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="row mt-2">
                                                                   
                                                                    <div className="col-md-12 mb-2">
                                                                        <div className="d-flex justify-content-between">
                                                                            <p className="mb-0">This Ad Account has spent a total of&nbsp;
                                                                                <span className="fw-bold">
                                                                                    {formatCurrency(
                                                                                        parseFloat(selectedAdPlatform.amount_spent || 0) / 100,
                                                                                        selectedAdPlatform.currency || 'USD'
                                                                                    )}
                                                                                </span>
                                                                            </p>
                                                                            <span><small>{percentSpent.toFixed(1)}%</small></span>
                                                                        </div>

                                                                        <div className="progress" style={{ height: '12px', width: '100%' }}>
                                                                            <div
                                                                                className={`progress-bar ${selectedAdPlatform.spend_cap === '0' || selectedAdPlatform.spend_cap === 0 ? '' : 'bg-warning'}`}
                                                                                role="progressbar"
                                                                                style={{
                                                                                    width:
                                                                                        selectedAdPlatform.spend_cap === '0' || selectedAdPlatform.spend_cap === 0
                                                                                            ? '0%'
                                                                                            : `${percentSpent?.toFixed(1) || 0}%`
                                                                                }}
                                                                                aria-valuenow={percentSpent}
                                                                                aria-valuemin="0"
                                                                                aria-valuemax="100"
                                                                            ></div>
                                                                        </div>
                                                                        {selectedAdPlatform.spend_cap === '0' || selectedAdPlatform.spend_cap === 0 ? (
                                                                            <small className="text-muted">No spending limit is set</small>
                                                                        ) : selectedAdPlatform.amount_spent >= selectedAdPlatform.spend_cap ? (
                                                                            <small className="text-danger">This ad account is reached to it's spending limit.</small>
                                                                        ) : (
                                                                            <small className="text-muted">{percentSpent.toFixed(1)}% of spend limit used</small>
                                                                        )}
                                                                    </div>

                                                                  
                                                                    <div className="col-md-12">
                                                                        <p className="mb-0 d-flex align-items-center">
                                                                            Balance:&nbsp;
                                                                            <span className={`fw-bold ${parseFloat(selectedAdPlatform?.balance || 0) / 100 < 100 ? 'text-danger' : ''
                                                                                }`}
                                                                            >
                                                                                {selectedAdPlatform.balance > 0 ?
                                                                                    formatCurrency(parseFloat(selectedAdPlatform.balance) / 100, selectedAdPlatform.currency || 'USD') :
                                                                                    formatCurrency(0, selectedAdPlatform.currency || 'USD')
                                                                                }
                                                                            </span>

                                                                            
                                                                            {parseFloat(selectedAdPlatform?.balance) / 100 < 100 && selectedAdPlatform?.balance != 0 ? (
                                                                                <span className="badge bg-danger text-white ms-2">Low Balance</span>
                                                                            ) : (
                                                                                <span className="badge bg-danger text-white ms-2">Fund Required</span>
                                                                            )}
                                                                        </p>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                            <div className="col-md-6"></div>
                                                            <div className="col-md-12 mt-3">
                                                                {showWarning && (
                                                                    <div className="alert alert-warning alert-dismissible fade show" role="alert" style={{ padding: "5px 15px" }}>
                                                                        <i className="fa-solid fa-circle-exclamation my-auto p-2"
                                                                            style={{
                                                                                background: 'goldenrod',
                                                                                borderRadius: '50%'
                                                                            }}>
                                                                        </i>
                                                                        <div>
                                                                            <span><strong>Warning:</strong> This account has reached 80% of it's spending limit.</span>
                                                                            <span><small>The Ad Campiagns will get paused until you raise(or remove) your spending limit. </small></span>
                                                                        </div>
                                                                        <button type="button" className="btn-close" onClick={() => setShowWarning(false)} ></button>
                                                                    </div>
                                                                )}

                                                                {showDanger && (
                                                                    <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ padding: "5px 15px" }}>
                                                                        <div className="d-flex gap-3">
                                                                            <i className="fas fa-exclamation-triangle my-auto p-2"
                                                                                style={{
                                                                                    background: 'red',
                                                                                    borderRadius: '50%'
                                                                                }}>
                                                                            </i>
                                                                            <div>
                                                                                <span><strong>Alert:</strong> This account has reached to its spending limit.</span>
                                                                                <span><small>This ad account has been reached to its spending limit. Ad Campiagns won't resume until you raise(or remove) your spending limit. </small></span>
                                                                            </div>
                                                                        </div>
                                                                        <button type="button" className="btn-close my-auto" onClick={() => setShowDanger(false)} ></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="col-md-12"></div>
                                                )}
                                            </div> */}
                                            <CreateAdsCampaign
                                                show={showCreateAdsModal}
                                                onHide={() => setShowCreateAdsModal(false)}
                                                connectedAccount={connectedAccount}
                                            />
                                            {selectedAdPlatform ? (
                                                <div className="mt-4">
                                                    {loading ? (
                                                        <div className="d-flex align-items-center">
                                                            <i className="fas fa-spin fa-spinner" style={{ fontSize: '25px' }}></i>
                                                            <p className="my-auto ms-2">Please wait, fetching campaigns...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="ag-theme-alpine grid-wrapper" style={{ width: '100%', overflow: 'hidden' }}>
                                                            <div style={{ height: '400px', width: '100%' }}>
                                                                <AgGridReact
                                                                    rowData={campaigns}
                                                                    columnDefs={campaignColumns}
                                                                    defaultColDef={{
                                                                        sortable: true,
                                                                        resizable: true,
                                                                        filter: true
                                                                    }}
                                                                    getRowId={(params) => params.data.id.toString()}
                                                                    getRowClass={(params) => {
                                                                        return params.node.rowIndex % 2 === 0 ? 'table-row-striped' : '';
                                                                    }}
                                                                    popupParent={document.body}
                                                                    rowHeight={80}
                                                                    domLayout="normal"
                                                                    suppressHorizontalScroll={false}
                                                                    rowSelection="multiple"
                                                                />
                                                            </div>
                                                            {actionMenu.visible && (
                                                                <div className="dropdown-menu show rounded-3 border-0 p-1"
                                                                    style={{
                                                                        position: 'fixed',
                                                                        top: actionMenu.y,
                                                                        left: actionMenu.x,
                                                                        zIndex: 9999,
                                                                        minWidth: '110px',
                                                                        background: '#fff',
                                                                        border: '1px solid #ddd',
                                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onMouseLeave={closeActionMenu}
                                                                >
                                                                    <button className="dropdown-item rounded-3 border-0 mb-1" onClick={(e) => { e.stopPropagation(); handleView(actionMenu.data) }}>
                                                                        <i className="fas fa-eye me-2"></i> &nbsp; View
                                                                    </button>
                                                                    <button className="dropdown-item rounded-3 border-0 mb-1" onClick={() => handleEdit(actionMenu.data)}>
                                                                        <i className="fas fa-pencil me-2"></i> &nbsp; Edit
                                                                    </button>
                                                                    <button className="dropdown-item rounded-3 border-0  text-danger" onClick={() => handleDelete(actionMenu.data)}>
                                                                        <i className="fas fa-trash me-2"></i> &nbsp; Delete
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Start Open campaign edit model wiht pass data */}
                                                            {showEditCampaignModal && (
                                                                <EditCampaignData
                                                                    show={showEditCampaignModal}
                                                                    onHide={() => setShowEditCampaignModal(false)}
                                                                    onClose={handleEditCloseModal}
                                                                    CampaignData={showEditCampaignData}
                                                                    editStepNumber={1}
                                                                />                                                       
                                                            )}
                                                            {/* End Open campaign edit model wiht pass data */}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-danger mt-4">No Campaign to show.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="page-body">
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-12 col-sm-12 col-md-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                                                <div>
                                                    <h5 className="mb-2">Ads Campaigns</h5>
                                                </div>
                                            </div>
                                            <div className="error-wrapper" style={{ minHeight: '0px' }}>
                                                <div className="container">
                                                    <div className="col-md-6 offset-md-2">
                                                        <h5 className="mt-0">
                                                            Manage your ad campaigns in Insocialwise
                                                        </h5>
                                                        <p className="mt-2">This status indicates that one or more required social media accounts have not been linked to the platform or service.</p>
                                                        <button className="btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center"
                                                            onClick={() => setShowConnectModal(true)} style={{ margin: '0 auto' }}
                                                        >
                                                            <i className="fa-solid fa-plus fs-5 me-2"></i> Connect accounts
                                                        </button>
                                                    </div>
                                                </div>
                                                <AccountNotConnectedComponent
                                                    show={showConnectModal}
                                                    onHide={() => setShowConnectModal(false)}
                                                    onSuccess={async () => fetchAdsAccounts()}
                                                    setIsConnectedAccountInfo={setIsConnectedAccountInfo}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete confirmation modal */}
                    {campaignDataDeleteModal && campaignDataToDelete && (
                        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                            <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '100%' }}>
                                <h5>Delete confirmation</h5>
                                <hr />
                                <p className="mb-2">
                                    <span className='text-danger'>Are you sure you want to delete the campaign:</span> <strong>"{campaignDataToDelete.campaign_name}"</strong> <span className='text-danger'>from {campaignDataToDelete.account_platform}?</span>
                                </p>
                                <form onSubmit={handleDeleteSubmit}>
                                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                        <button type="button" className="btn btn-secondary" onClick={() => setCampaignDataDeleteModal(false)} disabled={deleting}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-danger" disabled={deleting}>
                                            {deleting ? (
                                                <div className="spinner-border spinner-border-sm text-light" role="status">
                                                    <span className="visually-hidden">Deleting...</span>
                                                </div>
                                            ) : (
                                                "Delete"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )} 
                {/* Delete confirmation modal */}                
                              
                <Footer />
            </div>
        </div>
    )
}
