import { useReducer } from "react";

import api from "@/apis/planAndBilling";
import { first, size, sortBy } from "lodash-es";

interface Plan {
  id: string;
  name: string;
  subscription_amount: number;
  status: boolean;
  key_name: string;
  version: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted_by: string | null;
  is_deleted: boolean;
  features: {
    chat_limit: number;
  };
}

interface Invoice {
  planName: string;
  date: string;
  amount: number;
  status: string;
}

interface UserWiseData {
  usage: {
    message_count: number;
    remaining_message_count: number;
    usageLevel: string;
  };
  user_detail: {
    email: string;
    id: string;
    last_login_at: string;
    name: string;
  };
}

export interface EntityUsageMetrics {
  entity_id: string;
  total_used_messages: {
    total: number;
    used: number;
  };
  pool_messages: {
    total: number;
    used: number;
  };
  post_trail_messages: {
    total: number;
    used: number;
  };
  pre_trail_messages: {
    total: number;
    used: number;
  };
  purchased_messages: {
    total: number;
    used: number;
  };
  subscription_messages: {
    total: number;
    used: number;
  };
  tier_id: string;
  tier_name: string;
}

export interface SuggestedCredit {
  tier_name: string;
  tier_id: string;
  min_buffer: number;
  max_buffer: number;
  subscription_amount: number;
  credits: number;
  current_usages: number;
}

export interface PlanPricing {
  plans: Plan[];
  currentTier: Plan | null;
  isLoading: boolean;
  error: any;
  paymentCard: PaymentCards | null;
  isLoadingPaymentCard: boolean;
  errorPaymentCard: any;

  // billing history
  isLoadingBillingHistory: boolean;
  errorBillingHistory: any;
  billingHistory: Invoice[];

  // usages user data
  isLoadingUserWiseData: boolean;
  errorUserWiseData: any;
  userWiseData: UserWiseData[];
  total: number;
  isLoaded: boolean;

  // entity usage metrics
  isLoadingEntityUsageMetrics: boolean;
  errorEntityUsageMetrics: any;
  entityUsageMetrics: EntityUsageMetrics | null;

  // suggested credit
  isLoadingSuggestedCredit: boolean;
  errorSuggestedCredit: any;
  suggestedCredit: SuggestedCredit | null;
}

const initialArgs: PlanPricing = {
  plans: [],
  currentTier: null,
  paymentCard: null,
  isLoading: true,
  error: false,
  isLoadingPaymentCard: true,
  errorPaymentCard: false,

  // billing history
  isLoadingBillingHistory: true,
  errorBillingHistory: false,
  billingHistory: [],

  // usages user data
  isLoadingUserWiseData: true,
  errorUserWiseData: false,
  userWiseData: [],
  total: 0,
  isLoaded: false,

  // entity usage metrics
  isLoadingEntityUsageMetrics: true,
  errorEntityUsageMetrics: false,
  entityUsageMetrics: null,

  // suggested credit
  isLoadingSuggestedCredit: true,
  errorSuggestedCredit: false,
  suggestedCredit: null,
};

interface PaymentCards {
  brand: string;
  exp_month: number;
  exp_year: number;
  last4: string;
}

type Action =
  | { type: "SET_PLANS"; plans: Plan[] }
  | { type: "SET_CURRENT_TIER"; currentTier: Plan | null }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: any }
  | { type: "SET_LOADING_PAYMENT_CARD"; isLoadingPaymentCard: boolean }
  | { type: "SET_PAYMENT_CARD"; paymentCard: PaymentCards | null }
  | { type: "SET_ERROR_PAYMENT_CARD"; error: any }
  | { type: "SET_LOADING_BILLING_HISTORY"; isLoadingBillingHistory: boolean }
  | { type: "SET_BILLING_HISTORY"; billingHistory: Invoice[] }
  | { type: "SET_ERROR_BILLING_HISTORY"; error: any }
  | { type: "SET_LOADING_USER_WISE_DATA"; isLoadingUserWiseData: boolean }
  | {
      type: "SET_USER_WISE_DATA";
      userWiseData: UserWiseData[];
      total: number;
    }
  | { type: "SET_ERROR_USER_WISE_DATA"; errorUserWiseData: any }
  | {
      type: "SET_LOADING_ENTITY_USAGE_METRICS";
      isLoadingEntityUsageMetrics: boolean;
    }
  | {
      type: "SET_ENTITY_USAGE_METRICS";
      entityUsageMetrics: EntityUsageMetrics | null;
    }
  | { type: "SET_ERROR_ENTITY_USAGE_METRICS"; errorEntityUsageMetrics: any }
  | {
      type: "SET_LOADING_SUGGESTED_CREDIT";
      isLoadingSuggestedCredit: boolean;
    }
  | {
      type: "SET_SUGGESTED_CREDIT";
      suggestedCredit: SuggestedCredit | null;
    }
  | { type: "SET_ERROR_SUGGESTED_CREDIT"; errorSuggestedCredit: any };

function reducer(state: PlanPricing, action: Action) {
  switch (action.type) {
    case "SET_PLANS":
      return { ...state, plans: action.plans, isLoading: false, error: false };
    case "SET_CURRENT_TIER":
      return {
        ...state,
        currentTier: action.currentTier,
        isLoading: false,
        error: false,
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false };
    case "SET_LOADING_PAYMENT_CARD":
      return { ...state, isLoadingPaymentCard: action.isLoadingPaymentCard };
    case "SET_PAYMENT_CARD":
      return {
        ...state,
        paymentCard: action.paymentCard,
        isLoadingPaymentCard: false,
        errorPaymentCard: false,
      };
    case "SET_ERROR_PAYMENT_CARD":
      return {
        ...state,
        errorPaymentCard: action.error,
        isLoadingPaymentCard: false,
      };
    case "SET_LOADING_BILLING_HISTORY":
      return {
        ...state,
        isLoadingBillingHistory: action.isLoadingBillingHistory,
        errorBillingHistory: false,
      };
    case "SET_BILLING_HISTORY":
      return {
        ...state,
        billingHistory: action.billingHistory,
        isLoadingBillingHistory: false,
        errorBillingHistory: false,
      };
    case "SET_ERROR_BILLING_HISTORY":
      return {
        ...state,
        errorBillingHistory: action.error,
        isLoadingBillingHistory: false,
      };
    case "SET_LOADING_USER_WISE_DATA":
      return { ...state, isLoadingUserWiseData: action.isLoadingUserWiseData };
    case "SET_USER_WISE_DATA":
      return {
        ...state,
        userWiseData: action.userWiseData,
        total: action.total,
        isLoadingUserWiseData: false,
        isLoaded: true,
        errorUserWiseData: false,
      };
    case "SET_ERROR_USER_WISE_DATA":
      return {
        ...state,
        errorUserWiseData: action.errorUserWiseData,
        isLoadingUserWiseData: false,
      };
    case "SET_LOADING_ENTITY_USAGE_METRICS":
      return {
        ...state,
        isLoadingEntityUsageMetrics: action.isLoadingEntityUsageMetrics,
        errorEntityUsageMetrics: false,
      };
    case "SET_ENTITY_USAGE_METRICS":
      return {
        ...state,
        entityUsageMetrics: action.entityUsageMetrics,
        isLoadingEntityUsageMetrics: false,
        errorEntityUsageMetrics: false,
      };
    case "SET_ERROR_ENTITY_USAGE_METRICS":
      return {
        ...state,
        errorEntityUsageMetrics: action.errorEntityUsageMetrics,
        isLoadingEntityUsageMetrics: false,
      };
    case "SET_LOADING_SUGGESTED_CREDIT":
      return {
        ...state,
        isLoadingSuggestedCredit: action.isLoadingSuggestedCredit,
        errorSuggestedCredit: false,
      };
    case "SET_SUGGESTED_CREDIT":
      return {
        ...state,
        suggestedCredit: action.suggestedCredit,
        isLoadingSuggestedCredit: false,
        errorSuggestedCredit: false,
      };
    case "SET_ERROR_SUGGESTED_CREDIT":
      return {
        ...state,
        errorSuggestedCredit: action.errorSuggestedCredit,
        isLoadingSuggestedCredit: false,
      };
    default:
      return state;
  }
}

const usePlanPricing = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const fetchTiers = async () => {
    try {
      setState({ type: "SET_LOADING", isLoading: true });

      const result = await api.fetchTiers();

      const plans = result.map((o: any) => ({
        ...o,
        subscription_amount: o.subscription_amount,
        subscription_amount_in_cents: o.subscription_amount,
      }));

      const sortedPlans = sortBy(plans, "subscription_amount");

      setState({ type: "SET_PLANS", plans: sortedPlans });
      return sortedPlans;
    } catch (error) {
      console.error("getTiers error => ", error);
      setState({ type: "SET_ERROR", error: error });
      throw error;
    }
  };

  const fetchCurrentTier = async (tierId: string) => {
    try {
      setState({ type: "SET_LOADING", isLoading: true });
      const result = await api.fetchCurrentTier(tierId);
      const currentTier = {
        ...result,
        subscription_amount_in_cents: result.subscription_amount,
        subscription_amount: result.subscription_amount,
      };

      setState({ type: "SET_CURRENT_TIER", currentTier: currentTier });
    } catch (error) {
      console.error("getCurrentTier error => ", error);
      setState({ type: "SET_ERROR", error: error });
      throw error;
    }
  };

  const fetchPaymentCards = async () => {
    try {
      if (size(state.paymentCard) === 0) {
        setState({
          type: "SET_LOADING_PAYMENT_CARD",
          isLoadingPaymentCard: true,
        });
      }
      const result = await api.fetchPaymentCards();

      const paymentCards: PaymentCards[] = result.map(({ card }: any) => ({
        brand: card.brand,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        last4: card.last4,
      }));

      setState({
        type: "SET_PAYMENT_CARD",
        paymentCard: first(paymentCards) || null,
      });
    } catch (error) {
      console.error("getPaymentMethods error => ", error);
      setState({ type: "SET_ERROR_PAYMENT_CARD", error: error });
      throw error;
    } finally {
      setState({
        type: "SET_LOADING_PAYMENT_CARD",
        isLoadingPaymentCard: false,
      });
    }
  };

  const fetchBillingHistory = async (pageSize: number = 6) => {
    try {
      setState({
        type: "SET_LOADING_BILLING_HISTORY",
        isLoadingBillingHistory: true,
      });
      const result = await api.fetchBillingHistory(pageSize);

      const billingHistories: Invoice[] = result
        .slice(0, pageSize)
        .map((history: any) => ({
          id: history.id,
          planName: history.name,
          date: history.date,
          amount: history.amount,
          status: history.status,
        }));

      setState({
        type: "SET_BILLING_HISTORY",
        billingHistory: billingHistories,
      });
    } catch (error) {
      console.error("getBillingHistory error => ", error);
      setState({ type: "SET_ERROR_BILLING_HISTORY", error: error });
      throw error;
    } finally {
      setState({
        type: "SET_LOADING_BILLING_HISTORY",
        isLoadingBillingHistory: false,
      });
    }
  };

  const fetchUserWiseUsageList = async (searchQueryString: string) => {
    try {
      if (size(state.userWiseData) < 0) {
        setState({
          type: "SET_LOADING_USER_WISE_DATA",
          isLoadingUserWiseData: true,
        });
      }
      const { result, pagination_info } =
        await api.fetchUserWiseUsageList(searchQueryString);
      setState({
        type: "SET_USER_WISE_DATA",
        userWiseData: result,
        total: pagination_info.total_records,
      });
    } catch (error) {
      console.error("fetchEntityUsageMetrics Error:", error);
      setState({ type: "SET_ERROR_USER_WISE_DATA", errorUserWiseData: error });
    } finally {
      setState({
        type: "SET_LOADING_USER_WISE_DATA",
        isLoadingUserWiseData: false,
      });
    }
  };

  const fetchEntityUsageMetrics = async () => {
    try {
      setState({
        type: "SET_LOADING_ENTITY_USAGE_METRICS",
        isLoadingEntityUsageMetrics: true,
      });
      const result = await api.fetchEntityUsageMetrics();
      setState({
        type: "SET_ENTITY_USAGE_METRICS",
        entityUsageMetrics: result,
      });
    } catch (error) {
      console.error("fetchEntityUsageMetrics Error:", error);
      setState({
        type: "SET_ERROR_ENTITY_USAGE_METRICS",
        errorEntityUsageMetrics: error,
      });
    } finally {
      setState({
        type: "SET_LOADING_ENTITY_USAGE_METRICS",
        isLoadingEntityUsageMetrics: false,
      });
    }
  };

  const fetchSuggestedCredit = async () => {
    try {
      setState({
        type: "SET_LOADING_SUGGESTED_CREDIT",
        isLoadingSuggestedCredit: true,
      });

      const result = await api.fetchSuggestedCredit();

      setState({
        type: "SET_SUGGESTED_CREDIT",
        suggestedCredit: result,
      });
    } catch (error) {
      console.error("fetchSuggestedCredit Error:", error);
      setState({
        type: "SET_ERROR_SUGGESTED_CREDIT",
        errorSuggestedCredit: error,
      });
    } finally {
      setState({
        type: "SET_LOADING_SUGGESTED_CREDIT",
        isLoadingSuggestedCredit: false,
      });
    }
  };

  return {
    fetchTiers,
    fetchCurrentTier,
    fetchPaymentCards,
    fetchBillingHistory,
    fetchUserWiseUsageList,
    fetchEntityUsageMetrics,
    fetchSuggestedCredit,
    ...state,
  };
};

export type UsePlanPricingReturnType = ReturnType<typeof usePlanPricing>;

export default usePlanPricing;
