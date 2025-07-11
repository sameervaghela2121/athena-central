import { useTranslate } from "@/hooks";
import { camelCase, isArray, size, sortBy } from "lodash-es";
import moment from "moment";
import queryString from "query-string";
import React, { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import { NoRecord, Tooltip as ReactTooltip } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import GraphRender from "./GraphRender";
import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

const dataKeyOrder = [
  "Up Vote",
  "Down Vote",
  "No Vote Present",
  "Mixed - Up and Down Vote",
];

const COLORS = ["#2ab84b", "#C19100", "#036", "#4DA3C7"];

const FeedbackVote: React.FC = () => {
  const { translate } = useTranslate();
  const { duration } = useAppState(RootState.DASHBOARD);
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>([]);

  const fetchFeedbackVoteGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });

      const result: any = await api.fetchFeedbackVoteGraphData(qRequest);

      const sortedData = sortBy(result, (item) =>
        dataKeyOrder.indexOf(item.name),
      );

      setData(sortedData);
    } catch (error) {
      console.error("fetchFeedbackVoteGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent === 0) {
      return <></>;
    }

    return (
      <>
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: "rgb(255, 255, 255)",
            opacity: "0.75",
            pointerEvents: "none",
            fontWeight: 700,
            border: "1px solid red",
            fontSize: 16,
          }}
        >
          {`${(percent * 100).toFixed(1)}%`}
        </text>
      </>
    );
  };

  const CustomTooltip = ({ active, payload, label, ...rest }: any) => {
    if (active && payload && payload.length) {
      const newLabel =
        translate(
          `dashboard.feedbackVote.${camelCase(payload[0].name)}.title` as any,
        ) || payload[0].name;
      return (
        <div className="p-3 bg-white rounded-md shadow-md">
          <p className="desc">{}</p>
          <p className="label">
            {newLabel}: <span className="font-bold">{payload[0].value} %</span>
          </p>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    fetchFeedbackVoteGraphData();
  }, [startDate, endDate]);

  const helpText = [
    "dashboard.feedbackVote.upVote.description",
    "dashboard.feedbackVote.downVote.description",
    "dashboard.feedbackVote.noVotePresent.description",
    "dashboard.feedbackVote.mixedUpAndDownVote.description",
  ];

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex flex-col gap-x-1 justify-between items-center mb-4 w-full">
        <WidgetHeader
          title={translate("dashboard.feedbackVote.title")}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate(
                      "dashboard.feedbackVote.widgetHeaderTitle",
                    )}
                    info={
                      <>
                        <p className="text-tertiary-600">
                          <Trans
                            i18nKey="dashboard.feedbackVote.upVote.description"
                            components={{
                              bold: (
                                <span
                                  className="font-bold"
                                  style={{ color: COLORS[0] }}
                                />
                              ),
                            }}
                          />
                        </p>
                        <p className="text-tertiary-600">
                          <Trans
                            i18nKey="dashboard.feedbackVote.downVote.description"
                            components={{
                              bold: (
                                <span
                                  className="font-bold"
                                  style={{ color: COLORS[1] }}
                                />
                              ),
                            }}
                          />
                        </p>
                        <p className="text-tertiary-600">
                          <Trans
                            i18nKey="dashboard.feedbackVote.noVotePresent.description"
                            components={{
                              bold: (
                                <span
                                  className="font-bold"
                                  style={{ color: COLORS[2] }}
                                />
                              ),
                            }}
                          />
                        </p>
                        <p className="text-tertiary-600">
                          <Trans
                            i18nKey="dashboard.feedbackVote.mixedUpAndDownVote.description"
                            components={{
                              bold: (
                                <span
                                  className="font-bold"
                                  style={{ color: COLORS[3] }}
                                />
                              ),
                            }}
                          />
                        </p>
                      </>
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
        <GraphRender isLoading={isLoading}>
          {isArray(data) && size(data) > 0 ? (
            <div className="flex gap-x-16 justify-center items-center mt-4">
              <div>
                {/* Donut Chart */}
                <PieChart width={300} height={350}>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    fill="#8884d8"
                    innerRadius={80} // Adjusted for smaller screens
                    outerRadius={150} // Adjusted for smaller screens
                    paddingAngle={1} // Adds spacing between slices
                    label={renderCustomizedLabel}
                    labelLine={false}
                  >
                    {data.map(
                      (entry: { name: string | undefined }, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          name={entry.name}
                          fill={COLORS[index] || "#7a7a7acc"}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </div>
              <div>
                {/* Legend */}
                <div className="flex flex-col gap-y-5">
                  {data.map(
                    (
                      entry: {
                        color: any;
                        icon: string;
                        value: string;
                        name: string;
                      },
                      index: number,
                    ) => (
                      <div key={index} className="flex gap-x-4 items-center">
                        <div
                          className="flex justify-center items-center w-8 h-8 rounded-full sm:w-10 sm:h-10"
                          style={{ backgroundColor: entry.color }}
                        >
                          <span
                            className="h-[14px] w-[14px] sm:h-[18px] sm:w-[18px] rounded-full"
                            style={{
                              backgroundColor: COLORS[index] || "#7a7a7acc",
                            }}
                          />
                          {entry.icon && (
                            <img
                              src={entry.icon}
                              alt={entry.name}
                              className="hidden sm:block"
                            />
                          )}
                        </div>

                        <div className="flex justify-between w-full text-xs text-gray-800 sm:text-sm sm:flex-row">
                          <div className="text-sm font-medium sm:text-base">
                            {translate(
                              `dashboard.feedbackVote.${camelCase(entry.name)}.title` as any,
                            ) || entry.name}
                          </div>
                          <div>
                            <ReactTooltip
                              content={
                                <Trans
                                  i18nKey={helpText[index]}
                                  components={{
                                    bold: (
                                      <span
                                        className="font-bold"
                                        style={{ color: COLORS[index] }}
                                      />
                                    ),
                                  }}
                                />
                              }
                              color="default"
                            >
                              <img src={allImgPaths.info} alt="info" />
                            </ReactTooltip>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : (
            <NoRecord />
          )}
        </GraphRender>
      </div>

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

export default FeedbackVote;
