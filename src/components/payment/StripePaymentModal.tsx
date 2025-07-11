import api from "@/apis/planAndBilling";
import Modal from "@/components/Modal";
import { useTranslate } from "@/hooks";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PaymentIntent } from "@stripe/stripe-js";
import { useState } from "react";
import ButtonV2 from "../ButtonV2";

interface StripePaymentModalProps {
  show: boolean;
  onClose: () => void;
  planId: string;
  planName: React.ReactNode;
  planPrice: number;
  onPaymentSuccess: (paymentIntent: PaymentIntent) => void;
}

/**
 * Modal component for Stripe payment processing
 */
const StripePaymentModal = ({
  show,
  onClose,
  planId,
  planName,
  planPrice,
  onPaymentSuccess,
}: StripePaymentModalProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { translate } = useTranslate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Handles the payment submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (!stripe || !elements) {
        // Stripe.js has not loaded yet
        return;
      }

      setIsProcessing(true);
      setErrorMessage("");

      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setErrorMessage("Card element not found");
        setIsProcessing(false);
        return;
      }

      // Create a payment method using the card element
      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

      if (paymentMethodError) {
        setErrorMessage(
          paymentMethodError.message || "An error occurred with your card",
        );
        setIsProcessing(false);
        return;
      }

      // Call your backend to create the payment intent
      try {
        const payload = {
          tier_id: planId,
        };
        const clientSecret = await api.subscribe(payload);
        console.log("Payment intent created =>", clientSecret);

        // Confirm the card payment with the client secret
        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                // You can add billing details here if needed
              },
            },
          });

        if (confirmError) {
          setErrorMessage(
            confirmError.message || "Payment confirmation failed",
          );
          setIsProcessing(false);
          return;
        }

        // Payment succeeded
        onPaymentSuccess(paymentIntent);
      } catch (apiError) {
        console.error("API request Error:", apiError);
        setErrorMessage("Failed to process payment. Please try again.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("handleSubmit Error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  /**
   * Custom styling for the CardElement component
   */
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      size="xl"
      backdrop={true}
      extraClasses="!p-0"
    >
      <Modal.Header className="pb-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">
          {translate("billing.payment.modalTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {translate("billing.payment.modalSubtitle")}
        </p>
      </Modal.Header>

      <div className="p-5">
        <div className="p-4 mb-6 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            {translate("billing.payment.paymentSummary")}
          </h3>

          <div className="space-y-3">
            {/* Plan Details */}
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <div className="flex items-center">
                <span className="text-gray-600">{planName}</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {translate("billing.payment.billingFrequency")}
                </span>
              </div>
              <span className="font-medium text-gray-800">
                ${planPrice?.toFixed(2)}
              </span>
            </div>

            {/* Total Cost */}
            <div className="flex justify-between items-center px-3 py-3 mt-2 rounded bg-secondary-100">
              <span className="font-medium text-gray-700">
                {translate("billing.payment.totalCost")}
              </span>
              <span className="text-xl font-bold text-primary-900">
                ${planPrice?.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {translate("billing.payment.billingNote")}
          </p>
        </div>

        <div className="mb-4 w-full h-px bg-gray-200"></div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              {translate("billing.payment.cardDetails")}
            </label>
            <div className="p-3 bg-white rounded-md border border-gray-200 shadow-sm transition-colors duration-200 hover:border-blue-300">
              <CardElement options={cardElementOptions} />
            </div>
            {errorMessage && (
              <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <ButtonV2
              type="button"
              variant="tertiaryDark"
              onClick={onClose}
              disabled={isProcessing}
            >
              {translate("billing.payment.cancelButton")}
            </ButtonV2>
            <ButtonV2
              type="submit"
              variant="primary"
              disabled={!stripe || isProcessing || planPrice <= 0}
              loading={isProcessing}
            >
              {translate("billing.payment.payNowButton")}
            </ButtonV2>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default StripePaymentModal;
