import BillingHistory from "./BillingHistory";
import CurrentPlan from "./CurrentPlan";
import PaymentMethod from "./PaymentMethod";

const Billing = () => {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4">
        <CurrentPlan />
        <PaymentMethod />
      </div>
      <div className="col-span-2">
        <BillingHistory />
      </div>
    </div>
  );
};

export default Billing;
