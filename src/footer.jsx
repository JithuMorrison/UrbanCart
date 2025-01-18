import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-screen-xl mx-auto text-center">
        <p className="text-lg">&copy; 2025 TrendyShop. All rights reserved.</p>
        <div className="mt-4">
          <a href="#privacy" className="text-sm hover:text-gray-400 mr-4">Privacy Policy</a>
          <a href="#terms" className="text-sm hover:text-gray-400">Terms of Service</a>
        </div>
        <div className="mt-4">
          <p className="text-sm">Follow us on:</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="https://facebook.com" className="text-gray-300 hover:text-blue-500">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://twitter.com" className="text-gray-300 hover:text-blue-400">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://instagram.com" className="text-gray-300 hover:text-pink-500">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
