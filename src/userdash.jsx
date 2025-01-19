import React, { useState, useEffect } from "react";

const UserDashboard = () => {
  const [userData, setUserData] = useState({ name: "Imposter", email: "foundyou@gmail.com" });
  const [user,setUser] = useState(() => {
      const useer = localStorage.getItem("userId");
      return useer;
    });
  const [formData, setFormData] = useState({name: "", email: "", address: "", password: "", });

  const [products, setProducts] = useState([]); // State for storing products
  const [newProduct, setNewProduct] = useState({
    productName: "",
    quantity: 0,
    price: 0,
    discount: 0,
  });

  const [orders,setOrders] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/products");
        const userresp = await fetch('http://localhost:3000/users_id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: user,
          }),
        });
        const data = await response.json();
        const usdata = await userresp.json();
        setProducts(data);
        setUserData(usdata);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Handle form input changes for profile update
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit profile update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setUserData(formData);
    setFormData({ name: "", email: "", address: "", password: "" }); // Reset form
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>

      {/* Profile Section */}
      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="mb-4">
          <p><strong>Name:</strong> {userData.username}</p>
          <p><strong>Email:</strong> {userData.email}</p>
        </div>

        <h3 className="text-lg font-semibold mb-2">Update Profile</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter new name"
            className="border p-2 w-full rounded"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter new email"
            className="border p-2 w-full rounded"
          />
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter new address"
            className="border p-2 w-full rounded"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter new password"
            className="border p-2 w-full rounded"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Update Profile
          </button>
        </form>
      </section>

      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
        <div className="mb-6 p-4 border border-gray-300 rounded-lg w-[350px]">
          {userData.orders && userData.orders.length > 0 ? (
            userData.orders.map((order,index) => (
              <div>
                <div className="flex justify-between items-center">
                  <div className="flex-1 text-center ml-16">{"Order " + (index + 1).toString()}</div>
                  <div className="text-right">{new Date(order.orderDate).toLocaleDateString()}</div>
                </div>
                <table key={order._id} className="min-w-full">
                  <thead>
                    <tr>
                      <th className="p-2">Product Name</th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2">{item.quantityOrdered}</td>
                        <td className="p-2">${item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>No orders found.</p>
          )}
        </div>
      </section>
      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Discount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{product.productName}</td>
                <td className="p-2">{product.quantity}</td>
                <td className="p-2">${product.price}</td>
                <td className="p-2">{product.discount}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default UserDashboard;
