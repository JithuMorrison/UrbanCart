import React, { useState, useEffect } from 'react';
import { 
  FiShoppingCart, 
  FiTrash2, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiCreditCard, 
  FiUser, 
  FiMapPin,
  FiPackage,
  FiDollarSign
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [user] = useState(() => localStorage.getItem("userId"));
  const [username] = useState(() => localStorage.getItem("username"));
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'details', 'payment', 'complete'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    country: 'US',
    paymentMethod: 'credit_card',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const navigate = useNavigate();

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartWithDiscounts = storedCart.map(item => ({
          ...item,
          priceAfterDiscount: calculatePriceAfterDiscount(item.price, item.discount || 0),
          quantitybuy: item.quantitybuy || 1
        }));
        setCart(cartWithDiscounts);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/user/${user}/cart`);
        if (!response.ok) throw new Error('Failed to fetch cart');
        
        const cartData = await response.json();
        
        const productsWithDetails = await Promise.all(
          cartData.map(async (item) => {
            const productResponse = await fetch(`http://localhost:3000/products/${item.id}`);
            if (!productResponse.ok) throw new Error('Failed to fetch product details');
            
            const product = await productResponse.json();
            return {
              id: item.id,
              quantitybuy: item.quantity,
              priceAfterDiscount: calculatePriceAfterDiscount(product.price, product.discount || 0),
              ...product
            };
          })
        );
        
        setCart(productsWithDetails);
      } catch (error) {
        console.error('Error fetching cart:', error);
        const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartWithDiscounts = storedCart.map(item => ({
          ...item,
          priceAfterDiscount: calculatePriceAfterDiscount(item.price, item.discount || 0),
          quantitybuy: item.quantitybuy || 1
        }));
        setCart(cartWithDiscounts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  useEffect(() => {
    const fetchUserAddresses = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`http://localhost:3000/user/${user}/addresses`);
        if (!response.ok) throw new Error('Failed to fetch addresses');
        
        const addresses = await response.json();
        setUserAddresses(addresses);
        
        // Set default address if available
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      }
    };

    if (checkoutStep === 'details' || checkoutStep === 'cart') {
      fetchUserAddresses();
    }
  }, [user, checkoutStep]);

  const handleUseSavedAddress = (addressId) => {
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
      setFormData(prev => ({
        ...prev,
        address: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country
      }));
      setCheckoutStep('payment');
    }
  };

  // Helper functions
  const calculatePriceAfterDiscount = (price, discount) => {
    return (price * (1 - discount / 100)).toFixed(2);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.priceAfterDiscount) * item.quantitybuy), 0).toFixed(2);
  };

  const calculateSubtotal = (item) => {
    return (parseFloat(item.priceAfterDiscount) * item.quantitybuy);
  };

  const calculateTax = () => {
    return (parseFloat(calculateTotal()) * 0.1).toFixed(2); // 10% tax
  };

  const calculateGrandTotal = () => {
    return (parseFloat(calculateTotal()) + parseFloat(calculateTax())).toFixed(2);
  };

  // Cart operations
  const updateQuantity = async (id, newQuantity) => {
    try {
      const item = cart.find(item => item.id === id);
      if (!item) return;
      
      if (newQuantity < 1) return;
      if (newQuantity > item.quantity) {
        alert(`Cannot order more than available stock (${item.quantity})`);
        return;
      }

      if (user) {
        const response = await fetch(`http://localhost:3000/user/${user}/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'update',
            productId: id, 
            quantity: newQuantity 
          })
        });
        
        if (!response.ok) throw new Error('Failed to update quantity');
      }
      
      const updatedCart = cart.map(item => 
        item.id === id ? { ...item, quantitybuy: newQuantity } : item
      );
      
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const removeFromCart = async (id) => {
    try {
      if (user) {
        const response = await fetch(`http://localhost:3000/user/${user}/cart/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id })
        });
        
        if (!response.ok) throw new Error('Failed to remove item');
      }
      
      const updatedCart = cart.filter((item) => item.id !== id);
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  // Checkout flow functions
  const handleCheckoutStart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const invalidItems = cart.filter(item => item.quantitybuy > item.quantity);
    if (invalidItems.length > 0) {
      alert(`Some items exceed available stock`);
      return;
    }
    
    setCheckoutStep('details');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Prepare order data
      const order = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantityOrdered: item.quantitybuy,
          price: parseFloat(item.priceAfterDiscount),
          image: item.images?.[0] || 'https://via.placeholder.com/150'
        })),
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          country: formData.country
        },
        customerInfo: {
          name: formData.name,
          email: formData.email
        },
        paymentMethod: formData.paymentMethod,
        subtotal: parseFloat(calculateTotal()),
        tax: parseFloat(calculateTax()),
        total: parseFloat(calculateGrandTotal()),
        status: 'processing'
      };

      // Submit order to backend
      const response = await fetch(`http://localhost:3000/user/${user}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Clear cart in the frontend state
      setCart([]);
      localStorage.removeItem('cart');
      
      // Clear cart in backend if user is logged in
      if (user) {
        await fetch(`http://localhost:3000/user/${user}/cart/clear`, {
          method: 'POST'
        });
      }
      
      setCheckoutStep('complete');
    } catch (error) {
      console.error('Checkout failed:', error);
      alert(`Checkout failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render functions for each step
  const renderCartItem = (item) => (
    <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row mb-4">
      <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
        <img 
          src={item.images?.[0] || 'https://via.placeholder.com/150'} 
          alt={item.name} 
          className="w-32 h-32 object-contain rounded-lg"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
          }}
        />
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{item.name}</h2>
          <button 
            onClick={() => removeFromCart(item.id)}
            className="text-red-500 hover:text-red-700"
          >
            <FiTrash2 />
          </button>
        </div>
        
        <div className="mt-2 flex items-center">
          <span className="text-gray-700 mr-4">Price:</span>
          <div className="flex items-center">
            {item.discount > 0 ? (
              <>
                <span className="line-through text-gray-400 mr-2">
                  ${parseFloat(item.price).toFixed(2)}
                </span>
                <span className="font-medium text-red-600">
                  ${item.priceAfterDiscount}
                </span>
              </>
            ) : (
              <span className="font-medium">
                ${parseFloat(item.price).toFixed(2)}
              </span>
            )}
            {item.discount > 0 && (
              <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded">
                {item.discount}% OFF
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          <span className="text-gray-700 mr-4">Quantity:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => updateQuantity(item.id, item.quantitybuy - 1)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
              disabled={item.quantitybuy <= 1}
            >
              -
            </button>
            <span className="px-3 py-1">{item.quantitybuy}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantitybuy + 1)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
              disabled={item.quantitybuy >= item.quantity}
            >
              +
            </button>
          </div>
          <span className="ml-2 text-sm text-gray-500">
            {item.quantity} available
          </span>
        </div>
        
        <div className="mt-4">
          <span className="text-gray-700 mr-4">Subtotal:</span>
          <span className="font-bold">${calculateSubtotal(item).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <FiArrowLeft className="mr-1" /> Back
          </button>
          
          <div className="flex items-center">
            {username ? (
              <span className="text-gray-700">Hello, {username}</span>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Login to checkout
              </button>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <FiShoppingCart className="mr-2" /> Your Shopping Cart
        </h1>
        <p className="text-gray-600 mb-8">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {cart.map(renderCartItem)}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span>${calculateTax()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>${calculateGrandTotal()}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckoutStart}
                  className="w-full py-3 rounded-lg text-white font-medium transition-colors duration-300 bg-indigo-600 hover:bg-indigo-700"
                >
                  Proceed to Checkout
                </button>
                
                {!user && (
                  <p className="text-sm text-center text-gray-500 mt-4">
                    You need to <button onClick={() => navigate('/login')} className="text-indigo-600">login</button> to checkout
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiShoppingCart className="text-gray-300 text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
        <button 
          onClick={() => setCheckoutStep('cart')}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <FiArrowLeft className="mr-1" /> Back to Cart
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FiUser className="mr-2" /> Shipping Information
        </h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          setCheckoutStep('payment');
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-group">
              <label className="block text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                required
              />
            </div>
            <div className="form-group">
              <label className="block text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiMapPin className="mr-2" /> Shipping Address
            </h3>
            
            {userAddresses.length > 0 && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useSavedAddress}
                    onChange={(e) => {
                      setUseSavedAddress(e.target.checked);
                      if (!e.target.checked) {
                        // Clear address fields when unchecking
                        setFormData(prev => ({
                          ...prev,
                          address: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: 'US'
                        }));
                      } else if (selectedAddressId) {
                        // Populate with selected address
                        const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
                        if (selectedAddress) {
                          setFormData(prev => ({
                            ...prev,
                            address: selectedAddress.street,
                            city: selectedAddress.city,
                            state: selectedAddress.state,
                            zipCode: selectedAddress.zipCode,
                            country: selectedAddress.country
                          }));
                        }
                      }
                    }}
                    className="mr-2"
                  />
                  <span>Use saved address</span>
                </label>
              </div>
            )}

            {useSavedAddress && userAddresses.length > 0 ? (
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Select Address *</label>
                <select
                  value={selectedAddressId || ''}
                  onChange={(e) => {
                    const addressId = e.target.value;
                    setSelectedAddressId(addressId);
                    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
                    if (selectedAddress) {
                      setFormData(prev => ({
                        ...prev,
                        address: selectedAddress.street,
                        city: selectedAddress.city,
                        state: selectedAddress.state,
                        zipCode: selectedAddress.zipCode,
                        country: selectedAddress.country
                      }));
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  required
                >
                  <option value="">Select an address</option>
                  {userAddresses.map(address => (
                    <option key={address._id} value={address._id}>
                      {address.street}, {address.city}, {address.country} 
                      {address.isDefault && ' (Default)'}
                    </option>
                  ))}
                </select>
                
                {selectedAddressId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Selected Address:</h4>
                    <p>
                      {formData.address}<br />
                      {formData.city}, {formData.state} {formData.zipCode}<br />
                      {formData.country}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="block text-gray-700 mb-2">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2">State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2">ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2">Country *</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiPackage className="mr-2" /> Order Summary
            </h3>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">{item.name} × {item.quantitybuy}</span>
                <span className="font-medium">${calculateSubtotal(item).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-600 pt-2">
              <span>Subtotal</span>
              <span>${calculateTotal()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${calculateTax()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>${calculateGrandTotal()}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
            >
              Continue to Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
        <button 
          onClick={() => setCheckoutStep(userAddresses.length > 0 ? 'address' : 'details')}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <FiArrowLeft className="mr-1" /> Back to {userAddresses.length > 0 ? 'Address' : 'Details'}
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FiCreditCard className="mr-2" /> Payment Method
        </h2>

        <form onSubmit={handleSubmitPayment}>
          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FiUser className="mr-2" /> Customer Information
              </h3>
              <div className="space-y-2">
                <p><span className="text-gray-600">Name:</span> {formData.name}</p>
                <p><span className="text-gray-600">Email:</span> {formData.email}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FiMapPin className="mr-2" /> Shipping Address
              </h3>
              <p>{formData.address}</p>
              <p>{formData.city}, {formData.state} {formData.zipCode}</p>
              <p>{formData.country}</p>
            </div>

            <label className="block text-gray-700 mb-2">Payment Method *</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              required
            >
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="apple_pay">Apple Pay</option>
            </select>

            {formData.paymentMethod === 'credit_card' && (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="block text-gray-700 mb-2">Card Number *</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2">Expiry Date *</label>
                    <input
                      type="text"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-gray-700 mb-2">CVV *</label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.paymentMethod === 'paypal' && (
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-blue-800">You'll be redirected to PayPal to complete your payment</p>
              </div>
            )}

            {formData.paymentMethod === 'apple_pay' && (
              <div className="bg-black p-4 rounded-lg text-center">
                <p className="text-white">Pay with Apple Pay</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiDollarSign className="mr-2" /> Order Total
            </h3>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${calculateGrandTotal()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-3 rounded-lg text-white font-medium transition-colors duration-300 ${
              isProcessing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              'Complete Order'
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderOrderComplete = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. A confirmation has been sent to {formData.email}.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/orders')}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            View Your Orders
          </button>
          <button
            onClick={() => {
              navigate('/');
              setCheckoutStep('cart');
            }}
            className="w-full py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-gray-50 transition-colors duration-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  switch (checkoutStep) {
    case 'details':
      return renderDetailsForm();
    case 'payment':
      return renderPaymentForm();
    case 'complete':
      return renderOrderComplete();
    default:
      return renderCart();
  }
};

export default Cart;