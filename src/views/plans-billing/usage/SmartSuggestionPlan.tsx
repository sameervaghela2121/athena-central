import allImgPaths from "@/assets";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import React from "react";

/**
 * SmartSuggestionPlan component that displays current usage and recommended plan information
 * @returns JSX Element for the Smart Suggestion Plan UI
 */
const SmartSuggestionPlan: React.FC = () => {
  const { suggestedCredit } = useAppState(RootState.PLAN_PRICING);

  const {
    tier_name,
    tier_id,
    min_buffer,
    max_buffer,
    subscription_amount,
    credits,
    current_usages,
  } = suggestedCredit || {};
  const { translate } = useTranslate();

  /**
   * Formats the number with commas for better readability
   * @param {number} num - Number to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (num: number): string => {
    try {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch (error) {
      console.error("formatNumber Error:", error);
      return num.toString();
    }
  };

  return (
    <div className="p-4 w-full bg-white rounded-lg border border-gray-200 shadow-sm select-none">
      <div className="flex gap-2 items-center mb-4">
        <div className="flex justify-center items-center w-7 h-7 bg-purple-100 rounded-full">
          <img src={allImgPaths.smartSuggestionIcon} alt="" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">Smart Suggestion</h3>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Current Usage Section */}
        <div className="flex-1 pb-4 border-b lg:border-b-0 lg:border-r lg:border-gray-200 lg:pb-0 lg:pr-4">
          <div className="rounded-md">
            <div className="inline-block px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-full border border-red-600">
              Current Usage
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-red-500">
                {formatNumber(current_usages || 0)}
              </span>
              <span className="ml-1 text-sm text-gray-600">Credit Used</span>
            </div>
            {/* <p className="mt-1 text-sm text-gray-600">
              {`You've used ${formatNumber(total_used_messages?.used || 0)} credits in just ${10} days.`}
            </p> */}
          </div>
        </div>

        {/* Recommended Plan Section */}
        <div className="flex-1 lg:px-4">
          <div className="rounded-md">
            <div className="inline-flex gap-x-2 items-center px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-full border border-purple-600">
              <span>Recommended</span>
              <img
                src={allImgPaths.smartSuggestionRecommended}
                alt=""
                className="w-4 h-4"
              />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-purple-500">
                {formatNumber(credits || 0)}
              </span>
              <span className="ml-1 text-sm text-purple-500">
                Credit/Month Plan ({min_buffer} - {max_buffer}% buffer)
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">To avoid disruption.</p>
          </div>
        </div>

        {/* Cost Display */}
        <div className="lg:w-48 sm:w-full">
          <div className="flex flex-col justify-center p-4 h-full text-center text-white bg-purple-600 rounded-lg">
            <div className="flex gap-x-1 justify-center items-center">
              <div className="text-2xl font-bold">
                ${formatNumber(subscription_amount || 0)}
              </div>
              <div className="text-sm font-medium">/Month</div>
            </div>
            <div className="mt-1 text-xs">
              {translate("billing.payment.totalCost") || "Estimated Cost"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestionPlan;
