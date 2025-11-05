import React, { useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const AvatarWithSkeleton = ({ src, alt, size = 44, className = "" }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div style={{ width: size, height: size, position: "relative" }} className={className}>
            {/* Skeleton */}
            {!loaded && (
                <Skeleton circle width={size} height={size} baseColor="#e0e0e0" highlightColor="#f5f6f7" />
            )}

            {/* Actual Image */}
            <img src={src} alt={alt} onLoad={() => setLoaded(true)}
                onError={(e) => {
                    e.currentTarget.src = `${process.env.PUBLIC_URL}/assets/images/avtar/user.png`;
                    setLoaded(true);
                }}
                style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: loaded ? "block" : "none", }}
            />
        </div>
    );
};

export default AvatarWithSkeleton;
