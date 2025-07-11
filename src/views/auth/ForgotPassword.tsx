import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { get } from "lodash";

import authApi from "@/apis/auth";
import allImgPaths from "@/assets";
import { ButtonV2, Input } from "@/components";
import AuthLayout from "@/components/layout/AuthLayout";
import Typography from "@/components/Typography";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST } from "@/shared/constants";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const navigate = useNavigate();
  const { isLoggedIn } = useAppState(RootState.AUTH);
  const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";
  const { translate } = useTranslate();
  
  // Redirect to home if already logged in
  if (isLoggedIn) {
    navigate("/");
    return null;
  }
  

  const validateEmail = () => {
    if (!email) {
      setError(translate("auth.errors.emailRequired"));
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError(translate("auth.errors.emailInvalid"));
      return false;
    }
    
    setError("");
    return true;
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setLoading(true);
    try {
      console.log('Attempting to send forgot password email to:', email);
      const response = await authApi.forgotPassword(email);
      
      console.log('Forgot password response:', response);
      
      // Check for success message in the response
      if (response.data && response.data.data && response.data.data.success) {
        const message = response.data.data.message || "Password reset link has been sent to your email";
        toast.success(message);
        setIsSubmitted(true);
      } else {
        toast.error("Failed to send password reset link. Please try again.");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      // Use lodash get for cleaner error extraction
      const errorMessage = get(
        error,
        "response.data.data.message",
        get(
          error,
          "response.data.errors",
          get(
            error,
            "response.data.message",
            "Failed to send password reset link. Please try again."
          )
        )
      );
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    navigate("/login");
  };
  
  return (
    <>
      {!isSubmitted ? (
      <AuthLayout
        title={translate("auth.forgotPassword.title")}
        subtitle={isSubmitted 
          ? translate("auth.forgotPassword.checkEmail") 
          : translate("auth.forgotPassword.subtitle")}
      >
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder={translate("auth.forgotPassword.emailPlaceholder")}
              errors={error ? { email: { message: error } } : {}}
              required
              className="w-full py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="mt-6">
            <ButtonV2
              type="submit"
              loading={loading}
              variant="secondary"
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full"
            >
              {translate("auth.forgotPassword.sendResetLink")}
            </ButtonV2>
          </div>
        </form>
      </AuthLayout>
      ) : (
      <AuthLayout className="p-6">
        <div className="w-full">
          <div className="flex justify-center mb-6 bg-secondary-900 rounded-2xl p-6">
            <img 
              src={allImgPaths.resetPasswordIcon || allImgPaths.resetPasswordIcon} 
              alt="Success" 
              className="w-20 h-20"
            />
          </div>
          
          <Typography
            variant="h2"
            className="mt-4 text-left text-secondary-900"
          >
            {translate("auth.forgotPassword.passwordResetLinkSent")}
          </Typography>

          <Typography
            variant="body1"
            className="mt-4 text-left text-gray-600 font-semibold"
          >
           {translate("auth.forgotPassword.checkEmail")}
          </Typography>

          <Typography
            variant="body1"
            className="mt-4 text-left text-gray-600"
          >
            {translate("auth.forgotPassword.checkEmailDescription")}
          </Typography>
          
          <div className="mt-6">
            <ButtonV2
              onClick={handleBackToLogin}
              variant="secondary"
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full"
            >
              {translate("auth.login.loginButton")}
            </ButtonV2>
          </div>
        </div>
    </AuthLayout>
      )}
    </>
  );
};

export default ForgotPassword;
