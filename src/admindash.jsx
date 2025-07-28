import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { FiShoppingBag, FiUsers, FiPieChart, FiTag, FiSettings, FiHome, FiLogOut } from 'react-icons/fi';
import { AiFillContacts } from 'react-icons/ai';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication fetch function
  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token'); // If using token-based auth
    const userId = localStorage.getItem('userId');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  };

  // Verify admin status
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const getActiveClass = (path) => {
    return location.pathname.includes(path) 
      ? 'bg-blue-50 text-blue-600' 
      : 'hover:bg-gray-50';
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center space-x-2 p-4 mb-6">
          <FiHome className="text-blue-600 text-xl" />
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        
        <nav className="space-y-1">
          <Link
            to="/admin/dashboard"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/dashboard')}`}
          >
            <FiHome />
            <span>Overview</span>
          </Link>
          
          <Link
            to="/admin/dashboard/orders"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/orders')}`}
          >
            <FiShoppingBag />
            <span>Orders</span>
          </Link>
          
          <Link
            to="/admin/dashboard/products"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/products')}`}
          >
            <FiTag />
            <span>Products</span>
          </Link>
          
          <Link
            to="/admin/dashboard/users"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/users')}`}
          >
            <FiUsers />
            <span>Users</span>
          </Link>
          
          <Link
            to="/admin/dashboard/analytics"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/analytics')}`}
          >
            <FiPieChart />
            <span>Analytics</span>
          </Link>
          
          <Link
            to="/admin/dashboard/settings"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/settings')}`}
          >
            <FiSettings />
            <span>Settings</span>
          </Link>

          <Link
            to="/admin/dashboard/contacts"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/contacts')}`}
          >
            <AiFillContacts />
            <span>Contacts</span>
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 rounded-lg text-red-500 hover:bg-red-50 w-full mt-4"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <Outlet context={{ authFetch }} />
      </div>
    </div>
  );
};

export default AdminDashboard;