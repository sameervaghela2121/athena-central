import api from "@/apis/dashboard";
import { Checkbox, NoRecord } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { difference, omit, pull, size } from "lodash-es";
import moment from "moment";
import queryString from "query-string";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import allImgPaths from "@/assets";
import { Tooltip as ReactTooltip } from "@/components";
import { useTranslate } from "@/hooks";
import { formatNumber } from "@/shared/functions";
import GraphRender from "./GraphRender";
import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

enum TOKEN_USE_TYPE {
  INPUT_TOKEN_COUNT = "input_token_count",
  OUTPUT_TOKEN_COUNT = "output_token_count",
}

const TokenUsage = () => {
  const { translate } = useTranslate();
  const { duration, startDate, endDate } = useAppState(RootState.DASHBOARD);

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>([]);

  const allOptionSelected = [
    TOKEN_USE_TYPE.INPUT_TOKEN_COUNT,
    TOKEN_USE_TYPE.OUTPUT_TOKEN_COUNT,
  ];
  const [currentFilterType, setCurrentFilterType] =
    useState<TOKEN_USE_TYPE[]>(allOptionSelected);

  const fetchTokenUsageGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });
      const result: any = await api.fetchTokenUsageGraphData(qRequest);

      setData(result);
    } catch (error) {
      console.error("TokenUsage Error:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFilter = (type: TOKEN_USE_TYPE) => {
    const _currentFilterType = [...currentFilterType];

    if (_currentFilterType.includes(type)) {
      pull(_currentFilterType, type);
    } else {
      _currentFilterType.push(type);
    }

    setCurrentFilterType(_currentFilterType);
  };

  useEffect(() => {
    fetchTokenUsageGraphData();
  }, [duration]);

  const filterData = useMemo(() => {
    const _difference = difference(allOptionSelected, currentFilterType);

    const newData = data.map((o: any) => {
      return omit(o, _difference);
    });

    return newData;
  }, [data, currentFilterType]);

  const isChecked = (type: TOKEN_USE_TYPE) => {
    return currentFilterType.includes(type);
  };

  return (
    <div className="">
      {/* Header Section */}
      <div className="flex gap-x-1 justify-between items-center mb-4 w-full">
        <WidgetHeader
          title={translate("dashboard.tokenUsage.widgetHeaderTitle")}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate("dashboard.topKEs.timesUsed")}
                    info={
                      <p className="text-tertiary-600">
                        {translate("dashboard.tokenUsage.infoTitle")}
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
              {size(filterData) > 0 && (
                <div className="flex gap-x-2 justify-end items-center mt-5 w-full">
                  <div className="flex gap-x-2 items-center">
                    <Checkbox
                      className={
                        "!border-[#4DA3C7]  checked:!border-[#4DA3C7]/80 checked:!bg-[#4DA3C7]/80"
                      }
                      checked={isChecked(TOKEN_USE_TYPE.INPUT_TOKEN_COUNT)}
                      id="input-token-count"
                      name="input-token-count"
                      label={
                        <span>{translate("dashboard.tokenUsage.Input")}</span>
                      }
                      onChange={() => {
                        toggleFilter(TOKEN_USE_TYPE.INPUT_TOKEN_COUNT);
                      }}
                    />
                  </div>
                  <div className="flex gap-x-2 items-center">
                    <Checkbox
                      className={
                        "!border-[#FF8042]  checked:!border-[#FF8042]/80 checked:!bg-[#FF8042]/80"
                      }
                      checked={isChecked(TOKEN_USE_TYPE.OUTPUT_TOKEN_COUNT)}
                      id="output-token-count"
                      name="output-token-count"
                      label={
                        <span>{translate("dashboard.tokenUsage.Output")}</span>
                      }
                      onChange={() => {
                        toggleFilter(TOKEN_USE_TYPE.OUTPUT_TOKEN_COUNT);
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          }
        />
      </div>

      {/* Chart Section */}
      <GraphRender isLoading={isLoading}>
        <ResponsiveContainer width="100%" height={420}>
          {size(filterData) > 0 ? (
            <BarChart
              width={500}
              height={300}
              data={filterData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              barGap={0}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="name"
                interval={0}
                tickMargin={5}
                xAxisId={0}
                textAnchor="middle"
              />
              <YAxis
                scale="linear"
                domain={[0, "auto"]}
                label={{
                  value: translate("dashboard.tokenUsage.title"),
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#333", fontSize: 16 },
                }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                }}
              />
              {currentFilterType.includes(TOKEN_USE_TYPE.INPUT_TOKEN_COUNT) && (
                <Bar
                  dataKey="input_token_count"
                  name={translate("dashboard.tokenUsage.Input")}
                  fill="#4DA3C7"
                  radius={[4, 4, 0, 0]}
                  xAxisId={0}
                />
              )}
              {currentFilterType.includes(
                TOKEN_USE_TYPE.OUTPUT_TOKEN_COUNT,
              ) && (
                <Bar
                  dataKey="output_token_count"
                  name={translate("dashboard.tokenUsage.Output")}
                  fill="#FF8042"
                  radius={[4, 4, 0, 0]}
                  xAxisId={0}
                />
              )}
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

export default TokenUsage;
