import { first, get } from "lodash-es";

import { HOST } from "@/shared/constants";
import { random } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  fetchCurrentTier: async (tierId: string) => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/tiers/${tierId}?q=${random(20, true)}`,
      );

      return get(data, "data.result", null);
    } catch (error) {
      throw error;
    }
  },

  fetchTiers: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/tiers`);

      return get(data, "data.result", []);
    } catch (error) {
      throw error;
    }
  },

  fetchPaymentCards: async () => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/users/payment_methods?q=${random(20, true)}`,
      );
      const result = get(data, "data.result", []);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // {{user-service}}/users/transactions
  fetchBillingHistory: async (pageSize: number = 6) => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/users/transactions?page_size=${pageSize}&q=${random(20, true)}`,
      );
      const result = get(data, "data.result", []);
      return result;
    } catch (error) {
      throw error;
    }
  },

  fetchEntityUsageMetrics: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/usage/usage-statistics`);
      const result = get(data, "data.result", []);
      return result;
    } catch (error) {
      throw error;
    }
  },
  fetchUserWiseUsageList: async (stringified = "") => {
    try {
      // {{user-service}}/users/usages
      const { data } = await api.get(
        `${HOST.USERS}/users/usages?${stringified}`,
      );
      const result = get(data, "data", null);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetches the credit multiplier used for pricing calculation
   * @returns A promise that resolves to the credit price multiplier
   */
  fetchCreditMultiplier: async (): Promise<number> => {
    try {
      // fake promise with async with 1 second delay
      return new Promise<number>((resolve) => {
        setTimeout(() => {
          resolve(50);
        }, 1000);
      });
    } catch (error) {
      console.error("fetchCreditMultiplier Error:", error);
      throw error;
    }
  },

  downloadInvoiceURL: async (invoiceId: string) => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/subscription/download-invoice/${invoiceId}`,
      );

      const result = get(data, "data.result.pdf_url", null);

      return result;
    } catch (error) {
      throw error;
    }
  },

  subscribe: async (payload: { tier_id: string }) => {
    try {
      const { data } = await api.post(
        `${HOST.USERS}/subscription/payment/subscribe`,
        payload,
      );

      const result = get(data, "data.result.client_secret", null);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // /company/payment/add-credit
  addCredit: async (payload: {
    amount: number;
    messages: number;
    autobuy_enabled: boolean;
  }) => {
    try {
      const { data } = await api.post(
        `${HOST.USERS}/subscription/payment/add-credit`,
        payload,
      );

      return get(data, "data.result", null);
    } catch (error) {
      throw error;
    }
  },

  getCurrentSubscription: async (entityId: string) => {
    try {
      const { data } = await api.get(
        `${HOST.USERS}/entity/${entityId}/subscription`,
      );

      return first(get(data, "data.result", []));
    } catch (error) {
      throw error;
    }
  },

  fetchSuggestedCredit: async () => {
    try {
      const { data } = await api.get(`${HOST.USERS}/usage/suggested-credit`);

      return get(data, "usage_stats", null);
    } catch (error) {
      throw error;
    }
  },
};
