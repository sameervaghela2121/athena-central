import { HOST } from "@/shared/constants";
import axios from "axios";
import { get } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  fetchUsers: async (stringified = "") => {
    try {
      const { data } = await api.get(`${HOST.USERS}/users?${stringified}`);

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  removeUser: async (id: string) => {
    try {
      const result = await api.delete(`${HOST.USERS}/users/${id}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id: string, payload: any) => {
    try {
      const { data } = await api.put(`${HOST.USERS}/users/${id}`, payload);

      return get(data, "result", null);
    } catch (error) {
      throw error;
    }
  },
  updateUserPreferences: async (payload: any) => {
    try {
      const { data } = await api.put(
        `${HOST.USERS}/users/preferences`,
        payload,
      );

      return get(data, "data.result", null);
    } catch (error) {
      throw error;
    }
  },

  fetchUserById: async (id: string) => {
    try {
      const { data } = await api.get(`${HOST.USERS}/users/${id}`);

      return get(data, "data.result", null);
    } catch (error) {
      throw error;
    }
  },

  getUserDetailById: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/users/user-detail`);

      return data;
    } catch (error) {
      throw error;
    }
  },

  exportUserList: async (payload: {
    user_ids: string[];
    response_type: "csv" | "xlsx";
  }) => {
    try {
      const { data } = await api.post(`${HOST.USERS}/users/export`, payload, {
        responseType: "blob",
      });

      return data;
    } catch (error) {
      throw error;
    }
  },

  getEntityDetailById: async (id: string) => {
    try {
      const { data } = await api.get(`${HOST.USERS}/entity/${id}`);

      return get(data, "data.result", null);
    } catch (error) {
      throw error;
    }
  },

  getEntityUsageStatus: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/entity/plan-availability`);

      return get(data, "data.result.is_available", false);
    } catch (error) {
      throw error;
    }
  },

  notifyAdmin: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/users/notify-admin`);

      return get(data, "data", null);
    } catch (error) {
      throw error;
    }
  },

  getMembershipsByEmail: async (email: string) => {
    try {
      // Using direct axios call since this is used before authentication
      const response = await axios.post(
        `${HOST.USERS}/users/memberships-by-email`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching memberships by email:", error);
      throw error;
    }
  },

  getUserCompanies: async (email?: string) => {
    try {
      let data = {
        email: email,
      };
      let config = {
        method: "post",
        data: data,
      };

      const response = await axios
        .post(
          "https://us-central1-dev-genai-sandbox-434618.cloudfunctions.net/centralLogin/get-user-companies",
          data,
          {
            ...config,
            withCredentials: true,
          },
        )
        .then((response) => {
          console.log(JSON.stringify(response.data));
          return response.data;
        })
        .catch((error) => {
          console.log(error);
        });

      return response;
    } catch (error) {
      console.error("Error fetching user companies:", error);
      throw error;
    }
  },

  getCompanyAuthToken: async (data: any) => {
    try {
      let payload = {
        email: data.email,
        company_id: data.company_id,
        entity_id: data.entity_id,
        roles: data.roles,
        name: data.name,
      };
      let config = {
        method: "post",
        data: data,
      };

      const response = await axios
        .post(
          "https://us-central1-dev-genai-sandbox-434618.cloudfunctions.net/centralLogin/generate-token",
          payload,
          {
            ...config,
            withCredentials: true,
          },
        )
        .then((response) => {
          console.log(JSON.stringify(response.data));
          return response.data;
        })
        .catch((error) => {
          console.log(error);
        });

      return response;
    } catch (error) {
      console.error("Error fetching user companies:", error);
      throw error;
    }
  },
};
