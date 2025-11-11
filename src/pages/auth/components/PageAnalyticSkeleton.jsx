// src/pages/analytics/ConnectionSkeleton.jsx
import React, { useState, useEffect } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function PageAnalyticSkeleton() {
  const [connectedAccountInfo, setIsConnectedAccountInfo] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfoData = JSON.parse(localStorage.getItem("userinfo"));
        if (userInfoData?.socialData) {
          const connectedAccounts = userInfoData.socialData.filter(
            (account) => account.status === "Connected"
          );
          setIsConnectedAccountInfo(connectedAccounts);

          // Small delay to prevent flickering
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchData();
  }, []);

  // Extract unique connected platforms dynamically
  const connectedPlatforms = [
    ...new Set(
      connectedAccountInfo.map((acc) =>
        acc.social_user_platform?.toLowerCase()
      )
    ),
  ];

  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      <main className="container-fluid py-4">
        {/* Debug: check what platforms are connected */}
        {/* <pre>{JSON.stringify(connectedPlatforms, null, 2)}</pre> */}

        {/* ─── KPI widgets – show only connected platforms ─────────────── */}
        <div className="row">
          {connectedPlatforms.map((platform) => (
            <div key={platform} className="col s-xxl-3 box-col-4">
              <div className="card social-widget widget-hover">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="social-icons">
                        {/* Always skeleton for icon */}
                        <Skeleton circle width={45} height={45} />
                      </div>
                      <span className="text-capitalize"><Skeleton width={100} height={24} /></span>
                    </div>
                    <span className="font-dark f-12">
                      <Skeleton width={20} height={24} />
                    </span>
                  </div>

                  {/* replace ONLY numbers & % with skeletons */}
                  <div className="social-content">
                    {["Views", "Followers", "Impressions"].map((label) => (
                      <div key={label}>
                        <h5 className="mb-1 counter text-center">
                          <Skeleton width={70} height={24} />
                        </h5>
                        <span className="f-light text-center">{label}</span>
                        <p className="text-center mb-0">
                          <i className="feather feather-minus font-dark me-1" />
                        </p>
                        <p className="text-center f-12 font-dark">
                          <Skeleton width={40} height={14} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </SkeletonTheme>
  );
}
