import moment from "moment";
import { useReducer } from "react";

interface Dashboard {
  duration: { id: number; name: string };
  startDate: string;
  endDate: string;
}

const initialArgs: Dashboard = {
  duration: { id: 1, name: "By Month" },
  startDate: moment().subtract(3, "month").format("YYYY-MM-DD"),
  endDate: moment().format("YYYY-MM-DD"),
};

function reducer(state: Dashboard, action: Dashboard) {
  return { ...state, ...action };
}

const useDashboard = () => {
  const [state, setState] = useReducer(reducer, initialArgs);

  const changeDuration = (duration: { id: number; name: string }) => {
    const { name } = duration;
    const endDate = moment().format("YYYY-MM-DD");
    let startDate = moment().subtract(1, "month").format("YYYY-MM-DD");

    switch (name) {
      case "By Week":
        startDate = moment().subtract(1, "week").format("YYYY-MM-DD");
        break;
      case "By Month":
        startDate = moment().subtract(1, "month").format("YYYY-MM-DD");
        break;

      default:
        break;
    }

    setState({ ...state, duration, startDate, endDate });
  };

  return {
    changeDuration,
    ...state,
  };
};

export type UseDashboardReturnType = ReturnType<typeof useDashboard>;

export default useDashboard;
