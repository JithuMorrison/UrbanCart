import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiLogOut, FiLogIn, FiUserPlus, FiHome } from 'react-icons/fi';
import Notifications from './notifications';

const Header = () => {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role'); // Get the user's role
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('token'); // If you're using tokens
    
    // Optional: Clear cart if not synced with backend
    localStorage.removeItem('cart');
    
    // Redirect to home page
    navigate('/');
    window.location.reload(); // Refresh to update the UI
  };

  return (
    <header className="bg-white shadow-sm py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800 flex items-center">
          <FiShoppingCart className="mr-2 text-blue-600" />
          TrendyShop
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
          <Link to="/shop" className="text-gray-600 hover:text-blue-600">Shop</Link>
          <Link to="/categories" className="text-gray-600 hover:text-blue-600">Categories</Link>
          <Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link>
          <Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link>
          {userId && <Link to="/orders" className="text-gray-600 hover:text-blue-600">My Orders</Link>}
        </nav>
        
        <div className="flex items-center space-x-4">
          {userId && <Notifications />}
          
          <Link to="/cart" className="p-2 rounded-full hover:bg-gray-100 relative">
            <FiShoppingCart className="text-xl" />
            {/* Cart count badge would go here */}
          </Link>
          
          {userId ? (
            <>
              <Link 
                to='/user/dashboard'
                className="p-2 rounded-full hover:bg-gray-100"
                title='User Dashboard'
              >
                <FiUser className="text-xl" />
              </Link>

              {role === 'admin' && (
                <Link to="/admin/dashboard" className="p-2 rounded-full hover:bg-gray-100">
                  <FiHome className="text-xl" /> 
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Logout"
              >
                <FiLogOut className="text-xl" />
              </button>
              
              <span className="hidden md:inline text-sm font-medium">
                Hi, {username} {role === 'admin' && '(Admin)'}
              </span>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="p-2 rounded-full hover:bg-gray-100"
                title="Login"
              >
                <FiLogIn className="text-xl" />
              </Link>
              
              <Link 
                to="/register" 
                className="p-2 rounded-full hover:bg-gray-100"
                title="Register"
              >
                <FiUserPlus className="text-xl" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;