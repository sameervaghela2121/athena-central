import React from "react";

interface Props extends React.AllHTMLAttributes<HTMLButtonElement> {
  children?: any;
  count?: any;
  src: string;
  isVisible?: boolean;
  className?: string;
  type?: "submit" | "button";
}

const IconButton = ({
  children,
  src,
  isVisible = true,
  className,
  type = "button",
  count = null,
  ...rest
}: Props) => {
  return (
    <>
      {isVisible && (
        <button
          {...rest}
          type={type}
          className={`flex relative justify-center items-center p-2 rounded-full duration-200 cursor-pointer outline-none bg-tertiary-100/70 hover:bg-secondary-200 disabled:bg-tertiary-200/20 ${className}`}
        >
          {children}
          <img src={src} alt="icon-button" />
          {count > 0 && (
            <div className="flex absolute -right-2 -top-3 justify-center items-center p-1 w-5 h-5 text-xs text-white rounded-full shadow-md bg-primary-900">
              {count}
            </div>
          )}
        </button>
      )}
    </>
  );
};

export default React.memo(IconButton);
