// src/pages/facebook/LinkedinDetailSkeleton.jsx
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function LinkedinDetailSkeleton({activeTab}) {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6"> 
      {activeTab === "Summary" && (
        <>
          <div className="row d-flex flex-wrap align-items-stretch my-3">
            {[
              "Followers",
              "New Followers",
              "Impressions",
              "Views",
              "Reach",
              "Likes",
            ].map((label) => (
              <div key={label} className="col-sm-12 col-md-6 col-xl-4 my-1">
                <div className="card social-widget widget-hover">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">
                      {/* icon + label unchanged */}
                      <div className="d-flex align-items-center gap-2">
                        <div className="social-icons analytics-tread bg-light-primary">
                          {/* keep same <img> srcs as live component */}
                          <img
                            src={`${
                              process.env.PUBLIC_URL
                            }/assets/images/analytics-ican/${label
                              .toLowerCase()
                              .replace(/\s/g, "-")}.png`}
                            alt=""
                          />
                        </div>
                        <div className="ms-3">
                          <span>{label}</span>
                          {/* numeric value skeletonised */}
                          <h5 className="mb-1">
                            <Skeleton width={80} height={28} />
                          </h5>
                        </div>
                      </div>
                      {/* circular progress ring value skeletonised */}
                      <div className="text-end mt-2">
                        <div
                          className="circular-progress"
                          style={{
                            "--progress": "100%",
                            "--size": "60px",
                            "--thickness": "6px",
                          }}
                        >
                          <div className="progress-value">
                            <Skeleton width={50} height={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="f-light my-3">
                      Total {label.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>      
          <div className="row">
            <div className="col-md-12">
              <div className="card sales-report">
                <div className="card-header card-no-border">
                  <div className="header-top">
                    <h5>Social Analytics</h5>
                  </div>
                </div>
                <div className="card-body pt-0 analytics-data">
                  <ul className="balance-data">
                    {/* legend bullets unchanged */}
                    {["View", "Followers", "Impressions", "Reach", "Likes"].map(
                      (t, i) => (
                        <li key={i}>
                          <span
                            className={`circle ${
                              [
                                "bg-primary",
                                "bg-secondary",
                                "bg-success",
                                "bg-dark",
                                "bg-danger",
                              ][i]
                            }`}
                          ></span>
                          <span className="c-light ms-1">{t}</span>
                        </li>
                      )
                    )}
                  </ul>
                  {/* reserve the ApexChart area */}
                  <Skeleton height={350} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "Post" && (
        <>
          <div className="row d-flex flex-wrap align-items-stretch my-3">
            {[
              "Published Post",
              "Scheduled Post",
              "Draft Post",
            ].map((label) => (
              <div key={label} className="col-sm-12 col-md-6 col-xl-4 my-1">
                <div className="card social-widget widget-hover">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">                      
                      <div className="d-flex align-items-center gap-2">
                        <div className="social-icons analytics-tread bg-light-primary">                          
                          <img
                            src={`${
                              process.env.PUBLIC_URL
                            }/assets/images/analytics-ican/${label
                              .toLowerCase()
                              .replace(/\s/g, "-")}.png`}
                            alt=""
                          />
                        </div>
                        <div className="ms-3">
                          <span>{label}</span>                          
                          <h5 className="mb-1">
                            <Skeleton width={80} height={28} />
                          </h5>
                        </div>
                      </div>
                      {/* circular progress ring value skeletonised */}
                      <div className="text-end mt-2">
                        <div
                          className="circular-progress"
                          style={{
                            "--progress": "100%",
                            "--size": "60px",
                            "--thickness": "6px",
                          }}
                        >
                          <div className="progress-value">
                            <Skeleton width={50} height={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="f-light my-3">
                      Total {label.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row d-flex flex-wrap align-items-stretch my-3">
            {[
              "Published",
              "Scheduled",
              "Draft",
            ].map((label) => (
              <div key={label} className="col-sm-12 col-md-6 col-xl-4 my-1">
                <div className="card social-widget widget-hover">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between">                      
                      <div className="d-flex align-items-center gap-2">
                        <div className="social-icons analytics-tread bg-light-primary">                          
                          <img
                            src={`${
                              process.env.PUBLIC_URL
                            }/assets/images/analytics-ican/${label
                              .toLowerCase()
                              .replace(/\s/g, "-")}.png`}
                            alt=""
                          />
                        </div>
                        <div className="ms-3">
                          <span>{label}</span>                          
                          <h5 className="mb-1">
                            <Skeleton width={80} height={28} />
                          </h5>
                        </div>
                      </div>
                      {/* circular progress ring value skeletonised */}
                      <div className="text-end mt-2">
                        <div
                          className="circular-progress"
                          style={{
                            "--progress": "100%",
                            "--size": "60px",
                            "--thickness": "6px",
                          }}
                        >
                          <div className="progress-value">
                            <Skeleton width={50} height={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="f-light my-3">
                      Total {label.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>          
        </>
      )}
  
      {activeTab === "Comments" && (
        <>
          <div className="row d-flex flex-wrap align-items-stretch my-3">
            {[
              { label: "Positive", color: "text-success" },
              { label: "Neutral", color: "text-secondary" },
              { label: "Negative", color: "text-danger" },
            ].map(({ label, color }) => (
              <div key={label} className="col-sm-12 col-md-6 col-xl-4 my-1">
                <div className="card social-widget widget-hover text-center">
                  <div className="card-body d-flex flex-column align-items-center justify-content-center">
                    {/* emoji circle */}
                    <div className="mb-3">
                      <div
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                        style={{
                          width: "60px",
                          height: "60px",
                          border: "3px solid #e5e7eb",
                        }}
                      >
                        <Skeleton circle width={32} height={32} />
                      </div>
                    </div>

                    {/* percentage */}
                    <h4 className={`fw-bold ${color}`}>
                      <Skeleton width={50} height={28} />
                    </h4>

                    {/* label */}
                    <p className={`mb-2 fw-semibold ${color}`}>{label}</p>

                    {/* sub text */}
                    <span className="f-light mb-1">Comments</span>
                    <p className="text-muted small mb-0">
                      <Skeleton width={180} height={14} />
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
  
      {activeTab === "Calendar" && (
        <>
        <div className="card p-3 my-3">
          <div className="card-body">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-semibold">
                <Skeleton width={140} height={24} />
              </h5>
              <div className="d-flex align-items-center gap-2">
                <Skeleton width={60} height={32} /> {/* Today */}
                <Skeleton width={60} height={32} /> {/* Back */}
                <Skeleton width={60} height={32} /> {/* Next */}
              </div>
            </div>

            {/* Month & View Mode */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-semibold">
                <Skeleton width={120} height={20} /> {/* October 2025 */}
              </h6>
              <div className="d-flex align-items-center gap-2">
                <Skeleton width={70} height={28} /> {/* Month */}
                <Skeleton width={70} height={28} /> {/* Agenda */}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-skeleton-grid">
              {[...Array(35)].map((_, i) => (
                <div
                  key={i}
                  className="calendar-skeleton-cell mb-2"
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Skeleton height="100%" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <style jsx>{`
          .calendar-skeleton-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
          }
        `}</style>
      </>
    )}

    </SkeletonTheme>
  );
}
