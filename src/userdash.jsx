import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiHeart, FiClock, FiCheckCircle, FiTruck } from 'react-icons/fi';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'processing': return <FiClock className="text-blue-500" />;
      case 'shipped': return <FiTruck className="text-purple-500" />;
      case 'delivered': return <FiCheckCircle className="text-green-500" />;
      default: return <FiShoppingBag />;
    }
  };

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
              
              {userData.orders?.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Recent Orders</h2>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View all
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {userData.orders.slice(0, 3).map(order => (
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
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
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
                      {userData.orders.map(order => (
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
                            <div className="flex space-x-2">
                              <Link 
                                to={`/orders/${order._id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </Link>
                              {order.status === 'pending' && (
                                <button className="text-red-600 hover:text-red-800">
                                  Cancel
                                </button>
                              )}
                              {order.status === 'delivered' && (
                                <button className="text-green-600 hover:text-green-800">
                                  Reorder
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          
          {/* Other tabs would be implemented similarly */}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;