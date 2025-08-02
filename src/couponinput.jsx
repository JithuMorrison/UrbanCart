import React, { useState } from 'react';
import { FiTag, FiX, FiCheckCircle } from 'react-icons/fi';

const CouponInput = ({ userId, cartItems, onCouponApplied }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode,
          cartItems: cartItems.map(item => ({
            productId: item.productId._id,
            price: item.productId.price,
            quantity: item.quantity
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAppliedCoupon(data.coupon);
        onCouponApplied(data.coupon.discountAmount);
      } else {
        setError(data.message || 'Failed to apply coupon');
      }
    } catch (err) {
      setError('Error applying coupon');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponApplied(0);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <FiTag className="text-gray-500 mr-2" />
        <h4 className="font-medium">Have a coupon code?</h4>
      </div>
      
      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center">
            <FiCheckCircle className="text-green-500 mr-2" />
            <span className="font-medium">{appliedCoupon.code} applied</span>
            <span className="ml-2 text-sm text-green-700">
              -${appliedCoupon.discountAmount.toFixed(2)}
            </span>
          </div>
          <button 
            onClick={removeCoupon}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX />
          </button>
        </div>
      ) : (
        <div className="flex">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={applyCoupon}
            disabled={loading || !couponCode.trim()}
            className={`px-4 py-2 rounded-r-lg ${loading || !couponCode.trim() ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CouponInput;