import React from "react";

interface Props extends React.AllHTMLAttributes<HTMLButtonElement> {
  imageSrc?: string; // Image source URL
  altText?: string; // Alt text for the image
  className?: string;
  type?: "submit" | "button" | "reset";
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  size?: number; // Size of the image button (width and height in pixels)
  children: any;
}

const ImageButton: React.FC<Props> = ({
  children,
  imageSrc,
  altText = "image button",
  variant = "contained",
  color = "primary",
  className = "",
  type = "button",
  size = 40, // Default size is 40x40 pixels
  ...rest
}) => {
  const getColor = () => {
    switch (color) {
      case "primary":
        return "bg-sky-600 focus-visible:outline-indigo-600";
      case "secondary":
        return "bg-slate-500 hover:bg-slate-500/90 focus-visible:outline-indigo-600";
      case "success":
        return "bg-green-600 hover:bg-green-600/90 focus-visible:outline-green-600";
      case "error":
        return "bg-red-600 hover:bg-red-600/90 focus-visible:outline-red-600";
      case "info":
        return "bg-sky-600 hover:bg-sky-600/90 focus-visible:outline-sky-600";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-600/90 focus-visible:outline-yellow-600";
      default:
        return "";
    }
  };

  const getTextColor = () => {
    switch (color) {
      case "primary":
        return "!text-indigo-600 hover:!text-white/90 border-indigo-600 hover:border-transparent focus-visible:outline-indigo-600";
      case "secondary":
        return "!text-slate-500 hover:!text-white/90 border-slate-500 hover:border-transparent focus-visible:outline-indigo-600";
      case "success":
        return "!text-green-600 hover:!text-white/90 border-green-600 hover:border-transparent focus-visible:outline-green-600";
      case "error":
        return "!text-red-600 hover:!text-white/90 border-red-600 hover:border-transparent focus-visible:outline-red-600";
      case "info":
        return "!text-sky-600 hover:!text-white/90 border-sky-600 hover:border-transparent focus-visible:outline-sky-600";
      case "warning":
        return "!text-yellow-600 hover:!text-white/90 border-yellow-600 hover:border-transparent focus-visible:outline-yellow-600";
      default:
        return "";
    }
  };

  const getVariant = () => {
    switch (variant) {
      case "contained":
        return "border-none hover:text-white/90";
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
      className={`${className} flex justify-center items-center rounded-full overflow-hidden p-0 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 capitalize duration-300 transition-all ${getColor()} ${getVariant()}`}
      style={{ width: size, height: size }} // Set the size of the button
      {...rest}
    >
      {/* <img
        src={imageSrc}
        alt={altText}
        className="object-cover w-full h-full"
      /> */}
      {children}
    </button>
  );
};

export default React.memo(ImageButton);
