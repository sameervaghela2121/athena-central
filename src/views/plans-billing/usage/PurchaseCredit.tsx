import allImgPaths from "@/assets";
import { ButtonV2 } from "@/components";
import { useTranslate } from "@/hooks";
import { useState } from "react";
import PurchaseCreditModal from "./PurchaseCreditModal";

/**
 * PurchaseCredit component - displays a banner with information about credits
 * and provides a button to open the purchase credits modal
 */
const PurchaseCredit = ({ onPurchase }: { onPurchase: () => void }) => {
  const { translate } = useTranslate();
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);

  /**
   * Opens the purchase credit modal
   */
  const handleOpenModal = () => {
    setShowPurchaseModal(true);
  };

  /**
   * Refreshes data after successful credit purchase
   */
  const handlePurchaseSuccess = () => {
    // Add any refresh logic here if needed
    setShowPurchaseModal(false);
    onPurchase();
  };

  return (
    <>
      <div className="p-2 pl-6 w-full bg-white rounded-full border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center select-none">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
              <img src={allImgPaths.chatAddOn} alt="" className="w-6 h-6" />
              <h3 className="text-base font-medium">
                {translate("billing.usage.needMoreCredits") ||
                  "Need More Credits?"}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {
                "You can add extra credits at any time, whether you're running low or preparing for high usage. Unused add-on credits roll over to the next month"
              }
            </p>
          </div>
          <ButtonV2
            variant="tertiaryDark"
            onClick={handleOpenModal}
            // className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200 bg-primary-600 hover:bg-primary-700"
          >
            {translate("billing.usage.purchaseCredits") || "Purchase Credits"}
          </ButtonV2>
        </div>
      </div>

      <PurchaseCreditModal
        show={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </>
  );
};

export default PurchaseCredit;
