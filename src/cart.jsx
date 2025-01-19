import React, { useState, useEffect } from 'react';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [user,setUser] = useState(() => {
    const useer = localStorage.getItem("userId");
    return useer;
  });
  const [username,setUsername] = useState(() => {
    const useer = localStorage.getItem("username");
    return useer;
  });

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

  const handleCheckout = async () => {
    if(user){
        const order = cart.map(item => ({
            productName: item.name,
            quantityOrdered: item.quantity,
            price: item.priceAfterDiscount,
            image: item.image,
          }));
      
        try {
            const response = await fetch(`http://localhost:3000/user/${user}/order`, {
                method: 'PUT',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order: order,
                    status: 'placed'
                }),
            });
    
        const data = await response.json();
    
        if (response.ok) {
            alert('Order placed successfully!');
            localStorage.removeItem('cart');
            setCart([]);
        } else {
            alert('Error placing order:', data.message || 'Please try again');
        }
        } catch (err) {
        console.error('Error:', err);
        alert('There was an error processing your order');
        }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
        <div className="flex justify-between items-center mb-8 ml-32">
            <h1 className="text-3xl font-bold text-center flex-1">Your Cart</h1>
            {username ? <div className="text-left">{username}</div> : <div className="text-left">Login before Order</div>}
        </div>

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
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={handleCheckout}>Order</button>
        </div>
      ) : (
        <h2 className="text-center text-xl font-semibold">Your cart is empty.</h2>
      )}
    </div>
  );
};

export default Cart;
