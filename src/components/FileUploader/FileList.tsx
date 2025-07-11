import allImgPaths from "@/assets";
import { Popover } from "@/components";
import { fileIconMapper } from "@/shared/constants";
import { formatSizeUnits, removeExtension } from "@/shared/functions";
interface UploadItemProps {
  file: File & { status: string; failure_reason: string };
  progress: number;
  disabled?: boolean;
  removeFile: () => void;
}

const FileList: React.FC<UploadItemProps> = ({
  file,
  disabled = false,
  progress,
  removeFile,
}) => {
  const { type, name, size, status, failure_reason } = file ?? {};

  return (
    <div className="flex overflow-hidden relative items-center p-2 rounded-lg border border-gray-300">
      {progress == 100 && (
        <div className="bg-status-success/30 absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-50 -top-[150px] -left-[150px]" />
      )}
      {progress !== 100 && (
        <div className="bubble-animated bg-secondary-900 absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-50 -top-[150px] -left-[150px]" />
      )}
      <div className="flex flex-col flex-none flex-shrink-0 gap-y-2 w-16">
        <img
          src={fileIconMapper[type] ?? allImgPaths.file}
          alt="html"
          className="w-9 h-9"
        />

        <div className="text-xs text-gray-500">
          {formatSizeUnits(`${size}`)}
        </div>
      </div>
      <div className="flex-1 w-52">
        <div className="flex justify-between font-medium text-gray-700">
          <span className="w-80 truncate">{removeExtension(name)}</span>
          <div className="flex">
            {status === "FAILED" && (
              <Popover
                quick
                position="top"
                trigger={
                  <div className="p-2 rounded-full duration-500 cursor-pointer hover:bg-status-error/20">
                    <img
                      src={allImgPaths.warningRedIcon}
                      alt=""
                      className="w-5 h-5"
                    />
                  </div>
                }
                content={
                  <div className="max-w-xs text-sm text-gray-700">
                    {failure_reason || "File upload failed"}
                  </div>
                }
                classes="bg-white shadow-lg"
              />
            )}
            {!disabled && (
              <div
                className="p-2 rounded-full duration-500 cursor-pointer hover:bg-status-error/20"
                onClick={removeFile}
              >
                <img src={allImgPaths.trash} alt="" className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-x-4 justify-between items-center mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`${progress === 100 ? "bg-status-success" : "bg-secondary-900"} h-2.5 rounded-full`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="w-10 text-right">
            <span className="">{progress + "%"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileList;
