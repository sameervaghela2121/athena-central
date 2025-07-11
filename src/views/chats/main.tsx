import axios from "axios";
import { motion } from "framer-motion";
import { cloneDeep, get, includes, map, size, trim } from "lodash-es";
import moment from "moment";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  NavLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";

import api from "@/apis/axiosInterceptor";
import request from "@/apis/chats";
import usersApi from "@/apis/users";
import allImgPaths from "@/assets";
import {
  AIBotResponseLoading,
  AlertBanner,
  ButtonV2,
  Divider,
  LoaderCircle,
  Modal,
  NoRecord,
  Tooltip,
} from "@/components";
import { useAppState } from "@/context";
import { RootState } from "@/context/useAppState";
import { useTranslate, useWindowSize } from "@/hooks";
import { CHAT_DATE_RANGE, HOST, ROLES } from "@/shared/constants";
import { convertISTRangeToUTC, getToken } from "@/shared/functions";
import RejectQuestionForm from "../supports/components/RejectQuestionForm";
import Reroute from "../supports/components/Reroute";
import RetrievalDocs from "./RetrievalDocs";
import {
  ChatInput,
  ChatText,
  DocumentViewer,
  DownVoteFeedBack,
} from "./components";
import { DateRange } from "./components/ChatInput";

const Chat = ({
  conversationId: sessionId = "",
  history = false,
}: {
  conversationId?: string;
  history?: boolean;
}) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isNew = queryParams.get("isNew") || "false";
  const questionId = queryParams.get("questionId") || "";
  const title = queryParams.get("title") || "";
  const pageParam = queryParams.get("page") || "";
  const messageId = queryParams.get("msgId") || "";

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingNewMessage, setIsLoadingNewMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [isSearchingMessage, setIsSearchingMessage] = useState(false);
  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set([1])); // Track pages already fetched

  const [showReject, setShowReject] = useState(false); // REJECT
  const [showReroute, setShowReroute] = useState(false); // REROUTE

  const [hideChatToast, setHideChatToast] = useState(false);
  const [isCreditAvailable, setIsCreditAvailable] = useState<boolean>(true);
  const [isNotified, setIsNotified] = useState<boolean>(
    sessionStorage.getItem("isNotified") === "true",
  );

  const [chatFilter, setChatFilter] = useState<{
    fileType: Record<string, string[]>;
    dateRange: DateRange;
  }>({
    fileType: {},
    dateRange: CHAT_DATE_RANGE[0],
  });

  const [isScrolling, setIsScrolling] = useState(true);

  // Chat progress tracking states
  const [progressStage, setProgressStage] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const cancelTokenRef = useRef<AbortController | null>(null);

  const params: any = useParams();
  const navigate = useNavigate();
  const { translate } = useTranslate();
  const [, setSearchParams] = useSearchParams();

  const [conversationId, setConversationId] = useState(
    sessionId ? sessionId : params.id,
  );

  /**
   * Track previous error state to detect when error is cleared
   */
  const prevErrorRef = useRef<string | null>(null);
  const timeoutRef = useRef<any>(null);
  const scrollRef = useRef<any>(null);

  const { width } = useWindowSize();

  const {
    showFeedBack,
    showDocument,
    setShowDocument,
    addConversationToToday,
    isShowRetrievalDocs,
    setShowRetrievalDocs,
    retrievalDocs,
  } = useAppState(RootState.CHATS);
  const {
    user: { id = "", role },
    isAdmin,
    entity,
  } = useAppState(RootState.AUTH);
  const { notifyAdmin, isNotifying } = useAppState(RootState.USERS);

  const { name }: any = entity || {};
  let eventSource: any = null;
  let startTime: any = null;
  let eventCount: number = 0;
  let timeInterval: any = null;

  // Event queue for delayed processing
  const eventQueue: Array<{ eventName: string; eventData: string }> = [];
  let isProcessingQueue = false;

  var interval: ReturnType<typeof setInterval> | undefined | null = null;

  /**
   * Process events from the queue with a delay between each event
   */
  const processEventQueue = () => {
    if (eventQueue.length === 0 || isProcessingQueue) {
      return;
    }

    isProcessingQueue = true;
    const { eventName, eventData } = eventQueue.shift()!;

    // Process the event
    handleEvent(eventName, eventData);

    // Schedule processing of next event with delay
    setTimeout(() => {
      isProcessingQueue = false;
      if (eventQueue.length > 0) {
        processEventQueue();
      }
    }, 1000); // 1 second delay between processing events
  };

  /**
   * Add event to queue instead of processing immediately
   */
  const queueEvent = (eventName: string, eventData: string) => {
    eventQueue.push({ eventName, eventData });
    processEventQueue();
  };

  function setupEventHandlers() {
    if (!eventSource) return;

    // Generic event handler
    eventSource.onmessage = (event: any) => {
      console.info("event.data => ", event.data);
      queueEvent("message", event.data);
    };

    // Specific event handlers
    const events = [
      // "connected",
      "conversation_created",
      "process_started",
      "retrieving_documents",
      "retrieved_documents",
      "answer_generation",
      "response_completed",
      // "storing_history",
      "final_result",
      // "completed",
      "error",
      // "timeout",
    ];

    events.forEach((eventName) => {
      eventSource.addEventListener(eventName, (event: any) => {
        queueEvent(eventName, event.data);
      });
    });
  }

  function handleEvent(eventName: any, eventDataStr: any) {
    eventCount++;

    let eventData: any = {};
    try {
      eventData = JSON.parse(eventDataStr);
    } catch (e) {
      eventData = { raw: eventDataStr };
    }
    console.info("eventName =>", eventName);

    switch (eventName) {
      case "connected":
        console.log("chat event:" + `✅ Connected to stream`, "connected");
        setProgressStage("connected");
        setProgressMessage(translate("chats.progress.connectedMessage"));
        if (eventData.session_id) {
          console.log(
            "chat event:" + `   Session ID: ${eventData.session_id}`,
            "info",
          );
        }
        break;

      case "conversation_created":
        console.log(
          "chat event:" +
            `📝 Conversation created: ${eventData.conversation_id || "N/A"}`,
          "info",
        );
        setProgressStage("conversation_created");
        setProgressMessage(
          translate("chats.progress.conversationCreatedMessage"),
        );
        if (eventData.conversation_id) {
          setConversationId(eventData.conversation_id);
          // Redirect to the new conversation without affecting useEffect dependencies
          // This will navigate immediately without waiting for state updates
          if (window.location.pathname.includes("/chats")) {
            navigate(`/chats/${eventData.conversation_id}?isNew=true`);
          }
        }
        break;

      case "process_started":
        console.log("chat event:" + `🔄 Process started`, "process_started");
        setProgressStage("process_started");
        setProgressMessage(translate("chats.progress.processingMessage"));
        if (eventData.question) {
          console.log(
            "chat event:" + `   Question: "${eventData.question}"`,
            "info",
          );
        }
        if (eventData.document_type) {
          console.log(
            "chat event:" +
              `   Document Type: ${JSON.stringify(eventData.document_type)}`,
            "info",
          );
        }
        break;

      case "retrieving_documents":
        console.log(
          "chat event:" + `🔍 Retrieving documents...`,
          "retrieving_documents",
        );
        setProgressStage("retrieving_documents");
        setProgressMessage(translate("chats.progress.retrievingDocsMessage"));
        if (eventData.query) {
          console.log("chat event:" + `   Query: "${eventData.query}"`, "info");
        }
        if (eventData.document_type) {
          console.log(
            "chat event:" +
              `   Document Type: ${JSON.stringify(eventData.document_type)}`,
            "info",
          );
        }
        console.log(
          "chat event:" +
            `   Time Range: ${eventData.start_time || "N/A"} to ${eventData.end_time || "N/A"}`,
          "info",
        );
        break;

      case "retrieved_documents":
        console.log(
          "chat event:" + `📚 Retrieved documents:`,
          "retrieved_documents",
        );
        const relevantCount = eventData.relevant_count || 0;
        const relatedCount = eventData.related_count || 0;

        console.info("retrieved_documents =>", eventData);

        setProgressStage("retrieved_documents");

        if (relevantCount > 0 && relatedCount > 0) {
          setProgressMessage(
            `Found ${relevantCount} relevant and ${relatedCount} related documents`,
          );
        } else if (relevantCount > 0) {
          setProgressMessage(`Found ${relevantCount} relevant documents`);
        } else if (relatedCount > 0) {
          setProgressMessage(`Found ${relatedCount} related documents`);
        } else {
          setProgressMessage("No relevant or related documents found");
        }

        console.log(
          "chat event:" +
            `   Relevant: ${relevantCount} | Related: ${relatedCount}`,
          "info",
        );

        // Display document details
        if (
          eventData.relevant_documents &&
          eventData.relevant_documents.length > 0
        ) {
          console.log("chat event:" + `   📄 Top relevant documents:`, "info");
          eventData.relevant_documents
            .slice(0, 3)
            .forEach((doc: any, i: number) => {
              const title = doc.ke_title || doc.file_name || "Unknown";
              const score = doc.score || 0;
              console.log(
                "chat event:" +
                  `<div class="document-details">${i + 1}. ${title} (Score: ${score.toFixed(3)})</div>`,
                "info",
              );
            });
        }
        break;

      case "answer_generation":
        console.log(
          "chat event:" + `🤖 Generating answer...`,
          "answer_generation",
        );
        setProgressStage("answer_generation");
        setProgressMessage(translate("chats.progress.generatingAnswerMessage"));

        if (eventData.context_length) {
          console.log(
            "chat event:" +
              `   Context: ${eventData.context_length} characters`,
            "info",
          );
        }
        if ("has_chat_history" in eventData) {
          console.log(
            "chat event:" +
              `   Chat history: ${eventData.has_chat_history ? "Yes" : "No"}`,
            "info",
          );
        }
        break;

      case "response_completed":
        if (eventData.success) {
          console.log(
            "chat event:" + `✅ Response completed successfully`,
            "response_completed",
          );
          setProgressStage("response_completed");
          setProgressMessage(
            translate("chats.progress.responseCompletedMessage"),
          );

          const answer = eventData.answer || "N/A";

          console.log(
            "chat event:" +
              `   💬 Answer: "${answer.substring(0, 150)}${answer.length > 150 ? "..." : ""}"`,
            "info",
          );
          console.log(
            "chat event:" +
              `   📊 Documents - Source: ${eventData.source_documents?.length || 0}, Related: ${eventData.related_documents?.length || 0}`,
            "info",
          );

          if (eventData.tokens && typeof eventData.tokens === "object") {
            console.log(
              "chat event:" +
                `   🎯 Tokens - Input: ${eventData.tokens.input_tokens || 0}, Output: ${eventData.tokens.output_tokens || 0}`,
              "info",
            );
          }
        }
        break;

      case "final_result":
        {
          console.log(
            "chat event:" + `🎯 Final Result received`,
            "final_result",
          );
          console.info("eventData =>", eventData);

          setProgressStage(null);
          setProgressMessage("");

          const answer = eventData.answer || "N/A";
          const source_documents = eventData.source_documents || [];
          const related_documents = eventData.related_documents || [];
          console.info("xxxx source_documents =>", source_documents);
          console.info("xxxx related_documents =>", related_documents);

          const id = get(eventData, "id", "");

          setIsTyping(true);

          console.info(
            'get(eventData, "source_documents", []) =>',
            get(eventData, "source_documents", []),
          );
          setMessages((prevMessages) => {
            // Check if the first message already exists
            const isFirstMessagePresent =
              prevMessages.length > 0 && prevMessages[0].id === id;

            if (isFirstMessagePresent) {
              // Update the first message
              const updatedMessages = [...prevMessages];
              updatedMessages[0] = {
                ...updatedMessages[0],
                answer: answer,
                source_documents: source_documents,
                related_documents: related_documents,
                sender: "bot",
              };
              return updatedMessages;
            } else {
              // Push the new message to the beginning
              return [
                {
                  id,
                  answer: answer,
                  name: "AthenaPro Ai",
                  source_documents: source_documents,
                  related_documents: related_documents,
                  langsmith_shared_url: get(eventData, "shared_url", ""),
                  sender: "bot",
                  shouldType: true,
                },
                ...prevMessages,
              ];
            }
          });

          setIsTyping(false);

          // Clear progress indicators once the final result is processed
          setTimeout(() => {
            setProgressStage(null);
            setProgressMessage("");
          }, 1000);

          if (!conversationId) {
            if (get(eventData, "conversation.id", "")) {
              // navigate to this path only when user is on "/chats" path
              // url change without page reload
              console.info(
                "eventData.conversation.id =>",
                eventData.conversation.id,
              );

              if (window.location.pathname.includes("/chats")) {
                // navigate(`/chats/${eventData.conversation.id}?isNew=true`);
              }
            }
            // addConversationToToday(eventData.conversation);
          }
        }
        break;

      case "completed":
        console.log(
          "chat event:" + `✅ Stream completed successfully`,
          "connected",
        );
        // Clear progress indicators
        setProgressStage(null);
        setProgressMessage("");
        stopSSE();
        break;

      case "error":
        // console.log(
        //   "chat event:" +
        //     `❌ Error: ${eventData.error || JSON.stringify(eventData)}`,
        //   "error",
        // );
        // setProgressStage("error");
        // setProgressMessage(
        //   eventData.error || translate("chats.progress.errorMessage"),
        // );

        // Clear progress indicators after a delay
        // setTimeout(() => {
        //   setProgressStage(null);
        //   setProgressMessage("");
        // }, 3000);

        stopSSE();
        break;

      case "timeout":
        console.log("chat event:" + `⏱️ Session timed out`, "error");
        setProgressStage("timeout");
        setProgressMessage(translate("chats.progress.timeoutMessage"));

        // Clear progress indicators after a delay
        setTimeout(() => {
          setProgressStage(null);
          setProgressMessage("");
        }, 3000);

        stopSSE();
        break;

      default:
        console.log(
          "chat event:" + `❓ ${eventName}: ${JSON.stringify(eventData)}`,
          "info",
        );
    }
  }

  function stopSSE() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    if (timeInterval) {
      clearInterval(timeInterval);
      timeInterval = null;
    }

    // Clear any remaining events in the queue
    while (eventQueue.length > 0) {
      eventQueue.pop();
    }
    isProcessingQueue = false;

    const elapsed = startTime
      ? ((Date.now() - startTime) / 1000).toFixed(2)
      : "0";
    console.log(
      `\n📊 Summary: Received ${eventCount} events in ${elapsed} seconds`,
      "info",
    );
  }

  /**
   * Sends a query to the chat API and processes the response
   * @param query - The user's question to be sent to the chat API
   */
  const sendQuery = async (query: {
    question: string;
    fileType: string[];
    dateRange: DateRange;
  }) => {
    try {
      const { startDate, endDate } = convertISTRangeToUTC(
        query.dateRange.startDate,
        query.dateRange.endDate,
      );

      const payload: any = {
        question: query.question,
        document_type: size(query.fileType) > 0 ? query.fileType : "all",
        start_time: query.dateRange.startDate ? startDate : "",
        end_time: query.dateRange.endDate ? endDate : "",
        enable_sse: true,
      };

      // Cancel previous requests
      if (cancelTokenRef.current) cancelTokenRef.current.abort();

      // Create a new abort controller
      cancelTokenRef.current = new AbortController();
      const signal = cancelTokenRef.current.signal;

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const { data } = await api.post(`${HOST.CHAT}/chat/sse/chat`, payload, {
        signal,
      });
      const streamEndpoint = get(data, "data.result.sse_endpoint", "");

      console.info("streamEndpoint =>", streamEndpoint);

      const streamUrl = `${HOST.CHAT}${streamEndpoint}?token=${getToken()}`;
      console.info("streamUrl =>", streamUrl);

      // Start SSE connection with token in URL
      eventSource = new EventSource(streamUrl);

      // Set up event listeners
      eventSource.onopen = () => {
        console.info("🎧 Connected! Listening for events...", "connected");
        setupEventHandlers();
      };

      eventSource.onerror = (error: any) => {
        console.error("SSE Error:", error);
        console.error(`❌ Connection error occurred`, "error");

        // Check if the connection is closed
        if (eventSource.readyState === EventSource.CLOSED) {
          console.error("❌ Connection closed by server", "error");
        }
      };

      eventSource.onmessage = (event: any) => {
        console.info("Message received:", event.data);
      };

      // const answer = get(data, "data.answer", "");
      // const chatUsageStatus = get(data, "data.usage_status", "");

      // if (chatUsageStatus === "EXHAUSTED") {
      //   setIsCreditAvailable(false);
      //   if (!answer) {
      //     return;
      //   } else {
      //     console.error("Chat usage limit reached");
      //   }
      // }

      // const id = get(data, "data.id", "");

      // setIsTyping(true);

      // setMessages((prevMessages) => {
      //   // Check if the first message already exists
      //   const isFirstMessagePresent =
      //     prevMessages.length > 0 && prevMessages[0].id === id;

      //   if (isFirstMessagePresent) {
      //     // Update the first message
      //     const updatedMessages = [...prevMessages];
      //     updatedMessages[0] = {
      //       ...updatedMessages[0],
      //       answer: answer,
      //     };
      //     return updatedMessages;
      //   } else {
      //     // Push the new message to the beginning
      //     return [
      //       {
      //         id,
      //         answer: answer,
      //         name: "AthenaPro Ai",
      //         source_documents: get(data, "data.source_documents", []),
      //         related_documents: get(data, "data.related_documents", []),
      //         langsmith_shared_url: get(data, "data.shared_url", ""),
      //         shouldType: true,
      //       },
      //       ...prevMessages,
      //     ];
      //   }
      // });

      // setIsTyping(false);

      // if (!conversationId) {
      //   if (get(data, "data.conversation.id", "")) {
      //     // navigate to this path only when user is on "/chats" path
      //     if (window.location.pathname.includes("/chats")) {
      //       navigate(`/chats/${data.data.conversation.id}?isNew=true`);
      //     }
      //   }
      //   addConversationToToday(data.data.conversation);
      // }
    } catch (error: any) {
      console.error("sendQuery Error:", error);

      if (axios.isCancel(error)) {
        console.log("sendQuery => Request canceled");
        return; // No need to show error message for canceled requests
      }

      // Add error message to chat
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        translate("common.errorMessages.chatApiFailure");

      // setMessages((prevMessages) => [
      //   {
      //     id: `error-${Date.now()}`,
      //     answer: errorMessage,
      //     name: "Athena Pro Ai",
      //     source_documents: [],
      //     langsmith_shared_url: "",
      //     isError: true,
      //     shouldType: false,
      //   },
      //   ...prevMessages,
      // ]);

      // Notify user of error
      toast.error(errorMessage);

      // set isError into url
      queryParams.set("isError", "true");
      setSearchParams(queryParams);
    } finally {
      setIsTyping(false);
      setIsLoadingNewMessage(false);
    }
  };

  /**
   * Handles form submission with user question
   * @param data - Form data containing the question
   */
  const onSubmit = async (data: {
    question: string;
    fileType: string[];
    dateRange: DateRange;
  }) => {
    console.info("data =>", data);
    const { question, fileType, dateRange } = data;

    if (!question) {
      toast.error("Please enter a question");
      return;
    }

    try {
      if (!isTyping && !isLoadingNewMessage) {
        setIsLoadingNewMessage(true);

        // trim the question before using it
        const trimmedQuestion = trim(question);

        setMessages((prev: any) => {
          const result = [
            {
              id: "",
              answer: trimmedQuestion,
              name: "AthenaPro Ai",
              source_documents: [],
              related_documents: [],
              sender: "user",
            },
          ].concat(prev);
          return result;
        });
        const element = document.getElementById(
          "chat-input",
        ) as HTMLTextAreaElement;
        if (element) {
          // Reset to default height first
          element.style.height = "28px";
        }
        getChatIntoView("visibilityRef", "smooth");
        sendQuery({ question: trimmedQuestion, fileType, dateRange });
      }
    } catch (error) {
      console.error("onSubmit Error:", error);
    }
  };

  /**
   * Resizes a textarea element based on its content
   * @param id - The ID of the textarea element to resize
   */
  const resizeElement = (id: string) => {
    const element = document.getElementById(id) as HTMLTextAreaElement;
    if (element) {
      // Reset to default height first
      element.style.height = "28px";

      // If there's content, adjust height based on scrollHeight
      if (element.value.trim()) {
        element.style.height = `${element.scrollHeight}px`;
      }
    }
  };

  /**
   * Updates the page number to fetch more messages
   */
  const updatePageNumber = () => {
    setPage((prev) => prev + 1);
  };

  /**
   * Scrolls up and fetches old messages until a specific message ID is found
   * @param messageId - The ID of the message to find
   */
  const findMessageById = async (messageId: string) => {
    if (!conversationId || !messageId) {
      toast.error(
        "Cannot search for message: Missing conversation or message ID",
      );
      return;
    }

    try {
      setIsSearchingMessage(true);

      // First check if the message is already loaded
      const messageExists = messages.some((msg) => msg.id === messageId);
      if (messageExists) {
        // Message is already loaded, scroll to it
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth" });
          // Highlight the message temporarily
          messageElement.classList.add("bg-secondary-100");
          setTimeout(() => {
            messageElement.classList.remove("bg-secondary-100");
          }, 2000);
          return;
        }
      }

      // If message is not loaded, fetch more messages until found
      let messageFound = false;
      let attempts = 0;
      const maxAttempts = 10; // Limit the number of API calls to prevent infinite loops

      // Get a copy of the current fetchedPages
      const currentFetchedPages = new Set(Array.from(fetchedPages));

      // Start from the next page that hasn't been fetched yet
      let nextPage = page + 1;
      while (
        currentFetchedPages.has(nextPage) &&
        nextPage < page + maxAttempts
      ) {
        nextPage++;
      }

      while (!messageFound && hasMoreMessages && attempts < maxAttempts) {
        attempts++;

        // Skip pages we've already fetched
        if (fetchedPages.has(nextPage)) {
          nextPage++;
          continue;
        }

        console.log(`Fetching page ${nextPage} for message search`);

        // Mark this page as fetched
        setFetchedPages((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.add(nextPage);
          return newSet;
        });

        // Fetch the next page of messages
        const conversation: any = await request.fetchConversation(
          conversationId,
          nextPage,
        );
        const response = cloneDeep(conversation.data.data);

        // Check if we have more pages to fetch
        setHasMoreMessages(response?.pagination_info?.has_next);

        // Check if the message is in this batch
        messageFound = response?.result?.some(
          (msg: any) => msg.id === messageId,
        );

        // Add the new messages to the state
        if (response?.result?.length) {
          setMessages((prevMessages) => {
            return [...prevMessages, ...response.result];
          });

          // Update the page number only if this is the highest page we've fetched
          if (nextPage > page) {
            setPage(nextPage);
          }

          // If message is found, wait for DOM update and then scroll to it
          if (messageFound) {
            setTimeout(() => {
              const messageElement = document.getElementById(
                `message-${messageId}`,
              );
              if (messageElement) {
                messageElement.scrollIntoView({ behavior: "smooth" });
                // Highlight the message temporarily
                messageElement.classList.add("bg-secondary-100");
                setTimeout(() => {
                  messageElement.classList.remove("bg-secondary-100");
                }, 2000);
              }
            }, 100);
            break;
          }
        } else {
          // No more messages to load
          break;
        }

        // Move to the next page
        nextPage++;
      }

      if (!messageFound) {
        toast.error("Message not found in conversation history");
      }
    } catch (error) {
      console.error("findMessageById Error:", error);
      toast.error("Error searching for message");
    } finally {
      setIsSearchingMessage(false);
    }
  };

  /**
   * Handle message search when messageId is present in URL
   * and messages are loaded
   */
  useEffect(() => {
    // Only proceed if we have both a messageId and messages are loaded
    if (messageId && messages.length > 0 && !isLoading) {
      // Search for the message
      findMessageById(messageId);

      // Clean up the URL by removing the messageId parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("msgId");
      window.history.replaceState({}, "", url.toString());
    }
  }, [messageId, messages, isLoading, conversationId]);

  const checkChatStatus = async () => {
    try {
      const result = await usersApi.getEntityUsageStatus();
      console.info("result =>", result);

      if (result) {
        setIsCreditAvailable(true);
      } else {
        setIsCreditAvailable(false);
      }
    } catch (error) {
      console.error("checkChatStatus error", error);
    }
  };

  useEffect(() => {
    if (entity) {
      checkChatStatus();
    }
  }, [id, entity]);

  const getChatIntoView = (id: string, scrollBehavior: ScrollBehavior) => {
    setTimeout(() => {
      const visibilityRef = document.getElementById(id);
      if (visibilityRef) {
        visibilityRef.scrollIntoView({ behavior: scrollBehavior });
      }
    }, 500);
  };

  /**
   * Fetches conversation messages for a specific page
   * @param id - Conversation ID
   * @param pageNumber - Page number to fetch
   */
  const fetchConversation = async (id: string, pageNumber: number) => {
    // Skip if we've already fetched this page
    if (fetchedPages.has(pageNumber) && pageNumber > 1) {
      console.log(`Skipping already fetched page ${pageNumber}`);
      return;
    }

    try {
      setIsLoading(true);
      setInitialFetchAttempted(true);

      // Add this page to our tracking set
      setFetchedPages((prev) => {
        const newSet = new Set(prev);
        newSet.add(pageNumber);
        return newSet;
      });

      const conversation: any = await request.fetchConversation(id, pageNumber);
      const response = cloneDeep(conversation.data.data);
      setHasMoreMessages(response?.pagination_info?.has_next);

      if (response?.result?.length) {
        if (pageNumber === 1) {
          setMessages(response.result);
        } else {
          setMessages((prevMessages) => {
            return [...prevMessages, ...response.result];
          });
        }
      }
    } catch (error) {
      console.error("fetchConversation Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cancelTokenRef.current) cancelTokenRef.current.abort();
    if (interval) clearInterval(interval);
    setPage(1);
    setFetchedPages(new Set([1])); // Reset fetched pages when conversation changes

    setIsLoadingNewMessage(false);
    setIsTyping(false);
    setShowRetrievalDocs(false);

    checkChatStatus();

    // reset the filter on new chat
    setChatFilter({
      fileType: {},
      dateRange: CHAT_DATE_RANGE[0],
    });
    if (conversationId) {
      fetchConversation(conversationId, 1);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) cancelTokenRef.current.abort();
      setIsTyping(false);
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setConversationId(params.id);
    setHideChatToast(false);
  }, [params.id]);

  useEffect(() => {
    if (conversationId && page > 1) {
      fetchConversation(conversationId, page);
    }
  }, [page]);

  /**
   * Search for the target message after initial messages are loaded
   */
  useEffect(() => {
    // Only search if we have a conversation ID, a message ID, and messages have been loaded
    if (conversationId && messageId && messages.length > 0 && !isLoading) {
      // Check if the message is already in the loaded messages
      const messageExists = messages.some((msg) => msg.id === messageId);

      if (messageExists) {
        // If the message is already loaded, scroll to it
        setTimeout(() => {
          const messageElement = document.getElementById(
            `message-${messageId}`,
          );
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: "smooth" });
            // Highlight the message temporarily
            messageElement.classList.add("bg-secondary-100");
            setTimeout(() => {
              messageElement.classList.remove("bg-secondary-100");
            }, 3000);
          }
        }, 500); // Give time for the DOM to render
      } else {
        // If the message is not loaded, search for it
        findMessageById(messageId);
      }

      // Remove the messageId from the URL after searching
      // to prevent searching again on subsequent renders
      if (queryParams.has("msgId")) {
        queryParams.delete("msgId");
        setSearchParams(queryParams);
      }
    }
  }, [conversationId, messageId, messages, isLoading]);

  useEffect(() => {
    // queryParams.set("new", "true");
    setSearchParams(queryParams);
  }, []);

  /**
   * Monitor isError query parameter changes
   */
  useEffect(() => {
    const currentErrorParam = queryParams.get("isError");
    const prevErrorParam = prevErrorRef.current;

    // Update the ref with current error state
    prevErrorRef.current = currentErrorParam;

    // Only reset when error param was previously set and is now removed
    if (prevErrorParam === "true" && !currentErrorParam) {
      console.log("Error state cleared, resetting chat");
      setMessages([]);
      setConversationId("");
      setIsLoadingNewMessage(false);
      setIsTyping(false);
    }
  }, [location.search]);

  /**
   * Reset messages when navigating to the root chat route
   */
  useEffect(() => {
    // Only reset if we're on the root chat route with no ID
    if (location.pathname === "/chats" && !params.id) {
      setMessages([]);
      setConversationId("");
      setIsLoadingNewMessage(false);
      setIsTyping(false);
    }
  }, [location.pathname]);

  const onClose = useCallback(() => {
    setShowReject(false);
    navigate(`/questions?page=${pageParam}`);
  }, []);

  const canChat = useMemo(() => {
    const createdByList = map(messages, "created_by").filter((o) => o);
    const isDownvoteList = map(messages, "is_downvote").filter((o) => o);

    if (
      isLoadingNewMessage ||
      isTyping ||
      (size(createdByList) === 0 && size(isDownvoteList) === 0)
    )
      return true;

    return includes(createdByList, id) && !includes(isDownvoteList, true);
  }, [id, messages, isNew, isLoadingNewMessage, isTyping]);

  let lastDate: any = null;

  useEffect(() => {
    let toastId: string | number = "chat";
    let debounceTimeout: NodeJS.Timeout;

    if (size(messages) >= 10 && canChat && !hideChatToast) {
      debounceTimeout = setTimeout(() => {
        toastId = toast.custom(
          (t) => (
            <div className="flex relative flex-col gap-y-3 justify-between items-start p-4 rounded-lg border border-gray-200 shadow-lg bg-secondary-50">
              <div className="flex flex-col gap-y-1">
                <span className="flex">
                  <span className="mr-1">
                    <img src={allImgPaths.info} />
                  </span>
                  <h1 className="text-base font-medium text-tertiary-800">
                    {translate("chats.newChatTitle")}
                  </h1>
                </span>
                <p className="text-sm text-tertiary-700">
                  {translate("chats.newChatSubTitle")}
                </p>
              </div>
              <div className="flex gap-x-2">
                <button
                  onClick={() => {
                    toast.dismiss();
                    navigate("/chats");
                  }}
                  className="text-xs font-medium tracking-wide text-primary-900 hover:text-primary-700"
                >
                  New Chat
                </button>
                <button
                  onClick={() => {
                    toast.dismiss();
                    setHideChatToast(true);
                  }}
                  className="absolute top-5 right-6 text-gray-500 hover:text-gray-800"
                >
                  <img className="w-3 h-3" src={allImgPaths.closeIcon} />
                </button>
              </div>
            </div>
          ),
          {
            id: "chat",
            position: "bottom-right",
            duration: 1000 * 60 * 5,
            dismissible: true,
          },
        );
      }, 300); // Debounce delay of 300ms
    }

    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [messages]);

  useEffect(() => {
    const el: any = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (el) {
        el.removeEventListener("scroll", handleScroll);
      }
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const RenderErrorMessageBanner = ({ showCloseBtn = true }) => {
    return (
      <div className="flex gap-x-2 items-center p-4 mt-4 text-center bg-red-50 rounded-md border border-red-200">
        <div>
          <p className="font-medium text-status-error">
            {translate("chats.exhaustedMessage")}
          </p>
        </div>
        {showCloseBtn && (
          <div>
            <button
              className="flex items-center p-1 text-xs font-medium text-white rounded-full transition-all duration-300 hover:bg-status-error/20"
              onClick={() => setIsCreditAvailable(false)}
            >
              {/* {translate("chats.dismiss")} */}
              <img src={allImgPaths.crossRed} alt="close" />
            </button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders the appropriate UI based on the current state:
   * 1. Initial state (no conversationId): Show new chat UI
   * 2. Loading state: Show loader
   * 3. Messages exist: Show messages UI
   * 4. No messages found after loading (with conversationId): Show no record found
   */

  const handleScroll = () => {
    return;
    if (!isScrolling) setIsScrolling(true);

    // Clear previous timeout
    clearTimeout(timeoutRef.current);

    // Set new timeout to remove class after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  const onNotifyAdmin = async () => {
    const result = await notifyAdmin();
    sessionStorage.setItem("isNotified", "true");
    setIsNotified(true);
    toast.success("Notified Admin about Chat Usage");
  };

  return (
    <div className="flex w-full">
      {/* Chat Container */}
      <div
        className={`flex flex-col justify-between items-center w-full h-[calc(100vh_-_50px)] sm:h-[calc(100vh_-_100px)]`}
        id="chat-container"
      >
        {!isCreditAvailable && !isNotified && (
          <div>
            <AlertBanner
              type="error"
              message={
                isAdmin()
                  ? `${name} has used its monthly Credit limit`
                  : `${name} has used its monthly Credit limit`
              }
              className="!bg-white border-[#F8D4D4] !gap-x-0"
              actionButton={
                <ButtonV2
                  loading={isNotifying}
                  onClick={() => {
                    if (isAdmin()) {
                      navigate("/admin/plans-billing");
                    } else {
                      onNotifyAdmin();
                    }
                  }}
                  variant="error"
                  className="!py-1 !px-3 bg-status-error/10 !text-status-error border-[1px] hover:!text-white border-status-error group"
                >
                  <div className="flex gap-x-3">
                    {isAdmin() ? (
                      <span>Buy Credit Plan</span>
                    ) : (
                      <span>Notify Admin</span>
                    )}

                    <img
                      src={allImgPaths.rocketIconRed}
                      alt=""
                      className="block w-6 h-6 group-hover:hidden"
                    />
                    <img
                      src={allImgPaths.rocketIcon}
                      alt=""
                      className="group-hover:!block hidden w-6 h-6"
                    />
                  </div>
                </ButtonV2>
              }
            />
          </div>
        )}
        {/* Initial state - New Chat UI */}
        {size(conversationId) <= 0 &&
          size(messages) === 0 &&
          !isLoadingNewMessage &&
          !isTyping && (
            <>
              <div className="flex justify-center h-[calc(100vh_-_150px)] w-full items-center p-4">
                <div
                  className={`w-full max-w-2xl ${!isCreditAvailable ? "opacity-70" : ""}`}
                >
                  {/* Chat Initial UI */}
                  <div className="mb-8">
                    <div className="flex gap-x-3 items-center">
                      <motion.img
                        src={allImgPaths.athenaLogo}
                        alt="spinning logo"
                        style={{ width: 65 }}
                        animate={
                          {
                            // rotate: [0, 360],
                          }
                        }
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <span className="select-none text-[42px] sm:text-[52px] text-grad font-extrabold">
                        {translate("chats.hello")}
                      </span>
                    </div>

                    <span className="font-normal text-left select-none text-1xl text-tertiary-900 sm:text-2xl">
                      {translate("chats.subheading")}
                    </span>
                  </div>
                  <ChatInput
                    autoFocus={isCreditAvailable}
                    onSubmit={onSubmit}
                    isLoadingNewMessage={isTyping || isLoadingNewMessage}
                    resizeElement={resizeElement}
                    disabled={!isCreditAvailable}
                    chatFilter={chatFilter}
                    setChatFilter={setChatFilter}
                  />
                  {!isCreditAvailable && !isAdmin() && (
                    <div className="mt-4">
                      <AlertBanner
                        type="error"
                        message={translate("chats.exhaustedMessage")}
                      />
                    </div>
                  )}
                </div>
              </div>
              <p className="absolute bottom-5 justify-center p-4 mt-5 text-sm sm:p-0 text-tertiary-200 md:flex">
                {translate("chats.warning")}{" "}
              </p>
            </>
          )}

        {/* Loading state */}
        {!isNew && isLoading && <LoaderCircle />}

        {/* Messages exist - Show messages UI */}
        {size(messages) > 0 ? (
          <>
            <div
              id="messagesRef"
              ref={scrollRef}
              className={`flex overflow-y-auto flex-col-reverse px-2 w-full h-full messagesRef sm:px-5 md:px-4 sm:mx-2 ${!isScrolling ? "pr-2 scrollbar-hide" : ""}`}
              onScroll={handleScroll}
            >
              {
                <div>
                  <InfiniteScroll
                    dataLength={messages.length}
                    next={() => {
                      updatePageNumber();
                    }}
                    scrollThreshold={500}
                    style={{ display: "flex", flexDirection: "column-reverse" }}
                    inverse={true}
                    hasMore={hasMoreMessages}
                    loader={
                      <h4 className="py-2 text-center">
                        {isSearchingMessage
                          ? "searchingForMessage"
                          : translate("common.loading")}
                      </h4>
                    }
                    className="mx-auto max-w-7xl"
                    scrollableTarget="messagesRef"
                    // className="2xl:px-12 xl:px-24 sm:pb-4"
                  >
                    <div id="visibilityRef" className="w-full h-2" />
                    {/* Display chat progress when a stage is active */}
                    {progressStage && (
                      <AIBotResponseLoading
                        stage={progressStage}
                        message={progressMessage}
                      />
                    )}
                    {messages.map((chat, index) => {
                      const currentDate = moment(
                        new Date(chat.created_at),
                      ).format("DD-MM-YYYY");

                      const previousDate =
                        index > 0
                          ? moment(
                              new Date(messages[index - 1].created_at),
                            ).format("DD-MM-YYYY")
                          : null;

                      // Only show the date divider if the current message's date is different from the previous one
                      const showDivider = currentDate !== previousDate;

                      const today = moment().local();
                      const messageDate = moment(chat.created_at).local();
                      let label = "";

                      if (messageDate.isSame(today, "day")) {
                        label = "Today";
                      } else if (
                        messageDate.isSame(today.subtract(1, "day"), "day")
                      ) {
                        label = "Yesterday";
                      } else {
                        label = messageDate.format("MMMM Do, YYYY"); // e.g., "January 25th, 2025"
                      }

                      return (
                        <React.Fragment key={index}>
                          <div
                            id={`message-${chat.id}`}
                            className="transition-colors duration-500"
                          >
                            <ChatText
                              chat={chat}
                              text={chat.answer}
                              isSender={chat.sender === "user"}
                              canChat={canChat}
                            />
                          </div>
                          {false && showDivider && (
                            <Divider
                              className="date-divider"
                              key={index}
                              label={label}
                            ></Divider>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </InfiniteScroll>
                </div>
              }
            </div>

            {canChat || isTyping || isLoadingNewMessage ? (
              <div className="p-2 w-full max-w-2xl md:w-full sm:p-4">
                <ChatInput
                  onSubmit={onSubmit}
                  isLoadingNewMessage={isTyping || isLoadingNewMessage}
                  resizeElement={resizeElement}
                  chatFilter={chatFilter}
                  setChatFilter={setChatFilter}
                />
                <p className="mt-1.5 sm:mt-3 sm:text-base text-tertiary-200 sm:flex justify-center text-sm text-center">
                  {translate("chats.warning")}{" "}
                </p>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center p-2 w-full sm:w-1/2 sm:p-4">
                {![ROLES.CHATTER].includes(role) && questionId && title && (
                  <div className="flex gap-x-2 items-center">
                    <Tooltip
                      title={translate("questions.columns.tooltips.answer")}
                      color="tertiary"
                    >
                      <span
                        className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer hover:bg-status-success/20"
                        onClick={() => {
                          navigate(
                            `/KEs?KEId=new&questionId=${questionId}&title=${title}&conversationId=${conversationId}`,
                          );
                        }}
                      >
                        <img src={allImgPaths.actionAnswer} alt="" />
                      </span>
                    </Tooltip>
                    |
                    <Tooltip
                      title={translate("questions.columns.tooltips.ignore")}
                      color="tertiary"
                    >
                      <span
                        className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer hover:bg-status-error/20"
                        onClick={() => {
                          setShowReject(true);
                        }}
                      >
                        <img src={allImgPaths.rejectCheckIcon} alt="" />
                      </span>
                    </Tooltip>
                    |
                    <Tooltip
                      title={translate("questions.columns.tooltips.reRoute")}
                      color="tertiary"
                    >
                      <span
                        className="flex gap-x-1 justify-center items-center w-10 h-10 rounded-md duration-200 cursor-pointer hover:bg-status-brand/20"
                        onClick={() => {
                          setShowReroute(true);
                        }}
                      >
                        <img
                          src={allImgPaths.rerouteCheckIcon}
                          alt=""
                          className=""
                        />
                      </span>
                    </Tooltip>
                  </div>
                )}
                {/* Lock conversation */}
                {!history && (
                  <span className="font-medium leading-6">
                    {translate("chats.chatEnded")}
                    <NavLink to="/chats" className="underline text-status-info">
                      {translate("chats.newChat")}
                    </NavLink>
                  </span>
                )}
                <p className="hidden mt-1.5 sm:mt-3 sm:text-base text-tertiary-200 sm:flex justify-center text-sm">
                  {translate("chats.warning")}
                </p>
              </div>
            )}
          </>
        ) : (
          // No messages found after loading (with conversationId)
          <>
            {!isLoading &&
              initialFetchAttempted &&
              size(conversationId) > 0 && (
                <div className="flex justify-center items-center w-full h-full">
                  <NoRecord heading={translate("chats.noRecordFound")} />
                </div>
              )}
          </>
        )}
        <DocumentViewer
          show={showDocument}
          onClose={() => {
            setSearchParams({
              ...(questionId && { questionId }),
              ...(title && { title }),
            });
            setShowDocument(false);
          }}
        />
        {showFeedBack && (
          <DownVoteFeedBack messages={messages} setMessages={setMessages} />
        )}
        {/* Reject Question */}
        <RejectQuestionForm
          onClose={onClose}
          open={showReject}
          question={{ id: questionId }}
        />
        {/* Reroute Question */}
        <Reroute
          onClose={() => {
            setShowReroute(false);
          }}
          onComplete={() => {
            setShowReroute(false);
            navigate(`/questions?page=${pageParam}`);
          }}
          open={showReroute}
          question={{ id: questionId }}
        />
      </div>
      {/* Retrieval Docs Drawer with Animation */}
      {width <= 1250 ? (
        <Modal
          show={isShowRetrievalDocs}
          size="xl"
          className="!p-0"
          extraClasses="!p-0"
        >
          <RetrievalDocs
            relatedDocuments={get(retrievalDocs, "relatedDocuments", [])}
            sourceDocuments={get(retrievalDocs, "sourceDocuments", [])}
            onClose={() => setShowRetrievalDocs(false)}
          />
        </Modal>
      ) : (
        <motion.div
          className="flex flex-col justify-between h-[calc(100vh_-_50px)] sm:h-[calc(100vh_-_100px)] items-center max-w-[600px] p-4 overflow-hidden"
          initial={{ x: "100%", opacity: 0 }}
          animate={{
            x: isShowRetrievalDocs ? 0 : "100%",
            opacity: isShowRetrievalDocs ? 1 : 0,
            width: isShowRetrievalDocs ? "600px" : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3,
            width: { duration: 0.3, ease: "easeInOut" },
          }}
        >
          <RetrievalDocs
            relatedDocuments={get(retrievalDocs, "relatedDocuments", [])}
            sourceDocuments={get(retrievalDocs, "sourceDocuments", [])}
            onClose={() => setShowRetrievalDocs(false)}
          />
        </motion.div>
      )}
    </div>
  );
};

export default Chat;
