import { useTranslate } from "@/hooks";
import React, { memo, useState } from "react";

interface ReadMoreProps {
  text: string;
  className?: string;
  limit?: number;
}

const ReadMore: React.FC<ReadMoreProps> = ({
  text,
  limit = 200,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { translate } = useTranslate();

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  const renderText = () => {
    if ((text && isExpanded) || text?.length <= limit) {
      return text;
    }
    return `${text?.slice(0, limit)}...`;
  };

  return (
    <div className={`break-all ${className}`}>
      <span dangerouslySetInnerHTML={{ __html: renderText() }} />
      {text && text.length > limit && (
        <div
          onClick={toggleReadMore}
          className="text-status-info font-medium not-italic cursor-pointer ml-1"
        >
          {isExpanded
            ? translate("common.showLess")
            : translate("common.showMore")}
        </div>
      )}
    </div>
  );
};

export default memo(ReadMore);
