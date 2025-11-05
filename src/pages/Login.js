import React, { useState,useEffect, useContext } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import {Link,useNavigate} from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { authUser } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [showPassWord, setShowPassWord] = useState(false);
  const [formData, setFormData] = useState({
      email: '',
      password: ''
  });
  const [errors, setErrors] = useState({ email: false, password: false });
  
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if(storedToken) {
      navigate('/dashboard');
    }
  });

  const handleTogglePassword = () => {
    setShowPassWord(!showPassWord); 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: value === ''
    }));
  };

  const handleSubmit = async (e) => { 
    e.preventDefault();
    setLoading(true);
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const { email, password } = formData;
    if(email === '') {
      setErrors({
        email: email === '',        
      });      
      setLoading(false);
    } else if(password === '') {
      setErrors({        
        password: password === ''
      });      
      setLoading(false);
    } else {
      try {
        const res = await fetch(`${BACKEND_URL}/sign-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if(data.success===true) {
          //localStorage.setItem('authToken', data.token);
          //localStorage.setItem('tokenExpirationTime', data.expirationTime); 
          localStorage.setItem('userinfo', JSON.stringify(data.userInfo));
          //console.log('tes',data.userInfo.socialData.status); 
          const { token, expirationTime } = data;
          authUser(token, expirationTime); 
          setFormData({
              email: '',
              password: ''
          });
          toast.success(`Login successfully.`, {
            position: 'top-right',
            autoClose: 5000,
            autoClose: true,
            hideProgressBar: false,
            closeOnClick: true,
            theme: "colored",
          });                    
          navigate('/dashboard');               
        } else if(data.message==="Invalid details") {           
          toast.error(`${data.message}`, {
            position: 'top-right',
            autoClose: 5000,
            autoClose: true,
            hideProgressBar: false,
            closeOnClick: true,
            theme: "colored",
          });          
        } else if(data.success=== false && data.message==="Email not verified.") {
          toast.error(`${data.message}`, {
            position: 'top-right',
            autoClose: 5000,
            autoClose: true,
            hideProgressBar: false,
            closeOnClick: true,
            theme: "colored",
          });
          localStorage.setItem('email', data.email);
          navigate('/email-verify'); 
        } else if(data.success=== false){
          toast.error(`${data.message}`, {
            position: 'top-right',
            autoClose: 5000,
            autoClose: true,
            hideProgressBar: false,
            closeOnClick: true,
            theme: "colored",
          });
        } else {
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
        toast.error(`Failed to login.Please try again.`, {
          position: 'top-right',
          autoClose: 5000,
          autoClose: true,
          hideProgressBar: false,
          closeOnClick: true,
          theme: "colored",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="container-fluid">
        <div className="row">
          <div className="col-xl-7" style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/login/2.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            
          </div>
          <div className="col-xl-5 p-0">
            <div className="login-card login-dark">
              <div>
                <div>
                  <LoginSignupLogo />
                </div>
                <div className="login-main">
                  <form className="theme-form" onSubmit={handleSubmit}>
                    <h4>Sign in to account</h4>
                    <p>Enter your email & password to login</p>
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
                            type={showPassWord ? "text" : "password"}
                            name="password" 
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="*********"
                          />                          
                        <div className="show-hide" onClick={handleTogglePassword}>
                          <span
                            onClick={() => setShowPassWord(!showPassWord)}
                            className={!showPassWord ? "show" : ""}
                          />                       
                        </div>                        
                      </div>                                          
                    </div>
                    <div className="form-group mb-5">
                      <div className="checkbox p-0">
                        <Link to="/forget-password" className="link">Forgot password?</Link>
                      </div>                                          
                    </div>

                    <div className="form-group mb-0">                                           
                      {loading ? (
                          <button 
                              className="btn btn-primary btn-block w-100"                           
                              disabled={loading}
                          > 
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                          </button> 
                        ) : ( 
                          <button 
                              className="btn btn-primary btn-block w-100" 
                              type="submit"
                              disabled={loading}
                          >Sign in 
                          </button>                       
                        )}
                    </div>
                    <p className="mt-4 mb-0 text-center">Don't have an account? <Link to="/create-account" className="ms-2" >Create Account</Link></p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
