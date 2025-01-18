import React, { useState } from 'react';

// Dummy data for products
const initialProducts = [
  { id: 1, name: 'Product 1', price: 100, quantity: 10, discount: 10 },
  { id: 2, name: 'Product 2', price: 200, quantity: 5, discount: 15 },
  { id: 3, name: 'Product 3', price: 150, quantity: 20, discount: 5 },
];

const AdminDashboard = () => {
  const [products, setProducts] = useState(initialProducts);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', discount: '' });
  
  // Add a new product
  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
      id: products.length + 1,
      name: formData.name,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      discount: parseInt(formData.discount),
    };
    setProducts([...products, newProduct]);
    setFormData({ name: '', price: '', quantity: '', discount: '' });
  };

  // Update product details
  const handleUpdate = (id, field, value) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      {/* Add Product Form */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Add New Product</h2>
        <input
          type="text"
          placeholder="Product Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="border p-2 mb-2 w-full rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="border p-2 mb-2 w-full rounded"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          className="border p-2 mb-2 w-full rounded"
        />
        <input
          type="number"
          placeholder="Discount"
          value={formData.discount}
          onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
          className="border p-2 mb-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Product</button>
      </form>

      {/* Product Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Discount</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{product.name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => handleUpdate(product.id, 'price', e.target.value)}
                    className="border p-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => handleUpdate(product.id, 'quantity', e.target.value)}
                    className="border p-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={product.discount}
                    onChange={(e) => handleUpdate(product.id, 'discount', e.target.value)}
                    className="border p-1 rounded"
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => alert(`Editing ${product.name}`)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
