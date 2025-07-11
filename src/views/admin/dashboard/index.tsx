import { lazy } from "react";

import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Dashboard = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout title={<p>{translate("dashboard.title")}</p>} containerClass="!p-0">
      <Dashboard />
    </Layout>
  );
};

export default index;
