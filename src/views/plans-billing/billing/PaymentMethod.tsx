import { get, startCase } from "lodash-es";
import { useEffect } from "react";

import allImgPaths from "@/assets";
import { LoadableContent } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";

interface PaymentCards {
  brand: string;
  exp_month: number;
  exp_year: number;
  last4: string;
}

/**
 * PaymentMethod component displays the user's payment method information
 * and provides an option to update the payment method
 */
const PaymentMethod = () => {
  const { translate } = useTranslate();

  const {
    paymentCard,
    errorPaymentCard: error,
    isLoadingPaymentCard: isLoading,
    fetchPaymentCards,
  } = useAppState(RootState.PLAN_PRICING);

  useEffect(() => {
    fetchPaymentCards();
  }, []);

  return (
    <div className="flex overflow-hidden flex-col w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center">
            <div className="p-2 mr-3 bg-gray-100 rounded-md">
              <img src={allImgPaths.paymentCard} alt="Card" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {translate("billing.paymentMethod")}
            </h2>
          </div>
          <p className="text-gray-600">
            {translate("billing.managePaymentDetails")}
          </p>
        </div>

        {/* Body */}
        <div className="">
          {error ? (
            <span className="text-status-error">
              Something went wrong with fetching payment card detail
            </span>
          ) : (
            <>
              {/* Payment Card Info */}
              <div className="p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="p-2 mr-3 bg-gray-100 rounded-md">
                      <img src={allImgPaths.paymentCard} alt="Card" />
                    </div>
                    <div>
                      <LoadableContent
                        isLoading={isLoading}
                        skeletonWidth="w-40"
                        skeletonHeight="h-5"
                        className="mb-1"
                        content={
                          <p className="font-medium text-gray-800">
                            {translate("billing.cardEnding", {
                              brand: startCase(get(paymentCard, "brand", "")),
                              number: get(paymentCard, "last4", ""),
                            })}
                          </p>
                        }
                      />
                      <LoadableContent
                        isLoading={isLoading}
                        skeletonWidth="w-28"
                        skeletonHeight="h-4"
                        content={
                          <p className="text-sm text-gray-600">
                            {translate("billing.expires", {
                              date: `${get(paymentCard, "exp_month", "")}/${get(paymentCard, "exp_year", "").toString().slice(-2)}`,
                            })}
                          </p>
                        }
                      />
                    </div>
                  </div>
                  <LoadableContent
                    isLoading={isLoading}
                    skeletonWidth="w-20"
                    skeletonHeight="h-8"
                    className="rounded-full"
                    content={
                      <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
                        {translate("billing.default")}
                      </span>
                    }
                  />
                </div>
              </div>
              {/* Security Message */}

              <p className="mt-6 text-sm italic text-gray-600">
                {translate("billing.cardInformation")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
