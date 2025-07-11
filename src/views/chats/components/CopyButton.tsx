import allImgPaths from "@/assets";
import Tooltip from "@/components/Tooltip";
import { useTranslate } from "@/hooks";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

const CopyButton = ({ text }: CopyButtonProps) => {
  const { translate } = useTranslate();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = (textToCopy: any) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    });
  };

  return (
    <Tooltip
      content={
        isCopied
          ? translate("chats.copiedToClipBoard")
          : translate("chats.copyToClipBoard")
      }
      color="dark"
    >
      <img
        className={`toolTipTitle cursor-pointer shrink-0 hover:bg-slate-100 rounded-md p-0.5`}
        src={isCopied ? allImgPaths.squareRightTickIcon : allImgPaths.copyIcon}
        alt="copy"
        onClick={() => handleCopy(text)}
      />
    </Tooltip>
  );
};

export default CopyButton;
