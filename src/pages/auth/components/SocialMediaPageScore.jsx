import React, { useState } from 'react';

export default function SocialScoreComponent({ socialScores }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.ceil(socialScores?.score) / 100;

    const PerformanceInsights = ({ data }) => {
        if (!data || !data.recommendations) {
            return (
                <div>
                    <h6 className="fw-semibold mb-3">Performance Insights</h6>
                    <p className="text-muted small">No performance insights available.</p>
                </div>
            );
        }

        let recommendations;
        try {
            recommendations = JSON.parse(data.recommendations);
        } catch (err) {
            console.error("Invalid recommendations JSON:", err);
            return (
                <div>
                    <h6 className="fw-semibold mb-3">Performance Insights</h6>
                    <p className="text-danger small">Error loading recommendations.</p>
                </div>
            );
        }

        const insights = [
            ...(recommendations.needs_improvement || []).map((text) => ({
                type: "needs_improvement",
                icon: "arrow-down",
                color: "rgba(255, 99, 71, 1)",
                bg: "rgba(255, 99, 71, 0.1)",
                text,
            })),
            ...(recommendations.good_performance || []).map((text) => ({
                type: "good_performance",
                icon: "trending-up",
                color: "rgba(101, 193, 92, 1)",
                bg: "rgba(101, 193, 92, 0.1)",
                text,
            })),
            {
                type: "overall",
                icon: "sparkles",
                color: "rgba(64, 184, 245, 1)",
                bg: "rgba(64, 184, 245, 0.1)",
                text: recommendations.overall,
            },
        ];

        return (
            <div>
                <h6 className="fw-semibold mb-3">Performance Insights</h6>
                {insights.map((item, index) => (
                    <div key={index} className="d-flex align-items-center rounded py-2 mb-3"
                        style={{
                            backgroundColor: item.bg,
                            color: item.color,
                            borderColor: item.color,
                        }}
                    >
                        <div className="px-2">
                            {item.icon === "arrow-down" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down h-4 w-4">
                                    <path d="M12 5v14M5 12l7 7 7-7" />
                                </svg>
                            )}
                            {item.icon === "trending-up" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    className="lucide lucide-trending-up h-4 w-4">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                    <polyline points="16 7 22 7 22 13" />
                                </svg>
                            )}
                            {item.icon === "sparkles" && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-4 w-4">
                                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                    <path d="M20 3v4" />
                                    <path d="M22 5h-4" />
                                    <path d="M4 17v2" />
                                    <path d="M5 18H3" />
                                </svg>
                            )}
                        </div>
                        <small>{item.text}</small>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="card shadow-sm h-100 border-0 rounded-3 w-100">
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <div className="w-100">
                        <h5 className="card-title mb-1 d-flex align-items-center fw-semibold text-dark">
                            <div className="">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="me-2 text-primary">
                                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                                    <polyline points="16 7 22 7 22 13"></polyline>
                                </svg>
                            </div>
                            <span>Social Performance Score</span>
                        </h5>
                        <small className="text-muted">Monitor your overall social media performance</small>
                    </div>
                </div>

                <div className='social-performance-responsive'>
                    {/* Circular Score */}
                    <div className="d-flex justify-content-center my-4">
                        <div className="position-relative" style={{ width: "150px", height: "150px" }}>
                            <svg className="w-100 h-100 position-absolute top-0 start-0" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="50" cy="50" r="40" stroke="#e9ecef" stroke-width="8" fill="none"></circle>
                                <circle cx="50" cy="50" r="40" stroke="#32cd32" stroke-width="8" fill="none" strokeDasharray={`${(progress * circumference).toFixed(0)} ${circumference.toFixed(2)}`}></circle>
                                {/* <circle cx="50" cy="50" r="40" stroke="#32cd32" stroke-width="8" fill="none" stroke-dasharray="213.35 251"></circle> */}
                            </svg>
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="h2 fw-bold text-dark">{Math.ceil(socialScores?.score)}</div>
                                <div className="small text-muted">Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-sm-6">
                            <div className="p-3 rounded d-flex align-items-center shadow ">
                                <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #3b82f6, #8b5cf6)" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users h-5 w-5 text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <div>
                                    <div className="fw-semibold">{socialScores?.follower_growth_percent > 0 ? `+${socialScores?.follower_growth_percent}` : `${socialScores?.follower_growth_percent}`}%</div>
                                    {/* <div className="fw-semibold">+12.5%</div> */}
                                    <small className="text-muted">Follower Growth</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6">
                            <div className="p-3 rounded d-flex align-items-center shadow ">
                                <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #22c55e, #14b8a6)" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart h-5 w-5 text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                                </div>
                                <div>
                                    <div className="fw-semibold">{socialScores?.engagement > 0 ? `+${socialScores?.engagement}` : `${socialScores?.engagement}`}%</div>
                                    {/* <div className="fw-semibold">8.7%</div> */}
                                    <small className="text-muted">Engagement Rate</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6">
                            <div className="p-3 rounded d-flex align-items-center shadow ">
                                <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #a855f7, #ec4899)" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share2 h-5 w-5 text-white"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
                                </div>
                                <div>
                                    <div className="fw-semibold">{socialScores?.shares > 0 ? `${socialScores?.shares}` : `${socialScores?.shares}`}</div>
                                    {/* <div className="fw-semibold">234</div> */}
                                    <small className="text-muted">Shares This Week</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-sm-6">
                            <div className="p-3 rounded d-flex align-items-center shadow ">
                                <div className="d-flex p-2 rounded-4 me-2" style={{ background: "linear-gradient(to right, #f97316, #ef4444)" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye h-5 w-5 text-white"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </div>
                                <div>
                                    <div className="fw-semibold">{socialScores?.reach > 0 ? `${socialScores?.reach}` : `${socialScores?.reach}`}</div>
                                    {/* <div className="fw-semibold">45.2K</div> */}
                                    <small className="text-muted">Total Social Reach</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Insights */}
                {socialScores ? (
                    <PerformanceInsights data={socialScores} />
                ) : (
                    <p className="text-muted small">Loading performance insights...</p>
                )}
            </div>
        </div>
    )
}