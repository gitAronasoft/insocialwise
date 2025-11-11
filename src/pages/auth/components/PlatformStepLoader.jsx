import React, { useEffect, useState } from "react";

const PlatformStepLoader = ({ platform = "Facebook", steps = [], onComplete }) => {
  const [completed, setCompleted] = useState(0);
  const [finished, setFinished] = useState(false);

  const platformDetails = {
    Facebook: { 
      name: "Facebook", 
      description: "Connect your Facebook page", 
      bgClass: "facebook-connect-img",
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook h-6 w-6 text-white">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    LinkedIn: { 
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
    Instagram: { 
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
  };

  const stepColoursClass = ["blue", "purple", "red", "orange"];

  const { bgClass, svg } = platformDetails[platform] || platformDetails.Facebook;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setCompleted((prev) => prev + 1);
      i++;
      if (i === steps.length) {
        clearInterval(timer);
        setFinished(true);
        setTimeout(() => onComplete?.(), 1500);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [steps, onComplete]);

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-opacity-75"
      style={{ zIndex: 99, background: "transparent", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)"}}
    >
      <div className="card shadow-lg border-0" style={{ width: "400px", borderRadius: "14px" }}>
        {/* Header */}
        <div className={`d-flex align-items-center justify-content-between pb-1`} style={{padding: "15px"}}>
          <div className="d-flex flex-column">
            <div className="d-flex justify-content-between w-100">
              <div className="d-flex align-items-center">
                <div className={`${bgClass} p-2 rounded-3 d-flex align-items-center justify-content-center`}>
                  {svg}
                </div>
                <div className="px-2">
                  <h6 className="mb-0 fw-semibold" style={{fontSize:"14px"}}>{platform} Connected Successfully!</h6>
                </div>
              </div>
              <button className="btn btn-sm btn-light text-dark rounded-circle p-1 px-2" onClick={() => onComplete?.()} >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div>
              <small className="text-success">Your {platform} account is now connected and we're fetching your data.</small>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="card-body text-center pt-1">
          <div className="mb-1">
            <div className={`rounded-circle bg-opacity-10 d-inline-flex align-items-center justify-content-center`} style={{ width: "60px", height: "60px" }} >
              {/* {finished ? ( */}
                <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center"
                    style={{ background: "rgb(34 218 101 / 21%)" }} >
                  <svg className="w-6 h-6 text-gray-800 dark:text-white text-success" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5" />
                  </svg>
                </div>
              {/* ) : (
                <div className={`spinner-border`} role="status"></div>
              )} */}
            </div>
          </div>

          <h6 className="fw-bold mb-2">Account Connected</h6>
          <p className="text-muted small mb-3">
            {finished
              ? `We have finished syncing your ${platform} data.`
              : `We are now fetching your ${platform} data including:`}
          </p>

          <div className="text-start mb-1">
            {steps.map((step, idx) => (
              <div key={idx} className={`d-flex align-items-center gap-2 mb-1 alert-${stepColoursClass[idx % stepColoursClass.length]}`}
                  style={{padding: "10px", borderRadius: "8px"}}>
                {completed > idx ? (
                  // <i class="fa-solid fa-circle-check text-success"></i>
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-circle-check text-success mt-1"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z"></path></svg>
                  </div>
                ) : (
                  <div className="spinner-border spinner-border-sm" role="status"></div>
                )}
                <div><span> {step} </span></div>
              </div>
            ))}

            <div className="text-center mt-3">
              {/* {finished ? <div></div> : <div className={`spinner-border`} role="status"></div>} */}
              <small className="text-muted">
                {Math.min(completed, steps.length)} / {steps.length} completed
              </small>
            </div>
          </div>

          <div className="text-muted small">
            Redirecting to dashboard automatically...
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformStepLoader;
