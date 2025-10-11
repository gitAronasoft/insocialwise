import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PostPreviewRendererMultiple from './PostPreviewRendererMultiple';

const HoverPostPreview = ({ post, platform, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState(null);
  const ref = useRef(null);
  const timer = useRef(null);

  const showTooltip = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const tooltipWidth = 350;
      const tooltipHeight = 500;

      let top = rect.top + window.scrollY - 200;
      let left = rect.right + window.scrollX + 15;

      // 👇 Check if event is inside the calendar popup
      const insideCalendarPopup = !!ref.current.closest('.rbc-overlay');

      if (insideCalendarPopup) {
        const overlayRect = ref.current.closest('.rbc-overlay').getBoundingClientRect();
        top = rect.top - overlayRect.top - 20; // position relative to popup
        left = rect.left - overlayRect.left + rect.width + 10;

        // Prevent overflow inside the popup
        if (left + tooltipWidth > overlayRect.width) {
          left = rect.left - overlayRect.left - tooltipWidth - 10;
        }

        if (top < 0) {
          top = rect.bottom - overlayRect.top + 10;
        }
      } else {
        // Global fallback (for non-popup usage)
        if (left + tooltipWidth > window.innerWidth) {
          left = rect.left + window.scrollX - tooltipWidth - 15;
        }

        if (top < 0) {
          top = rect.bottom + window.scrollY + 15;
        }
      }

      setTooltipPos({ top, left });
    }

    clearTimeout(timer.current);
    setIsHovered(true);
  };

  const hideTooltip = () => {
    timer.current = setTimeout(() => setIsHovered(false), 100);
  };

  const cancelHide = () => {
    clearTimeout(timer.current);
    setIsHovered(true);
  };

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  return (
    <>
      <div ref={ref} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} style={{ cursor: 'pointer' }}>
        {children}
      </div>
      {isHovered && tooltipPos && ReactDOM.createPortal(
        <div
          onMouseEnter={cancelHide}
          onMouseLeave={hideTooltip}
          style={{
            position: 'absolute',
            top: tooltipPos.top,
            left: tooltipPos.left,
            zIndex: 9999,
            backgroundColor: 'white',
            boxShadow: '0 0 12px rgba(0,0,0,0.15)',
            borderRadius: '10px',
            width: 350,
            maxHeight: 500,
            overflow: 'hidden',
            pointerEvents: 'auto', // ✅ Important to allow clicks
          }}
        >
          <PostPreviewRendererMultiple platform={platform} post={post} />
        </div>,
        document.querySelector('.rbc-overlay') || document.body
      )}
    </>
  );
};

export default HoverPostPreview;
