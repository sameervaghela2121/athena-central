import classNames from "classnames";
import React from "react";

interface ButtonProps extends React.AllHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  type?: "submit" | "button" | "reset";
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "text"
    | "tertiaryDark"
    | "error";
  loading?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isVisible?: boolean;
  leftIcon?: string | null; // New prop for icon position;
  rightIcon?: string | null; // New prop for icon position;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isVisible = true,
  className = "",
  loading = false,
  children,
  onClick,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  type = "button",
}) => {
  const baseClasses =
    "whitespace-nowrap  w-fit button relative overflow-hidden ease-in-out select-none flex items-center justify-center rounded-[56px] py-3 px-3 md:px-5 transition-all duration-500 font-medium text-base";

  const responsiveClasses = "sm:text-base";

  const variantClasses = {
    primary:
      "bg-primary-900 text-white hover:bg-secondary-900 !disabled:text-tertiary-400 disabled:bg-tertiary-500",
    secondary:
      "bg-secondary-900 text-white hover:bg-primary-900 !disabled:text-tertiary-400 disabled:bg-tertiary-500",
    tertiary:
      "!bg-transparent border border-blue-400 text-secondary-900 hover:text-primary-900 hover:border-primary-900 disabled:border-tertiary-800 disabled:text-tertiary-700",
    tertiaryDark:
      "!bg-transparent border border-tertiary-800 text-tertiary-800 disabled:border-tertiary-800 disabled:text-tertiary-700",
    text: "text-status-info hover:underline !p-0",
    error:
      "bg-status-error text-white hover:bg-status-error/80 !disabled:text-white disabled:bg-status-error/50",
  };

  const color = {
    primary: "#ffffff",
    secondary: "#ffffff",
    tertiary: "#007BFF",
    tertiaryDark: "#474747",
    text: "#007BFF",
    error: "#e5484d",
  };

  const loadingIcon = (
    <svg
      className="w-5 h-5 text-white animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color[variant]}
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill={color[variant]}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
  );

  return (
    <>
      {isVisible && (
        <button
          type={type}
          className={classNames(
            className,
            baseClasses,
            responsiveClasses,
            variantClasses[variant],
            { "opacity-50 cursor-not-allowed": disabled },
            "",
          )}
          onClick={(e) => {
            if (!disabled && onClick) onClick(e);
          }}
          disabled={disabled}
        >
          <div className="flex gap-x-2 items-center">
            {loading ? loadingIcon : null}
            {leftIcon && (
              <img className="w-4 h-4 sm:h-auto sm:w-auto" src={leftIcon} />
            )}
            {/* <span className="button-content"> {children}</span> */}
            <span className="flex button-content"> {children}</span>
            {/* {rightIcon && <img src={rightIcon} />} */}
          </div>
        </button>
      )}
    </>
  );
};

export default React.memo(Button);
