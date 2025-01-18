import React from 'react';

const Homepg = () => {
  const products = [
    { id: 1, name: 'Product 1', price: 20, category: 'Electronics' },
    { id: 2, name: 'Product 2', price: 15, category: 'Clothing' },
    { id: 3, name: 'Product 3', price: 30, category: 'Accessories' },
    { id: 4, name: 'Product 4', price: 40, category: 'Electronics' },
    { id: 5, name: 'Product 5', price: 25, category: 'Clothing' },
  ];

  const offerProducts = [
    { id: 1, name: 'Offer Product 1', price: 10, category: 'Sale' },
    { id: 2, name: 'Offer Product 2', price: 5, category: 'Sale' },
    { id: 3, name: 'Offer Product 3', price: 15, category: 'Sale' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to TrendyShop</h1>

      {/* Offer Products */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Special Offers</h2>
        <div className="flex space-x-6">
          {offerProducts.map((product) => (
            <div key={product.id} className="bg-white shadow-lg rounded-lg p-4 w-60">
              <h3 className="text-xl font-semibold">{product.name}</h3>
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
        {['Electronics', 'Clothing', 'Accessories'].map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-semibold mb-4">{category}</h3>
            <div className="flex space-x-6">
              {products
                .filter((product) => product.category === category)
                .map((product) => (
                  <div key={product.id} className="bg-white shadow-lg rounded-lg p-4 w-60">
                    <h3 className="text-xl font-semibold">{product.name}</h3>
                    <p className="text-gray-600">${product.price}</p>
                    <button className="bg-blue-500 text-white rounded-md py-2 mt-4 w-full">
                      Add to Cart
                    </button>
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
