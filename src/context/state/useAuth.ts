import api from "@/apis/auth";
import usersApi from "@/apis/users";
import { HOST, PAGES, ROLES, ROLES_ACCESS } from "@/shared/constants";
import { resetAllStorage } from "@/shared/functions";
import { first, get, lowerCase } from "lodash-es";
import { useReducer } from "react";

interface Permissions {
  create: boolean;
  delete: boolean;
  read: boolean;
  update: boolean;
}

interface Entity {
  admin: string;
  company_id: string;
  created_at: string;
  created_by: string;
  deleted_at: string;
  deleted_by: string;
  description: string;
  id: string;
  is_active: boolean;
  is_deleted: boolean;
  meta_data: Record<string, unknown>;
  name: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_id: string;
  tier_id: string;
  type: string;
  updated_at: string;
  free_trial_reset_date?: string;
  updated_by: string;
}

interface Auth {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string;
  entity: Entity | null;
  user: {
    id: string;
    company_id?: string;
    entity?: string;
    name: string;
    role: string;
    is_entity_enabled?: boolean;
    is_corporate_entity?: boolean;
    is_google_authenticated: boolean;
    email: string;
    show_company_listing?: boolean;
    permissions: {
      [page: string]: Permissions;
    };
    preferences: {
      language: string;
      date_format: string;
      onboarding?: {
        currentStep: string;
        currentStepNumber: number;
        nextStep: string | null;
        steps: string[];
        totalSteps: number;
        updatedAt: string;
      };
    };
  };
  imposterUser: {
    id: string;
    company_id?: string;
    entity?: string;
    name: string;
    role: string;
    is_entity_enabled?: boolean;
    is_corporate_entity?: boolean;
    is_google_authenticated: boolean;
    email: string;
    show_company_listing?: boolean;
    permissions: {
      [page: string]: Permissions;
    };
  };
}

const initialArgs: Auth = {
  isLoggedIn: false,
  // isLoggedIn: localStorage.getItem(TOKEN_KEY_NAME)
  //   ? Boolean(localStorage.getItem(TOKEN_KEY_NAME))
  //   : false,
  isLoading: true,
  error: "",
  entity: {} as Entity,
  user: {
    name: localStorage.getItem("name") ?? "",
    id: "",
    company_id: "",
    email: localStorage.getItem("email") ?? "",
    role: localStorage.getItem("role") ?? "",
    is_entity_enabled: false,
    is_google_authenticated: false,
    is_corporate_entity: false,
    permissions: {},
    preferences: {
      language: "en",
      date_format: "Do MMM, YYYY",
    },
  },
  imposterUser: {
    name: localStorage.getItem("name") ?? "",
    id: "",
    company_id: "",
    role: localStorage.getItem("role") ?? "",
    email: localStorage.getItem("email") ?? "",
    is_entity_enabled: false,
    is_corporate_entity: false,
    is_google_authenticated: false,
    permissions: {},
  },
};

const reducer = (state: Auth, action: Auth) => {
  return { ...state, ...action };
};

const useAuth = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const fetchUser = async () => {
    try {
      setState({ ...state, isLoading: true });
      let {
        data: { result },
      } = await api.fetchUserDetailById();
      const oldRole = localStorage.getItem("role") as string;
      const role = (first(result.roles) ?? ROLES.CHATTER) as string;

      const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
      let imposterUserRole = isAdmin ? ROLES.QUEUES_SUPPORT : role;
      let entity = null;

      if (isAdmin) {
        if ([ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(oldRole ?? "")) {
          imposterUserRole = oldRole;
          localStorage.setItem("role", oldRole);
          localStorage.setItem(
            "is_corporate_entity",
            result.is_corporate_entity,
          );
          setState({
            ...state,
            user: {
              ...state.user,
              is_corporate_entity: result.is_corporate_entity, // Set in state
            },
          });
        }
      }

      if (window.location.href.includes("admin")) {
        imposterUserRole = role;
      }

      localStorage.setItem("role", imposterUserRole);

      if (result.entity) {
        try {
          entity = await usersApi.getEntityDetailById(result.entity);
        } catch (error) {
          console.error("Error fetching entity details:", error);
        }
      }
      // forcefully setting permissions for chatter remove this once it's fixed from BE.
      if (role === ROLES.CHATTER) {
        result.permissions[PAGES.KNOWLEDGE_ENTRIES] = {
          CREATE: false,
          DELETE: false,
          READ: true,
          UPDATE: false,
        };
      }

      setState({
        ...state,
        user: { ...state.user, ...result, role },
        imposterUser: {
          ...state.imposterUser,
          ...result,
          role: imposterUserRole,
        },
        entity,
        isLoading: false,
        isLoggedIn: true,
      });

      return result;
    } catch (error) {
      setState({ ...state, isLoading: false, isLoggedIn: false });
      // throw error;
      console.log("useAuth | fetchUser: Error in fetch User", error);
    }
  };

  const fetchEntity = async (entityId = get(state, "entity.id", "")) => {
    try {
      const entity = await usersApi.getEntityDetailById(entityId);

      setState({
        ...state,
        entity,
      });

      return entity;
    } catch (error) {
      console.log("useAuth | fetchEntity: Error in fetch Entity", error);
    }
  };

  const updateUserState = (newState: any) => {
    setState({ ...state, user: { ...state.user, ...newState } });
  };

  const updateUserSettings = async (payload: any) => {
    try {
      await usersApi.updateUserPreferences(payload);
    } catch (error) {
      console.error("handleDateFormatChange Error:", error);
    } finally {
      setState({
        ...state,
        user: {
          ...state.user,
          preferences: { ...state.user.preferences, ...payload },
        },
      });
    }
  };

  /**
   * The `logout` function sends a request to the server to log the user out, removes the token from
   * local storage, and updates the state to reflect that the user is no longer logged in.
   */

  async function logout() {
    try {
      resetAllStorage();
      switch (HOST.VP_PROVIDER) {
        case "Google":
          window.location.href = "/login";
          break;
        case "AzureAD":
          window.location.href = `https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=${window.location.origin}/login`;
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  const isAdmin = () => {
    const {
      user: { role = "" },
    } = state;

    return [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role as string);

    // const requiredKeys = ["groups", "roles", "users"];
    // return requiredKeys.some((key) => key in permissions);
  };

  const changeImposterUser = (data: any) => {
    localStorage.setItem("role", data.role);

    setState({
      ...state,
      // user: { ...state.user, ...data },
      imposterUser: { ...state.imposterUser, ...data },
    });
  };

  const hasAccessPath = (basePath: string) => {
    const {
      user: { role = "" },
    } = state;

    if (!role) return false; // No user or role

    const allowedPaths = ROLES_ACCESS[lowerCase(role)];

    if (allowedPaths) {
      const regexPattern = new RegExp(`^(${allowedPaths.join("|")})$`);
      const isAuthorized = regexPattern.test(basePath);

      return isAuthorized; // Check if the role is allowed
    } else {
      return false;
    }
  };

  return {
    changeImposterUser,
    logout,
    isAdmin,
    fetchUser,
    hasAccessPath,
    updateUserState,
    updateUserSettings,
    fetchEntity,
    ...state,
  };
};

export type UseAuthReturnType = ReturnType<typeof useAuth>;

export default useAuth;
