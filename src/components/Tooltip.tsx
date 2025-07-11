import { uniqueId } from "lodash-es";
import React, { memo } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";

interface TooltipProps {
  id?: string;
  title?: any;
  children: React.ReactNode;
  content?: any;
  className?: string;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "tertiary"
    | "default"
    | "info"
    | "warning"
    | "error"
    | "dark";
  place?:
    | "top"
    | "top-start"
    | "top-end"
    | "right"
    | "right-start"
    | "right-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end";
}

const Tooltip: React.FC<TooltipProps> = ({
  id,
  children,
  content = "",
  title = "",
  className = "",
  color = "dark",
  place = "top-end",
}) => {
  const getColor = () => {
    switch (color) {
      case "primary":
        return "!bg-primary-900 !text-white";
      case "secondary":
        return "!bg-secondary-900 !text-white";
      case "tertiary":
        return "!bg-status-brand !text-white";
      case "success":
        return "!bg-status-success !text-white";
      case "info":
        return "!bg-status-info !text-white border border-tertiary-200";
      case "warning":
        return "!bg-status-warning !text-white";
      case "error":
        return "!bg-status-error !text-white";
      case "dark":
        return "!bg-tertiary-1000 !text-white";
      default:
        return "!bg-white !text-tertiary-700 border border-tertiary-200";
    }
  };

  const tooltipId = id ?? uniqueId("tooltip_");

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        data-tooltip-delay-show={100}
        className="cursor-pointer"
      >
        {children}
      </div>
      <ReactTooltip
        classNameArrow="border-b border-r border-tertiary-200 hidden"
        id={tooltipId}
        place={place}
        className={`!rounded-lg px-4 py-2 !opacity-100 ${getColor()} ${className} z-[1000]`}
      >
        {content || title}
      </ReactTooltip>
    </>
  );
};

export default memo(Tooltip);
