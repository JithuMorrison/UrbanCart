import React, { useState, useEffect } from 'react';

const Homepg = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

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
            priceAfterDiscount: priceAfterDiscount.toFixed(2),
            image: product.image,
          },
        ];
      }
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      alert("Product added to cart!");
    };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to TrendyShop</h1>

      {/* Offer Products */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Special Offers</h2>
        <div className="flex space-x-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white shadow-lg rounded-lg p-4 w-60">
              <div className="h-40 w-full overflow-hidden rounded-t-lg">
                <img src={product.image} alt={product.productName} className="h-full w-full object-cover"/>
              </div>
              <h3 className="text-xl font-semibold">{product.productName}</h3>
              <p className="text-gray-600">${product.price}</p>
              <button className="bg-blue-500 text-white rounded-md py-2 mt-4 w-full">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Product Categories */}
      <section className="mb-12" id='shop'>
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
        {['Electronics', 'Fruits', 'Accessories'].map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{category}</h3>
            <div className="flex space-x-6">
              {products
                .filter((product) => product.category === category)
                .map((product) => (
                  <div key={product.id} className="bg-white shadow-lg rounded-lg p-4 w-60">
                    <div className="h-40 w-full overflow-hidden rounded-t-lg">
                      <img src={product.image} alt={product.productName} className="h-full w-full object-cover"/>
                    </div>
                    <h3 className="text-xl font-semibold">{product.productName}</h3>
                    <p className="text-gray-600">
                      ${product.price}{" "}
                      {product.discount && (
                        <span className="text-green-500">
                          (${(product.price * (1 - product.discount / 100)).toFixed(2)})
                        </span>
                      )}
                    </p>
                    <div className="flex items-center mt-4">
                      <input type="number" min="1" defaultValue="1" id={`quantity-${product._id}`} className="border border-gray-300 rounded-md w-16 text-center" />
                      <button className="bg-blue-500 text-white rounded-md py-2 px-4 ml-4" onClick={() => {
                          const quantity = parseInt(
                            document.getElementById(`quantity-${product._id}`).value
                          );
                          if (quantity > 0) {
                            addToCart(product, quantity);
                          } else {
                            alert("Please select a valid quantity.");
                          }
                        }} >
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
  );
};

export default Homepg;
