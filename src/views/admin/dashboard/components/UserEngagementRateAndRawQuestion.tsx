import queryString from "query-string";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import { NoRecord, Tooltip as ReactTooltip } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";

import { useTranslate } from "@/hooks";
import { size } from "lodash-es";
import GraphRender from "./GraphRender";
import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

const UserEngagementRateAndRawQuestion = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>([]);

  const { startDate, endDate } = useAppState(RootState.DASHBOARD);
  const { translate } = useTranslate();

  const fetchUsersEngagementRateGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });

      const result: any = await api.fetchQuestionsState(qRequest);

      setData(result);
    } catch (error) {
      console.error("fetchUsersEngagementRateGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersEngagementRateGraphData();
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Header Section */}
      <div className="flex gap-x-1 justify-between items-center mb-4 w-full">
        <WidgetHeader
          title={translate(
            "dashboard.userEngagementRateAndRawQuestion.widgetHeaderTitle",
          )}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate(
                      "dashboard.userEngagementRateAndRawQuestion.widgetHeaderTitle",
                    )}
                    info={
                      <p className="text-tertiary-600">
                        {translate(
                          "dashboard.userEngagementRateAndRawQuestion.infoTitle",
                        )}
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
        />
      </div>

      {/* Chart Section */}
      <GraphRender isLoading={isLoading}>
        {size(data) > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={420}
            style={{ paddingTop: 8 }}
          >
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 0,
                left: 0,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient
                  id="colorUv"
                  x1="307.964"
                  y1="0.619141"
                  x2="307.964"
                  y2="289.999"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#8979FF" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#8979FF" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              <XAxis dataKey="name" />
              <YAxis dataKey="total_count" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total_count"
                name="Total Count"
                stroke="#8884d8"
                fill="url(#colorUv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div>
            <NoRecord />
          </div>
        )}
      </GraphRender>
    </div>
  );
};

export default UserEngagementRateAndRawQuestion;
