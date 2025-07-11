import allImgPaths from "@/assets";
import { Chip, Empty, LoaderCircle, RenderDate } from "@/components";
import useAppState, { RootState } from "@/context/useAppState";
import { useTranslate } from "@/hooks";
import { size } from "lodash-es";
import { useEffect } from "react";

interface Invoice {
  planName: string;
  date: string;
  amount: number;
  status: string;
}

const PAGE_SIZE = 6;

/**
 * BillingHistory component displays the user's payment and invoice history
 */
const BillingHistory = () => {
  const { translate } = useTranslate();
  // billing history state

  const {
    fetchBillingHistory,
    billingHistory,
    isLoadingBillingHistory: isLoading,
    errorBillingHistory: error,
  } = useAppState(RootState.PLAN_PRICING);

  useEffect(() => {
    fetchBillingHistory(PAGE_SIZE);
  }, []);

  /**
   * Handles the download invoice button click
   * @param invoiceId - The ID of the invoice to download
   */
  const handleDownloadInvoice = (invoiceId: string) => {
    try {
      console.log(`Downloading invoice: ${invoiceId}`);
      // Implementation for downloading invoice would go here
    } catch (error) {
      console.error("handleDownloadInvoice Error:", error);
    }
  };

  /**
   * Formats the currency amount
   * @param amount - The amount to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number): string => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const statusMapper: Record<string, string> = {
    open: "OPEN",
    paid: "PAID",
  };

  return (
    <div className="flex overflow-hidden flex-col w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="p-2 mr-3 bg-gray-100 rounded-md">
            <img src={allImgPaths.billingHistory} alt="Billing History" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {translate("billing.billingHistory")}
            </h2>
            <p className="text-gray-600">
              {translate("billing.paymentAndInvoiceHistory")}
            </p>
          </div>
        </div>

        {/* handle error */}
        {!isLoading && error && (
          <div className="mt-6">
            <p className="text-center text-red-500">
              {translate("billing.errorFetchingBillingHistory")}
            </p>
          </div>
        )}

        {/* loader */}
        {isLoading && (
          <div className="mt-6">
            <LoaderCircle />
          </div>
        )}

        {/* Billing History List */}
        <div className="mt-6 h-[320px] overflow-y-auto pb-6">
          {!isLoading && !error && size(billingHistory) > 0
            ? billingHistory.map((invoice, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between items-start py-4 border-b border-gray-200 sm:flex-row sm:items-center last:border-0"
                >
                  <div className="mb-2 sm:mb-0">
                    <h3 className="font-medium text-gray-900">
                      {invoice.planName || "N/A"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <RenderDate value={invoice.date} />
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:flex-row">
                    <div className="flex flex-col items-end mb-2 sm:mb-0 sm:mr-6">
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(invoice.amount)}
                      </span>
                      <Chip
                        text={invoice.status}
                        color={statusMapper[invoice.status] as any}
                      />
                    </div>
                    {/* <IconButton
                  onClick={() => handleDownloadInvoice(invoice.id)}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md transition-colors duration-200 hover:bg-gray-200"
                  src={allImgPaths.downloadIcon2}
                /> */}
                  </div>
                </div>
              ))
            : !isLoading && (
                <Empty
                  description={translate("billing.noBillingHistoryRecordFound")}
                  image={allImgPaths.noRecord}
                />
              )}
        </div>
      </div>
    </div>
  );
};

export default BillingHistory;
