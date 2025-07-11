import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";
import { memo } from "react";

interface Props {
  icon?: string;
  heading?: string;
  action?: any;
}

const NoRecord = ({
  icon = allImgPaths.noRecordCreated,
  heading = "",
  action = null,
}: Props) => {
  const { translate } = useTranslate();
  const msg = heading || translate("common.noRecordFound");
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-4">
        <img src={icon} className="w-40 text-gray-400" />
      </div>
      <div className="text-gray-500 text-sm mt-4">
        <h2 className="font-bold text-3xl">{msg}</h2>
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default memo(NoRecord);
