import React, { useEffect, useState } from "react";

const PlatformStepLoader = ({ platform, steps, onComplete }) => {
  console.log("Platform",platform);
  console.log("steps",steps);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [allDone, setAllDone] = useState(false);

  const platforms = {
    facebook: {
      name: "Facebook",
      gradient: "linear-gradient(to right, rgb(37,99,235), rgb(30,64,175))",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
      ),
    },
    linkedin: {
      name: "LinkedIn",
      gradient: "linear-gradient(to right, rgb(59,130,246), rgb(29,78,216))",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect width="4" height="12" x="2" y="9"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      ),
    },
  };

  const current = platforms?.[platform?.toLowerCase()] || platforms.facebook;

  useEffect(() => {
    let timer;
    const runStepsSequentially = async () => {
      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => {
          timer = setTimeout(() => {
            setCompletedSteps((prev) => [...prev, i]);
            resolve();
          }, 1500); // each step takes ~1.5s
        });
      }
      setAllDone(true);
      if (onComplete) onComplete();
    };
    runStepsSequentially();
    return () => clearTimeout(timer);
  }, [steps, onComplete]);

  return (
    <div className="row justify-content-center mt-4">
      <div className="col-md-12">
        <div className="card shadow-sm">
          <div className="card-header border-0 pb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-2 align-items-center">
                <div className="p-2 rounded-3 d-inline-flex align-items-center justify-content-center" style={{ background: current.gradient }} >
                  {current.icon}
                </div>
                <h5 className="mb-0 h5-heading">
                  {current.name} Connected Successfully!
                </h5>
              </div>
            </div>
            <p className="my-2 text-success fw-semibold">
              Your {current.name} account is now connected and we’re fetching your data.
            </p>
          </div>

          <div className="card-body text-center">
            {!allDone ? (
              <div className="mb-3">
                <div className="spinner-border text-success" style={{ width: "2.5rem", height: "2.5rem" }} ></div>
              </div>
            ) : (
              <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                   style={{ background: "rgb(34 218 101 / 21%)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="text-success">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 11.917L9.724 16.5 19 7.5"/>
                </svg>
              </div>
            )}

            <h6 className="fw-semibold mt-2 mb-4">
              {allDone ? "All steps completed!" : "We are fetching your data..."}
            </h6>

            <div className="d-flex flex-column align-items-center gap-3">
              {steps.map((step, idx) => (
                <div key={idx} className="d-flex align-items-center gap-2">
                  {completedSteps.includes(idx) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-success">
                      <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324 a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083 l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z"/>
                    </svg>
                  ) : (
                    <div className="spinner-border spinner-border-sm text-success" role="status" ></div>
                  )}
                  <span className={`fw-medium ${completedSteps.includes(idx) ? "text-success" : "text-secondary"}`} >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {allDone && (
              <div className="mt-4">
                <p className="m-0">Redirecting to dashboard automatically...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformStepLoader;
