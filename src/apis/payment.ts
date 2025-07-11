import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export default {
  /**
   * Creates a payment intent for a plan upgrade
   * @param planId - The ID of the plan to upgrade to
   * @param paymentMethodId - The Stripe payment method ID
   * @returns The payment intent data
   */
  createPaymentIntent: async (planId: string, paymentMethodId: string) => {
    try {
      const response = await api.post(
        `${HOST.USERS}/company/subscription-payment`,
        {
          planId,
          paymentMethodId,
        },
      );
      return response.data;
    } catch (error) {
      console.error("createPaymentIntent Error:", error);
      throw error;
    }
  },

  /**
   * Confirms a payment for a plan upgrade
   * @param paymentIntentId - The Stripe payment intent ID
   * @returns The payment confirmation data
   */
  confirmPayment: async (paymentIntentId: string) => {
    try {
      const response = await api.post(
        `${HOST.USERS}/company/subscription-payment`,
        {
          paymentIntentId,
        },
      );
      return response.data;
    } catch (error) {
      console.error("confirmPayment Error:", error);
      throw error;
    }
  },

  /**
   * Gets the current subscription status
   * @returns The current subscription data
   */
  updateSubscriptionStatus: async (payload: {
    tier_id: string;
    transaction_id: string;
    status: "Approved" | "Pending" | "Failed";
    amount: number;
  }) => {
    try {
      const response = await api.post(
        `${HOST.USERS}/company/add_subscription`,
        payload,
      );

      return response.data;
    } catch (error) {
      console.error("updateSubscriptionStatus Error:", error);
      throw error;
    }
  },
};
