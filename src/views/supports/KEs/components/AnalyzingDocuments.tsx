import allImgPaths from "@/assets";
import { useTranslate } from "@/hooks";

// language translate later
const AnalyzingDocuments = ({ progress = 0 }: { progress: number }) => {
  const { translate } = useTranslate();

  return (
    <div className="h-[calc(100vh_-_73px)] flex justify-center">
      <div className="h-full flex flex-col items-center justify-center gap-y-4 w-[424px]">
        <div>
          <img src={allImgPaths.analyzingFiles} alt="analyzingFiles" />
        </div>
        <div>
          <h2 className="font-bold text-[32px] text-tertiary-900">
            {translate("KEs.analyzing-documents.title")}
          </h2>
        </div>
        <div className="text-center italic">
          <span className="text-tertiary-400 ">
            {translate("KEs.analyzing-documents.caption1")}
            <br />
            {translate("KEs.analyzing-documents.caption2")}
          </span>
        </div>
        <div className="w-full">
          <div className="mt-2 flex items-center justify-between gap-x-1 flex-col">
            <div className="w-full text-right">
              <span className="font-semibold">{progress + "%"}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-status-brand h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzingDocuments;
