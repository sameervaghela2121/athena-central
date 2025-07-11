import allImgPaths from "@/assets";
import classNames from "classnames";
import React from "react";

type AlertType = "info" | "warning" | "error" | "success" | "secondary";

interface AlertBannerProps {
  type: AlertType;
  message: string;
  iconSrc?: string; // Optional
  onClose?: () => void;
  className?: string;
  actionButton?: React.ReactNode;
}

const defaultIcons: Record<AlertType, string> = {
  warning: allImgPaths.warningIcon,
  error: allImgPaths.billingCreditErrorIcon,
  success: allImgPaths.successIcon,
  secondary: allImgPaths.billingCreditIcon,
  info: allImgPaths.infoBlue || allImgPaths.warningIcon, // fallback to warning if infoIcon not available
};

const alertStyles: Record<
  AlertType,
  {
    bg: string;
    border: string;
    text: string;
  }
> = {
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
  },
  error: {
    bg: "bg-status-error/10",
    border: "border-status-error",
    text: "text-status-error",
  },
  success: {
    bg: "bg-status-success/10",
    border: "border-status-success",
    text: "text-status-success",
  },
  secondary: {
    bg: "bg-secondary-200",
    border: "border-secondary-900",
    text: "text-primary-900",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
  },
};

const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  message,
  iconSrc,
  onClose,
  className = "",
  actionButton,
}) => {
  const { bg, border, text } = alertStyles[type];
  const finalIcon = iconSrc || defaultIcons[type];

  return (
    <div
      className={classNames(
        "flex gap-4 justify-between items-center px-2 py-2 pl-4 w-full rounded-full border select-none",
        bg,
        border,
        className,
      )}
    >
      <div className="flex gap-6 items-center">
        <div className="flex gap-2 items-center">
          <img src={finalIcon} alt="" className="w-6 h-6" />
          <span className={classNames(text)}>{message}</span>
        </div>
        {actionButton && <div>{actionButton}</div>}
      </div>
      <div className="flex items-center">
        {onClose && (
          <button className="text-gray-600" onClick={onClose}>
            <img src={allImgPaths.closeIcon} alt="" className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
