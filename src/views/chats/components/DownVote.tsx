import allImgPaths from "@/assets";
import Tooltip from "@/components/Tooltip";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { useState } from "react";

interface DownVote {
  id: string;
  selected: string | boolean;
  canChat?: boolean;
}

const DownVote = ({ id, selected, canChat = true }: DownVote) => {
  const { translate } = useTranslate();
  const [isDownVoted, setIsDownVoted] = useState<boolean>(Boolean(selected));
  const { setShowFeedBack, setDownVoteId } = useAppState(RootState.CHATS);

  const handleDownVote = () => {
    if (isDownVoted && !canChat) {
      return;
    }

    setShowFeedBack(true);
    setIsDownVoted(true);
    setDownVoteId(id);
    // setTimeout(() => {
    //   setIsDownVoted(false);
    // }, 3000);
  };

  return (
    <Tooltip content={!isDownVoted && translate("chats.downVote")} color="dark">
      <div
        className="flex gap-x-1 items-center hover:bg-slate-100"
        onClick={() => handleDownVote()}
      >
        <img
          className={`toolTipTitle rotate-180 cursor-pointer shrink-0  rounded-md p-0.5`}
          src={isDownVoted ? allImgPaths.thumbUpFilled : allImgPaths.thumbUp}
          alt="dislike"
        />
        <span className="text-xs text-tertiary-400">
          {" "}
          {translate("chats.helpMe")}
        </span>
      </div>
    </Tooltip>
  );
};

export default DownVote;
