import React, { useState, useEffect } from "react";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { toast } from 'react-toastify';
import { Link,useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";

export default function Settings() {
    const navigate = useNavigate();
    const [fullScreenLoader, setFullScreenLoader] = useState(false);
    const [userProfileData, setuserProfileData] = useState([]);
    const [isCommentAutoReplyEnabled, setCommentAutoReplyEnabled] = useState(false);
    const [isMessageAutoReplyEnabled, setMessageAutoReplyEnabled] = useState(false);
    const [settingData, setSettingData] = useState();
    const [previewImage, setPreviewImage] = useState(userProfileData?.profileImage || "");
    const [saveProfileLoader, setSaveProfileLoader] = useState(false);
    const [errors, setErrors] = useState({});    
    const [formData, setFormData] = useState({
        firstName: userProfileData?.firstName || "",
        lastName: userProfileData?.lastName || "",
        email: userProfileData?.email || "",
        bio: userProfileData?.bio || "",
        company: userProfileData?.company || "",
        jobTitle: userProfileData?.jobTitle || "",
        userLocation: userProfileData?.userLocation || "",
        userWebsite: userProfileData?.userWebsite || "",
        profileImage: userProfileData?.profileImage || "",
    });
    const [passwordLoader, setPasswordLoader] = useState(false);
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [passwordFormData, setPasswordFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });     
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [timeZones, setTimeZones] = useState([
        { timeZoneName: "Asia/Kolkata", utc_offset: "+05:30" },
        { timeZoneName: "Asia/Dubai", utc_offset: "+04:00" },
        { timeZoneName: "Asia/Tokyo", utc_offset: "+09:00" },
        { timeZoneName: "Asia/Singapore", utc_offset: "+08:00" },
        { timeZoneName: "Asia/Shanghai", utc_offset: "+08:00" },
        { timeZoneName: "Asia/Seoul", utc_offset: "+09:00" },
        { timeZoneName: "Asia/Baghdad", utc_offset: "+03:00" },
        { timeZoneName: "Asia/Kathmandu", utc_offset: "+05:45" },
        { timeZoneName: "Asia/Yangon", utc_offset: "+06:30" },
        { timeZoneName: "Asia/Tehran", utc_offset: "+03:30" },
        { timeZoneName: "America/New_York", utc_offset: "-05:00" },
        { timeZoneName: "America/Chicago", utc_offset: "-06:00" },
        { timeZoneName: "America/Denver", utc_offset: "-07:00" },
        { timeZoneName: "America/Los_Angeles", utc_offset: "-08:00" },
        { timeZoneName: "America/Toronto", utc_offset: "-05:00" },
        { timeZoneName: "America/Vancouver", utc_offset: "-08:00" },
        { timeZoneName: "America/Mexico_City", utc_offset: "-06:00" },
        { timeZoneName: "America/Sao_Paulo", utc_offset: "-03:00" },
        { timeZoneName: "America/Argentina/Buenos_Aires", utc_offset: "-03:00" },
        { timeZoneName: "America/Bogota", utc_offset: "-05:00" },
        { timeZoneName: "America/Lima", utc_offset: "-05:00" },
        { timeZoneName: "America/Caracas", utc_offset: "-04:00" },
        { timeZoneName: "America/Santiago", utc_offset: "-04:00" },
        { timeZoneName: "America/Havana", utc_offset: "-05:00" },
        { timeZoneName: "America/Anchorage", utc_offset: "-09:00" },
        { timeZoneName: "America/Adak", utc_offset: "-10:00" },
        { timeZoneName: "America/Puerto_Rico", utc_offset: "-04:00" }
    ]);
    const [selectedTimeZone, setSelectedTimeZone] = useState({
        timeZoneName: "",
    });
    const [connectedSocialAccount, setconnectedSocialAccount] = useState(0);
    const [totalCreatedPost, settotalCreatedPost] = useState(0);
    const [loader, setLoader] = useState(false);

    const [showMessageModal, setShowMessageModal] = useState(false);

    useEffect(() => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');        
        const fetchSettings = async () => {
            //setFullScreenLoader(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/settings`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    }                    
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setSettingData(data.settingData);
                // Set comment auto-reply status
                if (data.settingData && data.settingData.module_name === 'Comment' && data.settingData.module_status === true) {
                    setCommentAutoReplyEnabled(true);
                } else {
                    setCommentAutoReplyEnabled(false);
                }
                // Message Auto Reply
                if (data.settingData && data.settingData.module_name === 'Message' && data.settingData.module_status === true) {
                    setMessageAutoReplyEnabled(true);
                } else {
                    setMessageAutoReplyEnabled(false);
                }
            } catch (error) {
                console.error("Error fetching post details:", error);
                //setFullScreenLoader(false);
            } finally {
                //setFullScreenLoader(false);
            }
        }
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const rawUserInfo = localStorage.getItem("userinfo");
                const userInfoData = JSON.parse(rawUserInfo);
                if (userInfoData && userInfoData.userData) {
                    setFormData({
                        firstName: userInfoData.userData.firstName || "",
                        lastName: userInfoData.userData.lastName || "",
                        email: userInfoData.userData.email || "",
                        bio: userInfoData.userData.bio || "",
                        company: userInfoData.userData.company || "",
                        jobTitle: userInfoData.userData.jobTitle || "",
                        userLocation: userInfoData.userData.userLocation || "",
                        userWebsite: userInfoData.userData.userWebsite || "",
                        profileImage: userInfoData.userData.profileImage || "",
                    });
                    setuserProfileData(userInfoData.userData);
                    setSelectedTimeZone({timeZoneName: userInfoData.userData.timeZone || ""})
                }
            } catch (error) {
                console.error("Parsing error:", error);
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const rawUserInfo = localStorage.getItem("userinfo");
        const userInfoData = rawUserInfo ? JSON.parse(rawUserInfo) : {};
        if (userInfoData.socialData && Array.isArray(userInfoData.socialData)) {        
        let count = 0;
        userInfoData.socialData.forEach(account => {
            if (account.status === "Connected") {
                count += 1;
            }            
        });
            setconnectedSocialAccount(count);
        } else {        
            setconnectedSocialAccount(0);
        }
    }, []);

    useEffect(() => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');        
        const fetchAccountOverview = async () => {
            setLoader(true);
            try {
                const response = await fetch(`${BACKEND_URL}/api/account-overview`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    }                    
                });                
                const data = await response.json();
                if(data.success===true){
                    settotalCreatedPost(data.totalCreatedPosts);
                } else {
                    settotalCreatedPost(0);
                }
                //console.log('data',data);                  
            } catch (error) {
                console.error("Error fetching post details:", error);            
            } finally {
                setLoader(false);
            }
        }
        fetchAccountOverview();
    }, []);
    
    const commentAutoreply = async () => {
        //setFullScreenLoader(true);
        const authToken = localStorage.getItem('authToken');
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const commentStatus = !isCommentAutoReplyEnabled;
        //console.log(commentStatus);
        try {    
            const commentResponse = await fetch(`${BACKEND_URL}/api/settings/system_auto_functions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + authToken,
                },
                body: JSON.stringify({
                    module_name:'Comment',
                    module_status:commentStatus
                }),
            });                
            const response = await commentResponse.json();
            if(response.success===true){
                setCommentAutoReplyEnabled(commentStatus);
                //setFullScreenLoader(false);
                toast.success("Comment auto-reply setting saved successfully.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });                
            } else if(response.success===false){                
                //setFullScreenLoader(false);
                toast.error("Internal server error.", {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });                
            }               
            
        } catch (error) {               
            //console.error('submit comment Error:', error);
            //setFullScreenLoader(false); 
            toast.error('Error try later.', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });           
        } 
    };

    const messageAutoreply = async () => {
        setFullScreenLoader(true);
        const authToken = localStorage.getItem('authToken');
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const messageStatus = !isMessageAutoReplyEnabled;
        //console.log(messageStatus);
        try {    
            const messageResponse = await fetch(`${BACKEND_URL}/api/settings/system_auto_functions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + authToken,
                },
                body: JSON.stringify({
                    module_name:'message',
                    module_status:messageStatus
                }),
            });
            const response = await messageResponse.json();
            if(response.success===true){
                setMessageAutoReplyEnabled(messageStatus);
                setFullScreenLoader(false);
                toast.success('Message auto-reply setting saved successfully.', {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            } else if(response.success===false){                
                setFullScreenLoader(false);
                toast.error('Internal server error.', {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            }               
            
        } catch (error) {
            setFullScreenLoader(false); 
            toast.error('Error try later.', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });           
        } 
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Allowed file types
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
            // Check file type
            if (!allowedTypes.includes(file.type)) {
                alert("Only JPG, JPEG, and PNG files are allowed");
                e.target.value = ""; // reset input
                return;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                alert("File size should not exceed 2MB");
                e.target.value = ""; // reset input
                return;
            }

            setPreviewImage(URL.createObjectURL(file));
            setFormData({ ...formData, profileImage: file });
        }
    };

    const buildFormData = () => {
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === "profileImage") {
                // If it's a File (new upload), append it
                if (value instanceof File) {
                    formDataToSend.append("profileImage", value);
                } else if (typeof value === "string" && value.trim() !== "") {
                    // If it's a URL (existing image), still send it as a string
                    formDataToSend.append("profileImage", value);
                }
            } else {
                formDataToSend.append(key, value);
            }
        });
        return formDataToSend;
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name required.";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name required.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateField = (field, value) => {
        let message = "";
        if (!value.trim()) {
            if (field === "firstName") message = "First name required.";
            if (field === "lastName") message = "Last name required.";
        }
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };

    const handleInputChange = (field, value) => {
        let newValue = value;
        if (field === "firstName" || field === "lastName") {
            newValue = value.replace(/[^A-Za-z\s]/g, "");
        }
        if (field === "bio") {
           newValue = value.replace(/[^A-Za-z0-9\s.,!?'-]/g, "");
        }

        if (field === "company" || field === "jobTitle") {
            newValue = value.replace(/[^A-Za-z0-9\s&.,-]/g, "");
        }

        setFormData((prev) => ({
            ...prev,
            [field]: newValue,
        }));
        validateField(field, newValue);        
    };

    const isFormValid = () => {
        return (
            formData.firstName.trim() &&
            formData.lastName.trim() &&
            !errors.firstName &&
            !errors.lastName
        );
    };

    const clickSaveProfile = async () => { 
        if(!validateForm()) return;
        setSaveProfileLoader(true);
        //console.log('formData',formData);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');

        const formDataToSend = new FormData();
        formDataToSend.append("firstName", formData.firstName);
        formDataToSend.append("lastName", formData.lastName);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("bio", formData.bio);
        formDataToSend.append("company", formData.company);
        formDataToSend.append("jobTitle", formData.jobTitle);
        formDataToSend.append("userLocation", formData.userLocation);
        formDataToSend.append("userWebsite", formData.userWebsite);

        if (formData.profileImage) {
            formDataToSend.append("upload_img", formData.profileImage); // 👈 must match multer field
        }

        try {            
            const responseData = await fetch(`${BACKEND_URL}/api/profileUpdate`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                },
                body: formDataToSend,
            });
            const response = await responseData.json();
            if(response.success===true){
                const existingUserInfo = JSON.parse(localStorage.getItem("userinfo")) || {};
                const updatedUserInfo = {
                    ...existingUserInfo,
                    userData: response.userInfo.userData // take updated user data from backend
                };
                localStorage.setItem("userinfo", JSON.stringify(updatedUserInfo));
                setuserProfileData(response.userInfo.userData);
                // Dispatch a custom event to notify Header.js                 
                window.dispatchEvent(new Event('userinfoUpdated'));                                                             
                setSaveProfileLoader(false);
                toast.success(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });                
            } else {
                setSaveProfileLoader(false);
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        } catch (error) { 
            console.log(error.message || 'Failed to update profile.');
            setSaveProfileLoader(false);
        }  
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        const updatedForm = {
            ...passwordFormData,
            [name]: value,
        };
        setPasswordFormData(updatedForm);
        // clone old errors (so unrelated ones don't reset)
        let errors = { ...passwordErrors };
        if (name === "currentPassword") {
            if (!value) {
                errors.currentPassword = "Current password is required.";
            } else if (value.length < 4) {
                errors.currentPassword = "Current password must be at least 4 characters.";
            } else {
                errors.currentPassword = "";
            }
        }

        if (name === "newPassword") {
            if (!value) {
                errors.newPassword = "New password is required.";
            } else if (value.length < 6) {
                errors.newPassword = "New password must be at least 6 characters.";
            } else {
                errors.newPassword = "";
            }

            // check confirmPassword if already typed
            if (updatedForm.confirmPassword && updatedForm.confirmPassword !== value) {
                errors.confirmPassword = "Passwords do not match.";
            } else {
                errors.confirmPassword = "";
            }
        }

        if (name === "confirmPassword") {
            if (!value) {
                errors.confirmPassword = "Confirm password is required.";
            } else if (value !== updatedForm.newPassword) {
                errors.confirmPassword = "New & confirm passwords do not match.";
            } else {
                errors.confirmPassword = "";
            }
        }
        setPasswordErrors(errors);
    };

    const handleTogglePassword = (field) => {
        setShowPassword({
            current: field === "current" ? !showPassword.current : false,
            new: field === "new" ? !showPassword.new : false,
            confirm: field === "confirm" ? !showPassword.confirm : false,
        });
    };

    const isButtonDisabled =
    !passwordFormData.currentPassword ||
    !passwordFormData.newPassword ||
    !passwordFormData.confirmPassword ||
    passwordErrors.currentPassword ||
    passwordErrors.newPassword ||
    passwordErrors.confirmPassword;

    const renderEyeIcon = (field) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="position-absolute"
            style={{
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "18px",
                height: "18px",
                color: "#6c757d",
                cursor: "pointer",
            }}
            viewBox="0 0 24 24"
            onClick={() => handleTogglePassword(field)}
        >
            {showPassword[field] ? (
                <>
                    {/* Closed eye */}
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <path d="M2 2l20 20" />
                </>
            ) : (
                <>
                    {/* Open eye */}
                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />                    
                </>
            )}
        </svg>
    );

    const clickUpdatePassword = async () => {         
        if (Object.values(errors).some((err) => err)) {
            return alert("Please fix the errors before updating.");
        }
        setPasswordLoader(true);
        //console.log("Password data to send:", passwordFormData);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        try {
            const responseData = await fetch(`${BACKEND_URL}/api/update-profile-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ 
                    currentPassword: passwordFormData.currentPassword,
                    confirmPassword: passwordFormData.confirmPassword,
                }),
            });
            const response = await responseData.json();            
            //console.log('response',response);
            if(response.success===true){                 
                setPasswordFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                })
                toast.success(`Password updated successfully.`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else if(response.success===false) {
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else {
                toast.error(`Something went wrong while updating password.`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }          
        } catch (error) { 
            console.log(error.message || 'Failed to update password.');            
        } finally {
            setPasswordLoader(false);
        }
    };
    
    const handleDeleteAcoount = async () => {
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        setShowAccountModal(false);
        setFullScreenLoader(true);  
        try {
            const responseData = await fetch(`${BACKEND_URL}/api/delete-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
            });
            const response = await responseData.json();
            if(response.success===true){            
                localStorage.removeItem('authToken');    
                localStorage.removeItem('userinfo'); 
                localStorage.removeItem('email');
                localStorage.removeItem('accountCreate');
                localStorage.removeItem('emailVerification'); 
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                navigate('/login');
            } else if(response.success===false){  
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else {
                toast.error(`Something went wrong while deleting account.`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } 
        } catch (error) { 
            console.log(error.message || 'Failed to delete account.');            
        } finally {
            setFullScreenLoader(false);
        }        
    };

    const handleChangeTimezone = async (e) => {
        const selected =  e.target.value;
        //setSelectedTimeZone(selected); 
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const authToken = localStorage.getItem('authToken');
        setFullScreenLoader(true);        
        try {            
            const responseData = await fetch(`${BACKEND_URL}/api/save-timezone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ timeZone: selected }), 
            });
            const response = await responseData.json();
            if(response.success===true){                
                setSelectedTimeZone({timeZoneName: selected || ""})
                const existingUserInfo = JSON.parse(localStorage.getItem("userinfo")) || {};
                const updatedUserInfo = {
                    ...existingUserInfo,
                    userData: response.userInfo.userData
                };
                localStorage.setItem("userinfo", JSON.stringify(updatedUserInfo));
                window.dispatchEvent(new Event('userinfoUpdated'));      
                
            } else if(response.success===false){  
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else {
                toast.error(`Something went wrong.`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } 
        } catch (error) { 
            console.log(error.message || 'Failed to save timezone.');            
        } finally {
            setFullScreenLoader(false);
        }
    };   

    return (
        <div className="page-wrapper compact-wrapper">
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
                    <div className="container-fluid">
                        <div className="page-title">        
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="mb-0 h1-heading">Profile Settings</h1>
                                    <p> Manage your account settings and preferences </p>
                                </div>                                
                            </div>
                        </div>
                    </div>
                    <div className="container-fluid">
                        <div className="row"> 
                            <div className="col-md-8"> 
                                <div className="card custom-form-label"> 
                                    <div className="card-header border-0"> 
                                        <h5> Personal Information </h5>                                        
                                    </div>
                                    <div className="card-body"> 
                                        <div className="d-flex align-items-center gap-3">                                           
                                            <div className="user-profile-img">
                                                {previewImage ? (
                                                    // Show newly selected preview image
                                                    <img
                                                        src={previewImage}
                                                        alt="Profile Preview"
                                                        style={{
                                                            width: "76px",
                                                            height: "76px",
                                                            borderRadius: "50%",                                                            
                                                        }}
                                                    />
                                                ) : userProfileData?.profileImage ? (
                                                    <img
                                                        src={`${process.env.REACT_APP_BACKEND_URL}${userProfileData.profileImage}`}
                                                        alt="Profile"
                                                        style={{
                                                            width: "76px",
                                                            height: "76px",
                                                            borderRadius: "50%",                                                            
                                                        }}
                                                    />
                                                ) : (
                                                    // Show initials fallback
                                                    <div
                                                        className="d-flex align-items-center justify-content-center"
                                                        style={{
                                                            background: "linear-gradient(to right, #2563eb, #9333ea)",
                                                            border: "none",
                                                            width: "77px",
                                                            height: "77px",
                                                            borderRadius: "50px",
                                                            color: "#fff",
                                                            fontWeight: "700",
                                                            fontSize: "20px",
                                                        }}
                                                    >
                                                        {userProfileData?.firstName?.charAt(0).toUpperCase()}
                                                        {userProfileData?.lastName?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="d-flex flex-column"> 
                                                <div> 
                                                    <h6 className="h6-heading"> Profile Picture</h6> 
                                                </div>
                                                <div> 
                                                    <p> JPG, PNG. Max size 5MB. </p>
                                                </div>
                                                <div className="d-flex justify-content-center align-items-center gap-3 my-2"> 
                                                    <label className="btn  img-upload-btn mb-0">
                                                        <input type="file" hidden  accept="image/*" onChange={handleImageChange}/>
                                                        {userProfileData.profileImage ? ( 
                                                            <>
                                                                Upload New
                                                            </>                                 
                                                        ) : (
                                                            <>
                                                                Upload
                                                            </> 
                                                        )}  
                                                    </label>                                                        
                                                    {previewImage && (
                                                        <button
                                                            className="btn btn-link img-remove-btn text-danger p-0"
                                                            onClick={() => {
                                                                setPreviewImage(
                                                                userProfileData?.profileImage
                                                                    ? `${process.env.REACT_APP_BACKEND_URL}${userProfileData.profileImage}`
                                                                    : ""
                                                                );
                                                                setFormData({ ...formData, profileImage: "" });
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}                                                        
                                                </div>
                                            </div>                                           
                                        </div>
                                            <div className="d-flex  align-items-center gap-3 mt-3">   
                                                <div className="form-group w-100">
                                                    <label>First Name</label>
                                                    <input
                                                        className={`form-control ${errors.firstName ? "border-danger" : ""}`}
                                                        type="text"
                                                        placeholder="First Name"
                                                        value={formData.firstName}
                                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                        onBlur={(e) => validateField("firstName", e.target.value)}
                                                        onKeyUp={(e) => validateField("firstName", e.target.value)}
                                                    />                                                   
                                                </div>
                                                <div className="form-group w-100">
                                                    <label>Last Name</label>
                                                    <input
                                                        className={`form-control ${errors.lastName ? "border-danger" : ""}`}
                                                        type="text"
                                                        placeholder="Last Name"
                                                        value={formData.lastName}
                                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                        onBlur={(e) => validateField("lastName", e.target.value)}
                                                        onKeyUp={(e) => validateField("lastName", e.target.value)}
                                                    />                                                    
                                                </div> 
                                            </div>
                                            <div className="form-group w-100 mt-3">
                                                <label>Email Address</label>
                                                <input
                                                    className="form-control"
                                                    type="email"
                                                    placeholder="john@gmail.com"
                                                    value={formData.email}
                                                    disabled
                                                    style={{cursor:'no-drop'}}                                                   
                                                />                                                
                                            </div>
                                            <div className="form-group w-100 mt-3">
                                                <label>Bio</label>
                                                <textarea
                                                    className="form-control"
                                                    placeholder="Write something about yourself..."
                                                    value={formData.bio}
                                                    onChange={(e) => handleInputChange("bio", e.target.value)}                                                    
                                                    rows="4"
                                                />
                                            </div> 

                                            <div className="d-flex  align-items-center gap-3 mt-3">   
                                                <div className="form-group w-100">
                                                    <label>Company</label>
                                                    <div className="position-relative">
                                                        {/* SVG Icon */}
                                                        <svg  xmlns="http://www.w3.org/2000/svg" fill="none"stroke="currentColor" strokeWidth="2"strokeLinecap="round"
                                                            strokeLinejoin="round" className="position-absolute"
                                                            style={{
                                                            left: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            width: "18px",
                                                            height: "18px",
                                                            color: "#6c757d"
                                                            }}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                                            <rect width="20" height="14" x="2" y="6" rx="2"></rect>
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            className="form-control ps-5"
                                                            placeholder="Company"
                                                            value={formData.company}
                                                            onChange={(e) => handleInputChange("company", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group w-100">
                                                    <label>Job Title</label>
                                                    <input 
                                                        className="form-control" 
                                                        type="text" 
                                                        placeholder="Job Title " 
                                                        value={formData.jobTitle}
                                                        onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                                                    />
                                                </div> 
                                            </div> 

                                            <div className="d-flex  align-items-center gap-3 mt-3">   
                                                <div className="form-group w-100">
                                                    <label>Location</label>
                                                    <div className=" position-relative">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="position-absolute"
                                                            style={{
                                                            left: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            width: "18px",
                                                            height: "18px",
                                                            color: "#6c757d"
                                                            }}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                                                            <circle cx="12" cy="10" r="3"></circle>
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            className="form-control ps-5"
                                                            placeholder="Enter Location"
                                                            value={formData.userLocation}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, userLocation: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div> 
                                                <div className="form-group w-100"><label>Website</label>
                                                    <div className="position-relative">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="position-absolute"
                                                            style={{
                                                            left: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            width: "18px",
                                                            height: "18px",
                                                            color: "#6c757d"
                                                            }}
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle cx="12" cy="12" r="10"></circle>
                                                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                                                            <path d="M2 12h20"></path>
                                                        </svg>
                                                        <input
                                                            type="text"
                                                            className="form-control ps-5"
                                                            placeholder="Website URL"
                                                            value={formData.userWebsite}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, userWebsite: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div> 
                                            </div>
                                            {saveProfileLoader ? (
                                                <button className="btn btn-primary my-3 d-flex align-items-center gap-2">
                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                        <span className="sr-only">Loading...</span>
                                                    </div> Save Changes
                                                </button>
                                            ) : (
                                                <button disabled={!isFormValid()} onClick={clickSaveProfile} className="btn btn-primary my-3 d-flex align-items-center gap-2">
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
                                                        className="lucide lucide-save"
                                                        >
                                                        <path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                                                        <path d="M17 21v-8H7v8"></path>
                                                        <path d="M7 3v5h8"></path>
                                                    </svg>
                                                    Save Changes
                                                </button>
                                            )}                                             
                                    </div>
                                </div>
                                <div className="card custom-form-label"> 
                                    <div className="card-header border-0"> 
                                        <h5> Change Password </h5>
                                    </div>
                                    <div className="card-body pt-0">
                                        <div className="form-group w-100">
                                            <label>Current Password</label>
                                            <div className="position-relative">
                                                {renderEyeIcon("current")}
                                                <input
                                                    type={showPassword.current ? "text" : "password"}
                                                    name="currentPassword"
                                                    className={`form-control pe-5 ${passwordErrors.currentPassword ? "border-danger" : ""}`}
                                                    value={passwordFormData.currentPassword}
                                                    onChange={handlePasswordChange}
                                                />
                                            </div>                                                
                                        </div> 

                                    <div className="d-flex  align-items-center gap-3 mt-3">   
                                        <div className="form-group w-100">
                                            <label>New Password</label>
                                            <div className="position-relative">
                                                {renderEyeIcon("new")}
                                                <input
                                                    type={showPassword.new ? "text" : "password"}
                                                    name="newPassword"
                                                    className={`form-control pe-5 ${passwordErrors.newPassword ? "border-danger" : ""}`}
                                                    value={passwordFormData.newPassword}
                                                    onChange={handlePasswordChange}
                                                />
                                                </div>                                                                                                               
                                            </div>
                                            <div className="form-group w-100"><label>Confirm Password</label>
                                                <div className="position-relative">
                                                    {renderEyeIcon("confirm")}
                                                    <input
                                                        type={showPassword.confirm ? "text" : "password"}
                                                        name="confirmPassword"
                                                        className={`form-control pe-5 ${passwordErrors.confirmPassword ? "border-danger" : ""}`}
                                                        value={passwordFormData.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                    />
                                                </div>
                                            </div>                                                      
                                        </div>
                                        {passwordLoader ? (
                                            <button className="btn btn-primary my-3 d-flex align-items-center gap-2">
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div> Update Password
                                            </button>
                                        ) : (
                                            <div className="d-flex gap-3 align-items-center">
                                                <button 
                                                    disabled={isButtonDisabled}
                                                    onClick={clickUpdatePassword} 
                                                    className="btn btn-primary my-3 d-flex align-items-center gap-2"
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
                                                        className="lucide lucide-key">
                                                        <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"></path>
                                                        <path d="m21 2-9.6 9.6"></path>
                                                        <circle cx="7.5" cy="15.5" r="5.5"></circle>
                                                    </svg>
                                                    Update Password
                                                </button>
                                                <div> 
                                                    <ul style={{listStyleType:'circle',marginLeft:'15px'}}>
                                                        { passwordErrors.currentPassword && (
                                                            <li>
                                                                {passwordErrors.currentPassword && (<small className="text-danger" style={{fontSize:'12px'}}>{passwordErrors.currentPassword}</small> )}
                                                            </li>
                                                        )}
                                                        { passwordErrors.newPassword && (
                                                            <li>
                                                                {passwordErrors.newPassword && <small className="text-danger" style={{fontSize:'12px'}}>{passwordErrors.newPassword}</small>}
                                                            </li>
                                                        )}
                                                        { passwordErrors.confirmPassword && (
                                                            <li>
                                                                {passwordErrors.confirmPassword && <small className="text-danger" style={{fontSize:'12px'}}>{passwordErrors.confirmPassword}</small>}
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}                                                                            
                                    </div>
                                </div>
                                <div className="card custom-form-label"> 
                                    <div className="card-header border-0"> 
                                        <h5> App Settings </h5>
                                    </div>
                                    <div className="card-body pt-0"> 
                                        <div className="d-flex align-items-center gap-3">   
                                            <div className="card height-equal w-100 border" style={ {background : '#FBF6FC'}}>
                                                <div className="card-header border-0 pb-0" style={ {background : '#FBF6FC'}}>
                                                    <div className="d-flex align-items-center justify-content-between mb-2"> 
                                                    <div> <h6 className="h6-heading">Comments auto reply</h6>  </div>
                                                        <div> 
                                                            <div className="auto-switch-btn form-check form-switch">
                                                            <input 
                                                                className={`form-check-input check-size ${isCommentAutoReplyEnabled ? 'switch-success' : ''}`} 
                                                                type="checkbox" 
                                                                role="switch" 
                                                                checked={isCommentAutoReplyEnabled}
                                                                onChange={commentAutoreply}
                                                            />                                                                     
                                                            </div> 
                                                        </div>
                                                    </div>
                                                    <p className="f-m-light mt-1">
                                                        Enable this if you want to automatically reply to comments.
                                                    </p>
                                                </div>
                                                <div className="card-wrapper pt-1">
                                                    <div className="form-check-size">
                                                        <span style={{ padding:"0px 0 0 10px", fontSize: "12px"}}>Enable/Disable</span>
                                                    </div>
                                                </div>
                                            </div>                                          

                                            <div className="card height-equal w-100 border" style={ {background : '#FBF6FC'}}>
                                                <div className="card-header border-0 pb-0" style={ {background : '#FBF6FC'}}>
                                                    <div className="d-flex align-items-center justify-content-between mb-2"> 
                                                        <div> 
                                                            <div className="d-flex align-items-center gap-2"> 
                                                                <h6 className="h6-heading">Messages auto reply</h6>                                                        
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"  viewBox="0 0 24 24"fill="none"  
                                                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                                                    className="lucid lucide-info" id=""
                                                                    style={ { cursor:'pointer'}}
                                                                >
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <path d="M12 16v-4"></path>
                                                                    <path d="M12 8h.01"></path>
                                                                </svg>
                                                            </div>
                                                        </div>                                                      
                                                        
                                                        <div className="auto-switch-btn form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                role="switch"
                                                                id="openModalSwitch"
                                                                onClick={() => setShowMessageModal(true)} 
                                                            />                                                            
                                                        </div> 
                                                    </div>
                                                    <p className="f-m-light mt-1">
                                                        Enable this if you want to automatically reply to messages in your inbox.
                                                    </p>
                                                </div>
                                                <div className="card-wrapper pt-1">
                                                    <div className="form-check-size">                                   
                                                        <span style={{ padding:"0px 0 0 10px", fontSize: "12px"}}>Enable/Disable  
                                                            <strong id="openModalSwitch"
                                                                onClick={() => setShowMessageModal(true)}  
                                                                style={ { cursor:'pointer'}}> Requirements 
                                                            </strong> 
                                                        </span> 
                                                    </div>
                                                </div>
                                            </div>
                                        </div>                                                    
                                    </div>
                                </div>                                                                  
                            </div> 

                            <div className="col-md-4"> 
                                <div className="card">  
                                    <div className="card-header border-0"> 
                                        <h5> Account Overview </h5>
                                    </div>
                                    <div className="card-body pt-0" > 
                                        <div className="d-flex flex-column align-items-center justify-content-center p-2 rounded-4" style={{ background:'#F9F6FF'}}> 
                                            <div>  
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="lucide lucide-user text-primary mb-2"
                                                >
                                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg> 
                                            </div>
                                            <div> <h6> Pro Plan </h6> </div>
                                            <div> <p> Active since Jan 2024 </p> </div>
                                        </div>
                                        <div className="d-flex justify-content-between  gap-2 mt-3"> 
                                            <div className="d-flex flex-column align-items-center p-3"> 
                                                <h6>
                                                    {loader ? (
                                                        <i className="fas fa-spin fa-spinner"></i>
                                                    ) : (
                                                        totalCreatedPost || 0
                                                    )} 
                                                </h6>
                                                <p className="text-muted small"> Posts Created </p>    
                                            </div>
                                            <div className="d-flex flex-column align-items-center p-3 rounded-3" style={{ background:'#F9F6FF'}}> 
                                                <h6> {connectedSocialAccount} </h6>
                                                <p className="text-muted small"> Connected Accounts </p>    
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">  
                                    <div className="card-header border-0"> 
                                        <h5> Timezone </h5>                                                                                                                                                         
                                    </div>
                                    <div className="card-body pt-0" > 
                                        <div className="d-flex flex-column gap-3"> 
                                            <div className="w-100">                                                                                                
                                                <div className="w-100 text-center">       
                                                    <div class="w-100">                                                        
                                                        <select
                                                            id="timezone"
                                                            name="timezone"
                                                            class="w-100 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                            value={selectedTimeZone.timeZoneName}
                                                            onChange={handleChangeTimezone}
                                                        >
                                                            <option value="">-- Select Timezone --</option>
                                                            {timeZones.map((timeZone) => (
                                                                <option key={timeZone.timeZoneName} value={timeZone.timeZoneName}>
                                                                    {timeZone.timeZoneName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div> 
                                            </div>
                                        </div>                                     
                                    </div>
                                </div>

                                {/* <div className="card">  
                                    <div className="card-header border-0"> 
                                        <h5> Security & Privacy </h5>
                                    </div>
                                    <div className="card-body pt-0" > 
                                        <div className="d-flex flex-column gap-3"> 
                                            <div className="w-100">
                                                <div className="d-flex align-items-center justify-content-between w-100"> 
                                                    <p className="fw-medium text-dark mb-0" style={{fontSize:'14px'}}>
                                                    Two-Factor Authentication
                                                    </p>
                                                    <span className="badge rounded-pill bg-success text-white"> Enabled </span>
                                                </div>
                                                    <p className="text-muted small">
                                                      Add an extra layer of security to your account  
                                                    </p>
                                                     <div className="w-100 text-center">       
                                                    <button className="security-privacy btn w-100"> Manage 2FA </button>
                                                    </div> 
                                            </div>
                                        </div>             
                                    </div>
                                </div> */}
                                <div className="card">  
                                    <div className="card-header border-0"> 
                                        <h5 className="text-danger"> Danger Zone </h5>
                                    </div>
                                    <div className="card-body pt-0" >                                        
                                        <div className="danger-zone p-3 rounded-4"> 
                                            <h6> Delete Account </h6> 
                                            <p> Permanently remove your account and all associated data. This action cannot be undone. </p>
                                            <button className="w-100" onClick={() => setShowAccountModal(true)}>  
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2 h-4 w-4 mr-2">
                                                    <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                    <line x1="10" x2="10" y1="11" y2="17"></line>
                                                    <line x1="14" x2="14" y1="11" y2="17"></line>
                                                </svg> 
                                                Delete Account 
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>                   
                </div>
                {/* Confirmation Modal */}
                    {showAccountModal && (
                        <>
                            <Modal
                                show={showAccountModal}
                                onHide={() => setShowAccountModal(false)}
                                centered
                                backdrop="static"
                            >
                                <Modal.Header closeButton>
                                    <Modal.Title className="text-danger" style={{fontSize:'18px'}}>Confirm Delete</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    <p>
                                        Are you sure you want to permanently delete your account?                                        
                                    </p>
                                </Modal.Body>
                                <Modal.Footer>
                                    <Button variant="danger" onClick={handleDeleteAcoount}>
                                        Yes, Delete
                                    </Button>
                                    <Button variant="secondary" onClick={() => setShowAccountModal(false)}>
                                        Cancel
                                    </Button>                                    
                                </Modal.Footer>
                            </Modal>
                        </>                   
                    )}
                {/* End Confirmation Modal */} 

                {/* messages-modal start */}
                    {showMessageModal && (                                        
                        <div className="container">
                            <Modal
                                dialogClassName="messages-modal"
                                show={showMessageModal}
                                onHide={() => setShowMessageModal(false)}
                                centered
                                backdrop="static"
                                keyboard={false}
                            >                                                        
                                <Modal.Header closeButton className="border-0">                                    
                                    <div className="d-flex align-items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-message-circle text-primary"
                                        >
                                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                        </svg> 
                                        <h5 className="modal-title" id="exampleModalLabel"> 
                                            Messages Auto Reply Requirements
                                        </h5>
                                    </div>                                                 
                                </Modal.Header>
                                <Modal.Body>                                    
                                    <p className="text-dark mb-0" style={{fontSize:'14px'}}>
                                        To enable AI-powered message auto reply, you need to:
                                    </p>
                                    <div className="d-flex align-items-center my-2 gap-3" >
                                        <div class="">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="lucide lucide-database text-primary"
                                            >
                                                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                                <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
                                                <path d="M3 12A9 3 0 0 0 21 12"></path>
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-dark mb-0" style={{fontSize:'14px'}}>
                                                Supply a Global Knowledge Base
                                            </p>
                                            <p className="text-muted small">
                                                Create content entries for AI to reference when generating responses
                                            </p>
                                        </div>                                                            
                                    </div>

                                    <div className="d-flex align-items-center my-2 gap-3" >
                                        <div class="">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="lucide lucide-link text-primary" >
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-dark mb-0" style={{fontSize:'14px'}}>
                                                Connect integrated platforms and extend to their pages
                                            </p>
                                            <p className="text-muted small">
                                                Link your social media accounts for automated responses
                                            </p>
                                        </div>                                                            
                                    </div>

                                    <div className="d-flex align-items-center my-2 gap-3" >
                                        <div class="">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="lucide lucide-message-circle text-primary"
                                            >
                                                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                                            </svg>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-dark mb-0" style={{fontSize:'14px'}}>
                                                Configure OpenAI Integration
                                            </p>
                                            <p className="text-muted small">
                                                AI will generate intelligent responses based on your knowledge base
                                            </p>
                                        </div>                                                            
                                    </div>
                                    <div className="p-3 mt-3 rounded-3" style={{ background :'#FBF6FC'}}> 
                                        <p className="small mb-0 text-primary">  <strong>How it works: </strong> OpenAI analyzes incoming messages and generates personalized responses using your knowledge base content, maintaining consistent brand voice across all platforms.</p>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="border-0 pt-0">                                    
                                    <button type="button" 
                                        className="btn custom-outline-btn"
                                        data-bs-dismiss="modal" 
                                    >
                                        Got it
                                    </button>                                                        
                                    <Link to="/knowledge-base" className="btn btn-primary rounded-3">
                                        Setup Knowledge Base
                                    </Link>
                                </Modal.Footer>                                                                                       
                            </Modal>
                        </div>
                    )}
                {/* messages-modal end  */}

                <Footer />
            </div>
        </div>
    )
}
