import React, { useState,useEffect } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

export default function EmailVerification() {
  const navigate = useNavigate();
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const notVerifiedEmail = localStorage.getItem('email');
    
    if(storedToken) {
      navigate('/dashboard');
    } else if(!notVerifiedEmail) {
      navigate('/login');
    }
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    const email = localStorage.getItem('email');
    e.preventDefault();
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
        navigate('/login');
      }
    } catch (err) {
      toast.error('Failed to sending email, please try again.', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
      });
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <div className="page-wrapper">
        <div className="container-fluid p-0">
          <div className="row">
            <div className="col-12">
              <div className="login-card login-dark">
                <div>
                  <div>
                    <LoginSignupLogo />
                  </div>
                  <div className="login-main">                   
                      <h4 className="text-center mb-3">Verify your email.</h4>
                      <p className="text-center">if you have don't received verification email, click resend.</p>
                      <div className="form-group mt-3 text-center">                        
                        {loading ? (
                          <button 
                              className="btn btn-primary btn-block w-100"                           
                              disabled={loading}
                          > 
                             Sending...
                          </button> 
                        ) : ( 
                          <button 
                              className="btn btn-primary btn-block w-100" 
                              onClick={handleSubmit}
                              disabled={loading}
                          >Resend 
                          </button>                       
                        )}
                      </div> 
                      <p className="mt-4 mb-0 text-center">
                        Is the account already verified? 
                        <Link to="/login" className="ms-2">Sign in</Link>
                      </p>                   
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
