import { HOST, TOKEN_KEY_NAME } from "@/shared/constants";
import { get } from "lodash-es";
import { setCookie, eraseCookie } from "@/shared/functions";
import axios, { AxiosError } from "axios";
import api from "./axiosInterceptor";

export default {
  refreshToken: async () => {
    try {
      // Make a request to the refresh token endpoint
      // The browser will automatically handle the cookies
      const response = await api.get(`${HOST.AUTH}/auth/refresh-token`, {
        withCredentials: true, // Ensure cookies are sent with the request
      });

      // Extract token from the response using lodash get
      const token = get(response, "data.data.result.token");

      if (token) {

        // Remove the old cookie
        eraseCookie(TOKEN_KEY_NAME);

        // Then set the new token in localStorage
        localStorage.setItem(TOKEN_KEY_NAME, token);

        // Set the new cookie
        setCookie(TOKEN_KEY_NAME, token);

        return response.data;
      } else {
        // If the response doesn't match the expected format, log the issue
        console.warn(
          "Token refresh response did not contain the expected data format:",
          response.data,
        );

        // Check if there's an error message in the response
        if (response.data && response.data.data && response.data.data.errors) {
          console.error("Token refresh error:", response.data.data.errors);
        }

        return response.data;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  },

  fetchUserDetailById: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/users/user-detail`);

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Login with email and password (for SaaS deployment)
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log("Attempting login with credentials:", {
        email: credentials.email,
      });
      const response = await axios.post(
        `${HOST.AUTH}/auth/login`,
        credentials,
        {
          headers: {
            "Content-Type": "application/json",
          },
          maxRedirects: 0, // Prevent axios from following redirects automatically
          validateStatus: function (status: number) {
            // Accept all status codes to handle redirects manually
            return true;
          },
        },
      );


      // Handle redirect (302, 301, etc.)
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.location;
        return { success: true, redirectUrl };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      }
      throw error;
    }
  },

  // Register a new user (for SaaS deployment)
  register: async (userData: {
    email: string;
    username: string;
    password: string;
    name: string;
  }) => {
    try {
      console.log("Attempting registration with data:", {
        email: userData.email,
        username: userData.username,
      });
      const response = await axios.post(
        `${HOST.AUTH}/auth/register`,
        userData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          maxRedirects: 0, // Prevent axios from following redirects automatically
          validateStatus: function (status: number) {
            // Accept all status codes to handle redirects manually
            return true;
          },
        },
      );

      console.log("Registration response status:", response.status);
      console.log("Registration response headers:", response.headers);

      // Handle redirect (302, 301, etc.)
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.location;
        console.log("Redirect URL found:", redirectUrl);
        return { success: true, redirectUrl };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      }
      throw error;
    }
  },

  // Verify user email
  verifyEmail: async (token: string, email: string) => {
    try {
      console.log("Attempting to verify email:", email);
      // Use axios with validateStatus to handle all status codes
      const response = await axios.get(`${HOST.AUTH}/auth/verify-email`, {
        params: { token, email },
        maxRedirects: 0, // Prevent axios from following redirects automatically
        validateStatus: function (status) {
          // Accept all status codes to handle redirects manually
          return true;
        },
      });

      console.log("Verification response status:", response.status);
      console.log("Verification response headers:", response.headers);

      // Handle redirect (302, 301, etc.)
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.location;
        console.log("Redirect URL found:", redirectUrl);
        return { success: true, redirectUrl };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Email verification error:", error);
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        });
      }
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    try {
      console.log("Attempting to send forgot password email to:", email);
      const response = await axios.post(
        `${HOST.AUTH}/auth/forgot-password`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: function (status) {
            // Accept all status codes to handle responses manually
            return true;
          },
        },
      );

      console.log("Forgot password response status:", response.status);

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Forgot password error:", error);
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      console.log("Attempting to reset password for:", email);
      const response = await axios.post(
        `${HOST.AUTH}/auth/reset-password`,
        {
          email,
          token,
          new_password: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: function (status) {
            // Accept all status codes to handle responses manually
            return true;
          },
        },
      );

      console.log("Reset password response status:", response.status);

      // Handle redirect (302, 301, etc.)
      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.location;
        console.log("Redirect URL found:", redirectUrl);
        return { success: true, redirectUrl };
      }

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Reset password error:", error);
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      console.log("Attempting to change password");
      const response = await axios.put(
        `${HOST.AUTH}/auth/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY_NAME)}`,
          },
          validateStatus: function (status) {
            // Accept all status codes to handle responses manually
            return true;
          },
        },
      );

      console.log("Change password response status:", response.status);

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Change password error:", error);
      if (error.response) {
        console.error("Error response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw error;
    }
  },
};
