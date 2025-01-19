import React, { useState, useEffect } from 'react';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [user,setUser] = useState(() => {
    const useer = localStorage.getItem("userId");
    return useer;
  }
  );

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(storedCart);
  }, []);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.priceAfterDiscount * item.quantity, 0).toFixed(2);
  };

  const removeFromCart = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleOrder = () => {
    alert(user);
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Your Cart</h1>

      {cart.length > 0 ? (
        <div className="space-y-6">
          {cart.map((item) => (
            <div key={item.id} className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className='flex'>
                    <img src={item.image} className='h-10 cover'></img>
                    <div className='ml-2'>
                        <h2 className="text-xl font-bold">{item.name}</h2>
                        <p>Quantity: {item.quantity}</p>
                    </div>
                </div>
                <p>Price (after discount): ${item.priceAfterDiscount}</p>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white px-4 py-2 rounded-md" >
                Remove
              </button>
            </div>
          ))}

          <div className="text-right">
            <h3 className="text-xl font-bold">Total: ${calculateTotal()}</h3>
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={handleOrder}>Order</button>
        </div>
      ) : (
        <h2 className="text-center text-xl font-semibold">Your cart is empty.</h2>
      )}
    </div>
  );
};

export default Cart;
