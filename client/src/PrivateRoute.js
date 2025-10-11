import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const PrivateRoute = ({ element }) => {
  const { isLoggedIn } = useContext(AuthContext);
  // If the user is not logged in, redirect to login page.
  const storedToken = localStorage.getItem('authToken');
    if(!storedToken){
      if(!isLoggedIn) {
        return <Navigate to="/login" />;
      }
    } 
      

  // If the user is logged in, render the requested element.
  return element;
};

export default PrivateRoute;
