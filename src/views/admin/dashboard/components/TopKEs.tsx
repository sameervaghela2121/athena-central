import { get, orderBy, size } from "lodash-es";
import moment from "moment";
import queryString from "query-string";
import { useEffect, useState } from "react";

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import {
  ButtonV2,
  Loader,
  NoRecord,
  Tooltip as ReactTooltip,
  Tooltip,
} from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { download, formatDate } from "@/shared/functions";

import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

const TopKEs = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>([]);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const { startDate, endDate } = useAppState(RootState.DASHBOARD);
  const {
    user: {
      preferences: { date_format },
    },
  } = useAppState(RootState.AUTH);
  const { translate } = useTranslate();

  const fetchTopKESGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });
      const data: any = await api.fetchTopKESGraphData(qRequest);
      let result = get(data, "data.result", []).slice(0, 10);

      result = orderBy(result, ["usage_count"], [sortOrder]);

      setData(result);
    } catch (error) {
      console.error("fetchTopKESGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopKESGraphData();
  }, [startDate, endDate]);

  useEffect(() => {
    const _data = [...data];
    const sorted = orderBy(_data, ["usage_count"], [sortOrder]);

    setData(sorted);
  }, [sortOrder]);

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const onDownload = async () => {
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
        response_type: "csv",
      });

      const data: any = await api.fetchTopKESGraphData(qRequest);

      download(data, "top KEs.csv");
    } catch (error) {
      console.error("fetchTopKEsGraphData error =>", error);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col flex-nowrap h-full">
        <WidgetHeader
          title={translate("dashboard.topKEs.title")}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate("dashboard.topKEs.title")}
                    info={
                      <p className="text-tertiary-600">
                        {translate("dashboard.topKEs.infoTitle")}
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
          // right={
          //   <div className="flex gap-x-2">
          //     {size(data) > 0 && (
          //       <div>
          //         <IconButton
          //           onClick={toggleSort}
          //           src={
          //             sortOrder === "desc"
          //               ? allImgPaths.priorityAsc
          //               : allImgPaths.priorityDes
          //           }
          //           className="rounded-lg bg-white border h-full w-[42px]"
          //         />
          //       </div>
          //     )}
          //   </div>
          // }
        />

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
                  <div className="grid min-w-fit border-b grid-cols-[minmax(220px,50%)_minmax(130px,40%)_minmax(120px,10%)_minmax(170px,0%)] px-2 text-base font-medium  border-black md:flex-row text-tertiary-700">
                    <div className="py-2">
                      {translate("dashboard.topKEs.KEs")}
                    </div>
                    <div className="py-2">
                      {translate("dashboard.topKEs.createdBy")}
                    </div>
                    <div className="py-2 text-center">
                      {translate("dashboard.topKEs.timesUsed")}
                    </div>
                    <div className="py-2 text-center">
                      {translate("dashboard.topKEs.createdDate")}
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="grid mt-2 border-b min-w-fit">
                    {!isLoading &&
                      data.map((row: any, index: number) => (
                        <div
                          key={index}
                          className="even:bg-[#F6F5FF] min-w-fit border-b grid grid-cols-[minmax(220px,50%)_minmax(130px,40%)_minmax(120px,10%)_minmax(170px,0%)]"
                        >
                          <div className="overflow-hidden py-1 border-4 border-transparent">
                            <span className="line-clamp-1"> {row.title}</span>
                          </div>
                          <div className="overflow-hidden py-1 border-4 border-transparent line-clamp-1">
                            <span className="line-clamp-1">
                              {get(row, "created_by", "")}
                            </span>
                          </div>
                          <div className="overflow-hidden py-1 text-center border-4 border-transparent line-clamp-1">
                            <span className="line-clamp-1">
                              {row.usage_count}
                            </span>
                          </div>
                          <div className="overflow-hidden py-1 text-center border-4 border-transparent line-clamp-1">
                            <span className="line-clamp-1">
                              {formatDate(row.created_at, date_format)}
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

export default TopKEs;
