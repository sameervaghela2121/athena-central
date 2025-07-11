import { useState } from "react";
import { toast } from "sonner";

import api from "@/apis/chats";
import allImgPaths from "@/assets";
import { ButtonV2 } from "@/components";
import { useAppState } from "@/context";
import { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";

interface DownVoteFeedBackProps {
  messages: any;
  setMessages: (messages: any) => void;
}

const DownVoteFeedBack = ({ messages, setMessages }: DownVoteFeedBackProps) => {
  const { setShowFeedBack, downVoteId, setDownVoteId } = useAppState(
    RootState.CHATS,
  );
  const [isLoading, setIsLoading] = useState(false);

  const { translate } = useTranslate();
  const [feedBack, setFeedBack] = useState("");

  const handleDownVote = async () => {
    if (downVoteId) {
      try {
        setIsLoading(true);
        const response: any = await api.downVote(downVoteId, {
          feedback: feedBack,
        });
        if (response?.data?.data?.result?.id) {
          let id = response?.data?.data?.result?.id;

          const updatedMessages: any = messages.map((message: any) =>
            message.id === id ? { ...message, is_downvote: true } : message,
          );

          setMessages(updatedMessages);
        }

        toast.success(`Feedback submitted successfully`);
        setShowFeedBack(false);
        setFeedBack("");
        setDownVoteId("");
      } catch (error) {
        toast.error(`Failed to submit Feedback, please try again later`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="justify-center bg-black bg-opacity-10 items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 outline-none focus:outline-none backdrop-blur-sm">
      <div className="w-full mx-4 sm:mx-auto sm:max-w-[450px] max-h-screen">
        <div className="content">
          <div className="mx-auto p-3 sm:p-4 text-base sm:text-lg font-medium text-gray-800 bg-header rounded-t-xl">
            {translate("chats.feedback.title")}
          </div>
          <div className="mx-auto p-4 sm:p-6 bg-white shadow-full rounded-b-xl">
            <textarea
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none"
              rows={6}
              placeholder={translate("chats.feedback.placeholder")}
              onChange={(e) => setFeedBack(e.target.value)}
            ></textarea>
            <div className="mt-4 sm:mt-6 text-gray-500 flex items-start">
              <span className="inline-block align-middle mr-2 shrink-0 mt-1">
                <img
                  src={allImgPaths.info}
                  height={20}
                  width={20}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </span>
              <span className="text-sm sm:text-base">
                {translate("chats.feedback.note")}
              </span>
            </div>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <ButtonV2
                variant="tertiaryDark"
                className="px-6"
                onClick={() => setShowFeedBack(false)}
              >
                {translate("common.cancel")}
              </ButtonV2>
              <ButtonV2
                loading={isLoading}
                className="px-6"
                onClick={() => handleDownVote()}
                rightIcon={allImgPaths.rightArrow}
              >
                {translate("common.submit-feedback")}
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownVoteFeedBack;
