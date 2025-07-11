import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";

import { HOST } from "@/shared/constants";
import { getToken, resetAllStorage } from "@/shared/functions";

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: HOST.QUESTIONS,
});

// Map to store pending requests
const pendingRequests = new Map<string, AbortController>();

/**
 * Generate a unique request key based on request config
 * @param config Axios request configuration
 * @returns Unique request identifier
 */
const getRequestKey = (config: AxiosRequestConfig): string => {
  const { method, url, params, data } = config;
  return `${method}-${url}-${JSON.stringify(params || {})}-${JSON.stringify(data || {})}`;
};

/**
 * Cancel any pending requests with the same key
 * @param config Axios request configuration
 */
const cancelPendingRequests = (config: AxiosRequestConfig): void => {
  const requestKey = getRequestKey(config);
  if (pendingRequests.has(requestKey)) {
    const controller = pendingRequests.get(requestKey);
    controller?.abort();
    pendingRequests.delete(requestKey);
    console.log(`Request canceled: ${requestKey}`);
  }
};

// Request interceptor
api.interceptors.request.use(
  async (config: any) => {
    // Cancel any pending requests with the same signature
    cancelPendingRequests(config);

    // Create a new AbortController for this request
    const controller = new AbortController();
    config.signal = controller.signal;

    // Store the controller in the map
    const requestKey = getRequestKey(config);
    pendingRequests.set(requestKey, controller);

    const token = getToken();

    // Add authorization header with the access token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      
      // Add company ID header for SaaS deployment if available
      const selectedCompanyId = localStorage.getItem("selected_company_id");
      const deploymentType = import.meta.env.VITE_DEPLOYMENT_TYPE;
      
      if (deploymentType === 'saas' && selectedCompanyId) {
        config.headers["X-Company-ID"] = selectedCompanyId;
      }
      
      return config;
    } else {
      resetAllStorage();
      // window.location.href = "/login";
    }
  },
  (error: AxiosError) => {
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Remove the request from pending requests map on successful response
    const requestKey = getRequestKey(response.config);
    if (pendingRequests.has(requestKey)) {
      pendingRequests.delete(requestKey);
    }

    return Promise.resolve(response);
  },
  async (error: any) => {
    // Don't process aborted requests as errors
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
      return Promise.reject(error);
    }

    // Remove the request from pending requests map on error
    if (error.config) {
      const requestKey = getRequestKey(error.config);
      if (pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
      }
    }

    if (error.response && error.response.status === 440) {
      resetAllStorage();
      window.location.href = "/login";
    } else if (error.response && error.response.status === 429) {
      toast.error(
        "You have reached the maximum number of requests allowed. Please wait a while before trying again. If you believe this is an error, please contact support.",
        {
          id: "RATE_LIMIT_EXCEEDED",
        },
      );
    } else if (error.code === "ERR_NETWORK") {
      // toast.error(
      //   "Oops! We're having trouble connecting to the server right now. Please try again in a few moments. If the issue persists, contact support.",
      //   {
      //     id: "ERR_NETWORK",
      //   },
      // );
    } else {
      // TODO:Refresh Token Handling
      console.error("Response Interceptor Error:", error);
    }

    return Promise.reject(error);
  },
);

export default api;
