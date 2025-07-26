import React, { useState } from 'react';
import { FiSave, FiMail, FiLock, FiGlobe } from 'react-icons/fi';

const AdminSettings = () => {
  const [formData, setFormData] = useState({
    storeName: 'TrendyShop',
    storeEmail: 'contact@trendyshop.com',
    storeCurrency: 'USD',
    maintenanceMode: false,
    emailNotifications: true,
    lowStockThreshold: 10
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would save these settings to your backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Store Settings</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="storeEmail"
                value={formData.storeEmail}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <div className="relative">
              <FiGlobe className="absolute left-3 top-3 text-gray-400" />
              <select
                name="storeCurrency"
                value={formData.storeCurrency}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="JPY">Japanese Yen (¥)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
            <input
              type="number"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={formData.maintenanceMode}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Email Notifications</label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiSave className="mr-2" />
            Save Settings
          </button>
        </div>
      </form>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Danger Zone</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h3 className="font-medium">Reset All Data</h3>
              <p className="text-sm text-gray-600">This will delete all products, orders, and user data.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Reset Data
            </button>
          </div>
          
          <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-gray-600">Export all store data as JSON.</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;