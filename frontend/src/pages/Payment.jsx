import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, CreditCard, Lock, ShoppingBag } from "lucide-react";

const stripePromise = loadStripe(
  "pk_test_51QgOg4Kjkoqs3fx5TJqHrwb4aBPjHeNxykKD6bASzTDF13vPIZ89sdumhJvQWtvaavfHaboa65M32Yo9dMohejCa00SGCRcvgx"
);

const CheckoutForm = ({ session, items }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const intentCreatedRef = useRef(false);

  useEffect(() => {
    const createIntent = async () => {
      if (intentCreatedRef.current) return;
      intentCreatedRef.current = true;

      const total_amount = items.reduce((sum, i) => sum + i.subtotal, 0);
      const idempotency_key =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random()}`;

      try {
        const res = await fetch(
          "http://localhost:5000/api/cart/create-payment-intent",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ total_amount, idempotency_key }),
          }
        );

        const data = await res.json();
        if (res.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.error || "Failed to initialize payment.");
        }
      } catch (err) {
        setError("Unable to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    if (session && items.length > 0) createIntent();
  }, [session, items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const card = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card } }
    );

    if (error) {
      setError(error.message);
      setProcessing(false);
      return;
    }

    // if (paymentIntent.status === "succeeded") {
    //   const res = await fetch(
    //     "http://localhost:5000/api/cart/confirm-payment",
    //     {
    //       method: "POST",
    //       headers: {
    //         Authorization: `Bearer ${session?.access_token}`,
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         stripe_payment_id: paymentIntent.id,
    //         items: items.map((i) => ({
    //           product_id: i.product_id,
    //           quantity: i.quantity,
    //         })),
    //       }),
    //     }
    //   );

    //   const data = await res.json();

    //   if (data.success) {
    //     localStorage.removeItem(`cart_${session?.user?.id}`);
    //     navigate("/dashboard/customer");
    //   } else {
    //     setError(data.error);
    //   }
    // }
    if (paymentIntent.status === "succeeded") {
      const res = await fetch(
        "http://localhost:5000/api/cart/confirm-payment",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stripe_payment_id: paymentIntent.id,
            items: items.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            })),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // 🔥 Payment Success Alert
        alert("🎉 Payment Successful!\nYour order has been placed.");

        localStorage.removeItem(`cart_${session?.user?.id}`);
        navigate("/dashboard/customer");
      } else {
        setError(data.error);
      }
    }


    setProcessing(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-emerald-600" />
        <p className="mt-3 text-gray-600">Preparing secure checkout...</p>
      </div>
    );

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-6 flex justify-center">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-emerald-600" />
            <h2 className="text-2xl font-bold">Secure Payment</h2>
          </div>
          <Lock className="w-6 h-6 text-gray-600" />
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex justify-between text-sm"
              >
                <span className="font-medium text-gray-800">
                  {item.product_name}
                </span>
                <span className="font-semibold">
                  ₹{item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t mt-3 pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-emerald-600">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* PAYMENT FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="text-sm text-gray-700 mb-2 block font-semibold">
              Card Details
            </label>

            <div className="flex items-center gap-2 mb-2 text-gray-600">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">Visa / MasterCard / AMEX supported</span>
            </div>

            <div className="p-3 border-2 border-gray-300 rounded-lg focus-within:border-emerald-500 transition">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#1f2937",
                      "::placeholder": { color: "#9ca3af" },
                    },
                    invalid: { color: "#ef4444" },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-2 rounded">
              {error}
            </p>
          )}

          {/* PAY BUTTON */}
          <button
            disabled={!stripe || processing}
            className={`w-full py-3 rounded-xl text-lg font-semibold flex items-center justify-center transition 
            ${
              processing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>Pay ₹{total.toFixed(2)}</>
            )}
          </button>

          <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
            <Lock className="w-4 h-4" /> Your payment is secure and encrypted
          </p>
        </form>
      </div>
    </div>
  );
};

const Payment = () => {
  const { session, validatedItems } = useLocation().state || {};
  const navigate = useNavigate();

  if (!validatedItems?.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold">No items found</h2>
        <button
          onClick={() => navigate("/dashboard/customer")}
          className="mt-3 px-5 py-2 bg-emerald-600 text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm session={session} items={validatedItems} />
    </Elements>
  );
};

export default Payment;
