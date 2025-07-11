import api from "@/apis/chats";
import allImgPaths from "@/assets";
import Tooltip from "@/components/Tooltip";
import { useTranslate } from "@/hooks";
import { useState } from "react";
import { toast } from "sonner";

interface UpVoteProps {
  id: string;
  selected: string | boolean;
  canChat?: boolean;
}

const UpVote = ({ id, selected, canChat = true }: UpVoteProps) => {
  const { translate } = useTranslate();
  const [isUpVoted, setIsUpVoted] = useState<boolean>(Boolean(selected));

  const handleUpVote = async () => {
    if (isUpVoted && !canChat) {
      return;
    }

    try {
      setIsUpVoted(true);

      const { status }: any = await api.upVote(id);
      toast.success(`Feedback submitted successfully`);
      if (status == 200) {
        setIsUpVoted(true);
      }
      // setTimeout(() => {
      //   setIsUpVoted(false);
      // }, 3000);
    } catch (error) {
      toast.error(`Failed to submit Feedback, please try again later`);
    }
  };

  return (
    <Tooltip content={translate("chats.upVote")} color="dark">
      <img
        className={`toolTipTitle cursor-pointer shrink-0 hover:bg-slate-100 rounded-md p-0.5`}
        src={isUpVoted ? allImgPaths.thumbUpFilled : allImgPaths.thumbUp}
        alt="like"
        onClick={() => handleUpVote()}
      />
    </Tooltip>
  );
};

export default UpVote;
