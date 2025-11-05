import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginSignupLogo from '../components/login-signup-logo';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function EmailVerifiedProcess() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { uuid } = useParams();
    const { authUser } = useContext(AuthContext);

    useEffect(() => {         
        const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`; 
        //const storedToken = localStorage.getItem('authToken');
        // if(storedToken) {
        //     navigate('/dashboard');
        // }       
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/email-verified-process/${uuid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });                
                const data = await res.json();
                if(data.message==='Account verified & Logged In successful') {
                    //localStorage.removeItem('email');
                    localStorage.setItem('emailVerification', 'verified');  
                    localStorage.setItem('userinfo', JSON.stringify(data.userInfo));
                    const {token} = data;
                    authUser(token);                                       
                    navigate('/account-setup');
                } else {  
                    const accountCreate = localStorage.getItem('emailVerification');
                    if(accountCreate){
                        localStorage.removeItem('email');
                        navigate('/account-setup');
                    } else {
                        localStorage.removeItem('accountCreate');
                        localStorage.removeItem('email'); 
                        localStorage.removeItem('emailVerification');                        
                        navigate('/login');
                    }               
                }
            } catch (err) {
                console.error('Error:', err); 
            } finally {                    
                setLoading(false);
            }
        };
        fetchData();
        
    }, [uuid, authUser, navigate]);  // Add 'authUser' and 'navigate' as dependencies

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
                                        <h4 className="text-center mb-3">Verify your email waiting...</h4>

                                        <div className="form-group mt-3 text-center">                  
                                            {loading ? (
                                                <div className="spinner-border spinner-border-sm" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            ) : (
                                                <div className="spinner-border spinner-border-sm d-none" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            )}
                                        </div>                    
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
