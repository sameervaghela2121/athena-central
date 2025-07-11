import chatAPI from "@/apis/chats";
import { every, get, isEmpty, size, trimEnd, trimStart } from "lodash-es";
import queryString from "query-string";
import { useEffect, useState } from "react";
import Highlighter from "react-highlight-words";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "@/apis/axiosInterceptor";
import allImgPaths from "@/assets";
import { ButtonV2, Divider, Modal } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useDebounce, useTranslate } from "@/hooks";
import { HOST } from "@/shared/constants";
import { formatDate, groupByDate, highlightAndTrim } from "@/shared/functions";

const SearchMessage = ({
  onClose,
  show,
}: {
  onClose: () => void;
  show: boolean;
}) => {
  if (!show) return;

  const { translate } = useTranslate();
  const navigate = useNavigate();

  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const [suggestedMessages, setSuggestedMessages] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const { conversations = null, setConversations } = useAppState(
    RootState.CHATS,
  );

  const debouncedQuery = useDebounce(trimEnd(trimStart(query)), 800);

  const fetchSuggestedMessages = async (query: string = "") => {
    try {
      setIsLoadingMessages(true);

      const stringified = queryString.stringify(
        { query },
        {
          skipEmptyString: true,
          skipNull: true,
        },
      );

      const { data } = await api.get(
        `${HOST.CONVERSATION_MESSAGES}/conversation-messages/search?${stringified}`,
      );

      const result = get(data, "data.result", []);

      setSuggestedMessages(result);
      return result;
    } catch (error: any) {
      console.error("fetchSuggestedMessages error =>", error);
      toast.error(error.message);
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const initiateAPICall = async () => {
    try {
      setIsLoadingMessages(true);
      const response: any = await chatAPI.fetchChatHistory();
      if (response.status === 200) {
        let chats = groupByDate(response.data.data.result);
        setConversations(chats);
      }
    } catch (error) {
      console.error("initiateAPICall error =>", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (size(conversations) === 0) {
      initiateAPICall();
    }
  }, [conversations]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestedMessages([]);
      setIsLoadingMessages(false);
      return;
    }
    fetchSuggestedMessages(debouncedQuery);
  }, [debouncedQuery]);

  const redirectToConversation = async (id: string, messageId = "") => {
    onClose();
    navigate(`/chats/${id}?msgId=${messageId}`);
  };

  return (
    <div>
      <Modal
        size="xl"
        show={show}
        onClose={onClose}
        backdrop={true}
        extraClasses="!p-0"
      >
        <div className="overflow-y-auto flex-grow">
          <div className="flex flex-col">
            <div className="flex flex-col gap-y-4 px-6 py-4 border-b bg-header">
              <div className="flex justify-between items-center w-full">
                <span className="font-medium text-tertiary-700">
                  {translate("common.searchChats")}
                </span>
                <button
                  onClick={onClose}
                  className="flex justify-center items-center ml-4 rounded-full duration-500 hover:bg-tertiary-50"
                  aria-label="Close"
                >
                  <img src={allImgPaths.closeIcon} alt="close" />
                </button>
              </div>
              <div className="relative">
                <input
                  autoFocus
                  className="px-4 py-4 pr-16 w-full bg-white rounded-lg border-none placeholder:text-token-text-tertiary focus:border-transparent focus:outline-none focus:ring-0"
                  placeholder={translate("common.searchChats")}
                  value={query}
                  onChange={(e) => {
                    setIsLoadingMessages(true);
                    setQuery(trimStart(e.target.value));
                  }}
                />
                {size(query) > 0 && (
                  <span
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-tertiary-600"
                    onClick={() => setQuery("")}
                  >
                    Clear
                  </span>
                )}
              </div>
            </div>
            <Divider />
            <div className="flex-grow pb-3">
              <div className="overflow-y-auto h-[400px]">
                {isLoadingMessages && (
                  <div className="px-7 py-2 mt-5 space-y-4 w-full">
                    <div className="flex space-x-4 animate-pulse">
                      <div className="flex-1 py-1 space-y-3">
                        <div className="w-4/5 h-2 bg-gray-200 rounded"></div>
                        <div className="w-4/5 h-2 bg-gray-200 rounded"></div>
                        <div className="w-full h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="flex space-x-4 animate-pulse">
                      <div className="flex-1 py-1 space-y-3">
                        <div className="w-4/5 h-2 bg-gray-200 rounded"></div>
                        <div className="w-3/5 h-2 bg-gray-200 rounded"></div>
                        <div className="w-4/5 h-2 bg-gray-200 rounded"></div>
                        <div className="w-5/6 h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                )}
                {!isLoadingMessages && size(suggestedMessages) > 0 ? (
                  <ol className="px-3 py-2 w-full">
                    {suggestedMessages.map((message: any, index: number) => (
                      <li
                        key={index}
                        onClick={() =>
                          redirectToConversation(
                            message.conversation_id,
                            message.message_id,
                          )
                        }
                        className="flex relative gap-x-2 items-center px-4 py-2 border-l-2 duration-300 cursor-pointer last:mb-4 hover:border-l-primary-900 border-l-transparent custom-option hover:bg-secondary-200 group"
                      >
                        <img src={allImgPaths.chats} alt="chat" />
                        <div className="relative flex-1 min-w-0">
                          <div className="font-medium line-clamp-1">
                            {message.conversation_title}
                          </div>
                          <div>
                            <Highlighter
                              className="text-sm break-all transition-all duration-200 select-none line-clamp-1 group-hover:pr-20"
                              highlightClassName="bg-secondary-600 p-[1px] rounded"
                              searchWords={[query]}
                              autoEscape={true}
                              textToHighlight={highlightAndTrim(
                                message.answer,
                                query.split(" "),
                              )}
                            />
                            <span className="absolute right-0 top-1/2 px-2 py-1 text-xs text-gray-500 whitespace-nowrap rounded-md shadow-sm opacity-0 backdrop-blur-sm transition-all duration-200 -translate-y-1/2 group-hover:opacity-100 bg-white/30">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <>
                    {!isLoadingMessages &&
                    size(query) <= 0 &&
                    !every(conversations, isEmpty) ? (
                      <div className="flex items-center w-full">
                        <div className="px-3 py-2 w-full">
                          {conversations &&
                            Object.keys(conversations).map(
                              (eachKeyOfConversations: any, index: number) => {
                                let timeFrame = eachKeyOfConversations;

                                let history = (conversations as any)[
                                  eachKeyOfConversations
                                ];

                                if (size(history) === 0) return;

                                return (
                                  <div key={index}>
                                    <div className="sticky top-0 z-10 px-4 py-4 font-medium leading-4 capitalize bg-white text-primary-900 group text-token-text-secondary">
                                      {eachKeyOfConversations}
                                    </div>
                                    <ol className="pr-2 pb-2">
                                      {history.map(
                                        (conversation: any, index: number) => (
                                          <li
                                            key={index}
                                            onClick={() =>
                                              redirectToConversation(
                                                conversation.id,
                                              )
                                            }
                                            className="flex relative gap-x-2 items-center px-4 py-2 border-l-2 duration-300 cursor-pointer hover:border-l-primary-900 border-l-transparent custom-option hover:bg-secondary-200 group"
                                          >
                                            <img
                                              src={allImgPaths.chats}
                                              alt="chat"
                                            />
                                            <div className="relative flex-1 min-w-0">
                                              <Highlighter
                                                className="text-sm break-all transition-all duration-200 select-none line-clamp-1 group-hover:pr-20"
                                                highlightClassName="bg-secondary-600 p-[1px] rounded"
                                                searchWords={[query]}
                                                autoEscape={true}
                                                textToHighlight={highlightAndTrim(
                                                  conversation?.title,
                                                  query.split(" "),
                                                )}
                                              />
                                              <span className="absolute right-0 top-1/2 px-2 py-1 text-xs text-gray-500 whitespace-nowrap rounded-md shadow-sm opacity-0 backdrop-blur-sm transition-all duration-200 -translate-y-1/2 group-hover:opacity-100 bg-white/30">
                                                {formatDate(
                                                  conversation.created_at,
                                                )}
                                              </span>
                                            </div>
                                          </li>
                                        ),
                                      )}
                                    </ol>
                                  </div>
                                );
                              },
                            )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {!isLoadingMessages && (
                          <div className="flex flex-col gap-y-1 justify-center items-center mt-20 w-full">
                            <img src={allImgPaths.chats} alt="chat" />
                            <span className="font-medium text-primary-900">
                              {translate("chats.noRecordFound")}
                            </span>
                            {/* start new chat with nagivate to /chats */}
                            <ButtonV2
                              onClick={() => navigate("/chats")}
                              className="mt-4"
                              variant="tertiaryDark"
                            >
                              Start new chat
                            </ButtonV2>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SearchMessage;
