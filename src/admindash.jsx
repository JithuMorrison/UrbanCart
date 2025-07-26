import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiUsers, FiPieChart, FiTag, FiSettings, FiHome } from 'react-icons/fi';

const AdminDashboard = () => {
  const location = useLocation();

  const getActiveClass = (path) => {
    return location.pathname.includes(path) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50';
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
            to="/admin/dashboard/discounts"
            className={`flex items-center space-x-3 p-3 rounded-lg ${getActiveClass('/discounts')}`}
          >
            <FiTag />
            <span>Discounts</span>
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
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;