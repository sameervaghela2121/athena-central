import OnboardingFlow from "@/components/OnboardingFlow";
import useAppState, { RootState } from "@/context/useAppState";
import { DEFAULT_ADMIN_URL, HOST, ROLES } from "@/shared/constants";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const {
    imposterUser: { role: imposterRole = "" },
    user,
    isLoading,
  } = useAppState(RootState.AUTH);

  useEffect(() => {
    // Don't do anything while user data is loading
    if (isLoading || !user.id) return;

    // Check if user has onboarding steps from API
    const onboardingData = user.preferences?.onboarding;
    const hasOnboardingSteps =
      onboardingData && onboardingData.nextStep !== null;
    const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";

    if (hasOnboardingSteps && isSaasDeployment) {
      // If user has onboarding steps and deployment is saas, show onboarding flow and prevent navigation
      setShowOnboarding(true);

      // If user tries to navigate away during onboarding, redirect back to home
      if (location.pathname !== "/") {
        navigate("/");
      }
    } else {
      // Navigate based on deployment type and role
      const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(imposterRole);
      navigate(`${isAdmin ? DEFAULT_ADMIN_URL : "/chats"}`);
    }
  }, [
    imposterRole,
    user.id,
    user.preferences?.onboarding,
    isLoading,
    location.pathname,
  ]);

  return (
    <div>
      <OnboardingFlow show={showOnboarding} />
    </div>
  );
};

export default Home;
