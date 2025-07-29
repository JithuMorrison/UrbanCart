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
  FiEdit,
  FiCreditCard,
  FiCalendar,
  FiHash
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

  // Define valid status transitions
  const statusFlow = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

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

      if (response) {
        setOrder(response);
        setStatusUpdate({ status: '', note: '' });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
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

      {/* Order Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Order #{order._id.slice(-6).toUpperCase()}
            </h1>
            <div className="flex items-center mt-2">
              <FiCalendar className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">
                {new Date(order.orderDate).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            {getStatusIcon(order.status)}
            <span className="ml-2 capitalize font-medium text-lg">{order.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex border-b pb-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {item.productId?.images?.[0] ? (
                      <img 
                        src={item.productId.images[0]} 
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiPackage size={24} />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    {console.log(item)}
                    <div className="flex justify-between">
                      <h3 className="font-medium">{item.productName || 'Product'}</h3>
                      <span className="font-medium">
                        ${(item.price * item.quantityOrdered).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">SKU: {item.productId?.sku || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantityOrdered}</p>
                    <p className="text-sm">
                      ${item.price?.toFixed(2)} × {item.quantityOrdered}
                    </p>
                    {item.variants && (
                      <div className="mt-1 text-sm text-gray-600">
                        {Object.entries(item.variants).map(([key, value]) => (
                          <div key={key}>{key}: {value}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${order.shippingFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.tax?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>${order.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Status History</h2>
            
            {order.statusHistory?.length > 0 ? (
              <div className="space-y-4">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(history.status)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <p className="font-medium capitalize">{history.status}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(history.timestamp || new Date()).toLocaleString()}
                        </p>
                      </div>
                      {history.note && (
                        <p className="text-sm mt-1 text-gray-600 bg-gray-50 p-2 rounded">
                          {history.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                No status history available
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Order Meta */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiUser className="mr-2" /> Customer Information
            </h2>
            
            <div className="space-y-3">
              <div>
                <p className="font-medium">{order.userId?.username || 'Guest'}</p>
                <p className="flex items-center text-sm text-gray-600">
                  <FiMail className="mr-2" /> {order.userId?.email || 'No email'}
                </p>
              </div>
              
              {order.userId?.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <FiPhone className="mr-2" /> {order.userId.phone}
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          {order.shippingAddress && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <FiTruck className="mr-2" /> Shipping Information
              </h2>
              
              <div className="space-y-2">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.street}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.country}
                </p>
                {order.shippingAddress.phone && (
                  <p className="text-sm text-gray-600">
                    Phone: {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FiCreditCard className="mr-2" /> Payment Information
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm">trx_{order._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Order Actions</h2>
            
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select new status</option>
                  {statusFlow[order.status]?.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={statusUpdate.note}
                  onChange={(e) => setStatusUpdate({...statusUpdate, note: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Add internal notes or customer message..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isUpdating || !statusUpdate.status}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  isUpdating || !statusUpdate.status ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isUpdating ? 'Updating...' : 'Update Order Status'}
              </button>
            </form>

            {/* Tracking Info (if shipped) */}
            {order.status === 'shipped' && order.trackingNumber && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium mb-2">Tracking Information</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Number:</span>
                    <span className="font-mono">{order.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-600">Carrier:</span>
                    <span>{order.carrier}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;