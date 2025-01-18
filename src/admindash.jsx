import React, { useState, useEffect } from 'react';

// Dummy data for products
const initialProducts = [
  { id: 1, name: 'Product 1', price: 100, quantity: 10, discount: 10 },
  { id: 2, name: 'Product 2', price: 200, quantity: 5, discount: 15 },
  { id: 3, name: 'Product 3', price: 150, quantity: 20, discount: 5 },
];

const AdminDashboard = () => {
  const [userData, setUserData] = useState({ name: "John Doe", email: "john.doe@example.com", address: "123 Main St, Springfield", password: "password123" });
  const [formData, setFormData] = useState({name: "", email: "", address: "", password: "", });

  const [products, setProducts] = useState(initialProducts);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, quantity: 0, discount: 0 });

  useEffect(() => {
      const fetchProducts = async () => {
        try {
          const response = await fetch("http://localhost:3000/products");
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

  // Update product details
  const handleUpdate = (id, field, value) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  };

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
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

export default AdminDashboard;
