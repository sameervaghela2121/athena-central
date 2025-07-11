import api from "@/apis/dashboard";
import { size } from "lodash-es";
import moment from "moment";
import queryString from "query-string";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import allImgPaths from "@/assets";
import { NoRecord, Tooltip as ReactTooltip } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import GraphRender from "./GraphRender";
import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

const KnowledgeBaseUtilization = () => {
  const { translate } = useTranslate();
  const { duration } = useAppState(RootState.DASHBOARD);
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>([]);

  const fetchKnowledgeBaseUtilizationGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });
      const result: any =
        await api.fetchKnowledgeBaseUtilizationGraphData(qRequest);

      setData(result);
    } catch (error) {
      console.error("fetchKnowledgeBaseUtilizationGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBaseUtilizationGraphData();
  }, [startDate, endDate]);

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;

    const offset = 10; // Offset above the bar
    return (
      <text
        x={x + width / 2} // Center horizontally
        y={y - offset} // Position above the bar
        fill="#000" // Text color
        textAnchor="middle"
        fontSize={14}
      >
        {value}
      </text>
    );
  };

  const CustomTooltip: any = ({ active, payload, label, ...rest }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white rounded-md shadow-md">
          <p className="desc">{}</p>
          <p className="label">
            {payload[0].name}:{" "}
            <span className="font-bold">{payload[0].value} %</span>
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Header Section */}
      <div className="flex gap-x-1 items-center mb-4 w-full">
        <WidgetHeader
          title={translate(
            "dashboard.knowledgeBaseUtilization.widgetHeaderTitle",
          )}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate(
                      "dashboard.knowledgeBaseUtilization.widgetHeaderTitle",
                    )}
                    info={
                      <p className="text-tertiary-600">
                        {translate(
                          "dashboard.knowledgeBaseUtilization.infoTitle",
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
          right={
            <>
              {size(data) > 0 && (
                <div className="flex gap-x-2 justify-end items-baseline w-full">
                  <div className="w-3 h-3 bg-[#003366] rounded-full"></div>
                  <div>
                    {translate("dashboard.knowledgeBaseUtilization.keCreated")}
                  </div>
                </div>
              )}
            </>
          }
        />
      </div>
      {/* Chart Section */}
      <GraphRender isLoading={isLoading}>
        <ResponsiveContainer width="100%" height={400} className={"mt-10"}>
          {size(data) > 0 ? (
            <BarChart
              width={150}
              height={40}
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <Bar
                barSize={54}
                dataKey="ke_count"
                fill="#003366"
                radius={[8, 8, 0, 0]}
                minPointSize={0}
              >
                <LabelList dataKey="ke_count" content={renderCustomLabel} />
              </Bar>
              <YAxis
                label={{
                  value: translate(
                    "dashboard.knowledgeBaseUtilization.keCreatedByMonth",
                  ),
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  style: { textAnchor: "middle", fill: "#333", fontSize: 16 },
                }}
              />
              <XAxis dataKey="name" />
            </BarChart>
          ) : (
            <NoRecord />
          )}
        </ResponsiveContainer>
      </GraphRender>
      {!isLoading && size(data) > 0 && (
        <div className="flex justify-center items-center mt-4 w-full">
          <div className="text-base text-center text-gray-500">
            {moment(startDate).format("MMMM")}{" "}
            <span className="font-semibold text-tertiary-900">
              {translate("common.to")} ({moment(endDate).format("Do MMMM YY")})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseUtilization;
