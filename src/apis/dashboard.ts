import { HOST } from "@/shared/constants";
import { get } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  fetchOverviewState: async (queryString: string) => {
    try {
      const startDate = "By Week";
      // const { data } = await api.get(
      //   `${HOST.DASHBOARD}/users/user-detail?startDate=${startDate}&endDate=${endDate}`,
      // );

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          switch (startDate) {
            case "By Week":
              resolve({
                users: 800,
                queues: 200,
                KEs: 20,
              });
              break;

            default:
              resolve({
                users: 1400,
                queues: 600,
                KEs: 1200,
              });
              break;
          }
        }, 2000);
      });
    } catch (error) {
      throw error;
    }
  },

  fetchActiveUsersNewUsersState: async (queryString: any) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/active-new-users?${queryString}`,
      );

      return data;
    } catch (error) {
      throw error;
    }
  },

  fetchUserRetentionChurnRate: async (queryString: any) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/user-retention-churn-rate?${queryString}`,
      );

      return data;
    } catch (error) {
      throw error;
    }
  },

  fetchQuestionsState: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/get-downrated-chat-status?${queryString}`,
      );

      return get(data, "data.result", []);
    } catch (error) {
      throw error;
    }
  },

  fetchTopQuestionHandlerGraphData: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/top-question-handlers?${queryString}`,
      );

      return data;
    } catch (error) {
      throw error;
    }
  },
  fetchQueuesAnalyticsGraphData: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/get-top-queue-analytics?${queryString}`,
      );

      return data;
    } catch (error) {
      throw error;
    }
  },
  fetchTopKESGraphData: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/get-top-knowledge-entries?${queryString}`,
      );

      return data;
    } catch (error) {
      throw error;
    }
  },
  fetchKnowledgeBaseUtilizationGraphData: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/get-knowledge-base-utilization?${queryString}`,
      );

      const result = get(data, "data.result", []);

      return result;
    } catch (error) {
      throw error;
    }
  },
  fetchTokenUsageGraphData: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/get-token-usage?${queryString}`,
      );

      const result = get(data, "data.result", []);

      return result;
    } catch (error) {
      throw error;
    }
  },
  fetchFeedbackVoteGraphData: async (queryString: string) => {
    try {
      const { data } = await api.get(
        `${HOST.DASHBOARD}/dashboard/get-vote-stats?${queryString}`,
      );

      const result = get(data, "data.result", []);

      return result;
    } catch (error) {
      throw error;
    }
  },
};
