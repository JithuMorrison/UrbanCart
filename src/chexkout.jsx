// CheckoutPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = ({ cart, total }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    paymentMethod: 'credit_card'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // 1. Process Payment (simulated)
      const paymentSuccess = await processPayment();
      
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
            total: total
          })
        });

        if (orderResponse.ok) {
          // 3. Clear Cart only after successful payment AND order creation
          await fetch(`http://localhost:3000/user/${userId}/cart/clear`, {
            method: 'POST'
          });
          navigate('/order-success');
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
    <div className="checkout-container">
      <h2>Checkout</h2>
      <form onSubmit={handleSubmit}>
        {/* Shipping Address Form */}
        <div className="form-section">
          <h3>Shipping Information</h3>
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          {/* More address fields... */}
        </div>

        {/* Payment Method Selection */}
        <div className="form-section">
          <h3>Payment Method</h3>
          <select 
            value={formData.paymentMethod}
            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
          >
            <option value="credit_card">Credit Card</option>
            <option value="paypal">PayPal</option>
          </select>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className="order-item">
              <span>{item.name} x {item.quantity}</span>
              <span>${item.price * item.quantity}</span>
            </div>
          ))}
          <div className="total">
            <strong>Total: ${total}</strong>
          </div>
        </div>

        <button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;