import { ShoppingCart, X, Plus, Minus } from 'lucide-react';

const Cart = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  calculateDiscountedPrice 
}) => {
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = calculateDiscountedPrice(
      item.selling_price, 
      item.festival_discount_percent || item.flash_sale_discount_percent || 0
    );
    return sum + (price * item.quantity);
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">Shopping Cart ({cartCount})</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Your cart is empty</p>
              <p className="text-gray-400 text-xs mt-1">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const discountPercent = item.festival_discount_percent || item.flash_sale_discount_percent || 0;
                const itemPrice = calculateDiscountedPrice(item.selling_price, discountPercent);
                const hasDiscount = discountPercent > 0;
                
                return (
                  <div key={item.id} className="flex gap-4 bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=80&h=80&fit=crop'} 
                        alt={item.product_name} 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {item.product_name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="text-base font-bold text-gray-900">₹{itemPrice.toFixed(2)}</p>
                          {hasDiscount && (
                            <p className="text-xs text-gray-400 line-through">₹{item.selling_price}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border-2 border-emerald-500 rounded-lg">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, -1)} 
                              className="w-7 h-7 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-l-md font-bold text-lg"
                            >
                              −
                            </button>
                            <span className="font-semibold text-emerald-600 px-3 text-sm">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, 1)} 
                              className="w-7 h-7 flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-600 rounded-r-md font-bold text-lg"
                            >
                              +
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => onRemoveItem(item.id)} 
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Total */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-5 bg-white">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({cartCount} items)</span>
                <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Charges</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span className="text-emerald-600">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-lg">
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;