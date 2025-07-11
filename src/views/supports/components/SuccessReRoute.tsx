import allImgPaths from "@/assets";
import { ButtonV2 } from "@/components";
import { useTranslate } from "@/hooks";
import { size } from "lodash-es";

const SuccessReRoute = ({
  onClose,
  reroutedQueuesNames,
}: {
  onClose: () => void;
  reroutedQueuesNames: string;
}) => {
  const { translate } = useTranslate();

  return (
    <div className="flex flex-col gap-y-10 p-14">
      <div className="flex flex-col items-center justify-center gap-y-4">
        <div>
          <img src={allImgPaths.successIcon} alt="success" />
        </div>
        <div>
          <h2 className="text-center text-tertiary-1000 text-base font-medium">
            {translate("questions.reroute.successMsg1")}
          </h2>
        </div>
        <div>
          <span className="text-center text-tertiary-600 italic">
            {translate("questions.reroute.successMsg2")}
          </span>
        </div>
      </div>
      {size(reroutedQueuesNames) > 0 && (
        <div className="mt-5">
          <p className="text-center text-primary-900 font-semibold">
            {translate("questions.reroute.routedTo")}: {reroutedQueuesNames}
          </p>
        </div>
      )}
      <div className="mt-2 flex justify-center">
        <ButtonV2 onClick={onClose} variant="tertiaryDark">
          {translate("common.ok")}
        </ButtonV2>
      </div>
    </div>
  );
};

export default SuccessReRoute;
