import React from "react";

type DividerProps = {
  label?: any;
  className?: string;
};

const Divider: React.FC<DividerProps> = ({ label, className = "" }) => {
  return (
    <div className={`flex items-center h-0 ${className}`}>
      <div className="flex-grow border-t border-tertiary-50"></div>
      {label && <span className="mx-4 text-gray-500 select-none">{label}</span>}
      <div className="flex-grow border-t border-tertiary-50"></div>
    </div>
  );
};

export default React.memo(Divider);
