import allImgPaths from "@/assets";
import DotBackground from "@/components/DotBackground";
import Typography from "@/components/Typography";
import React, { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  className,
}) => {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Blue background with logo and branding */}
      <div className="hidden md:flex md:w-5/12 lg:w-5/12 bg-primary-900 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/src/assets/images/wave-pattern.png')] bg-cover z-0">
          <img
            src={allImgPaths.athenaRippledIcon}
            alt="Athena Logo"
            className="w-full"
          />
        </div>
        <div className="z-10 flex flex-col items-center px-8 text-center leading-10 mt-28">
          <h1 className="text-5xl font-bold text-other-title mb-4 ">
            Athena AI-Powered
          </h1>
          <h2 className="text-5xl text-white">Knowledge Management System</h2>
        </div>
      </div>

      {/* Right side - Form content */}
      <div className="flex flex-col justify-center items-center w-full md:w-7/12 lg:w-7/12 px-4 sm:py-8 sm:px-6 lg:px-8 relative">
        {/* Add the dot background */}
        <div className="absolute inset-0 overflow-hidden">
          <DotBackground />
        </div>

        <div
          className={`bg-white drop-shadow-xl border rounded-2xl border-primary-100 w-full max-w-xl relative z-10 ${className || "p-4 sm:p-8 space-y-8"}`}
        >
          {title && subtitle && (
            <div className="flex flex-col items-center md:items-start">
              <div className="md:hidden mb-6">
                <img
                  src={allImgPaths.appLogo}
                  alt="Athena Logo"
                  className="w-32 h-auto"
                />
              </div>
              <Typography
                variant="h1"
                className="text-xl font-bold text-secondary-900 sm:text-3xl text-center md:text-left"
              >
                {title}
              </Typography>
              <Typography
                variant="body1"
                className="mt-2 text-gray-600 font-semibold text-sm sm:text-base"
              >
                {subtitle}
              </Typography>
            </div>
          )}

          {/* Form content passed as children */}
          <div className="">{children}</div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-gray-200 font-medium leading-6">
            <p className="text-sm text-center text-tertiary-700 my-2 sm:my-0">
              Powered by{" "}
              <a
                href="https://athenapro.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-secondary-900 hover:text-secondary-900"
              >
                Athenapro.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
