import { HOST } from "@/shared/constants";
import { get } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  fetchConfig: async () => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/admin/attribute-configuration`,
      );

      return get(data, "data.result", []);
    } catch (error) {
      console.error("Error fetch Config", error);
      throw error;
    }
  },
  fetchConfigById: async (id: string) => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/admin/attribute-configuration/${id}`,
      );

      return get(data, "data.result", {});
    } catch (error) {
      console.error("Error fetch Config by id", error);
      throw error;
    }
  },
  removeConfig: async (id: string) => {
    try {
      const response = await api.delete(
        `${HOST.USERS}/admin/attribute-configuration/${id}`,
      );
      return response;
    } catch (error) {
      console.error("Error deleting config", error);
      throw error;
    }
  },
  updateConfig: async (id: string, payload: any) => {
    try {
      const response = await api.put(
        `${HOST.USERS}/admin/attribute-configuration/${id}`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error updating config", error);
      throw error;
    }
  },
  createAttribute: async (payload: any) => {
    try {
      const response = await api.post(
        `${HOST.USERS}/admin/attribute-configuration`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error creating config", error);
      throw error;
    }
  },
};
