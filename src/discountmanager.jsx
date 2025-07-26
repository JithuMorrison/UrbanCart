import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiClock, FiCheckCircle, FiDollarSign } from 'react-icons/fi';

const DiscountManager = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    minOrder: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: 100,
    applicableCategories: [],
    userGroups: [],
    isActive: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('http://localhost:3000/admin/discounts', {
        headers: { 'x-admin-auth': 'your-admin-secret' }
      });
      const data = await response.json();
      setDiscounts(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching discounts:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = currentDiscount ? 'PUT' : 'POST';
      const url = currentDiscount 
        ? `http://localhost:3000/admin/discounts/${currentDiscount._id}`
        : 'http://localhost:3000/admin/discounts';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-auth': 'your-admin-secret'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      fetchDiscounts();
      resetForm();
    } catch (err) {
      console.error('Error saving discount:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 10,
      minOrder: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxUses: 100,
      applicableCategories: [],
      userGroups: [],
      isActive: true
    });
    setCurrentDiscount(null);
    setShowForm(false);
  };

  const editDiscount = (discount) => {
    setCurrentDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minOrder: discount.minOrder || 0,
      validFrom: new Date(discount.validFrom).toISOString().split('T')[0],
      validUntil: new Date(discount.validUntil).toISOString().split('T')[0],
      maxUses: discount.maxUses,
      applicableCategories: discount.applicableCategories || [],
      userGroups: discount.userGroups || [],
      isActive: discount.isActive
    });
    setShowForm(true);
  };

  const deleteDiscount = async (id) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await fetch(`http://localhost:3000/admin/discounts/${id}`, {
          method: 'DELETE',
          headers: { 'x-admin-auth': 'your-admin-secret' }
        });
        fetchDiscounts();
      } catch (err) {
        console.error('Error deleting discount:', err);
      }
    }
  };

  const getStatusBadge = (discount) => {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validUntil = new Date(discount.validUntil);
    
    if (!discount.isActive) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Inactive</span>;
    }
    
    if (now < validFrom) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Scheduled</span>;
    }
    
    if (now > validUntil) {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Expired</span>;
    }
    
    if (discount.usedCount >= discount.maxUses) {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Limit Reached</span>;
    }
    
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Discount Management</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <FiPlus className="mr-1" /> Create Discount
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {currentDiscount ? 'Edit Discount' : 'Create New Discount'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="freeShipping">Free Shipping</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'percentage' ? 'Percentage Value' : 'Fixed Amount'}
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  min="0"
                  step={formData.type === 'percentage' ? '1' : '0.01'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount</label>
                <input
                  type="number"
                  name="minOrder"
                  value={formData.minOrder}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Uses</label>
                <input
                  type="number"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Categories</label>
                <input
                  type="text"
                  name="applicableCategories"
                  value={formData.applicableCategories.join(', ')}
                  onChange={(e) => {
                    const categories = e.target.value.split(',').map(cat => cat.trim());
                    setFormData({ ...formData, applicableCategories: categories });
                  }}
                  placeholder="Separate with commas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Groups</label>
                <select
                  name="userGroups"
                  multiple
                  value={formData.userGroups}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, userGroups: options });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new-user">New Users</option>
                  <option value="frequent-buyer">Frequent Buyers</option>
                  <option value="vip">VIP Customers</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {currentDiscount ? 'Update Discount' : 'Create Discount'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading discounts...</div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-8">
          <FiDollarSign className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No discounts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discounts.map(discount => (
                  <tr key={discount._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{discount.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.type === 'percentage' ? 'Percentage' : 
                       discount.type === 'fixed' ? 'Fixed Amount' : 'Free Shipping'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiClock className="mr-1 text-gray-400" />
                        {new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validUntil).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.usedCount} / {discount.maxUses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(discount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editDiscount(discount)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteDiscount(discount._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManager;