import { RootState } from "../useAppState";
import useAuth from "./useAuth";
import useChats from "./useChat";
import useCommon from "./useCommon";
import useConfig from "./useConfig";
import useDashboard from "./useDashboard";
import useGroups from "./useGroups";
import useKE from "./useKE";
import usePlanPricing from "./usePlanPricing";
import useQuestions from "./useQuestions";
import useQueues from "./useQueues";
import useRoles from "./useRoles";
import useUsers from "./useUsers";

interface Containers {
  [RootState.COMMON]: any;
  [RootState.AUTH]: any;
  [RootState.QUESTIONS]: any;
  [RootState.KE]: any;
  [RootState.QUEUES]: any;
  [RootState.CHATS]: any;
  [RootState.USERS]: any;
  [RootState.GROUPS]: any;
  [RootState.ROLES]: any;
  [RootState.DASHBOARD]: any;
  [RootState.CONFIGURATION]: any;
  [RootState.PLAN_PRICING]: any;
}

const containers: Containers = {
  [RootState.COMMON]: useCommon,
  [RootState.AUTH]: useAuth,
  [RootState.QUESTIONS]: useQuestions,
  [RootState.KE]: useKE,
  [RootState.QUEUES]: useQueues,
  [RootState.CHATS]: useChats,
  [RootState.USERS]: useUsers,
  [RootState.GROUPS]: useGroups,
  [RootState.ROLES]: useRoles,
  [RootState.DASHBOARD]: useDashboard,
  [RootState.CONFIGURATION]: useConfig,
  [RootState.PLAN_PRICING]: usePlanPricing,
};

export default containers;
