import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiShoppingBag, 
  FiHeart, 
  FiClock, 
  FiCheckCircle, 
  FiTruck, 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiLock, 
  FiMail, 
  FiPhone, 
  FiMapPin 
} from 'react-icons/fi';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Address Management
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Settings
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/user/${userId}`);
        const data = await response.json();
        setUserData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setLoading(false);
      }
    };

    if (userId) fetchUserData();
    else navigate('/login');
  }, [userId, navigate]);

  // Fetch addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === 'addresses' && userData) {
      setAddresses(userData.addresses || []);
    }
  }, [activeTab, userData]);

  // Set settings when settings tab is active
  useEffect(() => {
    if (activeTab === 'settings' && userData) {
      setSettings({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [activeTab, userData]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'processing': return <FiClock className="text-blue-500" />;
      case 'shipped': return <FiTruck className="text-purple-500" />;
      case 'delivered': return <FiCheckCircle className="text-green-500" />;
      default: return <FiShoppingBag />;
    }
  };

  // Handle address input change
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress({
      ...newAddress,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle settings input change
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };

  const handleReorder = async (order) => {
  try {
    // Add all items from the order to the cart
    await Promise.all(order.items.map(item => 
      fetch('http://localhost:3000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          productId: item.product._id,
          quantity: item.quantity
        })
      })
    ));
    
    // Navigate to cart
    navigate('/cart');
  } catch (err) {
    console.error('Error reordering:', err);
    alert('Failed to reorder items. Please try again.');
  }
};

  // Add new address
  const handleAddAddress = async () => {
    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: [...addresses, newAddress]  // remove _id from here
        }),
      });
      
      const updatedUser = await response.json();
      setAddresses(updatedUser.addresses);
      setNewAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
      });
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  // Update address
  const handleUpdateAddress = async () => {
    try {
      const updatedAddresses = addresses.map(addr => 
        addr._id === editingAddressId ? newAddress : addr
      );
      
      const response = await fetch(`http://localhost:3000/user/${userId}/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: updatedAddresses
        }),
      });
      
      const updatedUser = await response.json();
      setAddresses(updatedUser.addresses);
      setEditingAddressId(null);
      setNewAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
      });
    } catch (err) {
      console.error('Error updating address:', err);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    try {
      const updatedAddresses = addresses.filter(addr => addr._id !== addressId);
      
      const response = await fetch(`http://localhost:3000/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: updatedAddresses
        }),
      });
      
      const updatedUser = await response.json();
      setAddresses(updatedUser.addresses);
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
  if (!window.confirm('Are you sure you want to cancel this order?')) return;
  
  try {
    const response = await fetch(`http://localhost:3000/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });
    
    if (response.ok) {
      // Refresh user data to show updated order status
      const updatedResponse = await fetch(`http://localhost:3000/user/${userId}`);
      const updatedData = await updatedResponse.json();
      setUserData(updatedData);
      alert('Order has been cancelled');
    } else {
      throw new Error('Failed to cancel order');
    }
  } catch (err) {
    console.error('Error cancelling order:', err);
    alert('Failed to cancel order. Please try again.');
  }
};

  // Set default address
  const handleSetDefaultAddress = async (addressId) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      }));
      
      const response = await fetch(`http://localhost:3000/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: updatedAddresses
        }),
      });
      
      const updatedUser = await response.json();
      console.log('Default address set:', updatedUser);
      setAddresses(updatedUser.addresses);
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  // Start editing an address
  const startEditingAddress = (address) => {
    setEditingAddressId(address._id);
    setNewAddress({ ...address });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingAddressId(null);
    setNewAddress({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      isDefault: false
    });
  };

  // Update user settings
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    
    // Validate passwords if changing
    if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      const updateData = {
        firstName: settings.firstName,
        lastName: settings.lastName,
        phone: settings.phone
      };
      
      // Only include password if changing
      if (settings.newPassword) {
        updateData.currentPassword = settings.currentPassword;
        updateData.newPassword = settings.newPassword;
      }
      
      const response = await fetch(`http://localhost:3000/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const updatedUser = await response.json();
      
      // Update local storage if email changed
      if (updatedUser.email !== userData.email) {
        localStorage.setItem('userEmail', updatedUser.email);
      }
      
      // Reset password fields
      setSettings({
        ...settings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      
      alert('Settings updated successfully');
    } catch (err) {
      console.error('Error updating settings:', err);
      setPasswordError('Failed to update settings. Please check your current password.');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading your dashboard...</div>;
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
        <p className="mb-4">Please try again later</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4 h-fit">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-full">
              <FiUser className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="font-bold">{userData.username}</h2>
              <p className="text-sm text-gray-500">{userData.email}</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              My Orders
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === 'wishlist' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              Wishlist
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === 'addresses' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              Addresses
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
            >
              Account Settings
            </button>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Welcome back, {userData.username}!</h2>
                <p>You have {userData.orders?.length || 0} orders in your history.</p>
              </div>
              
              {/* Delivered Orders Section */}
              {userData.orders?.filter(order => order.status === 'delivered').length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recently Delivered</h2>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all orders
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {userData.orders
                      .filter(order => order.status === 'delivered')
                      .slice(0, 3)
                      .map(order => (
                        <div key={order._id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(order.status)}
                              <div>
                                <Link 
                                  to={`/orders/${order._id}`}
                                  className="font-medium hover:text-blue-600"
                                >
                                  Order #{order._id.slice(-8)}
                                </Link>
                                <p className="text-sm text-gray-500">
                                  Delivered on {new Date(order.deliveryDate || order.orderDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.total.toFixed(2)}</p>
                              <button 
                                onClick={() => handleReorder(order)}
                                className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              >
                                Reorder
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Shipped/Processing Orders Section */}
              {userData.orders?.filter(order => 
                order.status === 'shipped' || order.status === 'processing'
              ).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Orders in Progress</h2>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {userData.orders
                      .filter(order => order.status === 'shipped' || order.status === 'processing')
                      .slice(0, 3)
                      .map(order => (
                        <div key={order._id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(order.status)}
                              <div>
                                <Link 
                                  to={`/orders/${order._id}`}
                                  className="font-medium hover:text-blue-600"
                                >
                                  Order #{order._id.slice(-8)}
                                </Link>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.total.toFixed(2)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Pending Orders Section */}
              {userData.orders?.filter(order => order.status === 'pending').length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Pending Orders</h2>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {userData.orders
                      .filter(order => order.status === 'pending')
                      .slice(0, 3)
                      .map(order => (
                        <div key={order._id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(order.status)}
                              <div>
                                <Link 
                                  to={`/orders/${order._id}`}
                                  className="font-medium hover:text-blue-600"
                                >
                                  Order #{order._id.slice(-8)}
                                </Link>
                                <p className="text-sm text-gray-500">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.total.toFixed(2)}</p>
                              <div className="mt-2 flex space-x-2">
                                <button className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200">
                                  Cancel
                                </button>
                                <Link 
                                  to={`/orders/${order._id}`}
                                  className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Rest of the overview content (wishlist, etc.) */}
              {userData.wishlist?.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Your Wishlist</h2>
                    <button 
                      onClick={() => setActiveTab('wishlist')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {userData.wishlist.slice(0, 4).map(product => (
                      <div key={product._id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <img 
                          src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                          alt={product.productName} 
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                        <h3 className="font-medium text-sm truncate">{product.productName}</h3>
                        <p className="text-gray-600 text-sm">${product.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Your Orders</h2>
              
              {userData.orders?.length > 0 ? (
                <div className="space-y-8">
                  {/* Delivered Orders */}
                  {userData.orders.filter(order => order.status === 'delivered').length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <FiCheckCircle className="text-green-500 mr-2" />
                        Delivered Orders
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered On</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userData.orders
                              .filter(order => order.status === 'delivered')
                              .map(order => (
                                <tr key={order._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Link 
                                      to={`/orders/${order._id}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      #{order._id.slice(-8)}
                                    </Link>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.deliveryDate || order.orderDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    ${order.total.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex space-x-2 justify-end">
                                      <button
                                        onClick={() => handleReorder(order)}
                                        className="text-white bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
                                      >
                                        Reorder
                                      </button>
                                      <Link 
                                        to={`/orders/${order._id}`}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-200"
                                      >
                                        View
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Shipped/Processing Orders */}
                  {userData.orders.filter(order => 
                    order.status === 'shipped' || order.status === 'processing'
                  ).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <FiTruck className="text-purple-500 mr-2" />
                        Orders in Progress
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userData.orders
                              .filter(order => order.status === 'shipped' || order.status === 'processing')
                              .map(order => (
                                <tr key={order._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Link 
                                      to={`/orders/${order._id}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      #{order._id.slice(-8)}
                                    </Link>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {getStatusIcon(order.status)}
                                      <span className="ml-2 capitalize">{order.status}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    ${order.total.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex space-x-2 justify-end">
                                      <Link 
                                        to={`/orders/${order._id}`}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-200"
                                      >
                                        View
                                      </Link>
                                      {order.status === 'processing' && (
                                        <button 
                                          onClick={() => handleCancelOrder(order._id)}
                                          className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Pending Orders */}
                  {userData.orders.filter(order => order.status === 'pending').length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <FiClock className="text-yellow-500 mr-2" />
                        Pending Orders
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userData.orders
                              .filter(order => order.status === 'pending')
                              .map(order => (
                                <tr key={order._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Link 
                                      to={`/orders/${order._id}`}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      #{order._id.slice(-8)}
                                    </Link>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.orderDate).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    ${order.total.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex space-x-2 justify-end">
                                      <button
                                        onClick={() => handleCancelOrder(order._id)}
                                        className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                                      >
                                        Cancel Order
                                      </button>
                                      <Link 
                                        to={`/orders/${order._id}`}
                                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-200"
                                      >
                                        Details
                                      </Link>
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
              ) : (
                <div className="text-center py-8">
                  <FiShoppingBag className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">You haven't placed any orders yet</p>
                  <Link 
                    to="/"
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Your Wishlist</h2>
              
              {userData.wishlist?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userData.wishlist.map(product => (
                    <div key={product._id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <img 
                        src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                        alt={product.productName} 
                        className="w-full h-40 object-cover rounded mb-2"
                      />
                      <h3 className="font-medium text-sm truncate">{product.productName}</h3>
                      <p className="text-gray-600 text-sm">${product.price.toFixed(2)}</p>
                      <div className="flex justify-between mt-2">
                        <button className="text-blue-600 text-sm hover:text-blue-800">
                          Add to Cart
                        </button>
                        <button className="text-red-600 text-sm hover:text-red-800">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiHeart className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">Your wishlist is empty</p>
                  <Link 
                    to="/"
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Browse Products
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Your Addresses</h2>
              
              {/* Address List */}
              <div className="space-y-4 mb-6">
                {addresses.length > 0 ? (
                  addresses.map(address => (
                    <div key={address._id} className="border rounded-lg p-4 relative">
                      {address.isDefault && (
                        <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                      <div className="flex items-start">
                        <FiMapPin className="text-gray-500 mt-1 mr-2" />
                        <div>
                          <p className="font-medium">{address.street}</p>
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          <p>{address.country}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-2 space-x-2">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => startEditingAddress(address)}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          <FiEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <FiTrash2 className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">You haven't saved any addresses yet.</p>
                )}
              </div>
              
              {/* Add/Edit Address Form */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={newAddress.street}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={newAddress.state}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={newAddress.zipCode}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={newAddress.country}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="United States"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={newAddress.isDefault}
                      onChange={handleAddressChange}
                      id="defaultAddress"
                      className="mr-2"
                    />
                    <label htmlFor="defaultAddress" className="text-sm text-gray-700">
                      Set as default shipping address
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  {editingAddressId && (
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={!newAddress.street || !newAddress.city || !newAddress.country}
                  >
                    {editingAddressId ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
              
              <form onSubmit={handleUpdateSettings}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={settings.firstName}
                        onChange={handleSettingsChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="lastName"
                        value={settings.lastName}
                        onChange={handleSettingsChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={settings.email}
                        onChange={handleSettingsChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-md bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={settings.phone}
                        onChange={handleSettingsChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-md"
                        placeholder="+1 (123) 456-7890"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="password"
                          name="currentPassword"
                          value={settings.currentPassword}
                          onChange={handleSettingsChange}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="password"
                          name="newPassword"
                          value={settings.newPassword}
                          onChange={handleSettingsChange}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={settings.confirmPassword}
                          onChange={handleSettingsChange}
                          className="w-full pl-10 pr-3 py-2 border rounded-md"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-sm">{passwordError}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;