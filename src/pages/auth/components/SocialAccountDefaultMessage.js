import React, { useState } from 'react';
import {useLocation} from 'react-router-dom';
import AccountNotConnectedComponent from './AccountNotConnectedComponent'

export default function SocialAccountDefaultMessage() {
    const [showConnectModal, setShowConnectModal] = useState(false);
    const location  = useLocation();

    return (
        <div className="error-wrapper" style={{minHeight:'0px'}}>
            <div className="container">
                <div className="col-md-8 offset-md-2">
                    <p className="sub-content mt-0 text-danger">
                        Social accounts or pages not connected
                    </p>
                    <p>This status indicates that one or more required social media accounts or pages have not been linked to the platform or service. As a result, features that rely on these connections—such as content publishing, analytics, or social engagement tracking—may be unavailable. Please ensure all necessary accounts (e.g., Facebook, Instagram, LinkedIn) are properly connected to enable full functionality.</p>
                    <button 
                        className="btn btn-hover-effect btn-primary d-flex align-items-center 
                        justify-content-center w-100"
                        onClick={() => setShowConnectModal(true)}
                    > 
                        <i className="fa-solid fa-plus fs-5 me-2"></i> Connect more accounts 
                    </button>
                </div>
            </div>
            <AccountNotConnectedComponent
                show={showConnectModal}
                onHide={() => setShowConnectModal(false)}
                pageURL={`${location.pathname}`}
            />
        </div>
    )
}
