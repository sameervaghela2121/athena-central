import allImgPaths from "@/assets";
import { ButtonV2, Dropdown, Tooltip } from "@/components";
import { lazy } from "react";

// Lazy load payment components for better performance
const StripePaymentModal = lazy(() => import("@/components/payment/StripePaymentModal"));
const StripeProvider = lazy(() => import("@/components/payment/StripeProvider"));
import { CREDIT_PRICE, UNUSED_CREDIT_ROLLOVER_RATE } from "@/shared/constants";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

interface Plan {
  label: React.ReactNode;
  id: string;
  value: number;
  isFree?: boolean;
  isActivePlan?: boolean;
}

const MonthlyCreditPlans = ({
  plans,
  currentPlanId,
  onPaymentSuccess,
}: {
  plans: Plan[];
  currentPlanId: string | undefined;
  onPaymentSuccess: (paymentIntent: any) => void;
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    label: React.ReactNode;
    id: string;
    value: number;
    isFree?: boolean;
    isActivePlan?: boolean;
  } | null>(plans[0]);

  useEffect(() => {
    // return current plan from plan list
    const currentPlan = plans.find((plan) => plan.id === currentPlanId);
    setSelectedPlan(currentPlan || null);
  }, [currentPlanId, plans]);

  /**
   * Handles successful payment completion
   * @param clientSecret - The client secret returned from Stripe
   */
  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setShowPaymentModal(false);

      toast.success("Payment successful");

      // Reset the selected plan
      setSelectedPlan(null);
      onPaymentSuccess(paymentIntent);
    } catch (error) {
      console.error("handlePaymentSuccess Error:", error);
      toast.error("Payment failed");
    }
  };

  return (
    <>
      <div className="flex gap-x-6 w-full rounded-lg">
        <div className="flex flex-col">
          <h2 className="text-[32px] font-bold">Buy Monthly Credits</h2>
          <p className="text-base font-medium text-tertiary-700">
            Choose the right credit amount to fit your team’s monthly needs. You
            can start small and scale up anytime.
          </p>
        </div>
        <div className="flex flex-col gap-y-4 p-4 w-full rounded-2xl border border-header">
          <div className="flex flex-col">
            <h2 className="text-[32px] font-bold">Monthly Credit Plans</h2>
            <p className="text-base font-medium text-tertiary-700">
              Flexible Credit Purchase
            </p>
          </div>
          <div className="flex flex-col gap-y-4">
            <Dropdown
              label={selectedPlan?.label || plans[0]?.label}
              items={plans}
              onSelect={(value: any) => {
                setSelectedPlan(value);
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between">
              <div>
                <span>Cost</span>
              </div>
              <div className="flex gap-x-1 items-center">
                <span className="text-sm font-bold text-[#1C1B1F]">
                  {selectedPlan && selectedPlan.isFree
                    ? "Free"
                    : `$${(selectedPlan?.value || 0).toFixed(2)}/Month`}
                </span>
                <Tooltip content="Monthly subscription cost for the selected plan">
                  <img src={allImgPaths.infoDark} alt="Info" className="w-4" />
                </Tooltip>
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-sm italic font-medium text-tertiary-700">
                  Unused Credit roll over up to{" "}
                  {UNUSED_CREDIT_ROLLOVER_RATE * 100}% to the next month
                </p>
              </div>
              <div>
                {selectedPlan && !selectedPlan.isFree && (
                  <span>${CREDIT_PRICE} = 1 Credit/Message</span>
                )}
              </div>
            </div>
          </div>
          {selectedPlan &&
            !selectedPlan.isFree &&
            !selectedPlan.isActivePlan && (
              <div className="w-full">
                <ButtonV2
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowPaymentModal(true)}
                >
                  Confirm & Purchase Plan
                </ButtonV2>
              </div>
            )}
        </div>
      </div>
      {/* Stripe Payment Modal */}
      {selectedPlan && (
        <Suspense fallback={<div className="flex items-center justify-center p-4">Loading payment components...</div>}>
          <StripeProvider>
            <StripePaymentModal
              show={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              planId={selectedPlan.id}
              planName={selectedPlan.label}
              planPrice={selectedPlan.value}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </StripeProvider>
        </Suspense>
      )}
    </>
  );
};

export default MonthlyCreditPlans;
