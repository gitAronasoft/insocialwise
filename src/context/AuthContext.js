import React, { createContext, useState, useEffect } from 'react';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {   
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');  
  
    if(storedToken) {      
      try {        
        setAuthToken(storedToken);             
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);       
        logout(); 
      }
    }
  }, []);

  // Function to handle login
  const authUser = (authToken) => {
    localStorage.setItem('authToken', authToken)    
    setAuthToken(authToken);    
    setIsLoggedIn(true);
  };

  // Function to handle logout
  const logout = async () => {
    const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}`;
    const authToken = localStorage.getItem('authToken');
    setLoading(true);
    try {
      const responseData = await fetch(`${BACKEND_URL}/api/sign-out`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        }
      });
      const response = await responseData.json();
      //console.log('response',response);
      localStorage.removeItem('authToken');    
      localStorage.removeItem('userinfo'); 
      localStorage.removeItem('email');
      localStorage.removeItem('accountCreate');
      localStorage.removeItem('emailVerification'); 
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');   
      setAuthToken(null);    
      setIsLoggedIn(false);
      return { success: true, message: response?.message || 'Logged out successfully' };
    } catch (error) { 
      console.log(error.message || 'Failed to connect Facebook account');       
      localStorage.removeItem('authToken');    
      localStorage.removeItem('userinfo'); 
      localStorage.removeItem('email');
      localStorage.removeItem('accountCreate');
      localStorage.removeItem('emailVerification'); 
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');   
      setAuthToken(null);    
      setIsLoggedIn(false); 
      return { success: false, message: error.message || 'Logout failed' };      
    } finally {
      setLoading(false); // 👈 stop loader
    }
    
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, authToken, loading, authUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
