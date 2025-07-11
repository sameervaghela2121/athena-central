import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";

const ActionGuide = () => {
  const { translate } = useTranslate();

  return (
    <div className="bg-white w-96">
      <div className="flex flex-col gap-y-6">
        <div>
          <div className="flex items-center bg-tertiary-50 rounded-lg px-2 py-1">
            <img src={allImgPaths.actionAnswer} className="w-10 h-10 " />
            <span className="text-status-success font-semibold">
              {translate("questions.action-guide.answer.title")}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-sm font-normal text-tertiary-900">
              {translate("questions.action-guide.answer.description")}
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center bg-tertiary-50 rounded-lg px-2 py-1">
            <img src={allImgPaths.rejectCheckIcon} className="w-10 h-10 " />
            <span className="text-status-error font-semibold">
              {translate("questions.action-guide.ignore.title")}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-sm font-normal text-tertiary-900">
              {translate("questions.action-guide.ignore.description")}
            </p>
          </div>
        </div>
        <div>
          <div className="flex items-center bg-tertiary-50 rounded-lg px-2 py-1">
            <div className="w-10 h-10 flex justify-center items-center">
              <img src={allImgPaths.rerouteCheckIcon} />
            </div>
            <span className="text-status-brand font-semibold">
              {translate("questions.action-guide.reroute.title")}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-sm font-normal text-tertiary-900">
              {translate("questions.action-guide.reroute.description")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionGuide;
