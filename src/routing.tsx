import React, { useEffect } from "react";
import { Navigate, useRoutes } from "react-router-dom";

import { useAuth } from "@/components/AuthProvider";
import useAppState, { RootState } from "@/context/useAppState";
import { useBasePath } from "@/hooks";
import { HOST, ROLES_ACCESS } from "@/shared/constants";

import Login from "@/views/auth/Login";
import PageNotFound from "@/views/page-not-found";
import Home from "./views/Home";

const isRoleAuthorized = (role: string, basePath: string): boolean => {
  return (
    ROLES_ACCESS[role]?.some((path: any) =>
      new RegExp(`^${path}$`).test(basePath),
    ) || false
  );
};

const RouteWrapper = ({ element }: { element: any }) => {
  const basePath = useBasePath();
  const { role } = useAuth();
  const { user } = useAppState(RootState.AUTH);

  // Check if user has onboarding steps from API
  const onboardingData = user.preferences?.onboarding;
  const hasOnboardingSteps = onboardingData && onboardingData.nextStep !== null;
  const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";

  // If user has onboarding steps and deployment is saas, redirect to home page
  if (hasOnboardingSteps && isSaasDeployment && basePath !== "/") {
    return <Navigate to="/" replace={true} />;
  }

  // let filteredMenus = filterMenu({ imposterRole, role });

  // const validUrls = map(filteredMenus, "url");

  if (!role) {
    return <Navigate to="/login" state={{ from: basePath }} replace={true} />;
  }

  const authorized = isRoleAuthorized(role, basePath);

  // if you want to prevent routes for admin when he is imposter user and vice versa
  // const authorized =
  //   validUrls?.some((path: any) => new RegExp(`^${path}$`).test(basePath)) ||
  //   false;

  return authorized ? element : <Navigate to="/unauthorized" replace />;
};

// Component to handle SaaS-only routes
const SaasRouteWrapper = ({
  element,
  requireAuth = true,
}: {
  element: React.ReactNode;
  requireAuth?: boolean;
}) => {
  // Check if the deployment type is saas
  const isSaasDeployment = HOST.DEPLOYMENT_TYPE === "saas";

  if (!isSaasDeployment) {
    return <Navigate to="/login" replace />;
  }

  return requireAuth ? (
    <AuthenticatedRoute element={element} />
  ) : (
    <>{element}</>
  );
};

// Component to handle authentication for routes
const AuthenticatedRoute = ({ element }: { element: React.ReactNode }) => {
  const { role } = useAuth();
  const basePath = useBasePath();

  if (!role) {
    return <Navigate to="/login" state={{ from: basePath }} replace={true} />;
  }

  return <>{element}</>;
};

const Routing = () => {
  useEffect(() => {
    if (window.location.hostname.includes("localhost")) {
      document.title = `AthenaPro 🛠️`;
    }
  }, []);

  const routes = useRoutes([
    {
      path: "/",
      element: <AuthenticatedRoute element={<Home />} />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/*",
      element: <PageNotFound />,
    },
  ]);

  return routes;
};

export default React.memo(Routing);
