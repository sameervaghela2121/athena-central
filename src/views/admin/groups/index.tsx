import { lazy } from "react";

import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Groups = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout title={<p className="">{translate("admin.groups.title")}</p>}>
      <Groups />
    </Layout>
  );
};

export default index;
