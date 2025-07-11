import allImgPaths from "@/assets";
import { ButtonV2, Flex, Modal } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { setCookie } from "@/shared/functions";
import { size } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

// TODO
const AppTour = ({
  type = "KE",
  open,
  onClose,
  onDone,
}: {
  type: "KE" | "BULK-UPLOAD";
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [step, setStep] = useState(1);
  const { translate } = useTranslate();

  const { updateState } = useAppState(RootState.COMMON);

  useEffect(() => {
    setStep(1);
  }, [type, open]);

  const steps: any =
    type === "KE"
      ? {
          1: {
            name: translate("KEs.guide.singleKE.step1.title"),
            list: [
              {
                text: translate("KEs.guide.singleKE.step1.text1"),
              },
              {
                text: translate("KEs.guide.singleKE.step1.text2"),
              },
            ],
          },
          2: {
            name: translate("KEs.guide.singleKE.step1.title"),
            list: [
              {
                text: translate("KEs.guide.singleKE.step2.text1"),
              },
              {
                text: translate("KEs.guide.singleKE.step2.text2"),
              },
              {
                text: translate("KEs.guide.singleKE.step2.text3"),
              },
            ],
          },
        }
      : {
          1: {
            name: translate("KEs.guide.bulkKE.step1.title"),
            list: [
              {
                text: translate("KEs.guide.bulkKE.step1.text1"),
              },
              {
                text: translate("KEs.guide.bulkKE.step1.text2"),
              },
            ],
          },
          2: {
            name: translate("KEs.guide.bulkKE.step2.title"),
            list: [
              {
                text: translate("KEs.guide.bulkKE.step2.text1"),
              },
              {
                text: translate("KEs.guide.bulkKE.step2.text2"),
              },
              {
                text: translate("KEs.guide.bulkKE.step2.text3"),
              },
            ],
          },
          3: {
            name: translate("KEs.guide.bulkKE.step3.title"),
            list: [
              {
                text: translate("KEs.guide.bulkKE.step3.text1"),
              },
              {
                text: translate("KEs.guide.bulkKE.step3.text2"),
              },
              {
                text: translate("KEs.guide.bulkKE.step3.text3"),
              },
              {
                text: translate("KEs.guide.bulkKE.step3.text4"),
              },
              {
                text: translate("KEs.guide.bulkKE.step3.text5"),
              },
              {
                text: translate("KEs.guide.bulkKE.step3.text6"),
              },
            ],
          },
        };

  const onPrev = () => {
    setStep((prev) => {
      return prev === 1 ? 1 : prev - 1;
    });
  };
  const onNext = () => {
    if (size(steps) === step) {
      switch (type) {
        case "BULK-UPLOAD":
          setCookie("showBulkGuide", "hide");
          updateState({ showBulkGuide: false });
          break;
        case "KE":
          setCookie("showKEGuide", "hide");
          updateState({ showKEGuide: false });
          break;

        default:
          break;
      }
      onClose();
      onDone();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const content = useMemo(() => steps[step], [step]);

  const header = useMemo(() => {
    switch (type) {
      case "BULK-UPLOAD":
        return {
          title: translate("KEs.guide.bulkKE.title"),
          description: translate("KEs.guide.bulkKE.subtitle"),
        };

      default:
        return {
          title: translate("KEs.guide.singleKE.title"),
          description: translate("KEs.guide.singleKE.subtitle"),
        };
    }
  }, [type]);

  return (
    <div>
      <Modal onClose={onClose} show={open} size="lg" extraClasses="!p-0">
        <Modal.Header className="bg-primary-900 text-secondary-600">
          <Flex justify="between" align="center">
            <Flex className="gap-2" align="center">
              <img src={allImgPaths.idea} alt="close" />
              <div>
                <h2 className="text-xl font-medium">{header?.title}</h2>
              </div>
            </Flex>
            <div
              onClick={onClose}
              className="p-1 rounded-full duration-200 cursor-pointer hover:bg-primary-500"
            >
              <img src={allImgPaths.crossSkyBlue} alt="close" />
            </div>
          </Flex>
          <div className="mt-2">
            <p>{header?.description}</p>
          </div>
        </Modal.Header>
        <div className="p-5 pt-3">
          <Flex align="center" gap={2}>
            <div>
              <img
                src={allImgPaths.infoDark}
                alt=""
                className="transition-opacity cursor-help hover:opacity-80"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold">{content.name}</h2>
            </div>
          </Flex>
          <div className="mt-4">
            <Flex direction="column" className="gap-y-3">
              {content.list.map((item: any, index: number) => (
                <div className="flex gap-x-1" key={index}>
                  {item.icon && (
                    <img src={item.icon} alt={item.text} className="w-6 h-6" />
                  )}
                  <li
                    key={index}
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                </div>
              ))}
            </Flex>
          </div>
          <div className="flex justify-between mt-12">
            <div>
              {step !== 1 && (
                <ButtonV2
                  onClick={onPrev}
                  variant="text"
                  leftIcon={allImgPaths.leftArrowBlue}
                >
                  {translate("common.previous")}
                </ButtonV2>
              )}
            </div>
            <div>
              <ButtonV2
                onClick={onNext}
                variant="text"
                rightIcon={allImgPaths.rightArrowBlue}
              >
                {step === size(steps)
                  ? type === "KE"
                    ? translate("KEs.newKEBtn")
                    : translate("KEs.newBulkKEBtn")
                  : translate("common.next")}
              </ButtonV2>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppTour;
