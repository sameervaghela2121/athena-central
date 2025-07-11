import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import allImgPaths from "@/assets";
import { ButtonV2 } from "@/components";
import AuthLayout from "@/components/layout/AuthLayout";
import Typography from "@/components/Typography";
import authApi from "@/apis/auth";
import { HOST } from "@/shared/constants";

enum VerificationStatus {
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error"
}

const VerifyEmail = () => {
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const token = searchParams.get("token");
        const email = searchParams.get("email");
        
        if (!token || !email) {
          setStatus(VerificationStatus.ERROR);
          setErrorMessage("Invalid verification link. Missing token or email.");
          return;
        }
        
        const response = await authApi.verifyEmail(token, email);
        
        // If the API returns a redirect URL, follow it
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
          return;
        }
        
        setStatus(VerificationStatus.SUCCESS);
      } catch (error: any) {
        console.error("Email verification error:", error);
        setStatus(VerificationStatus.ERROR);
        setErrorMessage(error.response?.data?.message || "Failed to verify email. Please try again or contact support.");
      }
    };
    
    verifyUserEmail();
  }, [searchParams]);
  
  const handleNavigateToLogin = () => {
    navigate("/login");
  };
  
  const renderContent = () => {
    switch (status) {
      case VerificationStatus.LOADING:
        return (
          <div className="w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-700"></div>
            </div>
          </div>
        );
        
      case VerificationStatus.SUCCESS:
        return (
          <div className="w-full text-center">
            <div className="flex justify-center mb-6 bg-secondary-900 rounded-xl p-4">
              <img 
                src={allImgPaths.emailVerifiedSuccessfully || allImgPaths.emailVerifiedSuccessfully} 
                alt="Success" 
                className="w-20 h-20"
              />
            </div>
            <Typography
              variant="h2"
              className="mt-6 text-left text-secondary-900"
            >
              Email Verified!
            </Typography>
            <Typography
              variant="body1"
              className="mt-2 text-left font-semibold"
            >
              Your email has been successfully verified. You can now log in to your account.
            </Typography>
            <div className="mt-6">
              <ButtonV2
                onClick={handleNavigateToLogin}
                variant="secondary"
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full"
              >
                Login
              </ButtonV2>
            </div>
          </div>
        );
        
      case VerificationStatus.ERROR:
        return (
          <div className="w-full text-center">
            <div className="flex justify-center mb-6 bg-secondary-900 rounded-xl p-4">
              <img 
                src={allImgPaths.emailVerifiedSuccessfully || allImgPaths.emailVerifiedSuccessfully} 
                alt="Error" 
                className="w-20 h-20"
              />
            </div>
            <Typography
              variant="h2"
              className="mt-6 text-left text-secondary-900"
            >
              Email Verification Failed!
            </Typography>
            <Typography
              variant="body1"
              className="mt-2 text-left text-gray-600 font-semibold"
            >
             Your email verification failed. Please try again or contact support.
            </Typography>
            <div className="mt-6">
              <ButtonV2
                onClick={handleNavigateToLogin}
                variant="primary"
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg"
              >
                Go to Login
              </ButtonV2>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Determine title and subtitle based on status
  let title = "";
  let subtitle = "";
  
  switch (status) {
    case VerificationStatus.LOADING:
      title = "Verifying Your Email";
      subtitle = "Please wait while we verify your email address...";
      break;
    case VerificationStatus.SUCCESS:
      title = "Email Verified Successfully!";
      subtitle = "Your email has been successfully verified. You can now log in to your account.";
      break;
    case VerificationStatus.ERROR:
      title = "Verification Failed";
      subtitle = errorMessage;
      break;
  }
  
  return (
    <AuthLayout
      // title={title}
      // subtitle={subtitle}
      className="p-8"
    >
      {renderContent()}
    </AuthLayout>
  );
};

export default VerifyEmail;
