import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export default {
  updateOnboardingStep: async (payload: {
    current_step: string;
  }) => {
    try {
      const { data } = await api.post(`${HOST.USERS}/onboarding`, payload);
      return data;
    } catch (error) {
      throw error;
    }
  },
};
