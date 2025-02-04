import React, { useState, useEffect } from 'react';
import 'font-awesome/css/font-awesome.min.css';

function Header() {
  const [user,setUser] = useState(() => {
    const useer = localStorage.getItem("userId");
    return useer;
  });
  
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-2xl font-bold flex items-center space-x-2">
        <i className="fa fa-shopping-cart text-yellow-500"></i>
        <span>TrendyShop</span>
      </div>
      <ul className="flex space-x-6">
        <li><a href="/#home" className="hover:text-gray-300">Home</a></li>
        <li><a href="/#shop" className="hover:text-gray-300">Shop</a></li>
        <li><a href="/#about" className="hover:text-gray-300">About</a></li>
        <li><a href="/#contact" className="hover:text-gray-300">Contact</a></li>
        <li><a href="/cart" className="hover:text-gray-300 items-center space-x-2">
          <i className="fa fa-shopping-cart"></i>
        </a></li>
        <li className='bg-white w-[30px] h-[30px] rounded-full -mt-1'><a href={user ? "/userdash" : "/login"} className="text-gray-500 hover:text-gray-300 items-center space-x-2">
          <i className="fa fa-user mt-1"></i>
        </a></li>
      </ul>
    </nav>
  );
}

export default Header;