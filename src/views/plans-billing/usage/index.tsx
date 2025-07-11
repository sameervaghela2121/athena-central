import { motion } from "framer-motion";
import { FC, useEffect, useMemo, useState } from "react";

import allImgPaths from "@/assets";
import { AlertBanner } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { calculatePercentage } from "@/shared/functions";
import { get, remove, size, sortBy } from "lodash-es";
import moment from "moment";
import MonthlyCreditPlans from "./MonthlyCreditPlans";
import PurchaseCredit from "./PurchaseCredit";
import SmartSuggestionPlan from "./SmartSuggestionPlan";

/**
 * Usage component to display message and storage usage with responsive UI
 * @returns JSX element showing usage metrics with progress bars
 */
const Usage: FC = () => {
  const { translate } = useTranslate();
  const [isCreditPurchased, setIsCreditPurchased] = useState(false);
  const [subscriptionPurchased, setSubscriptionPurchased] = useState(false);

  const {
    plans,
    fetchTiers,
    entityUsageMetrics: data,
    errorEntityUsageMetrics: error,
    fetchSuggestedCredit,
    suggestedCredit,
  } = useAppState(RootState.PLAN_PRICING);

  const { entity } = useAppState(RootState.AUTH);

  const { entity_id: entityId, tier_id = "" }: any = data || {};

  useEffect(() => {
    if (!plans.length) {
      fetchTiers();
      fetchSuggestedCredit();
    }
  }, [entityId]);

  // Animation variants for progress bars
  const progressVariants = {
    initial: { width: 0 },
    animate: (percent: number) => ({
      width: `${percent}%`,
      transition: { duration: 1, ease: "easeOut" },
    }),
  };

  const calculateRemainingMessages = (total: number, used: number) => {
    const result = total - used;
    return result > 0 ? result : 0;
  };

  const totalMessagesPercentage = useMemo(
    () =>
      calculatePercentage(
        data?.total_used_messages?.used || 0,
        data?.total_used_messages?.total || 0,
      ),
    [data?.total_used_messages?.used, data?.total_used_messages?.total],
  );

  const subscriptionMessagesPercentage = useMemo(
    () =>
      calculatePercentage(
        data?.subscription_messages?.used || 0,
        data?.subscription_messages?.total || 0,
      ),
    [data?.subscription_messages?.used, data?.subscription_messages?.total],
  );

  const purchasedMessagesPercentage = useMemo(
    () =>
      calculatePercentage(
        data?.purchased_messages?.used || 0,
        data?.purchased_messages?.total || 0,
      ),
    [data?.purchased_messages?.used, data?.purchased_messages?.total],
  );

  const planListOptions = useMemo(() => {
    const options: any[] = [];
    const currentPlan = plans.find((plan) => plan.id === tier_id);
    const freePlan: any = plans.find((plan: any) => plan.discount === 100);

    sortBy(plans, "subscription_amount", "asc").forEach((plan: any) => {
      const planName = (
        <div className={`flex gap-x-2 items-center`}>
          <span>{plan.name}</span>
          {plan.discount === 100 && (
            <span className="px-2 py-1 text-white rounded-full border bg-secondary-900">
              Free Plan
            </span>
          )}
          {plan.id === tier_id && (
            <span className="px-2 py-1 text-white rounded-full border bg-primary-900">
              Active
            </span>
          )}
        </div>
      );

      options.push({
        label: planName,
        id: plan.id,
        value: plan.subscription_amount,
        isFree: plan.discount === 100,
        isActivePlan: plan.id === tier_id,
      });
    });

    if (currentPlan?.id !== freePlan?.id) {
      return options.filter((plan: any) => plan.id !== freePlan?.id);
    }
    return options;
  }, [plans, tier_id]);

  const isFreePlan: any = useMemo(() => {
    const currentPlan: any = plans.find((plan) => plan.id === tier_id);
    return currentPlan?.discount === 100;
  }, [plans, tier_id]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col gap-y-6">
        {totalMessagesPercentage >= 80 && (
          <AlertBanner
            type="error"
            message="You're approaching your monthly free credit limit. Upgrade or add
            credits to avoid disruption."
          />
        )}
        {/* <AlertBanner
          type="warning"
          message="No usage recorded yet. Data Updates as your team engage with Athena."
        />
        <AlertBanner
          type="secondary"
          message="You’ve been granted 1,000 Free Credits/Month to get started. 2 Month
            Free Trial."
        />
        */}
        {subscriptionPurchased && (
          <AlertBanner
            type="success"
            message="Plan upgraded! Your new credit plan is now active. Unused credits
            will roll over as per your plan rules."
            onClose={() => setSubscriptionPurchased(false)}
          />
        )}
        {isCreditPurchased && (
          <AlertBanner
            type="success"
            message="Credits added successfully. They’re now available to your team."
            onClose={() => setIsCreditPurchased(false)}
          />
        )}
        {/* Main usage card */}
        <div className="overflow-hidden w-full bg-white rounded-lg border shadow-sm">
          <div className="flex gap-x-2 items-center select-none">
            {/* Card header */}
            <div className="p-4">
              <div className="flex gap-2 items-center">
                <h2 className="text-3xl font-medium text-[#0C0A09]">
                  {translate("billing.usage.title")}
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#0C0A09]">
                {translate("billing.usage.monthlyUsage")}
              </p>
            </div>

            <div className="h-14 border-r"></div>

            {/* Active plan badge */}
            <div className="p-4">
              <div className="flex flex-col gap-2">
                <div className="px-3 py-1 text-sm">
                  {translate("billing.usage.activePlan")}
                </div>
                <span className="ease-in-out select-none flex items-center justify-center rounded-[56px] p-3 gap-x-2 transition-all duration-500 font-medium text-base sm:text-base bg-secondary-900 text-white">
                  <img src={allImgPaths.rocketIcon} alt="" />
                  {data?.tier_name || ""}
                </span>
              </div>
            </div>
          </div>

          {/* Usage metrics */}
          <div className="grid grid-cols-1 gap-8 px-6 py-4 border-t">
            {/* Chat Messages */}
            <div className={`grid grid-cols-4 gap-x-10 select-none`}>
              <div className="flex flex-col col-span-2 gap-4">
                <div className="flex gap-x-4 items-center">
                  <h3 className="font-medium">
                    {isFreePlan ? "Free Credits" : "Total Credits"}
                  </h3>
                  {isFreePlan && (
                    <span
                      className="text-sm italic text-[#2D2D2D]"
                      // title={`In ${entity?.free_trial_reset_date && moment().diff(moment(entity?.free_trial_reset_date), "days")} days`}
                    >
                      Free Credit Resets on{" "}
                      {entity?.free_trial_reset_date &&
                        moment(entity?.free_trial_reset_date).format(
                          "Do MMM YYYY",
                        )}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex gap-1.5 text-[#0C0A09]">
                    <span className="font-bold text-tertiary-700">
                      {Math.min(
                        data?.total_used_messages?.used || 0,
                        data?.total_used_messages?.total || 0,
                      )}{" "}
                      {translate("billing.usage.of")}{" "}
                      {data?.total_used_messages?.total || 0}{" "}
                      {translate("billing.usage.used")}
                    </span>
                  </div>
                  <span className="font-bold text-tertiary-700">
                    {calculateRemainingMessages(
                      data?.total_used_messages?.total || 0,
                      data?.total_used_messages?.used || 0,
                    )}{" "}
                    {translate("billing.usage.left")}
                  </span>
                </div>
                <div className="overflow-hidden w-full h-3 bg-gray-100 rounded-full">
                  <motion.div
                    className={`h-full rounded-full ${totalMessagesPercentage >= 80 ? "!bg-status-error" : totalMessagesPercentage >= 50 ? "!bg-status-warning" : totalMessagesPercentage >= 0 ? "!bg-[#4DA3C7]" : ""}`}
                    variants={progressVariants}
                    initial="initial"
                    animate="animate"
                    custom={totalMessagesPercentage}
                  />
                </div>
              </div>
              {get(data, "subscription_messages.total", 0) >= 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-x-4 items-center">
                    <h3 className="font-medium">Subscription Credits</h3>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-1.5 text-[#0C0A09]">
                      <span className="font-bold text-tertiary-700">
                        {Math.min(
                          data?.subscription_messages?.used || 0,
                          data?.subscription_messages?.total || 0,
                        )}{" "}
                        {translate("billing.usage.of")}{" "}
                        {data?.subscription_messages?.total || 0}{" "}
                        {translate("billing.usage.used")}
                      </span>
                    </div>
                    <span className="font-bold text-tertiary-700">
                      {calculateRemainingMessages(
                        data?.subscription_messages?.total || 0,
                        data?.subscription_messages?.used || 0,
                      )}{" "}
                      {translate("billing.usage.left")}
                    </span>
                  </div>
                  <div className="overflow-hidden w-full h-3 bg-gray-100 rounded-full">
                    <motion.div
                      className={`h-full rounded-full ${subscriptionMessagesPercentage >= 80 ? "!bg-status-error" : subscriptionMessagesPercentage >= 50 ? "!bg-status-warning" : subscriptionMessagesPercentage >= 0 ? "!bg-[#4DA3C7]" : ""}`}
                      variants={progressVariants}
                      initial="initial"
                      animate="animate"
                      custom={subscriptionMessagesPercentage}
                    />
                  </div>
                </div>
              )}
              {get(data, "purchased_messages.total", 0) >= 30000 && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-x-4 items-center">
                    <h3 className="font-medium">Add-On Credits</h3>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex gap-1.5 text-[#0C0A09]">
                      <span className="font-bold text-tertiary-700">
                        {Math.min(
                          data?.purchased_messages?.used || 0,
                          data?.purchased_messages?.total || 0,
                        )}{" "}
                        {translate("billing.usage.of")}{" "}
                        {data?.purchased_messages?.total || 0}{" "}
                        {translate("billing.usage.used")}
                      </span>
                    </div>
                    <span className="font-bold text-tertiary-700">
                      {calculateRemainingMessages(
                        data?.purchased_messages?.total || 0,
                        data?.purchased_messages?.used || 0,
                      )}{" "}
                      {translate("billing.usage.left")}
                    </span>
                  </div>
                  <div className="overflow-hidden w-full h-3 bg-gray-100 rounded-full">
                    <motion.div
                      className={`h-full rounded-full ${purchasedMessagesPercentage >= 80 ? "!bg-status-error" : purchasedMessagesPercentage >= 50 ? "!bg-status-warning" : purchasedMessagesPercentage >= 0 ? "!bg-[#4DA3C7]" : ""}`}
                      variants={progressVariants}
                      initial="initial"
                      animate="animate"
                      custom={purchasedMessagesPercentage}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              {/* show this component on 80% of credit usage */}
              <PurchaseCredit onPurchase={() => setIsCreditPurchased(true)} />
            </div>
          </div>
        </div>

        {size(suggestedCredit) > 0 && (
          <div>
            <SmartSuggestionPlan />
          </div>
        )}

        <div>
          <MonthlyCreditPlans
            plans={planListOptions}
            currentPlanId={data?.tier_id || ""}
            onPaymentSuccess={() => setSubscriptionPurchased(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default Usage;
