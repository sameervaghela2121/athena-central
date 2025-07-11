import allImgPaths from "@/assets";
import { ButtonV2 } from "@/components";
import { useTranslate } from "@/hooks";

const SuccessIgnore = ({ onClose }: { onClose: () => void }) => {
  const { translate } = useTranslate();

  return (
    <div className="flex flex-col gap-y-10 p-14">
      <div className="flex flex-col items-center justify-center gap-y-4">
        <div>
          <img src={allImgPaths.successIcon} alt="success" />
        </div>
        <div>
          <h2 className="text-center text-tertiary-1000 text-base font-medium">
            {translate("questions.reject-question.successMsg")}
          </h2>
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <ButtonV2 onClick={onClose} variant="tertiaryDark">
          {translate("common.ok")}
        </ButtonV2>
      </div>
    </div>
  );
};

export default SuccessIgnore;
