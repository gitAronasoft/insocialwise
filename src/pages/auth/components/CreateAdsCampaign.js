import React, { useEffect, useState, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import DatePicker from "react-datepicker";
import Select from 'react-select';
import { createFilter } from 'react-select';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { toast } from 'react-toastify';

const CreateAdsCampaign = ({ show, onHide, connectedAccount, updateConnectedAccounts }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const responsive = {
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 1,
            slidesToSlide: 1
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 1
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1
        }
    };

    const [showSocialAccountList, setShowSocialAccountList] = useState(false);
    //const [selectedAccount, setSelectedAccount] = useState({ socialId: null,accountName: null });
    const [selectedAccount, setSelectedAccount] = useState(
    connectedAccount && connectedAccount.length > 0 
        ? connectedAccount[0] 
        : null
    );

    const [createAdLoader, setCreateAdLoader] = useState(false);

    const [createAdError, setCreateAdError] = useState(false);
    const [createAdErrorMessage, setCreateAdErrorMessage] = useState('');

    const [cammpaignLoader, setCammpaignLoader] = useState(false);
    const [adsetLoader, setAdsetLoader] = useState(false);
    const [adCreativeLoader, setAdCreativeLoader] = useState(false);

    const [cammpaignStatus, setCammpaignStatus] = useState('');
    const [adsetStatus, setAdsetStatus] = useState('');
    const [adCreativeStatus, setAdCreativeStatus] = useState('');
    const [campaignPublishLoader, setCampaignPublishLoader] = useState(false);

    const [showSocialPages, setShowSocialPages] = useState(false);
    const [showAccountPages, setShowAccountPages] = useState('');
    const [selectedPage, setSelectedPage] = useState(null);
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [selectedAdAccounts, setSelectedAdAccounts] = useState([]);
    const [showBuyingTypeDropdown, setShowBuyingTypeDropdown] = useState(false);
    
    const [selectedBuyingType, setSelectedBuyingType] = useState({
        id: "1",
        name: "Auction",
        objectiveCategory: "AUCTION"
    });

    const [campaignBuyingType, setCampaignBuyingType] = useState([
        {
            id: "1",
            name:"Auction",
            objectiveCategory: "AUCTION",            
        },
        {
            id: "2",
            name:"Reservation",
            objectiveCategory: "RESERVATION",            
        }
    ]);    

    const [campaignObjective, setCampaignObjective] = useState([
        {
            id: "1",
            name:"Traffic",
            objective: "OUTCOME_TRAFFIC",
            objectiveCategory: ["AUCTION"],
            description: "Drive visitors to your website or landing pages"
        },
        {
            id: "2",
            name:"Engagement",
            objective: "OUTCOME_ENGAGEMENT",
            objectiveCategory: ["RESERVATION","AUCTION"],
            description: "Get more likes, comments, and shares"
        },
        {
            id: "3",
            name:"Awareness",
            objective: "OUTCOME_AWARENESS",
            objectiveCategory: ["RESERVATION","AUCTION"],
            description: "Get more people to notice your brand"
        },
        {
            id: "4",
            name:"Leads",
            objective: "OUTCOME_LEADS",
            objectiveCategory: ["AUCTION"],
            description: "Collect leads for your business or brand"
        },
        {
            id: "5",
            name:"Sales",
            objective: "OUTCOME_SALES",
            objectiveCategory: ["AUCTION"],
            description: "Find people who are likely to buy your product or service"
        }
    ]);
    const [selectedAdAccountId, setSelectedAdAccountId] = useState(null);    
    const [optimizationAddelivery, setOptimizationAddelivery] = useState([        
        {
            id: "1",
            name:"Landing page views",
            value: "LANDING_PAGE_VIEWS"
        },
        {
            id: "2",
            name:"Link clicks",
            value: "LINK_CLICKS"
        },
        {
            id: "3",
            name:"Reach",
            value: "REACH"
        },
        {
            id: "4",
            name:"Impressions",
            value: "IMPRESSIONS"
        },
        {
            id: "5",
            name:"Daily unique reach",
            value: "DAILY_UNIQUE_REACH"
        },
        {
            id: "6",
            name:"Conversions",
            value: "OFFSITE_CONVERSIONS"
        },
        {
            id: "7",
            name:"Leads",
            value: "LEAD_GENERATION"
        },
        {
            id: "8",
            name:"Engagement",
            value: "POST_ENGAGEMENT"
        },
        // {
        //     id: "9",
        //     name:"Video views",
        //     value: "VIDEO_VIEWS"
        // },        
        // {
        //     id: "10",
        //     name:"Quality leads",
        //     value: "QUALITY_LEAD"
        // },
        // {
        //     id: "11",
        //     name:"App installs",
        //     value: "APP_INSTALLS"
        // }
    ]);     
    const [isSpecialCategory, setIsSpecialCategory] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [campaignCategories, setCampaignCategories] = useState([
        {
            id: "1",
            label: "Financial products and services",
            value: "CREDIT",
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
        },
        {
            id: "2",
            label: "Lead Generation",
            value: "NONE",
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
        },
        {
            id: "3",
            label: "Housing",
            value: "HOUSING",
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
        },
        {
            id: "4",
            label: "Social issues, elections or politics",
            value: "ISSUES_ELECTIONS_POLITICS",
            description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
        }
    ]);
    const [campaignBudgetType, setCampaignBudgetType] = useState([
        {
            id: "1",
            typeName: "Per day",
            budgetType: "daily",
        },
        {
            id: "2",
            typeName: "Total",
            budgetType: "lifetime",
        }
    ]);
    const [selectedBudgetType, setSelectedBudgetType] = useState("daily");
    const [budgetAmount, setBudgetAmount] = useState('');
    const [campaignStartDate, setCampaignStartDate] = useState('');
    const [campaignEndDate, setCampaignEndDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date;
    });
    const [campaignPlacements, setCampaignPlacements] = useState([
        {
            id: "1",
            PlacementName: "Facebook Feed",
            enabled: true,
            platform: "facebook",
            position: "facebook_positions",
            value: "feed"
        },
        
        {
            id: "2",
            PlacementName: "Facebook Marketplace",
            enabled: true,
            platform: "facebook",
            position: "facebook_positions",
            value: "marketplace"
        },
        {
            id: "3",
            PlacementName: "Facebook Search Results",
            enabled: true,
            platform: "facebook",
            position: "facebook_positions",
            value: "search"
        },
        {
            id: "4",
            PlacementName: "Facebook Video Feeds",
            enabled: false,
            platform: "facebook",
            position: "facebook_positions",
            value: "video_feeds"
        },
        {
            id: "5",
            PlacementName: "Facebook Stories",
            enabled: false,
            platform: "facebook",
            position: "facebook_positions",
            value: "story"
        },
        {
            id: "6",
            PlacementName: "Instagram Feed",
            enabled: false,
            platform: "instagram",
            position: "instagram_positions",
            value: "stream"
        },
        {
            id: "7",
            PlacementName: "Instagram Reels",
            enabled: false,
            platform: "instagram",
            position: "instagram_positions",
            value: "reels"
        }        
    ]);

    const [campaignPublisherPlatform, setCampaignPublisherPlatform] = useState([]);
 
    const [audienceAge, setAudienceAge] = useState({min: 18,max: 65,});   
    const [audienceGender, setAudienceGender] = useState([
        {id:"1", genderType:"All", enabled:true },
        {id:"2", genderType:"Male", enabled:false },
        {id:"3", genderType:"Female", enabled:false }
    ]); 
    const [showAudienceModal, setShowAudienceModal] = useState(false);
    const [loader, setLoader] = useState(false);

    const [campaignDeviceType, setCampaignDeviceType] = useState([
        {id:"1", deviceType:"All", enabled:true },
        {id:"2", deviceType:"Mobile", enabled:false },
        {id:"3", deviceType:"Desktop", enabled:false }
    ]);
    const [selectedCampaignLocation, setSelectedCampaignLocation] = useState([{code:"US",name:"United States"}]);
    const campaignLocation = [
        {code:"AF", name:"Afghanistan"},
        {code:"AL", name:"Albania"},
        {code:"DZ", name:"Algeria"},
        {code:"AD", name:"Andorra"},
        {code:"AO", name:"Angola"},
        {code:"AG", name:"Antigua and Barbuda"},
        {code:"AR", name:"Argentina"},
        {code:"AM", name:"Armenia"},
        {code:"AU", name:"Australia"},
        {code:"AT", name:"Austria"},
        {code:"AZ", name:"Azerbaijan"},
        {code:"BS", name:"Bahamas"},
        {code:"BH", name:"Bahrain"},
        {code:"BD", name:"Bangladesh"},
        {code:"BB", name:"Barbados"},
        {code:"BY", name:"Belarus"},
        {code:"BE", name:"Belgium"},
        {code:"BZ", name:"Belize"},
        {code:"BJ", name:"Benin"},
        {code:"BT", name:"Bhutan"},
        {code:"BO", name:"Bolivia"},
        {code:"BA", name:"Bosnia and Herzegovina"},
        {code:"BW", name:"Botswana"},
        {code:"BR", name:"Brazil"},
        {code:"BN", name:"Brunei"},
        {code:"BG", name:"Bulgaria"},
        {code:"BF", name:"Burkina Faso"},
        {code:"BI", name:"Burundi"},
        {code:"KH", name:"Cambodia"},
        {code:"CM", name:"Cameroon"},
        {code:"CA", name:"Canada"},
        {code:"CV", name:"Cape Verde"},
        {code:"CF", name:"Central African Republic"},
        {code:"TD", name:"Chad"},
        {code:"CL", name:"Chile"},
        {code:"CN", name:"China"},
        {code:"CO", name:"Colombia"},
        {code:"KM", name:"Comoros"},
        {code:"CG", name:"Congo (Republic)"},
        {code:"CD", name:"Congo (Democratic Republic)"},
        {code:"CR", name:"Costa Rica"},
        {code:"HR", name:"Croatia"},
        {code:"CU", name:"Cuba"},
        {code:"CY", name:"Cyprus"},
        {code:"CZ", name:"Czech Republic"},
        {code:"DK", name:"Denmark"},
        {code:"DJ", name:"Djibouti"},
        {code:"DM", name:"Dominica"},
        {code:"DO", name:"Dominican Republic"},
        {code:"EC", name:"Ecuador"},
        {code:"EG", name:"Egypt"},
        {code:"SV", name:"El Salvador"},
        {code:"GQ", name:"Equatorial Guinea"},
        {code:"ER", name:"Eritrea"},
        {code:"EE", name:"Estonia"},
        {code:"SZ", name:"Eswatini"},
        {code:"ET", name:"Ethiopia"},
        {code:"FJ", name:"Fiji"},
        {code:"FI", name:"Finland"},
        {code:"FR", name:"France"},
        {code:"GA", name:"Gabon"},
        {code:"GM", name:"Gambia"},
        {code:"GE", name:"Georgia"},
        {code:"DE", name:"Germany"},
        {code:"GH", name:"Ghana"},
        {code:"GR", name:"Greece"},
        {code:"GD", name:"Grenada"},
        {code:"GT", name:"Guatemala"},
        {code:"GN", name:"Guinea"},
        {code:"GW", name:"Guinea-Bissau"},
        {code:"GY", name:"Guyana"},
        {code:"HT", name:"Haiti"},
        {code:"HN", name:"Honduras"},
        {code:"HU", name:"Hungary"},
        {code:"IS", name:"Iceland"},
        {code:"IN", name:"India"},
        {code:"ID", name:"Indonesia"},
        {code:"IR", name:"Iran"},
        {code:"IQ", name:"Iraq"},
        {code:"IE", name:"Ireland"},
        {code:"IL", name:"Israel"},
        {code:"IT", name:"Italy"},
        {code:"JM", name:"Jamaica"},
        {code:"JP", name:"Japan"},
        {code:"JO", name:"Jordan"},
        {code:"KZ", name:"Kazakhstan"},
        {code:"KE", name:"Kenya"},
        {code:"KI", name:"Kiribati"},
        {code:"KR", name:"South Korea"},
        {code:"KW", name:"Kuwait"},
        {code:"KG", name:"Kyrgyzstan"},
        {code:"LA", name:"Laos"},
        {code:"LV", name:"Latvia"},
        {code:"LB", name:"Lebanon"},
        {code:"LS", name:"Lesotho"},
        {code:"LR", name:"Liberia"},
        {code:"LY", name:"Libya"},
        {code:"LI", name:"Liechtenstein"},
        {code:"LT", name:"Lithuania"},
        {code:"LU", name:"Luxembourg"},
        {code:"MG", name:"Madagascar"},
        {code:"MW", name:"Malawi"},
        {code:"MY", name:"Malaysia"},
        {code:"MV", name:"Maldives"},
        {code:"ML", name:"Mali"},
        {code:"MT", name:"Malta"},
        {code:"MH", name:"Marshall Islands"},
        {code:"MR", name:"Mauritania"},
        {code:"MU", name:"Mauritius"},
        {code:"MX", name:"Mexico"},
        {code:"FM", name:"Micronesia"},
        {code:"MD", name:"Moldova"},
        {code:"MC", name:"Monaco"},
        {code:"MN", name:"Mongolia"},
        {code:"ME", name:"Montenegro"},
        {code:"MA", name:"Morocco"},
        {code:"MZ", name:"Mozambique"},
        {code:"MM", name:"Myanmar"},
        {code:"NA", name:"Namibia"},
        {code:"NR", name:"Nauru"},
        {code:"NP", name:"Nepal"},
        {code:"NL", name:"Netherlands"},
        {code:"NZ", name:"New Zealand"},
        {code:"NI", name:"Nicaragua"},
        {code:"NE", name:"Niger"},
        {code:"NG", name:"Nigeria"},
        {code:"NO", name:"Norway"},
        {code:"OM", name:"Oman"},
        {code:"PK", name:"Pakistan"},
        {code:"PW", name:"Palau"},
        {code:"PA", name:"Panama"},
        {code:"PG", name:"Papua New Guinea"},
        {code:"PY", name:"Paraguay"},
        {code:"PE", name:"Peru"},
        {code:"PH", name:"Philippines"},
        {code:"PL", name:"Poland"},
        {code:"PT", name:"Portugal"},
        {code:"QA", name:"Qatar"},
        {code:"RO", name:"Romania"},
        {code:"RU", name:"Russia"},
        {code:"RW", name:"Rwanda"},
        {code:"KN", name:"Saint Kitts and Nevis"},
        {code:"LC", name:"Saint Lucia"},
        {code:"VC", name:"Saint Vincent and the Grenadines"},
        {code:"WS", name:"Samoa"},
        {code:"SM", name:"San Marino"},
        {code:"ST", name:"Sao Tomé and Príncipe"},
        {code:"SA", name:"Saudi Arabia"},
        {code:"SN", name:"Senegal"},
        {code:"RS", name:"Serbia"},
        {code:"SC", name:"Seychelles"},
        {code:"SL", name:"Sierra Leone"},
        {code:"SG", name:"Singapore"},
        {code:"SK", name:"Slovakia"},
        {code:"SI", name:"Slovenia"},
        {code:"SB", name:"Solomon Islands"},
        {code:"SO", name:"Somalia"},
        {code:"ZA", name:"South Africa"},
        {code:"SS", name:"South Sudan"},
        {code:"ES", name:"Spain"},
        {code:"LK", name:"Sri Lanka"},
        {code:"SD", name:"Sudan"},
        {code:"SR", name:"Suriname"},
        {code:"SE", name:"Sweden"},
        {code:"CH", name:"Switzerland"},
        {code:"SY", name:"Syria"},
        {code:"TJ", name:"Tajikistan"},
        {code:"TZ", name:"Tanzania"},
        {code:"TH", name:"Thailand"},
        {code:"TL", name:"Timor-Leste"},
        {code:"TG", name:"Togo"},
        {code:"TO", name:"Tonga"},
        {code:"TT", name:"Trinidad and Tobago"},
        {code:"TN", name:"Tunisia"},
        {code:"TR", name:"Turkey"},
        {code:"TM", name:"Turkmenistan"},
        {code:"TV", name:"Tuvalu"},
        {code:"UG", name:"Uganda"},
        {code:"UA", name:"Ukraine"},
        {code:"AE", name:"United Arab Emirates"},
        {code:"GB", name:"United Kingdom"},
        {code:"US", name:"United States"},
        {code:"UY", name:"Uruguay"},
        {code:"UZ", name:"Uzbekistan"},
        {code:"VU", name:"Vanuatu"},
        {code:"VE", name:"Venezuela"},
        {code:"VN", name:"Vietnam"},
        {code:"YE", name:"Yemen"},
        {code:"ZM", name:"Zambia"},
        {code:"ZW", name:"Zimbabwe"}   
    ];
    const [targetingSearch, setTargetingSearch] = useState('');
    const [targetingResults, setTargetingResults] = useState([]);    
    const [targetingLoader, setTargetingLoader] = useState(false);
    const [selectedInterest, setSelectedInterest] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [showCreateAdModal, setShowCreateAdModal] = useState(false);

    const buyingTypeDropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const datePickerRef = useRef(null);
    const dropdownRef = useRef(null);
    const selectPageRef = useRef(null);

    const handleDivClick = () => {
        if (datePickerRef.current) {
            datePickerRef.current.setOpen(true);
        }
    };    

    const handleGenderChange = (selectedId) => {
        const updated = audienceGender.map((gender) => ({
            ...gender,
            enabled: gender.id === selectedId, 
        }));
        setAudienceGender(updated);
    };

    const selectedGender = audienceGender.find(g => g.enabled)?.genderType || 'All'; 
    const handleAgeChange = (e) => {
        const { name, value } = e.target;
        setAudienceAge((prev) => ({
            ...prev,
            [name]: parseInt(value),
        }));
    };    
    const selectedDeviceType = campaignDeviceType.find((d) => d.enabled)?.deviceType || "";    

    const handleCampaignLocationChange = (selected) => {
        const selectedCodes = selected ? selected.map(loc => loc) : [];
        //setSelectedCampaignLocation(selected);
        setSelectedCampaignLocation(selectedCodes);
        //console.log("Selected Codes:", selectedCodes);
    };   

    const handleDeviceTypeChange = (e) => {
        const selected = e.target.value;
        setCampaignDeviceType((prev) =>
            prev.map((d) => ({
            ...d,
            enabled: d.deviceType === selected,
            }))
        );
    };

    function formatObjective(objective) {
        if (!objective) return 'Null';        
        return objective
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Format currency function
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const customFormatDate = (date) => {
        const d = new Date(date);
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        const time = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        return `${weekday}, ${month} ${day} at ${time}`;
    };

    useEffect(() => {
        const now = new Date();
        //const formatted = customFormatDate(now.toString());
        setCampaignStartDate(now.toString());
    }, []);

    const defaultOptimization = optimizationAddelivery.find(item => item.id === "1")?.value;

    const maxCharacters = 3000;
    const createAdContentRef = useRef(null);
    const emojiPickerRef = useRef(null);    
    const [selectionStart, setSelectionStart] = useState(0);
    const [selectionEnd, setSelectionEnd] = useState(0);

    const handleKeyDownCreateAdContent = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const content = createAdData.createAdContent || '';
            const newContent =
                content.slice(0, start) +
                '\n' +
                content.slice(end);
            setCreateAdData(prev => ({
                ...prev,
                createAdContent: newContent
            }));           

            // Move cursor to next line
            setTimeout(() => {
                if (createAdContentRef.current) {
                    createAdContentRef.current.selectionStart = start + 1;
                    createAdContentRef.current.selectionEnd = start + 1;
                }
            }, 0);
        }
    };

    const handleCreateContentChange = (e) => {
        const value = e.target.value;
        setCreateAdData(prev => ({
            ...prev,
            createAdContent: value,
        }));
        setSelectionStart(e.target.selectionStart);
        setSelectionEnd(e.target.selectionEnd);
    };

    const [createAdButtonType, setCreateAdButtonType] = useState([
        { id: "1", AdButtonName: "Apply Now", value: "APPLY_NOW" },
        { id: "2", AdButtonName: "Book Now", value: "BOOK_NOW" },
        { id: "3", AdButtonName: "Contact Us", value: "CONTACT_US" },
        { id: "4", AdButtonName: "Download", value: "DOWNLOAD" },
        //{ id: "5", AdButtonName: "Get Directions", value: "GET_DIRECTIONS" },
        //{ id: "6", AdButtonName: "Get Offer", value: "GET_OFFER" },
        //{ id: "7", AdButtonName: "Get Quote", value: "GET_QUOTE" },
        { id: "8", AdButtonName: "Learn More", value: "LEARN_MORE" },
        //{ id: "9", AdButtonName: "Listen Now", value: "LISTEN_NOW" },
        //{ id: "10", AdButtonName: "Request Time", value: "REQUEST_TIME" },
        //{ id: "11", AdButtonName: "See Menu", value: "SEE_MENU" },
        //{ id: "12", AdButtonName: "Shop Now", value: "SHOP_NOW" },
        //{ id: "13", AdButtonName: "Sign Up", value: "SIGN_UP" },
        //{ id: "14", AdButtonName: "Subscribe", value: "SUBSCRIBE" },
        //{ id: "15", AdButtonName: "Watch More", value: "WATCH_MORE" },
        { id: "16", AdButtonName: "Call Now", value: "CALL_NOW" },
        //{ id: "17", AdButtonName: "Send Message", value: "MESSAGE_PAGE" },
        //{ id: "18", AdButtonName: "WhatsApp Message", value: "WHATSAPP_MESSAGE" },
        //{ id: "19", AdButtonName: "Messenger", value: "SEND_MESSAGE" },
        //{ id: "20", AdButtonName: "Play Game", value: "PLAY_GAME" },
        //{ id: "21", AdButtonName: "Install Now", value: "INSTALL_MOBILE_APP" },
        //{ id: "22", AdButtonName: "Use App", value: "USE_MOBILE_APP" }
    ]);

    const [selectedCreateAdButtonType, setSelectedCreateAdButtonType] = useState(
        {
            id: "1", AdButtonName: "Apply now", value: 'APPLY_NOW'
        }
    );

    const handleAdButtonTypeChange = (e) => {
        const selectedValue = e.target.value;
        const selectedOption = createAdButtonType.find(btn => btn.value === selectedValue);
        if(selectedOption) {
            setSelectedCreateAdButtonType(selectedOption);
            setCreateAdData(prev => ({
                ...prev,
                createAdCallToAction: selectedOption.value
            }));
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imageData = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        setCreateAdData(prev => ({
            ...prev,
            createAdImages: [...prev.createAdImages, ...imageData]
        }));
    };

    const [createAdData, setCreateAdData] = useState({ 
        campaignName:'',
        campaignBuyingType: selectedBuyingType?.objectiveCategory || 'AUCTION',
        campaignObjective:"OUTCOME_TRAFFIC",
        optimizationAddelivery:defaultOptimization,
        campaignCategory:'',
        createAdName:'',
        createAdContent:'',
        createAdHeadline:'',
        createAdWebsiteURL:'',
        createAdCallToAction:selectedCreateAdButtonType.value,
        createAdImages:[],
    });

    const [createdCammpaignID, setCreatedCammpaignID] = useState('');
    const [createdAdsetID, setCreatedAdsetID] = useState('');
    const [createdAdsID, setcreatedAdsID] = useState('');
    const [isPublishDisabled, setIsPublishDisabled] = useState(true);
    const [isPublishLaterDisabled, setIsPublishLaterDisabled] = useState(true);
    const [isBackStep, setIsBackStep] = useState(true);

    const [errorEmptyCampaign, setErrorEmptyCampaign] = useState("");
    const [errorEmptyAdAccount, setErrorEmptyAdAccount] = useState("");
    const [errorEmptyBudget, setErrorEmptyBudget] = useState("");

    const handleObjectiveChange = (objective) => {
        setCreateAdData({
            ...createAdData,
            campaignObjective: objective
        });
    };

    const handleCampaignNameChange = (e) => {
        setCreateAdData({
            ...createAdData,
            campaignName: e.target.value
        });
    };

    useEffect(() => {
        if (connectedAccount && connectedAccount.length > 0) {
            // Set first account as default
            const firstAccount = connectedAccount[0];
            setSelectedAccount(firstAccount);
            
            // Set first page of first account as default
            if (firstAccount.socialPage && firstAccount.socialPage.length > 0) {
                setSelectedPage(firstAccount.socialPage[0]);
                setShowAccountPages(firstAccount.socialPage);
            }
        }
    }, [connectedAccount]);

    const getProgressPercent = (step) => {
        switch (step) {
            case 1: return 0;   // Step 1 → 0%
            case 2: return 50;  // Step 2 → 25%
            case 3: return 75;  // Step 3 → 50%
            case 4: return 100; // Step 4 → 100%
            default: return 0;
        }
    };

    useEffect(() => {
        // Update step-indicator classes
        document.querySelectorAll(".step-indicator").forEach((step) => {
            const stepNum = parseInt(step.getAttribute("data-step"));
            step.classList.toggle("active", stepNum === currentStep);
        });

        // Show correct page and hide others
        document.querySelectorAll(".page").forEach((page, index) => {
            page.classList.toggle("d-none", index + 1 !== currentStep);
        });

        // Update progress line
        const progressFill = document.getElementById("progressLineFill");
        // if (progressFill) {
        //     const percent = ((currentStep - 1) / (totalSteps - 1)) * 100;
        //     progressFill.style.height = `${percent}%`;
        // }

        if (progressFill) {
            progressFill.style.height = `${getProgressPercent(currentStep)}%`;
        }

        // Toggle publish button
        const publishBtn = document.getElementById("publishBtn");
        if (publishBtn) {
            publishBtn.classList.toggle("d-none", currentStep !== totalSteps);
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSocialAccountList(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }
            if (buyingTypeDropdownRef.current && !buyingTypeDropdownRef.current.contains(event.target)) {
                setShowBuyingTypeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);       

    }, [currentStep]);

    useEffect(() => {
        if (selectedBuyingType) {
            setCreateAdData(prev => ({
                ...prev,
                campaignBuyingType: selectedBuyingType.objectiveCategory
            }));
        }
    }, [selectedBuyingType]);

    useEffect(() => {
        if (selectedCategory) {
            setCreateAdData(prev => ({
            ...prev,
            campaignCategory: selectedCategory.value
            }));
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedAccount && selectedAccount.socialPage) {
            // Set first page as default when account changes
            if (selectedAccount.socialPage.length > 0 && !selectedPage) {
            setSelectedPage(selectedAccount.socialPage[0]);
            }
            setShowAccountPages(selectedAccount.socialPage);
        }
    }, [selectedAccount]);  
    
    useEffect(() => {
        // Get unique platforms from all enabled placements
        const uniquePlatforms = [
            ...new Set(
                campaignPlacements
                    .filter(p => p.enabled)
                    .map(p => p.platform)
            )
        ];
        setCampaignPublisherPlatform(uniquePlatforms);
    }, [campaignPlacements]);

    const handleNext = () => {
        // Step 1 → Step 2 check
        if (currentStep === 1) {
            if (selectedAdAccountId === null || selectedAdAccountId === "") {
                setErrorEmptyAdAccount("Ad account is required.");
                toast.error("Ad account is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return;
            }

            if (!createAdData.campaignName?.trim()) {
                setErrorEmptyCampaign("Campaign name is required.");
                toast.error("Campaign name is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return;
            }                      
        } else if (currentStep === 2) {            
            if (budgetAmount===0.00 || budgetAmount===0 || budgetAmount==="") {
                setErrorEmptyBudget("Budget is required.");
                toast.error("Budget is required.", {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
                return;
            }
        }

        setErrorEmptyCampaign("");
        const nextStep = Math.min(currentStep + 1, totalSteps);
        setCurrentStep(nextStep);

        if (nextStep === 3) {
            setShowCreateAdModal(true);
        }
    };

    const handleBack = () => {
        //setCurrentStep(prev => Math.max(prev - 1, 1));
        setCurrentStep(prev => {
            if (prev === 4) {
                return 2;
            }
            return Math.max(prev - 1, 1);
        });
    };

    const filterPages = (account) => {
        setSelectedAccount(account);
        setShowAccountPages(account.socialPage);        
        // Auto-select first page when account changes
        if (account.socialPage && account.socialPage.length > 0) {
            setSelectedPage(account.socialPage[0]);
        } else {
            setSelectedPage(null);
        }
    };    

    const handlePageSelect = (pageDetail) => {
        setSelectedPage(pageDetail);
        setShowSocialPages(false);
    };

    const handleAddAccount = () => {
        setShowAddAccountModal(true);
    };

    // Handle checkbox selection/deselection
    const handleAdAccountSelect = (e, adAccount) => {        
        const isChecked = e.target.checked;
        if (isChecked) {
            // Add to selected accounts
            setSelectedAdAccounts(prev => [...prev, adAccount]);
        } else {
            // Remove from selected accounts
            setSelectedAdAccounts(prev => 
                prev.filter(account => account.account_name !== adAccount.account_name)
            );
        }
    };
    
    const chooseAdsAccountDone = async () => {
        //console.log("Selected Ad Accounts:", selectedAdAccounts);        
        //setShowAddAccountModal(false); 
        setLoader(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        const selectedAdAccountIds = selectedAdAccounts.map(account => account.account_id);
        try {
            const responseData = await fetch(`${BACKEND_URL}/api/ads-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ 
                    accounts: selectedAdAccountIds,
                    selectedAccount:selectedAccount.social_id
                }),
            });
            const response = await responseData.json();
            if (response.adsAccounts && Array.isArray(response.adsAccounts)) {
                const responseAccountIds = response.adsAccounts.map(acc => String(acc.ads_accounts));
                // Update local selected accounts
                const updatedAccounts = selectedAdAccounts.map(account => {
                    if (responseAccountIds.includes(account.account_id)) {
                    return { ...account, isConnected: 'Connected' };
                    }
                    return account;
                });
                setSelectedAdAccounts(updatedAccounts);
                // Update parent's connected accounts
                const updatedConnectedAccounts = connectedAccount.map(account => ({
                    ...account,
                    AdsAccounts: account.AdsAccounts?.map(ad => 
                    responseAccountIds.includes(ad.account_id) 
                        ? { ...ad, isConnected: 'Connected' }
                        : ad
                    )
                }));
                updateConnectedAccounts(updatedConnectedAccounts);
            }
            //console.log('response',response.adsAccounts);
            // if (response.adsAccounts && Array.isArray(response.adsAccounts)) {
            //     const responseAccountIds = response.adsAccounts.map(acc => String(acc.ads_accounts));

            //     const updatedAccounts = selectedAdAccounts.map(account => {
            //         if (responseAccountIds.includes(account.account_id)) {
            //             return {
            //                 ...account,
            //                 isConnected: 'Connected'
            //             };
            //         }
            //         return account;
            //     });

            //     setSelectedAdAccounts(updatedAccounts);
            //     //console.log("Updated accounts:", updatedAccounts);
            //     //console.log('selectedAdAccounts',selectedAdAccounts);
            // }
            setLoader(false);
            setShowAddAccountModal(false);            
        } catch (error) { 
            console.log(error.message || 'Failed to connect Facebook account');
            setLoader(false);
        }       
    };

    const handleAdAccountChange = (e) => {
        const accountId = e.target.value;        
        if(accountId!='' || accountId!='Select a Account'){
            setSelectedAdAccountId(accountId); 
            setErrorEmptyAdAccount('');   
            // Find the selected account object
            const selectedAccount = connectedAccount.flatMap(account => 
                account.AdsAccounts || []
            ).find(ad => ad.account_id === accountId);
            
            if (selectedAccount) {
                setSelectedAdAccounts([selectedAccount]);
            }
        }            
    };

    const handleOptimizationChange = (e) => {
        const selectedId = e.target.value;
        if(selectedId!='')
        {
            const selectedItem = optimizationAddelivery.find(item => item.id === selectedId);
            setCreateAdData(prev => ({
                ...prev,
                optimizationAddelivery: selectedItem.value
            }));
            //console.log("Selected Optimization:", selectedItem);
        } else {
            setCreateAdData(prev => ({
                ...prev,
                optimizationAddelivery: ''
            }));
        } 
    }; 
    
    const handleSpecialCategoryChange = (e) => {
        setIsSpecialCategory(e.target.checked);
        setSelectedCategory(null);
    };
    
    const handleAudienceModal = () => {
        setShowAudienceModal(true);
    };

    const handleDateChange = (dateOnly) => {
        const now = new Date();        
        const combinedDate = new Date(
            dateOnly.getFullYear(),
            dateOnly.getMonth(),
            dateOnly.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        );
        setCampaignEndDate(combinedDate);
    };

    const handleSearchTargeting = async (e) => {
        if(/^[a-zA-Z]*$/.test(e.target.value)) {            
            setTargetingSearch(e.target.value);
            if(e.target.value.length > 1) {             
                const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
                const authToken = localStorage.getItem('authToken');                
                try {
                    setTargetingLoader(true);
                    const responseData = await fetch(`${BACKEND_URL}/api/fetch-targeting`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + authToken
                        },
                        body: JSON.stringify({ 
                            queryText: e.target.value,
                            selectedAccount:selectedAccount.social_id
                        }),
                    });
                    const queryResponse = await responseData.json();
                    setTargetingResults(queryResponse.targetingData);
                    setShowSuggestions(true);
                    setTargetingLoader(false);
                } catch (error) { 
                    console.log(error.message || 'Failed to connect Facebook account');                    
                    setTargetingResults([]);
                    setShowSuggestions(false);
                    setTargetingLoader(false);
                }
            } else {
                setTargetingResults([]);
                setShowSuggestions(false);
                setTargetingLoader(false);
            }            
        }
    };     

    const handleSelectInterst = (selectedInterst) => {
        setSelectedInterest({
            id: selectedInterst.id,
            name: selectedInterst.name
        });
        setTargetingSearch('');
        setShowSuggestions(false);
    };   

    // function convertToFacebookTime(dateStr) {
    //     console.log('dateStr: ',dateStr);
    //     // Example input: "Thu, Jul 31 at 6:13 PM"
    //     const parts = dateStr.match(/(\w+), (\w+) (\d{1,2}) at (\d{1,2}):(\d{2}) (AM|PM)/);
    //     if (!parts) return null;

    //     const [, , month, day, hourStr, minuteStr, meridian] = parts;
    //     const year = new Date().getFullYear();
    //     let hour = parseInt(hourStr, 10);
    //     const minute = parseInt(minuteStr, 10);

    //     // Convert to 24-hour format
    //     if (meridian === 'PM' && hour !== 12) hour += 12;
    //     if (meridian === 'AM' && hour === 12) hour = 0;

    //     // Create date without applying UTC conversion
    //     const date = new Date(year, 
    //         new Date(`${month} 1, ${year}`).getMonth(), // month index
    //         parseInt(day, 10), 
    //         hour, 
    //         minute, 
    //         0
    //     );

    //     // Format as YYYY-MM-DDTHH:mm:ss
    //     const pad = num => num.toString().padStart(2, '0');
    //     return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    // }

    function convertToFacebookTime(dateInput) {
        // If it's a string, convert to Date
        const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
        const pad = num => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    const createfacebookAds = async () => {
        if (selectedAdAccountId === null || selectedAdAccountId === "") {
            setErrorEmptyAdAccount("Ad account is required.");
            toast.error("Ad account is required.", {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });
            return;
        }

        if (!createAdData.campaignName?.trim()) {
            setErrorEmptyCampaign("Campaign name is required.");
            toast.error("Campaign name is required.", {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });
            return;
        }

        if (budgetAmount===0.00 || budgetAmount===0 || budgetAmount==="") {
            setErrorEmptyBudget("Budget is required.");
            toast.error("Budget is required.", {
                position: 'top-right',
                autoClose: 5000,
                autoClose: true,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });
            return;
        }

        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        const selectedAdAccountIds = selectedAdAccounts.map(account => account.account_id);
        setCreateAdLoader(true);
        setIsBackStep(false);
        setAdsetStatus('');
        setAdsetLoader(false);
        setCreateAdError(false);
        setCreateAdErrorMessage('');
        setAdsetStatus('');
        setAdCreativeStatus('');
        setAdCreativeLoader(false);          

        try { 
            setCurrentStep(4);
            setShowCreateAdModal(false); 
            setCammpaignLoader(true);
            setCammpaignStatus('');
            setCreatedCammpaignID('');   
            // Prepare FormData
            const formData = new FormData();
            const startDateFormatted = convertToFacebookTime(campaignStartDate);
            const endDateFormatted = convertToFacebookTime(campaignEndDate);            
            
            const payload = {
                AdsAccounts: selectedAdAccountIds,
                socailAccount: selectedAccount.social_id,
                pageDetail: selectedPage.pageId,
                daily_type: selectedBudgetType,
                daily_budget: budgetAmount,
                start_time: startDateFormatted,
                end_time: endDateFormatted,
                campaignData: {
                    ...createAdData                  
                }
                // adsetsData: {
                //     daily_type: selectedBudgetType,
                //     daily_budget: budgetAmount,
                //     optimization_goal: defaultOptimization,
                //     start_time: StartDateformatted,
                //     end_time: formattedEndTime,
                //     countries,
                //     age_min: audienceAge.min,
                //     age_max: audienceAge.max,
                //     genders,
                //     interests: selectedInterest ? [selectedInterest] : [],
                //     device_platforms: selectedDeviceType,
                //     facebook_positions,
                //     instagram_positions,
                // }
            };

            formData.append("data", JSON.stringify(payload));
            const responseData = await fetch(`${BACKEND_URL}/api/create-campaign`, {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + authToken,
                },
                body: formData,
            });

            const response = await responseData.json();
            //console.log('response', response);
            if(response.success===false){
                // toast.error(response.error_user_msg, {
                //     position: 'top-right',
                //     autoClose: 5000,
                //     autoClose: true,
                //     hideProgressBar: false,
                //     closeOnClick: true,
                //     theme: "colored",
                // });
                //console.log('response error: ',response); 
                setCreateAdError(true);
                setCreateAdErrorMessage(response.error_user_msg);                          
                setCreateAdLoader(false);
                setCammpaignLoader(false);
                setCammpaignStatus('error');
                setIsPublishDisabled(true);
                setIsPublishLaterDisabled(true);
                setIsBackStep(true);
            } else if(response.success===true){
                //console.log('response', response);            
                //setCreateAdLoader(false);
                const campaignID = response.resData;
                let genders = '0'; // default ALL
                if (selectedGender === "Male") genders = '1';
                else if (selectedGender === "Female") genders = '2';

                const countries = selectedCampaignLocation.map(location => location.code);
                const facebook_positions = campaignPlacements
                    .filter(p => p.platform === "facebook" && p.enabled)
                    .map(p => p.value);
                const instagram_positions = campaignPlacements
                    .filter(p => p.platform === "instagram" && p.enabled)
                    .map(p => p.value);

                const StartDateformatted = convertToFacebookTime(campaignStartDate);
                const formattedEndTime = convertToFacebookTime(campaignEndDate);

                const adsetsData = {
                    daily_type: selectedBudgetType,
                    daily_budget: budgetAmount,
                    optimization_goal: defaultOptimization,
                    start_time: StartDateformatted,
                    end_time: formattedEndTime,
                    countries,
                    age_min: audienceAge.min,
                    age_max: audienceAge.max,
                    genders,
                    interests: selectedInterest ? [selectedInterest] : [],
                    device_platforms: selectedDeviceType,
                    PublisherPlatform:campaignPublisherPlatform,
                    facebook_positions,
                    instagram_positions,
                }
                const campaignName = createAdData.campaignName;
                setCammpaignLoader(false);
                setCammpaignStatus('created');
                setCreatedCammpaignID(campaignID);
                await createCampiagnAdset(campaignID,campaignName,adsetsData);
            }
        } catch (error) {
            console.log(error);            
            // toast.error('Something went wrong', {
            //     position: 'top-right',
            //     autoClose: 5000,
            //     autoClose: true,
            //     hideProgressBar: false,
            //     closeOnClick: true,
            //     theme: "colored",
            // })
            setCreateAdError(true);
            setCreateAdErrorMessage('Something went wrong');
            setCreateAdLoader(false);
            setCammpaignLoader(false);
            setCammpaignStatus('error');
            setIsPublishDisabled(true);
            setIsPublishLaterDisabled(true);
            setIsBackStep(true);
        }
    };

    const createCampiagnAdset = async (campaignID,campaignName,adsetsData) => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');     
        const selectedAdAccountIds = selectedAdAccounts.map(account => account.account_id);
        setIsBackStep(false);
        try { 
            setAdsetStatus('');
            setAdsetLoader(true);           
            setCreatedAdsetID('');
            const payload = {
                socailAccount: selectedAccount.social_id,
                AdsAccounts: selectedAdAccountIds,
                campaign_id: campaignID,
                campaignAdsetsName: campaignName,
                adsetsData: adsetsData
            };
            //console.log('payload',payload);
            const formData = new FormData();
            formData.append("data", JSON.stringify(payload));
            const responseData = await fetch(`${BACKEND_URL}/api/create-adsets`, {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + authToken,
                },
                body: formData,
            });
            const adsetResponse = await responseData.json();
            //console.log(adsetResponse);
            if(adsetResponse.success===false){
                // toast.error(adsetResponse.error_user_msg, {
                //     position: 'top-right',
                //     autoClose: 5000,
                //     autoClose: true,
                //     hideProgressBar: false,
                //     closeOnClick: true,
                //     theme: "colored",
                // });
                setCreateAdError(true);
                setCreateAdErrorMessage(adsetResponse.error_user_msg);
                setIsBackStep(true);
                setCreateAdLoader(false);
                setAdsetLoader(false);
                setAdsetStatus('error'); 
                setIsPublishDisabled(true);
                setIsPublishLaterDisabled(true);               
            } else if(adsetResponse.success===true){
                const adset_id = adsetResponse.adset_id;
                setCreateAdLoader(false);
                setAdsetLoader(false);
                setAdsetStatus('created');
                setCreatedAdsetID(adset_id);
                await createAds(adset_id,campaignID);
            }            
        } catch (error) {
            console.log('error: ',error);
            setCreateAdError(true);
            setCreateAdErrorMessage('Something went wrong');
            setCreateAdLoader(false);
            setAdsetLoader(false);
            setAdsetStatus('error');
            setIsBackStep(true);
        }
    };

    const createAds = async (adsetID,campaignID) => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        const selectedAdAccountIds = selectedAdAccounts.map(account => account.account_id);
        //console.log('sss',createAdData.createAdImages.length);
        setAdCreativeStatus('');
        setAdCreativeLoader(true);
        setcreatedAdsID('');
        setIsBackStep(false);
        try {         
            const {
                createAdName,
                createAdContent,
                createAdHeadline,
                createAdWebsiteURL,
                createAdCallToAction
            } = createAdData;

            const payload = {
                AdsAccounts: selectedAdAccountIds,
                socailAccount: selectedAccount.social_id,
                pageDetail: selectedPage.pageId,
                cammpaign_ID:campaignID,
                adset_ID: adsetID,
                createAddata: {
                    createAdName,
                    createAdContent,
                    createAdHeadline,
                    createAdWebsiteURL,
                    createAdCallToAction                    
                }
            };

            const formData = new FormData();
            if (createAdData.createAdImages.length > 0) {
                createAdData.createAdImages.forEach((imgObj, index) => {
                    formData.append('images', imgObj.file); 
                });
            }
                 
            formData.append("data", JSON.stringify(payload));
            const responseData = await fetch(`${BACKEND_URL}/api/create-ads`, {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + authToken,
                },
                body: formData,
            });
            const adResponse = await responseData.json();
            //console.log('create ad res:',adResponse);
            if(adResponse.success===false){
                // toast.error(adResponse.error_user_msg, {
                //     position: 'top-right',
                //     autoClose: 5000,
                //     autoClose: true,
                //     hideProgressBar: false,
                //     closeOnClick: true,
                //     theme: "colored",
                // });
                setCreateAdError(true);
                setCreateAdErrorMessage(adResponse.error_user_msg);
                setCreateAdLoader(false);
                setAdCreativeLoader(false);
                setAdCreativeStatus('error');
                setIsPublishDisabled(true);
                setIsPublishLaterDisabled(true);
                setIsBackStep(true);
            } else if(adResponse.success===true){                
                //console.log('create ad',adResponse.ad_id);
                setAdCreativeLoader(false);
                setCreateAdLoader(false);
                setcreatedAdsID(adResponse.ad_id);
                setAdCreativeStatus('created');
                setIsPublishDisabled(false);
                setIsPublishLaterDisabled(false);
            }
        } catch (error) {
            console.log('create ad error',error);
            setCreateAdLoader(false);
            setAdCreativeLoader(false);
            setAdCreativeStatus('error');
            setCreateAdError(true);
            setCreateAdErrorMessage("create ad error");
            setIsPublishDisabled(true);
            setIsBackStep(true);
            // toast.error('create ad error', {
            //     position: 'top-right',
            //     autoClose: 5000,
            //     autoClose: true,
            //     hideProgressBar: false,
            //     closeOnClick: true,
            //     theme: "colored",
            // });            
        }
    }

    const publishCampaign = async (changeStatus) => {              
        //console.log('social_id: ',selectedAccount.social_id);
        //console.log(createdCammpaignID,createdAdsetID,createdAdsID);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken'); 
        setCampaignPublishLoader(true);
        setIsPublishDisabled(true);   

        try {
            const payload = {
            socailAccount: selectedAccount.social_id,
            campaignID: createdCammpaignID,
            campaignAdsetsID: createdAdsetID,
            campaignAdID: createdAdsID,
            changeStatus:changeStatus
        };
            const formData = new FormData();
            formData.append("data", JSON.stringify(payload));
            const responseData = await fetch(`${BACKEND_URL}/api/campaign-update-status`, {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + authToken,
                },
                body: formData,
            });
            const response = await responseData.json();            
            //console.log('adResponse',response);
            if(response.success===true){
                setCammpaignStatus('');
                setAdsetStatus('');
                setAdCreativeStatus('');
                setSelectedPage(null);
                setSelectedAdAccounts([]);
                setSelectedAdAccountId(null);
                setIsSpecialCategory(false);
                setShowCategoryDropdown(false);
                setSelectedBudgetType("daily");
                setBudgetAmount('');
                setAudienceAge({min: 18,max: 65,});
                setSelectedCampaignLocation([{code:"US",name:"United States"}]);
                setTargetingSearch('');
                setTargetingResults([]);    
                setTargetingLoader(false);
                setSelectedInterest(null);
                setShowSuggestions(false);
                setShowCreateAdModal(false);
                setCreateAdData({
                    ...createAdData,
                    campaignName:'',
                    campaignBuyingType: selectedBuyingType?.objectiveCategory || 'AUCTION',
                    campaignObjective:"OUTCOME_TRAFFIC",
                    optimizationAddelivery:defaultOptimization,
                    campaignCategory:'',
                    createAdName:'',
                    createAdContent:'',
                    createAdHeadline:'',
                    createAdWebsiteURL:'',
                    createAdCallToAction:selectedCreateAdButtonType.value,
                    createAdImages:[],
                });
                setCreatedCammpaignID('');
                setCreatedAdsetID('');
                setcreatedAdsID('');
                setCurrentStep(1);
                setShowAddAccountModal(false);
                setCampaignPublishLoader(false);
                setIsPublishDisabled(true);
                setIsPublishLaterDisabled(true);
                setIsBackStep(true);
                toast.success('Campaign publish succssfuly.', {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });                
            } else if(response.success===false){
                setCampaignPublishLoader(false);
                setIsPublishDisabled(true);
                setIsPublishLaterDisabled(true);
                setIsBackStep(true);
                toast.error('Something wrong while publish.', {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else {
                setCampaignPublishLoader(false);
                setIsPublishDisabled(true);
                setIsBackStep(true);
                toast.error('Something wrong while publish.', {
                    position: 'top-right',
                    autoClose: 5000,
                    autoClose: true,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        } catch (error) {
            console.log('error while publish campaign: ',error);
            setIsBackStep(true);
        }
    };

    const campiagnPublishLater = () => {
        setIsPublishLaterDisabled(true);
        setCammpaignStatus('');
        setAdsetStatus('');
        setAdCreativeStatus('');
        //setSelectedPage(null);
        setSelectedAdAccounts([]);
        setSelectedAdAccountId(null);
        setIsSpecialCategory(false);
        setShowCategoryDropdown(false);
        setSelectedBudgetType("daily");
        setBudgetAmount('');
        setAudienceAge({min: 18,max: 65,});
        setSelectedCampaignLocation([{code:"US",name:"United States"}]);
        setTargetingSearch('');
        setTargetingResults([]);    
        setTargetingLoader(false);
        setSelectedInterest(null);
        setShowSuggestions(false);
        setShowCreateAdModal(false);
        setCreateAdData({
            ...createAdData,
            campaignName:'',
            campaignBuyingType: selectedBuyingType?.objectiveCategory || 'AUCTION',
            campaignObjective:"OUTCOME_TRAFFIC",
            optimizationAddelivery:defaultOptimization,
            campaignCategory:'',
            createAdName:'',
            createAdContent:'',
            createAdHeadline:'',
            createAdWebsiteURL:'',
            createAdCallToAction:selectedCreateAdButtonType.value,
            createAdImages:[],
        });
        setCreatedCammpaignID('');
        setCreatedAdsetID('');
        setcreatedAdsID('');
        setCurrentStep(1);
        setShowAddAccountModal(false);
        setCampaignPublishLoader(false);
        setIsBackStep(true);
    };        

    return (
        <>
            <Modal dialogClassName="custom-modal-width" show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
                <Modal.Header closeButton onHide={onHide}>
                    <Modal.Title style={{fontSize:'15px'}}>
                        <h5 className="modal-title" id="createAdModalLabel">Create New Ad Campaign</h5>
                    </Modal.Title>                
                </Modal.Header>
                <Modal.Body>            
                    <div className="row">
                        <div className="col-2 col-sm-4 col-md-5 col-xl-4 left-sidebar-steps">
                            <div className="progress-container">
                                <div className="progress-steps">
                                    <div className="progress-line"></div>
                                    <div id="progressLineFill" className="progress-line-fill"></div>
                                    
                                    <div 
                                        className={`step-indicator ${currentStep > 1 ? 'completed' : ''}${currentStep === 1 ? 'active' : ''} `} 
                                        data-step="1" onClick={() => setCurrentStep(1)}>
                                        <div className="step-marker">
                                            <div className="step-circle">1</div>
                                            <div className="step-line"></div>
                                        </div>
                                        <div className={`step-content w-100`}>
                                            <div className='d-flex justify-content-between gap-1'> 
                                                <h6 className='fw-bold'>Set you campaign objective </h6>  
                                               <i className='fa-regular fa-pen-to-square p-1 fw-bold'></i> 
                                            </div>
                                            <p>Social account</p>
                                            <p>
                                                {selectedAccount && selectedAccount.social_id && selectedAccount.name ? (
                                                    <strong> {selectedAccount.name} </strong>
                                                ) : (
                                                    <strong> Null </strong>
                                                )}
                                            </p>
                                                
                                            <p>Page</p>
                                            <p>
                                                {selectedPage ? (
                                                    <strong> {selectedPage.pageName} </strong>
                                                ) : (
                                                    <strong> Null </strong>
                                                )}
                                            </p>    
                                            <p className={`step-content w-100 ${errorEmptyAdAccount ? 'text-danger' : ''}`}>Add Account</p>
                                            <p>
                                                <strong> 
                                                    {!selectedAdAccountId 
                                                        ? "No account" 
                                                        : (() => {
                                                        const selected = selectedAdAccounts.find(acc => acc.account_id === selectedAdAccountId);
                                                        return selected ? selected.account_name : "No account";
                                                        })()
                                                    }
                                                </strong>
                                            </p>
                                                
                                            <p className={`step-content w-100 ${errorEmptyCampaign ? 'text-danger' : ''}`}>Campaign Name</p>
                                            <p>
                                                <strong> {createAdData.campaignName || 'Null'} </strong>
                                            </p> 
                                            <p>Campaign objective</p>
                                            <p>
                                                <strong> {formatObjective(createAdData.campaignObjective)}</strong>
                                            </p>
                                        </div>

                                        {/* <div className="step-circle">1</div>
                                        <div className="">
                                            <h6>Set you campaign objective</h6>
                                            <div className="mb-2 mt-2"> Social account
                                                <div className="">
                                                    {selectedAccount && selectedAccount.social_id && selectedAccount.name ? (
                                                        <strong> {selectedAccount.name} </strong>
                                                    ) : (
                                                        <strong> Null </strong>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mb-2"> Page
                                                <div className="">
                                                    {selectedPage ? (
                                                        <strong> {selectedPage.pageName} </strong>
                                                    ) : (
                                                        <strong> Null </strong>
                                                    )}                                                 
                                                </div>
                                            </div>
                                            <div className="mb-2"> Add Account                                                
                                                <div> 
                                                    <strong> 
                                                        {!selectedAdAccountId 
                                                            ? "No account" 
                                                            : (() => {
                                                                const selected = selectedAdAccounts.find(acc => acc.account_id === selectedAdAccountId);
                                                                return selected ? selected.account_name : "No account";
                                                                })()
                                                        }
                                                    </strong> 
                                                </div>                                                
                                            </div>
                                            <div className="mb-2"> Campaign Name
                                                <div> 
                                                    <strong> {createAdData.campaignName || 'Null'} </strong>
                                                </div>
                                            </div>
                                            <div className="mb-2"> Campaign objective
                                                <div> 
                                                    <strong> {formatObjective(createAdData.campaignObjective)} </strong> 
                                                </div>
                                            </div>
                                            <div className="mb-2"> Objective and delivery
                                                <div> 
                                                    <strong> {formatObjective(createAdData.optimizationAddelivery)} </strong>                                                    
                                                </div>
                                            </div>
                                        </div> */}
                                    </div>

                                    <div className={`step-indicator mt-2 ${currentStep > 2 ? 'completed' : ''}${currentStep === 2 ? 'active' : ''}`} data-step="2" onClick={() => setCurrentStep(2)}>
                                        <div className="step-marker">
                                            <div className="step-circle">2</div>
                                            <div className="step-line"></div>
                                        </div>
                                        <div className={`step-content w-100`}>
                                            <div className='d-flex justify-content-between gap-1'>
                                                <h6 className='fw-bold'>Choose your audience and budget </h6>
                                                <i className='fa-regular fa-pen-to-square p-1 fw-bold'></i>
                                            </div>                                                
                                            <p>Audience</p>
                                            <p><strong> Built audience </strong></p>
                                            <p>Placements</p>
                                            <p>
                                                <strong> Automatic placements </strong>
                                            </p>
                                            <p className={`${errorEmptyBudget ? 'text-danger' : ''}`}>Budget</p>
                                            <p className={`${errorEmptyBudget ? 'text-danger' : ''}`}>
                                                <strong> {formatCurrency(budgetAmount)} {selectedBudgetType === 'daily' ? 'Per day' : selectedBudgetType === 'lifetime' ? 'Total' : ''} </strong>
                                            </p>
                                            <p>Duration</p>
                                            <p>
                                                <div> <strong>From -</strong> {customFormatDate(campaignStartDate)} </div>
                                                <div> <strong> To -</strong> {campaignEndDate ? customFormatDate(campaignEndDate) : 'Select a date'}</div>
                                            </p>
                                        </div>
                                        
                                        {/* <div className="step-circle">2</div>
                                        <div className="">
                                            <h6>Choose your audience and budget </h6>
                                            <div className="mb-2"> Audience
                                                <div> <strong> Built audience </strong> </div>
                                            </div>
                                            <div className="mb-2">Placements
                                                <div> <strong> Automatic placements </strong> </div>
                                            </div>
                                            <div className="mb-2"> Budget
                                                <div> 
                                                    <strong> {formatCurrency(budgetAmount)} {selectedBudgetType === 'daily' ? 'Per day' : selectedBudgetType === 'lifetime' ? 'Total' : ''} </strong> 
                                                </div>
                                            </div>
                                            <div className="mb-2"> Duration
                                                <div> <strong>From -</strong> {customFormatDate(campaignStartDate)} </div>
                                                <div> <strong> To -</strong> {campaignEndDate ? customFormatDate(campaignEndDate) : 'Select a date'}</div>
                                            </div>
                                        </div> */}
                                    </div>

                                    <div className={`step-indicator mt-2 ${currentStep > 3 ? 'completed' : ''}${currentStep === 3 ? 'active' : ''}`} data-step="3" 
                                        onClick={() => {
                                            setCurrentStep(3);
                                            setShowCreateAdModal(true);
                                        }}
                                        >
                                        <div className="step-marker">
                                            <div className="step-circle">3</div>
                                            <div className="step-line"></div>
                                        </div>
                                        <div className="step-content w-100">
                                            <div className='d-flex justify-content-between gap-1'>
                                                <h6 className='fw-bold'>Create your ads </h6> 
                                                <i className='fa-regular fa-pen-to-square p-1 fw-bold'></i>
                                            </div>                                            
                                            <p>Draft the content for your ads</p>
                                        </div>
                                        {/* <div className="step-circle">3</div>
                                        <div className="">
                                            <h6>Create your ads</h6>
                                            <div> Draft the content for your ads</div>
                                        </div> */}
                                    </div>

                                    <div className={`step-indicator mt-2 ${currentStep === 4 ? 'active' : ''}`} data-step="4">
                                        <div className="step-marker">
                                            <div className="step-circle">4</div>                                            
                                        </div>
                                        <div className="step-content">
                                            <h6 className='fw-bold'>Publish campaign</h6>
                                            <p>Send to Meta to validate and publish</p>
                                        </div>
                                        {/* <div className="step-circle">4</div>
                                        <div className=" ">
                                            <h6>Publish campaign</h6>
                                            <div> Send to Meta to validate and publish</div>
                                        </div> */}
                                    </div>

                                </div>
                            </div>
                        </div>
                        <div className="col-10 col-sm-8 col-md-7 col-xl-8  custom-y-scroll">
                            {/* step one */}
                            <div className="page" id="page1">
                                <div className="step-one">
                                    {/* <div className="my-2">
                                        <h6 className='fw-bold'> Choose a campaign objective </h6>
                                        <p className="custom_p"> 
                                            Get started bt selectiong the ad account and bojective for your campaign.
                                        </p>
                                    </div> */}

                                    <div className="my-2">
                                        <h5 className='fw-bold'> Set your campaign objective </h5>
                                        <p className="custom_p"> 
                                            Choose who you want to see your ad on Facebook, then set your budget and when you want your campaign to run.
                                        </p>
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Social account</label>
                                        <p className="d-block mb-2">
                                            Choose the Facebook socail account you want to use for pages and ad account.
                                        </p>
                                    </div>

                                    <div className="my-2">
                                        <div ref={dropdownRef} onClick={() => setShowSocialAccountList(!showSocialAccountList)} className="position-relative mt-2">
                                            <div className="form-control pe-4 custom-select-input">
                                                <div className="selected-pages-container">
                                                    {selectedAccount && selectedAccount.social_id && selectedAccount.name ? (
                                                        <div key={selectedAccount.social_id} className="selected-page-item">
                                                            <img
                                                                src={selectedAccount.img_url}
                                                                alt={selectedAccount.name}
                                                                className="selected-page-image"
                                                            />
                                                            <span className="selected-page-name">
                                                                {selectedAccount.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Select socail account </span>
                                                    )}
                                                </div>
                                            </div>
                                            {showSocialAccountList ? (
                                                <span  className="position-absolute end-0 translate-middle-y me-2"
                                                    style={{ cursor: 'pointer', pointerEvents: 'none', top: '20px' }}>
                                                    <i className="fas fa-chevron-up text-muted" />
                                                </span>
                                            ) : (
                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                    style={{ cursor: 'pointer', pointerEvents: 'none' }}>
                                                    <i className="fas fa-chevron-down text-muted" />
                                                </span>
                                            )}
                                            {showSocialAccountList && (
                                                <div>
                                                    {connectedAccount && connectedAccount.length > 0 ? (
                                                        <div className="dropdown-content">
                                                            <ul className="nested-checkbox-list">
                                                                {connectedAccount.map((account, index) => (
                                                                    <li key={account.social_id || index} className="parent-item" onClick={() => filterPages(account)} style={{cursor:'pointer'}}>
                                                                        <div className="d-flex align-items-center">
                                                                            <img
                                                                                className="user-avatar"
                                                                                src={account.img_url}
                                                                                alt="Profile"
                                                                                onError={(e) => {
                                                                                    e.target.src = '/default-avatar.png';
                                                                                }}
                                                                                style={{ width: '25px', height: '25px' }}
                                                                            />
                                                                            <div style={{ marginLeft: '0px' }}>
                                                                                <span className="user-name">
                                                                                    <b>{account.name}</b>                                                                    
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <p className="custom_p">Loading connected accounts...</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>                                                                          
                                    </div>                                

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Facebook Page and ad account </label>
                                        <p className="d-block mb-2">
                                            Choose the Facebook Page and ad account you want to use for your cammpaign.
                                        </p>
                                    </div>                                

                                    <div className="my-2">
                                        <div ref={selectPageRef} onClick={() => setShowSocialPages(!showSocialPages)} className="position-relative mt-2">
                                            <div className="form-control pe-4 custom-select-input">
                                                <div className="selected-pages-container">
                                                    {selectedPage ? (
                                                        <div className="selected-page-item">
                                                            <img
                                                                src={selectedPage.page_picture}
                                                                alt={selectedPage.pageName}
                                                                className="selected-page-image"
                                                                onError={(e) => {
                                                                    e.target.src = '/default-avatar.png';
                                                                }}
                                                            />
                                                            <span className="selected-page-name">
                                                                {selectedPage.pageName}
                                                            </span>
                                                        </div> 
                                                    ) : (
                                                        <span className="text-muted">Select page</span>
                                                    )}                                              
                                                </div>
                                            </div>
                                            
                                            {showSocialPages ? (
                                                <span className="position-absolute end-0 translate-middle-y me-2"
                                                    style={{ cursor: 'pointer', pointerEvents: 'none', top: '20px' }}>
                                                    <i className="fas fa-chevron-up text-muted" />
                                                </span>
                                            ) : (
                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                    style={{ cursor: 'pointer', pointerEvents: 'none' }}>
                                                    <i className="fas fa-chevron-down text-muted" />
                                                </span>
                                            )}
                                            
                                            {showSocialPages && (
                                                <div>
                                                    {showAccountPages.length > 0 ? (
                                                        <div className="dropdown-content">
                                                            <ul className="nested-checkbox-list">
                                                                {showAccountPages.map((pageDetail, index) => (
                                                                    <li 
                                                                        key={index} 
                                                                        className="parent-item" 
                                                                        onClick={() => handlePageSelect(pageDetail)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    >
                                                                        <div className="d-flex align-items-center">
                                                                            <img
                                                                                className="user-avatar"
                                                                                src={pageDetail.page_picture}
                                                                                alt="Profile"
                                                                                onError={(e) => {
                                                                                    e.target.src = '/default-avatar.png';
                                                                                }}
                                                                                style={{ width: '25px', height: '25px' }}
                                                                            />
                                                                            <div style={{ marginLeft: '0px' }}>
                                                                                <span className="user-name">
                                                                                    <b>{pageDetail.pageName}</b>                                                                    
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <p className="text-danger">Choose first social account.</p>
                                                    )}
                                                </div>
                                            )}                              
                                        </div>
                                    </div>

                                    <div className="my-2 custom-border-bottom">
                                        <label for="selectPage" className="form-label">Select an ad account</label> 
                                        { 
                                            connectedAccount.some(account =>
                                                account.AdsAccounts?.some(ad => ad.isConnected === "Connected")
                                            ) ? ( connectedAccount.map(account => (account.AdsAccounts?.some(ad => ad.isConnected === "Connected") ? ( 
                                                    <>
                                                        <select 
                                                            className="form-select" 
                                                            id="selectPage" 
                                                            aria-label="Select a page"
                                                            value={selectedAdAccountId || ''}
                                                            onChange={handleAdAccountChange}
                                                        >
                                                            <option selected value={''}>Select a Account</option>
                                                            {
                                                                connectedAccount.map(account =>
                                                                    account.AdsAccounts?.map(ad =>
                                                                        ad.isConnected === "Connected" ? (
                                                                        <option key={ad.account_id} value={ad.account_id}>
                                                                            {ad.account_name || "Unnamed Account"}
                                                                        </option>
                                                                        ) : null
                                                                    )
                                                                )
                                                            }                                                            
                                                        </select>
                                                        {errorEmptyAdAccount && (
                                                            <p className="text-danger mt-2 mb-0">
                                                                {errorEmptyAdAccount}
                                                            </p>
                                                        )}
                                                        <div className="my-2"> 
                                                            <button type="button" onClick={handleAddAccount} className="btn btn-outline-primary">
                                                                + Connect a New ad Account
                                                            </button>
                                                        </div>
                                                    </>
                                                    ) : null
                                                ))
                                            ) : (
                                                <>
                                                    <div className="d-flex align-items-start gap-3">
                                                        <i className="fa-solid fa-info bg-info text-white" style={{ padding: '10px 15px', borderRadius: '20px' }}></i>
                                                        <div>
                                                            <h6 style={{ fontSize: '14px'}}>
                                                                You don't have any ad accounts connected
                                                            </h6>
                                                            <p className="custom_p mb-0">
                                                                You don't have any ad account connected to the selected page. Add an ad account to start advertising.
                                                            </p>
                                                        </div>
                                                    </div> 
                                                    <div className="my-2"> 
                                                        <button type="button" onClick={handleAddAccount} className="btn btn-outline-info">
                                                            Add an ad Account
                                                        </button>
                                                    </div>                                            
                                                </>
                                            )
                                        }
                                        {/* <div className="mt-2">
                                            <a href="#" onClick={() => setShowCreateAdModal(true)}>
                                                create-your-ads
                                            </a>
                                        </div> */}
                                    </div>

                                    <div className="mb-2 custom-border-bottom ">
                                        <label for="campaignName" className="form-label">Campaign Name</label>
                                        <small className="form-text text-muted d-block mb-2">
                                            Give your campaign a name. You can change it at any time.
                                        </small>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="campaignName" 
                                            value={createAdData.campaignName || ''}
                                            onChange={(e) => {
                                                setCreateAdData({ 
                                                    ...createAdData, 
                                                    campaignName: e.target.value 
                                                });
                                                setErrorEmptyCampaign("");
                                            }}
                                        />
                                        {errorEmptyCampaign && (
                                            <p className="text-danger mt-2 mb-0">
                                                {errorEmptyCampaign}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="mb-2">                                      
                                        <label className="form-label">Campaign buying type</label>
                                        <small className="form-text text-muted d-block mb-2">
                                            Choose how you want to buy your ads.
                                        </small>                                        
                                        <div 
                                            ref={buyingTypeDropdownRef}
                                            className="position-relative mt-2"
                                            onClick={() => setShowBuyingTypeDropdown(!showBuyingTypeDropdown)}
                                        >
                                            <div className="form-control pe-4 custom-select-input">
                                                <div className="selected-pages-container">
                                                    {selectedBuyingType ? (
                                                        <div className="selected-page-item">
                                                            <span className="selected-page-name">
                                                                {selectedBuyingType.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Select a buying type</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {showBuyingTypeDropdown ? (
                                                <span className="position-absolute end-0 translate-middle-y me-2"
                                                    style={{ cursor: 'pointer', pointerEvents: 'none', top: '20px' }}>
                                                    <i className="fas fa-chevron-up text-muted" />
                                                </span>
                                            ) : (
                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                    style={{ cursor: 'pointer', pointerEvents: 'none' }}>
                                                    <i className="fas fa-chevron-down text-muted" />
                                                </span>
                                            )}

                                            {showBuyingTypeDropdown && (
                                                <div className="dropdown-content">
                                                    <ul className="nested-checkbox-list">
                                                        <li className="parent-item" style={{cursor: 'default'}}>
                                                            <b>Select a buying type</b>
                                                        </li>
                                                        {campaignBuyingType.map((type) => (
                                                            <li 
                                                                key={type.id} 
                                                                className="parent-item" 
                                                                onClick={() => {
                                                                    setSelectedBuyingType(type);
                                                                    setShowBuyingTypeDropdown(false);
                                                                }}
                                                                style={{cursor: 'pointer'}}
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <span className="user-name">
                                                                        {type.name}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}                                            
                                        </div>
                                    </div>

                                    <div className="mb-2 custom-border-bottom ">
                                        <label for="campaign-objective" className="form-label">Campaign objective</label>
                                        <small className="form-text text-muted d-block mb-2">
                                            Your campaign objective is the business outcome you want to achieve with your campaign.
                                        </small>

                                        {/* {campaignObjective.map((objective) => ( */}
                                        {campaignObjective
                                            .filter((objective) => 
                                                objective.objectiveCategory.includes(selectedBuyingType.objectiveCategory)
                                            )
                                            .map((objective) => (
                                                <div 
                                                    className="d-flex align-items-center" 
                                                    key={objective.id}
                                                    onClick={() => handleObjectiveChange(objective.objective)}
                                                >
                                                    <div> 
                                                        <input 
                                                            className="form-check-input me-3" 
                                                            type="radio" 
                                                            name="objective" 
                                                            id={objective.name.toLowerCase()}
                                                            value={objective.name}
                                                            checked={createAdData.campaignObjective === objective.objective}
                                                            onChange={() => handleObjectiveChange(objective.objective)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label 
                                                            className="form-check-label" 
                                                            htmlFor={objective.name.toLowerCase()} 
                                                            style={{cursor: 'pointer'}}
                                                        >
                                                            <div><strong>{objective.name}</strong></div>
                                                            <div>{objective.description}</div>
                                                        </label>
                                                    </div>
                                                </div>
                                        ))}


                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Conversion location</label>
                                        <p className=" d-block mb-2">
                                            Choose where you want people to take your desired action.
                                        </p>
                                    </div>

                                    <div className="mb-2 custom-border-bottom ">
                                        <label for="campaignName" className="form-label">Website</label>
                                        <p className=" d-block mb-2">
                                            Drive traffic to your website and marketing landing pages.
                                        </p>
                                    </div>

                                    <div className="my-2 custom-border-bottom">
                                        <label for="selectPage" className="form-label">Optimization for ad delivery</label>
                                        <p className=" d-block mb-2">
                                            Choose a key result you want Meta to optimize for. Your choice affects who will see your ads.
                                        </p>
                                        <select
                                            className="form-select"
                                            id="selectPage"
                                            aria-label="Select optimization ad delivery"
                                            onChange={handleOptimizationChange}
                                            defaultValue="1"
                                        >
                                            {/* <option value="">Select a Page </option> */}
                                            {optimizationAddelivery.map((optimizationDelivery) => (
                                                <option key={optimizationDelivery.id} value={optimizationDelivery.id}>
                                                    {optimizationDelivery.name}
                                                </option>
                                            ))}
                                        </select>                                        
                                    </div> 

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Is your ad in a special category?</label>
                                        <p className=" d-block mb-2">
                                            If you're based in or targeting an audience in the United States and your ad relates to credit, employment, or housing,you must identify it to comply with Meta’s advertising policies.Special ad categories have restricted targeting options. 
                                            <a href="#">
                                                Learn more <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                            </a>
                                        </p>                                        
                                    </div>

                                    <div className="mb-2">
                                        <div className="">
                                            <input 
                                                id="cb1" 
                                                type="checkbox" 
                                                name="cb1"
                                                checked={isSpecialCategory}
                                                onChange={handleSpecialCategoryChange}
                                            />
                                            <label for="cb1" className="form-label ms-2">
                                                Yes, my ad relates to financial products and services, employment, or housing
                                            </label>
                                            <div className="checkbox"></div>
                                            {isSpecialCategory && (
                                                <div className="ms-4">
                                                    <div className="my-2">
                                                        <div ref={categoryDropdownRef} className="position-relative mt-2" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                                                            <div className="form-control pe-4 custom-select-input">
                                                                <div className="selected-pages-container">
                                                                    {selectedCategory ? (
                                                                        <div className="selected-page-item">
                                                                            <span className="selected-page-name">
                                                                                {selectedCategory.label}
                                                                            </span>
                                                                        </div>
                                                                        ) : (
                                                                        <span className="text-muted">Select a category</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {showCategoryDropdown ? (
                                                                <span  className="position-absolute end-0 translate-middle-y me-2"
                                                                    style={{ cursor: 'pointer', pointerEvents: 'none', top: '20px' }}>
                                                                    <i className="fas fa-chevron-up text-muted" />
                                                                </span>
                                                            ) : (
                                                                <span className="position-absolute end-0 top-50 translate-middle-y me-2"
                                                                    style={{ cursor: 'pointer', pointerEvents: 'none' }}>
                                                                    <i className="fas fa-chevron-down text-muted" />
                                                                </span>
                                                            )}
                                                            <div>
                                                                {showCategoryDropdown && (
                                                                    <div className="dropdown-content">
                                                                        <ul className="nested-checkbox-list">
                                                                            <li className="parent-item" style={{cursor: 'default'}}>
                                                                                <b>Select a category</b>
                                                                            </li>
                                                                            {campaignCategories.map((category) => (
                                                                                <li 
                                                                                    className="parent-item" 
                                                                                    key={category.id}
                                                                                    onClick={() => {
                                                                                        setSelectedCategory(category);
                                                                                        setShowCategoryDropdown(false);
                                                                                    }}
                                                                                    style={{cursor: 'pointer'}}
                                                                                >
                                                                                    <p style={{marginBottom:'0px',fontWeight:'500'}}>{category.label}</p> 
                                                                                    <small>{category.description}</small>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="d-flex">
                                                        <div className="p-1">
                                                            <i className="fa-solid fa-circle-info"></i>
                                                        </div>
                                                        <div>
                                                            <label className="form-label">Important information about special ad categories</label>
                                                            <p className="custom_p">
                                                                To help you comply with Facebook’s advertising policies, some audience targeting options are restricted for ads in special categories.
                                                            </p>
                                                            <ul>
                                                                <li>
                                                                    <strong>Age:</strong> Fixed to include ages 18 through 65+ and can’t be changed.
                                                                </li>
                                                                <li>
                                                                    <strong>Gender:</strong> Fixed to include all genders and can’t be changed.
                                                                </li>
                                                                <li>
                                                                    <strong>Detailed Targeting:</strong>
                                                                    Some options are unavailable.Exclusions not allowed.
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* end step one */}

                            {/* step two */}
                            <div className="page d-none" id="page2">
                                <div className="step-two">
                                    <div className="mb-2">
                                        <h5 className='fw-bold'>Decide on your audience and budget</h5>
                                        <p className=" d-block mb-2 custom_p">
                                            Your audience is the group of people who will potentially see your ad. Use our default audience settings or an audience you created on Facebook.
                                        </p>
                                    </div>
                                    
                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Audience</label>
                                        <p className="d-block mb-2">
                                            Your audience is the group of people who will potentially see your ad. Use our default audience settings or an audience you created on Facebook.
                                        </p>
                                    </div>

                                    <div className="custom-border-bottom">
                                        <div className="p-2 rounded-3" style={{backgroundColor:'#DBEAFE'}}>
                                            <div className="form-label"> 
                                                INCLUDED PEOPLE WHO MATCH
                                            </div>
                                            <div> Age: {audienceAge.min} - {audienceAge.max} </div>
                                            <div> Gender: {selectedGender} </div>
                                            {selectedCampaignLocation && selectedCampaignLocation.length > 0 ? (
                                                <div>
                                                    Location: {selectedCampaignLocation.map(loc => loc.name).join(', ')}
                                                </div>
                                                ) : (
                                                <div>Location: No location selected</div>
                                            )}
                                            <div className="form-label">
                                                POTENTIAL REACH 
                                            </div>
                                            <div> 267,520,000 </div>
                                            <div className="mt-2">
                                                <a style={{cursor:'pointer',color:'#9c30f4'}} onClick={handleAudienceModal}>Edit Audience</a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Do your ads target audiences in the EU?</label>
                                        <p className="d-block mb-2">
                                            Due to regulatory requirements in the European Union (EU), you will need to provide beneficiary and payer information if your ads target the EU or EU-associated territories.Please make sure to provide accurate information to keep your ads from being rejected by Meta.
                                            <a href=''>Learn more about EU requirements <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
                                        </p>
                                    </div>

                                    <div className="mb-2 custom-border-bottom">
                                        <div className="mb-2">
                                            <div className="">
                                                <input className="checkboxInput" id="checkboxInput" type="checkbox" name="placements"/>
                                                <label for="checkboxInput" className="form-label ms-2">
                                                    I want to manually choose the placements
                                                </label>
                                                <div className="checkbox"></div>
                                                <div className="hidden-content ms-4 ">
                                                    <div className="my-2">
                                                        <label for="beneficiaryName" className="form-label fw-bold">
                                                            Beneficiary <i className="fa-solid fa-circle-info ms-1"></i>
                                                        </label>
                                                        <input type="text" id="beneficiaryName" name="beneficiaryName" className="form-control" placeholder="Provide accurate beneficiary entity name"/>
                                                    </div>

                                                    <div className="my-2">
                                                        <label for="payer" className="form-label fw-bold">
                                                            Payer <i className="fa-solid fa-circle-info ms-1"></i>
                                                        </label>
                                                        <input type="text" id="payer" name="payer" className="form-control" placeholder="Provide accurate payer entity name"/>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Placements</label>
                                        <p className=" d-block mb-2">
                                            The automatic placements option is enabled by default,so that Facebook can show your ad where it performs best.The automatic placements option maximizes your budget and ensures that more people see your ad.
                                            <a href="#"> 
                                                Learn more about placements <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                            </a>
                                        </p>
                                    </div>

                                    <div className="mb-2 custom-border-bottom">
                                        <div className="mb-2">
                                            <div className="">
                                                <input className="checkboxInput" id="target-audiences" type="checkbox" name="target-audiences"/>
                                                <label for="target-audiences" className="form-label ms-2">
                                                    Yes, my ads target audiences in the EU
                                                </label>
                                                <div className="checkbox"></div>
                                                <div className="hidden-content ms-4 ">
                                                    <div className="my-2 w-25">
                                                        <label for="selectdevices" className="form-label">Select  device </label>
                                                        <select
                                                            className="form-select"
                                                            id="selectDevice"
                                                            aria-label="Select device type"
                                                            value={selectedDeviceType}
                                                            onChange={handleDeviceTypeChange}
                                                        >
                                                            <option disabled value="">Select a device</option>
                                                            {campaignDeviceType.map((device) => (
                                                                <option key={device.id} value={device.deviceType}>
                                                                    {device.deviceType}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="p-3 selected-pacements">
                                                        <h6> Selected Placements</h6>
                                                        {campaignPlacements.map((placement, index) => (
                                                            <div key={placement.id} className="d-flex align-items-center mb-2">
                                                                <div className="form-check form-switch d-flex align-items-center">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        id={`placement-${placement.id}`}
                                                                        checked={placement.enabled}
                                                                        onChange={() => {
                                                                            const updated = [...campaignPlacements];
                                                                            updated[index].enabled = !updated[index].enabled;
                                                                            setCampaignPlacements(updated);
                                                                        }}
                                                                    />
                                                                    <label
                                                                        className="form-check-label form-label ms-2"
                                                                        htmlFor={`placement-${placement.id}`}
                                                                    >
                                                                        {placement.PlacementName}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ))}                                                                                                              
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Budget and
                                            duration</label>
                                        <p className=" d-block mb-2">
                                            Set the budget and duration of your ad campaign.
                                        </p>
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Budget</label>
                                        <p className=" d-block mb-2">
                                            Enter the average amount you want to spend per day on your ad or the maximum you want to spend on the campaign in total. Your ad will stop running on the campaign end date or when the budget runs out.
                                        </p>

                                        <div className="d-flex align-items-center">
                                            <div className="d-flex align-items-center gap-3 mobile-responsive custom-width-100">
                                                <div className="input-group" style={{ width: '150px' }}>
                                                    <span className="input-group-text">₹</span>
                                                    <input 
                                                        type="number"
                                                        className="form-control"
                                                        value={budgetAmount}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setErrorEmptyBudget(""); // clear error
                                                            if (value === "") {
                                                                setBudgetAmount(''); // reset if they delete everything
                                                            } else {
                                                                setBudgetAmount(parseFloat(value) || '');
                                                            }
                                                        }}
                                                        onFocus={() => {
                                                            if (budgetAmount === 0) {
                                                                setBudgetAmount(""); // remove the 0 when focusing
                                                            }
                                                        }}
                                                        step=""
                                                        placeholder='X.XX'
                                                    />
                                                </div>                                                
                                                {campaignBudgetType.map((budgetType) => (
                                                    <label key={budgetType.id} className="d-flex align-items-center gap-1">
                                                    <input
                                                        type="radio"
                                                        name="budget-type"
                                                        value={budgetType.budgetType}
                                                        checked={selectedBudgetType === budgetType.budgetType}
                                                        onChange={() => setSelectedBudgetType(budgetType.budgetType)}
                                                    />
                                                        {budgetType.typeName}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <>
                                            {errorEmptyBudget && (
                                                <p className="text-danger mt-2 mb-0">
                                                    {errorEmptyBudget}
                                                </p>
                                            )}
                                        </>                                        
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Duration</label>
                                        <p className=" d-block mb-2">
                                            Choose how long your ad campaign will run.
                                        </p>
                                    </div>

                                    <div className="mb-2 custom-border-bottom">
                                        <div className="d-flex gap-3 mobile-responsive custom-width-100">
                                            <div>
                                                <label for="campaignName" className="form-label">From</label>
                                                <div className="date-section">
                                                    <i className='fas fa-calendar-alt'></i> {customFormatDate(campaignStartDate)}
                                                </div>
                                            </div>
                                            <div>
                                                <label for="campaignName" className="form-label">To</label>
                                                <div
                                                    className="date-section"
                                                    onClick={handleDivClick}
                                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <i className="fas fa-calendar-alt"></i>
                                                    {campaignEndDate ? customFormatDate(campaignEndDate) : 'Select a date'}                                                    
                                                </div>
                                                
                                                <DatePicker
                                                    ref={datePickerRef}
                                                    selected={campaignEndDate}
                                                    onChange={handleDateChange}
                                                    dateFormat="PPP" // e.g., Jul 24, 2025
                                                    minDate={new Date()}
                                                    customInput={<div />}
                                                    popperPlacement="bottom-start"
                                                />
                                            </div>
                                        </div>
                                        <p> Facebook will aim to spend {formatCurrency(budgetAmount)} {selectedBudgetType === 'daily' ? 'per day' : 'total'}.</p>
                                    </div>

                                    <div className="mb-2">
                                        <label for="campaignName" className="form-label">Payment</label>
                                        <p className=" d-block mb-2">
                                            Meta will bill your ad account when your ad is published.Review your payment method on Meta. 
                                            <a href="#">Learn  more
                                                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                            </a>
                                        </p>                 

                                    </div>

                                </div>
                            </div>
                            {/* end step two */}

                            {/* step three */}
                            <div className="page d-none" id="page3">
                                <div className="step-three">
                                    <div className="mb-2">
                                        <h6>Three Step</h6>                                    
                                    </div>
                                </div>
                            </div>
                            {/* end step three */}

                            {/* step four */}
                            <div className="page d-none" id="page4">
                                <div className="step-four">
                                    <div>
                                        <h5 className='fw-bold'> Publish campaign </h5>
                                        <p className="custom_p"> 
                                            Review your campaign details and publish your ads to start reaching your audience.
                                        </p>
                                        {createAdError && createAdErrorMessage && (
                                            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert" style={{ padding: "5px 15px" }}>    
                                                <i className="fas fa-exclamation-triangle me-2 p-2"
                                                    style={{
                                                        background: 'red',
                                                        borderRadius: '50%',
                                                        color: 'white'
                                                    }}>
                                                </i>
                                                <div className="flex-grow-1">
                                                    <p className="mb-0" style={{whiteSpace:'normal',maxWidth:'100%'}}>
                                                        <strong>Alert:</strong> {createAdErrorMessage}
                                                    </p>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className="btn-close ms-2" 
                                                    onClick={() => {
                                                        setCreateAdError(false);
                                                        setCreateAdErrorMessage('');
                                                    }}  
                                                ></button>
                                            </div>
                                        )}
                                        <div>
                                            <div className="d-flex align-items-center gap-2 my-3">                                                
                                                <div className="step-circle">
                                                    {cammpaignLoader ? (
                                                        <i className="fas fa-spin fa-spinner" style={{ fontSize: '20px' }}></i>
                                                    ) : cammpaignStatus === 'created' ? (
                                                     <i className="fas fa-check" style={{ fontSize: '20px', color: 'green' }}></i>
                                                    ) : cammpaignStatus === 'error' ? (
                                                        <i className="fas fa-times" style={{ fontSize: '20px', color: 'red' }}></i>
                                                    ) : (
                                                        1
                                                    )}                                                    
                                                </div>
                                                <div> Setting up your Ad Campaign </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 my-3">                                                
                                                <div className="step-circle">
                                                    {adsetLoader ? (
                                                        <i className="fas fa-spin fa-spinner" style={{ fontSize: '20px' }}></i>
                                                    ) : adsetStatus === 'created' ? (
                                                     <i className="fas fa-check" style={{ fontSize: '20px', color: 'green' }}></i>
                                                    ) : adsetStatus === 'error' ? (
                                                        <i className="fas fa-times" style={{ fontSize: '20px', color: 'red' }}></i>
                                                    ) : (
                                                        2
                                                    )}                                                    
                                                </div>
                                                <div> Processing your audience and budget </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2 my-3">                                                
                                                <div className="step-circle">
                                                    {adCreativeLoader ? (
                                                        <i className="fas fa-spin fa-spinner" style={{ fontSize: '20px' }}></i>
                                                    ) : adCreativeStatus === 'created' ? (
                                                     <i className="fas fa-check" style={{ fontSize: '20px', color: 'green' }}></i>
                                                    ) : adCreativeStatus === 'error' ? (
                                                        <i className="fas fa-times" style={{ fontSize: '20px', color: 'red' }}></i>
                                                    ) : (
                                                        3
                                                    )}                                                    
                                                </div>
                                                <div> Finishing up </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* end step four */}
                        </div>
                    </div>    
                </Modal.Body>            
                <div className="modal-footer justify-content-between">
                    <button className="btn btn-secondary custom-back-btn" id="saveDraftBtn" disabled>Save as draft</button>
                    <div className="d-flex my-lg-3 custom-width-100">
                        {isBackStep && (
                            <button 
                                className="btn btn-outline-secondary me-2 custom-back-btn" 
                                onClick={handleBack} 
                                disabled={currentStep === 1}
                            >
                                Back
                            </button>
                        )}

                        {currentStep === 4 && (
                            <button 
                                className="btn btn-outline-secondary me-2" 
                                onClick={campiagnPublishLater}
                                disabled={isPublishLaterDisabled}
                            >
                                Publish later
                            </button>
                        )}                       

                        {currentStep !== 4 && (
                            <button className="btn btn-primary" onClick={handleNext} disabled={currentStep === totalSteps}>
                                {currentStep === 1
                                ? "Next: Audience and budget"
                                : currentStep === 2
                                ? "Next: Create ads"
                                : currentStep === 3
                                ? "Next: Publish campaign"
                                : "Next"}
                            </button>
                        )}
                        
                        {campaignPublishLoader ? (
                            <button 
                                className="btn btn-success d-none"                                
                            >
                                <i className="fas fa-spin fa-spinner" style={{ fontSize: '20px' }}></i> Wait...
                            </button>
                        ) : (
                            <button 
                                className="btn btn-success d-none" 
                                id="publishBtn" 
                                onClick={() => publishCampaign('ACTIVE')}
                                disabled={isPublishDisabled}                                
                            >
                                    Publish Campaign
                            </button>
                        )}                          
                    </div>
                </div>   
            </Modal>            

            {/* start ad accounts modal */}
                <Modal 
                    show={showAddAccountModal} 
                    onHide={() => {
                        setShowAddAccountModal(false);
                        setSelectedAdAccounts([]);  // Reset on close
                    }}
                    centered
                    keyboard={false}
                    backdrop="static"
                    className="custom-add-account-modal"
                >
                    <Modal.Header closeButton className="custom-modal-header">
                        <h5 className='h5-heading'>Which Facebook ad accounts do you want to add?</h5>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Select ad accunts you would like to add to your Facebook pages.Note,if you are part of an organization,you may only select from accessible ad accounts.</p>
                        {connectedAccount?.map((account, accountIndex) =>
                            account.AdsAccounts?.map((ad, adIndex) =>
                                ad.isConnected === "notConnected" ? (
                                    <div
                                        className="form-check checkbox checkbox-primary mb-0"
                                        key={`account-ad-${adIndex}`}
                                    >
                                        <input
                                            className="form-check-input"
                                            id={`account-${adIndex}`}
                                            type="checkbox"
                                            checked={selectedAdAccounts.some(
                                                selected => selected.account_name === ad.account_name
                                            )}
                                            onChange={(e) => handleAdAccountSelect(e, ad)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`account-${adIndex}`}
                                        >
                                           <span className='fw-bold'>  {ad.account_name} </span>
                                            <p style={{marginBottom:'0px', fontSize:'12px'}}>ID: {ad.account_id}</p>
                                        </label>
                                    </div>
                                ) : null
                            )
                        )}

                        {loader ? (
                            <button 
                                className="btn btn-primary mt-3 pull-right"                                
                            >
                                <div className="spinner-grow spinner-grow-sm" role="status">
                                    <span className="visually-hidden"></span>
                                </div> Loading...
                            </button>
                        ) : (
                            selectedAdAccounts.length > 0 && (
                                <button 
                                    className="btn btn-primary mt-3 pull-right"
                                    onClick={chooseAdsAccountDone}
                                    disabled={selectedAdAccounts.length === 0}
                                >Done</button>
                            )
                        )}
                    </Modal.Body>
                </Modal>
            {/* start ad accounts modal */}

            {/* start Audience modal */}                                            
                <Modal 
                    show={showAudienceModal} 
                    onHide={() => {
                        setShowAudienceModal(false); 
                        setTargetingSearch('');                       
                    }}
                    centered
                    backdrop="static"
                    keyboard={false}
                    className="custom-modal-dialog"
                >
                    <Modal.Header closeButton className="custom-modal-header">
                        <h5>Edit Audience</h5>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row">
                            <div className="col-md-8 edit-audience-modal">
                                <div className="mb-2">
                                    <label for="campaignName" className="form-label">Location</label>
                                    <p className=" d-block mb-2">
                                        Target people by including or excluding their location
                                    </p>
                                </div>

                                <div className="my-2 custom-border-bottom">
                                    <label for="selectPage" className="form-label">Include</label>
                                    <Select
                                        inputId="selectPage"
                                        isMulti
                                        options={campaignLocation}
                                        getOptionLabel={(e) => e.name}
                                        getOptionValue={(e) => e.code}
                                        value={selectedCampaignLocation}
                                        onChange={handleCampaignLocationChange}
                                        placeholder="Select countries..."
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        filterOption={createFilter({ ignoreCase: true, ignoreAccents: true, matchFrom: 'any' })}
                                    />

                                    {/* <div className="my-2">
                                        <a href="#"> Exclude Location</a>
                                    </div> */}
                                </div>

                                <div className="mb-2 gender-section">
                                    <label for="campaignName" className="form-label">Gender</label>
                                    <div>
                                        <div className="btn-group" role="group" aria-label="Gender selection">
                                            {audienceGender.map((gender) => (
                                                <React.Fragment key={gender.id}>
                                                    <input
                                                        type="radio"
                                                        className="btn-check"
                                                        name="gender"
                                                        id={`gender-${gender.genderType}`}
                                                        value={gender.genderType.toLowerCase()}
                                                        checked={gender.enabled}
                                                        onChange={() => handleGenderChange(gender.id)}
                                                    />
                                                    <label
                                                        className="btn btn-outline-primary"
                                                        htmlFor={`gender-${gender.genderType}`}
                                                        >
                                                        {gender.genderType}
                                                    </label>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-2 custom-border-bottom">
                                    <label for="campaignName" className="form-label">Age</label>
                                    <p className=" d-block mb-2">
                                        Select the minimum and maximum age for people who will see your
                                        ad. Note: the minimum age is 18, and the maximum age is 65 and
                                        over.
                                    </p>
                                    <div className="d-flex gap-3 w-50">
                                        <select
                                                className="form-select age-select"
                                                name="min"
                                                value={audienceAge.min}
                                                onChange={handleAgeChange}
                                            >
                                            {[18, 25, 30, 35, 40, 45, 50, 55, 60].map((age) => (
                                                <option key={age} value={age}>{age}</option>
                                            ))}
                                        </select>

                                        <select
                                            className="form-select age-select"
                                            name="max"
                                            value={audienceAge.max}
                                            onChange={handleAgeChange}
                                        >
                                            {[18, 25, 30, 35, 40, 45, 50, 55, 60, 65].map((age) => (
                                                <option key={age} value={age}>{age === 65 ? '65+' : age}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label for="campaignName" className="form-label">Detailed targeting</label>
                                    <p className=" d-block mb-2">
                                        Target your audience by demographics, interests, or behaviors.
                                    </p>
                                </div>

                                <div className="my-2 custom-border-bottom">
                                    <label for="selectPage" className="form-label">Include</label>
                                    <div className="position-relative">
                                        <i className="fa fa-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"></i>
                                        <input
                                            type="text"
                                            id="searchInput"
                                            className="form-control ps-4"
                                            placeholder="Search..."
                                            //value={selectedInterest ? selectedInterest : targetingSearch}
                                            value={selectedInterest ? selectedInterest.name : targetingSearch}
                                            onChange={handleSearchTargeting}
                                            pattern="[A-Za-z]"
                                        />
                                        {(targetingSearch || selectedInterest) && (
                                            <div className="position-absolute top-50 end-0 translate-middle-y me-3 d-flex align-items-center gap-2">
                                                <i
                                                className="fa fa-times text-muted"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    setTargetingSearch('');
                                                    setTargetingResults([]);
                                                    setSelectedInterest(null);
                                                }}
                                                ></i>
                                                {selectedInterest && showSuggestions && <i className="fas fa-chevron-up text-muted" onClick={() => {
                                                    setShowSuggestions(false);
                                                }}></i>}

                                                {selectedInterest && !showSuggestions && <i className="fas fa-chevron-down text-muted" onClick={() => {
                                                    setShowSuggestions(true);
                                                }}></i>}
                                            </div>
                                        )}
                                    </div>
                                    {targetingLoader && (
                                        <>
                                            <div className="text-center">
                                                <div className="d-inline-flex align-items-center gap-2 mt-2 text-sm text-gray-500">
                                                    <i className="fas fa-spin fa-spinner"></i>
                                                    <div>Loading...</div>
                                                </div>
                                            </div>
                                        </>                                        
                                    )} 

                                    {!targetingLoader && showSuggestions && targetingResults.length > 0 && (                                        
                                        <ul className="mt-2 border rounded p-3" style={{
                                                maxHeight: '250px',
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                            }}
                                        >
                                            {targetingResults.map((item) => {
                                                const rawName = item.name || '';
                                                const cleanedName = rawName.replace(/\s*\(.*?\)\s*/g, '').trim();
                                                const formattedName = cleanedName
                                                .split(' ')
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ');                                               

                                                return (
                                                <li key={item.id} onClick={() => handleSelectInterst(item)} style={{ cursor: 'pointer' }}>
                                                    <b style={{ fontSize: '12px' }}>
                                                        {formattedName} {item.topic ? `(${item.topic})` : ''}
                                                    </b>
                                                    <p style={{ fontSize: '12px' }}>interest</p>
                                                </li>
                                                );
                                            })}
                                        </ul>
                                    )}                                   
                                </div>                                
                            </div>

                            <div className="col-md-4">
                                <div className="p-3 rounded-3" style={{backgroundColor:'#DBEAFE'}}>
                                    <h5> Current audience details </h5>
                                    {/* <div className="form-label "> INCLUDED PEOPLE WHO MATCH </div> */}
                                    <div className="fw-semibold mt-2"> INCLUDED PEOPLE WHO MATCH </div>
                                    <div> Age: {audienceAge.min} - {audienceAge.max} </div>
                                    <div> Gender: {selectedGender} </div>
                                    {selectedCampaignLocation && selectedCampaignLocation.length > 0 ? (
                                        <div>
                                            Location: {selectedCampaignLocation.map(loc => loc.name).join(', ')}
                                        </div>
                                        ) : (
                                        <div>Location: No location selected</div>
                                    )}
                                    <div className="form-label fw-semibold"> POTENTIAL REACH</div>
                                    <div> 267,520,000 </div>
                                </div>
                            </div>                        

                        </div>
                    </Modal.Body>
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary custom-back-btn" 
                            data-bs-dismiss="modal"
                            onClick={() => {
                                setShowAudienceModal(false);
                                setTargetingSearch('');                       
                            }}
                        >Cancel</button>
                        <a onClick={() => {
                                setShowAudienceModal(false);
                                setTargetingSearch('');                                                       
                            }} className="btn btn-primary">
                            Change audience
                        </a>
                    </div>
                </Modal>
            {/* start Audience modal */}

            {/* start create ads modal */}                                            
                <Modal 
                    show={showCreateAdModal} 
                    onHide={() => {
                        setShowCreateAdModal(false);  
                        setCreateAdLoader(false);
                        setCurrentStep(2);                                           
                    }}
                    centered
                    backdrop="static"
                    keyboard={false}
                    dialogClassName="create-your-ads"
                >
                    <Modal.Header closeButton className="custom-modal-header">
                        <h5>Create your ads </h5>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row">
                            <div className='col-md-4 col-xl-2 col-xxl-2 '>
                                <div className="p-3">
                                    <div className="my-2 d-flex gap-3 justify-content-between align-items-center">
                                        <div>
                                            <h5> Ads List </h5>
                                        </div>
                                        <div> <i className="fa-solid fa-arrow-left"></i></div>
                                    </div>
                                    <div className="my-4">
                                        <div> YOUR ADS (2/32)</div>
                                        {/* <div className="mt-2"> <a href="#">+ Create an add</a> </div> */}
                                    </div>
                                    <div className=" bg-warning p-2">
                                        <div className="text-center"> New ad </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="form-label"> Campaign</div>
                                    <hr></hr>
                                    <div className="mb-2"><strong>  Campaign Name</strong> 
                                        <div>{createAdData.campaignName || 'Null'} </div>
                                    </div>
                                    <div className="mb-2"> <strong> Campaign objective</strong>
                                        <div>{formatObjective(createAdData.campaignObjective)} </div>
                                    </div>
                                    <div className="mb-2"> <strong>Objective and delivery</strong>
                                        <div> {formatObjective(createAdData.optimizationAddelivery)} </div>
                                    </div>                  
                                            
                                    <div className="mb-2"> <strong>Budget</strong>
                                        <div> 
                                            {formatCurrency(budgetAmount)} {selectedBudgetType === 'daily' ? 'Per day' : selectedBudgetType === 'lifetime' ? 'Total' : ''}
                                        </div>
                                    </div>
                                    <div className="mb-2"> <strong>Duration</strong>
                                        <div> <strong>From -</strong> {customFormatDate(campaignStartDate)} </div>
                                        <div> <strong> To -</strong> {campaignEndDate ? customFormatDate(campaignEndDate) : 'Select a date'}</div>
                                    </div>                                
                                </div>
                            </div>

                            <div className='col-md-8 col-xl-6 col-xxl-6 bg-white create-your-ads-height'>
                                <div className="p-2 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6> New ad </h6>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="bg-light-gray"> Create variations With Ai </div>
                                        <div className="bg-light-gray"> <i className="fa-solid fa-copy "></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="my-2">
                                    <label for="beneficiaryName" className="form-label fw-bold">Name this ad </label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="New ad"
                                        value={createAdData.createAdName || ''}
                                        onChange={(e) => setCreateAdData({
                                        ...createAdData,
                                        createAdName: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="my-2">
                                    <label for="beneficiaryName" className="form-label fw-bold">Content</label>                                    
                                    <div className="add-post-area">                                        
                                        <textarea
                                            ref={createAdContentRef} 
                                            className="textarea" 
                                            value={createAdData.createAdContent || ''}
                                            maxlength={maxCharacters} 
                                            onChange={handleCreateContentChange}
                                            placeholder="Tell people about your offer..."
                                            onKeyDown={handleKeyDownCreateAdContent}
                                            onClick={(e) => {
                                                setSelectionStart(e.target.selectionStart);
                                                setSelectionEnd(e.target.selectionEnd);
                                            }}
                                            onSelect={(e) => {
                                                setSelectionStart(e.target.selectionStart);
                                                setSelectionEnd(e.target.selectionEnd);
                                            }}
                                        />                                            
                                        
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <div>{(createAdData.createAdContent || "").length}/{maxCharacters}</div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="bg-light-gray"> <i className="fa-regular fa-face-smile "></i></div>                                                    
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center pt-2">
                                            <div className="d-flex align-items-center gap-2">                                                
                                                <div className="upload-box">
                                                    <img src="https://img.icons8.com/ios/50/image--v1.png" alt="Upload Icon"/>                                                    
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        multiple 
                                                        onChange={handleImageUpload}
                                                        style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                    />
                                                </div>                                               
                                                
                                                {createAdData.createAdImages.length > 0 ? (
                                                    createAdData.createAdImages.map((img, index) => (
                                                        <div className="upload-box" key={index}>
                                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                <img
                                                                    src={img.previewUrl}
                                                                    alt={`Preview ${index}`}
                                                                    className="upload-preview"
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        setCreateAdData(prev => ({
                                                                            ...prev,
                                                                            createAdImages: prev.createAdImages.filter((_, i) => i !== index)
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '-5px',
                                                                        right: '-5px',
                                                                        background: 'red',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px',
                                                                        lineHeight: '20px',
                                                                        textAlign: 'center',
                                                                        padding: 0
                                                                    }}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="upload-box">
                                                        <img
                                                            id="previewImg"
                                                            src="https://img.icons8.com/ios/50/open-book--v1.png"
                                                            alt="Catalog Icon"
                                                            className="upload-preview"
                                                        />
                                                    </div>
                                                )}
                                                                                                
                                            </div>
                                            <div className="d-flex align-items-center flex-column gap-2">                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="my-2">
                                    <label for="beneficiaryName" className="form-label fw-bold">Headline</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="Add a headline..."
                                        value={createAdData.createAdHeadline || ''}
                                        onChange={(e) => setCreateAdData({
                                        ...createAdData,
                                        createAdHeadline: e.target.value
                                        })}
                                    />                                    
                                </div>
                                <div className="my-2">
                                    <label for="beneficiaryName" className="form-label fw-bold"> Website URL
                                        <i className="fa-solid fa-circle-info ms-1"></i>
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="www.example.com"
                                        value={createAdData.createAdWebsiteURL || ''}
                                        onChange={(e) => setCreateAdData({
                                        ...createAdData,
                                        createAdWebsiteURL: e.target.value
                                        })}
                                    />                                    
                                </div>
                                <div className="my-2">
                                    <label for="selectcall" className="form-label">Call to action</label>
                                    <select
                                        className="form-select"
                                        id="selectcall"
                                        value={selectedCreateAdButtonType.value}
                                        onChange={handleAdButtonTypeChange}
                                        >
                                        {createAdButtonType.map((btn) => (
                                            <option key={btn.id} value={btn.value}>
                                                {btn.AdButtonName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='my-lg-3 col-md-12 col-xl-4 col-xxl-4 ads-custom-container'>
                                <div className='post-preview-height'>
                                    <ul className="nav nav-tabs d-flex align-items-center justify-content-center my-3" id="previewTabs" role="tablist">
                                        <li className="nav-item" role="presentation">
                                            <button className="nav-link active" id="desktop-tab" data-bs-toggle="tab" data-bs-target="#desktop" type="button" role="tab" aria-selected="true">Desktop</button>
                                        </li>
                                        <li className="nav-item" role="presentation">
                                            <button className="nav-link" id="mobile-tab" data-bs-toggle="tab" data-bs-target="#mobile" type="button" role="tab" aria-selected="false" tabindex="-1">Mobile </button>
                                        </li>
                                        <li className="nav-item" role="presentation">
                                            <button className="nav-link" id="instagram-tab" data-bs-toggle="tab" data-bs-target="#instagram" type="button" role="tab" aria-selected="false" tabindex="-1">Instagram </button>
                                        </li>
                                    </ul>
                                    <div className="tab-content " id="previewTabsContent">
                                        <div className="tab-pane fade active show" id="desktop" role="tabpanel" aria-labelledby="desktop-tab">
                                            <div className="post-preview">
                                                <div className="d-flex justify-content-between align-items-center p-2 ">                                                    
                                                    {selectedPage ? (
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <div className="profile-img"> 
                                                                <img className="img-fluid" src={selectedPage.page_picture} alt=''/> 
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <div> <strong> {selectedPage.pageName} </strong> </div>
                                                                <div> Sponsored 
                                                                    <span> 
                                                                        <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <div className="profile-img"> 
                                                                <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt=""/> 
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <div> <strong> No Page </strong> </div>
                                                                <div> Sponsored 
                                                                    <span>
                                                                        <img className="img-fluid" src= {`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div> <i className="fa-solid fa-ellipsis"></i> </div>
                                                </div>
                                                <p style={{ whiteSpace: 'pre-line', paddingLeft: '10px', paddingRight: '10px' }}>
                                                    {createAdData.createAdContent.length > 200
                                                        ? `${createAdData.createAdContent.slice(0, 200)}...`
                                                        : createAdData.createAdContent
                                                    }
                                                </p>
                                                <div className="facebook-post-img"> 
                                                    {createAdData.createAdImages.length > 0 ? (
                                                        <Carousel
                                                            responsive={responsive}
                                                            infinite
                                                            autoPlay={false}
                                                            itemclassName="px-2"
                                                            showDots={true}
                                                            arrows={false}
                                                        >
                                                            {createAdData.createAdImages.map((img, index) => (
                                                                <div key={index} style={{ position: 'relative' }}>
                                                                    <img className="img-fluid" src={img.previewUrl} alt={`Preview ${index}`} />
                                                                </div>
                                                            ))}
                                                        </Carousel>
                                                    ) : (                                                                                                       
                                                        <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt=""/>
                                                    )}
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                                                    <div>
                                                        <p className='mb-0'> {createAdData.createAdWebsiteURL || ''} </p>
                                                        <div> <strong>{createAdData.createAdHeadline || 'Your heading'}</strong></div>
                                                        {/* <p> {createAdData.createAdName || 'Your ads name'} </p> */}                                                        
                                                    </div>
                                                    <div> 
                                                        <button className="btn btn-outline-secondary web-ads-btn">{selectedCreateAdButtonType.AdButtonName}</button> 
                                                    </div>
                                                </div>

                                                <div className="">
                                                    <div className="d-flex justify-content-between align-items-center p-3 text-center border-bottom">
                                                        <div className="d-flex align-items-center"> 
                                                            <img className="me-2" src={`${process.env.PUBLIC_URL}/assets/ads-img/like (3).png`} alt=""/> Like 
                                                        </div>
                                                        <div className="d-flex align-items-center"> 
                                                            <img className="me-2" src={`${process.env.PUBLIC_URL}/assets/ads-img/chat (1).png`} alt=""/> Comment 
                                                        </div>
                                                        <div className="d-flex align-items-center"> 
                                                            <img className="me-2" src={`${process.env.PUBLIC_URL}/assets/ads-img/share (1).png`} alt=""/> Share 
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="tab-pane fade" id="mobile" role="tabpanel" aria-labelledby="mobile-tab">
                                            <phone>
                                                <div className="phone-frame">
                                                    <div className="phone-notch"></div>
                                                    <div className="mobile-header">
                                                        <div> 3:32 PM</div>
                                                        <div className="d-flex gap-2">
                                                            <div> 
                                                                <svg viewBox="0 0 33 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="power">
                                                                    <rect y="12" width="6" height="9" rx="2" fill="black"></rect>
                                                                    <rect x="8.7" y="9" width="6" height="12" rx="2" fill="black">
                                                                    </rect>
                                                                    <rect x="17.4" y="5" width="6" height="16" rx="2" fill="black">
                                                                    </rect>
                                                                    <rect x="26.1" width="6" height="21" rx="2" fill="black"></rect>
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <div className="network">5G</div>
                                                            </div>
                                                            <div> 
                                                                <svg width="25" height="16" viewBox="0 0 86 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <rect fill="transparent" x="1.75" y="1.75" width="75.5" height="35.5" rx="8.25" stroke="black" stroke-opacity="0.4" strokeWidth="3.5"></rect>
                                                                    <rect x="6.5" y="6.5" width="66" height="26" rx="5" fill="black">
                                                                    </rect>
                                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M81.5 26.5C83.9363 24.9844 85.5 22.6361 85.5 20C85.5 17.3639 83.9363 15.0156 81.5 13.5V26.5Z" fill="black" fill-opacity="0.6">
                                                                    </path>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="custom-mobile-height">
                                                        <div className="post-preview">
                                                            <div className="d-flex justify-content-between align-items-center p-2 ">
                                                                {selectedPage ? (
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <div className="profile-img"> 
                                                                            <img className="img-fluid" src={selectedPage.page_picture} alt=''/> 
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            <div> <strong> {selectedPage.pageName} </strong> </div>
                                                                            <div> Sponsored 
                                                                                <span> 
                                                                                    <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <div className="profile-img"> 
                                                                            <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt=""/> 
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            <div> <strong> No Page </strong> </div>
                                                                            <div> Sponsored 
                                                                                <span>
                                                                                    <img className="img-fluid" src= {`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div> 
                                                                    <i className="fa-solid fa-ellipsis"></i>
                                                                </div>
                                                            </div>
                                                            <p style={{ whiteSpace: 'pre-line', paddingLeft: '10px', paddingRight: '10px' }}>
                                                                {createAdData.createAdContent.length > 200
                                                                    ? `${createAdData.createAdContent.slice(0, 200)}...`
                                                                    : createAdData.createAdContent
                                                                }
                                                            </p>
                                                            <div className="facebook-post-img">
                                                                <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt=""/>
                                                            </div>

                                                            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                                                                <div>
                                                                    <p className='mb-0'>{createAdData.createAdWebsiteURL || ''}</p>
                                                                    <div> <strong>{createAdData.createAdHeadline || 'Your heading'}</strong> </div>
                                                                    {/* <p> {createAdData.createAdName || 'Your ads name'} </p> */}                                                                    
                                                                </div>
                                                                <div> 
                                                                    <button className="btn btn-outline-secondary mobile-ads-btn">{selectedCreateAdButtonType.AdButtonName}</button> 
                                                                </div>
                                                            </div>

                                                            <div className="">
                                                                <div className="d-flex justify-content-between align-items-center p-3 text-center border-bottom">
                                                                    <div className="d-flex align-items-center">
                                                                        <img className="me-2" src="../assets/ads-img/like (3).png" alt=""/> Like
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <img className="me-2" src="../assets/ads-img/chat (1).png" alt=""/> Comment
                                                                    </div>
                                                                    <div className="d-flex align-items-center">
                                                                        <img className="me-2" src="../assets/ads-img/share (1).png" alt=""/> Share
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="post-preview instagram-preview">
                                                            <div className="d-flex justify-content-between align-items-center p-2 ">
                                                                {selectedPage ? (
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <div className="profile-img"> 
                                                                            <img className="img-fluid" src={selectedPage.page_picture} alt=""/> 
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            <div> <strong> {selectedPage.pageName} </strong> </div>
                                                                            <div> Sponsored 
                                                                                <span> 
                                                                                    <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="d-flex gap-2 align-items-center">
                                                                        <div className="profile-img"> 
                                                                            <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt=""/> 
                                                                        </div>
                                                                        <div className="d-flex flex-column">
                                                                            <div> <strong> No Page </strong> </div>
                                                                            <div> Sponsored 
                                                                                <span>
                                                                                    <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}                                                                
                                                                <div> 
                                                                    <i className="fa-solid fa-ellipsis-vertical"></i>
                                                                </div>
                                                            </div>
                                                            <p style={{ whiteSpace: 'pre-line', paddingLeft: '10px', paddingRight: '10px' }}>
                                                                {createAdData.createAdContent.length > 200
                                                                    ? `${createAdData.createAdContent.slice(0, 200)}...`
                                                                    : createAdData.createAdContent
                                                                }
                                                            </p>
                                                            <div className="facebook-post-img">
                                                                <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt=""/>
                                                            </div>
                                                    
                                                            <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-danger text-white">
                                                                <div>
                                                                    {selectedCreateAdButtonType.AdButtonName}
                                                                </div>
                                                                <div> 
                                                                    <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/right-arrow (2).png`} alt=""/> 
                                                                </div>
                                                            </div>

                                                            <div className="instagram-footer">
                                                                <div className="d-flex justify-content-between align-items-center p-2">
                                                                    <div className="d-flex align-items-center text-center gap-2 w-75">
                                                                        <div className="d-flex align-items-center">
                                                                            <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/heart (1).png`} alt=""/> 12.7M
                                                                        </div>
                                                                        <div className="d-flex align-items-center">
                                                                            <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/chat (1).png`} alt=""/> 120K</div>
                                                                        <div className="d-flex align-items-center">
                                                                            <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/send (1).png`} alt=""/> 98.8K </div>

                                                                    </div>
                                                                    <div className="w-25 text-end">
                                                                        <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/bookmark.png`} alt=""/>
                                                                    </div>
                                                                </div>
                                                                <div className="p-2">
                                                                    <p> <strong>Aronasoft</strong>
                                                                        Launching our new app interface!
                                                                        Experience faster navigation and
                                                                        a fresh look. 
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>                                                    
                                                    </div>
                                                    <div className="d-flex justify-content-center align-items-center">
                                                        <div className="mobile-footer"> </div>
                                                    </div>
                                                </div>
                                            </phone>
                                        </div>

                                        <div className="tab-pane fade" id="instagram" role="tabpanel" aria-labelledby="instagram-tab">
                                            <div className="post-preview instagram-preview">
                                                <div className="d-flex justify-content-between align-items-center p-2 ">
                                                    {selectedPage ? (
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <div className="profile-img"> 
                                                                <img className="img-fluid" src={selectedPage.page_picture} alt={selectedPage.pageName}/> 
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <div> <strong> {selectedPage.pageName} </strong> </div>
                                                                <div> Sponsored 
                                                                    <span> 
                                                                        <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex gap-2 align-items-center">
                                                            <div className="profile-img"> 
                                                                <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/avtar/user.png`} alt=""/> 
                                                            </div>
                                                            <div className="d-flex flex-column">
                                                                <div> <strong> No Page </strong> </div>
                                                                <div> Sponsored 
                                                                    <span>
                                                                        <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/analytics-ican/network.png`} alt=""/> 
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div> 
                                                        <i className="fa-solid fa-ellipsis-vertical"></i>
                                                    </div>
                                                </div>
                                                <p style={{ whiteSpace: 'pre-line', paddingLeft: '10px', paddingRight: '10px' }}>
                                                    {createAdData.createAdContent.length > 200
                                                        ? `${createAdData.createAdContent.slice(0, 200)}...`
                                                        : createAdData.createAdContent
                                                    }
                                                </p>
                                                <div className="facebook-post-img">
                                                    <img className="img-fluid" src={`${process.env.PUBLIC_URL}/assets/images/placeholder_img.jpg`} alt=""/>
                                                </div>

                                                <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-danger text-white">
                                                    <div>
                                                        {selectedCreateAdButtonType.AdButtonName}
                                                    </div>
                                                    <div> 
                                                        <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/right-arrow (2).png`} alt=""/> 
                                                    </div>
                                                </div>

                                                <div className="instagram-footer">
                                                    <div className="d-flex justify-content-between align-items-center p-2">
                                                        <div className="d-flex align-items-center text-center gap-2 w-75">
                                                            <div className="d-flex align-items-center">
                                                                <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/heart (1).png`} alt=""/> 9,890
                                                            </div>
                                                            <div className="d-flex align-items-center"> 
                                                                <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/chat (1).png`} alt=""/> 884 
                                                            </div>
                                                            <div className="d-flex align-items-center"> 
                                                                <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/send (1).png`} alt=""/> 269 
                                                            </div>
                                                        </div>
                                                        <div className="w-25 text-end">
                                                            <img className="me-1" src={`${process.env.PUBLIC_URL}/assets/ads-img/bookmark.png`} alt=""/>
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        <p> 
                                                            <strong>Aronasoft</strong> Launching our new
                                                            app interface! Experience faster navigation
                                                            and a fresh look.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center my-3">
                                            <p> 
                                                Social networks regularly make updates to formatting, so
                                                your post may appear slightly different when published. <a href="#">{selectedCreateAdButtonType.AdButtonName}</a> 
                                            </p>
                                        </div>                                    
                                    </div>
                                </div>
                            </div>                         
                        
                        </div>
                    </Modal.Body>
                    <div className="modal-footer  d-flex justify-content-between align-items-center">
                        <div> 
                            <button 
                                className="btn btn-outline-primary"                                 
                                onClick={() => {
                                    setShowCreateAdModal(false);
                                    setCurrentStep(2);                                           
                                }}
                            > 
                                <i className="fa-solid fa-arrow-left"></i> Audience and budget
                            </button>
                        </div>
                        <div>
                            {/* <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Save draft</button> */}
                            {createAdLoader ? (
                                <button 
                                    className="btn btn-primary mt-3 pull-right"                                
                                >
                                    <i className="fas fa-spin fa-spinner"></i> Loading...
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary"
                                    disabled={
                                        !createAdData.createAdName || 
                                        //!createAdData.createAdContent || 
                                        !createAdData.createAdHeadline || 
                                        !createAdData.createAdWebsiteURL || 
                                        createAdData.createAdImages.length === 0
                                    }
                                    onClick={createfacebookAds}
                                >
                                    Publish Campaign
                                </button>
                            )}
                        </div>
                    </div>
                </Modal>
            {/* start create ads modal */}

        </>
    )
}

export default CreateAdsCampaign;
