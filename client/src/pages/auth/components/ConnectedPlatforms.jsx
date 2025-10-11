import React, { useEffect, useState, useRef } from "react";

export default function ConnectedPlatforms({ onPlatformSelect }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const platforms = [
    
    {
      name: "Facebook",
      description: "Connect your Facebook page",
      bgClass: "facebook-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-white"
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      description: "Connect your LinkedIn profile",
      bgClass: "linkedin-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-white"
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect x="2" y="9" width="4" height="12"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      ),
    },
    {
      name: "Instagram",
      description: "Connect your Instagram account",
      bgClass: "instagram-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-white"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
        </svg>
      ),
    },    
    // {
    //   name: "Twitter",
    //   description: "Connect your Twitter account",
    //   bgClass: "twitter-connect-img",
    //   svg: (
    //     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    //       viewBox="0 0 24 24" fill="none" stroke="currentColor"
    //       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    //       className="text-white"
    //     >
    //       <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.51 2-4.51 4.5 0 .35.04.7.11 1.03A12.94 12.94 0 0 1 3.15 1.64a4.48 4.48 0 0 0-.61 2.27c0 1.57.8 2.96 2.02 3.77a4.48 4.48 0 0 1-2.05-.56v.05c0 2.2 1.56 4.03 3.63 4.45a4.48 4.48 0 0 1-2.04.08c.58 1.8 2.26 3.11 4.26 3.15A9.06 9.06 0 0 1 0 19.54a12.78 12.78 0 0 0 6.92 2.03c8.3 0 12.85-6.87 12.85-12.83 0-.2 0-.39-.01-.58A9.19 9.19 0 0 0 23 3z"></path>
    //     </svg>
    //   ),
    // },
    // {
    //   name: "YouTube",
    //   description: "Connect your YouTube channel",
    //   bgClass: "youtube-connect-img",
    //   svg: (
    //     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    //       viewBox="0 0 24 24" fill="none" stroke="currentColor"
    //       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    //       className="text-white"
    //     >
    //       <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.97C18.88 4 12 4 12 4s-6.88 0-8.6.45A2.78 2.78 0 0 0 1.46 6.42 29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 1.97C5.12 20 12 20 12 20s6.88 0 8.6-.45a2.78 2.78 0 0 0 1.94-1.97A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z"></path>
    //       <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
    //     </svg>
    //   ),
    // },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  const handlePick = (platform) => {
    onPlatformSelect?.(platform);
    setOpen(false);
  };

  return (
    <div className="dropdown my-3 remove-dropdown-icon" ref={dropdownRef}>
      <button className="btn btn-hover-effect btn-primary d-flex align-items-center justify-content-center"
        type="button" onClick={() => setOpen(!open)} >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="me-2" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Add Platform
      </button>

      {open && (
        <div className="dropdown-menu custom-dropdown-full show p-4 mt-2 rounded" style={{ minWidth: 280 }}>
          <h6 className="mb-3">Connect Social Platform</h6> 

          {platforms.map((p,index) => (
            <div key={p.name} className="d-flex align-items-center gap-2 justify-content-between p-2 addPlatform-card"
              style={{ cursor: "pointer", animationDelay: `${index * 0.05}s` }} onClick={() => handlePick(p.name)} >
              <div className="d-flex align-items-center gap-2">
                <div className={p.bgClass}>{p.svg}</div>
                <div className="d-flex flex-column">
                  <h6>{p.name}</h6>
                  <p>{p.description}</p>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right small text-secondary chevron-icon"><path d="m9 18 6-6-6-6"></path></svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
