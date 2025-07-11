import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import React from "react";
import { ButtonV2 } from ".";
import Modal from "./Modal";

const LostInternetModal = ({
  heading = "Lost internet",
  text = "Lost internet",
}: {
  heading: string;
  text: string;
}) => {
  const { translate } = useTranslate();

  const { toggleInternetLostModal, showLostInternet } = useAppState(
    RootState.COMMON,
  );

  return (
    <>
      <Modal
        onClose={() => toggleInternetLostModal(undefined)}
        show={showLostInternet === false}
        size="lg"
        extraClasses="p-5"
      >
        <div className="flex flex-col gap-y-10">
          <div className="flex flex-col gap-y-3">
            <div className="flex flex-col gap-y-2  items-center">
              <p className="font-medium text-lg text-center">{heading}</p>
            </div>
            <div className="mt-4">
              <p className="text-tertiary-700 text-center">{text}</p>
            </div>
          </div>
          <div className="flex justify-center gap-x-5">
            <ButtonV2
              type="button"
              variant="secondary"
              onClick={() => toggleInternetLostModal(undefined)}
            >
              {translate("common.ok")}
            </ButtonV2>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default React.memo(LostInternetModal);
