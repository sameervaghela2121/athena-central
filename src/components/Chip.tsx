import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: any;
  variant?: "contained" | "outlined" | "text";
  color?:
    | "primary"
    | "PROCESSING"
    | "FAILED"
    | "secondary"
    | "tertiary"
    | "LOW"
    | "HIGH"
    | "MEDIUM"
    | "warning"
    | "PUBLISHED"
    | "DRAFT"
    | "ERROR"
    | "OPEN"
    | "IGNORED"
    | "CLOSED"
    | "PAID";

  className?: string;
  onClick?: () => void;
}

const Chip: React.FC<Props> = ({
  text,
  variant = "",
  color = "tertiary",
  className = "",
  onClick = () => {},
}) => {
  const getColor = () => {
    switch (color) {
      case "primary":
        return "bg-primary-900 text-white hover:bg-primary-900/90 focus-visible:outline-primary-900";
      case "secondary":
      case "PROCESSING":
        return "bg-secondary-900 text-white hover:bg-secondary-900/90 focus-visible:outline-primary-900";
      case "LOW":
      case "PAID":
      case "PUBLISHED":
        return "bg-[#DFFFE6] rounded-md";
      case "HIGH":
      case "FAILED":
        return "bg-[#FFDDE0] rounded-md";
      case "MEDIUM":
      case "DRAFT":
      case "warning":
        return "bg-[#FEF1CA] rounded-md";
      case "tertiary":
        return "rounded-md border-tertiary-400";
      case "OPEN":
        return "rounded-md border-blue-500 text-white bg-blue-500";
      case "IGNORED":
        return "rounded-md border-red-500 text-white bg-red-500";
      case "CLOSED":
        return "rounded-md border-gray-500 text-white bg-gray-500";

      default:
        return "";
    }
  };

  const getTextColor = () => {
    switch (color) {
      case "primary":
        return "text-indigo-600 border-indigo-600 hover:border-transparent focus-visible:outline-indigo-600";
      case "secondary":
      case "PROCESSING":
        return "text-slate-500 border-slate-500 hover:border-transparent focus-visible:outline-indigo-600";
      case "LOW":
      case "PUBLISHED":
        return "text-[#28A745]";
      case "HIGH":
      case "FAILED":
        return "text-[#DC3545]";
      case "MEDIUM":
      case "DRAFT":
      case "warning":
        return "text-[#F6B900]";
      case "tertiary":
        return "border text-tertiary-400";
      default:
        return "";
    }
  };
  const getVariant = () => {
    switch (variant) {
      case "contained":
        return `border-none`;
      case "outlined":
        return `bg-transparent border hover:text-white/90 ${getTextColor()}`;
      case "text":
        return `bg-transparent ${getTextColor()} hover:bg-transparent hover:opacity-60 shadow-none`;
      default:
        return "";
    }
  };
  return (
    <button
      onClick={onClick}
      className={`flex justify-center px-3 py-1 text-sm font-semibold duration-150 cursor-default outline-none ${getColor()} ${getTextColor()} ${getVariant()} ${className}`}
    >
      {text}
    </button>
  );
};

export default React.memo(Chip);
