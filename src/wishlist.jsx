import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiX } from 'react-icons/fi';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch(`http://localhost:3000/user/${userId}`);
        const data = await response.json();
        setWishlist(data.wishlist);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setLoading(false);
      }
    };

    if (userId) fetchWishlist();
  }, [userId]);

  const removeFromWishlist = async (productId) => {
    try {
      await fetch(`http://localhost:3000/user/${userId}/wishlist/${productId}`, {
        method: 'DELETE'
      });
      setWishlist(wishlist.filter(item => item._id !== productId));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const addToCart = async (productId) => {
    try {
      await fetch(`http://localhost:3000/user/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      // Show success message
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Your Wishlist</h2>
        <p className="mb-4">Please login to view your wishlist</p>
        <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <FiHeart className="mx-auto text-4xl text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Wishlist is Empty</h2>
        <p className="mb-4">Save items you love for later</p>
        <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Wishlist</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlist.map(product => (
          <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
            <button 
              onClick={() => removeFromWishlist(product._id)}
              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
            >
              <FiX className="text-red-500" />
            </button>
            <img 
              src={product.images?.[0] || 'https://via.placeholder.com/300'} 
              alt={product.productName} 
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{product.productName}</h3>
              <p className="text-gray-600 mb-2">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold">${product.price.toFixed(2)}</span>
                <button 
                  onClick={() => addToCart(product._id)}
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  <FiShoppingCart />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;