import React, { memo } from "react";

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

const DrawerFooter: React.FC<DrawerFooterProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`w-full flex gap-x-4 items-center py-4 px-6 border-t rounded-t-2xl select-none bg-header ${className}`}
    >
      {children}
    </div>
  );
};

export default memo(DrawerFooter);
