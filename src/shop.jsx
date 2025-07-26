import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiHeart, FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    sort: 'newest',
    search: ''
  });
  const [categories, setCategories] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const userId = localStorage.getItem('userId');
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products with filters
        let url = 'http://localhost:3000/products?';
        if (filters.category) url += `category=${filters.category}&`;
        if (filters.search) url += `search=${filters.search}&`;
        if (filters.sort) url += `sort=${filters.sort}&`;
        
        const [productsRes, categoriesRes, wishlistRes] = await Promise.all([
          fetch(url),
          fetch('http://localhost:3000/products/categories'),
          userId ? fetch(`http://localhost:3000/user/${userId}/wishlist`) : Promise.resolve(null)
        ]);
        
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        
        setProducts(productsData);
        setCategories(['All', ...categoriesData]);
        
        if (wishlistRes) {
          const wishlistData = await wishlistRes.json();
          setWishlist(wishlistData.map(item => item._id));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Check for category in URL
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
  }, [filters, userId, location.search]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      priceRange: '',
      sort: 'newest',
      search: ''
    });
  };

  const toggleWishlist = async (productId) => {
    try {
      if (wishlist.includes(productId)) {
        await fetch(`http://localhost:3000/user/${userId}/wishlist/${productId}`, {
          method: 'DELETE'
        });
        setWishlist(prev => prev.filter(id => id !== productId));
      } else {
        await fetch(`http://localhost:3000/user/${userId}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });
        setWishlist(prev => [...prev, productId]);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow-md sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Filters</h3>
              <button 
                onClick={() => setFilterOpen(!filterOpen)}
                className="md:hidden text-gray-600"
              >
                {filterOpen ? <FiX size={20} /> : <FiFilter size={20} />}
              </button>
            </div>
            
            <div className={`${filterOpen ? 'block' : 'hidden'} md:block space-y-6`}>
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search products..."
                />
              </div>
              
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <select
                  name="priceRange"
                  value={filters.priceRange}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Prices</option>
                  <option value="0-50">Under $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200-500">$200 - $500</option>
                  <option value="500-">Over $500</option>
                </select>
              </div>
              
              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
              
              <button
                onClick={clearFilters}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="md:w-3/4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Shop</h1>
            <p className="text-gray-600">
              {products.length} {products.length === 1 ? 'product' : 'products'} found
              {filters.category && ` in ${filters.category}`}
            </p>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="bg-gray-300 h-64 w-full"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Link to={`/products/${product._id}`} className="block">
                      <img 
                        src={product.images?.[0] || 'https://via.placeholder.com/300'} 
                        alt={product.productName} 
                        className="w-full h-64 object-cover"
                      />
                    </Link>
                    {userId && (
                      <button
                        onClick={() => toggleWishlist(product._id)}
                        className={`absolute top-2 right-2 p-2 rounded-full ${wishlist.includes(product._id) ? 'text-red-500 bg-white' : 'text-gray-400 bg-white'}`}
                      >
                        <FiHeart className={wishlist.includes(product._id) ? 'fill-current' : ''} />
                      </button>
                    )}
                    {product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        {product.discount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <Link to={`/products/${product._id}`} className="block font-medium mb-1 hover:text-blue-600 line-clamp-2">
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
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Add to cart"
                      >
                        <FiShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;