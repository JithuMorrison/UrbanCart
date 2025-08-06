import { set } from 'mongoose';
import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit, FiTag, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["Fruits", "Electronics", "Clothing", "Books"]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: 0,
    discount: 0,
    quantity: 0,
    category: '',
    tags: [],
    images: [],
    isFeatured: false
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [bulkImageUrls, setBulkImageUrls] = useState('');
  const [showCustomizationOptions, setShowCustomizationOptions] = useState(false);
  const [customizationOptions, setCustomizationOptions] = useState([]);
  const [newCustomizationOption, setNewCustomizationOption] = useState({
    name: '',
    type: 'text',
    required: false,
    options: [],
    priceAdjustment: 0,
    description: '',
    maxLength: null,
    minLength: null,
    default: ''
  });
  const [newOptionValue, setNewOptionValue] = useState({
    value: '',
    display: '',
    priceAdjustment: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:3000/products'),
          fetch('http://localhost:3000/categories')
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        setProducts(productsData);
        setCategories(categoriesData.length ? categoriesData : ["Fruits", "Electronics", "Clothing", "Books"]);
        setCategories(["Fruits", "Electronics", "Clothing", "Books"]);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (url && !formData.images.includes(url) && isValidUrl(url)) {
      setFormData({
        ...formData,
        images: [...formData.images, url]
      });
      setNewImageUrl('');
    }
  };

  const addBulkUrls = () => {
    const urls = bulkImageUrls.split('\n')
      .map(url => url.trim())
      .filter(url => url && isValidUrl(url) && !formData.images.includes(url));
    
    if (urls.length > 0) {
      setFormData({
        ...formData,
        images: [...formData.images, ...urls]
      });
      setBulkImageUrls('');
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data);
      setLoading(false);
      setShowForm(true);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const addCustomizationOption = () => {
    if (!newCustomizationOption.name) return;
    
    setCustomizationOptions([...customizationOptions, newCustomizationOption]);
    setNewCustomizationOption({
      name: '',
      type: 'text',
      required: false,
      options: [],
      priceAdjustment: 0,
      description: '',
      maxLength: null,
      minLength: null,
      default: ''
    });
  };

  const removeCustomizationOption = (index) => {
    const updated = [...customizationOptions];
    updated.splice(index, 1);
    setCustomizationOptions(updated);
  };

  const addOptionValue = () => {
    if (!newOptionValue.value) return;
    
    setNewCustomizationOption({
      ...newCustomizationOption,
      options: [...newCustomizationOption.options, newOptionValue]
    });
    setNewOptionValue({
      value: '',
      display: '',
      priceAdjustment: 0
    });
  };

  const removeOptionValue = (index) => {
    const updated = [...newCustomizationOption.options];
    updated.splice(index, 1);
    setNewCustomizationOption({
      ...newCustomizationOption,
      options: updated
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = localStorage.getItem('userId');
      const method = currentProduct ? 'PUT' : 'POST';
      const url = currentProduct 
        ? `http://localhost:3000/admin/products/${currentProduct._id}`
        : 'http://localhost:3000/admin/products';
      
      const productData = {
        ...formData,
        customizable: customizationOptions.length > 0,
        customizationOptions: customizationOptions.length > 0 ? customizationOptions : undefined,
        basePrice: formData.price
      };
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Operation failed');
      }
      
      alert(currentProduct ? 'Product updated successfully' : 'Product added successfully');
      fetchData();
      resetForm();
    } catch (err) {
      console.error('Error:', err);
      alert(err.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const user = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:3000/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      console.error('Error:', err);
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      description: '',
      price: 0,
      discount: 0,
      quantity: 0,
      category: '',
      tags: [],
      images: [],
      isFeatured: false
    });
    setNewImageUrl('');
    setBulkImageUrls('');
    setCurrentProduct(null);
    setShowForm(false);
    setCustomizationOptions([]);
    setShowCustomizationOptions(false);
  };

  const editProduct = (product) => {
    setCurrentProduct(product);
    setFormData({
      productName: product.productName,
      description: product.description,
      price: product.price,
      discount: product.discount || 0,
      quantity: product.quantity,
      category: product.category,
      tags: product.tags || [],
      images: product.images || [],
      isFeatured: product.isFeatured || false
    });
    setCustomizationOptions(product.customizationOptions || []);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-1" /> Add Product
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {currentProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name*</label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price*</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock*</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim());
                    setFormData({ ...formData, tags });
                  }}
                  placeholder="Separate with commas"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Preview ${index}`} 
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100?text=Image+Error';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Enter single image URL"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!newImageUrl.trim()}
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={bulkImageUrls}
                      onChange={(e) => setBulkImageUrls(e.target.value)}
                      placeholder="Enter multiple image URLs (one per line)"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addBulkUrls}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={!bulkImageUrls.trim()}
                    >
                      Add All URLs
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter full image URLs (e.g., https://example.com/image.jpg)
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="mr-2 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Featured Product</label>
              </div>
            </div>

            {showCustomizationOptions && (
              <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-lg mb-3">Customization Options</h3>
                
                {customizationOptions.length > 0 && (
                  <div className="mb-4 space-y-3">
                    {customizationOptions.map((option, index) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <strong>{option.name}</strong> ({option.type})
                            {option.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCustomizationOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                        {option.description && <p className="text-sm text-gray-600">{option.description}</p>}
                        {option.priceAdjustment !== 0 && (
                          <p className="text-sm">Price adjustment: ${option.priceAdjustment.toFixed(2)}</p>
                        )}
                        {option.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Options:</p>
                            <ul className="text-sm space-y-1">
                              {option.options.map((opt, i) => (
                                <li key={i}>
                                  {opt.display || opt.value} 
                                  {opt.priceAdjustment ? ` (+$${opt.priceAdjustment.toFixed(2)})` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option Name*</label>
                      <input
                        type="text"
                        value={newCustomizationOption.name}
                        onChange={(e) => setNewCustomizationOption({
                          ...newCustomizationOption,
                          name: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
                      <select
                        value={newCustomizationOption.type}
                        onChange={(e) => setNewCustomizationOption({
                          ...newCustomizationOption,
                          type: e.target.value,
                          options: e.target.value === 'dropdown' || e.target.value === 'color' || e.target.value === 'image' 
                            ? newCustomizationOption.options 
                            : []
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="color">Color Picker</option>
                        <option value="image">Image Selector</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCustomizationOption.required}
                        onChange={(e) => setNewCustomizationOption({
                          ...newCustomizationOption,
                          required: e.target.checked
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">Required</label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment</label>
                      <input
                        type="number"
                        value={newCustomizationOption.priceAdjustment}
                        onChange={(e) => setNewCustomizationOption({
                          ...newCustomizationOption,
                          priceAdjustment: parseFloat(e.target.value) || 0
                        })}
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={newCustomizationOption.description}
                        onChange={(e) => setNewCustomizationOption({
                          ...newCustomizationOption,
                          description: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  {(newCustomizationOption.type === 'text') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Length</label>
                        <input
                          type="number"
                          value={newCustomizationOption.minLength || ''}
                          onChange={(e) => setNewCustomizationOption({
                            ...newCustomizationOption,
                            minLength: e.target.value ? parseInt(e.target.value) : null
                          })}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
                        <input
                          type="number"
                          value={newCustomizationOption.maxLength || ''}
                          onChange={(e) => setNewCustomizationOption({
                            ...newCustomizationOption,
                            maxLength: e.target.value ? parseInt(e.target.value) : null
                          })}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                        <input
                          type="text"
                          value={newCustomizationOption.default}
                          onChange={(e) => setNewCustomizationOption({
                            ...newCustomizationOption,
                            default: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(newCustomizationOption.type === 'dropdown' || 
                    newCustomizationOption.type === 'color' || 
                    newCustomizationOption.type === 'image') && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Options</h4>
                      
                      {newCustomizationOption.options.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {newCustomizationOption.options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium">{option.display || option.value}</span>
                                {option.priceAdjustment !== 0 && (
                                  <span className="ml-2 text-blue-600">
                                    (+${option.priceAdjustment.toFixed(2)})
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOptionValue(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Value*</label>
                          <input
                            type={newCustomizationOption.type === 'color' ? 'color' : 'text'}
                            value={newOptionValue.value}
                            onChange={(e) => setNewOptionValue({
                              ...newOptionValue,
                              value: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                          <input
                            type="text"
                            value={newOptionValue.display}
                            onChange={(e) => setNewOptionValue({
                              ...newOptionValue,
                              display: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment</label>
                          <input
                            type="number"
                            value={newOptionValue.priceAdjustment}
                            onChange={(e) => setNewOptionValue({
                              ...newOptionValue,
                              priceAdjustment: parseFloat(e.target.value) || 0
                            })}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={addOptionValue}
                        disabled={!newOptionValue.value}
                        className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50"
                      >
                        Add Option
                      </button>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={addCustomizationOption}
                    disabled={!newCustomizationOption.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add Customization Option
                  </button>
                </div>
              </div>
            )}
            
            {/* Add this toggle button to your form (before the submit buttons) */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => setShowCustomizationOptions(!showCustomizationOptions)}
                className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {showCustomizationOptions ? (
                  <>
                    <FiChevronUp className="mr-1" /> Hide Customization Options
                  </>
                ) : (
                  <>
                    <FiChevronDown className="mr-1" /> Add Customization Options
                  </>
                )}
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {currentProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <FiTag className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No products found</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 flex items-center justify-center mx-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-1" /> Add Your First Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={product.images?.[0] || 'https://via.placeholder.com/100?text=No+Image'} 
                            alt={product.productName}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100?text=Image+Error';
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          {product.isFeatured && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span>${product.price.toFixed(2)}</span>
                        {product.discount > 0 && (
                          <span className="ml-2 line-through text-gray-400">
                            ${(product.price * (1 + product.discount/100)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.quantity > 10 ? 'bg-green-100 text-green-800' :
                        product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.quantity > 10 ? 'In Stock' : 
                         product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;