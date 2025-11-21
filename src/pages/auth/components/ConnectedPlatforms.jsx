import React, { useEffect, useState, useRef } from "react";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import { toast } from "react-toastify";

export default function ConnectedPlatforms({ onPlatformSelect }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [loadingPlatform, setLoadingPlatform] = useState(null);
  const FB_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID;

  const platforms = [
    { 
      name: "Facebook", 
      description: "Connect your Facebook page", 
      bgClass: "facebook-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook h-6 w-6 text-white">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    { 
      name: "LinkedIn", 
      description: "Connect your LinkedIn profile", 
      bgClass: "linkedin-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin h-6 w-6 text-white">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    { 
      name: "Instagram", 
      description: "Connect your Instagram account", 
      bgClass: "instagram-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram h-6 w-6 text-white">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const responseFacebook = (response) => {
    console.log("FB callback:", response);

    // SDK sometimes fires an initial 'unknown' status — ignore those
    if (!response || response.status === "unknown") {
      console.log("FB initial/unknown response ignored.");
      setLoadingPlatform(null);
      return;
    }

    // If error or no token — treat as cancelled/failed
    if (response.error || response.status === "not_authorized" || !response.accessToken && !response.authResponse?.accessToken) {
      toast.error("Facebook login cancelled or failed.");
      setLoadingPlatform(null);
      return;
    }

    const accessToken = response.accessToken ?? response.authResponse?.accessToken;
    if (!accessToken) {
      toast.error("Could not get Facebook access token.");
      setLoadingPlatform(null);
      return;
    }

    // success — pass token back to Dashboard (or parent)
    setLoadingPlatform(null);
    onPlatformSelect?.("Facebook", accessToken);
    setOpen(false);
  };

  const handleFacebookRenderClick = (sdkOnClick) => {
    setLoadingPlatform("Facebook");
    setTimeout(() => sdkOnClick?.(), 50);
  };

  const handleGenericPick = (platform) => {
    onPlatformSelect?.(platform, null);
    setOpen(false);
  };

  return (
    <div className="dropdown my-3 remove-dropdown-icon" ref={dropdownRef}>
      <button className="d-flex align-items-center justify-content-center btn btn-hover-effect btn-primary" type="button" onClick={() => setOpen(!open)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="me-2" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"></path></svg>
        Add Platform
      </button>

      {open && (
        <div className="dropdown-menu custom-dropdown-full show p-4 mt-2 rounded" style={{ minWidth: 280 }}>
          <h6 className="mb-3">Connect Social Platform</h6>

          {/* Facebook via SDK */}
          <FacebookLogin
            appId={FB_APP_ID}
            autoLoad={false}
            fields="name,email,picture,accounts"
            scope="pages_show_list,pages_manage_metadata,pages_read_engagement,pages_read_user_content,pages_manage_posts,pages_manage_engagement,read_insights,pages_messaging,ads_management,ads_read,business_management"
            callback={responseFacebook}
            render={(renderProps) => (
              <div
                onClick={() => handleFacebookRenderClick(renderProps.onClick)}
                className="d-flex align-items-center gap-2 justify-content-between p-2 addPlatform-card"
                style={{ cursor: loadingPlatform === "Facebook" ? "default" : "pointer" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="facebook-connect-img text-white">
                    {loadingPlatform === "Facebook" ? (
                      <div className="spinner-border spinner-border-sm text-white p-2" role="status" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook h-6 w-6 text-white">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    )}
                  </div>
                  <div className="d-flex flex-column">
                    <h6>Facebook</h6>
                    {loadingPlatform === "Facebook" ? (
                      <small className="text-muted">Connecting...</small>
                    ) : (
                      <small className="text-muted">Connect your Facebook page</small>
                    )}
                  </div>
                </div>
                <svg width="20" height="20" fill="none" stroke="currentColor"><path d="m9 18 6-6-6-6"></path></svg>
              </div>
            )}
          />

          {/* LinkedIn Platform */}
          <div onClick={() => { setLoadingPlatform("LinkedIn");
              setTimeout(() => { onPlatformSelect?.("LinkedIn", null); setOpen(false); setLoadingPlatform(null); }, 300);
            }}
            className="d-flex align-items-center gap-2 justify-content-between p-2 addPlatform-card"
            style={{ cursor: loadingPlatform === "LinkedIn" ? "default" : "pointer" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div className="linkedin-connect-img text-white">
                {loadingPlatform === "LinkedIn" ? (
                  <div className="spinner-border spinner-border-sm text-white p-2" role="status" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                )}
              </div>
              <div className="d-flex flex-column">
                <h6>LinkedIn</h6>
                {loadingPlatform === "LinkedIn" ? (
                  <small className="text-muted">Connecting...</small>
                ) : (
                  <small className="text-muted">Connect your LinkedIn profile</small>
                )}
              </div>
            </div>
            <svg width="20" height="20" fill="none" stroke="currentColor">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </div>

        </div>
      )}
    </div>
  );
}
