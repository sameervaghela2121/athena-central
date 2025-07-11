import api from "@/apis/dashboard";
import allImgPaths from "@/assets";
import { Loader } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import queryString from "query-string";
import React, { useEffect, useState } from "react";
import CountUp from "react-countup";

const Overview = () => {
  const { startDate, endDate } = useAppState(RootState.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState({
    users: 0,
    queues: 0,
    KEs: 0,
  });

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const qRequest = queryString.stringify({
        startDate,
        endDate,
      });

      const result: any = await api.fetchOverviewState(qRequest);

      setState(result);
    } catch (error) {
      console.error("fetchOverview error =>", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [startDate, endDate]);

  const StateCount = React.memo(({ count }: { count: number }) => {
    return isLoading ? (
      <Loader count={1} height={48} className="!m-0" />
    ) : (
      <CountUp end={count} />
    );
  });

  return (
    <div>
      <div className="flex rounded-lg gap-x-12">
        <div className="flex items-start gap-x-4">
          <div className="text-blue-600">
            <div className="w-[38px] h-[38px] rounded-full bg-secondary-900/80 flex items-center justify-center">
              <img src={allImgPaths.usersIconWhite} alt="" />
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <h3 className="text-base font-medium text-tertiary-900">
              Total Users
            </h3>
            <p className="text-5xl font-bold text-secondary-900/80">
              <StateCount count={state.users} />
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-4">
          <div className="text-blue-600">
            <div className="w-[38px] h-[38px] rounded-full bg-secondary-900/80 flex items-center justify-center">
              <img src={allImgPaths.queuesIconWhite} alt="" />
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <h3 className="text-base font-medium text-tertiary-900">
              Overall Queues
            </h3>
            <p className="text-5xl font-bold text-secondary-900/80">
              <StateCount count={state.queues} />
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-4">
          <div className="text-blue-600">
            <div className="w-[38px] h-[38px] rounded-full bg-secondary-900/80 flex items-center justify-center">
              <img src={allImgPaths.KEsIconWhite} alt="" />
            </div>
          </div>
          <div className="flex flex-col gap-y-1">
            <h3 className="text-base font-medium text-tertiary-900">
              Overall KEs
            </h3>
            <p className="text-5xl font-bold text-secondary-900/80">
              <StateCount count={state.KEs} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Overview);
