import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  "pk_test_51QgOg4Kjkoqs3fx5TJqHrwb4aBPjHeNxykKD6bASzTDF13vPIZ89sdumhJvQWtvaavfHaboa65M32Yo9dMohejCa00SGCRcvgx"
); //your publishable key

// Inner component for handling payment
const CheckoutForm = ({ session, items }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch PaymentIntent from backend
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // console.log("EEEEEE Access token being sent:", session?.access_token);

        const total_amount = items.reduce((sum, i) => sum + i.subtotal, 0);
        const res = await fetch(
          "http://localhost:5000/api/cart/create-payment-intent",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ total_amount }),
          }
        );

        const data = await res.json();
        if (res.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || "Failed to initialize payment.");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to connect to payment server.");
      } finally {
        setLoading(false);
      }
    };
    createPaymentIntent();
  }, [session, items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const card = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: { card },
      }
    );

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      // ✅ Confirm backend sale after successful payment
      const res = await fetch(
        "http://localhost:5000/api/cart/confirm-payment",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
            stripe_payment_id: paymentIntent.id,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        // ✅ Clear local storage cart for this user
        try {
          const customerId = session?.user?.id; // or session.user.id depending on your session shape
          if (customerId) {
            localStorage.removeItem(`cart_${customerId}`);
            console.log(
              `🧹 Cleared localStorage cart for user: cart_${customerId}`
            );
          }
        } catch (err) {
          console.warn("Failed to clear cart:", err);
        }
        alert("✅ Payment successful! Order placed.");
        navigate("/dashboard/customer"); // redirect to customer dashboard
      } else {
        alert(`❌ Order creation failed: ${data.error}`);
      }

      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-emerald-600" />
        <span className="ml-2 text-gray-600">Initializing payment...</span>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
          Enter Payment Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={!stripe || processing}
            className={`w-full px-4 py-2 rounded-lg font-semibold text-white 
              ${
                processing
                  ? "bg-gray-400"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
          >
            {processing ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Payment = () => {
  const location = useLocation();
  const { session, validatedItems } = location.state || {};
  if (!validatedItems || validatedItems.length === 0) {
    return (
      <div className="text-center mt-10 text-gray-600">
        No items to pay for.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm session={session} items={validatedItems} />
    </Elements>
  );
};

export default Payment;
