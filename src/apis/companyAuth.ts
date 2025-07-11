import { HOST, TOKEN_KEY_NAME } from "@/shared/constants";
import { eraseCookie, setCookie } from "@/shared/functions";
import authApi from "./auth";
import api from "./axiosInterceptor";

interface EntityTokenResponse {
  data: {
    message: string | null;
    result: {
      company_id: string;
      entity_id: string;
      token: string;
      user_email: string;
      user_id: string;
      user_name: string;
    };
    success: boolean;
  };
  errors: string;
  identifier: string;
  status: number;
}

/**
 * Get entity token for a specific company
 * This updates the authentication token to include company context
 */
export const getEntityToken = async (
  companyId: string,
  entityId: string,
  membershipId: string,
): Promise<boolean> => {
  try {
    const response = await api.get<EntityTokenResponse>(
      `${HOST.AUTH}/auth/get-entity-token`,
      {
        params: {
          company_id: companyId,
          entity_id: entityId,
          membership_id: membershipId,
        },
        withCredentials: true, // Ensure cookies are sent with the request
      },
    );

    if (response.data?.data?.success && response.data?.data?.result) {
      const { token, user_email, user_id, user_name } =
        response.data.data.result;

      // Clear existing tokens and cookies
      localStorage.removeItem(TOKEN_KEY_NAME);
      eraseCookie(TOKEN_KEY_NAME);

      // Set the new token
      localStorage.setItem(TOKEN_KEY_NAME, token);
      setCookie(TOKEN_KEY_NAME, token);

      // Update user information
      localStorage.setItem("user_email", user_email);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("user_name", user_name);

      // Immediately fetch user details with the new token
      try {
        const userDetailResponse = await authApi.fetchUserDetailById();
        console.log(
          "User details fetched after company selection:",
          userDetailResponse,
        );

        // Update any additional user information if needed
        if (userDetailResponse?.data?.result) {
          const userData = userDetailResponse.data.result;
          // Store any additional user data from the response
          if (userData.preferences) {
            localStorage.setItem(
              "user_preferences",
              JSON.stringify(userData.preferences),
            );
          }
        }
      } catch (userDetailError) {
        console.error(
          "Error fetching user details after company selection:",
          userDetailError,
        );
        // Continue even if user detail fetch fails
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error getting entity token:", error);
    return false;
  }
};

export default {
  getEntityToken,
};
