import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiHeart, FiShare2, FiChevronLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [user, setUser] = useState(null);
  const userId = localStorage.getItem('userId');

  // Check if product is in wishlist
  const [isWishlisted,setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product and related products first
        const [productRes, relatedRes] = await Promise.all([
          fetch(`http://localhost:3000/products/${productId}`),
          fetch(`http://localhost:3000/products/related/${productId}`)
        ]);
        
        if (!productRes.ok) throw new Error('Product not found');
        
        const productData = await productRes.json();
        const relatedData = await relatedRes.json();
        
        setProduct(productData);
        setRelatedProducts(relatedData);

        // Then fetch user data if logged in
        if (userId) {
          const userRes = await fetch(`http://localhost:3000/user/${userId}`);
          const userData = await userRes.json();
          setUser(userData);
          setIsWishlisted(userData.wishlist?.some(item => item._id === productId));
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, userId]);

  const addToCart = async () => {
    if (!userId) {
      // Redirect to login or show login modal
      alert('Please login to add items to cart');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/user/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      
      alert('Product added to cart successfully');
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add product to cart');
    }
  };

  const toggleWishlist = async () => {
    if (!userId) {
      alert('Please login to manage your wishlist');
      return;
    }
    
    try {
      if (isWishlisted) {
        // Remove from wishlist
        const response = await fetch(`http://localhost:3000/user/${userId}/wishlist/${productId}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to remove from wishlist');

        // Update local user state
        setUser(prev => ({
          ...prev,
          wishlist: prev.wishlist.filter(id => id.toString() !== productId)
        }));
        alert('Product removed from wishlist');
      } else {
        // Add to wishlist
        const response = await fetch(`http://localhost:3000/user/${userId}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        });

        if (!response.ok) throw new Error('Failed to add to wishlist');

        // Update local user state
        setUser(prev => ({
          ...prev,
          wishlist: [...prev.wishlist, productId]
        }));
        alert('Product added to wishlist');
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert('Failed to update wishlist');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading product...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">Error Loading Product</h2>
        <p className="mb-4">{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center mx-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <FiChevronLeft className="mr-1" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <FiChevronLeft className="mr-1" /> Back
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <img 
              src={product.images?.[selectedImage] || 'https://via.placeholder.com/600'} 
              alt={product.productName} 
              className="w-full h-96 object-contain"
            />
          </div>
          
          {product.images?.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 border rounded ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'}`}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.productName}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className={i < Math.floor(product.averageRating) ? 'fill-current' : ''} />
              ))}
            </div>
            <span className="text-gray-500">({product.ratings?.length || 0} reviews)</span>
            {product.isFeatured && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                Featured
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
            {product.discount > 0 && (
              <span className="ml-2 text-gray-500 line-through">
                ${(product.price * (1 + product.discount/100)).toFixed(2)}
              </span>
            )}
            {product.discount > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                {product.discount}% OFF
              </span>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Details</h2>
            <ul className="list-disc pl-5 text-gray-700">
              <li>Category: {product.category}</li>
              {product.tags?.length > 0 && (
                <li>Tags: {product.tags.join(', ')}</li>
              )}
              <li>Availability: {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}</li>
              {product.quantity > 0 && product.quantity < 10 && (
                <li className="text-yellow-600">Only {product.quantity} left!</li>
              )}
            </ul>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center border border-gray-300 rounded">
              <button 
                onClick={() => setQuantity(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-3 py-1">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            
            <button 
              onClick={addToCart}
              disabled={product.quantity <= 0}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center ${
                product.quantity <= 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FiShoppingCart className="mr-2" />
              Add to Cart
            </button>
          </div>
          
          <div className="flex space-x-4">
            <button 
              onClick={toggleWishlist}
              className={`flex items-center ${isWishlisted ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            >
              <FiHeart className={`mr-1 ${isWishlisted ? 'fill-current' : ''}`} />
              {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <button className="flex items-center text-gray-600 hover:text-blue-500">
              <FiShare2 className="mr-1" /> Share
            </button>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        
        {product.ratings?.length > 0 ? (
          <div className="space-y-6">
            {product.ratings.map((rating, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={i < rating.rating ? 'fill-current' : ''} />
                    ))}
                  </div>
                  <span className="font-medium">{rating.userId?.username || 'Anonymous'}</span>
                </div>
                <p className="text-gray-700 mb-2">{rating.review}</p>
                <p className="text-sm text-gray-500">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {relatedProducts.map(relatedProduct => (
              <div key={relatedProduct._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/products/${relatedProduct._id}`} className="block">
                  <img 
                    src={relatedProduct.images?.[0] || 'https://via.placeholder.com/300'} 
                    alt={relatedProduct.productName} 
                    className="w-full h-48 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/products/${relatedProduct._id}`} className="block font-medium mb-1 hover:text-blue-600">
                    {relatedProduct.productName}
                  </Link>
                  <p className="text-gray-600 text-sm mb-2">{relatedProduct.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">${relatedProduct.price.toFixed(2)}</span>
                    <button 
                      onClick={() => {
                        // Handle add to cart for related products
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;