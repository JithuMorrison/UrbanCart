import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiUser } from 'react-icons/fi';
import Notifications from './notifications';

const Header = () => {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

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
        </nav>
        
        <div className="flex items-center space-x-4">
          {userId && <Notifications />}
          
          <Link to="/cart" className="p-2 rounded-full hover:bg-gray-100 relative">
            <FiShoppingCart className="text-xl" />
            {/* Cart count badge would go here */}
          </Link>
          
          <Link 
            to={userId ? (username === 'admin' ? '/admin/dashboard' : '/user/dashboard') : '/login'} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiUser className="text-xl" />
          </Link>
          
          {userId && (
            <span className="hidden md:inline text-sm font-medium">
              Hi, {username}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;