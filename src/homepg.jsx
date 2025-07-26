import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiClock } from 'react-icons/fi';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsRes, recommendedRes] = await Promise.all([
          fetch('http://localhost:3000/products'),
          userId ? fetch(`http://localhost:3000/user/${userId}/recommendations`) : Promise.resolve(null)
        ]);
        
        const productsData = await productsRes.json();
        setProducts(productsData);
        
        if (recommendedRes) {
          const recommendedData = await recommendedRes.json();
          setRecommendedProducts(recommendedData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [userId]);

  const addToCart = async (productId) => {
    try {
      await fetch(`http://localhost:3000/user/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      
      // Show success notification
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to TrendyShop</h1>
        <p className="text-xl mb-6">Discover amazing products at unbeatable prices</p>
        <Link 
          to="/shop" 
          className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
        >
          Shop Now
        </Link>
      </div>
      
      {/* Personalized Recommendations */}
      {userId && recommendedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {recommendedProducts.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/products/${product._id}`} className="block">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                    alt={product.productName} 
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="block font-medium mb-1 hover:text-blue-600">
                    {product.productName}
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < Math.floor(product.averageRating) ? 'fill-current' : ''} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs ml-1">({product.ratings?.length || 0})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">${product.price.toFixed(2)}</span>
                      {product.discount > 0 && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ${(product.price * (1 + product.discount/100)).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(product._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Category Tabs */}
      <section className="mb-8">
        <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 mr-2 rounded-full whitespace-nowrap ${
                activeCategory === category ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="bg-gray-300 h-48 w-full"></div>
                <div className="p-4">
                  <div className="h-5 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredProducts.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/products/${product._id}`} className="block">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                    alt={product.productName} 
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="block font-medium mb-1 hover:text-blue-600">
                    {product.productName}
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < Math.floor(product.averageRating) ? 'fill-current' : ''} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs ml-1">({product.ratings?.length || 0})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">${product.price.toFixed(2)}</span>
                      {product.discount > 0 && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          ${(product.price * (1 + product.discount/100)).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(product._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* New Arrivals */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">New Arrivals</h2>
          <Link to="/new-arrivals" className="text-blue-600 hover:text-blue-800 flex items-center">
            View all <FiClock className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Link to={`/products/${product._id}`} className="block">
                    <img 
                      src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                      alt={product.productName} 
                      className="w-full h-48 object-cover"
                    />
                  </Link>
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    New
                  </span>
                </div>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="block font-medium mb-1 hover:text-blue-600">
                    {product.productName}
                  </Link>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                    <button 
                      onClick={() => addToCart(product._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default Home;