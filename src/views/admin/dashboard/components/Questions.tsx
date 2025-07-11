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

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import { Checkbox, NoRecord, Tooltip as ReactTooltip } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";

import { useTranslate } from "@/hooks";
import GraphRender from "./GraphRender";
import WidgetHeader from "./WidgetHeader";
import WidgetInfoTooltipContent from "./WidgetInfoTooltipContent";

enum QuestionType {
  OPEN = "open",
  ANSWERED = "answered",
  IGNORED = "ignored",
}

const Questions = () => {
  const { translate } = useTranslate();
  const { duration } = useAppState(RootState.DASHBOARD);
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);

  const [isLoading, setIsLoading] = useState(true);
  const allOptionSelected = [
    QuestionType.OPEN,
    QuestionType.ANSWERED,
    QuestionType.IGNORED,
  ];
  const [currentFilterType, setCurrentFilterType] =
    useState<QuestionType[]>(allOptionSelected);

  const [data, setData] = useState([]);

  const fetchQuestionsGraphData = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
        name: "question",
      });

      const result: any = await api.fetchQuestionsState(qRequest);
      setData(result);
    } catch (error) {
      console.error("fetchQuestionsGraphData error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsGraphData();
  }, [startDate, endDate]);

  const isChecked = (type: QuestionType) => {
    return currentFilterType.includes(type);
  };

  const toggleFilter = (type: QuestionType) => {
    const _currentFilterType = [...currentFilterType];

    if (_currentFilterType.includes(type)) {
      pull(_currentFilterType, type);
    } else {
      _currentFilterType.push(type);
    }

    setCurrentFilterType(_currentFilterType);
  };

  const filterData = useMemo(() => {
    const _difference = difference(allOptionSelected, currentFilterType);

    const newData = data.map((o: any) => {
      return omit(o, _difference);
    });

    return newData;
  }, [data, currentFilterType]);

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Header Section */}
      <div className="flex gap-x-1 justify-between items-center mb-4 w-full">
        <WidgetHeader
          title={translate("dashboard.questions.title")}
          info={
            <div>
              <ReactTooltip
                title={
                  <WidgetInfoTooltipContent
                    title={translate("dashboard.questions.widgetHeaderTitle")}
                    info={
                      <div className="z-50 bg-white">
                        <p className="text-tertiary-600">
                          {translate("dashboard.questions.infoTitle")}
                        </p>
                        <p className="text-tertiary-600">
                          {translate("dashboard.questions.infoSubTitle")}
                        </p>
                      </div>
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
                <div className="flex gap-x-6">
                  <div className="flex gap-x-2 items-center">
                    <Checkbox
                      className={
                        "!border-[#4DA3C7]  checked:!border-[#4DA3C7]/80 checked:!bg-[#4DA3C7]/80"
                      }
                      checked={isChecked(QuestionType.ANSWERED)}
                      id="answered"
                      name="answered"
                      label={
                        <span>{translate("dashboard.questions.answered")}</span>
                      }
                      onChange={() => {
                        toggleFilter(QuestionType.ANSWERED);
                      }}
                    />
                  </div>
                  <div className="flex gap-x-2 items-center">
                    <Checkbox
                      className={
                        "!border-[#FF8042]  checked:!border-[#FF8042]/80 checked:!bg-[#FF8042]/80"
                      }
                      checked={isChecked(QuestionType.IGNORED)}
                      id="ignored"
                      name="ignored"
                      label={
                        <span>{translate("dashboard.questions.ignored")}</span>
                      }
                      onChange={() => {
                        toggleFilter(QuestionType.IGNORED);
                      }}
                    />
                  </div>
                  <div className="flex gap-x-2 items-center">
                    <Checkbox
                      className={
                        "!border-[#7A7A7A]  checked:!border-[#7A7A7A]/80 checked:!bg-[#7A7A7A]/80"
                      }
                      checked={isChecked(QuestionType.OPEN)}
                      id="open"
                      name="open"
                      label={
                        <span>{translate("dashboard.questions.open")}</span>
                      }
                      onChange={() => {
                        toggleFilter(QuestionType.OPEN);
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
        <ResponsiveContainer width="100%" height={450}>
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
            >
              <XAxis dataKey="name" />
              <YAxis
                label={{
                  value: translate("dashboard.questions.questions"),
                  angle: -90,
                  position: "insideLeft",
                  offset: -10,
                  style: { textAnchor: "middle", fill: "#333", fontSize: 16 },
                }}
              />
              <Tooltip />
              <Bar
                dataKey="open"
                name={translate("dashboard.questions.open")}
                stackId="a"
                fill="#7A7A7A"
              />
              <Bar
                dataKey="ignored"
                name={translate("dashboard.questions.ignored")}
                stackId="a"
                fill="#FF8042"
              />
              <Bar
                dataKey="answered"
                name={translate("dashboard.questions.answered")}
                stackId="a"
                fill="#4DA3C7"
              />
            </BarChart>
          ) : (
            <div>
              <NoRecord />
            </div>
          )}
        </ResponsiveContainer>

        {!isLoading && size(data) > 0 && (
          <div className="flex justify-center items-center mt-4 w-full">
            <div className="text-base text-center text-gray-500">
              {moment(startDate).format("MMMM")}{" "}
              <span className="font-semibold text-tertiary-900">
                {translate("common.to")} ({moment(endDate).format("Do MMMM YY")}
                )
              </span>
            </div>
          </div>
        )}
      </GraphRender>
    </div>
  );
};

export default Questions;
