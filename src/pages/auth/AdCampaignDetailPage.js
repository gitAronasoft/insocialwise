import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useLocation } from 'react-router-dom';
import AdCellRenderer from './components/AdCellRenderer';
import AdEditModal from './components/AdEditModal';

export default function AdCampaignDetailPage() {
    ModuleRegistry.registerModules([AllCommunityModule]);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const campaignID = queryParams.get('asset_id');
    const socialUserID = queryParams.get('ref');
    const [activeTab, setActiveTab] = useState('overview');
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'adsets', label: 'Adsets' },
        { id: 'adsets_ads', label: 'Adsets Ads' },
    ];
    const [CampaignData, setCampaignData] = useState(null);
    const [AdsetsAds, setAdsetsAds] = useState(null);
    const [Adsets, setAdsets] = useState(null);
    const [AdsCreatives, setAdsCreatives] = useState(null);
    const [selectedAdPlatform, setSelectAdPlatform] = useState(null);
    const [combinedAds, setCombinedAds] = useState(null);
    const [actionMenu, setActionMenu] = useState({ visible: false, x: 0, y: 0, data: null });
    const [showEditModal, setShowEditModal] = useState(false);
    const [adSelectedData, setSelectedAdData] = useState(null);

    const [dataDeleteModal, setDataDeleteModal] = useState(false);
    const [dataToDelete, setDataToDelete] = useState(
        { 
            deleteType: '', 
            deleteData: null
        }
    );    
    const [deleting, setDeleting] = useState(false);
    const [loadingRowId, setLoadingRowId] = useState(null);

    const handleCampaignToggleStatus = async (row, newStatus) => {
        //console.log(`Toggling Campaign status to, ${row} ${newStatus}`);
        //console.log('CampaignData: ', CampaignData);
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
            if(data.success === true)  {
                setCampaignData(prev => ({
                    ...prev,
                    campaign_effective_status: newStatus
                }));
                setLoadingRowId(null);
                toast.success(`${data.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
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
            setLoadingRowId(null);
            console.error("Network error while updating status:", err);
            toast.error(`Network error while updating status.`, {
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

    const handleAdsetsToggleStatus = async (row, newStatus) => {
        //console.log(`Toggling Adsets status of ${row.adsets_name} to ${newStatus}`);
        const rowID = row.id;
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');        
        const payload = {
            dataID: row.id,
            socialUserid: row.account_social_userid,
            platform: 'facebook',
            adsetsID: row.adsets_id,
            newStatus
        };

        try {
            setLoadingRowId(rowID);
            const response = await fetch(`${BACKEND_URL}/api/adsets/updateStatus`, {
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
                toast.error(`${response.message}`, {
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

    const handleAdsToggleStatus = async (row, newStatus) => {
        //console.log(`Toggling Ads status of ${row.ads_name} to ${newStatus}`);
        const rowID = row.id;
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');        
        const payload = {
            dataID: row.id,
            socialUserid: row.account_social_userid,
            platform: 'facebook',
            adsID: row.ads_id,
            newStatus
        };
        try {
            setLoadingRowId(rowID);
            const response = await fetch(`${BACKEND_URL}/api/ads/updateStatus`, {
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
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        } catch (err) {
            console.error("Network error while updating status:", err);
            setLoadingRowId(null);
            toast.error(`Network error while updating status.`, {
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

    useEffect(() => {
        if (!campaignID) {
            toast.error(`Campaign ID is missing in the URL`, {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });
            //toast.error('Campaign ID is missing in the URL');
            return;
        }      

        fetchCampaignDetails();
    }, [campaignID]);

    const fetchCampaignDetails = async () => {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const storedToken = localStorage.getItem('authToken');

        try {
            const response = await axios.post(
                `${BACKEND_URL}/api/campaign-ads-details`,
                { campaignId: campaignID, socialUserId: socialUserID },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${storedToken}`
                    }
                }
            );
            if (response.data.success) {
                const { campaign, adsets, adsets_ads, ads_creative, ad_account } = response.data.data;
                // const activeAdsets = adsets.filter(item => item.adsets_status === 'ACTIVE');

                // const campaign_custom_lifetime_budget = activeAdsets.reduce((total, item) => {
                //     const lifetime = Number(item.adsets_lifetime_budget) || 0;
                //     const daily = Number(item.adsets_daily_budget) || 0;
                //     const spend = Number(item.adsets_insights_spend) || 0;

                //     const budget = lifetime > 0
                //         ? lifetime
                //         : (daily > 0 ? daily : spend); // fallback to spend if both budgets are 0

                //     return total + budget;
                // }, 0);

                // const campaign_custom_daily_budget = activeAdsets.reduce((total, item) => {
                //     const daily = Number(item.adsets_daily_budget) || 0;
                //     const lifetime = Number(item.adsets_lifetime_budget) || 0;
                //     const spend = Number(item.adsets_insights_spend) || 0;

                //     const budget = daily > 0
                //         ? daily
                //         : (lifetime > 0 ? 0 : spend); // use spend only if both are 0

                //     return total + budget;
                // }, 0);

                // // Append these to the campaign object
                // const updatedCampaign = {
                //     ...campaigns,
                //     campaign_custom_lifetime_budget,
                //     campaign_custom_daily_budget
                // };
                setCampaignData(campaign);
                setAdsets(adsets);
                setAdsetsAds(adsets_ads);
                setAdsCreatives(ads_creative);
                setSelectAdPlatform(ad_account);
                // console.log("UpdatedCampaignData:", updatedCampaign);

                const uniqueCountries = [...new Set(adsets.map(item => item.adsets_countries).filter(Boolean))];
                const uniqueGenders = [...new Set(adsets.map(item => item.adsets_genders).filter(g => g !== null && g !== undefined))];

                const minAge = Math.min(...adsets.map(a => Number(a.adsets_age_min) || 0));
                const maxAge = Math.max(...adsets.map(a => Number(a.adsets_age_max) || 0));

                const campaignAudience = {
                    age_range: `${minAge} - ${maxAge}`,
                    countries: uniqueCountries.join(', ') || 'N/A',
                    gender: (() => {
                        const values = uniqueGenders;
                        if (values.includes(0)) return 'All';
                        if (values.includes(1)) return 'Male';
                        if (values.includes(2)) return 'Female';
                        return 'Unknown';
                    })()
                };

                setCampaignData(prev => ({
                    ...prev,
                    campaign_audience_age_range: campaignAudience.age_range,
                    campaign_audience_countries: campaignAudience.countries,
                    campaign_audience_gender: campaignAudience.gender
                }));

                const mergedData = mergeAdsetsWithCreatives(adsets_ads, ads_creative);
                setCombinedAds(mergedData);
                // console.log('Campaign Data:', mergedData);
            } else {
                toast.error(`Error loading campaign data.`, {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });               
            }
        } catch (error) {
            //console.error('Error fetching campaign details:', error);
            toast.error(`${error.response?.data?.message || 'Failed to fetch campaign details'}`, {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            }); 
            // toast.error(
            //     error.response?.data?.message || 'Failed to fetch campaign details'
            // );
        }
    };

    const mergeAdsetsWithCreatives = (adsetsAds = [], adsCreatives = []) => {
        return adsetsAds.map(ad => {
            const matchingCreative = adsCreatives.find(c => c.ad_id === ad.ads_id); // non-strict match
            return {
                ...ad,
                creative: matchingCreative || null
            };
        });
    };

    const handleEdit = (table, row) => {
        console.log('Edit clicked:', row);
        if (table === 'ad') {
            setSelectedAdData(row);
            setTimeout(() => {
                setShowEditModal(true);
            }, 0);
        }
        // setShowCreateAdsModal(true);
        // You can pass the row data to the modal if needed
    }

    const handleDelete = (dataType, row) => {
        //console.log('Delete clicked:', row);        
        setDataToDelete({ 
            deleteType: dataType, 
            deleteData: row
        });           
        setDataDeleteModal(true);        
    }    

    const handleCloseModal = () => {
        setShowEditModal(false);
    };

    const openAdsetsActionMenu = (params) => {
        const { clientX, clientY } = window.event;
        setActionMenu({
            visible: true,
            x: clientX,
            y: clientY,
            data: params.data
        });
    };

    const closeAdsetsActionMenu = () => {
        setActionMenu({ visible: false, x: 0, y: 0, data: null });
    };

    const openCreativeActionMenu = (params) => {
        const { clientX, clientY } = window.event;
        setActionMenu({
            visible: true,
            x: clientX,
            y: clientY,
            data: params.data
        });
    };

    const closeCreativeActionMenu = () => {
        setActionMenu({ visible: false, x: 0, y: 0, data: null });
    };

    useEffect(() => {
        const handleClickOutside = () => closeAdsetsActionMenu();
        if (actionMenu.visible) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [actionMenu.visible]);

    useEffect(() => {
        const handleScroll = () => closeAdsetsActionMenu();
        if (actionMenu.visible) {
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [actionMenu.visible]);

    useEffect(() => {
        const handleClickOutside = () => closeCreativeActionMenu();
        if (actionMenu.visible) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [actionMenu.visible]);

    useEffect(() => {
        const handleScroll = () => closeCreativeActionMenu();
        if (actionMenu.visible) {
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [actionMenu.visible]);

    const adsetsColumns = [
        {
            headerName: 'AD SET',
            field: 'adsets_name',
            filter: false,
            pinned: 'left', // freeze first column
            width: 200,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <img className="user-avatar" alt={params.value}
                        src={params.data.campaign_image || `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`;
                        }}
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                    />
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {params.value}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            <span>{params.data.ads_count} {params.data.ads_count > 1 ? 'ads' : 'ad'}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Status',
            field: 'adsets_status',
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
                                        const success = await handleAdsetsToggleStatus(params.data, newStatus);     
                                        if (!success) {                                    
                                            params.api.refreshCells({
                                                rowNodes: [params.node],
                                                force: true
                                            });
                                            return;
                                        } 
                                        params.api.applyTransaction({
                                            update: [{
                                                ...params.data,
                                                adsets_status: newStatus
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
                )
            }
        },
        {
            headerName: 'Start Date',
            field: 'adsets_start_time',
            filter: false,
            valueFormatter: (params) => {
                if (!params.value) return '-';
                const date = new Date(params.value);
                return date.toLocaleString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        },
        {
            headerName: 'End Date',
            field: 'adsets_end_time',
            filter: false,
            valueFormatter: (params) => {
                if (!params.value) return '-';
                const date = new Date(params.value);
                return date.toLocaleString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        },
        {
            headerName: 'Main Result',
            field: 'adsets_insights_results',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {params.value}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {CampaignData.campaign_result_type != null ? (
                                <span>
                                    {
                                        CampaignData.campaign_result_type === 'lead' ? 'On Facebook Leads' :
                                            CampaignData.campaign_result_type === 'link_click' ? 'Post Engagements' : `${CampaignData.campaign_result_type}`
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
            field: 'adsets_insights_cost_per_result',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {CampaignData.campaign_result_type != null ? (
                                <span>
                                    {
                                        CampaignData.campaign_result_type === 'lead' ? 'per on Facebook Leads' :
                                            CampaignData.campaign_result_type === 'link_click' ? 'Per Post Engagements' : `${CampaignData.campaign_result_type}`
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
            field: 'adsets_lifetime_budget',
            filter: false,
            valueGetter: (params) => {
                const { adsets_lifetime_budget, adsets_daily_budget, adsets_insights_spend } = params.data;

                if (adsets_lifetime_budget && parseFloat(adsets_lifetime_budget) > 0) {
                    return adsets_lifetime_budget;
                } else if (adsets_daily_budget && parseFloat(adsets_daily_budget) > 0) {
                    return adsets_daily_budget;
                } else if (adsets_insights_spend && parseFloat(adsets_insights_spend) > 0) {
                    return 0; // Budget unknown but spent — CBO likely
                } else {
                    return null;
                }
            },
            width: 160,
            cellRenderer: (params) => {
                const { adsets_lifetime_budget, adsets_daily_budget, adsets_insights_spend } = params.data;
                const isLifetime = adsets_lifetime_budget && parseFloat(adsets_lifetime_budget) > 0;
                const isDaily = !isLifetime && adsets_daily_budget && parseFloat(adsets_daily_budget) > 0;
                const isCBO = !isLifetime && !isDaily && adsets_insights_spend && parseFloat(adsets_insights_spend) > 0;

                let label = 'N/A';
                if (isLifetime) label = 'Lifetime';
                else if (isDaily) label = 'Daily';
                else if (isCBO) label = 'Campaign Level';

                return (
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ lineHeight: '1.2' }}>
                            <div className="fw-semibold text-truncate my-2">
                                {selectedAdPlatform?.currency === 'INR' ? '₹ ' : '$ '}
                                {Number(params.value || 0).toLocaleString()}
                            </div>
                            <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                                <span className={`badge ${isLifetime ? 'bg-success' : isDaily ? 'bg-primary' : 'bg-secondary'}`}>
                                    {label}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: 'Amount Spent',
            field: 'adsets_insights_spend',
            filter: false,
            cellRenderer: (params) => {
                const currencySymbol = selectedAdPlatform?.currency === 'INR' ? '₹ ' : '$ ';
                const spend = Number(params.value) || 0;

                const dailyBudget = Number(params.data.adsets_daily_budget) || 0;
                const lifetimeBudget = Number(params.data.adsets_lifetime_budget) || 0;

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
        // {
        //     headerName: 'CPP',
        //     field: 'adsets_insights_cpp',
        //     filter: false,
        //     cellRenderer: (params) => (
        //         <div className="d-flex align-items-center gap-2">
        //             <div style={{ lineHeight: '1.2' }}>
        //                 <div className="fw-semibold text-truncate my-2">
        //                     {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
        //                     {`${Number(params.value).toFixed(2).toLocaleString()}`}
        //                 </div>
        //             </div>
        //         </div>
        //     )
        // },
        {
            headerName: 'CPM',
            field: 'adsets_insights_cpm',
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
            field: 'adsets_insights_ctr',
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
            field: 'adsets_insights_cpc',
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
            field: 'adsets_insights_reach',
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
            field: 'adsets_insights_impressions',
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
            field: 'adsets_insights_actions',
            filter: false,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.adsets_insights_actions || '[]');
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
            field: 'adsets_insights_actions',
            filter: false,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.adsets_insights_actions || '[]');
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
            field: 'adsets_insights_clicks',
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
            field: 'adsets_insights_actions',
            filter: false,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.adsets_insights_actions || '[]');
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
            field: 'adsets_insights_actions',
            filter: false,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.adsets_insights_actions || '[]');
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
        // {
        //     headerName: 'Action',
        //     pinned: 'right',
        //     selectable: false, // ❌ disable row selection
        //     sortable: false,   // ❌ disable sorting
        //     filter: false,     // ❌ disable filtering
        //     cellRenderer: params => (
        //         <div className="rounded-circle d-flex align-items-center justify-content-center"
        //             style={{ width: '32px', height: '32px', backgroundColor: '#f1f1f1', cursor: 'pointer' }}
        //             onClick={(e) => { e.stopPropagation(); } }
        //         >
        //             <i className="fas fa-ellipsis-h text-secondary"></i>
        //         </div>
        //     ),
        //     width: 100
        // }
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
                        openAdsetsActionMenu(params); // Custom handler
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

    const adsCreativeColumns = [
        {
            headerName: 'AD',
            field: 'ads_name',
            pinned: 'left',
            width: 200,
            filter: false,
            cellRenderer: AdCellRenderer,
            cellRendererParams: {
                page_name: selectedAdPlatform,
                Campaign: CampaignData,
                AllAds: combinedAds
            }
        },
        {
            headerName: 'Status',
            field: 'ads_status',
            filter: false,
            sort: 'asc',
            width: 150,
            cellRenderer: (params) => {
                const isActive = params.value === 'ACTIVE';
                const isLoading = loadingRowId === params.data.id;
                return (
                    <div className="d-flex align-items-center justify-content-center my-2">
                        {isLoading ? (
                            <>
                                <i className="fas fa-spin fa-spinner" style={{ fontSize: '15px',marginRight:'5px' }}></i> wait... 
                            </>
                        ) : (
                            <div className="form-check form-switch d-flex align-items-center justify-content-center">
                                <input
                                    className={`form-check-input ${isActive ? 'switch-active' : 'switch-paused'}`}
                                    type="checkbox"
                                    role="switch"
                                    id={`status-switch-${params.data.id}`}
                                    checked={isActive}
                                    onChange={async (e) => {
                                        e.stopPropagation();
                                        const newStatus = e.target.checked ? 'ACTIVE' : 'PAUSED';
                                        const success = await handleAdsToggleStatus(params.data, newStatus);
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
                                                ads_status: newStatus
                                            }]
                                        }); 
                                    }}
                                />
                                <label
                                    className="form-check-label ms-2 my-auto"
                                    htmlFor={`status-switch-${params.data.id}`}
                                    style={{ fontSize: '0.8rem' }}
                                >
                                    <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
                                        {isActive ? 'Active' : 'Paused'}
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            headerName: 'Ad set Name',
            field: 'adsets_name',
            filter: false,
            cellRenderer: (params) => {
                const isActive = params.data.ads_effective_status === 'ACTIVE';
                return (
                    <div className="d-flex align-items-center gap-2">
                        <div style={{ lineHeight: '1.2' }}>
                            <strong className="my-2"> {`${(params.value).toLocaleString()}`} </strong>
                            <div className="small text-muted">
                                {/* <span className="badge bg-secondary">{params.data.ads_effective_status}</span> */}
                                <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
                                    {params.data.ads_effective_status}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            headerName: 'Main Result',
            field: 'adsets_insights_results',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {params.value}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {params.data.ads_result_type != null ? (
                                <span>
                                    {
                                        params.data.ads_result_type === 'lead' ? 'On Facebook Leads' :
                                            params.data.ads_result_type === 'link_click' ? 'Links Clicked' : `${params.data.ads_result_type}`
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
            field: 'ads_insights_cost_per_result',
            filter: false,
            cellRenderer: (params) => (
                <div className="d-flex align-items-center gap-2">
                    <div style={{ lineHeight: '1.2' }}>
                        <div className="fw-semibold text-truncate my-2">
                            {selectedAdPlatform != null && selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                            {`${Number(params.value).toLocaleString()}`}
                        </div>
                        <div className="d-flex align-items-center flex-wrap small text-muted mb-2">
                            {params.data.ads_result_type != null ? (
                                <span>
                                    {
                                        params.data.ads_result_type === 'lead' ? 'per on Facebook Leads' :
                                            params.data.ads_result_type === 'link_click' ? 'per links clicks' : `${params.data.ads_result_type}`
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
            field: 'ads_insights_spend',
            filter: false,
            cellRenderer: (params) => {
                const currencySymbol = selectedAdPlatform?.currency === 'INR' ? '₹ ' : '$ ';
                const spend = Number(params.value) || 0;

                const dailyBudget = Number(params.data.adsets_daily_budget) || 0;
                const lifetimeBudget = Number(params.data.adsets_lifetime_budget) || 0;

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
            headerName: 'CPM',
            field: 'ads_insights_cpm',
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
            field: 'ads_insights_ctr',
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
            field: 'ads_insights_cpc',
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
            field: 'ads_insights_reach',
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
            field: 'ads_insights_impressions',
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
            headerName: 'Post Engagements',
            field: 'ads_insights_actions',
            filter: false,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.ads_insights_actions || '[]');
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
            field: 'ads_insights_clicks',
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
            field: 'ads_insights_actions',
            filter: false,
            valueGetter: (params) => {
                try {
                    const actions = JSON.parse(params.data.ads_insights_actions || '[]');
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
            headerName: 'Action',
            pinned: 'right',
            selectable: false,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="action-button-wrapper"
                    onClick={(e) => {
                        e.stopPropagation();
                        openCreativeActionMenu(params); // Custom handler
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

    const formatNumberWithCommas = (number, locale = navigator.language) => {
        if (isNaN(number)) return number;
        return new Intl.NumberFormat(locale).format(number);
    };

    const handleDeleteSubmit = async (e) => {
        e.preventDefault();
        setDeleting(true);
        //console.log('dataToDelete: ', dataToDelete);
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const authToken = localStorage.getItem('authToken');
        
        try {
            let payload = {};
            if(dataToDelete.deleteType === 'adset'){
                payload = { 
                    deleteType: "adset",               
                    ids: dataToDelete.deleteData?.id,
                    socialUserid:dataToDelete.deleteData?.account_social_userid,
                    campaign: dataToDelete.deleteData?.adsets_campaign_id,
                    adsetsID: dataToDelete.deleteData?.adsets_id,                    
                };
            } else if(dataToDelete.deleteType === 'ads'){
                payload = { 
                    deleteType: "ads",               
                    ids: dataToDelete.deleteData?.id,
                    socialUserid:dataToDelete.deleteData?.account_social_userid,
                    campaign: dataToDelete.deleteData?.campaign_id,
                    adsetsID: dataToDelete.deleteData?.ads_id,
                };
            }

            const responseData = await fetch(`${BACKEND_URL}/api/delete-adsets-ads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify(payload)
            });

            const response = await responseData.json();
            if(response.success===true){                
                // if(dataToDelete.deleteType === 'adset'){
                //     setAdsets((prevAdsets) => {
                //         if (!prevAdsets) return [];
                //             return prevAdsets.filter(
                //             (adsets) => adsets.adsets_id !== dataToDelete.deleteData?.adsets_id
                //         );
                //     });
                    
                //     // const [combinedAds, setCombinedAds] = useState(null);
                //     setCombinedAds((prevAds) => {
                //         if (!prevAds) return [];
                //             return prevAds.filter(
                //             (prevAds) => prevAds.adsets_id !== dataToDelete.deleteData?.adsets_id
                //         );
                //     });
                // } else if(dataToDelete.deleteType === 'ads'){
                //     setCombinedAds((prevAdss) => {
                //         if (!prevAdss) return [];
                //             return prevAdss.filter(
                //             (prevAdss) => prevAdss.ads_id !== dataToDelete.deleteData?.ads_id
                //         );
                //     });                 
                //     setAdsetsAds((prevAds) => {
                //         if (!prevAds) return [];
                //             return prevAds.filter(
                //             (prevAds) => prevAds.ads_id !== dataToDelete.deleteData?.ads_id
                //         );
                //     });
                // }          
                await fetchCampaignDetails();
                setDataDeleteModal(false);
                setDeleting(false);
                setDataToDelete({ 
                    deleteType: '', 
                    deleteData: null
                });                
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
            toast.error(`Failed to delete ${dataToDelete.deleteType}.`, {
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

                <div className="page-body">

                    <div className="container-fluid">
                        <div className="page-title">
                            <div className="row">
                                <div className="col-12 col-sm-6">
                                    <h1 className='h1-heading'>Ad Campaign Details</h1>
                                </div>
                                <div className="col-7 col-sm-6 my-lg-3">
                                    {/* <ol className="breadcrumb">
                                        <li className="breadcrumb-item">Dashboard</li>
                                        <li className="breadcrumb-item">
                                            <Link to="/ads-campaign"> Ads Campaigns </Link>
                                        </li>
                                        <li className="breadcrumb-item active">Ad Campaign Details</li>
                                    </ol> */}
                                    {/* <div className=" my-2">
                                        {CampaignData && (
                                            <>
                                                {(CampaignData.campaign_effective_status === 'ACTIVE' || CampaignData.campaign_effective_status === 'PAUSED') && (
                                                    <div className="form-check form-switch d-flex justify-content-end">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            role="switch"
                                                            id={`status-switch-${CampaignData.campaign_id}`}
                                                            checked={CampaignData.campaign_effective_status === 'ACTIVE'}
                                                            onChange={(e) => {
                                                                e.stopPropagation(); 
                                                                const newStatus = e.target.checked ? 'ACTIVE' : 'PAUSED';
                                                                handleCampaignToggleStatus(CampaignData, newStatus);
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label ms-2"
                                                            htmlFor={`status-switch-${CampaignData.campaign_id}`}
                                                            style={{ fontSize: '0.8rem', lineHeight: '1.2' }}
                                                        >
                                                            <span className={`badge ${CampaignData.campaign_effective_status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                                {CampaignData.campaign_effective_status === 'ACTIVE' ? 'Active' : 'Paused'}
                                                            </span>
                                                        </label>
                                                    </div>
                                                )}

                                                {CampaignData.campaign_effective_status === 'COMPLETED' && (
                                                    <span className="text-success text-end w-100" style={{ lineHeight: '1.2' }}>
                                                        ✔ Completed
                                                    </span>
                                                )}

                                            </>
                                        )}
                                    </div> */}
                                   <div className="d-flex justify-content-end">
                                        <button 
                                            type="button" 
                                            className="btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center"
                                        >
                                            <i className="fa-solid fa-plus fs-5 me-2"></i> Create ad campaign
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-12 col-sm-12 col-md-12">

                                <div className="page-tabs-container position-relative mb-4">
                                    <ul className="nav nav-tabs ms-2 gap-2">
                                        {tabs.map((tab) => (
                                            <li key={tab.id} className="nav-item">
                                                <button className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                                                    onClick={() => setActiveTab(tab.id)}
                                                >
                                                    {tab.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="tab-pages mt-4 card">
                                        {tabs.map((tab) => (
                                            <div key={tab.id} className={`tab-page fade-in ${activeTab === tab.id ? '' : 'd-none'}`} >
                                                {CampaignData && Adsets && AdsetsAds && AdsCreatives ? (
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        {tab.id === 'overview' && CampaignData && (
                                                            <div className="campaign-details-wrapper" style={{ width: '100%', padding: '24px', borderRadius: '8px' }}>
                                                                <div className="d-flex justify-content-between align-items-center mb-4"> 
                                                                <div className='d-flex gap-2  align-items-center'>
                                                                    <div className="p-2 rounded-3 d-inline-flex align-items-center justify-content-center"
                                                                        style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7)' }}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                                            strokeLinecap="round" strokeLinejoin="round" className="text-white"
                                                                        >
                                                                            <circle cx="12" cy="12" r="10"></circle>
                                                                            <circle cx="12" cy="12" r="6"></circle>
                                                                            <circle cx="12" cy="12" r="2"></circle>
                                                                        </svg>
                                                                    </div>
                                                                    <h5 className=" fw-bold text-dark">Campaign Details </h5>

                                                                </div>
                                                                
                                                            {/* active btn  */}
                                                             <div className=" my-2">
                                                                {CampaignData && (
                                                                    <>
                                                                        {(CampaignData.campaign_effective_status === 'ACTIVE' || CampaignData.campaign_effective_status === 'PAUSED') && (
                                                                            <>
                                                                                {loadingRowId ? ( 
                                                                                    <>                                                                          
                                                                                        <i className="fas fa-spin fa-spinner" style={{ fontSize: '15px',marginRight:'5px' }}></i> wait... 
                                                                                    </>                                                                           
                                                                                ) : (   
                                                                                    <div className="form-check form-switch d-flex justify-content-end">
                                                                                        <input
                                                                                            className="form-check-input"
                                                                                            type="checkbox"
                                                                                            role="switch"
                                                                                            id={`status-switch-${CampaignData.campaign_id}`}
                                                                                            checked={CampaignData.campaign_effective_status === 'ACTIVE'}
                                                                                            onChange={ async (e) => {
                                                                                                e.stopPropagation(); // prevent grid row selection
                                                                                                const newStatus = e.target.checked ? 'ACTIVE' : 'PAUSED';
                                                                                                const success = await handleCampaignToggleStatus(CampaignData, newStatus);
                                                                                            }}
                                                                                        />
                                                                                        <label
                                                                                            className="form-check-label ms-2"
                                                                                            htmlFor={`status-switch-${CampaignData.campaign_id}`}
                                                                                            style={{ fontSize: '0.8rem', lineHeight: '1.2' }}
                                                                                        >
                                                                                            <span className={`badge ${CampaignData.campaign_effective_status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                                                                {CampaignData.campaign_effective_status === 'ACTIVE' ? 'Active' : 'Paused'}
                                                                                            </span>
                                                                                        </label>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}

                                                                        {CampaignData.campaign_effective_status === 'COMPLETED' && (
                                                                            <span className="text-success text-end w-100" style={{ lineHeight: '1.2' }}>
                                                                                ✔ Completed
                                                                            </span>
                                                                        )}

                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* active btn  */}

                                                                </div>

                                                                <div className="row g-2 mb-4">
                                                                    <div className="col-md-4">
                                                                        <h6 className="">Campaign:</h6>
                                                                        <p className="mb-0">{CampaignData.campaign_name || 'N/A'}</p>
                                                                        <p className='mb-0'>ID: {CampaignData.campaign_id}</p>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <h6 className="">Objective</h6>
                                                                        <p className="mb-0">Main :&nbsp;
                                                                            {
                                                                                CampaignData.campaign_objective === 'OUTCOME_TRAFFIC' ? 'Traffic' :
                                                                                    CampaignData.campaign_objective === 'OUTCOME_LEADS' ? 'Leads' :
                                                                                        CampaignData.campaign_objective === 'OUTCOME_ENGAGEMENT' ? 'Engagements' :
                                                                                            CampaignData.campaign_objective === 'OUTCOME_AWARENESS' ? 'Awareness' :
                                                                                                CampaignData.campaign_objective === 'OUTCOME_APP_PROMOTION' ? 'App Promotion' :
                                                                                                    CampaignData.campaign_objective === 'OUTCOME_MESSAGES' ? 'Messages' :
                                                                                                        CampaignData.campaign_result_type !== null ? CampaignData.campaign_result_type : 'Sales'
                                                                            }
                                                                        </p>
                                                                        <p className="mb-0">Optimization :&nbsp;
                                                                            {
                                                                                CampaignData.campaign_objective === 'OUTCOME_TRAFFIC' ? 'Traffic' :
                                                                                    CampaignData.campaign_objective === 'OUTCOME_LEADS' ? 'Leads' :
                                                                                        CampaignData.campaign_objective === 'OUTCOME_ENGAGEMENT' ? 'Engagements' :
                                                                                            CampaignData.campaign_objective === 'OUTCOME_AWARENESS' ? 'Awareness' :
                                                                                                CampaignData.campaign_objective === 'OUTCOME_APP_PROMOTION' ? 'App Promotion' :
                                                                                                    CampaignData.campaign_objective === 'OUTCOME_MESSAGES' ? 'Messages' :
                                                                                                        CampaignData.campaign_result_type !== null ? CampaignData.campaign_result_type : 'Sales'
                                                                            }
                                                                            {/* {CampaignData.campaign_objective || 'N/A'} */}
                                                                        </p>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <h6 className="">Duration</h6>
                                                                        {CampaignData.campaign_effective_status === 'ACTIVE' && (
                                                                            <p className="mb-0">🏃‍♂️ Active: This campaign is currently running.</p>
                                                                        )}

                                                                        {CampaignData.campaign_effective_status === 'PAUSED' && (
                                                                            <p className="mb-0">⏸ Paused: This campaign is currently paused.<br />
                                                                                {CampaignData.duration_days && (
                                                                                    <span>It has run for <strong>{CampaignData.duration_days}</strong> days so far.</span>
                                                                                )}
                                                                            </p>
                                                                        )}

                                                                        {CampaignData.campaign_effective_status === 'COMPLETED' && (
                                                                            <p className="mb-0">✔ <strong>Completed:</strong> This campaign ended after <strong>{CampaignData.duration_days || 'N/A'}</strong> days.</p>
                                                                        )}

                                                                        {['DELETED', 'ARCHIVED', 'IN_PROCESS', 'WITH_ISSUES'].includes(CampaignData.campaign_effective_status) && (
                                                                            <p className="text-danger mb-0">🛑 <strong>Inactive:</strong> This campaign is not currently running.</p>
                                                                        )}
                                                                    </div>


                                                                    <div className="col-md-4">
                                                                        <h6 className="">Dates</h6>
                                                                        <p className="mb-0">Start :&nbsp;
                                                                            {CampaignData.campaign_start_time
                                                                                ? new Date(CampaignData.campaign_start_time).toLocaleString('en-IN', {
                                                                                    weekday: 'short',
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })
                                                                                : 'N/A'
                                                                            }
                                                                        </p>
                                                                        <p className="mb-0">End :&nbsp;
                                                                            {CampaignData.campaign_end_time
                                                                                ? new Date(CampaignData.campaign_end_time).toLocaleString('en-IN', {
                                                                                    weekday: 'short',
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })
                                                                                : 'Not Set (Ongoing)'
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <h6 className="">Budget</h6>
                                                                        {CampaignData.campaign_lifetime_budget > CampaignData.campaign_daily_budget ? (
                                                                            <div>
                                                                                <p className="mb-0">
                                                                                    {selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                                                                                    {Number(CampaignData.campaign_lifetime_budget).toLocaleString() || '0.00'}
                                                                                </p>
                                                                                <small className="text-muted">Lifetime Budget</small>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <p className="mb-0">
                                                                                    {selectedAdPlatform.currency === 'INR' ? '₹ ' : '$ '}
                                                                                    {Number(CampaignData.campaign_daily_budget).toLocaleString() || '0.00'}
                                                                                </p>
                                                                                <small className="text-muted">Daily Budget</small>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <h6 className="">Amount Spent</h6>

                                                                        {/* Currency + Spend Display */}
                                                                        <p className="mb-1 ">
                                                                            {selectedAdPlatform.currency === 'INR' ? '₹' : '$'}
                                                                            {Number(CampaignData.campaign_insights_spend || 0).toLocaleString()}
                                                                        </p>

                                                                        {/* Budget Calculation */}
                                                                        {(() => {
                                                                            const spend = Number(CampaignData.campaign_insights_spend) || 0;
                                                                            const lifetimeBudget = Number(CampaignData.campaign_lifetime_budget) || 0;
                                                                            const dailyBudget = Number(CampaignData.campaign_daily_budget) || 0;

                                                                            const totalBudget = lifetimeBudget > 0 ? lifetimeBudget : dailyBudget;
                                                                            const percent = totalBudget > 0 ? Math.min((spend / totalBudget) * 100, 100) : 0;

                                                                            return (
                                                                                <>
                                                                                    <div className="progress" style={{ height: '12px', width: '250px' }}>
                                                                                        <div
                                                                                            className="progress-bar bg-warning"
                                                                                            role="progressbar"
                                                                                            style={{ width: `${percent.toFixed(1)}%` }}
                                                                                            aria-valuenow={percent}
                                                                                            aria-valuemin="0"
                                                                                            aria-valuemax="100"
                                                                                        ></div>
                                                                                    </div>
                                                                                    {lifetimeBudget > 0 ? (
                                                                                        <small className="text-muted">{percent.toFixed(1)}% of total budget used</small>
                                                                                    ) : (
                                                                                        <small className="text-muted">{percent.toFixed(1)}% of budget (estimated)</small>
                                                                                    )}

                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <h6 className="">Campaign Created In</h6>
                                                                        <p className="mb-0">Outside InsocialWise</p>
                                                                        <p className="text-muted mb-0">
                                                                            on &nbsp;
                                                                            {CampaignData.campaign_start_time
                                                                                ? new Date(CampaignData.campaign_start_time).toLocaleString('en-IN', {
                                                                                    weekday: 'short',
                                                                                    day: '2-digit',
                                                                                    month: 'short',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })
                                                                                : 'N/A'
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="row g-4 performance-metrics-ican">
                                                                    <h6>Performance Metrics</h6>

                                                                    <div className='col-12 pb-3'>
                                                                        <div className="d-flex gap-2 w-100" style={{
                                                                            overflowX: "auto",
                                                                            overflowY: "hidden",
                                                                            whiteSpace: "nowrap",
                                                                            WebkitOverflowScrolling: "touch",
                                                                            scrollbarWidth: "thin"
                                                                        }}>
                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgba(239,246,255,0.6), rgba(236,254,255,0.6))"
                                                                            }}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none"
                                                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                                                    className="text-primary mx-auto">
                                                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                                    <circle cx="9" cy="7" r="4" />
                                                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">{formatNumberWithCommas(CampaignData.campaign_insights_results) || 0}</h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Main Result</p>
                                                                            </div>
                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgba(250,245,255,0.6), rgba(253,242,248,0.6))"
                                                                            }}>
                                                                               <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#facc15", // yellow color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <line x1="12" y1="2" x2="12" y2="22" />
                                                                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    {selectedAdPlatform?.currency === 'INR' ? '₹ ' : '$ '}
                                                                                    {formatNumberWithCommas(CampaignData.campaign_insights_cost_per_result) || 0}
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>CPR</p>
                                                                            </div>
                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgba(238,242,255,0.6), rgba(245,243,255,0.6))"
                                                                            }}>
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#6366f1", // indigo color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <path d="M12.586 12.586 19 19"></path>
                                                                                    <path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 15.999a.501.501 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"></path>
                                                                                </svg>
                                                                                <h6 className="fw-bold">{formatNumberWithCommas(CampaignData.campaign_insights_ctr) || '0.00'}%</h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>CTR</p>
                                                                            </div>
                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgb(191 247 208 / 45%), rgba(236,253,245,0.6))"
                                                                            }}>
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#a855f7", // purple color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                                                                    <polyline points="16 7 22 7 22 13"></polyline>
                                                                                </svg>
                                                                                <h6 className="fw-bold">{formatNumberWithCommas(CampaignData.campaign_insights_impressions) || 0}</h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Impressions</p>

                                                                            </div>
                                                                            <div className='performance-metrics-card p-2'>
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#2563eb", // blue color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                                </svg>
                                                                                <h6 className="fw-bold">{formatNumberWithCommas(CampaignData.campaign_insights_reach) || 0}</h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Reach</p>

                                                                            </div>
                                                                            <div className="performance-metrics-card p-2" style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgba(255,247,237,0.6), rgba(254,242,242,0.6))"
                                                                            }}>
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        width: "20px",
                                                                                        height: "20px",
                                                                                        stroke: "#f97316", // orange
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto 0.25rem auto"
                                                                                    }}
                                                                                >
                                                                                    <circle cx="18" cy="5" r="3"></circle>
                                                                                    <circle cx="6" cy="12" r="3"></circle>
                                                                                    <circle cx="18" cy="19" r="3"></circle>
                                                                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                                                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                                                                </svg>

                                                                                <h6 className="fw-bold"> 15.4k</h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Clicks</p>
                                                                            </div>

                                                                            <div className="performance-metrics-card p-2">
                                                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        width: "20px",
                                                                                        height: "20px",
                                                                                        stroke: "#22c55e", // green color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                                                                </svg>

                                                                                <h6 className="fw-bold"> 8.4%</h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Engagement</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgb(254 249 195 / 40%), rgb(255 237 213 / 26%))"
                                                                            }}
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#facc15", // yellow color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <line x1="12" y1="2" x2="12" y2="22" />
                                                                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    234
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Conversions</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2'>

                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#e11d48", // rose color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                                                                    <line x1="2" y1="10" x2="22" y2="10" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    $0.00
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>CPC</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgb(222 245 240 / 69%), rgb(236 254 255)))"
                                                                            }}>


                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#0d9488", // teal color
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                                                                                    <path d="M18 17V9" />
                                                                                    <path d="M13 17V5" />
                                                                                    <path d="M8 17v-3" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    $0.00
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>CPM</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgba(236, 253, 245, 0.6), rgba(240, 253, 244, 0.6))"
                                                                            }}>


                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#059669", // emerald green
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                                                                    <polyline points="16 7 22 7 22 13" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    0x
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>ROAS</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgba(239,246,255,0.6), rgba(236,254,255,0.6))"
                                                                            }}>


                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#7c3aed", // violet
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                                                                    <rect x="2" y="6" width="14" height="12" rx="2" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    0x
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Video Views</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2'>


                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#0284c7", // sky blue
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <circle cx="18" cy="5" r="3"></circle>
                                                                                    <circle cx="6" cy="12" r="3"></circle>
                                                                                    <circle cx="18" cy="19" r="3"></circle>
                                                                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                                                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    0
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Shares</p>
                                                                            </div>

                                                                            <div className='performance-metrics-card p-2' style={{
                                                                                minWidth: "90px",
                                                                                background: "linear-gradient(to right, rgb(254 249 195 / 40%), rgb(255 237 213 / 26%))"
                                                                            }} >



                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    viewBox="0 0 24 24"
                                                                                    style={{
                                                                                        stroke: "#d97706", // amber
                                                                                        fill: "none",
                                                                                        strokeWidth: 2,
                                                                                        strokeLinecap: "round",
                                                                                        strokeLinejoin: "round",
                                                                                        display: "block",
                                                                                        margin: "0 auto"
                                                                                    }}
                                                                                >
                                                                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                                                                </svg>
                                                                                <h6 className="fw-bold text-dark">
                                                                                    0
                                                                                </h6>
                                                                                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Saves</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {/* <div className="col-md-1 card p-2 text-center">
                                                                        <div className='performance-metrics-card'>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"
                                                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                                                className="mb-2 text-primary mx-auto">
                                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                                <circle cx="9" cy="7" r="4" />
                                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                                            </svg>
                                                                            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Main Result</p>
                                                                            <h6 className="fw-bold text-dark">{formatNumberWithCommas(CampaignData.campaign_insights_results) || 0}</h6>
                                                                            <small className="text-muted mb-0">
                                                                                {
                                                                                    CampaignData.campaign_result_type === 'lead' ? 'Leads' :
                                                                                        CampaignData.campaign_result_type === 'link_click' ? 'Post Engagements' :
                                                                                            CampaignData.campaign_result_type || 'Result'
                                                                                }
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-2 card p-2 text-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                            className="mb-2 text-warning mx-auto" width="24" height="24" fill="none" stroke="currentColor"
                                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                                                                        </svg>

                                                                        <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Cost per Result</p>
                                                                        <h6 className="fw-bold text-dark">
                                                                            {selectedAdPlatform?.currency === 'INR' ? '₹ ' : '$ '}
                                                                            {formatNumberWithCommas(CampaignData.campaign_insights_cost_per_result) || 0}
                                                                        </h6>
                                                                        <small className="text-muted mb-0">per &nbsp;
                                                                            {
                                                                                CampaignData.campaign_result_type === 'lead' ? 'lead' :
                                                                                    CampaignData.campaign_result_type === 'link_click' ? 'post engagement' :
                                                                                        CampaignData.campaign_result_type || 'Result'
                                                                            }
                                                                        </small>
                                                                    </div>
                                                                    <div className="col-md-2 card card-body mx-2 text-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                            className="mb-2 text-success mx-auto" width="24" height="24" fill="none" stroke="currentColor"
                                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 3h18v18H3z" />
                                                                            <path d="M8 14l3-3 2 2 4-4" />
                                                                        </svg>
                                                                        <h6 className="text-muted" style={{ fontSize: '12px' }}>CTR</h6>
                                                                        <h6 className="fw-bold">{formatNumberWithCommas(CampaignData.campaign_insights_ctr) || '0.00'}%</h6>
                                                                    </div>
                                                                    <div className="col-md-2 card card-body mx-2 text-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                            className="mb-2 text-rose mx-auto" width="24" height="24" fill="none" stroke="currentColor"
                                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <circle cx="12" cy="12" r="4" />
                                                                        </svg>
                                                                        <h6 className="text-muted">Impressions</h6>
                                                                        <h6 className="fw-bold">{formatNumberWithCommas(CampaignData.campaign_insights_impressions) || 0}</h6>
                                                                    </div>
                                                                    <div className="col-md-2 card card-body mx-2 text-center">
                                                                        <svg xmlns="http://www.w3.org/2000/svg"
                                                                            className="mb-2 text-info mx-auto" width="24" height="24" fill="none" stroke="currentColor"
                                                                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                                                                            <circle cx="12" cy="12" r="3" />
                                                                        </svg>
                                                                        <h6 className="text-muted">Reach</h6>
                                                                        <h6 className="fw-bold">{formatNumberWithCommas(CampaignData.campaign_insights_reach) || 0}</h6>
                                                                    </div> */}
                                                                </div>

                                                                <div className='row mt-4'>
                                                                    {/* <hr className="my-4" /> */}

                                                                    <div className='col-md-6'>
                                                                        <h6 className="mb-2">Placements</h6>
                                                                        <p className="text-muted">
                                                                            This campaign is using automatic placements.<br />
                                                                            Facebook’s delivery system will allocate budget across placements based on performance.
                                                                        </p>
                                                                    </div>

                                                                    {/* <hr className="my-4" /> */}

                                                                    <div className='col-md-6'>
                                                                        <h6 className="mb-2">Audience</h6>
                                                                        <div className="row">
                                                                            <div className="col-md-12">

                                                                                <div className="row my-2">
                                                                                    <div className="col-5 col-md-4">
                                                                                        <div className="text-start">Age Range</div>
                                                                                    </div>
                                                                                    <div className="col-2 col-md-4 text-center">
                                                                                        <span className="text-end">:</span>
                                                                                    </div>
                                                                                    <div className="col-5  col-md-4">
                                                                                        <p className="badge bg-info p-1 text-center m-0">{`${CampaignData.campaign_audience_age_range} years old` || 'N/A'}</p>
                                                                                    </div>
                                                                                </div>


                                                                                {/* <div className='d-flex d-flex gap-4 align-items-center mb-2'> 
                                                                                        <div> <strong className="text-start">Age Range</strong> </div> 
                                                                                        <div> <span className="text-end">:</span> </div>
                                                                                        <div> <p className="badge bg-info p-1 text-center m-0">{`${CampaignData.campaign_audience_age_range} years old` || 'N/A'}</p> </div>
                                                                                    </div>

                                                                                     <div className='d-flex d-flex gap-4 align-items-center  mb-2'> 
                                                                                        <div> <strong className="text-start">Countries</strong> </div> 
                                                                                        <div> <span className="text-end">:</span> </div>
                                                                                        <div> <p className="badge bg-info p-1 text-center m-0">{CampaignData.campaign_audience_countries || 'N/A'}</p> </div>
                                                                                    </div> */}
                                                                                <div className="row my-2">
                                                                                    <div className="col-5 col-md-4">
                                                                                        <div className="text-start">Countries</div>
                                                                                    </div>
                                                                                    <div className="col-2 col-md-4 text-center">
                                                                                        <span className="text-end">:</span>
                                                                                    </div>
                                                                                    <div className="col-5 col-md-4">
                                                                                        <p className="badge bg-info p-1 text-center m-0">{CampaignData.campaign_audience_countries || 'N/A'}</p>
                                                                                    </div>
                                                                                </div>

                                                                                {/* <div className='d-flex d-flex gap-4 align-items-center  mb-2'> 
                                                                                        <div> <strong className="text-start">Gender</strong> </div> 
                                                                                        <div> <span className="text-end">:</span> </div>
                                                                                        <div>  <p className="badge bg-info p-1 text-center m-0">{CampaignData.campaign_audience_gender || 'N/A'}</p> </div>
                                                                                    </div> */}
                                                                                <div className="row my-2">
                                                                                    <div className="col-5 col-md-4 ">
                                                                                        <div className="text-start">Gender</div>
                                                                                    </div>
                                                                                    <div className="col-2 col-md-4 text-center">
                                                                                        <span className="text-end">:</span>
                                                                                    </div>
                                                                                    <div className="col-5 col-md-4">
                                                                                        <p className="badge bg-info p-1 text-center m-0">{CampaignData.campaign_audience_gender || 'N/A'}</p>
                                                                                    </div>
                                                                                </div>

                                                                            </div>
                                                                            {/* <div className="col-md-8"></div> */}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {tab.id === 'adsets' && Adsets && (
                                                            <div className="ag-theme-alpine grid-wrapper" style={{ width: '100%', overflow: 'hidden' }}>
                                                                <div style={{ height: '400px', width: '100%' }}>
                                                                    <AgGridReact
                                                                        rowData={Adsets}
                                                                        columnDefs={adsetsColumns}
                                                                        defaultColDef={{
                                                                            sortable: true,
                                                                            resizable: true,
                                                                            filter: true
                                                                        }}
                                                                        getRowId={(params) => params.data.id.toString()}
                                                                        getRowClass={(params) => {
                                                                            return params.node.rowIndex % 2 === 0 ? 'table-row-striped' : '';
                                                                        }}
                                                                        rowHeight={80}
                                                                        domLayout="normal"
                                                                        suppressHorizontalScroll={false}
                                                                        rowSelection="multiple"
                                                                    />
                                                                </div>
                                                                {actionMenu.visible && (
                                                                    <div className="dropdown-menu show p-2 rounded-3 border-0"
                                                                        style={{
                                                                            position: 'fixed',
                                                                            top: actionMenu.y,
                                                                            left: actionMenu.x,
                                                                            zIndex: 9999,
                                                                            minWidth: '160px',
                                                                            background: '#fff',
                                                                            border: '1px solid #ddd',
                                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseLeave={closeAdsetsActionMenu}
                                                                    >
                                                                        <button className="dropdown-item rounded-3 border-0 mb-1" onClick={() => handleEdit('adset', actionMenu.data, CampaignData)}>
                                                                            <i className="fas fa-pencil me-2"></i> &nbsp; Edit
                                                                        </button>
                                                                        <button className="dropdown-item text-danger rounded-3 border-0" onClick={() => handleDelete('adset', actionMenu.data)}>
                                                                            <i className="fas fa-trash me-2"></i> &nbsp; Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {tab.id === 'adsets_ads' && AdsetsAds && AdsCreatives && (
                                                            <div className="ag-theme-alpine grid-wrapper" style={{ width: '100%', overflow: 'hidden' }}>
                                                                <div style={{ height: '400px', width: '100%' }}>
                                                                    <AgGridReact
                                                                        rowData={combinedAds}
                                                                        columnDefs={adsCreativeColumns}
                                                                        defaultColDef={{
                                                                            sortable: true,
                                                                            resizable: true,
                                                                            filter: true
                                                                        }}
                                                                        getRowId={(params) => params.data.id.toString()}
                                                                        getRowClass={(params) => {
                                                                            return params.node.rowIndex % 2 === 0 ? 'table-row-striped' : '';
                                                                        }}
                                                                        rowHeight={80}
                                                                        domLayout="normal"
                                                                        suppressHorizontalScroll={false}
                                                                        rowSelection="multiple"
                                                                    />
                                                                </div>
                                                                {actionMenu.visible && (
                                                                    <div className="dropdown-menu show p-2 rounded-3 border-0"
                                                                        style={{
                                                                            position: 'fixed',
                                                                            top: actionMenu.y,
                                                                            left: actionMenu.x,
                                                                            zIndex: 9999,
                                                                            minWidth: '160px',
                                                                            background: '#fff',
                                                                            border: '1px solid #ddd',
                                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseLeave={closeCreativeActionMenu}
                                                                    >
                                                                        <button className="dropdown-item rounded-3 border-0 mb-1" onClick={() => handleEdit('ad', actionMenu.data)}>
                                                                            <i className="fas fa-pencil me-2"></i> &nbsp; Edit
                                                                        </button>
                                                                        <button className="dropdown-item text-danger rounded-3 border-0 " onClick={() => handleDelete('ads', actionMenu.data)}>
                                                                            <i className="fas fa-trash me-2"></i> &nbsp; Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                <AdEditModal
                                                                    show={showEditModal}
                                                                    onClose={handleCloseModal}
                                                                    adData={adSelectedData}
                                                                    CampData={CampaignData}
                                                                    AdAccount={selectedAdPlatform}
                                                                    AllAds={combinedAds}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center" style={{ height: '400px', justifyContent: 'center' }}>
                                                        <i className="fas fa-spin fa-spinner" style={{ fontSize: '25px' }}></i>
                                                        <p className="my-auto ms-2">Please wait, fetching campaign data...</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    {/* Delete confirmation modal */}
                        {dataDeleteModal && dataToDelete && (
                            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                                <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '600px', width: '100%' }}>
                                    <h5>Delete confirmation</h5>
                                    <hr />
                                    <p className="mb-2">
                                        <span className='text-danger'>Are you sure you want to delete {dataToDelete.deleteType}:</span> <strong>"{dataToDelete.deleteType === 'adset'
                                            ? dataToDelete.deleteData?.adsets_name
                                            : dataToDelete.deleteType === 'ads'
                                            ? dataToDelete.deleteData?.ads_name
                                            : ''}
                                        "</strong>?
                                    </p>                          
                                    
                                    <form onSubmit={handleDeleteSubmit}>
                                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                            <button type="button" className="btn btn-secondary" onClick={() => setDataDeleteModal(false)} disabled={deleting}>
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
                </div>
                <Footer />
            </div>
        </div>
    )
}