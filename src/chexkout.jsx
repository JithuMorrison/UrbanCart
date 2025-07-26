import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCreditCard, FiTruck, FiHome } from 'react-icons/fi';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cart and user addresses
        const [cartRes, userRes] = await Promise.all([
          fetch(`http://localhost:3000/user/${userId}`),
          fetch(`http://localhost:3000/user/${userId}`)
        ]);
        
        const cartData = await cartRes.json();
        const userData = await userRes.json();
        
        setCart(cartData.cart);
        setAddresses(userData.addresses);
        
        // Set default address if available
        const defaultAddress = userData.addresses.find(addr => addr.isDefault);
        if (defaultAddress) setSelectedAddress(defaultAddress);
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      }
    };

    if (userId) fetchData();
    else navigate('/login');
  }, [userId, navigate]);

  const applyDiscount = async () => {
    try {
      const response = await fetch(`http://localhost:3000/discounts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, userId })
      });
      
      const data = await response.json();
      if (response.ok) {
        setDiscountApplied(data);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error applying discount:', err);
    }
  };

  const placeOrder = async () => {
    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: selectedAddress,
          paymentMethod,
          discountCode: discountApplied?.code
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setOrderDetails(data);
        setOrderComplete(true);
      } else {
        alert('Error placing order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const discount = discountApplied?.value || 0;
    const tax = subtotal * 0.08; // Example tax calculation
    const total = subtotal + shipping + tax - discount;
    
    return { subtotal, shipping, tax, discount, total };
  };

  const { subtotal, shipping, tax, discount, total } = calculateTotals();

  if (orderComplete) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <FiCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-xl mb-6">Thank you for your purchase</p>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-left mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <p className="mb-2"><span className="font-medium">Order #:</span> {orderDetails._id}</p>
          <p className="mb-2"><span className="font-medium">Date:</span> {new Date(orderDetails.orderDate).toLocaleDateString()}</p>
          <p className="mb-2"><span className="font-medium">Total:</span> ${total.toFixed(2)}</p>
          <p className="mb-4"><span className="font-medium">Status:</span> {orderDetails.status}</p>
          
          <h3 className="font-medium mb-2">Shipping Address:</h3>
          <p className="mb-2">{selectedAddress.street}</p>
          <p className="mb-2">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
          <p>{selectedAddress.country}</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-center mb-8">
        <div className="flex items-center">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <FiCheckCircle /> : '1'}
            </div>
            <span className="mt-2">Shipping</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <FiCheckCircle /> : '2'}
            </div>
            <span className="mt-2">Payment</span>
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="mt-2">Review</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {addresses.map(address => (
              <div 
                key={address._id} 
                className={`border rounded-lg p-4 cursor-pointer ${selectedAddress?._id === address._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedAddress(address)}
              >
                <div className="flex items-center mb-2">
                  <FiHome className="mr-2" />
                  <span className="font-medium">{address.isDefault ? 'Default Address' : 'Address'}</span>
                </div>
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>{address.country}</p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => setStep(2)}
            disabled={!selectedAddress}
            className={`w-full py-2 rounded-lg ${selectedAddress ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Continue to Payment
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          
          <div className="space-y-4 mb-6">
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === 'credit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setPaymentMethod('credit')}
            >
              <div className="flex items-center">
                <FiCreditCard className="mr-2" />
                <span className="font-medium">Credit/Debit Card</span>
              </div>
              {paymentMethod === 'credit' && (
                <div className="mt-4 space-y-3">
                  <input type="text" placeholder="Card Number" className="w-full p-2 border rounded" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Expiry Date" className="p-2 border rounded" />
                    <input type="text" placeholder="CVV" className="p-2 border rounded" />
                  </div>
                  <input type="text" placeholder="Cardholder Name" className="w-full p-2 border rounded" />
                </div>
              )}
            </div>
            
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <div className="flex items-center">
                <FiCreditCard className="mr-2" />
                <span className="font-medium">PayPal</span>
              </div>
            </div>
            
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setPaymentMethod('cod')}
            >
              <div className="flex items-center">
                <FiTruck className="mr-2" />
                <span className="font-medium">Cash on Delivery</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Discount Code</h3>
            <div className="flex">
              <input 
                type="text" 
                placeholder="Enter discount code" 
                className="flex-1 p-2 border rounded-l"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
              <button 
                onClick={applyDiscount}
                className="bg-gray-200 px-4 py-2 rounded-r hover:bg-gray-300"
              >
                Apply
              </button>
            </div>
            {discountApplied && (
              <p className="text-green-600 mt-2">
                Discount applied: {discountApplied.type === 'percentage' 
                  ? `${discountApplied.value}% off` 
                  : `$${discountApplied.value} off`}
              </p>
            )}
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button 
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Review Order
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Review Your Order</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Shipping Address</h3>
              <p>{selectedAddress.street}</p>
              <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
              <p>{selectedAddress.country}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Payment Method</h3>
              <p>{paymentMethod === 'credit' ? 'Credit/Debit Card' : 
                  paymentMethod === 'paypal' ? 'PayPal' : 'Cash on Delivery'}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Order Items</h3>
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item.productId._id} className="py-4 flex">
                    <img 
                      src={item.productId.images?.[0] || 'https://via.placeholder.com/100'} 
                      alt={item.productId.productName} 
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium">{item.productId.productName}</h4>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-medium">
                      ${(item.productId.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button 
              onClick={placeOrder}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;