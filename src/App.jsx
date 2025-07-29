import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './header';
import Home from './homepg';
import Footer from './footer';
import UserDashboard from './userdash'
import AdminDashboard from './admindash';
import Login from './login';
import Register from './register';
import Cart from './cart';
import Checkout from './chexkout';
import Wishlist from './wishlist';
import OrderTracking from './ordertracking';
import OrdersDashboard from './ordersdasj';
import DiscountManager from './discountmanager';
import AnalyticsDashboard from './analyticsdash';
import ProductManagement from './productmanagement';
import UserManagement from './usermanagement';
import AdminSettings from './adminsettings';
import Shop from './shop';
import ProductDetail from './productdetail';
import OrderSuccess from './ordersuccess';
import ContactPage from './contactpage';
import AdminContactPage from './admincontactpage';
import OrderDetailsPage from './orderdetailspage';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/orders/:orderId" element={<OrderTracking />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        
        {/* User Routes */}
        <Route path="/user/dashboard" element={<UserDashboard />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />}>
          <Route path="orders" element={<OrdersDashboard />} />
          <Route path="orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="discounts" element={<DiscountManager />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="contacts" element={<AdminContactPage />} />
        </Route>
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;