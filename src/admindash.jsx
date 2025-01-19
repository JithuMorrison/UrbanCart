import React, { useState, useEffect } from 'react';
import 'font-awesome/css/font-awesome.min.css';

const AdminDashboard = () => {
  const [userData, setUserData] = useState({ name: "John Doe", email: "john.doe@example.com", address: "123 Main St, Springfield", password: "password123" });
  const [formData, setFormData] = useState({name: "", email: "", address: "", password: "", });

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ productName: '', price: 0, quantity: 0, discount: 0, image:'', category: '' });

  const [edit,setEdit] = useState(false);
  const [ind,setInd] = useState(null);

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
          image: '',
          category: '',
        });
      } catch (err) {
        console.error("Error adding product:", err);
      }
    };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const updatedProducts = products.map((product, index) =>
      index === ind
        ? newProduct
        : product
    );
    setProducts(updatedProducts);
  }

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  const handleProductSet = (ind,pro,pri,qua,dis,img,cat) => {
    setNewProduct({productName:pro,price:pri,quantity: qua,discount: dis,image: img,category:cat});
    setInd(ind);
    setEdit(true);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <i className="fa fa-refresh absolute top-[155px] right-10 cursor-pointer text-gray-500 hover:text-gray-700"></i>
        <form onSubmit={edit ? handleUpdateProduct : handleAddProduct} className="space-y-4">
          <input
            type="text"
            name="image"
            value={newProduct.image}
            onChange={handleNewProductChange}
            placeholder="Image Url"
            className="border p-2 w-full rounded"
          />
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
          <input
            type="text"
            name="category"
            value={newProduct.category}
            onChange={handleNewProductChange}
            placeholder="Category"
            className="border p-2 w-full rounded"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            {edit ? "Edit Product" : "Add Product"}
          </button>
        </form>
      </section>
      
      <section className="mb-6 p-4 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        <table className="w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className='p-2'>Image</th>
              <th className="p-2">Product</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Price</th>
              <th className="p-2">Discount</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product,index) => (
              <tr key={product._id} className="border-b hover:bg-gray-50" onClick={() => handleProductSet(index,product.productName,product.price,product.quantity,product.discount,product.image,product.category)}>
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center h-full">
                    <img src={product.image} className="h-10 object-cover rounded-full" alt="Null" />
                  </div>
                </td>
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
