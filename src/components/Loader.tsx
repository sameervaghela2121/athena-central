import React from "react";

const Loader = ({
  count = 5,
  height = 20,
  width = "100%",
  className = "",
}: {
  count?: number;
  height?: number;
  width?: number | string;
  className?: string;
}) => {
  return (
    <div role="status" className="w-full animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`w-6 h-2 rounded-full bg-header ${className}`}
          style={{ height, width }}
        ></div>
      ))}
    </div>
  );
};

export default React.memo(Loader);
