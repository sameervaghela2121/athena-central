import allImgPaths from "@/assets";
import { ButtonV2, Divider } from "@/components";
import { useTranslate } from "@/hooks";
import { SAVE_MODE } from "@/shared/constants";

const PublishKE = ({
  setOpenAccessControl,
  setShowAccessControlWarning,
  setValue,
  handleExternalSubmit,
  getValues,
  isLoading,
  onClose,
}: {
  setOpenAccessControl: (value: boolean) => void;
  setShowAccessControlWarning: (value: boolean) => void;
  setValue: any;
  handleExternalSubmit: () => void;
  getValues: () => any;
  isLoading: boolean;
  onClose?: () => void;
}) => {
  const { translate } = useTranslate();
  const { view, edit } = getValues();

  return (
    <div
      className="flex relative flex-col justify-center items-center p-6 pt-14 w-full bg-white rounded-lg shadow-xl"
      role="dialog"
      aria-modal="true"
    >
      {/* Close button in top right corner */}
      <div
        className="absolute top-4 right-4 cursor-pointer"
        onClick={() => onClose && onClose()}
        aria-label={translate("common.close")}
      >
        <img src={allImgPaths.closeIcon} alt="close" className="w-4 h-4" />
      </div>

      <div className="mb-6">
        <p className="text-lg text-center text-tertiary-900">
          {translate("KEs.warning.title")}{" "}
          <span className="mt-2 text-gray-600">
            {translate("KEs.warning.sub-title")}
          </span>
        </p>
      </div>

      <Divider className="!h-2 w-full mb-6" />

      <div className="flex flex-col justify-center items-center space-y-4">
        <div className="flex flex-col gap-3 items-center">
          {Object.keys(view).map((eachKey: any) => {
            if (
              eachKey !== "include_all_franchises" &&
              eachKey !== "giveCustomViewAccess" &&
              view[eachKey]
            ) {
              let displayText;
              switch (eachKey) {
                case "giveAllViewAccess":
                  displayText = translate(
                    "KEs.warning.bullets.giveAllViewAccess",
                  );
                  break;
                case "byName":
                  displayText = translate("KEs.warning.bullets.byName");
                  break;
                case "giveCustomViewAccess":
                  displayText = translate(
                    "KEs.warning.bullets.giveCustomViewAccess",
                  );
                  break;
                case "byAttribute":
                  displayText = translate("KEs.warning.bullets.byAttribute");
                  break;
              }
              return (
                <div className="flex gap-3 items-center" key={eachKey}>
                  <div className="w-3 h-3 rounded-full bg-secondary-900" />
                  <p className="text-base text-secondary-900">{displayText}</p>
                </div>
              );
            }
          })}
        </div>
        <div className="flex flex-col gap-3 items-center">
          {Object.keys(edit).map((eachKey: any) => {
            if (edit[eachKey]) {
              let displayText;
              switch (eachKey) {
                case "editAccessToAllAdmins":
                  displayText = translate(
                    "KEs.warning.bullets.editAccessToAllAdmins",
                  );
                  break;
                case "giveAllEditAccess":
                  displayText = translate(
                    "KEs.warning.bullets.giveAllEditAccess",
                  );
                  break;
                case "giveCustomEditAccess":
                  displayText = translate(
                    "KEs.warning.bullets.giveCustomEditAccess",
                  );
                  break;
              }
              return (
                <div className="flex gap-3 items-center" key={eachKey}>
                  <div className="w-3 h-3 rounded-full bg-secondary-900" />
                  <p className="text-base text-secondary-900">{displayText}</p>
                </div>
              );
            }
          })}
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-8">
        <ButtonV2
          variant="tertiary"
          disabled={isLoading}
          onClick={() => {
            setOpenAccessControl(true);
            setShowAccessControlWarning(false);
          }}
        >
          {translate("common.modifyAccess")}
        </ButtonV2>
        <ButtonV2
          type="submit"
          variant="primary"
          disabled={isLoading}
          loading={isLoading}
          onClick={() => {
            setValue("status", SAVE_MODE.PUBLISHED);
            handleExternalSubmit();
          }}
        >
          {translate("common.publish")}
        </ButtonV2>
      </div>
    </div>
  );
};

export default PublishKE;
