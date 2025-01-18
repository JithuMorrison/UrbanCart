import React, { useState, useEffect } from "react";

const UserDashboard = () => {
  const [userData, setUserData] = useState({ name: "John Doe", email: "john.doe@example.com", address: "123 Main St, Springfield", password: "password123" });

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
        const response = await fetch("http://localhost:3000/products"); // Adjust to your backend URL
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();
      setProducts([...products, data]); // Add the new product to the list of products
      setNewProduct({
        productName: "",
        quantity: 0,
        price: 0,
        discount: 0,
      }); // Reset product form
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  // Handle form input changes for profile update
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
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
            {orders.map((order) => (
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

        {/* Add New Product Form */}
        <h3 className="text-lg font-semibold mt-4">Add New Product</h3>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <input
            type="text"
            name="productName"
            value={newProduct.productName}
            onChange={handleNewProductChange}
            placeholder="Product Name"
            className="border p-2 w-full rounded"
          />
          <input
            type="number"
            name="quantity"
            value={newProduct.quantity}
            onChange={handleNewProductChange}
            placeholder="Quantity"
            className="border p-2 w-full rounded"
          />
          <input
            type="number"
            name="price"
            value={newProduct.price}
            onChange={handleNewProductChange}
            placeholder="Price"
            className="border p-2 w-full rounded"
          />
          <input
            type="number"
            name="discount"
            value={newProduct.discount}
            onChange={handleNewProductChange}
            placeholder="Discount"
            className="border p-2 w-full rounded"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Product
          </button>
        </form>
      </section>
    </div>
  );
};

export default UserDashboard;
