// src/pages/facebook/LinkedinDetailSkeleton.jsx
import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function LinkedinDetailSkeleton() {
  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
      {/* ⬇︎ — keep header/toolbar exactly as in live page — */}

      {/* PAGE HEADER */}
      <div className="row" style={{ marginTop: "30px" }}>
        <div className="col-md-5">
          <div className="d-flex gap-3 align-items-center">
            <div className="linkedin-ican" style={{ backgroundImage: "linear-gradient(to right, #2563eb, #1e40af)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </div>
            <div className='d-flex flex-column'>  
              <h1 className='h1-heading'>LinkedIn Summary</h1> 
              <div> <p className='pb-0 mb-0' style={{ fontSize: "16px" }}> Detailed analytics and performance insights </p></div>
            </div>
          </div>
        </div>
        {/* page‑picker + date‑range controls → numbers stay real, so no skeleton here */}
      </div>

      {/* KPI CARDS (followers, impressions, etc.) */}
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

      {/* SOCIAL‑ANALYTICS CHART */}
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
    </SkeletonTheme>
  );
}
