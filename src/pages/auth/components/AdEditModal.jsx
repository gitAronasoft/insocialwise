import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import EmojiPicker from 'emoji-picker-react';
import Carousel from 'react-multi-carousel';

const AdEditModal = ({ show, onClose, adData, CampData, AdAccount, AllAds }) => {
    const [adName, setAdName] = useState('');
    const [headline, setHeadline] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [pageName, setPageName] = useState('');
    const [pageImage, setPageImage] = useState('');

    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);
    const [postContent, setPostContent] = useState(null); 
    const maxCharacters = 2000;
    const textareaRef = useRef(null);
    const [emojiPicker, setEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);

    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        if (adData && AllAds?.length) {
            const index = AllAds.findIndex(ad => ad.ads_id === adData.ads_id);
            if (index !== -1) setCurrentAdIndex(index);
        }
    }, [adData, AllAds]);

    const handlePrevAd = () => {
        if (currentAdIndex > 0) {
            setCurrentAdIndex(prev => prev - 1);
        }
    };

    const handleNextAd = () => {
        if (currentAdIndex < AllAds.length - 1) {
            setCurrentAdIndex(prev => prev + 1);
        }
    };

    useEffect(() => {
        if (!AllAds?.length) return;

        const selectedAd = AllAds[currentAdIndex];
        if (selectedAd) {
            // reuse existing code inside here
            setPageName(selectedAd.creative?.socialPage?.pageName || 'Business page');
            setPageImage(selectedAd.creative?.socialPage?.page_picture || '');
            setPostContent(selectedAd.creative?.body || '');
            setHeadline(selectedAd.creative?.headline || '');
            setAdName(selectedAd.ads_name || '');
            setWebsiteUrl(selectedAd.creative?.website_url || 'example.com');

            // Call-to-action parsing
            try {
                const raw = selectedAd.creative?.call_to_action;

                if (!raw) {
                    setCallToAction('LEARN_MORE');
                } else if (typeof raw === 'string') {
                    // Handle plain string like "LEARN_MORE" or quoted string like "\"LEARN_MORE\""
                    let parsed = raw;

                    try {
                        const maybeParsed = JSON.parse(raw);
                        if (typeof maybeParsed === 'string') {
                            parsed = maybeParsed;
                        }
                    } catch {
                        // Not a JSON string, treat raw as final string
                    }

                    setCallToAction(parsed);
                } else {
                    // raw is not a string (e.g., object)
                    setCallToAction('LEARN_MORE');
                }
            } catch (err) {
                console.warn('⚠️ Failed to parse call_to_action:', err);
                setCallToAction('LEARN_MORE');
            }


            // Media URL setup (image, video, carousel)
            let imageUrl = `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`;
            try {
                const { creative_type, image_urls, video_thumbnails } = selectedAd.creative;
                const tryParse = (data) => {
                    try {
                        let parsed = data;
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                        return parsed;
                    } catch {
                        return data;
                    }
                };
                if (creative_type === 'carousel') {
                    const parsed = JSON.parse(image_urls);
                    if (Array.isArray(parsed)) imageUrl = parsed[0]?.image_url || parsed[0] || imageUrl;
                } else if (creative_type === 'video') {
                    const parsed = JSON.parse(video_thumbnails);
                    if (typeof parsed === 'string') imageUrl = parsed;
                } else if (creative_type === 'image') {
                    const parsed = tryParse(image_urls);
                    if (typeof parsed === 'string') imageUrl = parsed;
                }
            } catch (err) {
                console.warn('⚠️ Error parsing creative image URL:', err);
            }

            setMediaUrl(imageUrl);
        }
    }, [currentAdIndex, AllAds]);

    useEffect(() => {
        if (!show) {
            // optional reset (not strictly needed unless you want to force a clean modal)
            setCurrentAdIndex(0);
        }
    }, [show]);


    const [callToAction, setCallToAction] = useState(() => {
        try {
            const raw = adData?.creative?.call_to_action;
            // If it's already a string like "LEARN_MORE", return it directly
            if (typeof raw === 'string') {
                return raw;
            }
            // Try parsing JSON if it's a stringified object or value
            if (raw != null) {
                const parsed = JSON.parse(raw);
                return parsed || 'LEARN_MORE';
            }
            return 'LEARN_MORE';
        } catch (err) {
            return 'LEARN_MORE';
        }
    });

    useEffect(() => {
        if (adData) {
            setPageName(adData.creative?.socialPage?.pageName || 'Business page');
            setPageImage(adData.creative?.socialPage?.page_picture || '');
            setPostContent(adData.creative?.body || '');
            setHeadline(adData.creative?.headline || '');
            setCallToAction(() => {
                try {
                    return JSON.parse(adData.creative?.call_to_action || '"LEARN_MORE"');
                } catch {
                    return '';
                }
            });
            setAdName(adData.ads_name || '');
            setWebsiteUrl(adData.creative?.website_url || 'example.com');

            let imageUrl = `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`;
            try {
                const { creative_type, image_urls, video_thumbnails } = adData.creative;
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
            setMediaUrl(imageUrl);
        }
    }, [adData]);

    useEffect(() => {
        if (show && !adData) {
            console.warn("Modal opened without ad data.");
        }
    }, [show, adData]);

    const handleContentChange = (e) => {
        setPostContent(e.target.value);
        setSelectionStart(e.target.selectionStart);
        setSelectionEnd(e.target.selectionEnd);
    };

    // Handle emoji selection
    const handleEmojiSelect = (emojiData) => {        
        const emoji = emojiData.emoji;
        const newContent = postContent.slice(0, selectionStart) + emoji + postContent.slice(selectionEnd);    
            setPostContent(newContent);        
        // Update cursor position after insertion
        const newPosition = selectionStart + emoji.length;
        setTimeout(() => {
            textareaRef.current.setSelectionRange(newPosition, newPosition);
            textareaRef.current.focus();
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission behavior
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;            
            // Insert newline at cursor position
            const newContent = 
                postContent.slice(0, start) + 
                '\n' + 
                postContent.slice(end);            
            setPostContent(newContent);            
            // Update cursor position after state update
            setTimeout(() => {
                textareaRef.current.selectionStart = start + 1;
                textareaRef.current.selectionEnd = start + 1;
            }, 0);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
                !e.target.closest('.emoji-picker-btn')) {
            setEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatCTA = (text) => {
        return text
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (!show) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop" onClick={onClose}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: 10,
                    minWidth: 400,
                    maxWidth: 1200,
                    maxHeight: '85vh',
                    overflowY: 'auto'
                }}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">Edit Facebook Ad</h4>
                    <button className="btn-close" onClick={onClose}></button>
                </div>
                <div className="modal-dialog ">
                    <div className="modal-content ">
                        <div className="modal-header"></div>
                        <div className="modal-body create-your-ads-bg">
                            <div className="row">
                                <div className="col-md-2" style={{overflowY:"scroll"}}>
                                    <div className="p-2">
                                        {/* <div className="my-2 d-flex gap-3 justify-content-between align-items-center">
                                            <div>
                                                <h5> Ads List </h5>
                                            </div>
                                            <div> <i className="fa-solid fa-arrow-left"></i></div>
                                        </div> */}
                                        <div>
                                            <h5> Ads List </h5>
                                        </div>
                                        <div className="my-2 d-flex gap-3 justify-content-between align-items-center">
                                            <button className="bg-light-gray" onClick={handlePrevAd} disabled={currentAdIndex === 0}
                                                style={{border:0,padding:5}}
                                            >
                                                <i className="fa-solid fa-arrow-left"></i>
                                            </button>
                                            ( {currentAdIndex + 1} / {AllAds.length} )
                                            <button className="bg-light-gray" onClick={handleNextAd} disabled={currentAdIndex === AllAds.length - 1}
                                                style={{border:0,padding:5}}
                                            >
                                                <i className="fa-solid fa-arrow-right"></i>
                                            </button>
                                        </div>

                                        <div className="my-4">
                                            <div className="mt-2"> <a href="#">+ Create an AD</a> </div>
                                        </div>
                                        {/* <div className=" bg-warning p-2">
                                            <div className="text-center"> Edit ad </div>
                                        </div> */}
                                    </div>

                                    <div className="p-2">
                                        <h6 className="form-label"> Campaign Summary</h6>
                                        <table>
                                            <tr>
                                                <td><small><strong>Name :&nbsp;</strong></small></td>
                                            </tr>
                                            <tr>
                                                <td><small>{CampData.campaign_name}</small></td>
                                            </tr>
                                            <tr>
                                                <td><small><strong>Type :&nbsp;</strong></small></td>
                                            </tr>
                                            <tr>
                                                <td><small>( {CampData.campaign_objective} ) {CampData.campaign_result_type}</small></td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <small>
                                                        <strong>Status :&nbsp;</strong>
                                                        <span className={CampData.campaign_effective_status === "ACTIVE" ? "badge bg-success" : 
                                                        CampData.campaign_effective_status === "PAUSED" ? "badge bg-danger" : "badge bg-secondary" } >
                                                        {CampData.campaign_effective_status}</span>
                                                    </small>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><small><strong>Campaign Buying Type :&nbsp;</strong></small></td>
                                            </tr>
                                            <tr>
                                                <td><small>{CampData.campaign_buying_type}</small></td>
                                            </tr>
                                            <tr>
                                                <td><small><strong>Campaign Category :&nbsp;</strong></small></td>
                                            </tr>
                                            <tr>
                                                <td><small>{CampData.campaign_category}</small></td>
                                            </tr>
                                            <tr>
                                                <td><small><strong>Clicks :&nbsp;</strong></small></td>
                                            </tr>
                                            <tr>
                                                <td><small>{CampData.campaign_insights_clicks}</small></td>
                                            </tr>
                                            <tr>
                                                <td><small><strong>Cost Per Result :&nbsp;</strong></small></td>
                                            </tr>
                                            <tr>
                                                <td><small>{CampData.campaign_insights_cost_per_result} {AdAccount.currency}</small></td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>

                                {/* <div className="col-md-6 bg-white create-your-ads-height"> */}
                                <div className="col-md-6 bg-white">
                                    <div className="p-2 d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6> Edit AD Details </h6>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-light-gray"> Create variations With AI </div>
                                            <div className="bg-light-gray">
                                                <i className="fa-solid fa-copy"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="my-2">
                                        <label for="beneficiaryName" className="form-label fw-bold"> AD Name </label>
                                        <input type="text" id="beneficiaryName" name="beneficiaryName"
                                            className="form-control" placeholder="New ad" value={adName}
                                            onChange={(e) => setAdName(e.target.value)} />
                                    </div>

                                    <div className="my-2">
                                        {/* <button className="btn btn-primary">Contend </button> */}
                                        <div className="add-post-area">
                                            <textarea 
                                                ref={textareaRef}
                                                className="textarea"
                                                id="postContent"
                                                placeholder="Tell people about your offer..."
                                                value={postContent}
                                                onChange={handleContentChange}
                                                maxLength={maxCharacters}
                                                onKeyDown={handleKeyDown}
                                                onClick={(e) => {
                                                    setSelectionStart(e.target.selectionStart);
                                                    setSelectionEnd(e.target.selectionEnd);
                                                }}
                                                onSelect={(e) => {
                                                    setSelectionStart(e.target.selectionStart);
                                                    setSelectionEnd(e.target.selectionEnd);
                                                }}
                                            ></textarea>
                                            <div>
                                                {postContent != null ? (
                                                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                        <div className="character-count"><span id="char-count">{postContent.length}</span>/{maxCharacters} characters</div>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="bg-light-gray" style={{ paddingBottom: 7 }} ref={emojiPickerRef}>
                                                                <button type="button" title="Emoji" 
                                                                    style={{
                                                                        background: "transparent",
                                                                        border: 0,
                                                                        padding: 0
                                                                    }}
                                                                    onClick={() => setEmojiPicker(!emojiPicker)}
                                                                >
                                                                    <i className="fa-regular fa-face-smile"></i>
                                                                </button>
                                                                {emojiPicker && (
                                                                    <div className="emoji-picker-popup">
                                                                        <EmojiPicker
                                                                            searchDisabled={true}
                                                                            emojiStyle="google"
                                                                            onEmojiClick={(emojiData) => {
                                                                                handleEmojiSelect(emojiData);
                                                                                setEmojiPicker(true); // Close picker after selection
                                                                            }}
                                                                            previewConfig={{ showPreview: false }}
                                                                            categories={[
                                                                                'smileys_people',
                                                                                'animals_nature',
                                                                                'food_drink',
                                                                                'travel_places',
                                                                                'activities',
                                                                                'objects',
                                                                                'symbols',
                                                                                'flags',
                                                                                // 'frequently_used', // Exclude this line to hide "Frequently Used"
                                                                            ]}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* <div className="bg-light-gray">
                                                                <i className="fa-solid fa-at"></i>
                                                            </div> */}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center" style={{ height: '100px', justifyContent: 'center' }}>
                                                        <i className="fas fa-spin fa-spinner" style={{ fontSize: '25px' }}></i>
                                                        <p className="my-auto ms-2">Please wait, fetching data...</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center pt-2">
                                                <div className="d-flex align-items-center gap-2">

                                                    {/* <!-- Upload box with image icon --> */}
                                                    <div className="upload-box">
                                                        <img src="https://img.icons8.com/ios/50/image--v1.png" alt="Upload Icon" />
                                                        <input type="file" accept="image/*"
                                                            onchange="document.getElementById('previewImg').src=window.URL.createObjectURL(this.files[0])" />
                                                    </div>

                                                    {/* <!-- Upload box with book/catalog icon --> */}
                                                    <div className="upload-box">
                                                        <img id="previewImg" src="https://img.icons8.com/ios/50/open-book--v1.png"
                                                            alt="Catalog Icon" className="upload-preview" />
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center flex-column gap-2">
                                                    <div> <img className="" src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/book.png`} alt="" /> </div>
                                                    <div> <img className="" src={`${process.env.PUBLIC_URL}/assets/images/analytics-ican/canva.png`} alt="" /> </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="my-2">
                                        <label for="beneficiaryName" className="form-label fw-bold"> Headline </label>
                                        <input type="text" id="beneficiaryName" name="beneficiaryName" className="form-control" 
                                            placeholder="Add a headline..." value={headline} onChange={(e) => setHeadline(e.target.value)} />
                                    </div>

                                    <div className="my-2">
                                        <label for="beneficiaryName" className="form-label fw-bold"> Website URL
                                            <i className="fa-solid fa-circle-info ms-1" ></i>
                                        </label>
                                        <input type="text" id="beneficiaryName" name="beneficiaryName" className="form-control" value={websiteUrl}
                                            placeholder="www.example.com/page" onChange={(e) => setWebsiteUrl(e.target.value)} />
                                    </div>

                                    <div className="my-2">
                                        <label htmlFor="selectcall" className="form-label">Call to action</label>
                                        <select className="form-select" id="selectcall" value={callToAction}
                                            onChange={(e) => setCallToAction(e.target.value)}
                                        >
                                            <option value="" hidden>-- Select an action --</option>
                                            <option value="LEARN_MORE">Learn more</option>
                                            <option value="APPLY_NOW">Apply now</option>
                                            <option value="BOOK_NOW">Book now</option>
                                            <option value="CONTACT_US">Contact us</option>
                                            <option value="DOWNLOAD">Download</option>
                                            <option value="GET_OFFER">Get offer</option>
                                            <option value="GET_QUOTE">Get quote</option>
                                            <option value="SIGN_UP">Sign Up</option>
                                        </select>
                                    </div>

                                </div>

                                <div className="col-md-4 ">
                                    <div className="post-preview-height">

                                        <ul className="nav nav-tabs d-flex align-items-center justify-content-center my-3" id="previewTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button className="nav-link active" id="desktop-tab" data-bs-toggle="tab" 
                                                    data-bs-target="#desktop" type="button" role="tab">Desktop</button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button className="nav-link" id="mobile-tab" data-bs-toggle="tab" 
                                                    data-bs-target="#mobile" type="button" role="tab">Mobile </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button className="nav-link" id="instagram-tab" data-bs-toggle="tab" 
                                                    data-bs-target="#instagram" type="button" role="tab">Instagram </button>
                                            </li>
                                        </ul>

                                        <div className="tab-content " id="previewTabsContent">
                                            <div className="tab-pane fade show active" id="desktop" role="tabpanel">
                                                <div className="post-preview">
                                                    <div className="d-flex justify-content-between align-items-center p-2 ">
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <div className="profile-img"> 
                                                                <img className="img-fluid" src={pageImage || `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`} alt="" /> 
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <div><strong> {pageName} </strong></div>
                                                                <div> Sponsored <span> <i className="fas fa-globe"></i> </span> </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <i className="fa-solid fa-ellipsis"></i>
                                                        </div>
                                                    </div>

                                                    <div className="justify-content-between align-items-center p-3 border-bottom">
                                                        <div>
                                                            <div className="main-text mb-2" style={{ whiteSpace: 'pre-line' }}>
                                                                {postContent}
                                                            </div>
                                                            <div className="rounded mb-2"
                                                                style={{ width: '100%', height: 180, backgroundColor: '#ccc', position: 'relative', overflow: 'hidden', }}>
                                                                <img src={mediaUrl || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                    alt={ adName } className="img-fluid mb-2 rounded w-100"
                                                                    style={{ height: '100%', objectFit: 'cover' }}
                                                                />
                                                                {AllAds?.[currentAdIndex]?.creative?.creative_type === 'video' && (
                                                                    <div className="video-thumbnail" >
                                                                        <i className="fas fa-play" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="d-flex justify-content-between gap-3">
                                                                <div>
                                                                    <span>{headline || 'Ad Headline here'}</span><br/>
                                                                    <span><strong>{adName || 'Ad Name here'}</strong></span>
                                                                </div>
                                                                <button className="btn btn-outline-secondary web-ads-btn w-50 my-auto" style={{minWidth:100}}>
                                                                    {formatCTA(callToAction)}
                                                                </button>
                                                            </div>
                                                            <span><a href="javascript:void(0)" style={{fontSize:10}}>https://www.{websiteUrl || 'example.com'}/</a></span>
                                                        </div>
                                                    </div>

                                                    <div className="">
                                                        <div className="d-flex justify-content-between align-items-center p-3 text-center border-bottom">
                                                            <div className="d-flex align-items-center"> <i className="far fa-thumbs-up"></i>&nbsp;Like </div>
                                                            <div className="d-flex align-items-center"> <i className="far fa-comment"></i>&nbsp;Comment </div>
                                                            <div className="d-flex align-items-center"> <i className="far fa-share-square"></i>&nbsp;Share </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                            <div className="tab-pane fade" id="mobile" role="tabpanel">
                                                <phone>
                                                    <div className="phone-frame">
                                                        <div className="phone-notch"></div>

                                                        <div className="mobile-header">
                                                            <div> 3:32 PM</div>
                                                            <div className="d-flex gap-2">
                                                                <div> 
                                                                    <svg viewBox="0 0 33 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="power">
                                                                        <rect y="12" width="6" height="9" rx="2" fill="black"></rect>
                                                                        <rect x="8.7" y="9" width="6" height="12" rx="2" fill="black"></rect>
                                                                        <rect x="17.4" y="5" width="6" height="16" rx="2" fill="black"></rect>
                                                                        <rect x="26.1" width="6" height="21" rx="2" fill="black"></rect>
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <div className="network">5G</div>
                                                                </div>
                                                                <div>
                                                                    <svg width="25" height="16" viewBox="0 0 86 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <rect fill="transparent" x="1.75"
                                                                            y="1.75" width="75.5"
                                                                            height="35.5" rx="8.25"
                                                                            stroke="black"
                                                                            stroke-opacity="0.4"
                                                                            stroke-width="3.5">
                                                                        </rect>
                                                                        <rect x="6.5" y="6.5" width="66"
                                                                            height="26" rx="5" fill="black">
                                                                        </rect>
                                                                        <path fill-rule="evenodd"
                                                                            clip-rule="evenodd"
                                                                            d="M81.5 26.5C83.9363 24.9844 85.5 22.6361 85.5 20C85.5 17.3639 83.9363 15.0156 81.5 13.5V26.5Z"
                                                                            fill="black" fill-opacity="0.6">
                                                                        </path>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="custom-mobile-height">
                                                            <div className="post-preview">
                                                                <div className="d-flex justify-content-between align-items-center p-2 ">
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <div className="profile-img ">
                                                                            <img className="img-fluid" src={pageImage || `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`} alt="" /> 
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            <div><strong> {pageName} </strong></div>
                                                                            <div> Sponsored <span> <i className="fas fa-globe"></i> </span> </div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <i className="fa-solid fa-ellipsis"></i>
                                                                    </div>
                                                                </div>

                                                                <div className="justify-content-between align-items-center p-2 border-bottom">
                                                                    <div>
                                                                        <div className="main-text mb-2" style={{ whiteSpace: 'pre-line' }}>
                                                                            {postContent}
                                                                        </div>
                                                                        <div className="rounded mb-2"
                                                                            style={{ width: '100%', height: 180, backgroundColor: '#ccc', position: 'relative', overflow: 'hidden', }}>
                                                                            <img src={mediaUrl || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                                alt={ adName } className="img-fluid mb-2 rounded w-100"
                                                                                style={{ height: '100%', objectFit: 'cover' }}
                                                                            />
                                                                            {AllAds?.[currentAdIndex]?.creative?.creative_type === 'video' && (
                                                                                <div className="video-thumbnail" >
                                                                                    <i className="fas fa-play" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="d-flex justify-content-between gap-3">
                                                                            <div>
                                                                                <span>{headline || 'Ad Headline here'}</span><br/>
                                                                                <span><strong>{adName || 'Ad Name here'}</strong></span>
                                                                            </div>
                                                                            <button className="btn btn-outline-secondary web-ads-btn w-50 my-auto" style={{minWidth:100}}>
                                                                                {formatCTA(callToAction)}
                                                                            </button>
                                                                        </div>
                                                                        <span><a href="javascript:void(0)" style={{fontSize:10}}>https://www.{websiteUrl || 'example.com'}/</a></span>
                                                                    </div>
                                                                </div>

                                                                <div className="">
                                                                    <div className="d-flex justify-content-between align-items-center p-3 text-center border-bottom">
                                                                        <div className="d-flex align-items-center"> <i className="far fa-thumbs-up"></i>&nbsp;Like </div>
                                                                        <div className="d-flex align-items-center"> <i className="far fa-comment"></i>&nbsp;Comment </div>
                                                                        <div className="d-flex align-items-center"> <i className="far fa-share-square"></i>&nbsp;Share </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* <!-- instagram preview style start --> */}
                                                            <div className="post-preview instagram-preview">
                                                                <div className="d-flex justify-content-between align-items-center p-2 ">
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <div className="profile-img">
                                                                            <img className="img-fluid" src={pageImage || `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`} alt="" /> 
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            <div> <strong> {pageName} </strong> </div>
                                                                            <div> Sponsored <span><i className="fas fa-globe"></i></span></div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <i className="fa-solid fa-ellipsis-vertical"></i>
                                                                    </div>
                                                                </div>

                                                                <div className="facebook-post-img">
                                                                    <div style={{ width: '100%', backgroundColor: '#ccc', position: 'relative', overflow: 'hidden', }}>
                                                                        <img src={mediaUrl || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                            alt={ adName } className="img-fluid w-100"
                                                                        />
                                                                        {AllAds?.[currentAdIndex]?.creative?.creative_type === 'video' && (
                                                                            <div className="video-thumbnail" >
                                                                                <i className="fas fa-play" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-danger text-white">
                                                                    <div> {formatCTA(callToAction)} </div>
                                                                    <div>
                                                                        <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/images/ads-img/right-arrow (2).png`} alt="" />
                                                                    </div>
                                                                </div>

                                                                <div className="instagram-footer">
                                                                    <div className="d-flex justify-content-between align-items-center p-2">
                                                                        <div className="d-flex align-items-center text-center gap-2 w-75">
                                                                            <div className="d-flex align-items-center"> <i className="far fa-heart"></i>&nbsp;12.7M </div>
                                                                            <div className="d-flex align-items-center"> <i className="fas fa-comment"></i>&nbsp;120K </div>
                                                                            <div className="d-flex align-items-center"> <i className="fas fa-paper-plane"></i>&nbsp;98.8K </div>
                                                                        </div>
                                                                        <div className="w-25 text-end">
                                                                            <i className="far fa-bookmark"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-2">
                                                                        <p> 
                                                                            <strong>{pageName} &nbsp;</strong>
                                                                            {/* Launching our new app interface! Experience faster navigation and a fresh look.  */}
                                                                        </p>
                                                                        <div className="main-text mb-2" style={{ whiteSpace: 'pre-line' }}>
                                                                            {postContent}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* <!-- instagram preview style end  --> */}

                                                        </div>
                                                        <div className="d-flex justify-content-center align-items-center">
                                                            <div className="mobile-footer"> </div>
                                                        </div>
                                                    </div>
                                                </phone>
                                            </div>
                                            <div className="tab-pane fade" id="instagram" role="tabpanel">
                                                <div className="post-preview instagram-preview">
                                                    <div className="d-flex justify-content-between align-items-center p-2 ">
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <div className="profile-img"> 
                                                                <img className="img-fluid" src={pageImage || `${process.env.PUBLIC_URL}/assets/images/avtar/campaign3.jpg`} alt="" /> 
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <div> <strong> {pageName} </strong> </div>
                                                                <div> Sponsored <span><i className="fas fa-globe"></i></span></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                                        </div>
                                                    </div>

                                                    <div className="facebook-post-img">
                                                        <div style={{ width: '100%', backgroundColor: '#ccc', position: 'relative', overflow: 'hidden', }}>
                                                            <img src={mediaUrl || `${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`}
                                                                alt={ adName } className="img-fluid w-100"
                                                            />
                                                            {AllAds?.[currentAdIndex]?.creative?.creative_type === 'video' && (
                                                                <div className="video-thumbnail" >
                                                                    <i className="fas fa-play" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-danger text-white">
                                                        <div> {formatCTA(callToAction)} </div>
                                                        <div> 
                                                            <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/images/ads-img/right-arrow (2).png`} alt="" />
                                                        </div>
                                                    </div>

                                                    <div className="instagram-footer">
                                                        <div className="d-flex justify-content-between align-items-center p-2">
                                                            <div className="d-flex align-items-center text-center gap-2 w-75">
                                                                <div className="d-flex align-items-center"> <i className="far fa-heart"></i>&nbsp;9,890 </div>
                                                                <div className="d-flex align-items-center"> <i className="fas fa-comment"></i>&nbsp;884 </div>
                                                                <div className="d-flex align-items-center"> <i className="fas fa-paper-plane"></i>&nbsp;269 </div>
                                                            </div>
                                                            <div className="w-25 text-end">
                                                                <i className="far fa-bookmark"></i>
                                                            </div>
                                                        </div>
                                                        <div className="p-2">
                                                            <p>
                                                                <strong>{pageName} &nbsp;</strong>
                                                                {/* Launching our new app interface! Experience faster navigation and a fresh look. */}
                                                            </p>
                                                            <div className="main-text mb-2" style={{ whiteSpace: 'pre-line' }}>
                                                                {postContent}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center my-3">
                                                <p> Social networks regularly make updates to formatting, so your post may appear slightly different when published.
                                                    <a href="#"> Learn more </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer d-flex justify-content-between align-items-center my-2">
                            <div> 
                            {/* <button className="btn btn-outline-primary">
                                    <i className="fa-solid fa-arrow-left"></i> Audience and budget
                                </button> */}
                            </div>
                            <div>
                                <button type="button" className="btn btn-secondary">
                                    Save Ad draft
                                </button>
                                <a href="#" className="btn btn-primary">
                                    Update Ad
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AdEditModal;
