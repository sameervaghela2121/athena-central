import { get, orderBy, size } from "lodash-es";
import moment from "moment";
import { useEffect, useState } from "react";

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import WidgetHeader from "./WidgetHeader";

import {
  ButtonV2,
  Loader,
  LoaderCircle,
  NoRecord,
  Tooltip as ReactTooltip,
  Tooltip,
} from "@/components";
import { useTranslate } from "@/hooks";
import { download, formatSecondTime } from "@/shared/functions";
import queryString from "query-string";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

const QueueAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>([]);

  const { translate } = useTranslate();
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);

  const fetchQueuesAnalyticsGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });

      const data: any = await api.fetchQueuesAnalyticsGraphData(qRequest);

      let result = get(data, "data.result", []);
      result = orderBy(result, ["question"], ["desc"]);

      setData(result);
    } catch (error) {
      console.error("fetchQueuesAnalyticsGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDownload = async () => {
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
        response_type: "csv",
      });

      const data: any = await api.fetchQueuesAnalyticsGraphData(qRequest);

      download(data, "queue analytics.csv");
    } catch (error) {
      console.error("fetchTopQuestionHandlerGraphData error =>", error);
    }
  };

  useEffect(() => {
    fetchQueuesAnalyticsGraphData();
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <WidgetHeader
          title={translate("dashboard.queueAnalytics.widgetHeaderTitle")}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate(
                      "dashboard.queueAnalytics.widgetHeaderTitle",
                    )}
                    info={
                      <p className="text-tertiary-600">
                        {translate("dashboard.queueAnalytics.infoTitle")}
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
                        <div className="grid min-w-fit border-b grid-cols-[minmax(135px,100%)_minmax(110px,0%)_minmax(110px,0%)_minmax(110px,0%)_minmax(110px,0%)_minmax(120px,0%)] px-2 text-base font-medium  border-black md:flex-row text-tertiary-700">
                          <div className="py-2">
                            {translate("dashboard.queueAnalytics.queue")}
                          </div>
                          <div className="py-2 text-center">
                            {translate("dashboard.queueAnalytics.question")}
                          </div>
                          <div className="py-2 text-center">
                            {translate("dashboard.queueAnalytics.answered")}
                          </div>
                          <div className="py-2 text-center">
                            {translate("dashboard.queueAnalytics.pending")}
                          </div>
                          <div className="py-2 text-center">
                            {translate("dashboard.queueAnalytics.rerouted")}
                          </div>
                          <div className="py-2 text-center">
                            {translate("dashboard.queueAnalytics.avgRespTime")}
                          </div>
                        </div>

                        {/* Table Body */}
                        <div className="grid mt-2 border-b min-w-fit">
                          {!isLoading &&
                            data.map((row: any, index: number) => (
                              <div
                                key={index}
                                className="even:bg-[#F6F5FF] py-1 grid min-w-fit border-b  px-2 grid-cols-[minmax(135px,100%)_minmax(110px,0%)_minmax(110px,0%)_minmax(110px,0%)_minmax(110px,0%)_minmax(120px,0%)]"
                              >
                                <div className="overflow-hidden border-4 border-transparent line-clamp-1">
                                  <Tooltip
                                    content={row.queue_name}
                                    place="left"
                                  >
                                    {row.queue_name}
                                  </Tooltip>
                                </div>
                                <div className="overflow-hidden text-center border-4 border-transparent">
                                  <span className="line-clamp-1">
                                    {row.question}
                                  </span>
                                </div>
                                <div className="overflow-hidden text-center border-4 border-transparent">
                                  <span className="line-clamp-1">
                                    {row.answered}
                                  </span>
                                </div>
                                <div className="overflow-hidden text-center border-4 border-transparent">
                                  <span className="line-clamp-1">
                                    {row.pending}
                                  </span>
                                </div>
                                <div className="overflow-hidden text-center border-4 border-transparent">
                                  <span className="line-clamp-1">
                                    {row.rerouted}
                                  </span>
                                </div>
                                <div className="overflow-hidden text-center border-4 border-transparent">
                                  <span className="line-clamp-1">
                                    {formatSecondTime(row.avg_response_time)}
                                  </span>
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

export default QueueAnalytics;
