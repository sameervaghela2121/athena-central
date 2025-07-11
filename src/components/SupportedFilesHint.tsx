import allImgPaths from "@/assets";
import { FILE_FORMATS_TOOLTIP_CONTENT } from "@/shared/constants";
import { startCase } from "lodash-es";
import Divider from "./Divider";
import Popover from "./Popover";

const SupportedFilesHint = () => {
  return (
    <Popover
      content={
        <div className="max-w-lg text-base text-gray-700">
          <div className="flex gap-x-2 items-center px-4 pb-2">
            <p className="text-lg font-bold text-tertiary-900">
              Supported formats:
            </p>
          </div>
          <Divider />
          <ul className="px-6 pt-4 list-disc">
            {Object.entries(FILE_FORMATS_TOOLTIP_CONTENT).map(
              ([category, formats], index) => (
                <li key={index} className="mb-2">
                  <b className="font-bold text-tertiary-900">
                    {startCase(category)}
                  </b>
                  :
                  <ul className="px-4 list-disc">
                    {(formats as any[]).map((format, idx) => (
                      <li key={idx}>
                        <span className="font-medium text-gray-800">
                          {format.type}
                        </span>{" "}
                        — <span className="text-gray-600">{format.desc}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        </div>
      }
      trigger={
        <img
          src={allImgPaths.infoDark}
          className="w-6 h-6 transition-opacity cursor-help hover:opacity-80"
          alt="Information icon"
        />
      }
    />
  );
};

export default SupportedFilesHint;
