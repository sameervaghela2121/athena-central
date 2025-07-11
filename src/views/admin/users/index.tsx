import { lazy } from "react";

import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

const Users = lazy(() => import("./main"));

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout title={<p>{translate("admin.user.title")}</p>}>
      <Users />
    </Layout>
  );
};

export default index;
