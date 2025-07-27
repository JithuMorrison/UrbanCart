import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiTrash2, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [user] = useState(() => localStorage.getItem("userId"));
  const [username] = useState(() => localStorage.getItem("username"));
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const calculatePriceAfterDiscount = (price, discount) => {
    return (price * (1 - discount / 100)).toFixed(2);
  };

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

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.priceAfterDiscount) * item.quantitybuy), 0).toFixed(2);
  };

  const calculateSubtotal = (item) => {
    return (parseFloat(item.priceAfterDiscount) * item.quantitybuy).toFixed(2);
  };

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
      // Changed from PATCH to POST
      const response = await fetch(`http://localhost:3000/user/${user}/cart`, {
        method: 'POST',  // Changed from PATCH to POST
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update',  // Added action parameter
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

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const invalidItems = cart.filter(item => item.quantitybuy > item.quantity);
    if (invalidItems.length > 0) {
      alert(`Some items in your cart exceed available stock. Please adjust quantities before checkout.`);
      return;
    }

    setIsCheckingOut(true);
    
    try {
      const order = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantityOrdered: item.quantitybuy,
        price: parseFloat(item.priceAfterDiscount),
        image: item.image,
      }));

      const response = await fetch(`http://localhost:3000/user/${user}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: order,
          status: 'placed',
          orderDate: new Date().toISOString()
        }),
      });

      if (response.ok) {
        await fetch(`http://localhost:3000/user/${user}/cart/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        localStorage.removeItem('cart');
        setCart([]);
        setOrderSuccess(true);
        setTimeout(() => setOrderSuccess(false), 3000);
      } else {
        const data = await response.json();
        alert(data.message || 'Error placing order. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('There was an error processing your order');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been confirmed.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition-colors duration-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

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

  return (
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
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row">
                  <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
                    <img 
                      src={item.images[0] || 'https://via.placeholder.com/150'} 
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
                      <span className="font-bold">${calculateSubtotal(item)}</span>
                    </div>
                  </div>
                </div>
              ))}
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
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className={`w-full py-3 rounded-lg text-white font-medium transition-colors duration-300 ${isCheckingOut ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
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
};

export default Cart;