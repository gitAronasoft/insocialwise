import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import AdEditModal from './AdEditModal';

const AdPreviewRenderer = ({ value, data, page_name, Campaign, AllAds }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [tooltipPos, setTooltipPos] = useState(null);
    const ref = useRef(null);
    const timer = useRef(null);

    const creative = data.creative || {};
    const pageName = page_name.account_name || 'Business Page Name';
    const headline = creative.headline || 'Sponsored Ad';
    const body = creative.body || 'This is a sample Facebook ad description.';
    let ctaText = 'Learn More';

    try {
        const rawCTA = creative.call_to_action;
        if (typeof rawCTA === 'string') {
            ctaText = JSON.parse(rawCTA).replace(/_/g, ' ')
                        .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        }
    } catch {}

    let imageUrl = `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`;
    try {
        const { creative_type, image_urls, video_thumbnails } = creative;
        const tryParse = (data) => {
            try {
                let parsed = data;
                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                if (typeof parsed === 'string') parsed = JSON.parse(parsed); // double parse if needed
                return parsed;
            } catch {
                return data;
            }
        };
        if (creative_type === 'carousel') {
            const parsed = JSON.parse(image_urls);
            console.log("crousel",parsed);
            if (Array.isArray(parsed)) {
                imageUrl = parsed[0]?.image_url || parsed[0] || imageUrl;
            }
        } else if (creative_type === 'video') {
            const parsed = JSON.parse(video_thumbnails);
            if (typeof parsed === 'string') {
                imageUrl = parsed;
            }
        } else if (creative_type === 'image') {
            const parsed = tryParse(image_urls);
            if (typeof parsed === 'string') {
                imageUrl = parsed;
            }
        }
    } catch (err) {
        console.warn('⚠️ Error parsing creative image URL:', err);
    }

    const showTooltip = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setTooltipPos({
                top: rect.top + window.scrollY - 280,
                left: rect.right + window.scrollX + 15
            });
        }
        clearTimeout(timer.current);
        setIsHovered(true);
    };

    const hideTooltip = () => {
        timer.current = setTimeout(() => {
            setIsHovered(false);
        }, 200);
    };

    const cancelHide = () => {
        clearTimeout(timer.current);
        setIsHovered(true);
    };

    const handleEditClick = () => {
        setShowEditModal(true);
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
    };

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <>
            <div ref={ref} className="d-flex align-items-center p-1" style={{ cursor: 'pointer' }}
                onMouseEnter={showTooltip} onMouseLeave={hideTooltip}
            >
                <img src={imageUrl} alt={value} style={{ width: 60, height: 60, borderRadius: '10%', objectFit: 'cover' }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`;
                    }}
                />
                <div style={{lineHeight:"1.2"}} className="ms-2">
                    <strong>{value}</strong>
                    <div className="small text-muted">
                        <span className="badge bg-info">
                            <small>{creative.creative_type != null ? creative.creative_type:"Unknown"}</small>
                        </span>
                    </div>
                </div>
            </div>

            {/* Tooltip Preview */}
            {isHovered && tooltipPos &&
                ReactDOM.createPortal(
                    <div
                        onMouseEnter={cancelHide}
                        onMouseLeave={hideTooltip}
                        style={{
                            position: 'absolute',
                            top: tooltipPos.top,
                            left: tooltipPos.left,
                            width: 320,
                            borderRadius: 10,
                            backgroundColor: '#fff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                            fontFamily: 'Helvetica, Arial, sans-serif',
                            zIndex: 9999
                        }}
                    >
                        {/* Page Info */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '12px' }}>
                            <img src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt="Page"
                                style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 10 }}
                            />
                            <div>
                                <div style={{ fontWeight: 600 }}>{pageName}</div>
                                <div style={{ fontSize: 12, color: '#65676b' }}>
                                    Sponsored <span style={{ fontSize: 10 }}>·</span> <i className="fas fa-globe"></i>
                                </div>
                            </div>
                            <div onClick={handleEditClick}
                                style={{ marginLeft: 'auto', cursor: 'pointer', borderRadius: '50%', padding: 4, backgroundColor: '#f0f2f5' }}
                            >
                                <i className="fas fa-pencil mx-1"></i>
                            </div>
                        </div>

                        {/* Ad Image */}
                        <div style={{ width: '100%', height: 180, backgroundColor: '#ccc', position: 'relative', overflow: 'hidden', }}>
                            <img src={imageUrl} alt="Ad Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {creative?.creative_type === 'video' && (
                                <div className="video-thumbnail" >
                                    <i className="fas fa-play" />
                                </div>
                            )}
                        </div>

                        {/* Ad Content */}
                        <div style={{ padding: '12px' }}>
                            <h5 style={{ fontSize: '1rem', fontWeight: 600 }}>{headline}</h5>
                            <p style={{ fontSize: '0.875rem', color: '#050505' }}>
                                {body.length > 120 ? `${body.slice(0, 120)}...` : body}
                            </p>
                            <button
                                style={{
                                    backgroundColor: '#1877f2',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 16px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {ctaText}
                            </button>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Edit Modal Placeholder */}
            <AdEditModal 
                show={showEditModal} 
                onClose={handleCloseModal} 
                adData={data} 
                CampData={Campaign} 
                AdAccount={page_name} 
                AllAds={AllAds}
            />
        </>
    );
};

export default AdPreviewRenderer;
