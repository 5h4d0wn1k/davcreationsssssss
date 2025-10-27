"use client";

import React from "react";

interface SkeletonLoaderProps {
  className?: string;
  rows?: number;
  showAvatar?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = "",
  rows = 5,
  showAvatar = false,
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 py-4">
          {showAvatar && (
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-300 rounded"></div>
            <div className="h-8 w-8 bg-gray-300 rounded"></div>
            <div className="h-8 w-8 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;