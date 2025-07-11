import { HOST } from "@/shared/constants";
import { get } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  fetchQueues: async (stringified = "") => {
    try {
      const result = await api.get(`${HOST.QUEUES}/queues?${stringified}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  getRecentQueues: async () => {
    try {
      const { data } = await api.get(`${HOST.QUEUES}/queues/recent`);

      return data.data.result;
    } catch (error) {
      throw error;
    }
  },

  removeQueues: async (id: string) => {
    try {
      const result = await api.delete(`${HOST.QUEUES}/queues/${id}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  createQueues: async (payload: any) => {
    try {
      const result = await api.post(`${HOST.QUEUES}/queues`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateQueues: async (id: string, payload: any) => {
    try {
      const result = await api.put(`${HOST.QUEUES}/queues/${id}`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  reAssignQueuesToOtherUser: async (payload: any) => {
    try {
      const result = await api.put(
        `${HOST.QUEUES}/queues/reassign-users`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchQueueById: async (id: string) => {
    try {
      const result = await api.get(`${HOST.QUEUES}/queues/${id}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchCurrentUserQueues: async () => {
    try {
      const { data } = await api.get(
        `${HOST.QUEUES}/queues/fetch-queue-esc-manager-assign-user`,
      );

      return data.data.result;
    } catch (error) {
      throw error;
    }
  },
  getEntities: async () => {
    try {
      const { data } = await api.get(
        `${HOST.QUEUES}/queues/queue-entity-suggestion`,
      );

      return get(data, "data.result", []);
    } catch (error) {
      throw error;
    }
  },
};
