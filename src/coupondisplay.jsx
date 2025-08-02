import React, { useState, useEffect } from 'react';
import { FiTag, FiClock, FiCheckCircle } from 'react-icons/fi';

const CouponDisplay = ({ userId }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`http://localhost:3000/user/${userId}/coupons`);
        const data = await response.json();
        setCoupons(data);
      } catch (err) {
        console.error('Error fetching coupons:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchCoupons();
  }, [userId]);

  if (loading) return <div>Loading coupons...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <FiTag className="mr-2 text-blue-500" /> Available Coupons
      </h3>
      
      {coupons.length === 0 ? (
        <p className="text-gray-500">No coupons available</p>
      ) : (
        <div className="space-y-3">
          {coupons.map(coupon => (
            <div key={coupon._id} className="border border-dashed border-blue-200 bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-blue-800">{coupon.code}</h4>
                  <p className="text-sm text-gray-600">{coupon.description}</p>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <FiClock className="mr-1" />
                    <span>Valid until {new Date(coupon.validUntil).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : 
                     coupon.type === 'fixed' ? `$${coupon.value} OFF` : 'Free Shipping'}
                  </span>
                  {coupon.minOrder && (
                    <p className="text-xs text-gray-500 mt-1">
                      Min. order ${coupon.minOrder}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CouponDisplay;