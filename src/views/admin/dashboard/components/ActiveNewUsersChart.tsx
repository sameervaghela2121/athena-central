import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import { NoRecord, Tooltip as ReactTooltip } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { download } from "@/shared/functions";
import { get, size } from "lodash-es";
import moment from "moment";
import queryString from "query-string";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GraphRender from "./GraphRender";
import WidgetHeader from "./WidgetHeader";

const ActiveNewUsersChart = () => {
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);
  const { translate } = useTranslate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  const fetchUsersGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });

      const data: any = await api.fetchActiveUsersNewUsersState(qRequest);

      const result = get(data, "data.result", []);

      setData(result);
    } catch (error) {
      console.error("fetchUsersGraphData error =>", error);
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

      const data: any = await api.fetchActiveUsersNewUsersState(qRequest);

      download(data, "Active New Users.csv");
    } catch (error) {
      console.error("fetchActiveUsersNewUsersState error =>", error);
    }
  };

  useEffect(() => {
    fetchUsersGraphData();
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col flex-nowrap justify-between content-between h-full">
        {/* Header Section */}
        <div className="flex gap-x-1 justify-between items-center mb-4 w-full">
          <WidgetHeader
            title={translate("dashboard.activeUserChat.title")}
            info={
              <div>
                <ReactTooltip
                  title={translate("dashboard.activeUserChat.infoTitle")}
                  content={
                    <div className="max-w-xs">
                      <p className="mb-2">
                        {translate("dashboard.activeUserChat.infoTitle")}
                      </p>
                      <ul className="pl-4 list-disc">
                        <li className="mb-1">
                          <span className="font-semibold text-secondary-900">
                            {translate("dashboard.activeUserChat.activeUsers")}:
                          </span>{" "}
                          {translate(
                            "dashboard.activeUserChat.activeUsersDescription",
                          )}
                        </li>
                        <li>
                          <span className="font-semibold text-primary-900">
                            {translate("dashboard.activeUserChat.newUsers")}:
                          </span>{" "}
                          {translate(
                            "dashboard.activeUserChat.newUsersDescription",
                          )}
                        </li>
                      </ul>
                    </div>
                  }
                  color="default"
                  place="right"
                  className="text-left whitespace-normal"
                >
                  <img
                    src={allImgPaths.infoDark}
                    alt="info button"
                    className="transition-opacity cursor-help hover:opacity-80"
                  />
                </ReactTooltip>
              </div>
            }
            right={
              <>
                {size(data) > 0 && (
                  <div className="flex gap-x-6">
                    <div className="flex gap-x-2 items-center">
                      <div className="w-3 h-3 rounded-full bg-secondary-900"></div>
                      <span>
                        {translate("dashboard.activeUserChat.activeUsers")}
                      </span>
                    </div>

                    <div className="flex gap-x-2 items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-900"></div>
                      <span>
                        {translate("dashboard.activeUserChat.newUsers")}
                      </span>
                    </div>
                  </div>
                )}
              </>
            }
          />
        </div>

        {/* Chart Section */}
        <GraphRender isLoading={isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            {size(data) > 0 ? (
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <XAxis dataKey="month_name" />
                <YAxis
                  label={{
                    value: translate("dashboard.activeUserChat.users"),
                    angle: -90,
                    position: "insideLeft",
                    offset: 8,
                    style: { textAnchor: "middle", fill: "#333", fontSize: 16 },
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-md">
                          <p className="mb-2 font-semibold">
                            {payload[0]?.payload?.month_name}
                          </p>
                          <div className="space-y-2">
                            {payload.map((entry, index) => (
                              <div
                                key={index}
                                className="flex gap-x-2 items-center"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                ></div>
                                <span className="text-sm">
                                  {entry.name}:{" "}
                                  <span className="font-medium">
                                    {entry.value}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  wrapperStyle={{ outline: "none" }}
                />
                {/* <Legend /> */}
                <Bar
                  dataKey="active_users"
                  fill="#4DA3C7"
                  name={translate("dashboard.activeUserChat.activeUsers")}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="new_users"
                  fill="#003366"
                  name={translate("dashboard.activeUserChat.newUsers")}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            ) : (
              <NoRecord />
            )}
          </ResponsiveContainer>
        </GraphRender>
      </div>

      {!isLoading && size(data) > 0 && (
        <div className="grid grid-cols-1 justify-between items-center mt-4 w-full">
          <div className="text-base text-center text-gray-500">
            {moment(startDate).format("MMMM")}{" "}
            <span className="font-semibold text-tertiary-900">
              {translate("common.to")} ({moment(endDate).format("Do MMMM YY")})
            </span>
          </div>
          <div className="flex gap-x-2 justify-end items-center border-tertiary-500">
            {/* <div className="flex gap-x-2 px-2 rounded-lg border-2 w-fit">
              <ButtonV2
                variant="text"
                onClick={onDownload}
                className="!no-underline text-tertiary-500"
              >
                {translate("common.download")}
              </ButtonV2>
              <img src={allImgPaths.downloadIcon2} alt="" className="w-5" />
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveNewUsersChart;
