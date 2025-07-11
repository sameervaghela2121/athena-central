import { HOST } from "@/shared/constants";
import api from "./axiosInterceptor";

export interface Company {
  id: string;
  name: string;
  role?: string;
  domain?: string;
  is_active?: boolean;
  membership_id?: string;
  entity_id?: string;
}

export interface UserMembership {
  id: string; // This is the membership_id
  company: Company;
  company_id: string;
  entity_id: string;
  roles: string[];
  designation: string;
  joined_at: string;
}

export interface UserMembershipsResponse {
  data: {
    message: string | null;
    pagination_info: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
    result: UserMembership[];
    success: boolean;
  };
  errors: string;
  identifier: string;
  status: number;
}

export const getUserMemberships = async (): Promise<Company[]> => {
  try {
    const response = await api.get<UserMembershipsResponse>(
      `${HOST.USERS}/user-memberships/`,
    );

    if (response.data?.data?.success && response.data?.data?.result) {
      // Map the membership data to the Company interface
      return response.data.data.result.map((membership) => ({
        id: membership.company_id,
        name: membership.company.name,
        role: membership.designation || membership.roles.join(", "),
        domain: membership.company.domain,
        is_active: membership.company.is_active,
        membership_id: membership.id, // Include the membership_id
        entity_id: membership.entity_id, // Include the entity_id
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching user memberships:", error);
    return [];
  }
};

// Export as default for backward compatibility
export default {
  getUserMemberships,
};
