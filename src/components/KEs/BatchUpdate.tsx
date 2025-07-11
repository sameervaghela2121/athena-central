import { useNavigate } from "react-router-dom";

import allImgPaths from "@/assets";
import { ButtonV2, Modal } from "@/components";
import { useTranslate } from "@/hooks";

const BatchUpdate = ({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) => {
  const { translate } = useTranslate();
  const navigate = useNavigate();

  return (
    <div>
      <Modal onClose={onClose} show={show} size="lg">
        <div className="flex flex-col gap-y-10">
          <div className="flex flex-col gap-y-3">
            <div className="flex flex-col gap-y-2  items-center">
              <img
                src={allImgPaths.infoBlue}
                alt="info button"
                className="h-14 w-14"
              />
              <p className="font-medium text-lg text-center">
                {translate("KEs.batchUploadAvailable")}
              </p>
            </div>
            <div className="mt-4">
              <p className="text-tertiary-700">
                {translate("KEs.batchUploadExplanation")}
                <br />
                <br />
                {translate("KEs.batchUploadContinueText")}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-x-5">
            <ButtonV2 onClick={onClose} variant="tertiaryDark">
              {translate("common.continue")}
            </ButtonV2>
            <ButtonV2
              type="button"
              variant="primary"
              rightIcon={allImgPaths.rightArrow}
              onClick={() => {
                onClose();
                // TODO: need to handle this URL for bulk upload
                navigate("/KEs?type=bulk");
              }}
            >
              {translate("common.back-upload")}
            </ButtonV2>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchUpdate;
