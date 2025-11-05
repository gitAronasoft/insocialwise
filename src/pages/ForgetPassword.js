import React, { useState,useEffect } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import {Link,useNavigate} from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgetPassword() {
    const navigate = useNavigate();   
   
    const [userEmailInput, setUserEmailInput] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [error, setError] = useState('');
    const [loader, setLoader] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if(storedToken) {
          navigate('/dashboard');
        }
    });

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const clickSave = async (e) => { 
        if (!userEmail) {
            setError("Email is required");
            return;
        }

        if (!validateEmail(userEmail)) {
            setError("Please enter a valid email address");
            return;
        }  
        setLoader(true);
        setUserEmailInput(true);          
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const formattedDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        try {
            const responseData = await fetch(`${BACKEND_URL}/forget-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: userEmail,
                    requestTime: formattedDateTime,
                }),
            });
            const response = await responseData.json();  
            if(response.success===true){                
                setLoader(false);
                setUserEmailInput(false);
                setShowEmailForm(false);
                setSuccessMessage(response.message);              
            } else if(response.success===false){
                setLoader(false);
                setUserEmailInput(false);
                toast.error(`${response.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    theme: "colored",
                });
            }         
        } catch (error) { 
            console.log(error.message || 'Something went wrong try agian.'); 
            setLoader(false);
            setUserEmailInput(false); 
            toast.error(`Something went wrong try agian.`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                theme: "colored",
            });          
        }        
    };

    return (
        <>
            <div className="tap-top"><i data-feather="chevrons-up"></i></div>
            <div className="page-wrapper">
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
                                        {showEmailForm && (
                                            <>                                 
                                                <h4 className='text-center'>Reset Your Password</h4>
                                                <div className="form-group mt-3">
                                                    <label className="col-form-label">Enter Your Email Address</label>
                                                    <div className="row">                                                
                                                        <div className="col-12 col-sm-12">
                                                            {userEmailInput ? (
                                                                <input                                                            
                                                                    className={`form-control mb-1 ${error ? "border-danger" : ""}`} 
                                                                    placeholder="email@example.com"
                                                                    value={userEmail}
                                                                    disabled                                                               
                                                                />
                                                            ) : (
                                                                <input                                                            
                                                                    className={`form-control mb-1 ${error ? "border-danger" : ""}`} 
                                                                    type="email" 
                                                                    placeholder="email@example.com"                                                                
                                                                    value={userEmail}
                                                                    onChange={(e) => {
                                                                        setUserEmail(e.target.value);
                                                                        setError("");
                                                                    }}
                                                                />
                                                            )}
                                                        </div>                                                
                                                        <div className="col-12">
                                                            <div className="text-end">
                                                                {loader ? (
                                                                    <button                                                                  
                                                                        className="btn btn-primary btn-block m-t-10 w-100" 
                                                                    > 
                                                                        <div className="spinner-border spinner-border-sm" role="status">
                                                                            <span className="sr-only">Loading...</span>
                                                                        </div>
                                                                    </button>
                                                                ) : (
                                                                    <button 
                                                                        disabled={!userEmail}
                                                                        onClick={clickSave}
                                                                        className="btn btn-primary btn-block m-t-10 w-100" 
                                                                        type="submit"> Save
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="mt-4 mb-0 text-center">Already have an account?<Link to="/login" className="ms-2" >Sign in</Link></p>                                                
                                                    </div>
                                                </div>
                                            </> 
                                        )}
                                        {successMessage && (
                                            <>
                                                <p className='text-center text-success' style={{fontSize:'18px'}}>Password reset link sent to your email <b>{userEmail}</b>.</p>
                                                <p className="mt-4 mb-0 text-center">Already reset password?<Link to="/login" className="ms-2" >Sign in</Link></p> 
                                            </>                                            
                                        )}                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
