import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag, FiClock, FiCheckCircle, FiTruck, FiXCircle } from 'react-icons/fi';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/user/${userId}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
        
        // If specific order ID in URL, fetch its details
        if (orderId) {
          const orderResponse = await fetch(`http://localhost:3000/user/${userId}/order/${orderId}`);
          if (!orderResponse.ok) throw new Error('Failed to fetch order details');
          const orderData = await orderResponse.json();
          setOrderDetails(orderData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchOrders();
  }, [userId, orderId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'processing': return <FiClock className="text-blue-500" />;
      case 'shipped': return <FiTruck className="text-purple-500" />;
      case 'delivered': return <FiCheckCircle className="text-green-500" />;
      case 'cancelled': return <FiXCircle className="text-red-500" />;
      default: return <FiShoppingBag />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
          >
            <FiArrowLeft className="mr-1" /> Back to Orders
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Order #{orderDetails._id.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center">
                {getStatusIcon(orderDetails.status)}
                <span className="ml-2 capitalize">{orderDetails.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Shipping Address</h3>
                <p className="text-gray-600">
                  {orderDetails.shippingAddress?.street}<br />
                  {orderDetails.shippingAddress?.city}, {orderDetails.shippingAddress?.state}<br />
                  {orderDetails.shippingAddress?.zipCode}<br />
                  {orderDetails.shippingAddress?.country}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Payment Method</h3>
                <p className="text-gray-600 capitalize">{orderDetails.paymentMethod}</p>
                <p className="text-gray-600 mt-2">
                  Status: <span className="text-green-600">Paid</span>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Order Summary</h3>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>${orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span>${orderDetails.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span>-${orderDetails.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderDetails.items.map((item) => (
                <div key={item.productId} className="flex items-start border-b border-gray-100 pb-4">
                  <img 
                    src={item.image || 'https://via.placeholder.com/150'} 
                    alt={item.productName} 
                    className="w-20 h-20 object-cover rounded-lg mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.productName}</h3>
                    <p className="text-gray-600">Quantity: {item.quantityOrdered}</p>
                    <p className="text-gray-600">Price: ${item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${(item.price * item.quantityOrdered).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {orderDetails.status === 'pending' && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `http://localhost:3000/user/${userId}/order/${orderDetails._id}/cancel`,
                        { method: 'POST' }
                      );
                      if (response.ok) {
                        const updatedOrder = await response.json();
                        setOrderDetails(updatedOrder);
                      }
                    } catch (error) {
                      console.error('Error cancelling order:', error);
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Orders</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiShoppingBag className="text-gray-300 text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-2 capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-gray-600">
                      Total: ${order.total.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/orders/${order._id}`);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPage;