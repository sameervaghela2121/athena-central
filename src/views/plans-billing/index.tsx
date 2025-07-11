import { Layout } from "@/components";
import { useTranslate } from "@/hooks";

// const PlanPricing = lazy(() => import("./main"));
import PlanPricing from "./main";

const index = () => {
  const { translate } = useTranslate();

  return (
    <Layout
      title={<p>{translate("plansBilling.title")}</p>}
      containerClass="!p-0"
    >
      <PlanPricing />
    </Layout>
  );
};

export default index;
