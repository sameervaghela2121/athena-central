import api from "@/apis/planAndBilling";
import allImgPaths from "@/assets";
import { ButtonV2, LoadableContent } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { motion } from "framer-motion";
import { get } from "lodash-es";
import { FC } from "react";
import { toast } from "sonner";

type PlanDetailsType = {
  planName: string;
  price: string;
  messageLimit: string;
  billingCycle: string;
  lastPayment: string;
  nextPayment: string;
};

/**
 * CurrentPlan component displays the user's current subscription details and billing information
 * @returns A responsive UI showing plan details, pricing, and payment information
 */
const CurrentPlan: FC = () => {
  const { currentTier, isLoading, entityUsageMetrics } = useAppState(
    RootState.PLAN_PRICING,
  );
  const { translate } = useTranslate();

  const { entity_id: entityId = "" } = entityUsageMetrics || {};

  /**
   * Handles the download invoice action
   */
  const handleDownloadInvoice = async () => {
    try {
      if (!entityId) {
        return;
      }

      const result = await api.getCurrentSubscription(entityId);
      const stripeInvoiceId = get(result, "stripe_invoice_id", "");

      if (!stripeInvoiceId) return toast.error("Invoice not found");

      const downloadURL = await api.downloadInvoiceURL(stripeInvoiceId);

      window.open(downloadURL, "_blank");
    } catch (error) {
      console.error("handleDownloadInvoice Error:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="px-6 py-4">
        <div className="flex gap-3 items-center mb-5">
          <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gray-100 rounded-full">
            <img src={allImgPaths.currentPlan} alt="Current Plan" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            {translate("billing.currentPlan")}
          </h2>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          {translate("billing.subscriptionDetails")}
        </p>

        <div className="">
          <div className="flex flex-col justify-between py-2 sm:flex-row sm:items-center">
            <span className="font-medium text-gray-600">
              {translate("billing.plan")}
            </span>
            <LoadableContent
              isLoading={isLoading}
              className="mt-1 sm:mt-0"
              content={
                <span className="mt-1 font-semibold text-gray-900 sm:mt-0">
                  {get(currentTier, "name", "")}
                </span>
              }
            />
          </div>

          <div className="flex flex-col justify-between py-2 sm:flex-row sm:items-center">
            <span className="font-medium text-gray-600">
              {translate("billing.price")}
            </span>
            <LoadableContent
              isLoading={isLoading}
              skeletonWidth="w-32"
              className="mt-1 sm:mt-0"
              content={
                <span className="mt-1 font-semibold text-gray-900 sm:mt-0">
                  {get(currentTier, "subscription_amount", "")}
                  {get(currentTier, "currency", "$")}
                </span>
              }
            />
          </div>

          <div className="flex flex-col justify-between py-2 sm:flex-row sm:items-center">
            <span className="font-medium text-gray-600">
              {translate("billing.messageLimit")}
            </span>
            <LoadableContent
              isLoading={isLoading}
              skeletonWidth="w-28"
              className="mt-1 sm:mt-0"
              content={
                <span className="mt-1 font-semibold text-gray-900 sm:mt-0">
                  {get(currentTier, "features.chat_limit", "")}
                </span>
              }
            />
          </div>

          <div className="flex flex-col justify-between py-2 sm:flex-row sm:items-center">
            <span className="font-medium text-gray-600">
              {translate("billing.billingCycle")}
            </span>
            <span className="mt-1 font-semibold text-gray-900 sm:mt-0">
              {get(currentTier, "billingCycle", "Monthly")}
            </span>
          </div>
        </div>
      </div>

      {get(currentTier, "subscription_amount", 0) > 0 && (
        <div className="p-5 bg-gray-50 rounded-b-lg sm:p-6">
          <ButtonV2
            onClick={handleDownloadInvoice}
            className="hover:!bg-tertiary-50 flex gap-2 justify-center items-center px-4 py-3 w-full font-medium !text-gray-800 !bg-white  border border-gray-200 transition-colors duration-200 "
            aria-label={translate("billing.downloadInvoice")}
          >
            <div className="flex gap-x-2">
              <img
                src={allImgPaths.downloadIcon2}
                alt="Download Invoice"
                className="w-6"
              />
              <span>{translate("billing.downloadInvoice")}</span>
            </div>
          </ButtonV2>
        </div>
      )}
    </motion.div>
  );
};

export default CurrentPlan;
