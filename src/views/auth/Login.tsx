import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import authApi from "@/apis/auth";
import companyAuth from "@/apis/companyAuth";
import usersApi from "@/apis/users";
import allImgPaths from "@/assets";
import { ButtonV2, Divider, Input } from "@/components";
import AuthLayout from "@/components/layout/AuthLayout";
import Typography from "@/components/Typography";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { HOST, TOKEN_KEY_NAME } from "@/shared/constants";
import { setCookie } from "@/shared/functions";

// Define interfaces for membership data
interface Company {
  _id: string;
  name: string;
  domain: string;
  is_active: boolean;
}

interface Entity {
  _id: string;
  name: string;
  description: string;
  is_active: boolean;
  type?: string;
}

interface Membership {
  cid: string;
  companyName: string;
  name: string;
  roles: string[];
  url: string;
  user_id: string;
  membership_id: string;
  company_id: string;
  entity_id: string;
  company: Company;
  entity: Entity;
  _id: string;
  entity_name: string;
  user_name: string;
  user_email: string;
}

// Response is directly an array of memberships
type MembershipResponse = Membership[];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [oAuthLoginSuccess, setOAuthLoginSuccess] = useState(false);

  // New state variables for the SaaS login flow
  const [loginStep, setLoginStep] = useState<
    "email" | "membership" | "password"
  >("email");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAppState(RootState.AUTH);
  const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";
  const location = useLocation();
  const { translate } = useTranslate();

  const queryParams = new URLSearchParams(location.search);

  useEffect(() => {
    const errorMessage =
      queryParams.has("error") && queryParams.get("error") === "402"
        ? "You are not registered to use Azure AD. Contact the administrator at admin@athenapro.ai"
        : "";
    queryParams.delete("error");

    setErrorMsg(errorMessage);
    setSearchParams(queryParams);

    // Check if we should show email login form (coming from registration)
    if (location.state && location.state.showEmailLogin) {
      setShowEmailLogin(true);
    }

    // Check for invite token in URL
    const inviteToken = queryParams.get("invite_token");
    if (inviteToken) {
      // Show toast notification for users with invite token
      toast.success(
        "You've been invited to join platform. Please register to continue.",
      );
    }
  }, []);

  useEffect(() => {
    //OAuth Success Handling Starts Here
    const oauth_login_success = queryParams.get("oauth_login") == "success";
    const email = queryParams.get("email");
    if (oauth_login_success && email) {
      setOAuthLoginSuccess(true);
      console.log("🚀 ~ useEffect ~ email:", email);
      setFormData({ email: email, password: "" });
      emailSubmit(email);
    }
    //OAuth Success Handling Ends Here
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn]);

  const onSsoSignIn = (provider: string) => {
    console.log("provider", provider);
    // Reset all loading states first
    const newLoadingState: Record<string, boolean> = {};
    // Set only the clicked provider to loading state
    newLoadingState[provider] = true;
    setSsoLoading(newLoadingState);

    // Use the provider parameter in the URL - using window.location for SSO is still necessary
    // as it requires a full page redirect to the authentication provider
    // window.location.href = `${HOST.AUTH}/auth/login?provider=${provider}`;

    if (provider == "Google") {
      window.location.href = `${HOST.CENTRAL_CLOUD_FUNCTIONS_URL}/login?provider=Google`;
    }

    setTimeout(() => {
      setSsoLoading({});
    }, 3000);
  };

  const provider: any = {
    AzureAD: {
      icon: allImgPaths.azureLogo,
      label: "Login with AzureAD",
    },
    Google: {
      icon: allImgPaths.googleLogo,
      label: "Login with Google",
    },
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (loginStep === "email") {
      if (!formData.email) {
        newErrors.email = translate("auth.errors.emailRequired");
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = translate("auth.errors.emailInvalid");
      }
    } else if (loginStep === "password") {
      if (!formData.password) {
        newErrors.password = translate("auth.errors.passwordRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "email" ? value.toLowerCase() : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const emailSubmit = async (email?: string) => {
    setLoading(true);
    try {
      console.log(
        "Submitting email for membership check:",
        formData.email.toLowerCase(),
      );

      // Call the API using the users API service
      const membershipData = await usersApi.getUserCompanies(
        formData.email || email,
      );
      console.log("Memberships response received:", membershipData);

      if (membershipData.length === 0) {
        // When no memberships are found, show message
        toast.error("No companies found for this email address.");
        setMemberships([]);
        setLoading(false);
        return;
      }

      setMemberships(membershipData);

      if (membershipData.length === 1) {
        // If there's only one membership, select it automatically
        setSelectedMembership(membershipData[0]);
        // Redirect to the company URL
        window.location.href = `${membershipData[0].url}/login/?auth_type=email&email=${encodeURIComponent(formData.email)}&cid=${membershipData[0].cid}&entity=${membershipData[0].entity}&companyName=${encodeURIComponent(membershipData[0].companyName)}&membership_id=${membershipData[0]._id}`;
      } else {
        // If there are multiple memberships, show the membership selection screen
        setLoginStep("membership");
      }
    } catch (error: any) {
      console.error("Error fetching memberships:", error);
      let errorMessage =
        "Failed to retrieve company information. Please try again.";

      if (error.response) {
        console.error("Error response details:", {
          status: error.response.status,
          data: error.response.data,
        });
        errorMessage = error.response.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // if (!validateForm()) return;
    emailSubmit();
  };

  const handleMembershipSelect = async (membership: Membership) => {
    setSelectedMembership(membership);
    setShowMembershipModal(false);
    // Redirect to the company URL with query parameters

    // if (oAuthLoginSuccess) {
    console.log("🚀 ~ handleMembershipSelect ~ membership:", membership);
    let payload = {
      email: formData.email,
      company_id: membership.cid,
      entity_id: membership.entity,
      roles: membership.roles,
      name: membership.name,
      companyName: membership.companyName,
      user_id: membership.user_id,
      user_name: membership.user_name,
      user_email: membership.user_email,
    };
    const oauth_login_success = queryParams.get("oauth_login") == "success";
    if (oauth_login_success) {
      const response = await usersApi.getCompanyAuthToken(payload);
      if (response?.token) {
        console.log("response", response);
        window.location.href = `${membership.url}/login?isRedirect=true&auth_token=${response.token}`;
        // Save token and user info
      }
    } else {
      window.location.href = `${membership.url}/login?auth_type=email&?email=${encodeURIComponent(formData.email)}&cid=${membership.cid}&entity=${membership.entity}&companyName=${encodeURIComponent(membership.companyName)}&membership_id=${membership._id}`;
    }
    // }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log("Submitting login with password");
      const response = await authApi.login({
        email: formData.email.toLowerCase(),
        password: formData.password,
      });
      console.log("Login response received:", response);

      if (response.data?.errors || !response.data.token) {
        console.error(
          "Invalid response format, missing token or user data:",
          response,
        );
        toast.error(response.data?.errors || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      const { token, user } = response.data;
      // Save token and user info
      localStorage.setItem(TOKEN_KEY_NAME, token);
      localStorage.setItem("user_id", user.user_id);
      localStorage.setItem("user_name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", user.role || "CHATTER");
      localStorage.setItem("is_login", "true");

      // Set cookies
      setCookie(TOKEN_KEY_NAME, token);
      setCookie("user_id", user.user_id);
      setCookie("user_name", user.name);
      setCookie("user_email", user.email);
      setCookie("is_login", "true");

      // If we have a selected membership, get the entity token
      if (selectedMembership) {
        const success = await companyAuth.getEntityToken(
          selectedMembership.company_id,
          selectedMembership.entity_id,
          selectedMembership._id,
        );

        if (success) {
          // Store selected company info for UI display
          localStorage.setItem(
            "selected_company",
            JSON.stringify({
              id: selectedMembership.company_id,
              name: selectedMembership.company.name,
              entity_id: selectedMembership.entity_id,
              entity_name: selectedMembership.entity.name,
              membership_id: selectedMembership._id,
            }),
          );

          toast.success("Login successful!");
          // Use window.location.href to ensure complete page refresh with new token
          window.location.href = "/";
          return;
        } else {
          toast.error("Failed to set company context. Please try again.");
          setLoading(false);
          return;
        }
      } else if (memberships.length === 0) {
        // No memberships found, redirect to onboarding to create a workspace
        toast.success("Login successful! Let's set up your workspace.");
        // Set flag to show company creation in onboarding
        localStorage.setItem("show_company_creation", "true");
        // Redirect to onboarding
        window.location.href = "/onboarding";
        return;
      }

      toast.success("Login successful!");
      // If the API returns a redirect URL, follow it
      if (response?.data?.redirect_url) {
        console.log("Following redirect URL:", response.data.redirect_url);
        // Check if it's an internal route or external URL
        if (response.data.redirect_url.startsWith("/")) {
          // For internal routes, use navigate
          navigate(response.data.redirect_url);
        } else {
          // For external URLs, use window.location
          window.location.href = response.data.redirect_url;
        }
        return;
      }

      // Default navigation
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please check your credentials.";

      if (error.response) {
        console.error("Error response details:", {
          status: error.response.status,
          data: error.response.data,
        });
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage =
          "No response received from server. Please try again later.";
      } else {
        console.error("Error setting up request:", error.message);
        errorMessage = `Error: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    localStorage.setItem("showdelete", "true");
    e.preventDefault();

    if (loginStep === "email") {
      handleEmailSubmit(e);
    } else if (loginStep === "password") {
      handlePasswordSubmit(e);
    }
    // Note: membership step doesn't submit the form
  };

  const handleBackToEmail = () => {
    setLoginStep("email");
    setSelectedMembership(null);
    setFormData((prev) => ({ ...prev, password: "" }));
    setErrors({});
  };

  const toggleLoginMethod = () => {
    setShowEmailLogin(!showEmailLogin);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {isSaasDeployment ? (
        <AuthLayout
          title={
            loginStep === "membership"
              ? "Select Your Company"
              : "Welcome to Athena"
          }
          subtitle={
            loginStep === "membership"
              ? "Your email matches multiple companies. Select one."
              : "Login into Your Account"
          }
        >
          <div className="">
            {errorMsg && (
              <div className="mb-6 px-5 py-3 text-center rounded-md text-status-error bg-status-error/10">
                {errorMsg}
              </div>
            )}
            <div className="">
              {loginStep === "membership" ? (
                <div className="space-y-5">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-gray-900">
                          {formData.email}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Please select a company to continue
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToEmail}
                        className="text-xs sm:text-sm text-primary-700 hover:text-primary-800 font-medium"
                      >
                        Change Email
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto p-1 sm:p-0">
                    {memberships.map((membership) => (
                      <div
                        key={membership._id}
                        onClick={() => handleMembershipSelect(membership)}
                        className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm sm:text-base font-medium text-gray-900">
                            {membership.companyName}
                          </p>
                          {/* <p className="text-xs sm:text-sm text-gray-600">
                            Entity: {membership.entity.name}
                          </p> */}
                          {/* {membership.designation && (
                            <p className="text-xs text-gray-500 mt-1">
                              {membership.designation}
                            </p>
                          )} */}
                        </div>
                        <div className="text-primary-700">
                          <img
                            src={allImgPaths.chevronRight}
                            alt="chevron-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {loginStep === "email" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                        Email
                      </label>
                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        errors={
                          errors.email
                            ? { email: { message: errors.email } }
                            : {}
                        }
                        required
                        className="w-full rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}

                  {loginStep === "password" && (
                    <>
                      <div className="mb-4 bg-secondary-900 rounded-lg border-t border-r-0 border-b-0 border-l-0 border-t-primary-100">
                        <div className="px-6 py-2 ">
                          <p className="text-xs sm:text-sm font-medium text-white">
                            Logging in as
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between border border-t-0 border-primary-100 rounded-t-lg rounded-b-md bg-white px-4 py-3">
                          <div>
                            <div className="flex items-center mb-1">
                              <img
                                src={allImgPaths.emailInbox}
                                alt="email"
                                className="w-4 h-4 mr-2"
                              />
                              <p className="text-xs sm:text-base font-semibold text-gray-900">
                                {formData.email}
                              </p>
                            </div>
                            {selectedMembership ? (
                              <div className="flex items-center mt-1">
                                <img
                                  src={allImgPaths.company}
                                  alt="company"
                                  className="w-4 h-4 mr-2 opacity-60"
                                />
                                <span className="text-sm text-gray-600">
                                  <span className="font-medium opacity-60">
                                    Company:
                                  </span>{" "}
                                  {selectedMembership.company.name}
                                </span>
                              </div>
                            ) : memberships.length === 0 ? (
                              <p className="text-xs sm:text-sm break-words text-gray-600 mt-1">
                                No Company found for this account. Enter your
                                password to continue and set up your first
                                company
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={handleBackToEmail}
                            className="text-xs mt-1 sm:mt-0 text-secondary-900 hover:text-primary-800 font-medium"
                          >
                            Change
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1 tracking-wide">
                          Password
                        </label>
                        <Input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          errors={
                            errors.password
                              ? { password: { message: errors.password } }
                              : {}
                          }
                          required
                          className="w-full rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-9 text-gray-500 focus:outline-none"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          <img
                            src={
                              showPassword
                                ? allImgPaths.eyeIconBlack
                                : allImgPaths.eyeIcon
                            }
                            alt={
                              showPassword ? "Hide password" : "Show password"
                            }
                            className="w-5 h-5"
                          />
                        </button>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-sm text-secondary-900 font-medium tracking-wide hover:underline focus:outline-none"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </>
                  )}

                  <div>
                    <ButtonV2
                      type="submit"
                      loading={loading}
                      variant="primary"
                      className="w-full py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-full text-sm sm:text-base"
                    >
                      {loginStep === "email" ? "Continue" : "Login"}
                    </ButtonV2>
                  </div>
                </form>
              )}

              {loginStep === "email" && (
                <>
                  <div className="mt-6 flex items-center justify-center space-x-3">
                    <Divider className="flex-grow h-px bg-tertiary-700" />
                    <span className="text-sm text-tertiary-700 tracking-wider leading-4 font-medium">
                      Or Login With
                    </span>
                    <Divider className="flex-grow h-px bg-tertiary-700" />
                  </div>

                  <div className="flex mt-6 justify-around px-2">
                    <ButtonV2
                      onClick={() => onSsoSignIn("AzureAD")}
                      loading={ssoLoading["AzureAD"] === true}
                      variant="primary"
                      leftIcon={provider["AzureAD"].icon}
                      className={`border !text-tertiary-700 hover:!text-white w-full !mx-2 rounded-lg py-3 text-xs sm:text-base ${
                        ssoLoading["AzureAD"] === true
                          ? "!bg-tertiary-700 !text-white"
                          : "bg-white"
                      }`}
                    >
                      Azure AD
                    </ButtonV2>
                    <ButtonV2
                      onClick={() => onSsoSignIn(HOST.VP_PROVIDER)}
                      loading={ssoLoading[HOST.VP_PROVIDER] === true}
                      variant="primary"
                      leftIcon={provider[HOST.VP_PROVIDER].icon}
                      className={`border !text-tertiary-700 hover:!text-white w-full !mx-2 rounded-lg py-3 text-xs sm:text-base ${
                        ssoLoading[HOST.VP_PROVIDER] === true
                          ? "!bg-tertiary-700 !text-white"
                          : "bg-white"
                      }`}
                    >
                      {translate("auth.login.loginWithSSO", {
                        provider: HOST.VP_PROVIDER,
                      })}
                    </ButtonV2>
                  </div>
                </>
              )}

              {loginStep === "email" && (
                <div className="mt-8 text-center font-medium tracking-wide">
                  <Typography variant="body2" className="text-sm text-gray-600">
                    {translate("auth.login.noAccount")}{" "}
                    <span
                      onClick={() => navigate("/register")}
                      className="font-semibold text-secondary-900 hover:underline cursor-pointer"
                    >
                      {translate("auth.login.signUp")}
                    </span>
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {/* Removed modal in favor of inline company listing */}
        </AuthLayout>
      ) : (
        <AuthLayout>
          <div className="flex flex-col items-center mx-auto w-full max-w-sm rounded-3xl sm:py-10 sm:px-10 sm:max-w-md lg:max-w-lg">
            {errorMsg && (
              <p className="px-5 py-3 text-center rounded-md text-status-error bg-status-error/10">
                {errorMsg}
              </p>
            )}

            <div>
              <img
                src={allImgPaths.appLogo}
                alt="App Logo"
                className="object-contain w-auto h-9"
              />
            </div>

            <div className="mt-5 text-center sm:mt-7">
              <Typography
                variant="h1"
                className="text-xl font-bold text-secondary-900 sm:text-2xl"
              >
                Welcome to AthenaPro
              </Typography>
              <Typography
                variant="body1"
                className="mt-2 text-sm text-black sm:text-base"
              >
                Your AI-Powered Knowledge Management System
              </Typography>
            </div>

            <div className="mt-6 sm:mt-10">
              <img
                src={allImgPaths.loginIcon}
                alt="Login Icon"
                className="w-auto h-[230px] object-contain"
              />
            </div>

            <div className="mt-8 w-full sm:mt-12">
              <ButtonV2
                onClick={() => onSsoSignIn(HOST.VP_PROVIDER)}
                loading={ssoLoading[HOST.VP_PROVIDER] === true}
                variant="primary"
                leftIcon={provider[HOST.VP_PROVIDER].icon}
                className={`border !border-secondary-900 !text-secondary-900 hover:!text-white w-full rounded-xl ${
                  ssoLoading[HOST.VP_PROVIDER] === true
                    ? "!bg-secondary-900 !text-white"
                    : "bg-white"
                }`}
              >
                Login with{" "}
                {translate("auth.login.loginWithSSO", {
                  provider: HOST.VP_PROVIDER,
                })}
              </ButtonV2>
            </div>
          </div>
        </AuthLayout>
      )}
    </>
  );
};

export default Login;
