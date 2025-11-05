import React, { useState,useEffect } from 'react';
import LoginSignupLogo from '../components/login-signup-logo';
import { Link,useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Signup() {
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if(storedToken) {
      navigate('/dashboard');
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({ firstName: false, lastName: false, email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate(); 

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
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

    if (name === 'password') {
      checkPasswordStrength(value);
      //setStrengthBar(true);
    } 
  };

  const checkPasswordStrength = (password) => {
    const lengthCriteria = password.length >= 8;
    const numberCriteria = /[0-9]/.test(password);
    const lowercaseCriteria = /[a-z]/.test(password);
    const uppercaseCriteria = /[A-Z]/.test(password);
    const specialCharCriteria = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;

    if (lengthCriteria) strength += 1;
    if (numberCriteria) strength += 1;
    if (lowercaseCriteria) strength += 1;
    if (uppercaseCriteria) strength += 1;
    if (specialCharCriteria) strength += 1;
    setPasswordStrength(strength);      
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
    const { firstName, lastName, email, password } = formData;
    
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
          localStorage.setItem('email', data.email);             
          toast.success('Account created successfully', {
              position: 'top-center',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
          });
          navigate('/email-verify');
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
      setLoading(false);
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
        >
        </div>
        <div className="col-xl-5 p-0">
          <div className="login-card login-dark">
            <div>
              <div>
                <LoginSignupLogo />
              </div>
              <div className="login-main">
                <form className="theme-form" onSubmit={handleSubmit}>
                  <h4>Create your account</h4>
                  <p>Enter your personal details to create an account</p>
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
                        <span
                          onClick={() => setShowPassword(!showPassword)}
                          className={!showPassword ? 'show' : ''}
                        />
                      </div>                      
                    </div>                    
                    <small className="text-primary">Password must include at least one number and one punctuation character.</small>
                    <div className="progress mt-2">
                        <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                            aria-valuenow={passwordStrength}
                            aria-valuemin="0"
                            aria-valuemax="5"
                        >
                            {passwordStrength === 0
                            ? 'Weak'
                            : passwordStrength === 1
                            ? 'Fair'
                            : passwordStrength === 2
                            ? 'Good'
                            : passwordStrength === 3
                            ? 'Strong'
                            : 'Very Strong'}
                        </div>
                    </div>
                    
                  </div>
                  <div className="form-group mb-0">
                    <div className="checkbox p-0">
                      <input id="checkbox1" type="checkbox" />
                      <label className="text-muted" htmlFor="checkbox1">
                        Agree with <Link className="ms-2" target='_blank' to="https://www.insocialwise.com/privacy-policy.html">Privacy Policy</Link>
                      </label>
                    </div>
                    <button
                      className="btn btn-primary btn-block w-100"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                  <p className="mt-4 mb-0 text-center">
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
