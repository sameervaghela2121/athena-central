import React, { memo } from "react";

import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";

interface DrawerHeaderProps {
  icon?: string; // Object containing paths to the icons
  className?: string;
  onClose?: () => void; // Function to handle closing the drawer
  title: React.ReactNode;
  closeText?: any;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  title = "",
  onClose,
  className = "",
}) => {
  const { translate } = useTranslate();

  return (
    <div className="flex sticky top-0 justify-between items-center p-3 border-b select-none sm:p-6 bg-header">
      <div
        className={`flex justify-between items-center w-full text-base font-bold ${className}`}
      >
        {title}
      </div>
      <div className="flex gap-x-1 shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="flex gap-x-2 items-center text-tertiary-400"
          >
            <div className="hidden sm:block">{translate("common.close")}</div>
            <img src={allImgPaths.closeIcon} alt="close-icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(DrawerHeader);
