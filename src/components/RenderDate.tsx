import useAppState, { RootState } from "@/context/useAppState";
import { formatDate } from "@/shared/functions";
import moment from "moment";
import Tooltip from "./Tooltip";

const RenderDate = ({ value }: { value: string }) => {
  const {
    user: {
      preferences: { date_format },
    },
  } = useAppState(RootState.AUTH);

  const defaultFormatForTooltip = "Do MMMM YYYY [at] HH:mm";
  return (
    <Tooltip
      content={
        defaultFormatForTooltip !== date_format
          ? moment(value).format(date_format)
          : ""
      }
      place="top"
    >
      {formatDate(value, date_format)}
    </Tooltip>
  );
};

export default RenderDate;
