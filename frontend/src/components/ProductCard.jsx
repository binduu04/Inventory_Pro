import { Plus, Minus } from 'lucide-react';

const ProductCard = ({ product, quantityInCart, onAddToCart, onUpdateQuantity }) => {
  // Use active_discount from backend (which applies discounts based on current date)
  const discountPercent = product.active_discount || 0;
  const hasDiscount = discountPercent > 0;
  const discountedPrice = hasDiscount 
    ? product.selling_price * (1 - discountPercent / 100) 
    : product.selling_price;
  const isOutOfStock = product.current_stock === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
      {/* Product Image with Add Button Overlay */}
      <div className="relative bg-gray-50 aspect-square">
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10">
            {discountPercent}% OFF
          </div>
        )}
        
        {/* Product Image */}
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'}
          alt={product.product_name}
          className="w-full h-full object-contain p-4"
        />

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Add to Cart Button - Quick Commerce Style */}
        {!isOutOfStock && (
          <div className="absolute bottom-2 right-2 z-10">
            {quantityInCart > 0 ? (
              <div className="flex items-center bg-emerald-500 rounded-lg shadow-lg">
                <button
                  onClick={() => onUpdateQuantity(product.id, -1)}
                  className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-600 rounded-l-lg transition-colors"
                >
                  <Minus className="w-4 h-4 font-bold" />
                </button>
                <span className="px-3 font-bold text-white min-w-[2.5rem] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={() => onUpdateQuantity(product.id, 1)}
                  className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-600 rounded-r-lg transition-colors"
                >
                  <Plus className="w-4 h-4 font-bold" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(product)}
                className="bg-white border-2 border-emerald-500 text-emerald-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all shadow-lg flex items-center gap-1.5 group-hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                ADD
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.product_name}
        </h3>

        {/* Category */}
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            ₹{discountedPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-400 line-through">
                ₹{product.selling_price}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;