import React, { useState, useEffect } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import {Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ResetPasswordForm() {
    const [fullScreenLoader, setFullScreenLoader] = useState(false);
    const { passwordToken } = useParams();
    const [loader, setLoader] = useState(false);    
    const [showPassword, setShowPassword] = useState({
        new: false,
        confirm: false,
    });

    const [passwordFormData, setPasswordFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordErrors, setPasswordErrors] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [showPasswordForm, setShowPasswordForm] = useState(true);
    const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
    const [responseError, setResponseError] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => { 
        setFullScreenLoader(true);       
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const formattedDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const checkPasswordToken = async () => {           
            try {
                const response = await fetch(`${BACKEND_URL}/reset-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',                        
                    },
                    body: JSON.stringify({ 
                        passwordToken: passwordToken,
                        requestTime: formattedDateTime,
                    }),                   
                });              
                const data = await response.json();                
                if(data.success===true){
                    setEmail(data.email);
                    setFullScreenLoader(false); 
                } else if(data.success===false){
                    setResponseError(data.message);
                    setFullScreenLoader(false);                    
                } else {
                    setResponseError(data.message);
                    setFullScreenLoader(false);
                }             
            } catch (error) {
                console.error("Error fetching post details:", error); 
                setFullScreenLoader(false);               
            }
        }
        checkPasswordToken();
    }, []);

    const isButtonDisabled =
    !passwordFormData.newPassword ||
    !passwordFormData.confirmPassword ||
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

    const handleTogglePassword = (field) => {
        setShowPassword({
            new: field === "new" ? !showPassword.new : false,
            confirm: field === "confirm" ? !showPassword.confirm : false,
        });
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

    const clickUpdatePassword = async () => {         
        if (Object.values(passwordErrors).some((err) => err)) {
            return alert("Please fix the errors before updating.");
        }
        setLoader(true);
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        try {
            const responseData = await fetch(`${BACKEND_URL}/password-reset-submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: email,
                    password: passwordFormData.confirmPassword,
                }),
            });
            const response = await responseData.json();
            if(response.success===true){
                setLoader(true);
                setShowPasswordForm(false);
                setPasswordResetSuccess(true);
            } else if(response.success===false){ 
                setLoader(false);
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            } else {
                setLoader(false);
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }
        } catch (error) { 
            setLoader(false);
            toast.error(`Something went wrong try agian.`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            }); 
        } 
    }

  return (
    <>
        <div className="tap-top"><i data-feather="chevrons-up"></i></div>        
        <div className="page-wrapper">
            {fullScreenLoader ? (
                <div className="fullscreen-loader-overlay">
                    <div className="fullscreen-loader-content">
                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="sr-only">Loading...</span>
                        </div>                                
                    </div>
                </div>
            ) : (            
                <div className="container-fluid p-0">                
                    <div className="row">
                        <div className="col-12">
                            <div className="login-card login-dark">
                                <div>
                                    <div>
                                        <Link className="logo" to="/login">
                                            <LoginSignupLogo />
                                        </Link>
                                    </div>
                                    <div className="login-main">                                    
                                        <>                               
                                            {responseError ? (
                                                <p className='text-danger' style={{fontSize:'17px'}}>{responseError} <Link to="/forget-password">Click here </Link> to reset.</p>
                                            ) : passwordResetSuccess ? (
                                                <p className='text-success'>
                                                    Your password reset successfully. <Link to="/login">Click here</Link> to login.
                                                </p>
                                            ) : (
                                                showPasswordForm && (
                                                    <>
                                                        <h4 className='text-center'>Create Your Password</h4>
                                                        <div className="form-group w-100 mt-3">
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
                                                        <div className="form-group w-100 mt-3"><label>Confirm Password</label>
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
                                                        <div className="form-group mb-0 mt-3">
                                                            {loader ? (                                            
                                                                <button className="btn btn-primary btn-block w-100">
                                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                                        <span className="sr-only">Loading...</span>
                                                                    </div>
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    className="btn btn-primary btn-block w-100"
                                                                    disabled={isButtonDisabled}
                                                                    onClick={clickUpdatePassword}
                                                                > Save 
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )
                                            )}
                                        </>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </>
  )
}
