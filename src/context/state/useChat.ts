import { useReducer } from "react";
export interface Conversations {
  today: Today[];
  yesterday: any[];
  previous7Days: any[];
  previous30Days: any[];
}

export interface Today {
  id: string;
  created_at: Date;
  created_by: string;
  is_deleted: boolean;
  title: string;
  updated_at: Date;
  updated_by: string;
  user_id: string;
}

interface DocumentDetails {
  file_name: string;
  file_url: string;
  page: number;
  signed_url: string;
}
interface State {
  conversations: Conversations | null;
  showFeedBack: boolean;
  showDocument: boolean;
  documentDetails: DocumentDetails;
  downVoteId: string;
  knowledge_entry_id: string;
  isShowRetrievalDocs: boolean;
  retrievalDocs: {
    relatedDocuments: any[];
    sourceDocuments: any[];
  };
}

const initialState: State = {
  conversations: null,
  showFeedBack: false,
  showDocument: false,
  documentDetails: {
    file_name: "",
    file_url: "",
    page: 1,
    signed_url: "",
  },
  knowledge_entry_id: "",
  downVoteId: "",
  isShowRetrievalDocs: false,
  retrievalDocs: {
    relatedDocuments: [],
    sourceDocuments: [],
  },
};

type Action =
  | { type: "SET_CONVERSATIONS"; payload: Conversations | null }
  | { type: "ADD_CONVERSATION_TO_TODAY"; payload: Today }
  | { type: "SET_SHOW_FEEDBACK"; payload: boolean }
  | { type: "SET_SHOW_DOCUMENT"; payload: boolean }
  | { type: "SET_DOCUMENT_DETAILS"; payload: any }
  | { type: "SET_DOWNVOTE_ID"; payload: string }
  | { type: "SET_SHOW_RETRIEVAL_DOCS"; payload: boolean }
  | { type: "SET_RETRIEVAL_DOCS"; payload: any };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload };
    case "ADD_CONVERSATION_TO_TODAY":
      return {
        ...state,
        conversations: {
          ...state.conversations,
          today: [action.payload, ...(state.conversations?.today || [])].filter(
            (item): item is Today => item !== null,
          ),
          yesterday: state.conversations?.yesterday || [],
          previous7Days: state.conversations?.previous7Days || [],
          previous30Days: state.conversations?.previous30Days || [],
        },
      };
    case "SET_SHOW_FEEDBACK":
      return { ...state, showFeedBack: action.payload };
    case "SET_SHOW_DOCUMENT":
      return { ...state, showDocument: action.payload };
    case "SET_DOCUMENT_DETAILS":
      return {
        ...state,
        documentDetails: action.payload.documentDetails,
        knowledge_entry_id: action.payload.knowledge_entry_id,
      };
    case "SET_DOWNVOTE_ID":
      return { ...state, downVoteId: action.payload };
    case "SET_SHOW_RETRIEVAL_DOCS":
      return { ...state, isShowRetrievalDocs: action.payload };
    case "SET_RETRIEVAL_DOCS":
      return { ...state, retrievalDocs: action.payload };
    default:
      return state;
  }
};

const useChats = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setConversations = (conversations: Conversations | null) =>
    dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
  const resetConversations = () =>
    dispatch({
      type: "SET_CONVERSATIONS",
      payload: initialState.conversations,
    });
  const setShowFeedBack = (show: boolean) =>
    dispatch({ type: "SET_SHOW_FEEDBACK", payload: show });
  const setShowDocument = (show: boolean) =>
    dispatch({ type: "SET_SHOW_DOCUMENT", payload: show });
  const setDocumentDetails = (details: any) =>
    dispatch({ type: "SET_DOCUMENT_DETAILS", payload: details });
  const setDownVoteId = (id: string) =>
    dispatch({ type: "SET_DOWNVOTE_ID", payload: id });
  const addConversationToToday = (conversation: Today) =>
    dispatch({ type: "ADD_CONVERSATION_TO_TODAY", payload: conversation });
  const setShowRetrievalDocs = (show: boolean) =>
    dispatch({ type: "SET_SHOW_RETRIEVAL_DOCS", payload: show });
  const setRetrievalDocs = (docs: any) =>
    dispatch({ type: "SET_RETRIEVAL_DOCS", payload: docs });

  return {
    ...state,
    setConversations,
    resetConversations,
    setShowFeedBack,
    setShowDocument,
    setDocumentDetails,
    setDownVoteId,
    addConversationToToday,
    setShowRetrievalDocs,
    setRetrievalDocs,
  };
};

export type UseChatsReturnType = ReturnType<typeof useChats>;
export default useChats;
