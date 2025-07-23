import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiLogOut, FiEdit, FiCalendar, FiDollarSign, FiPackage } from 'react-icons/fi';

const UserDashboard = () => {
  const [userData, setUserData] = useState({ 
    username: "Loading...", 
    email: "Loading...",
    orders: []
  });
  
  const [user] = useState(() => localStorage.getItem("userId"));
  const [formData, setFormData] = useState({
    name: "", 
    email: "", 
    address: "", 
    password: ""
  });
  
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, userResponse] = await Promise.all([
          fetch("http://localhost:3000/products"),
          fetch('http://localhost:3000/users_id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user }),
          })
        ]);
        
        const productsData = await productsResponse.json();
        const userData = await userResponse.json();
        
        setProducts(productsData);
        setUserData(userData);
        // Pre-fill form with current user data
        setFormData({
          name: userData.username || "",
          email: userData.email || "",
          address: userData.address || "",
          password: ""
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      // Here you would typically send the update to your backend
      // For now, we'll just update the local state
      setUserData({
        ...userData,
        username: formData.name,
        email: formData.email,
        address: formData.address
      });
      setIsEditing(false);
      // Show success message
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar and Main Content Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-indigo-700 text-white min-h-screen p-4 hidden md:block">
          <div className="flex items-center space-x-3 p-4 border-b border-indigo-600">
            <div className="bg-indigo-500 p-2 rounded-full">
              <FiUser className="text-xl" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{userData.username}</h1>
              <p className="text-xs text-indigo-200">{userData.email}</p>
            </div>
          </div>
          
          <nav className="mt-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === 'profile' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
            >
              <FiUser />
              <span>Profile</span>
            </button>
            
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === 'orders' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
            >
              <FiShoppingBag />
              <span>My Orders</span>
              {userData.orders?.length > 0 && (
                <span className="ml-auto bg-white text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                  {userData.orders.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === 'products' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
            >
              <FiPackage />
              <span>Products</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-indigo-600 mt-4"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8">
          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold">User Dashboard</h1>
            <button 
              onClick={handleLogout}
              className="text-red-500 flex items-center"
            >
              <FiLogOut className="mr-1" /> Logout
            </button>
          </div>
          
          {/* Mobile Tabs */}
          <div className="md:hidden flex overflow-x-auto mb-6 pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 mr-2 rounded-full whitespace-nowrap ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 mr-2 rounded-full whitespace-nowrap ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === 'products' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Products
            </button>
          </div>

          {/* Profile Section */}
          {activeTab === 'profile' && (
            <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Profile Information</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <FiEdit className="mr-1" /> Edit Profile
                  </button>
                )}
              </div>
              
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <FiUser className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{userData.username}</h3>
                      <p className="text-gray-600">{userData.email}</p>
                      {userData.address && <p className="text-gray-600 mt-1">{userData.address}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Leave blank to keep current password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Orders Section */}
          {activeTab === 'orders' && (
            <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">My Orders</h2>
              
              {userData.orders && userData.orders.length > 0 ? (
                <div className="space-y-6">
                  {userData.orders.map((order, index) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-indigo-600" />
                          <span className="font-medium">
                            Order #{index + 1} • {new Date(order.orderDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Completed
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {order.order.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.quantityOrdered}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${(item.price * item.quantityOrdered).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Subtotal: ${order.order.reduce((sum, item) => sum + (item.price * item.quantityOrdered), 0).toFixed(2)}</p>
                          <p className="font-semibold text-lg">Order Total: ${order.order.reduce((sum, item) => sum + (item.price * item.quantityOrdered), 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiShoppingBag className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">You haven't placed any orders yet</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Products Section */}
          {activeTab === 'products' && (
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Available Products</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={product.image || 'https://via.placeholder.com/100?text=No+Image'} 
                                alt={product.productName}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                              <div className="text-sm text-gray-500">{product.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity < 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {product.quantity} in stock
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiDollarSign className="text-gray-400" />
                            {product.price.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.discount > 0 ? (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                              {product.discount}% OFF
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;