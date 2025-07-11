import { HOST } from "@/shared/constants";
import { get, startCase, toLower } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  fetchLanguages: async () => {
    try {
      const { data } = await api.get(`${HOST.QUEUES}/queues/languages`);

      const result = get(data, "data.result", []).map((lang: any) => ({
        label: startCase(toLower(lang.label)),
        value: lang.value,
      }));

      return result;
    } catch (error) {
      return error;
    }
  },
  fetchRegions: async () => {
    try {
      const { data } = await api.get(`${HOST.QUEUES}/queues/regions`);
      const result = get(data, "data.result", []).map((o: any) => {
        return {
          label: o.label,
          name: o.label,
          value: o.value,
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  },
};
