import { HOST } from "@/shared/constants";
import { getToken } from "@/shared/functions";
import api from "./axiosInterceptor";

export default {
  fetchChatHistory: async () => {
    try {
      const response = await api.get(
        `${HOST.CONVERSATIONS}/conversations?page_size=100`,
      );
      return response;
    } catch (error) {
      console.log("Error Fetching Chat History", error);
      return {};
    }
  },

  fetchConversation: async (id: string, page: number) => {
    try {
      const response = await api.get(
        `${HOST.CONVERSATION_MESSAGES}/conversation-messages?conversation_id=${id}&sort_field=created_at&sort_order=desc&page=${page}`,
      );
      return response;
    } catch (error) {
      console.error("Error Fetching Conversation", error);
      return [];
    }
  },

  deleteConversation: async (id: string) => {
    try {
      const response = await api.delete(
        `${HOST.CONVERSATIONS}/conversations/${id}`,
      );
      return response;
    } catch (error) {
      console.error("Error deleting Conversation", error);
      return [];
    }
  },

  upVote: async (id: string) => {
    try {
      const { data, status } = await api.put(
        `${HOST.CONVERSATION_MESSAGES}/conversation-messages/upvote/${id}`,
      );
      return { data, status };
    } catch (error) {
      console.error("Error UpVoting", error);
      return error;
    }
  },

  downVote: async (id: string, { feedback }: { feedback: string }) => {
    try {
      const response = await api.put(
        `${HOST.CONVERSATION_MESSAGES}/conversation-messages/downvote/${id}`,
        {
          feedback,
        },
      );
      return response;
    } catch (error) {
      console.error("Error DownVoting", error);
      return error;
    }
  },
  /**
   * Handles exporting conversation in different formats with mobile webview support
   * @param id - Conversation ID to export
   * @param format - Export format (pdf or doc)
   * @returns Promise resolving to download success status
   */
  handleExport: async (id: string, format: "pdf" | "doc") => {
    try {
      const token = getToken();
      const response: any = await fetch(
        `${HOST.CONVERSATIONS}/conversations/${id}/export?format=${format}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const fileName = response.headers.get("X-Filename") || `data.${format}`;
      const blob = await response.blob();

      // Check if running in a mobile environment
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      if (isMobile) {
        // Mobile approach - use the Blob URL directly
        const url = window.URL.createObjectURL(blob);

        // Open in a new tab which generally works better on mobile
        const newWindow = window.open(url, "_blank");

        // If popup blocked or not supported
        if (!newWindow) {
          // Fallback - try to use the same window
          window.location.href = url;

          // Clean up the URL object after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 100);
        } else {
          // Clean up when the new window has loaded
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        }
      } else {
        // Desktop approach - more reliable
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      return { success: true, fileName };
    } catch (error) {
      console.error("handleExport Error:", error);
      return { success: false, error };
    }
  },

  /**
   * Delete all conversations for the current user
   * @returns Response from the API
   */
  deleteAllConversations: async () => {
    try {
      const { data } = await api.delete(
        `${HOST.CONVERSATIONS}/conversations/all`,
      );
      return data;
    } catch (error) {
      console.error("deleteAllConversations Error:", error);
      throw error;
    }
  },
};
