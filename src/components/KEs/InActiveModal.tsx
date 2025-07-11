import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";
import { ButtonV2 } from "..";
import Modal from "../Modal";

const InActiveModal = ({
  show,
  setActiveModal,
  onLeave,
  onContinue,
}: {
  show: boolean;
  setActiveModal: (status: boolean) => void;
  onLeave: () => void;
  onContinue: () => void;
}) => {
  const { translate } = useTranslate();

  return (
    <div>
      <Modal onClose={() => setActiveModal(false)} show={show} size="lg">
        <div className="flex flex-col gap-y-10">
          <div className="flex flex-col gap-y-3">
            <div className="flex flex-col gap-y-2  items-center">
              <img
                src={allImgPaths.infoBlue}
                alt="info button"
                className="h-14 w-14"
              />
              <p className="font-medium text-lg text-center">KE lock update</p>
            </div>
            <div className="mt-4">
              <p className="text-tertiary-700">
                You've been inactive for a while. Please hit the 'Continue'
                button to lock your knowledge entry and secure your progress.
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-x-5">
            <ButtonV2 onClick={onLeave} variant="tertiaryDark">
              Leave
            </ButtonV2>
            <ButtonV2
              type="button"
              variant="secondary"
              rightIcon={allImgPaths.rightArrow}
              onClick={onContinue}
            >
              {translate("common.continue")}
            </ButtonV2>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InActiveModal;
