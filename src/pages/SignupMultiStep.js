import React, { useState, useEffect } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function SignupMultiStep() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const notVerifiedEmail = localStorage.getItem('email');    
    if (storedToken) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: value === '' }));
    if (name === 'password') checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);     
    const { firstName, lastName, email, password } = formData;
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    if (firstName === '') {
        setErrors({
          firstName: firstName === '',
        });
        setLoading(false);
    } else if (lastName === '') {
        setErrors({
          lastName: lastName === '',
        });
        setLoading(false);
    } else if (email === '') {
        setErrors({
          email: email === '',
        });
        setLoading(false);
    } else if (password === '') {
        setErrors({
          password: password === ''
        });
        setLoading(false);
    } else {
        try {
            const res = await fetch(`${BACKEND_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });
            const data = await res.json();
            if(res.ok) { 
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: ''
                }); 
                setPasswordStrength(0); 
                setLoading(false);
                localStorage.setItem('email', data.email);                            
                // toast.success('Account created successfully', {
                //     position: 'top-center',
                //     autoClose: 5000,
                //     hideProgressBar: false,
                //     closeOnClick: true,
                // }); 
                setStep(2);               
            } else { 
                toast.error(data.message || 'Something went wrong', {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                });
            }
        } catch (err) { 
            toast.error('Failed to create account. Please try again.', {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });
        } finally {
            setLoading(false);
        }        
    }
};

const resendVerificationEmail = async (e) => {
    e.preventDefault();
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    const email = localStorage.getItem('email');
    setLoading(true);
    try {
          const res = await fetch(`${BACKEND_URL}/resend-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if(res.ok) {
            toast.success(data.message, {
                position: 'top-center', 
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });             
        } else {
            toast.error(data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
            });        
        }
    } catch (err) {
        toast.error('Failed to sending email, please try again.', {
            position: 'top-center',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
        });       
    } finally {
        setLoading(false);
    }
};

  const handleStartOver = () => {
    setStep(1);    
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
            <>
                <h4 className='text-primary'>Create your account</h4>
                <p className="mb-2">Enter your personal details to create an account</p>
                <div className="form-group">                
                    <label className="col-form-label pt-0">Your Name</label>
                    <div className="row g-2">
                        <div className="col-sm-6">
                            <input
                                className={`form-control ${errors.firstName ? 'border border-danger' : ''}`}
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="First name"
                            />
                        </div>
                        <div className="col-sm-6">
                            <input
                                className={`form-control ${errors.lastName ? 'border border-danger' : ''}`}
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Last name"
                            />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label className="col-form-label">Email Address</label>
                    <input
                        className={`form-control ${errors.email ? 'border border-danger' : ''}`}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="test@gmail.com"
                    />
                </div>
                <div className="form-group">
                    <label className="col-form-label">Password</label>
                    <div className="form-input position-relative">
                        <input
                            className={`form-control ${errors.password ? 'border border-danger' : ''}`}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="*********"
                        />
                        <div className="show-hide" onClick={handleTogglePassword}>
                            <span className={!showPassword ? 'show' : ''} />
                        </div>
                    </div>
                    <small className="text-primary">Must include a number and punctuation character.</small>
                    <div className="progress mt-2">
                        <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}                        >
                            {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength - 1] || 'Weak'}
                        </div>
                    </div>
                </div>
                <div className="form-group mb-3">
                    <div className="checkbox">
                        <input id="checkbox1" type="checkbox" />
                        <label className="text-muted" htmlFor="checkbox1">
                            Agree with <Link className="ms-2" target="_blank" to="/privacy-policy">Privacy Policy</Link>
                        </label>
                    </div>
                </div>
                {loading ? (
                    <button className="btn btn-primary w-100" disabled={loading}>                    
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>                    
                    </button>
                ) : (
                    <button className="btn btn-primary w-100" onClick={handleSubmit}>Create Account</button>
                )}
            </>
        );
      case 2:
        return (
            <>
                <h4 className='text-primary'>Please verify your email</h4>
                <div className="custom-preview-height">
                    <div className="verify-email-card">
                        <div className="custom-card-header">
                            <div className="envelope-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill="#3B82F6"></path>
                                    <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </div>
                            <h2>Almost there! Verify your email</h2>
                            <p className="subtext">We sent a magic link to <span className="user-email">{localStorage.getItem('email')}</span></p>
                        </div>
                        <div className="verification-steps">
                            <div className="step active">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h4>Check your inbox</h4>
                                    <p>Look for an email from us with subject "Verify your account"</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h4>Click the link</h4>
                                    <p>This will confirm your email address instantly</p>
                                </div>
                            </div>
                        </div>
                        <div className="troubleshoot-section">
                            <div className="divider">
                                <span>Didn't get it?</span>
                            </div>
                            <div className="troubleshoot-options">
                            {loading ? (
                                <button 
                                    className="btn-resend"                           
                                    disabled
                                    style={{backgroundColor:'#e7e9eb',color:"GrayText"}}
                                > 
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="sr-only">Loading...</span> 
                                    </div> Sending
                                </button>
                            ) : (
                                <button className="btn-resend" onClick={resendVerificationEmail}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M23 4L23 10L17 10" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        <path d="M1 20L1 14L7 14" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        <path d="M3.51 9C4.01717 7.56678 4.87913 6.2854 6.01547 5.27542C7.1518 4.26543 8.52547 3.55976 10.0083 3.22426C11.4911 2.88875 13.0348 2.93434 14.4952 3.35677C15.9556 3.77921 17.2853 4.56471 18.36 5.64L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1112 13.9917 20.7757C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </svg>
                                    Resend Email
                                </button>
                            )}
                            </div>
                            <div className="tips">
                                <div className="tip">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6B7280" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        <path d="M12 8V12" stroke="#6B7280" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                        <path d="M12 16H12.01" stroke="#6B7280" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </svg>
                                    <span>Check spam/junk folder</span>
                                </div>
                                <div className="tip">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 12H18L15 21L9 3L6 12H2" stroke="#6B7280" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </svg>
                                    <span>Wrong email? <span className="start-over" onClick={handleStartOver} style={{cursor:'pointer'}}>Start over</span></span>
                                </div>
                            </div>
                        </div>                        
                    </div>
                </div>
            </>            
        );
      case 3:
        return (
            <>
                <h4 className='text-primary'>We'd like to learn more about you.</h4>
                <div className="step-custom-preview-height">
                    <div className="form-group">
                        <label className="form-label custom-label">1. What is your primary goal when using social media?</label>
                        <div className="radio-button-group mt-3">
                            <input type="radio" name="goal" id="goal1" value="planning" className="custom-radio-input"/>
                            <label for="goal1" className="custom-radio-label">Planning and publishing my social media content</label>

                            <input type="radio" name="goal" id="goal2" value="analyzing" className="custom-radio-input"/>
                            <label for="goal2" className="custom-radio-label">Analyzing the performance of my social media posts</label>

                            <input type="radio" name="goal" id="goal3" value="engaging" className="custom-radio-input"/>
                            <label for="goal3" className="custom-radio-label">Engaging with customers and/or followers</label>

                            <input type="radio" name="goal" id="goal4" value="ads" className="custom-radio-input"/>
                            <label for="goal4" className="custom-radio-label">Building brand awareness</label>

                            <input type="radio" name="goal" id="goal5" value="other" className="custom-radio-input"/>
                            <label for="goal5" className="custom-radio-label">Other</label>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label custom-label">2. Which best describes your role?</label>
                        <div className="radio-button-group mt-3">
                            <input type="radio" name="role" id="role1" value="organization" className="custom-radio-input" />
                            <label for="role1" className="custom-radio-label">I manage social media for my organization</label>

                            <input type="radio" name="role" id="role2" value="I-manage-my" className="custom-radio-input"/>
                            <label for="role2" className="custom-radio-label">I manage my own social media accounts</label>

                            <input type="radio" name="role" id="role3" value="lead" className="custom-radio-input"/>
                            <label for="role3" className="custom-radio-label">I lead a team that manages social media</label>

                            <input type="radio" name="role" id="role4" value="other" className="custom-radio-input"/>
                            <label for="role4" className="custom-radio-label">Other</label>
                        </div>
                    </div>
                </div>
            </> 
        );
      case 4:
        return (
            <>
            <div className="form-section">
                <h4 className='text-primary'>Expand Your Social Reach</h4>
                <div className="custom-preview-height">
                    <div className="social-connect-grid ">
                        <div className="connect-header">
                            <p>Connect a third social account now to save time on cross-posting, engaging
                                with your audience, and growing your brand across platforms.</p>
                        </div>
                        <div className="platform-grid">
                            <div className="platform-card facebook">
                                <div className="platform-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                    </svg>
                                </div>
                                <div className="connect-badge">
                                    <span>Connect</span>
                                </div>
                            </div>
                            <div className="platform-card instagram">
                                <div className="platform-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                                        <defs>
                                            <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stop-color="#feda75"></stop>
                                                <stop offset="25%" stop-color="#fa7e1e"></stop>
                                                <stop offset="50%" stop-color="#d62976"></stop>
                                                <stop offset="75%" stop-color="#962fbf"></stop>
                                                <stop offset="100%" stop-color="#4f5bd5"></stop>
                                            </linearGradient>
                                        </defs>
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#instagram-gradient)"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="url(#instagram-gradient)"></path>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#instagram-gradient)" strokeWidth="2"></line>
                                    </svg>
                                </div>
                                <div className="connect-badge">
                                    <span>Connect</span>
                                </div>
                            </div>
                            <div className="platform-card twitter">
                                <div className="platform-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                                    </svg>
                                </div>
                                <div className="connect-badge">
                                    <span>Connect</span>
                                </div>
                            </div>
                            <div className="platform-card linkedin">
                                <div className="platform-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                        <rect x="2" y="9" width="4" height="12"></rect>
                                        <circle cx="4" cy="4" r="2"></circle>
                                    </svg>
                                </div>
                                <div className="connect-badge">
                                    <span>Connect</span>
                                </div>
                            </div>
                        </div>
                        <div className="benefits-section">
                            <div className="benefit-item">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                </svg>
                                <p className="mb-1">Cross-post to multiple platforms simultaneously</p>
                            </div>
                            <div className="benefit-item">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                </svg>
                                <p className="mb-1">Engage with all your audiences from one dashboard</p>
                            </div>
                            <div className="benefit-item">
                                <svg viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
                                </svg>
                                <p className="mb-1">Grow your brand presence across platforms</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                    
            </> 
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid p-0">
        <div className="row m-0">
            <div
                className="col-xl-7 p-0"
                style={{
                    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/login/sign-up.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div className="col-xl-5 p-0">
                <div className="login-card login-dark">
                    <div>
                        <LoginSignupLogo />
                        <div className="login-main multi-step-container">
                            <form className="theme-form" onSubmit={step === 1 ? handleSubmit : handleNext}>
                                <div className="progress mb-3" style={{ height: '6px' }}>
                                    <div
                                        className="progress-bar"
                                        style={{ width: `${(step / 4) * 100}%` }}
                                        role="progressbar"
                                        aria-valuenow={step}
                                        aria-valuemin="1"
                                        aria-valuemax="4"
                                        />
                                    </div>
                                    { renderStepContent()}
                                    {step !== 1 && (
                                        <div className="d-flex justify-content-between mt-4">
                                            <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
                                                Previous
                                            </button>
                                            {step < 4 && (
                                            <button type="submit" className="btn btn-primary ms-auto">
                                                Next
                                            </button>
                                            )}
                                            {step === 4 && (
                                                <>                                                                                                   
                                                    <button type="submit" className="btn btn-primary ms-auto">
                                                        Add more later 
                                                    </button>
                                                </>
                                                
                                            )}
                                        </div>
                                    )}                                    
                                    <p className="mt-4 text-center">
                                        Already have an account?
                                        <Link to="/login" className="ms-2">Sign in</Link>
                                    </p>
                               
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
