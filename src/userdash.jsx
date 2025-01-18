import React, { useState } from "react";

// Dummy data
const orderHistory = [
  { id: 1, productName: "Product 1", quantity: 2, total: 200, date: "2025-01-01" },
  { id: 2, productName: "Product 2", quantity: 1, total: 100, date: "2025-01-10" },
  { id: 3, productName: "Product 3", quantity: 3, total: 450, date: "2025-01-15" },
];

const UserDashboard = () => {
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    address: "123 Main St, Springfield",
    password: "password123",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
  });

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
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Address:</strong> {userData.address}</p>
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

      {/* Order History Section */}
      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{order.productName}</td>
                <td className="p-2">{order.quantity}</td>
                <td className="p-2">${order.total}</td>
                <td className="p-2">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default UserDashboard;
