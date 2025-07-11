import Tooltip from "@/components/Tooltip";
import { get, orderBy, size } from "lodash-es";
import moment from "moment";
import queryString from "query-string";
import { useEffect, useState } from "react";

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";

import {
  ButtonV2,
  Loader,
  LoaderCircle,
  NoRecord,
  Tooltip as ReactTooltip,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";

import { useTranslate } from "@/hooks";
import { download } from "@/shared/functions";
import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

const TopQuestionHandlers = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>([]);

  const { startDate, endDate } = useAppState(RootState.DASHBOARD);
  const { translate } = useTranslate();

  const fetchTopQuestionHandlerGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });
      const data: any = await api.fetchTopQuestionHandlerGraphData(qRequest);

      let result = get(data, "data.result", []);

      result = orderBy(result, ["total_actions"], ["desc"]);

      setData(result);
    } catch (error) {
      console.error("fetchTopQuestionHandlerGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopQuestionHandlerGraphData();
  }, [startDate, endDate]);

  const onDownload = async () => {
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
        response_type: "csv",
      });

      const data: any = await api.fetchTopQuestionHandlerGraphData(qRequest);

      download(data, "top question handler questions.csv");
    } catch (error) {
      console.error("fetchTopQuestionHandlerGraphData error =>", error);
    }
  };

  const tableGridClasses =
    "grid min-w-fit border-b grid-cols-[minmax(190px,100%)_minmax(100px,0%)_minmax(120px,0%)_minmax(120px,0%)_minmax(130px,0%)] px-2";

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <WidgetHeader
          title={translate("dashboard.topQuestionHandlers.widgetHeaderTitle")}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate(
                      "dashboard.topQuestionHandlers.widgetHeaderTitle",
                    )}
                    info={
                      <p className="text-tertiary-600">
                        {translate("dashboard.topQuestionHandlers.infoTitle")}
                      </p>
                    }
                  />
                }
                color="default"
                place="right"
              >
                <img
                  src={allImgPaths.infoDark}
                  alt="info button"
                  className="transition-opacity cursor-help hover:opacity-80"
                />
              </ReactTooltip>
            </div>
          }
          right={<div className="flex gap-x-2"></div>}
        />
        {isLoading ? (
          <LoaderCircle />
        ) : (
          <>
            {size(data) > 0 ? (
              <div className="overflow-x-auto w-full">
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map((row: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col w-full border-b md:flex-row"
                    >
                      <div className="p-2 w-full">
                        <Loader count={1} />
                      </div>
                      <div className="p-2 w-full">
                        <Loader count={1} />
                      </div>
                      <div className="p-2 w-full">
                        <Loader count={1} />
                      </div>
                      <div className="p-2 w-full">
                        <Loader count={1} />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {size(data) > 0 ? (
                      <>
                        {/* Table Header */}
                        <div
                          className={`text-base font-medium border-black md:flex-row text-tertiary-700 ${tableGridClasses}`}
                        >
                          <div className="py-2">
                            {translate(
                              "dashboard.topQuestionHandlers.handlerName",
                            )}
                          </div>
                          <div className="py-2 text-center">
                            {translate(
                              "dashboard.topQuestionHandlers.answered",
                            )}
                          </div>
                          <div className="py-2 text-center">
                            {translate("dashboard.topQuestionHandlers.ignored")}
                          </div>
                          <div className="py-2 text-center">
                            {translate(
                              "dashboard.topQuestionHandlers.rerouted",
                            )}
                          </div>
                          <div className="py-2 text-center">
                            {translate(
                              "dashboard.topQuestionHandlers.totalActions",
                            )}
                          </div>
                        </div>

                        {/* Table Body */}
                        <div className="grid mt-2 min-w-fit">
                          {!isLoading &&
                            data.map((row: any, index: number) => (
                              <div
                                key={index}
                                className={`py-1 even:bg-[#F6F5FF] ${tableGridClasses}`}
                              >
                                <ReactTooltip
                                  content={get(row, "handler_info", "")}
                                  place="top"
                                >
                                  <div className="overflow-hidden max-w-full whitespace-nowrap border-4 border-transparent text-ellipsis">
                                    <span>{get(row, "handler_info", "")}</span>
                                  </div>
                                </ReactTooltip>
                                <div className="overflow-hidden text-center whitespace-nowrap border-4 border-transparent text-ellipsis">
                                  {get(row, "answered", "")}
                                </div>
                                <div className="overflow-hidden text-center whitespace-nowrap border-4 border-transparent text-ellipsis">
                                  {row.ignored}
                                </div>
                                <div className="overflow-hidden text-center whitespace-nowrap border-4 border-transparent text-ellipsis">
                                  {row.rerouted}
                                </div>
                                <div className="overflow-hidden text-center whitespace-nowrap border-4 border-transparent text-ellipsis">
                                  {row.total_actions}
                                </div>
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      <NoRecord />
                    )}
                  </>
                )}
              </div>
            ) : (
              <NoRecord />
            )}
          </>
        )}
      </div>

      {!isLoading && size(data) > 0 && (
        <div className="grid grid-cols-2 justify-between items-center mt-4 w-full">
          <div className="text-base text-left text-gray-500">
            {moment(startDate).format("MMMM")}{" "}
            <span className="font-semibold text-tertiary-900">
              {translate("common.to")} ({moment(endDate).format("Do MMMM YY")})
            </span>
          </div>
          <div className="flex gap-x-2 justify-end items-center border-tertiary-500">
            <Tooltip content={translate("common.downloadAsCSV")}>
              <div className="flex gap-x-2 px-2 rounded-lg border-2 w-fit">
                <ButtonV2
                  variant="text"
                  onClick={onDownload}
                  className="!no-underline text-tertiary-500"
                >
                  {translate("common.download")}
                </ButtonV2>
                <img src={allImgPaths.downloadIcon2} alt="" className="w-5" />
              </div>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopQuestionHandlers;
