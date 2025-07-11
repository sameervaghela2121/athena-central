import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

// Replace with your actual Stripe publishable key from environment variables
// In production, you should use environment variables for this
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51RETP0Gh76tClkqnMRSxF8vbpIQkNeb98S8uJH4cBvw6ItSi8Wv0cXyRLEFZ0QO4lzLqho1pf4C22sAVk1ckCbBn00WmO2d3ZU",
);

interface StripeProviderProps {
  children: ReactNode;
}

/**
 * Provider component for Stripe integration
 * Wraps the application with Stripe Elements context
 */
const StripeProvider = ({ children }: StripeProviderProps) => {
  // Configure Stripe Elements appearance
  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#0570de",
      colorBackground: "#ffffff",
      colorText: "#30313d",
      colorDanger: "#df1b41",
      fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
      borderRadius: "4px",
    },
  };

  const options = {
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
