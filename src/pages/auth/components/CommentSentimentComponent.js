import React, { useEffect, useRef } from 'react';

export default function CommentSentimentComponent({
  commentsSentiment = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 },
  fetchCommentsSentiment,
  selectedRange,
  platform,
  pageID,
  showSelectedDays,
  showCalendarFilterText
}) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (fetchCommentsSentiment && platform && pageID) {
      if (hasRun.current) return;
      hasRun.current = true;
      const getDataFormDate = selectedRange.startDate
        .toISOString()
        .split('T')[0];
      const getDataToDate = selectedRange.endDate
        .toISOString()
        .split('T')[0];
      fetchCommentsSentiment(platform, pageID, getDataFormDate, getDataToDate);
    }
  }, [selectedRange, platform, pageID, fetchCommentsSentiment]);

  const getDateLabel = () => {
    if (showCalendarFilterText === 'Custom Range') {
      return showSelectedDays || '';
    }
    return showCalendarFilterText || '';
  };

  return (
    <div className="row">
      <div className="my-3">
        <h5>Sentiment Analysis</h5>
      </div>
      {['POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((type, index) => {
        const label = type.charAt(0) + type.slice(1).toLowerCase();
        const imgSrc =
          type === 'POSITIVE'
            ? `${process.env.PUBLIC_URL}/assets/images/analytics-ican/positive.jpg`
            : type === 'NEUTRAL'
            ? `${process.env.PUBLIC_URL}/assets/images/analytics-ican/Neutral.jpg`
            : `${process.env.PUBLIC_URL}/assets/images/analytics-ican/negative.jpg`;

        // percentage from props
        const percent = commentsSentiment?.[type] || 0;

        // Circle math
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = circumference;
        const strokeDashoffset =
          circumference - (percent / 100) * circumference;

        // Color per sentiment
        const strokeColor =
          type === 'POSITIVE'
            ? '#22c55e'
            : type === 'NEUTRAL'
            ? '#6B7280'
            : '#ef4444';

        return (
          <div className="col-md-4 col-lg-4" key={index}>
            <div className="card overflow-hidden analytics-tread-card p-3">
              <div className="card-header card-no-border pb-0 text-center">
                <div className="d-flex flex-column justify-content-center align-items-center gap-3">
                  <div className="comments-progress-circle">
                    <svg className="progress-ring" width="80" height="80">
                      <circle
                        className="progress-ring__background"
                        cx="40"
                        cy="40"
                        r="35"
                        style={{
                          stroke: '#e5e7eb',
                          strokeWidth: 6,
                          fill: 'transparent'
                        }}
                      />
                      <circle
                        className="progress-ring__circle"
                        cx="40"
                        cy="40"
                        r="35"
                        style={{
                          stroke: strokeColor,
                          strokeWidth: 6,
                          strokeDasharray: strokeDasharray,
                          strokeDashoffset: strokeDashoffset,
                          transition: 'stroke-dashoffset 0.8s ease',
                          transform: 'rotate(-90deg)',
                          transformOrigin: '50% 50%',
                          fill: 'transparent'
                        }}
                      />
                    </svg>
                    <div className="progress-text">
                      <img src={imgSrc} alt="" />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="common-align">
                      <h6 className="mb-1 h6-card-heading">{percent}%</h6>
                    </div>
                    <span
                      className="c-o-light mb-1"
                      style={{
                        color: strokeColor,
                        opacity: '8.0',
                        fontWeight: '600'
                      }}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body pt-0">
                <div className="d-flex justify-content-center align-items-center">
                  <p style={{ fontSize: '12px' }}>
                    Comments{' '}
                    <span style={{ textTransform: 'lowercase' }}>
                      {getDateLabel()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
