import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiClock, FiHeart } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [wishlist, setWishlist] = useState([]);
  const userId = localStorage.getItem('userId');

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [productsRes, categoriesRes, recommendedRes, wishlistRes] = await Promise.all([
          fetch('http://localhost:3000/products'),
          fetch('http://localhost:3000/products/categories'),
          userId ? fetch(`http://localhost:3000/user/${userId}/recommendations`) : Promise.resolve(null),
          userId ? fetch(`http://localhost:3000/user/${userId}/wishlist`) : Promise.resolve(null)
        ]);

        // Handle products
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        const productsData = await productsRes.json();
        setProducts(productsData);

        // Handle categories
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesRes.json();
        setCategories(['All', ...categoriesData]);

        // Handle recommendations
        if (recommendedRes) {
          if (!recommendedRes.ok) throw new Error('Failed to fetch recommendations');
          const recommendedData = await recommendedRes.json();
          setRecommendedProducts(recommendedData);
        }

        // Handle wishlist
        if (wishlistRes) {
          if (!wishlistRes.ok) throw new Error('Failed to fetch wishlist');
          const wishlistData = await wishlistRes.json();
          setWishlist(wishlistData);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Add to cart function
  const addToCart = async (productId) => {
    if (!userId) {
      toast.info('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      
      toast.success('Product added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(err.message);
    }
  };

  // Toggle wishlist function
  const toggleWishlist = async (productId) => {
    if (!userId) {
      toast.info('Please login to manage your wishlist');
      return;
    }

    try {
      const isCurrentlyWishlisted = wishlist.some(item => item._id === productId);
      
      let response;
      if (isCurrentlyWishlisted) {
        response = await fetch(`http://localhost:3000/user/${userId}/wishlist/${productId}`, {
          method: 'DELETE'
        });
      } else {
        response = await fetch(`http://localhost:3000/user/${userId}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
      }

      if (!response.ok) throw new Error(`Failed to ${isCurrentlyWishlisted ? 'remove from' : 'add to'} wishlist`);

      // Update local wishlist state
      const updatedWishlist = await response.json();
      setWishlist(updatedWishlist);

      toast.success(`Product ${isCurrentlyWishlisted ? 'removed from' : 'added to'} wishlist!`);
    } catch (err) {
      console.error('Error updating wishlist:', err);
      toast.error(err.message);
    }
  };

  // Filter products by category
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  // Product card component
  const ProductCard = ({ product }) => {
    const isWishlisted = wishlist.some(item => item._id === product._id);
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
        {/* Wishlist button */}
        <button 
          onClick={() => toggleWishlist(product._id)}
          className={`absolute top-2 right-2 p-2 rounded-full ${isWishlisted ? 'text-red-500' : 'text-gray-400'} hover:bg-gray-100`}
        >
          <FiHeart className={isWishlisted ? 'fill-current' : ''} />
        </button>
        
        {/* Product image */}
        <Link to={`/products/${product._id}`} className="block">
          <img 
            src={product.images?.[0] || 'https://via.placeholder.com/300'} 
            alt={product.productName} 
            className="w-full h-48 object-cover"
          />
        </Link>
        
        {/* Product details */}
        <div className="p-4">
          <Link to={`/products/${product._id}`} className="block font-medium mb-1 hover:text-blue-600">
            {product.productName}
          </Link>
          <p className="text-gray-600 text-sm mb-2">{product.category}</p>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar 
                  key={i} 
                  className={i < Math.floor(product.averageRating) ? 'fill-current' : ''} 
                />
              ))}
            </div>
            <span className="text-gray-500 text-xs ml-1">({product.ratings?.length || 0})</span>
          </div>
          
          {/* Price and add to cart */}
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
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <FiShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
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
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to TrendyShop</h1>
        <p className="text-xl mb-6">Discover amazing products at unbeatable prices</p>
        <Link 
          to="/shop" 
          className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Shop Now
        </Link>
      </div>
      
      {/* Personalized Recommendations */}
      {userId && recommendedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {recommendedProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}
      
      {/* Category Tabs */}
      <section className="mb-8">
        <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 mr-2 rounded-full whitespace-nowrap transition-colors ${
                activeCategory === category 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
      
      {/* New Arrivals */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">New Arrivals</h2>
          <Link 
            to="/new-arrivals" 
            className="text-blue-600 hover:text-blue-800 flex items-center transition-colors"
          >
            View all <FiClock className="ml-1" />
          </Link>
        </div>
        
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {products
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map(product => (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
                  {/* New badge */}
                  <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    New
                  </span>
                  
                  {/* Wishlist button */}
                  <button 
                    onClick={() => toggleWishlist(product._id)}
                    className={`absolute top-2 right-2 p-2 rounded-full ${
                      wishlist.some(item => item._id === product._id) 
                        ? 'text-red-500' 
                        : 'text-gray-400'
                    } hover:bg-gray-100`}
                  >
                    <FiHeart className={wishlist.some(item => item._id === product._id) ? 'fill-current' : ''} />
                  </button>
                  
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
                    <div className="flex justify-between items-center">
                      <span className="font-bold">${product.price.toFixed(2)}</span>
                      <button 
                        onClick={() => addToCart(product._id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <FiShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;