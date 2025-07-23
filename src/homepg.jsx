import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiStar, FiChevronRight } from 'react-icons/fi';

const Homepg = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/products");
        const data = await response.json();
        setProducts(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product, quantity) => {
    const priceAfterDiscount = product.price * (1 - (product.discount || 0) / 100);
    const existingProduct = cart.find((item) => item.id === product._id);

    let updatedCart;
    if (existingProduct) {
      updatedCart = cart.map((item) =>
        item.id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          id: product._id,
          name: product.productName,
          quantity,
          price: product.price,
          priceAfterDiscount: priceAfterDiscount.toFixed(2),
          image: product.image,
          discount: product.discount || 0,
        },
      ];
    }
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    
    // Show toast notification instead of alert
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center';
    toast.innerHTML = `
      <span class="mr-2">✅ Added to cart!</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Get unique categories
  const categories = ['All', ...new Set(products.map(product => product.category))];

  // Filter products based on active category and search term
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group products by category for the "Shop by Category" section
  const productsByCategory = {};
  products.forEach(product => {
    if (!productsByCategory[product.category]) {
      productsByCategory[product.category] = [];
    }
    productsByCategory[product.category].push(product);
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to TrendyShop</h1>
          <p className="text-xl mb-8">Discover amazing products at unbeatable prices</p>
          
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Special Offers Carousel */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Special Offers</h2>
            <button className="text-blue-600 hover:text-blue-800 flex items-center">
              View all <FiChevronRight className="ml-1" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="bg-gray-300 h-48 w-full"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products
                .filter(product => product.discount > 0)
                .slice(0, 4)
                .map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300'} 
                        alt={product.productName} 
                        className="h-48 w-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                        }}
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.productName}</h3>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} className={`${i < 4 ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                        <span className="text-gray-500 text-sm ml-1">(24)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          ${(product.price * (1 - product.discount / 100)).toFixed(2)}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => addToCart(product, 1)}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center transition-colors duration-300"
                      >
                        <FiShoppingCart className="mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Category Tabs */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
          <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                className={`px-4 py-2 mr-2 rounded-full whitespace-nowrap ${activeCategory === category ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="bg-gray-300 h-48 w-full"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    <img 
                      src={product.image || 'https://via.placeholder.com/300'} 
                      alt={product.productName} 
                      className="h-48 w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                      }}
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                        {product.discount}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.productName}</h3>
                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`${i < 4 ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-gray-500 text-sm ml-1">(24)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900">
                        ${product.discount > 0 
                          ? (product.price * (1 - product.discount / 100)).toFixed(2)
                          : product.price.toFixed(2)}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center">
                      <input 
                        type="number" 
                        min="1" 
                        defaultValue="1" 
                        className="border border-gray-300 rounded-md w-16 text-center py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button 
                        onClick={(e) => {
                          const quantity = parseInt(e.target.previousElementSibling.value);
                          if (quantity > 0) {
                            addToCart(product, quantity);
                          } else {
                            // Show error toast
                            const toast = document.createElement('div');
                            toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg';
                            toast.textContent = 'Please enter a valid quantity';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 3000);
                          }
                        }}
                        className="ml-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center transition-colors duration-300"
                      >
                        <FiShoppingCart className="mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Featured Categories */}
        <section id="shop" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Collections</h2>
          
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <div key={category} className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{category}</h3>
                <button className="text-blue-600 hover:text-blue-800 flex items-center">
                  View all <FiChevronRight className="ml-1" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categoryProducts.slice(0, 4).map(product => (
                  <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative">
                      <img 
                        src={product.image || 'https://via.placeholder.com/300'} 
                        alt={product.productName} 
                        className="h-48 w-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                        }}
                      />
                      {product.discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.productName}</h3>
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar key={i} className={`${i < 4 ? 'fill-current' : ''}`} />
                          ))}
                        </div>
                        <span className="text-gray-500 text-sm ml-1">(24)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          ${product.discount > 0 
                            ? (product.price * (1 - product.discount / 100)).toFixed(2)
                            : product.price.toFixed(2)}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => addToCart(product, 1)}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center transition-colors duration-300"
                      >
                        <FiShoppingCart className="mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Homepg;