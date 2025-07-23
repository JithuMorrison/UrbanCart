import React, { useState, useEffect } from 'react';
import 'font-awesome/css/font-awesome.min.css';

const AdminDashboard = () => {
  const [userData] = useState({ name: "John Doe", email: "john.doe@example.com", address: "123 Main St, Springfield", password: "password123" });
  const [formData] = useState({name: "", email: "", address: "", password: "" });

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ 
    productName: '', 
    price: 0, 
    quantity: 0, 
    discount: 0, 
    image:'', 
    category: '' 
  });

  const [edit, setEdit] = useState(false);
  const [ind, setInd] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');

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
      setProducts([...products, data]);
      setNewProduct({
        productName: "",
        quantity: 0,
        price: 0,
        discount: 0,
        image: '',
        category: '',
      });
      setEdit(false);
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/product/${products[ind]._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();
      const updatedProducts = [...products];
      updatedProducts[ind] = data;
      setProducts(updatedProducts);
      setEdit(false);
      setNewProduct({
        productName: "",
        quantity: 0,
        price: 0,
        discount: 0,
        image: '',
        category: '',
      });
    } catch (err) {
      console.error("Error updating product:", err);
    }
  }

  const handleDeleteProduct = async (productId, index) => {
    try {
      await fetch(`http://localhost:3000/product/${productId}`, {
        method: "DELETE",
      });
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  }

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  const handleProductSet = (index, product) => {
    setNewProduct({
      productName: product.productName,
      price: product.price,
      quantity: product.quantity,
      discount: product.discount,
      image: product.image,
      category: product.category
    });
    setInd(index);
    setEdit(true);
    setActiveTab('addProduct');
  }

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar and Main Content Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-indigo-700 text-white min-h-screen p-4">
          <div className="flex items-center space-x-2 p-4 border-b border-indigo-600">
            <i className="fa fa-cog text-xl"></i>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          
          <nav className="mt-6">
            <div 
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <i className="fa fa-tachometer"></i>
              <span>Dashboard</span>
            </div>
            
            <div 
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer ${activeTab === 'products' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
              onClick={() => setActiveTab('products')}
            >
              <i className="fa fa-shopping-bag"></i>
              <span>Products</span>
            </div>
            
            <div 
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer ${activeTab === 'addProduct' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
              onClick={() => setActiveTab('addProduct')}
            >
              <i className="fa fa-plus-circle"></i>
              <span>{edit ? 'Edit Product' : 'Add Product'}</span>
            </div>
            
            <div 
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer ${activeTab === 'users' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fa fa-users"></i>
              <span>Users</span>
            </div>
            
            <div 
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer ${activeTab === 'settings' ? 'bg-indigo-600' : 'hover:bg-indigo-600'}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="fa fa-cog"></i>
              <span>Settings</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'addProduct' && (edit ? 'Edit Product' : 'Add New Product')}
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <i className="fa fa-search absolute left-3 top-3 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://randomuser.me/api/portraits/men/1.jpg" 
                  alt="User" 
                  className="w-10 h-10 rounded-full border-2 border-indigo-500"
                />
                <span className="font-medium">Admin</span>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Products</p>
                    <h3 className="text-2xl font-bold mt-2">{products.length}</h3>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <i className="fa fa-shopping-bag text-indigo-600 text-xl"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Categories</p>
                    <h3 className="text-2xl font-bold mt-2">
                      {[...new Set(products.map(p => p.category))].length}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <i className="fa fa-tags text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Low Stock Items</p>
                    <h3 className="text-2xl font-bold mt-2">
                      {products.filter(p => p.quantity < 10).length}
                    </h3>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <i className="fa fa-exclamation-triangle text-yellow-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Product Form */}
          {activeTab === 'addProduct' && (
            <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {edit ? 'Edit Product Details' : 'Add New Product'}
                </h3>
                <button 
                  onClick={() => {
                    setEdit(false);
                    setNewProduct({
                      productName: "",
                      quantity: 0,
                      price: 0,
                      discount: 0,
                      image: '',
                      category: '',
                    });
                  }}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <i className="fa fa-times"></i> Clear Form
                </button>
              </div>
              
              <form onSubmit={edit ? handleUpdateProduct : handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      name="image"
                      value={newProduct.image}
                      onChange={handleNewProductChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    {newProduct.image && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                        <img 
                          src={newProduct.image} 
                          alt="Preview" 
                          className="h-20 object-cover rounded border"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={newProduct.productName}
                      onChange={handleNewProductChange}
                      placeholder="Enter product name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={newProduct.category}
                      onChange={handleNewProductChange}
                      placeholder="Enter category"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={newProduct.quantity}
                      onChange={handleNewProductChange}
                      placeholder="Enter quantity"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={newProduct.price}
                      onChange={handleNewProductChange}
                      placeholder="Enter price"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={newProduct.discount}
                      onChange={handleNewProductChange}
                      placeholder="Enter discount percentage"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEdit(false);
                      setActiveTab('products');
                      setNewProduct({
                        productName: "",
                        quantity: 0,
                        price: 0,
                        discount: 0,
                        image: '',
                        category: '',
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {edit ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Products Table */}
          {activeTab === 'products' && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Product Inventory</h3>
                <button 
                  onClick={() => {
                    setEdit(false);
                    setActiveTab('addProduct');
                  }}
                  className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <i className="fa fa-plus"></i>
                  <span>Add Product</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product, index) => (
                      <tr key={product._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={product.image || 'https://via.placeholder.com/100?text=No+Image'} 
                              alt={product.productName}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity < 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {product.quantity} in stock
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.discount}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleProductSet(index, product)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <i className="fa fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id, index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <i className="fa fa-box-open text-4xl text-gray-300 mb-3"></i>
                  <p className="text-gray-500">No products found</p>
                </div>
              )}
            </section>
          )}

          {/* Other tabs can be added similarly */}
          {activeTab === 'users' && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">User Management</h3>
              <p className="text-gray-500">User management functionality coming soon.</p>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Settings</h3>
              <p className="text-gray-500">Settings functionality coming soon.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;