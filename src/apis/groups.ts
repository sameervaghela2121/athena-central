import { HOST } from "@/shared/constants";
import { get } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  createGroup: async (payload: any) => {
    try {
      const result = await api.post(`${HOST.USERS}/admin/groups`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchGroupById: async (id: string) => {
    try {
      const result = await api.get(`${HOST.USERS}/admin/groups/${id}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchGroups: async (stringified = "") => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/admin/groups?${stringified}`,
      );

      return get(data, "data", {});
    } catch (error) {
      throw error;
    }
  },

  fetchGroupAttribute: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/users/attributes`);

      return get(data, "data", {});
    } catch (error) {
      throw error;
    }
  },

  removeGroup: async (id: string) => {
    try {
      const result = await api.delete(`${HOST.USERS}/admin/groups/${id}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateGroup: async (id: string, payload: any) => {
    try {
      const result = await api.put(`${HOST.USERS}/admin/groups/${id}`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },
};
