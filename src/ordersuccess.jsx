// OrderSuccess.js
import { FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 px-4 text-center">
      <FiCheckCircle className="text-green-600 text-6xl mb-4" />
      <h2 className="text-2xl font-bold text-green-800 mb-2">
        Order Placed Successfully!
      </h2>
      <p className="text-gray-700 mb-6">
        Your order has been confirmed. You'll receive an email with the details.
      </p>
      <button
        onClick={() => navigate('/orders')}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-300"
      >
        View Your Orders
      </button>
    </div>
  );
};

export default OrderSuccess;