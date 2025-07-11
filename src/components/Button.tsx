import React from "react";

interface Props extends React.AllHTMLAttributes<HTMLButtonElement> {
  children: any;
  className?: string;
  type?: "submit" | "button" | "reset";
  variant?: "contained" | "outlined" | "text";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning"
    | "pagination";
  leftIcon?: string | null; // New prop for icon position;
  rightIcon?: string | null; // New prop for icon position;
}

const Button: React.FC<Props> = ({
  children,
  variant = "contained",
  color = "primary",
  className = "",
  type = "button",
  leftIcon = null,
  rightIcon = null,
  ...rest
}) => {
  const getColor = () => {
    switch (color) {
      case "primary":
        return "bg-primary-900 text-white";
      case "secondary":
        return "bg-secondary-200 text-primary-900";
      case "pagination":
        return "bg-primary-900";
      default:
        return "";
    }
  };

  const getTextColor = () => {
    switch (color) {
      case "primary":
        return "border-indigo-600";
      case "secondary":
        return "!text-slate-500 hover:!text-white/90 border-slate-500 hover:border-transparent focus-visible:outline-indigo-600";
      default:
        return "";
    }
  };

  const getVariant = () => {
    switch (variant) {
      case "contained":
        return "";
      case "outlined":
        return `bg-transparent border ${getTextColor()}`;
      case "text":
        return `bg-transparent ${getTextColor()} hover:opacity-60 shadow-none`;
      default:
        return "";
    }
  };

  return (
    <button
      type={type}
      className={`outline-none text-lg font-medium flex items-center justify-center gap-x-2 py-2 px-4 rounded-[56px] ${getColor()} ${getVariant()}  disabled:opacity-70  ${className} `}
      {...rest}
    >
      {leftIcon && <img src={leftIcon} className="mr-2" />}
      {children}
      {rightIcon && <img src={rightIcon} className="" />}{" "}
    </button>
  );
};

export default Button;
