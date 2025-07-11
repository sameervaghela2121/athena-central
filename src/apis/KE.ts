import { HOST } from "@/shared/constants";
import { getToken } from "@/shared/functions";
import { get, trim } from "lodash-es";
import api from "./axiosInterceptor";

export default {
  /**
   * Fetch knowledge entries with automatic request cancellation
   * @param queryString Query parameters for filtering KEs
   * @returns API response with knowledge entries
   */
  getKEs: async (queryString: string) => {
    try {
      const result = await api.get(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries?${queryString}`,
      );

      return result;
    } catch (error) {
      console.error("getKEs Error:", error);
      throw error;
    }
  },

  /**
   * Delete all knowledge entries for the current user
   * @returns Response from the API
   */
  deleteAllKEs: async () => {
    try {
      const result = await api.delete(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/delete-all`,
      );
      return result;
    } catch (error) {
      console.error("deleteAllKEs Error:", error);
      throw error;
    }
  },

  getSignURLs: async (payload: any) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/document-entries/generate-signed-urls`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  getDocumentId: async (payload: any) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/document-entries`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  createBulkKE: async (payload: any) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/bulk`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  saveBulkKE: async (payload: any) => {
    try {
      const result = await api.put(
        `${HOST.KNOWLEDGE_ENTRIES}/document-entries/bulk`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  createDocument: async (payload: any) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/document-entries/create-document`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  submitKE: async (payload: any) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateKE: async (id: string, payload: any) => {
    try {
      const result = await api.put(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/${id}`,
        payload,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  generateDocumentChunk: async (documentIds: string[]) => {
    try {
      // Create an array of API call promises
      const promises = documentIds.map((id) =>
        api.post(
          `${HOST.DOCUMENT_PROCESSING_HOST_URL}/documents_processing/${id}`,
        ),
      );

      // Wait for all API calls to complete
      const result = await Promise.all(promises);

      return result;
    } catch (error) {
      throw error;
    }
  },

  removeKE: async (id: string) => {
    try {
      const result = await api.delete(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/${id}`,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  toggleLockKE: async (id: string, status: "lock" | "unlock") => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/${status}/${id}`,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  getKEById: async (id: string) => {
    try {
      const result = await api.get(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/${id}`,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  getKEDraftVersion: async (id: string) => {
    try {
      const { data, status } = await api.get(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/draft-revision/${id}`,
      );

      return { data, status };
    } catch (error) {
      throw error;
    }
  },

  removeDocuments: async (ids: string[]) => {
    try {
      const result = await api.delete(
        `${HOST.KNOWLEDGE_ENTRIES}/document-entries?ids=${ids}`,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },

  updateActivityOnKE: async (id: string) => {
    try {
      const result = await api.post(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/heartbeat/${id}`,
      );

      return result;
    } catch (error) {
      throw error;
    }
  },
  fetchUsersCountByAttribute: async (payload: any) => {
    try {
      const { data } = await api.post(
        `${HOST.USERS}/admin/groups/filter-users`,
        payload,
      );

      return get(data, "data", {});
    } catch (error) {
      throw error;
    }
  },
  fetchDocumentProcessingStatus: async () => {
    try {
      const { data } = await api.get(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/processing-stats`,
      );

      return get(data, "data.result", {});
    } catch (error) {
      throw error;
    }
  },
  fetchKEsProcessingStatus: async () => {
    try {
      const { data } = await api.get(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/ke-status-counts`,
      );

      return get(data, "data.result", {});
    } catch (error) {
      throw error;
    }
  },
  downloadTranscript: async (id: string, format: "txt" | "docx" = "docx") => {
    try {
      const token = getToken();
      const response: any = await fetch(
        `${HOST.KNOWLEDGE_ENTRIES}/knowledge-entries/download-transcript/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const fileName =
        response.headers
          .get("Content-Disposition")
          ?.split("=")[1]
          .split(";")[0] || `data.${format}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = trim(fileName, '"');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting conversation:", error);
    }
  },
};
