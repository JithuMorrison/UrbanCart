import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiClock, 
  FiCheckCircle, 
  FiTruck, 
  FiXCircle,
  FiPackage,
  FiDollarSign,
  FiUser,
  FiMail,
  FiMapPin,
  FiEdit
} from 'react-icons/fi';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const { authFetch } = useOutletContext();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    note: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await authFetch(`http://localhost:3000/admin/orders/${orderId}`);
        
        if (!response.success) {
          throw new Error(response.message);
        }

        setOrder(response.data);
        
        // Mark as viewed by admin if not already
        if (!response.data.isViewedByAdmin) {
          await authFetch(`http://localhost:3000/admin/order/${orderId}/viewed`, {
            method: 'PUT'
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, authFetch]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'processing': return <FiPackage className="text-blue-500" />;
      case 'shipped': return <FiTruck className="text-purple-500" />;
      case 'delivered': return <FiCheckCircle className="text-green-500" />;
      case 'cancelled': return <FiXCircle className="text-red-500" />;
      default: return <FiClock />;
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusUpdate.status) return;

    try {
      setIsUpdating(true);
      const response = await authFetch(
        `http://localhost:3000/admin/order/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(statusUpdate)
        }
      );

      if (response._id) {
        setOrder(response);
        setStatusUpdate({ status: '', note: '' });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg">
      Error: {error}
    </div>
  );

  if (!order) return (
    <div className="p-4 bg-yellow-50 text-yellow-600 rounded-lg">
      Order not found
    </div>
  );

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 hover:text-blue-800"
      >
        <FiArrowLeft className="mr-2" /> Back to Orders
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Order #{order._id.slice(-6).toUpperCase()}
        </h1>
        <div className="flex items-center">
          {getStatusIcon(order.status)}
          <span className="ml-2 capitalize font-medium">{order.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item._id} className="flex border-b pb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                  {item.productId?.images?.[0] ? (
                    <img 
                      src={item.productId.images[0]} 
                      alt={item.productId.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FiPackage size={24} />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-medium">{item.productId?.name || 'Product'}</h3>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  <p className="text-sm font-medium">
                    ${(item.productId?.price || 0).toFixed(2)} × {item.quantity} = 
                    <span className="ml-1">${(item.productId?.price * item.quantity).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Shipping</span>
              <span>${order.shippingFee?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>Tax</span>
              <span>${order.tax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span>${order.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiUser className="mr-2" /> Customer Information
            </h2>
            
            <div className="space-y-2">
              <p className="font-medium">{order.userId?.username || 'Guest'}</p>
              <p className="flex items-center text-sm text-gray-600">
                <FiMail className="mr-2" /> {order.userId?.email || 'No email'}
              </p>
              {order.shippingAddress && (
                <p className="flex items-start text-sm text-gray-600">
                  <FiMapPin className="mr-2 mt-1" />
                  <span>
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                    {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select status</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  value={statusUpdate.note}
                  onChange={(e) => setStatusUpdate({...statusUpdate, note: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Add any notes for the customer..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isUpdating}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Tracking Info */}
          {order.status === 'shipped' && order.trackingNumber && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FiTruck className="mr-2" /> Tracking Information
              </h2>
              
              <div className="space-y-2">
                <p className="font-medium">Tracking Number: {order.trackingNumber}</p>
                <p className="text-sm text-gray-600">Carrier: {order.carrier || 'Standard Shipping'}</p>
                <p className="text-sm text-gray-600">
                  Estimated Delivery: {order.estimatedDelivery || '3-5 business days'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Status History</h2>
        
        <div className="space-y-4">
          {order.statusHistory?.length > 0 ? (
            order.statusHistory.map((history, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(history.status)}
                </div>
                <div className="ml-4">
                  <p className="font-medium capitalize">{history.status}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(history.timestamp || new Date()).toLocaleString()}
                  </p>
                  {history.note && (
                    <p className="text-sm mt-1 text-gray-600">
                      Note: {history.note}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No status history available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;