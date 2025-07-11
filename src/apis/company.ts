import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export default {
  createCompany: async (payload: {
    name: string;
    domain?: string;
    subscription_tier?: string;
    max_users?: number;
  }) => {
    try {
      const { data } = await api.post(`${HOST.USERS}/company`, payload);
      return data;
    } catch (error) {
      throw error;
    }
  },
  createFranchise: async (payload: {
    email: string;
    role?: string;
    entity_name: string;
    entity_description?: string;
  }) => {
    try {
      const { data } = await api.post(`${HOST.USERS}/invite/invite-franchise-owner`, payload);
      return data;
    } catch (error) {
      throw error;
    }
  },
};
