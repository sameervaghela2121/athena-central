import { camelCase, get, map, size } from "lodash-es";
import queryString from "query-string";
import { useEffect, useMemo, useState } from "react";

import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import { LoaderCircle, NoRecord, Tooltip as ReactTooltip } from "@/components";
import { useAppState } from "@/context";
import { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { renameRoleLabel } from "@/shared/functions";
import WidgetHeader from "./WidgetHeader";

const UserRetentionAndChurnRate = () => {
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);
  const { translate } = useTranslate();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  const fetchUserRetentionAndChurnRate = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });

      const data: any = await api.fetchUserRetentionChurnRate(qRequest);

      const result = get(data, "data.result", []);

      setData(result);
    } catch (error) {
      console.error("fetchUserRetentionAndChurnRate error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRetentionAndChurnRate();
  }, [startDate, endDate]);

  const { month_data, overall_data = {} }: any = data;
  const headings = [
    "Date",
    "New Users",
    "Month 1 (%)",
    "Month 2 (%)",
    "Month 3 (%)",
    "Month 4 (%)",
    "Churn Rate (%)",
  ];

  const formattedData = useMemo(() => {
    return map(month_data, (obj: any) => ({
      date: obj.month,
      newUsers: obj.new_users ? obj.new_users : "-",
      month1: obj.month_1 ? `${obj.month_1}%` : "-",
      month2: obj.month_2 ? `${obj.month_2}%` : "-",
      month3: obj.month_3 ? `${obj.month_3}%` : "-",
      month4: obj.month_4 ? `${obj.month_4}%` : "-",
      churnRate: obj.churn_rate ? `${obj.churn_rate}%` : "-",
    }));
  }, [month_data]);

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <WidgetHeader
          title={translate("dashboard.userRetentionAndChurnRate.title")}
          info={
            <div>
              <ReactTooltip
                title={translate(
                  "dashboard.userRetentionAndChurnRate.widgetHeaderTitle",
                )}
                content={
                  <div className="max-w-xs">
                    <p className="mb-2">
                      {translate(
                        "dashboard.userRetentionAndChurnRate.tooltipDescription",
                      )}
                    </p>
                    <ul className="pl-4 list-disc">
                      <li className="mb-1">
                        <span className="font-semibold text-secondary-900">
                          {translate(
                            "dashboard.userRetentionAndChurnRate.newUsers",
                          )}
                          :
                        </span>{" "}
                        {translate(
                          "dashboard.userRetentionAndChurnRate.newUsersDescription",
                        )}
                      </li>
                      <li className="mb-1">
                        <span className="font-semibold text-primary-900">
                          {translate(
                            "dashboard.userRetentionAndChurnRate.monthlyRetention",
                          )}
                          :
                        </span>{" "}
                        {translate(
                          "dashboard.userRetentionAndChurnRate.monthlyRetentionDescription",
                        )}
                      </li>
                      <li>
                        <span className="font-semibold text-red-500">
                          {translate(
                            "dashboard.userRetentionAndChurnRate.overallChurnRate",
                          )}
                          :
                        </span>{" "}
                        {translate(
                          "dashboard.userRetentionAndChurnRate.overallChurnRateDescription",
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
          right={<div className="flex gap-x-2"></div>}
        />
        {isLoading ? (
          <LoaderCircle />
        ) : (
          <>
            {size(data) > 0 ? (
              <>
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr>
                      {headings.map((key: any, index: number) => (
                        <th
                          key={index}
                          className="p-2 text-base font-medium border-b text-tertiary-700"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formattedData.map((row: any, index: number) => (
                      <tr key={index} className="border-b even:bg-[#F6F5FF]">
                        <td className={`p-2`}>{row.date}</td>
                        <td className="p-2">{row.newUsers}</td>

                        <td className={`p-2 ${row.month1 ? "" : ""} `}>
                          {row.month1}
                        </td>
                        <td className={`p-2 ${row.month2 ? "" : ""} `}>
                          {row.month2}
                        </td>
                        <td className={`p-2 ${row.month3 ? "" : ""} `}>
                          {row.month3}
                        </td>
                        <td className={`p-2 ${row.month4 ? "" : ""} `}>
                          {row.month4}
                        </td>
                        <td className="p-2">{`${row.churnRate}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <NoRecord />
            )}
          </>
        )}
      </div>

      {!isLoading && size(data) > 0 && (
        <>
          <div className="flex gap-x-6 justify-end w-full">
            {/* <div className="flex gap-x-2 items-center">
              <div className="w-3 h-3 rounded-full border border-black"></div>
              <span>
                {translate("dashboard.userRetentionAndChurnRate.activeUsers")}
              </span>
            </div>

            <div className="flex gap-x-2 items-center">
              <div className="w-3 h-3 rounded-full border border-black bg-[#FFF4EE]"></div>
              <span>
                {translate(
                  "dashboard.userRetentionAndChurnRate.deactivateUsers",
                )}
              </span>
            </div> */}
          </div>
          {/* <hr /> */}
          <div className="flex justify-start items-center w-full">
            {size(Object.entries(overall_data)) > 0 &&
              Object.entries(overall_data).map(
                ([key, value]: any, index: number) => (
                  <div
                    className="p-4 w-full border-r last:border-r-0"
                    key={index}
                    id={key}
                  >
                    <div>
                      <span className="text-base font-medium">
                        {translate(
                          `dashboard.userRetentionAndChurnRate.${camelCase(key)}` as any,
                        ) || renameRoleLabel(key)}
                      </span>
                    </div>
                    <div className="text-base font-bold">
                      {key === "overall_churn_rate" ? `${value}%` : value}
                    </div>
                  </div>
                ),
              )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserRetentionAndChurnRate;
