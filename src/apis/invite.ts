import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export interface InviteResponse {
  data: {
    message: string;
    result: {
      failed_invites: {
        email: string;
        error: string;
        invitation_id: string | null;
        role: string;
        success: boolean;
      }[];
      successful_invites: {
        email: string;
        invitation_id: string;
        role: string;
        success: boolean;
      }[];
    };
    success: boolean;
  };
  errors: string;
  identifier: string;
  status: number;
}

export default {
  sendInvites: async (
    payload: {
      email: string;
      role: string;
      reason_for_request: string;
    }[],
  ): Promise<InviteResponse> => {
    try {
      const response = await api.post(`${HOST.USERS}/invite`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getInvitations: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }) => {
    try {
      const response = await api.get(`${HOST.USERS}/invite`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  resendInvitation: async (inviteId: string) => {
    try {
      const response = await api.post(
        `${HOST.USERS}/invite/${inviteId}/resend`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
};
