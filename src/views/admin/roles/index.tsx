import { lazy } from "react";

import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Roles = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout title={<p>{translate("admin.roles.title")}</p>}>
      <Roles />
    </Layout>
  );
};

export default index;
