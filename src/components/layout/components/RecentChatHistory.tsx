import api from "@/apis/chats";
import allImgPaths from "@/assets";
import ButtonV2 from "@/components/ButtonV2";
import Modal from "@/components/Modal";

import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { groupByDate } from "@/shared/functions";
import { get, size } from "lodash-es";
import { useCallback, useEffect, useState } from "react";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate, useParams } from "react-router-dom";

/**
 * RecentChatHistory component that displays recent chat conversations
 * Enhanced with smooth animations and responsive design
 */
const RecentChatHistory = () => {
  const navigate = useNavigate();
  const { translate } = useTranslate();
  const params = useParams();
  const { conversations, setConversations } = useAppState(RootState.CHATS);
  const { toggleMobileSideBar } = useAppState(RootState.COMMON);
  const [isHistoryExists, setIsHistoryExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches chat history from the API
   */
  const initiateAPICall = useCallback(
    async (refresh: boolean = true) => {
      try {
        if (refresh) {
          setIsLoading(true);
        }
        const response: any = await api.fetchChatHistory();
        if (response.status === 200) {
          let chats = groupByDate(response.data.data.result);
          setConversations(chats);
          setIsHistoryExists(get(response, "data.data.result", []).length > 0);
        }
      } catch (error) {
        console.error("initiateAPICall Error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [setConversations],
  );

  const updateRecentConversations = () => {
    if (size(conversations) === 0) return;

    const isAnyArrayNonEmpty = Object.values(conversations || {}).some(
      (arr: any) => arr.length > 0,
    );
    if (isAnyArrayNonEmpty) {
      setIsHistoryExists(true);
    }
  };

  useEffect(() => {
    if (conversations) {
      updateRecentConversations();
    }
  }, [conversations]);

  useEffect(() => {
    initiateAPICall();
  }, []);

  /**
   * Handles deletion of a conversation
   */
  const handleClickDelete = useCallback(
    async (id: string) => {
      try {
        const response: any = await api.deleteConversation(id);

        if (response.status === 200) {
          if (params.id === id) {
            navigate("/chats");
          }
          initiateAPICall(false);
        }
      } catch (error) {
        console.error("handleClickDelete Error:", error);
      }
    },
    [params.id, navigate, initiateAPICall],
  );

  // Animation variants removed

  return (
    <>
      <div className="px-4 w-full">
        <div className="border-t"></div>
      </div>

      {/* <div className="px-4 border-t">
        <h3 className="px-2 py-2 mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Conversations
        </h3>
      </div> */}
      {isLoading ? (
        <div className="px-4 py-3 mb-2 rounded-2xl">
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((i) => (
              <div
                key={i}
                className="h-6 bg-gray-200 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        size(conversations) > 0 &&
        isHistoryExists && (
          <div className="overflow-y-auto px-4 py-3 pb-36 pl-6">
            <ul>
              {conversations &&
                Object.keys(conversations).map(
                  (eachKeyOfConversations: any, index: number) => {
                    let timeFrame = eachKeyOfConversations;
                    let history =
                      conversations[
                        eachKeyOfConversations as keyof typeof conversations
                      ];
                    if (history.length) {
                      return (
                        <div key={index} className="pb-2 border-b">
                          <p className="py-2 text-base font-medium rounded-xl first-letter:capitalize text-tertiary-900">
                            {timeFrame}
                          </p>
                          {history.map((conversation: any, index: any) => {
                            return (
                              <li
                                key={index}
                                title={conversation?.title}
                                className={`relative border border-l-4 border-transparent rounded-l-none group flex justify-between text-base font-medium px-2 py-2 rounded-xl last:mb-0 truncate w-full cursor-pointer hover:bg-tertiary-50 hover:text-primary-900 transition-all duration-300 ${params.id == conversation?.id ? "bg-secondary-200 text-primary-900  border border-l-4  !border-secondary-900" : "bg-white text-tertiary-700"}`}
                              >
                                <p
                                  className="w-full truncate"
                                  onClick={(e) => {
                                    navigate(`/chats/${conversation?.id}`);
                                    toggleMobileSideBar(false);
                                  }}
                                >
                                  {conversation?.title}
                                </p>
                                <div
                                  className="flex absolute top-0 right-0 justify-center items-center p-2 rounded-xl opacity-0 transition-opacity duration-300 min-w-6 shrink-0 delete-icon group-hover:opacity-100 group-hover:bg-white/70 group-hover:backdrop-blur-sm"
                                  onClick={() => {
                                    confirmAlert({
                                      customUI: ({ onClose }) => {
                                        return (
                                          <Modal
                                            size="md"
                                            show={true}
                                            onClose={onClose}
                                          >
                                            <div className="flex flex-col gap-y-10">
                                              <div>
                                                <div className="flex justify-center">
                                                  <img
                                                    src={allImgPaths.fileIcon}
                                                    alt="file-icon"
                                                  />
                                                </div>
                                                <div className="mt-4">
                                                  <p
                                                    className="text-base font-medium text-center capitalize"
                                                    dangerouslySetInnerHTML={{
                                                      __html: translate(
                                                        "chats.deleteConfirmMsg",
                                                        {
                                                          conversation:
                                                            conversation?.title,
                                                        },
                                                      ),
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex gap-x-5 justify-center">
                                                <ButtonV2
                                                  onClick={onClose}
                                                  variant="tertiaryDark"
                                                >
                                                  {translate("common.cancel")}
                                                </ButtonV2>
                                                <ButtonV2
                                                  onClick={() => {
                                                    handleClickDelete(
                                                      conversation?.id,
                                                    );
                                                    onClose();
                                                  }}
                                                  variant="error"
                                                  rightIcon={
                                                    allImgPaths.rightArrow
                                                  }
                                                >
                                                  {translate("common.delete")}
                                                </ButtonV2>
                                              </div>
                                            </div>
                                          </Modal>
                                        );
                                      },
                                    });
                                  }}
                                >
                                  <div className="flex relative justify-center items-center w-6 h-6">
                                    <img
                                      src={allImgPaths.trash}
                                      className="w-4 h-4 transition-transform duration-300 hover:scale-110"
                                      alt="trash-icon"
                                    />
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </div>
                      );
                    }
                  },
                )}
            </ul>
          </div>
        )
      )}
    </>
  );
};

export default RecentChatHistory;
