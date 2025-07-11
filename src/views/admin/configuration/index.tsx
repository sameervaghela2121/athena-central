import { lazy } from "react";

import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Configuration = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout title={<p className="">{translate("admin.config.title")}</p>}>
      <Configuration />
    </Layout>
  );
};

export default index;
