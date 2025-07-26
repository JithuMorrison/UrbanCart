import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:3000/order/${orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusStep = (status) => {
    const statusSteps = [
      { id: 'pending', label: 'Order Placed', icon: <FiClock /> },
      { id: 'processing', label: 'Processing', icon: <FiPackage /> },
      { id: 'shipped', label: 'Shipped', icon: <FiTruck /> },
      { id: 'delivered', label: 'Delivered', icon: <FiCheckCircle /> }
    ];
    
    const currentIndex = statusSteps.findIndex(step => step.id === status);
    return statusSteps.map((step, index) => ({
      ...step,
      active: index <= currentIndex,
      completed: index < currentIndex
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Error Loading Order</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Order Tracking</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Order #{order._id.slice(-8)}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium mb-2 flex items-center">
            <FiMapPin className="mr-2" /> Shipping Address
          </h3>
          <p>{order.shippingAddress.street}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
        </div>
        
        {order.trackingNumber && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Tracking Information</h3>
            <p className="mb-1">Carrier: {order.carrier}</p>
            <p>Tracking Number: {order.trackingNumber}</p>
          </div>
        )}
        
        <div className="relative">
          <div className="absolute left-4 h-full w-0.5 bg-gray-200"></div>
          
          {getStatusStep(order.status).map((step, index) => (
            <div key={step.id} className="relative pl-12 pb-8 last:pb-0">
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                step.completed ? 'bg-green-500 text-white' :
                step.active ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                {step.icon}
              </div>
              <h4 className={`font-medium ${
                step.active ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {step.label}
              </h4>
              {step.active && (
                <p className="text-sm text-gray-500 mt-1">
                  {order.statusHistory.find(s => s.status === step.id)?.changedAt && 
                    new Date(order.statusHistory.find(s => s.status === step.id).changedAt).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        
        <div className="divide-y">
          {order.items.map(item => (
            <div key={item.productId} className="py-4 flex">
              <img 
                src={item.image || 'https://via.placeholder.com/100'} 
                alt={item.productName} 
                className="w-20 h-20 object-cover rounded"
              />
              <div className="ml-4 flex-1">
                <h3 className="font-medium">{item.productName}</h3>
                <p className="text-gray-600">Qty: {item.quantityOrdered}</p>
              </div>
              <div className="font-medium">
                ${(item.price * item.quantityOrdered).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping:</span>
            <span>${order.shippingFee.toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between mb-2 text-green-600">
              <span>Discount:</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;