import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import authApi from "@/apis/auth";
import allImgPaths from "@/assets";
import { ButtonV2, Input } from "@/components";
import AuthSuccessScreen from "@/components/auth/AuthSuccessScreen";
import AuthLayout from "@/components/layout/AuthLayout";
import Typography from "@/components/Typography";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { TOKEN_KEY_NAME } from "@/shared/constants";
import { setCookie } from "@/shared/functions";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { isLoggedIn } = useAppState(RootState.AUTH);
  const { translate } = useTranslate();

  // Redirect to home if already logged in
  if (isLoggedIn) {
    navigate("/");
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = translate("auth.errors.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = translate("auth.errors.emailInvalid");
    }

    // Username is now generated from email, so no validation needed here

    if (!formData.password) {
      newErrors.password = translate("auth.errors.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = translate("auth.errors.passwordLength");
    } else {
      // Strong password validation
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}<>|\[\]\/_=+\-]/.test(
        formData.password,
      );

      if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
        newErrors.password = translate("auth.errors.passwordStrength");
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = translate("auth.errors.passwordRequired");
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.name) {
      newErrors.name = translate("auth.errors.nameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: value,
      };
      
      // If email is changed, automatically update username
      if (name === "email" && value) {
        // Generate username from email by taking everything before @ and removing special chars
        const emailPrefix = value.split("@")[0];
        updatedData.username = emailPrefix.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      }
      
      return updatedData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authApi.register(formData);

      // Clear the form after successful submission
      setFormData({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        name: "",
      });

      // If the API returns a redirect URL, follow it
      if (response.redirectUrl) {
        // Check if it's an internal route or external URL
        if (response.redirectUrl.startsWith('/')) {
          // For internal routes, use navigate
          navigate(response.redirectUrl);
        } else {
          // For external URLs, use window.location
          window.location.href = response.redirectUrl;
        }
        return;
      }

      // Handle the new response format
      if (response.data && response.data.data) {
        const apiResponse = response.data.data;

        // Show the success message from the API
        if (apiResponse.success) {
          if (response.data.status === 200) {
            toast.success(response.data.data.message);  
            navigate("/login");
          }else {
            setIsSubmitted(true);
          }
          setRegisteredEmail(formData.email);
          setLoading(false);
        } else {
          toast.error(response?.data?.errors);
        }

        return;
      }

      // Fallback to old response format if needed
      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data;

        // Save token and user info
        localStorage.setItem(TOKEN_KEY_NAME, token);
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("user_name", user.name);
        localStorage.setItem("email", user.email);
        localStorage.setItem("role", user.role || "CHATTER");
        localStorage.setItem("is_login", "true");

        // Set cookies
        setCookie(TOKEN_KEY_NAME, token);
        setCookie("user_id", user.id);
        setCookie("user_name", user.name);
        setCookie("user_email", user.email);
        setCookie("is_login", "true");

        toast.success("Registration successful!");
        navigate("/");
      } else {
        // If we don't recognize the response format, show a generic success message
        setIsSubmitted(true);
        setRegisteredEmail(formData.email);
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";

      if (error.response) {
        console.error("Error response details:", {
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

  return (
    <>
      {!isSubmitted ? (
        <AuthLayout
          title={translate("auth.register.title")}
          subtitle={translate("auth.register.subtitle")}
        >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={translate("auth.register.namePlaceholder")}
            errors={errors.name ? { name: { message: errors.name } } : {}}
            required
            className="w-full rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={translate("auth.register.emailPlaceholder")}
            errors={errors.email ? { email: { message: errors.email } } : {}}
            required
            className="w-full rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Username field is now hidden and automatically generated from email */}

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            placeholder={translate("auth.register.passwordPlaceholder")}
            errors={
              errors.password ? { password: { message: errors.password } } : {}
            }
            required
            className="w-full rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-9 text-gray-500 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <img
              src={
                showPassword ? allImgPaths.eyeIconBlack : allImgPaths.eyeIcon
              }
              alt={showPassword ? "Hide password" : "Show password"}
              className="w-5 h-5"
            />
          </button>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <Input
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            errors={
              errors.confirmPassword ? { confirmPassword: { message: errors.confirmPassword } } : {}
            }
            required
            className="w-full rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-9 text-gray-500 focus:outline-none"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            <img
              src={
                showConfirmPassword ? allImgPaths.eyeIconBlack : allImgPaths.eyeIcon
              }
              alt={showConfirmPassword ? "Hide password" : "Show password"}
              className="w-5 h-5"
            />
          </button>
        </div>

        <div className="mt-6">
          <ButtonV2
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-lg"
          >
            {translate("auth.register.registerButton")}
          </ButtonV2>
        </div>

        <div className="mt-6 text-center">
          <Typography variant="body2" className="text-sm text-gray-600">
            {translate("auth.register.haveAccount")}{" "}
            <span
              onClick={() => navigate("/login")}
              className="font-semibold text-primary-700 hover:underline cursor-pointer"
            >
              {translate("auth.register.login")}
            </span>
          </Typography>
        </div>
      </form>
    </AuthLayout>
      ) : (
        <AuthSuccessScreen
          icon={allImgPaths.emailVerifiedSuccessfully}
          title="Verify Email"
          subtitle="Check your inbox to confirm your email"
          description={`We sent a link to ${registeredEmail}. If you don't see it, check your spam folder. After confirming your email, you can explore the platform`}
          buttonText={translate("auth.register.login")}
          onButtonClick={() => navigate("/login", { state: { showEmailLogin: true } })}
        />
      )}
    </>
  );
};

export default Register;
