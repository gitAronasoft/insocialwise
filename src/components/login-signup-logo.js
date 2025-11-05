import React from 'react';
import {Link} from 'react-router-dom';

export default function LoginSignupLogo(){
    return(        
        <Link to="/" className="logo text-center">
            <img className="img-fluid for-light" style={{width:35}} src={`${process.env.PUBLIC_URL}/assets/images/logo/logo.svg`} alt="looginpage"/> 
            <span style={{fontSize:35,marginLeft:10,color:'#000'}}>insocialwise</span>
        </Link>        
    );
}