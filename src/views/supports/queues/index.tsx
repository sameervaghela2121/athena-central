import { lazy } from "react";

import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Queues = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout title={<p className="">{translate("queues.title")}</p>}>
      <Queues />
    </Layout>
  );
};

export default index;
