import { useContext } from "react";
import AppContext from "./AppContext";
import { UseAuthReturnType } from "./state/useAuth";
import { UseChatsReturnType } from "./state/useChat";
import { UseGlobalReturnType } from "./state/useCommon";
import { UseConfigReturnType } from "./state/useConfig";
import { UseDashboardReturnType } from "./state/useDashboard";
import { UseGroupsReturnType } from "./state/useGroups";
import { UseKEReturnType } from "./state/useKE";
import { UsePlanPricingReturnType } from "./state/usePlanPricing";
import { UseQuestionsReturnType } from "./state/useQuestions";
import { UseQueuesReturnType } from "./state/useQueues";
import { UseRolesReturnType } from "./state/useRoles";
import { UseUserReturnType } from "./state/useUsers";

export enum RootState {
  COMMON = "common",
  AUTH = "auth",
  QUESTIONS = "questions",
  QUEUES = "queues",
  KE = "KE",
  CHATS = "chats",
  USERS = "users",
  GROUPS = "groups",
  ROLES = "roles",
  DASHBOARD = "dashboard",
  CONFIGURATION = "config",
  PLAN_PRICING = "plan_pricing",
}

interface Containers {
  [RootState.COMMON]: UseGlobalReturnType;
  [RootState.AUTH]: UseAuthReturnType;
  [RootState.QUESTIONS]: UseQuestionsReturnType;
  [RootState.QUEUES]: UseQueuesReturnType;
  [RootState.KE]: UseKEReturnType;
  [RootState.CHATS]: UseChatsReturnType;
  [RootState.USERS]: UseUserReturnType;
  [RootState.GROUPS]: UseGroupsReturnType;
  [RootState.ROLES]: UseRolesReturnType;
  [RootState.DASHBOARD]: UseDashboardReturnType;
  [RootState.CONFIGURATION]: UseConfigReturnType;
  [RootState.PLAN_PRICING]: UsePlanPricingReturnType;
}

const useAppState = <T extends keyof Containers>(
  container: T,
): Containers[T] => {
  const [containers]: any = useContext(AppContext);

  // Check if we even have an appContext
  if (!containers) {
    throw new Error("State Machine cannot find context.");
  }

  // return entire state if there's no parameter
  if (!container) return containers;

  const containerInstance = containers[container];
  if (containerInstance === undefined) {
    console.error("containers available", Object.keys(containers));
    throw Error(
      `AppState Container '${container}' does not exist. See the console for available containers.`,
    );
  }
  return containerInstance;
};

export default useAppState;
