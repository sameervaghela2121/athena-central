import { debounce } from "lodash-es";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";

import api from "@/apis/planAndBilling";
import { ButtonV2, Input, Modal } from "@/components";
import { useTranslate } from "@/hooks";
import { toast } from "sonner";

// Lazy load Stripe components
const StripePaymentModal = lazy(
  () => import("@/components/add-credit-payment/StripePaymentModal"),
);
const StripeProvider = lazy(
  () => import("@/components/add-credit-payment/StripeProvider"),
);

/**
 * Modal component for purchasing message credits
 * Allows users to add message credits to their account
 */
interface PurchaseCreditModalProps {
  show: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const PurchaseCreditModal = ({
  show,
  onClose,
  onSuccess,
}: PurchaseCreditModalProps) => {
  const { translate } = useTranslate();
  const [messageCount, setMessageCount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [autoBuy, setAutoBuy] = useState<boolean>(false);

  /**
   * Calculate price based on message count
   * @param count - Number of messages to purchase
   */
  const calculatePrice = async (count: number): Promise<void> => {
    // Placeholder price calculation (e.g. $0.10 per message)
    try {
      setIsLoading(true);
      const result: number = await api.fetchCreditMultiplier();

      setPrice(count / result);
    } catch (error) {
      console.error("PurchaseCredit calculatePrice Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Debounced function to calculate price
   * @param count - Number of messages to purchase
   */
  const debouncedCalculatePrice = useCallback(
    debounce((count: number) => {
      calculatePrice(count);
    }, 1000),
    [],
  );

  /**
   * Handle message count change with debounce
   * @param value - Input string value
   */
  const handleMessageCountChange = (value: string) => {
    if (value && !isNaN(+value)) {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000000) {
        setMessageCount(numValue);
        debouncedCalculatePrice(numValue);
      }
    } else {
      setMessageCount(0);
      setPrice(0);
    }
  };

  /**
   * Handle purchase submission
   */
  const handlePurchase = async () => {
    try {
      setIsSubmitting(true);
      // API call would go here
      // await api.billing.purchaseCredits({ messageCount });

      const { client_secret } = await api.addCredit({
        amount: messageCount / 50,
        messages: messageCount,
        autobuy_enabled: autoBuy,
      });

      setClientSecret(client_secret);
      // Success handling
      // if (onSuccess) onSuccess();
      // if (onHide) onHide();
    } catch (error) {
      console.error("PurchaseCredit handlePurchase Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when modal is opened
  useEffect(() => {
    if (show) {
      setMessageCount(1000);
      debouncedCalculatePrice(1000);
    }
  }, [show]);

  /**
   * Handles successful payment completion
   * @param clientSecret - The client secret returned from Stripe
   */
  const onPaymentSuccess = async () => {
    try {
      setShowPaymentModal(false);

      toast.success("Payment successful and credit added");

      setClientSecret(null);
      onSuccess && onSuccess();
    } catch (error) {
      console.error("onPaymentSuccess Error:", error);
      toast.error("Payment failed");
    }
  };

  return (
    <Modal show={show} onClose={onClose} size="xl" extraClasses="!p-0">
      <div className="flex flex-col gap-y-6">
        {/* Header */}
        <div className="px-6 pt-6">
          <h2 className="text-base font-medium">
            {translate("billing.usage.purchaseCredits")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {translate("billing.usage.creditsInfo")}
          </p>
        </div>

        {/* Credit Input */}
        <div className="px-6">
          <div className="grid grid-cols-12 gap-x-6 items-center">
            <div className="col-span-6">
              <label className="text-base font-medium">Credit*</label>
              <p className="mb-2 text-sm text-gray-500">
                Shared across your team. Unused credits roll over to next month.
              </p>
            </div>
            <div className="col-span-6">
              <div className="relative">
                <Input
                  name="messageCount"
                  onChange={(e) => {
                    handleMessageCountChange(e.target.value);
                  }}
                  placeholder="Enter message count"
                  value={`${messageCount || ""}`}
                />
                <div className="flex absolute right-0 top-1/2 gap-x-2 justify-between items-center transform -translate-x-4 -translate-y-1/2">
                  <span className="text-base text-tertiary-400">Credits</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="p-6 rounded-lg bg-[#F9F9F9]">
          <h3 className="mb-2 text-2xl font-medium">Pricing Summary</h3>
          <p className="mb-4 text-sm text-gray-600">
            This one-time charge will be billed immediately and will not be
            included in your next billing cycle. Unused credits will roll over
            to the next month.
          </p>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-base">Add-On Credits</span>
              <span className="text-base">{messageCount} Credits</span>
            </div>

            <div className="flex justify-between items-center pt-4 font-medium border-t">
              <span className="text-base">Total Due</span>
              <div className="flex gap-x-2 text-base">
                {isLoading ? (
                  <span>
                    Calculating...
                    {/* <img src={allImgPaths.loader} alt="loader" /> */}
                  </span>
                ) : (
                  <span>${price.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 px-6">
          <div className="col-span-8">
            <h2 className="text-base font-medium">Auto-Buy Credits</h2>
            <p className="mt-1 text-sm text-gray-500">
              Once your credit balance hits zero, Athena will pause all
              activity. Enable auto-buy to automatically purchase this credit
              pack again and avoid disruption.
            </p>
          </div>
          <div className="flex col-span-4 justify-end items-center">
            <ButtonV2
              variant={autoBuy ? "tertiaryDark" : "secondary"}
              className={`!px-4 !py-2 ${autoBuy ? "!border-[#9B1C1C] !text-[#9B1C1C]" : "!bg-[#6F42C1] text-white"}`}
              onClick={() => setAutoBuy((prev) => !prev)}
            >
              {autoBuy ? "Disable" : "Enable"} Auto-Buy
            </ButtonV2>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-header">
          <div className="flex gap-3 justify-end px-6 py-4 border-t">
            <p className="self-center mr-auto text-sm text-gray-500 max-w-72">
              Unused credits roll over to the next month. No change to your
              existing plan.
            </p>
            <ButtonV2 variant="tertiaryDark" onClick={onClose}>
              {translate("common.cancel")}
            </ButtonV2>
            <ButtonV2
              disabled={isSubmitting || messageCount < 1 || isLoading}
              variant="primary"
              className="!px-9"
              onClick={handlePurchase}
              loading={isSubmitting || isLoading}
            >
              Add Credit
            </ButtonV2>
          </div>
        </div>
      </div>
      {clientSecret && (
        <Suspense
          fallback={
            <div className="flex justify-center items-center p-4">
              Loading payment form...
            </div>
          }
        >
          <StripeProvider>
            <StripePaymentModal
              show={!!clientSecret}
              onClose={() => setClientSecret(null)}
              amount={price}
              clientSecret={clientSecret}
              onPaymentSuccess={onPaymentSuccess}
            />
          </StripeProvider>
        </Suspense>
      )}
    </Modal>
  );
};

export default PurchaseCreditModal;
