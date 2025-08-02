import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTag, FiCheckCircle, FiX } from 'react-icons/fi';

const CheckoutPage = ({ cart, total }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    paymentMethod: 'credit_card'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`http://localhost:3000/user/${userId}/coupons`);
        const data = await response.json();
        setAvailableCoupons(data);
      } catch (err) {
        console.error('Error fetching coupons:', err);
      }
    };

    if (userId) fetchCoupons();
  }, [userId]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponError('');
    
    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode,
          cartItems: cart.map(item => ({
            productId: item.productId._id,
            price: item.productId.price,
            quantity: item.quantity
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAppliedCoupon(data.coupon);
      } else {
        setCouponError(data.message || 'Failed to apply coupon');
      }
    } catch (err) {
      setCouponError('Error applying coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // 1. Process Payment (simulated)
      const paymentSuccess = await processPayment();

      console.log("works");
      
      if (paymentSuccess) {
        // 2. Create Order
        const orderResponse = await fetch(`http://localhost:3000/user/${userId}/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart,
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              country: "US"
            },
            paymentMethod: formData.paymentMethod,
            couponCode: appliedCoupon?.code,
            total: appliedCoupon ? total - appliedCoupon.discountAmount : total
          })
        });

        console.log(orderResponse.ok+"hello");

        if (orderResponse.ok) {
          const order = await orderResponse.json();
          alert("works");
          // 3. Mark order as completed
          await fetch(`http://localhost:3000/user/${userId}/order/${order._id}/complete`, {
            method: 'POST'
          });
          
          // 4. Clear Cart only after successful payment AND order creation
          await fetch(`http://localhost:3000/user/${userId}/cart/clear`, {
            method: 'POST'
          });
          
          navigate('/order-success', { state: { orderId: order._id } });
        }
      }
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = () => {
    // In a real app, integrate with Stripe/PayPal/etc.
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Address Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            {/* Coupon Section */}
            <div className="mb-4">
              {appliedCoupon ? (
                <div className="bg-green-50 p-3 rounded-md flex justify-between items-center">
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
                    placeholder="Coupon code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={!couponCode.trim()}
                    className={`px-4 py-2 rounded-r-md ${!couponCode.trim() ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 text-sm block">Qty: {item.quantity}</span>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${appliedCoupon.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${total > 50 ? '0.00' : '5.99'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>
                  ${(appliedCoupon ? 
                    (total - appliedCoupon.discountAmount + (total > 50 ? 0 : 5.99)) : 
                    (total + (total > 50 ? 0 : 5.99))).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Available Coupons */}
            {availableCoupons.length > 0 && !appliedCoupon && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Coupons</h4>
                <ul className="space-y-2">
                  {availableCoupons.slice(0, 3).map(coupon => (
                    <li key={coupon._id} className="flex items-center">
                      <FiTag className="text-blue-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">{coupon.code} - {coupon.description}</p>
                        <p className="text-xs text-gray-500">
                          Valid until {new Date(coupon.validUntil).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium ${isProcessing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;