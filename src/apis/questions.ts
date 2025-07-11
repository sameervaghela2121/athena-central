import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export default {
  fetchQuestions: async (queryString: string) => {
    try {
      const result = await api.get(`/questions?${queryString}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateQuestions: async (id: string, payload: any) => {
    try {
      const result = await api.put(`/questions/${id}`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchQueues: async (stringified = "") => {
    try {
      const result = await api.get(`${HOST.QUEUES}/queues?${stringified}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  rejectQuestion: async (id: string, payload: any) => {
    try {
      const result = await api.put(`/questions/${id}/cancel`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  rerouteQuestion: async (id: string, payload: any) => {
    try {
      const result = await api.put(`/questions/${id}/reroute`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  answeringQuestion: async (id: string, payload: any) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },
};
