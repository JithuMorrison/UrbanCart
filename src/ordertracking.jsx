import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiStar } from 'react-icons/fi';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratingModal, setRatingModal] = useState({
    open: false,
    product: null,
    rating: 0,
    review: '',
    isEditing: false
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3000/user/${userId}/order/${orderId}`);
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

  const handleRateProduct = (product) => {
    const existingReview = product.review;
    setRatingModal({
      open: true,
      product,
      rating: existingReview?.rating || 0,
      review: existingReview?.review || '',
      isEditing: !!existingReview
    });
  };

  const submitRating = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const method = ratingModal.isEditing ? 'PUT' : 'POST';
    
    const response = await fetch(
      `http://localhost:3000/products/${ratingModal.product.productId}/reviews`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          rating: ratingModal.rating,
          review: ratingModal.review,
          orderId: order._id,
          productId: ratingModal.product._id // Make sure this is included in your order item data
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }

    // Refresh order data to show the updated review
    const orderResponse = await fetch(`http://localhost:3000/user/${userId}/order/${orderId}`);
    const orderData = await orderResponse.json();
    setOrder(orderData);

    setRatingModal({
      open: false,
      product: null,
      rating: 0,
      review: '',
      isEditing: false
    });
  } catch (err) {
    alert(err.message);
  }
};

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-2">Error Loading Order</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Order #{order._id.slice(-8)}</h1>
      
      {/* Order Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Order Status</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
            'bg-green-100 text-green-800'
          }`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        
        {/* Status Timeline */}
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
      
      {/* Shipping Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 flex items-center">
              <FiMapPin className="mr-2" /> Shipping Address
            </h3>
            <div className="bg-gray-50 p-4 rounded">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
          
          {order.trackingNumber && (
            <div>
              <h3 className="font-medium mb-2">Tracking Information</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="mb-1"><span className="font-medium">Carrier:</span> {order.carrier}</p>
                <p><span className="font-medium">Tracking #:</span> {order.trackingNumber}</p>
                {order.status === 'shipped' && (
                  <a 
                    href={`https://www.${order.carrier.toLowerCase()}.com/tracking/${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Track Package
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        
        <div className="divide-y">
          {order.items.map(item => (
            <div key={item.productId} className="py-4 flex flex-col md:flex-row">
              <div className="flex-shrink-0">
                <img 
                  src={item.image || 'https://via.placeholder.com/100'} 
                  alt={item.productName} 
                  className="w-20 h-20 object-cover rounded"
                />
              </div>
              <div className="ml-0 md:ml-4 mt-2 md:mt-0 flex-1">
                <h3 className="font-medium">{item.productName}</h3>
                <p className="text-gray-600">Quantity: {item.quantityOrdered}</p>
                <p className="text-gray-600">Price: ${item.price.toFixed(2)} each</p>
                
                {order.status === 'delivered' && (
                  <div className="mt-3">
                    {item.reviewed ? (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center">
                          {renderStars(item.review.rating)}
                          <span className="ml-2 text-sm text-gray-600">
                            Your rating: {item.review.rating}/5
                          </span>
                        </div>
                        {item.review.comment && (
                          <p className="mt-2 text-sm text-gray-700">"{item.review.comment}"</p>
                        )}
                        <button 
                          onClick={() => handleRateProduct(item)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Update your review
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleRateProduct(item)}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Rate this product
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 md:mt-0 font-medium text-right">
                ${(item.price * item.quantityOrdered).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Totals */}
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

      {/* Rating Modal */}
      {ratingModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {ratingModal.isEditing ? 'Update Your Review' : 'Rate This Product'}
            </h3>
            
            <div className="flex items-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingModal({...ratingModal, rating: star})}
                  className={`text-3xl mr-1 ${star <= ratingModal.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                >
                  <FiStar />
                </button>
              ))}
              <span className="ml-2 text-gray-600 text-lg">{ratingModal.rating}/5</span>
            </div>
            
            <textarea
              value={ratingModal.review}
              onChange={(e) => setRatingModal({...ratingModal, review: e.target.value})}
              placeholder="Share your experience with this product..."
              className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="4"
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRatingModal({...ratingModal, open: false})}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={ratingModal.rating === 0}
                className={`px-4 py-2 rounded text-white ${ratingModal.rating === 0 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {ratingModal.isEditing ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;