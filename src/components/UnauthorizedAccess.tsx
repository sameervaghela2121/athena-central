import allImgPaths from "@/assets";
import { ButtonV2, EmptyState } from "@/components";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

const UnauthorizedAccess = ({
  message,
  header = "Restricted Access",
  icon,
}: {
  header?: React.ReactNode;
  message: string;
  icon?: string;
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <EmptyState
        header={header}
        description={<div className="w-1/2">{message}</div>}
        imageUrl={icon ?? allImgPaths.noRecord}
        primaryAction={
          <ButtonV2 onClick={() => navigate("/chats")}>Go to Home</ButtonV2>
        }
      />
    </div>
  );
};

export default memo(UnauthorizedAccess);
