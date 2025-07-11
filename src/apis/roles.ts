import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export default {
  createRole: async (payload: any) => {
    try {
      const result = await api.post(`${HOST.USERS}/admin/roles`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchRoleById: async (id: string) => {
    try {
      const { data } = await api.get(`${HOST.USERS}/admin/roles/${id}`);

      return data;
    } catch (error) {
      throw error;
    }
  },

  fetchRolePermission: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/admin/permissions`);

      return data;
    } catch (error) {
      throw error;
    }
  },

  fetchRoles: async (stringified = "") => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/admin/roles?${stringified}`,
      );

      return data.data;
    } catch (error) {
      throw error;
    }
  },

  removeRole: async (id: string) => {
    try {
      const result = await api.delete(`${HOST.USERS}/admin/roles/${id}`);

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateRole: async (id: string, payload: any) => {
    try {
      const result = await api.put(`${HOST.USERS}/admin/roles/${id}`, payload);

      return result;
    } catch (error) {
      throw error;
    }
  },
};
