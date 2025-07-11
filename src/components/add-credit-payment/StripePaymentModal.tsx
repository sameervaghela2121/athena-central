import Modal from "@/components/Modal";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PaymentIntent } from "@stripe/stripe-js";
import { useState } from "react";
import ButtonV2 from "../ButtonV2";

interface StripePaymentModalProps {
  show: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: (paymentIntent: PaymentIntent) => void;
  clientSecret: string;
}

/**
 * Modal component for Stripe payment processing
 */
const StripePaymentModal = ({
  show,
  onClose,
  onPaymentSuccess,
  amount,
  clientSecret,
}: StripePaymentModalProps) => {
  const stripe = useStripe();
  const elements = useElements();
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
    <Modal show={show} onClose={onClose} size="lg" backdrop={true}>
      <Modal.Header className="pb-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Add Message Credit</h2>
        <p className="mt-1 text-sm text-gray-600">
          Complete your payment details below
        </p>
      </Modal.Header>

      <div className="p-5">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">{"Add credit"}</span>
            <span className="font-bold">${amount.toFixed(2)}</span>
          </div>
          <div className="w-full h-px bg-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Card Details
            </label>
            <div className="p-3 bg-white rounded-md border">
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
              Cancel
            </ButtonV2>
            <ButtonV2
              type="submit"
              variant="primary"
              disabled={!stripe || isProcessing}
              loading={isProcessing}
            >
              Pay Now
            </ButtonV2>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default StripePaymentModal;
