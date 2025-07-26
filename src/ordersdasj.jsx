import React, { useState, useEffect } from 'react';
import { FiPackage, FiTruck, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const OrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrders = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3000/admin/orders?status=${filter === 'all' ? '' : filter}`, {
          headers: { 'x-admin-auth': 'your-admin-secret' }
        }),
        fetch('http://localhost:3000/admin/orders/stats', {
          headers: { 'x-admin-auth': 'your-admin-secret' }
        })
      ]);
      
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      
      setOrders(ordersData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [filter, autoRefresh]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await fetch(`http://localhost:3000/admin/order/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-auth': 'your-admin-secret'
        },
        body: JSON.stringify({ status, note: 'Status updated by admin' })
      });
      
      fetchOrders(); // Refresh data
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const markAsViewed = async (orderId) => {
    try {
      await fetch(`http://localhost:3000/admin/order/${orderId}/viewed`, {
        method: 'PUT',
        headers: { 'x-admin-auth': 'your-admin-secret' }
      });
      
      fetchOrders(); // Refresh data
    } catch (err) {
      console.error('Error marking order as viewed:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FiAlertCircle className="text-yellow-500" />;
      case 'processing': return <FiRefreshCw className="text-blue-500" />;
      case 'shipped': return <FiTruck className="text-purple-500" />;
      case 'delivered': return <FiCheckCircle className="text-green-500" />;
      default: return <FiPackage />;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="mr-2"
            />
            Auto Refresh (30s)
          </label>
          <button 
            onClick={fetchOrders}
            className="flex items-center bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
          >
            <FiRefreshCw className="mr-1" /> Refresh
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">New Orders</p>
              <h3 className="text-2xl font-bold">{stats.pending || 0}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiAlertCircle className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Processing</p>
              <h3 className="text-2xl font-bold">{stats.processing || 0}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiRefreshCw className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Shipped</p>
              <h3 className="text-2xl font-bold">{stats.shipped || 0}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiTruck className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          All Orders
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white'}`}
        >
          Pending
        </button>
        <button 
          onClick={() => setFilter('processing')}
          className={`px-4 py-2 rounded-full ${filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Processing
        </button>
        <button 
          onClick={() => setFilter('shipped')}
          className={`px-4 py-2 rounded-full ${filter === 'shipped' ? 'bg-purple-600 text-white' : 'bg-white'}`}
        >
          Shipped
        </button>
        <button 
          onClick={() => setFilter('delivered')}
          className={`px-4 py-2 rounded-full ${filter === 'delivered' ? 'bg-green-600 text-white' : 'bg-white'}`}
        >
          Delivered
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <FiPackage className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map(order => (
                  <tr 
                    key={order._id} 
                    className={`${!order.isViewedByAdmin ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {!order.isViewedByAdmin && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                        )}
                        <span className="font-medium">#{order._id.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.userId?.username || 'Guest'}</div>
                      <div className="text-sm text-gray-500">{order.userId?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-2">{getStatusBadge(order.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {!order.isViewedByAdmin && (
                          <button
                            onClick={() => markAsViewed(order._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Mark as Viewed
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'processing')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Process
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'shipped')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Ship
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'delivered')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Deliver
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900">
                          Details
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

export default OrdersDashboard;