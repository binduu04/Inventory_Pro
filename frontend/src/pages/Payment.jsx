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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Initializing payment...</p>
        </div>
      </div>
    );

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="bg-white rounded-t-2xl border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Complete Payment
            </h2>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Items</span>
              <span className="text-sm font-medium text-gray-800">{items.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Amount to Pay</span>
              <span className="text-2xl font-bold text-emerald-600">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form Card */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Details
              </label>
              <div className="p-4 border-2 border-gray-200 rounded-lg focus-within:border-emerald-500 transition-colors bg-gray-50">
                <CardElement 
                  options={{ 
                    style: { 
                      base: { 
                        fontSize: "16px",
                        color: "#1f2937",
                        "::placeholder": {
                          color: "#9ca3af",
                        },
                      },
                      invalid: {
                        color: "#ef4444",
                      },
                    } 
                  }} 
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!stripe || processing}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                processing || !stripe
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md hover:shadow-lg"
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pay ₹{total.toFixed(2)}
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              🔒 Your payment information is secure and encrypted
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, validatedItems } = location.state || {};
  
  if (!validatedItems || validatedItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Items Found</h2>
          <p className="text-sm text-gray-600 mb-6">
            There are no items to process for payment.
          </p>
          <button
            onClick={() => navigate("/dashboard/customer")}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg font-medium transition-all"
          >
            Back to Shopping
          </button>
        </div>
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
