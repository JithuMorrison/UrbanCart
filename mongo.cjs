const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const nodemailer = require('nodemailer');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error: ', err));

// Schemas
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantityOrdered: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String },
});

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  isDefault: { type: Boolean, default: false }
});

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: { type: String, enum: ['order', 'promotion', 'system'] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const discountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percentage', 'fixed', 'freeShipping'], required: true },
  value: { type: Number, required: true },
  minOrder: Number,
  validFrom: Date,
  validUntil: Date,
  maxUses: Number,
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  applicableCategories: [String],
  userGroups: [String] // new-user, frequent-buyer, etc.
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: { type: String, required: true },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  trackingNumber: String,
  carrier: String,
  orderDate: { type: Date, default: Date.now },
  isViewedByAdmin: { type: Boolean, default: false },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String
  }]
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  phone: String,
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  notifications: [notificationSchema],
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    addedAt: { type: Date, default: Date.now }
  }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLogin: Date,
  joinDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  images: [String],
  category: { type: String, required: true },
  tags: [String],
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  popularProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sales: Number
  }],
  categories: [{
    name: String,
    sales: Number
  }]
});

// Models
const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Discount = mongoose.model('Discount', discountSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware
const authenticateAdmin = (req, res, next) => {
  // In a real app, you'd use JWT or sessions
  if (req.headers['x-admin-auth'] === process.env.ADMIN_SECRET) {
    return next();
  }
  res.status(403).json({ message: 'Admin access denied' });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
  });
};

// Routes

// User Routes
app.post('/user/register', async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const newUser = new User({ 
      username, 
      password, 
      email, 
      firstName, 
      lastName,
      role: username === 'admin' ? 'admin' : 'user' // Just for demo
    });
    await newUser.save();
    
    // Send welcome email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Our E-commerce Store!',
        html: `<h1>Welcome ${firstName}!</h1><p>Thank you for registering with us.</p>`
      });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      // Don't fail registration if email fails
    }
    
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('wishlist')
      .populate('orders')
      .populate('cart.productId');
      
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/user/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Wishlist Routes
// Update these wishlist routes

// Get user's wishlist with populated products
app.get('/user/:userId/wishlist', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('wishlist', 'productName price images category');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user.wishlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add to wishlist
app.post('/user/:userId/wishlist', async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    
    user.wishlist.push(productId);
    await user.save();
    
    // Return populated wishlist
    const populatedUser = await User.findById(req.params.userId)
      .populate('wishlist', 'productName price images category');
    
    res.json(populatedUser.wishlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove from wishlist
app.delete('/user/:userId/wishlist/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    
    // Return populated wishlist
    const populatedUser = await User.findById(req.params.userId)
      .populate('wishlist', 'productName price images category');
    
    res.json(populatedUser.wishlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/user/:userId/wishlist/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    
    res.json(user.wishlist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Cart Routes
// Cart Routes
app.get('/user/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('cart.productId', 'productName price images discount');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format the cart items with product details
    const cartItems = user.cart.map(item => ({
      id: item.productId._id,
      quantity: item.quantity,
      name: item.productId.productName,
      price: item.productId.price,
      priceAfterDiscount: item.productId.price * (1 - (item.productId.discount / 100)),
      discount: item.productId.discount,
      image: item.productId.images[0] || 'https://via.placeholder.com/150'
    }));
    
    res.json(cartItems);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/user/:userId/cart', async (req, res) => {
  try {
    const { action, productId, quantity, clearAll } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'update') {
      // Handle quantity update
      const cartItem = user.cart.find(item => 
        item.productId.toString() === productId
      );
      
      if (!cartItem) {
        return res.status(404).json({ message: 'Item not found in cart' });
      }
      
      cartItem.quantity = quantity;
    } 
    else if (action === 'remove') {
      // Handle item removal
      user.cart = user.cart.filter(item => 
        item.productId.toString() !== productId
      );
    }
    else if (clearAll) {
      // Handle clear cart
      user.cart = [];
    }
    else {
      // Default action (add item)
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      const existingItem = user.cart.find(item => 
        item.productId.toString() === productId
      );
      
      if (existingItem) {
        existingItem.quantity += quantity || 1;
      } else {
        user.cart.push({
          productId,
          quantity: quantity || 1,
          addedAt: new Date()
        });
      }
    }
    
    await user.save();
    
    // Return updated cart
    const updatedUser = await User.findById(req.params.userId)
      .populate('cart.productId', 'productName price images discount');
    
    const cartItems = updatedUser.cart.map(item => ({
      id: item.productId._id,
      quantity: item.quantity,
      name: item.productId.productName,
      price: item.productId.price,
      priceAfterDiscount: item.productId.price * (1 - (item.productId.discount / 100)),
      discount: item.productId.discount,
      image: item.productId.images[0] || 'https://via.placeholder.com/150'
    }));
    
    res.json(cartItems);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/user/:userId/cart/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove item from cart
    user.cart = user.cart.filter(item => 
      item.productId.toString() !== req.params.productId
    );
    
    await user.save();
    
    // Return updated cart
    const updatedUser = await User.findById(req.params.userId)
      .populate('cart.productId', 'productName price images discount');
    
    const cartItems = updatedUser.cart.map(item => ({
      id: item.productId._id,
      quantity: item.quantity,
      name: item.productId.productName,
      price: item.productId.price,
      priceAfterDiscount: item.productId.price * (1 - (item.productId.discount / 100)),
      discount: item.productId.discount,
      image: item.productId.images[0] || 'https://via.placeholder.com/150'
    }));
    
    res.json(cartItems);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/user/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Clear the entire cart
    user.cart = [];
    await user.save();
    
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/user/:userId/cart/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const cartItem = user.cart.find(item => item.productId.toString() === req.params.productId);
    
    if (!cartItem) return res.status(404).json({ message: 'Item not in cart' });
    
    cartItem.quantity = quantity;
    await user.save();
    
    res.json(user.cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/user/:userId/cart/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.cart = user.cart.filter(item => item.productId.toString() !== req.params.productId);
    await user.save();
    
    res.json(user.cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Order Routes
app.post('/user/:userId/checkout', async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod, discountCode } = req.body;
    const user = await User.findById(req.params.userId).populate('cart.productId');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.cart.length === 0) return res.status(400).json({ message: 'Cart is empty' });
    
    // Calculate order totals
    let subtotal = 0;
    const items = user.cart.map(item => {
      const product = item.productId;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      
      return {
        productId: product._id,
        productName: product.productName,
        quantityOrdered: item.quantity,
        price: product.price,
        image: product.images[0]
      };
    });
    
    // Apply discount if provided
    let discount = 0;
    if (discountCode) {
      const discountObj = await Discount.findOne({ code: discountCode, isActive: true });
      if (discountObj && discountObj.validUntil > new Date() && discountObj.usedCount < discountObj.maxUses) {
        if (discountObj.type === 'percentage') {
          discount = subtotal * (discountObj.value / 100);
        } else if (discountObj.type === 'fixed') {
          discount = discountObj.value;
        }
        discountObj.usedCount += 1;
        await discountObj.save();
      }
    }
    
    // Create order
    const order = new Order({
      userId: user._id,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee: subtotal > 50 ? 0 : 5.99, // Free shipping over $50
      discount,
      total: subtotal - discount + (subtotal > 50 ? 0 : 5.99),
      status: 'pending',
      statusHistory: [{ status: 'pending' }]
    });
    
    await order.save();
    
    // Clear user's cart
    user.cart = [];
    user.orders.push(order._id);
    await user.save();
    
    // Send order confirmation email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your Order Confirmation',
        html: `<h1>Thank you for your order, ${user.firstName}!</h1>
               <p>Order #${order._id}</p>
               <p>Total: $${order.total.toFixed(2)}</p>`
      });
    } catch (emailErr) {
      console.error('Order confirmation email failed:', emailErr);
    }
    
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/user/:userId/order/:orderId/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by user' });
    await order.save();
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/user/:userId/order/:orderId/reorder', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    const user = await User.findById(req.params.userId);
    
    if (!order || !user) return res.status(404).json({ message: 'Not found' });
    
    // Add all items from order back to cart
    for (const item of order.items) {
      const existingItem = user.cart.find(cartItem => 
        cartItem.productId.toString() === item.productId.toString()
      );
      
      if (existingItem) {
        existingItem.quantity += item.quantityOrdered;
      } else {
        user.cart.push({
          productId: item.productId,
          quantity: item.quantityOrdered
        });
      }
    }
    
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Notification Routes
app.get('/user/:userId/notifications', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.notifications);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/user/:userId/notifications/:notificationId/read', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const notification = user.notifications.id(req.params.notificationId);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    
    notification.isRead = true;
    await user.save();
    
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add this to your routes section (before the 404 handler)

// Personalized product recommendations
app.get('/user/:userId/recommendations', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Get user's order history to find categories they like
    const userOrders = await Order.find({ userId }).populate('items.productId');
    
    // Find most ordered categories
    const categoryCounts = {};
    userOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.productId.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantityOrdered;
      });
    });
    
    // Get top 3 categories
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
    
    // Get recommended products from these categories
    let recommendedProducts = [];
    
    if (topCategories.length > 0) {
      recommendedProducts = await Product.find({
        category: { $in: topCategories },
        _id: { $nin: userOrders.flatMap(o => o.items.map(i => i.productId._id)) }
      })
      .sort({ averageRating: -1 })
      .limit(10);
    }
    
    // If not enough recommendations, add popular products
    if (recommendedProducts.length < 5) {
      const popularProducts = await Product.find()
        .sort({ averageRating: -1 })
        .limit(5 - recommendedProducts.length);
      recommendedProducts = [...recommendedProducts, ...popularProducts];
    }
    
    res.json(recommendedProducts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user details with populated wishlist and cart
app.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('wishlist', 'productName price images category')
      .populate('cart.productId', 'productName price images category');
      
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Don't send sensitive data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      addresses: user.addresses,
      wishlist: user.wishlist,
      cart: user.cart,
      orders: user.orders,
      notifications: user.notifications,
      role: user.role,
      lastLogin: user.lastLogin,
      joinDate: user.joinDate
    };
    
    res.json(userData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// New arrivals endpoint (or modify existing products endpoint to support sorting)
app.get('/products/new-arrivals', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// You can also modify your existing products endpoint to support sorting:
app.get('/products', async (req, res) => {
  try {
    const { category, search, sort, limit } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = {};
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { 'ratings.length': -1 }; // Sort by number of reviews
    
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(parseInt(limit) || 0);
      
    res.json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/products/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin Routes
app.get('/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const { status, viewed } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (viewed) query.isViewedByAdmin = viewed === 'true';
    
    const orders = await Order.find(query)
      .populate('userId', 'username email')
      .sort({ orderDate: -1 });
      
    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/admin/orders/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      pending: await Order.countDocuments({ status: 'pending', isViewedByAdmin: false }),
      processing: await Order.countDocuments({ status: 'processing' }),
      shipped: await Order.countDocuments({ status: 'shipped' })
    };
    
    res.json(stats);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/admin/order/:orderId/status', authenticateAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.orderId);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.status = status;
    order.statusHistory.push({ status, note });
    
    if (status === 'shipped') {
      order.trackingNumber = `TRK${Date.now().toString().slice(-8)}`;
      order.carrier = 'Standard Shipping';
    }
    
    await order.save();
    
    // Send notification to user
    const user = await User.findById(order.userId);
    if (user) {
      user.notifications.push({
        title: 'Order Update',
        message: `Your order #${order._id} status has been updated to ${status}`,
        type: 'order'
      });
      await user.save();
      
      // Send email notification
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Order #${order._id} Update`,
          html: `<p>Your order status has been updated to <strong>${status}</strong></p>`
        });
      } catch (emailErr) {
        console.error('Status update email failed:', emailErr);
      }
    }
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/admin/order/:orderId/viewed', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { isViewedByAdmin: true },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Discount Routes
app.post('/admin/discounts', authenticateAdmin, async (req, res) => {
  try {
    const discount = new Discount(req.body);
    await discount.save();
    res.status(201).json(discount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/admin/discounts', authenticateAdmin, async (req, res) => {
  try {
    const discounts = await Discount.find().sort({ validFrom: -1 });
    res.json(discounts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/admin/discounts/:id', authenticateAdmin, async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(discount);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Analytics Routes
app.get('/admin/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    
    if (period === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { date: { $gte: oneWeekAgo } };
    } else if (period === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter = { date: { $gte: oneMonthAgo } };
    }
    
    const analytics = await Analytics.find(dateFilter).sort({ date: -1 });
    res.json(analytics);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Product Routes
app.get('/products', async (req, res) => {
  try {
    const { category, search, sort, limit } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = {};
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { averageRating: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(parseInt(limit) || 0);
      
    res.json(products);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// MISSING ROUTE: Related Products
app.get('/products/related/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const currentProduct = await Product.findById(productId);
    
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Find related products in the same category, excluding the current product
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: currentProduct.category
    })
    .limit(4)
    .sort({ averageRating: -1 });
    
    res.json(relatedProducts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Additional Product Routes for Admin
app.post('/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/admin/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Categories Route
app.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Featured Products Route
app.get('/products/featured', async (req, res) => {
  try {
    const featuredProducts = await Product.find({ isFeatured: true })
      .limit(6)
      .sort({ averageRating: -1 });
    res.json(featuredProducts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Search suggestions
app.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const suggestions = await Product.find({
      $or: [
        { productName: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    })
    .select('productName category')
    .limit(5);
    
    res.json(suggestions);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Product Reviews
app.post('/products/:id/reviews', async (req, res) => {
  try {
    const { userId, rating, review } = req.body;
    const productId = req.params.id;
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Check if user already reviewed this product
    const existingReview = product.ratings.find(r => r.userId.toString() === userId);
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    product.ratings.push({
      userId,
      rating,
      review,
      createdAt: new Date()
    });
    
    // Calculate new average rating
    const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = totalRating / product.ratings.length;
    
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 404 handler for API routes (should come before error handler)
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Generic 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Daily analytics job
const updateAnalytics = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orders = await Order.find({ 
      orderDate: { 
        $gte: today, 
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
      },
      status: { $ne: 'cancelled' }
    });
    
    const newUsers = await User.countDocuments({ 
      joinDate: { 
        $gte: today, 
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) 
      } 
    });
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Get popular products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = 0;
        }
        productSales[item.productId] += item.quantityOrdered;
      });
    });
    
    const popularProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, sales]) => ({ productId, sales }));
    
    // Get sales by category
    const categorySales = {};
    const products = await Product.find();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.productId.toString());
        if (product) {
          if (!categorySales[product.category]) {
            categorySales[product.category] = 0;
          }
          categorySales[product.category] += item.quantityOrdered * item.price;
        }
      });
    });
    
    const categories = Object.entries(categorySales)
      .map(([name, sales]) => ({ name, sales }));
    
    await Analytics.create({
      date: today,
      totalOrders: orders.length,
      totalRevenue,
      newUsers,
      popularProducts,
      categories
    });
    
    console.log('Daily analytics updated');
  } catch (err) {
    console.error('Error updating analytics:', err);
  }
};

// Run analytics update at midnight every day
setTimeout(() => {
  updateAnalytics();
  setInterval(updateAnalytics, 24 * 60 * 60 * 1000);
}, (24 * 60 * 60 * 1000) - (Date.now() % (24 * 60 * 60 * 1000)));