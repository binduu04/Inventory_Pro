import { X, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  validationResult,
  onFixCart,
  onProceedPayment,
  isProcessing,
  session
}) => {

  const navigate = useNavigate(); 

  if (!isOpen) return null;

  const { hasErrors, errors, validItems, total } = validationResult;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[85vh] mx-4">
        {/* Header */}
        <div
          className={`px-6 py-4 rounded-t-2xl flex justify-between items-center ${
            hasErrors
              ? "bg-gradient-to-r from-red-500 to-orange-500"
              : "bg-gradient-to-r from-emerald-500 to-green-600"
          } text-white`}
        >
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
            <h2 className="text-lg font-bold">
              {hasErrors ? "Cart Validation Issues" : "Ready to Checkout"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {hasErrors ? (
            /* Error Section */
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issues Found ({errors.length})
                </h3>
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-700 flex items-start gap-2"
                    >
                      <span className="text-red-500 mt-0.5">•</span>
                      <span className="flex-1">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">
                  What to do?
                </h4>
                <p className="text-sm text-blue-700">
                  Please update your cart to match available stock or remove
                  out-of-stock items.
                </p>
              </div>

              {validItems && validItems.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    Valid Items ({validItems.length})
                  </h4>
                  <div className="space-y-2">
                    {validItems.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                      >
                        <span className="text-gray-700">
                          {item.product_name}
                        </span>
                        <span className="text-gray-500">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Success Section */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-900 text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  All Products Verified ✓
                </h3>
                <p className="text-sm text-emerald-700">
                  Your cart has been validated. All items are in stock and ready
                  for checkout.
                </p>
              </div>

              {/* Order Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">
                  Order Summary
                </h4>
                <div className="space-y-2">
                  {validItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex justify-between text-sm"
                    >
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">
                          {item.product_name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {item.quantity} × ₹{item.unit_price.toFixed(2)}
                          {item.discount_percent > 0 && (
                            <span className="text-emerald-600 ml-1">
                              ({item.discount_percent}% off)
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-gray-900 font-semibold">
                        ₹{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-gray-900">Total Amount</span>
                      <span className="text-emerald-600">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          {hasErrors ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onFixCart}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                Fix Cart
              </button>
            </div>
          ) : (
            // <button
            //   onClick={onProceedPayment}
            //   disabled={isProcessing}
            //   className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg ${
            //     isProcessing
            //       ? 'bg-gray-400 cursor-not-allowed'
            //       : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            //   }`}
            // >
            //   {isProcessing ? (
            //     <span className="flex items-center justify-center gap-2">
            //       <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            //         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            //         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            //       </svg>
            //       Processing...
            //     </span>
            //   ) : (
            //     'PAY NOW'
            //   )}
            // </button>
            <button
              onClick={() => {
                onClose();
                navigate("/payment", {
                  state: {
                    session: session, // pass auth session
                    validatedItems: validationResult.validItems,
                  },
                });
              }}
              disabled={isProcessing}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg ${
                isProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "PAY NOW"
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;
