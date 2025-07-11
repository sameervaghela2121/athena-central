import { useEffect,useState } from "react";
import { useLocation,useNavigate,useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import authApi from "@/apis/auth";
import allImgPaths from "@/assets";
import { ButtonV2,Input } from "@/components";
import AuthLayout from "@/components/layout/AuthLayout";
import Typography from "@/components/Typography";
import useAppState,{ RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST } from "@/shared/constants";

const ResetPassword = () => {
  const [loading,setLoading] = useState(false);
  const [isSubmitted,setIsSubmitted] = useState(false);
  const [token,setToken] = useState("");
  const [email,setEmail] = useState("");
  const [formData,setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors,setErrors] = useState<Record<string,string>>({});
  const [showPassword,setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams,setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAppState(RootState.AUTH);
  const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";
  const { translate } = useTranslate();

  // Extract token and email from URL on component mount
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (tokenParam && emailParam) {
      setToken(tokenParam);
      setEmail(emailParam);

      // Clear the URL parameters for security
      setSearchParams({});
    } else {
      // If token or email is missing, redirect to forgot password page
      // toast.error("Invalid or missing reset password link. Please try again.");
      // navigate("/forgot-password");
    }
  },[]);

  // Redirect to home if already logged in
  if (isLoggedIn) {
    navigate("/");
    return null;
  }


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name,value } = e.target;
    setFormData({ ...formData,[name]: value });

    // Clear errors when user types
    if (errors[name]) {
      setErrors({ ...errors,[name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string,string> = {};

    // Validate password
    if (!formData.password) {
      newErrors.password = translate("auth.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = translate("auth.errors.passwordLength");
    } else {
      // Strong password validation
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}<>|\[\]\/_=+\-]/.test(formData.password);

      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        newErrors.password = translate("auth.errors.passwordStrength");
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = translate("auth.errors.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = translate("auth.errors.passwordsDoNotMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log("Attempting to reset password for:",email);
      const response = await authApi.resetPassword(
        email,
        token,
        formData.password,
      );

      console.log("Reset password response:",response);

      // Show success screen
      setIsSubmitted(true);
      setLoading(false);

      // Handle redirect if present
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
        return;
      }

      // Check for success message in the response
      if (response.data && response.data.data && response.data.data.success) {
        const message =
          response.data.data.message ||
          "Your password has been reset successfully";
        toast.success(message);
        setIsSubmitted(true);

        // Redirect to login page immediately
        // navigate("/login");
      } else {
        console.log("response in else",response)
        setIsSubmitted(false);
        if (response?.data && response?.data?.errors) {
          toast.error(response.data.errors);
        } else {
          toast.error("Failed to reset password. Please try again.");
        }
      }
    } catch (error: any) {
      setIsSubmitted(false);
      console.error("Reset password error:",error);
      let errorMessage = "Failed to reset password. Please try again.";

      if (error.response) {
        console.error("Error response details:",{
          status: error.response.status,
          data: error.response.data,
        });

        // Handle the specific error response format
        if (error.response.data && error.response.data.errors) {
          errorMessage = error.response.data.errors;
        } else if (
          error.response.data &&
          error.response.data.data &&
          error.response.data.data.message
        ) {
          errorMessage = error.response.data.data.message;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }

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
          title={translate("auth.resetPassword.title")}
          subtitle={isSubmitted
            ? translate("auth.resetPassword.successMessage")
            : translate("auth.resetPassword.subtitle")}
        >
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your new password"
                errors={
                  errors.password
                    ? { password: { message: errors.password } }
                    : {}
                }
                required
                className="w-full  py-2  rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-12 text-gray-500 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={
                    showPassword
                      ? allImgPaths.eyeIconBlack
                      : allImgPaths.eyeIcon
                  }
                  alt={showPassword ? "Hide password" : "Show password"}
                  className="w-5 h-5"
                />
              </button>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <Input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                errors={
                  errors.confirmPassword
                    ? { confirmPassword: { message: errors.confirmPassword } }
                    : {}
                }
                required
                className="w-full py-2  rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-12 text-gray-500 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={
                    showPassword
                      ? allImgPaths.eyeIconBlack
                      : allImgPaths.eyeIcon
                  }
                  alt={showPassword ? "Hide password" : "Show password"}
                  className="w-5 h-5"
                />
              </button>
            </div>
            <div className="mt-6">
              <ButtonV2
                type="submit"
                loading={loading}
                variant="secondary"
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-full"
              >
                {translate("auth.resetPassword.resetButton")}
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

            <div className="space-y-2">
              <Typography
                variant="h1"
                className="text-2xl font-bold text-secondary-900 sm:text-3xl text-center md:text-left"
              >
                {/* {title} */}
                {translate("auth.resetPassword.titlesuccessMessage")}
              </Typography>
              <Typography
                variant="body1"
                className="mt-4 text-left text-gray-600 font-semibold"
              >
                {/* Your password has been updated. */}
                {translate("auth.resetPassword.successMessage")}
              </Typography>
            </div>
            <Typography
              variant="body1"
              className="mt-6 text-left text-gray-600"
            >
              {/* {translate("auth.resetPassword.successMessage")} */}
              {translate("auth.resetPassword.resetPasswordDescription")}  
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

export default ResetPassword;
