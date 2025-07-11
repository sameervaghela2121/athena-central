import { lazy } from "react";

const Status = lazy(() => import("./main"));

const index = () => {
  return <Status />;
};

export default index;
