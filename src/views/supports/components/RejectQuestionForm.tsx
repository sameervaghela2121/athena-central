import React, { useCallback, useState } from "react";
import { toast } from "sonner";

import allImgPaths from "@/assets";
import { ButtonV2, Modal } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { get } from "lodash-es";
import SuccessIgnore from "./SuccessIgnore";

const RejectQuestionForm = ({ onClose, open, question }: any) => {
  if (!open) return;

  const [feedback, setFeedback] = useState<string>("");
  const [step, setStep] = useState(0);

  const { translate } = useTranslate();

  const { ignoreQuestion, isIgnoring = false } = useAppState(
    RootState.QUESTIONS,
  );

  const onSubmitFeedback = async () => {
    try {
      const payload = { feedback };
      const result = await ignoreQuestion(question.id, payload);

      setFeedback("");
      setStep(1);
    } catch (error) {
      const err = get(
        error,
        "response.data.data.message",
        "Error while submitting feedback",
      );

      toast.error(err, {
        id: "ignore-question",
      });
    }
  };

  const onCloseSuccess = useCallback(() => {
    setStep(0);
    onClose();
  }, []);

  return (
    <div>
      <Modal onClose={onClose} show={open} size="lg" extraClasses="!p-0">
        {step == 0 ? (
          <>
            <Modal.Header>
              <div>
                <span className="text-xl font-medium">
                  {translate("questions.reject-question.title")}
                </span>
              </div>
            </Modal.Header>
            <div className="flex flex-col px-4 py-4">
              <div>
                <textarea
                  rows={50}
                  className="w-full p-2 border rounded-lg outline-none resize-none h-52 placeholder:text-tertiary-600 border-tertiary-200/50"
                  name="feedback"
                  id="feedback"
                  placeholder={translate(
                    "questions.reject-question.placeholder",
                  )}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
              <div className="flex justify-center gap-x-2 mt-11">
                <ButtonV2 onClick={onClose} variant="tertiaryDark">
                  {translate("common.cancel")}
                </ButtonV2>
                <ButtonV2
                  onClick={onSubmitFeedback}
                  variant="primary"
                  rightIcon={allImgPaths.rightArrow}
                  loading={isIgnoring}
                >
                  {isIgnoring
                    ? translate("common.submitting")
                    : translate("common.submit-feedback")}
                </ButtonV2>
              </div>
            </div>
          </>
        ) : (
          <SuccessIgnore onClose={onCloseSuccess} />
        )}
      </Modal>
    </div>
  );
};

export default React.memo(RejectQuestionForm);
