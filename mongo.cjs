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
// MongoDB Connection
mongoose.connect(process.env.DB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Remove the problematic index if it exists
    try {
      const ordersCollection = mongoose.connection.db.collection('orders');
      const indexes = await ordersCollection.indexes();
      
      const usernameIndex = indexes.find(index => 
        index.key && index.key.username === 1
      );
      
      if (usernameIndex) {
        await ordersCollection.dropIndex('username_1');
        console.log('Removed problematic username index from orders collection');
      }
    } catch (err) {
      console.log('Error checking/removing indexes:', err.message);
    }
  })
  .catch((err) => console.log('MongoDB connection error: ', err));

// Schemas
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantityOrdered: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  reviewed: { type: Boolean, default: false },
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    reviewedAt: Date
  },
  customizations: [{
    name: String,
    type: {type: String},
    value: mongoose.Schema.Types.Mixed,
    priceAdjustment: Number
  }],
  customPrice: Number
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
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  userGroups: [String], // new-user, frequent-buyer, etc.
  autoApply: { type: Boolean, default: false }, // For automatic discounts like first-order
  singleUse: { type: Boolean, default: false }, // For one-time use coupons
  createdBy: { type: String, enum: ['admin', 'system'], default: 'admin' },
  description: String,
  minimumPurchaseAmount: Number
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
  appliedCoupons: [{type: String}],
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
    addedAt: { type: Date, default: Date.now },
    customizations: [{
      name: String,
      type: { type: String },
      value: mongoose.Schema.Types.Mixed,
      priceAdjustment: Number
    }],
    customPrice: Number // Final price after customizations
  }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastLogin: Date,
  joinDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  coupons: [{
    code: String,
    discountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
    used: { type: Boolean, default: false },
    obtainedAt: { type: Date, default: Date.now }
  }],
  firstOrderDiscountUsed: { type: Boolean, default: false },
  referralCode: String,
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'image', 'color', 'dropdown', 'checkbox'], 
    required: true 
  },
  required: { type: Boolean, default: false },
  options: [{
    value: String,
    display: String,
    priceAdjustment: { type: Number, default: 0 }
  }],
  priceAdjustment: { type: Number, default: 0 },
  description: String,
  maxLength: Number,
  minLength: Number,
  default: String
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
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
  }],
  averageRating: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  customizable: { type: Boolean, default: false },
  customizationOptions: [customizationOptionSchema],
  basePrice: { type: Number },
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

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  messages: [messageSchema],
  status: { 
    type: String, 
    enum: ['open', 'answered', 'closed'], 
    default: 'open' 
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Models
const Order = mongoose.model('Order', orderSchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Discount = mongoose.model('Discount', discountSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);
const Contact = mongoose.model('Contact', contactSchema);

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
  // Get the user ID from the request (could be from JWT, session, or headers)
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(403).json({ message: 'Authentication required' });
  }

  // Check if user is admin
  User.findById(userId)
    .then(user => {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access denied' });
      }
      next();
    })
    .catch(err => {
      res.status(500).json({ message: 'Server error' });
    });
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
    const { username, password, email, firstName, lastName, referralCode } = req.body;
    
    // For demo purposes - in production, you'd have a more secure way to create admin accounts
    const role = username === 'admin' ? 'admin' : 'user';
    
    const newUser = new User({ 
      username, 
      password, 
      email, 
      firstName, 
      lastName,
      role,
      referralCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    });
    
    await newUser.save();
    
    // Create welcome coupon for new users
    const welcomeCoupon = await Discount.findOneAndUpdate(
      { code: 'WELCOME10', autoApply: true, userGroups: 'new-user' },
      { 
        $setOnInsert: {
          type: 'percentage',
          value: 10,
          description: '10% off your first order',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maxUses: 1000,  // Initial value when creating
          isActive: true,
          minimumPurchaseAmount: 20
        }
      },
      { new: true, upsert: true }
    );
    
    // Increment maxUses separately if the document already exists
    if (!welcomeCoupon.$isNew) {
      await Discount.updateOne(
        { _id: welcomeCoupon._id },
        { $inc: { maxUses: 1 } }
      );
      welcomeCoupon.maxUses += 1;
    }
    
    // Add to user's coupons
    newUser.coupons.push({
      code: welcomeCoupon.code,
      discountId: welcomeCoupon._id
    });
    
    // Handle referral if provided
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        newUser.referredBy = referrer._id;
        
        // Find or create referral discount
        const referralDiscount = await Discount.findOneAndUpdate(
          { code: 'REFERRAL10', autoApply: true, userGroups: 'referral' }, // Changed code to avoid conflict with welcome coupon
          { 
            $setOnInsert: {
              type: 'percentage',
              value: 10,
              description: '10% off from referral',
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              maxUses: 1000, // Initial value
              isActive: true,
              minimumPurchaseAmount: 20
            }
          },
          { new: true, upsert: true }
        );
        
        // Increment maxUses separately if the document already exists
        if (!referralDiscount.$isNew) {
          await Discount.updateOne(
            { _id: referralDiscount._id },
            { $inc: { maxUses: 1 } }
          );
          referralDiscount.maxUses += 1;
        }
        
        // Add referral coupon to new user
        newUser.coupons.push({
          code: referralDiscount.code,
          discountId: referralDiscount._id
        });
        
        // Add referral bonus to referrer
        referrer.coupons.push({
          code: 'REFBONUS10',
          discountId: referralDiscount._id
        });
        await referrer.save();
      }
    }
    
    await newUser.save();
    
    // Send welcome email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Our E-commerce Store!',
        html: `<h1>Welcome ${firstName}!</h1>
               <p>Thank you for registering with us.</p>
               <p>Use code <strong>WELCOME10</strong> for 10% off your first order!</p>`
      });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
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
    
    // Return user data including role
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
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
    console.log('Hi');
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    console.log('User updated:', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/user/:id/address', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const incomingAddresses = req.body.addresses;

    // Filter new and existing separately
    const existingAddresses = user.addresses.map(addr => addr._id.toString());
    const updatedAddresses = [];

    for (const addr of incomingAddresses) {
      if (addr._id && existingAddresses.includes(addr._id)) {
        // Modify existing address
        const index = user.addresses.findIndex(a => a._id.toString() === addr._id);
        if (index !== -1) user.addresses[index] = addr;
      } else {
        // New address — push without _id if needed
        const { _id, ...rest } = addr;
        user.addresses.push(rest);
      }
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Update error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Address routes (should already exist in your backend)
app.get('/user/:userId/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.addresses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/user/:userId/addresses', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAddress = req.body;
    
    // If this is being set as default, unset any existing default
    if (newAddress.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/user/:userId/addresses/:addressId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addressId = req.params.addressId;
    user.addresses = user.addresses.filter(addr => addr._id !== addressId);
    
    await user.save();
    res.json(user.addresses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/user/:userId/addresses/:addressId/set-default', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addressId = req.params.addressId;
    
    // Unset all defaults first
    user.addresses.forEach(addr => {
      addr.isDefault = addr._id === addressId;
    });

    await user.save();
    res.json(user.addresses);
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
      customizations: item.customizations || [],
      customPrice: item.customPrice || item.productId.price,
      image: item.productId.images[0] || 'https://via.placeholder.com/150'
    }));
    
    res.json(cartItems);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/user/:userId/cart', async (req, res) => {
  try {
    const { productId, quantity, customizations, customPrice } = req.body;
    const user = await User.findById(req.params.userId).populate('cart.productId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Handle customizations
    let finalPrice = product.price;
    let validatedCustomizations = [];

    if (product.customizable && customizations && customizations.length > 0) {
      // Validate customizations against product options
      const productOptions = product.customizationOptions || [];
      
      validatedCustomizations = customizations.map(custom => {
        const option = productOptions.find(opt => opt.name === custom.name);
        if (!option) {
          throw new Error(`Invalid customization option: ${custom.name}`);
        }

        // Validate value based on type
        switch (option.type) {
          case 'dropdown':
            if (!option.options.some(opt => opt.value === custom.value)) {
              throw new Error(`Invalid value for ${custom.name}`);
            }
            break;
          case 'checkbox':
            if (typeof custom.value !== 'boolean') {
              throw new Error(`${custom.name} must be true/false`);
            }
            break;
          // Add validation for other types as needed
        }

        // Calculate price adjustment
        let adjustment = option.priceAdjustment || 0;
        if (option.type === 'dropdown') {
          const selected = option.options.find(opt => opt.value === custom.value);
          adjustment += selected?.priceAdjustment || 0;
        }

        return {
          name: custom.name,
          type: option.type,
          value: custom.value,
          priceAdjustment: adjustment
        };
      });

      // Calculate final price
      const totalAdjustment = validatedCustomizations.reduce(
        (sum, c) => sum + c.priceAdjustment, 0
      );
      finalPrice = product.price + totalAdjustment;
      
      // Use provided customPrice if it matches our calculation (with small tolerance)
      if (customPrice && Math.abs(customPrice - finalPrice) > 0.01) {
        console.warn(`Custom price ${customPrice} doesn't match calculated price ${finalPrice}`);
      }
    }

    // Check if identical item already in cart
    const existingIndex = user.cart.findIndex(item => {
      // Compare product IDs
      if (item.productId._id.toString() !== productId.toString()) return false;
      
      // Compare customizations if they exist
      const itemCustoms = item.customizations || [];
      const newCustoms = validatedCustomizations || [];
      
      if (itemCustoms.length !== newCustoms.length) return false;
      
      // Deep compare customizations
      const customMatch = itemCustoms.every((cust, i) => 
        cust.name === newCustoms[i].name && 
        cust.value.toString() === newCustoms[i].value.toString()
      );
      
      return customMatch;
    });

    if (existingIndex >= 0) {
      // Update quantity if exists
      user.cart[existingIndex].quantity += quantity || 1;
    } else {
      // Add new item - ensure customizations is an array of objects, not a string
      const newCartItem = {
        productId,
        quantity: quantity || 1,
        addedAt: new Date()
      };

      // Only add customizations if they exist
      if (validatedCustomizations.length > 0) {
        newCartItem.customizations = validatedCustomizations;
        newCartItem.customPrice = finalPrice;
      }

      user.cart.push(newCartItem);
    }

    await user.save();

    // Return updated cart
    const updatedUser = await User.findById(req.params.userId)
      .populate('cart.productId', 'productName price images discount');

    const cartItems = updatedUser.cart.map(item => ({
      id: item.productId._id,
      quantity: item.quantity,
      name: item.productId.productName,
      basePrice: item.productId.price,
      priceAfterDiscount: item.customPrice || item.productId.price * (1 - (item.productId.discount / 100)),
      discount: item.productId.discount,
      image: item.productId.images[0] || 'https://via.placeholder.com/150',
      customizations: item.customizations || []
    }));

    res.json(cartItems);
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(400).json({ 
      message: err.message || 'Failed to add to cart',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

app.post('/user/:userId/cart/clear', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).send('User not found');

    user.cart = [];
    await user.save();
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Order Routes
app.post('/user/:userId/checkout', async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod, couponCode } = req.body;
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
    
    // Apply coupon if provided
    let discount = 0;
    let appliedCoupon = null;
    
    if (couponCode) {
      const couponResponse = await fetch(`http://localhost:3000/user/${user._id}/apply-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode,
          cartItems: user.cart.map(item => ({
            productId: item.productId._id,
            price: item.productId.price,
            quantity: item.quantity
          }))
        })
      });
      
      const couponData = await couponResponse.json();
      
      if (couponData.success) {
        discount = couponData.coupon.discountAmount;
        appliedCoupon = couponData.coupon.code;
        
        // Mark coupon as used if single-use
        const coupon = await Discount.findOne({ code: couponCode });
        if (coupon.singleUse) {
          user.coupons = user.coupons.map(c => 
            c.code === couponCode ? { ...c.toObject(), used: true } : c
          );
          await user.save();
        }
        
        // Update coupon usage count
        coupon.usedCount += 1;
        await coupon.save();
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
      statusHistory: [{ status: 'pending' }],
      appliedCoupon
    });
    
    await order.save();
    
    // Clear user's cart
    user.cart = [];
    user.orders.push(order._id);
    
    // Mark first order discount as used if applicable
    if (appliedCoupon) {
      const coupon = await Discount.findOne({ code: appliedCoupon });
      if (coupon.userGroups?.includes('new-user')) {
        user.firstOrderDiscountUsed = true;
      }
    }
    
    await user.save();
    
    // Send order confirmation email
    // try {
    //   await transporter.sendMail({
    //     from: process.env.EMAIL_USER,
    //     to: user.email,
    //     subject: 'Your Order Confirmation',
    //     html: `<h1>Thank you for your order, ${user.firstName}!</h1>
    //            <p>Order #${order._id}</p>
    //            <p>Total: $${order.total.toFixed(2)}</p>`
    //   });
    // } catch (emailErr) {
    //   console.error('Order confirmation email failed:', emailErr);
    // }
    
    res.status(201).json(order);
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

app.post('/user/:userId/order/:orderId/complete', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    const user = await User.findById(req.params.userId);
    
    if (!order || !user) {
      console.log("failure");
      return res.status(404).json({ message: 'Order or user not found' });
    }

    console.log("success")
    
    // Mark order as completed
    // order.status = 'completed';
    // order.statusHistory.push({
    //   status: 'completed',
    //   changedAt: new Date()
    // });
    
    // await order.save();
    
    // Check if this was the user's first order
    const userOrders = await Order.countDocuments({ userId: user._id });
    if (userOrders === 1) {
      // Mark first order discount as used if applied
      if (order.appliedCoupon) {
        const coupon = await Discount.findOne({ code: order.appliedCoupon });
      
        if (coupon) {
          // Increment coupon usage count
          coupon.usedCount += 1;
          await coupon.save();
          
          // Mark as used in user's coupons if single-use
          if (coupon.singleUse) {
            const userCoupon = user.coupons.find(c => c.code === coupon.code);
            if (userCoupon) {
              userCoupon.used = true;
            }
          }
        }
        if (coupon?.userGroups?.includes('new-user')) {
          user.firstOrderDiscountUsed = true;
        }
      }
      
      // Give a thank you coupon for next purchase
      const thankYouCoupon = await Discount.findOneAndUpdate(
        { code: 'THANKYOU5', autoApply: true },
        { $inc: { maxUses: 1 } },
        { new: true }
      );

      if (!thankYouCoupon) {
        const newCoupon = await Discount.create({
          code: 'THANKYOU5',
          autoApply: true,
          type: 'percentage',
          value: 5,
          description: 'Thank you for your first order - 5% off next purchase',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          maxUses: 1000,
          isActive: true
        });
        // Add to user
        user.coupons.push({ code: newCoupon.code, discountId: newCoupon._id });
      } else {
        // Add to user
        user.coupons.push({ code: thankYouCoupon.code, discountId: thankYouCoupon._id });
      }
    }
    
    // Check if order qualifies for a high-value coupon
    if (order.total > 100 && !user.receivedHighValueCoupon) {
      let highValueCoupon = await Discount.findOneAndUpdate(
        { code: 'BIGSPENDER15', autoApply: true },
        { $inc: { maxUses: 1 } },
        { new: true }
      );

      if (!highValueCoupon) {
        highValueCoupon = await Discount.create({
          code: 'BIGSPENDER15',
          autoApply: true,
          type: 'percentage',
          value: 15,
          description: '15% off your next order - Thanks for being a valued customer!',
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          maxUses: 1000,
          isActive: true,
          minimumPurchaseAmount: 50
        });
      }

      user.coupons.push({
        code: highValueCoupon.code,
        discountId: highValueCoupon._id
      });

      user.receivedHighValueCoupon = true;
    }
    
    await user.save();
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
    console.log(err.message);
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

app.get('/products/:id/customizations', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select('customizable customizationOptions price');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({
      customizable: product.customizable,
      options: product.customizationOptions,
      basePrice: product.price
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Validate customization (for checkout)
app.post('/products/:id/validate-customization', async (req, res) => {
  try {
    const { customizations } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (!product.customizable) {
      return res.status(400).json({ message: 'Product is not customizable' });
    }
    
    // Validate each customization
    let totalPriceAdjustment = 0;
    const validatedCustomizations = [];
    
    for (const option of product.customizationOptions) {
      const customization = customizations.find(c => c.name === option.name);
      
      if (!customization && option.required) {
        return res.status(400).json({ 
          message: `Customization '${option.name}' is required` 
        });
      }
      
      if (customization) {
        // Validate based on type
        switch (option.type) {
          case 'text':
            if (typeof customization.value !== 'string') {
              return res.status(400).json({ 
                message: `Customization '${option.name}' must be text` 
              });
            }
            if (option.minLength && customization.value.length < option.minLength) {
              return res.status(400).json({ 
                message: `Customization '${option.name}' must be at least ${option.minLength} characters` 
              });
            }
            if (option.maxLength && customization.value.length > option.maxLength) {
              return res.status(400).json({ 
                message: `Customization '${option.name}' must be at most ${option.maxLength} characters` 
              });
            }
            break;
            
          case 'dropdown':
            if (!option.options.some(opt => opt.value === customization.value)) {
              return res.status(400).json({ 
                message: `Invalid option for '${option.name}'` 
              });
            }
            break;
            
          case 'checkbox':
            if (typeof customization.value !== 'boolean') {
              return res.status(400).json({ 
                message: `Customization '${option.name}' must be true/false` 
              });
            }
            break;
            
          case 'color':
          case 'image':
            // Basic validation - could add more specific checks
            if (typeof customization.value !== 'string') {
              return res.status(400).json({ 
                message: `Invalid value for '${option.name}'` 
              });
            }
            break;
        }
        
        // Calculate price adjustment
        let adjustment = option.priceAdjustment || 0;
        
        if (option.type === 'dropdown') {
          const selectedOption = option.options.find(opt => opt.value === customization.value);
          if (selectedOption && selectedOption.priceAdjustment) {
            adjustment += selectedOption.priceAdjustment;
          }
        }
        
        totalPriceAdjustment += adjustment;
        validatedCustomizations.push({
          name: option.name,
          type: option.type,
          value: customization.value,
          priceAdjustment: adjustment
        });
      }
    }
    
    res.json({
      valid: true,
      customizations: validatedCustomizations,
      totalPriceAdjustment,
      finalPrice: product.price + totalPriceAdjustment
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin Users Routes
app.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password -cart -wishlist -notifications')
      .sort({ joinDate: -1 });
      
    res.json(users);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/admin/users/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password -cart -wishlist -notifications');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Delete all orders by this user
    await Order.deleteMany({ userId: user._id });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all orders for a user
app.get('/user/:userId/orders', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ orderDate: -1 })
      .select('_id items orderDate status total');
    
    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get specific order details
app.get('/user/:userId/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order || order.userId.toString() !== req.params.userId) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add this route before the 404 handler in your server.js
app.post('/user/:userId/order', async (req, res) => {
  try {
    console.log('Incoming order data:', req.body);
    const userId = req.params.userId;
    const { items, shippingAddress, paymentMethod, appliedCoupons, subtotal, tax, discountAmount, total, status } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const shippingFee = subtotal > 50 ? 0 : 5.99;

    // Create the order
    const order = new Order({
      userId,
      items: items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      tax,
      discount: discountAmount,
      total,
      appliedCoupons,
      status: 'processing'
    });

    await order.save();

    // Update product quantities
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantityOrdered }
      });
    }

    // Clear user's cart
    user.cart = [];
    user.orders.push(order._id);
    
    // Mark coupon as used if single-use
    if (appliedCoupons.length > 0) {
      // Fetch all matching single-use coupons in one query
      const coupons = await Discount.find({
        code: { $in: appliedCoupons },
        singleUse: true
      });

      // Create a quick lookup for single-use coupon codes
      const singleUseCodes = new Set(coupons.map(c => c.code));

      // Mark matching user coupons as used
      if (Array.isArray(user.coupons)) {
        user.coupons.forEach(c => {
          if (singleUseCodes.has(c.code)) {
            c.used = true;
          }
        });
      }

      await user.save(); // persist the updates
    }
    
    await user.save();

    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add this route after the order creation route
// Cancel order
app.post('/user/:userId/order/:orderId/cancel', async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    
    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      userId: userId
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order can be cancelled (only pending or processing orders)
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage' 
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      note: 'Cancelled by user'
    });
    
    // Restore product quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantityOrdered }
      });
    }
    
    await order.save();
    
    // Send cancellation email
    try {
      const user = await User.findById(userId);
      if (user) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Order #${order._id} Cancelled`,
          html: `
            <h1>Your order has been cancelled</h1>
            <p>Order #${order._id} has been successfully cancelled.</p>
            <p>Refund will be processed within 3-5 business days.</p>
          `
        });
      }
    } catch (emailErr) {
      console.error('Failed to send cancellation email:', emailErr);
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ message: 'Failed to cancel order', error: err.message });
  }
});

// Get valid coupons for a user
app.get('/user/:userId/coupons', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const userCoupons = user.coupons || [];

    const discountIds = userCoupons.map(c => c.discountId);

    // Fetch only the discount documents from user.coupons
    const discounts = await Discount.find({
      _id: { $in: discountIds },
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).lean();

    // Merge user coupon info (used, obtainedAt) and filter based on conditions
    const couponsWithRemaining = discounts
      .map(discount => {
        const userCoupon = userCoupons.find(c => c.discountId.toString() === discount._id.toString());

        // Exclude if single-use and already used
        if (discount.singleUse && userCoupon?.used) return null;

        // Exclude if maxUses reached
        if (discount.maxUses && discount.usedCount >= discount.maxUses) return null;

        return {
          ...discount,
          used: userCoupon?.used || false,
          obtainedAt: userCoupon?.obtainedAt || null,
          remainingUses: discount.maxUses ? discount.maxUses - discount.usedCount : Infinity
        };
      })
      .filter(Boolean); // Remove nulls (filtered out coupons)

    res.json(couponsWithRemaining);
  } catch (err) {
    console.error('Error in /user/:userId/coupons:', err);
    res.status(500).json({
      message: 'Server error while fetching user coupons',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Apply coupon with proper validation
app.post('/user/:userId/apply-coupon', async (req, res) => {
  try {
    const { couponCode, cartItems } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the coupon
    const coupon = await Discount.findOne({ 
      code: couponCode,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired coupon' 
      });
    }

    // Check if user has access to this coupon
    const userHasCoupon = user.coupons.some(c => c.discountId.equals(coupon._id));
    const isGeneralCoupon = coupon.userGroups?.includes('all-users');
    const isNewUserCoupon = coupon.userGroups?.includes('new-user') && !user.firstOrderDiscountUsed;

    if (!userHasCoupon && !isGeneralCoupon && !isNewUserCoupon) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have access to this coupon' 
      });
    }

    // Check if user has already used this single-use coupon
    if (coupon.singleUse && userHasCoupon) {
      const userCoupon = user.coupons.find(c => c.discountId.equals(coupon._id));
      if (userCoupon?.used) {
        return res.status(400).json({ 
          success: false,
          message: 'This coupon has already been used' 
        });
      }
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Check minimum order amount
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return res.status(400).json({ 
        success: false,
        message: `Minimum order amount of $${coupon.minOrder} required for this coupon`,
        minOrder: coupon.minOrder
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.value / 100);
      // Apply maximum discount if specified
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'freeShipping') {
      discountAmount = 5.99; // Example shipping fee
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        minOrder: coupon.minOrder,
        singleUse: coupon.singleUse,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Apply referral coupon
app.post('/user/:userId/apply-referral', async (req, res) => {
  try {
    const { referralCode } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find referrer
    const referrer = await User.findOne({ referralCode });
    if (!referrer) return res.status(400).json({ message: 'Invalid referral code' });

    // Check if user already used a referral
    if (user.referredBy) {
      return res.status(400).json({ message: 'You already used a referral code' });
    }

    // Find referral discount (could be a system-generated coupon)
    const referralDiscount = await Discount.findOne({
      code: 'REFERRAL2023', // Example
      isActive: true
    });

    if (!referralDiscount) {
      return res.status(400).json({ message: 'Referral program not available' });
    }

    // Update user with referral info
    user.referredBy = referrer._id;
    user.coupons.push({
      code: referralDiscount.code,
      discountId: referralDiscount._id
    });
    await user.save();

    // Also give referrer a bonus
    referrer.coupons.push({
      code: 'REFERRAL_BONUS',
      discountId: referralDiscount._id
    });
    await referrer.save();

    res.json({
      success: true,
      message: 'Referral applied successfully!',
      coupon: {
        code: referralDiscount.code,
        description: referralDiscount.description
      }
    });
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

app.get('/admin/orders/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('userId', 'username email address')
      .populate('items.productId', 'name price images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    const now = new Date();
    let startDate = null;

    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const dateFilter = startDate ? { orderDate: { $gte: startDate } } : {};

    // Get daily data for the period
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Orders for this day
      const dayOrders = await Order.find({
        orderDate: { $gte: dayStart, $lte: dayEnd }
      }).populate('items.productId');
      
      // Calculate day totals
      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const dayOrdersCount = dayOrders.length;
      
      // New users for this day
      const dayNewUsers = await User.countDocuments({
        joinDate: { $gte: dayStart, $lte: dayEnd }
      });
      
      // Popular products for this day
      const productSalesMap = new Map();
      dayOrders.forEach(order => {
        order.items.forEach(item => {
          const id = item.productId?._id?.toString();
          if (!id) return;
          
          const existing = productSalesMap.get(id) || { 
            product: item.productId, 
            sales: 0 
          };
          existing.sales += item.quantityOrdered;
          productSalesMap.set(id, existing);
        });
      });
      
      const dayPopularProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map(p => ({
          productId: p.product._id,
          productName: p.product.productName,
          sales: p.sales
        }));
      
      // Categories for this day
      const categoryMap = new Map();
      productSalesMap.forEach(({ product, sales }) => {
        const cat = product.category;
        if (!cat) return;
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + sales);
      });
      
      const dayCategories = Array.from(categoryMap.entries())
        .map(([name, sales]) => ({ name, sales }));
      
      dailyData.push({
        date: new Date(currentDate),
        totalRevenue: dayRevenue,
        totalOrders: dayOrdersCount,
        newUsers: dayNewUsers,
        popularProducts: dayPopularProducts,
        categories: dayCategories
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json(dailyData);

  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ success: false, message: err.message });
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
    const { userId, rating, review, orderId, productId } = req.body;
    const product = await Product.findById(req.params.id);
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

    // Update the order item's review status
    const order = await Order.findById(orderId);
    if (order) {
      const item = order.items.find(i => i._id.toString() === productId);
      if (item) {
        item.reviewed = true;
        item.review = {
          rating,
          comment: review,
          reviewedAt: new Date()
        };
        await order.save();
      }
    }
    
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/products/:id/reviews', async (req, res) => {
  try {
    const { userId, rating, review, orderId, productId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Find existing review
    const existingReviewIndex = product.ratings.findIndex(r => r.userId.toString() === userId);
    if (existingReviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Update the review
    product.ratings[existingReviewIndex] = {
      userId,
      rating,
      review,
      createdAt: product.ratings[existingReviewIndex].createdAt,
      updatedAt: new Date()
    };
    
    // Recalculate average rating
    const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = totalRating / product.ratings.length;
    
    await product.save();

    // Update the order item's review
    const order = await Order.findById(orderId);
    if (order) {
      const item = order.items.find(i => i._id.toString() === productId);
      if (item) {
        item.review = {
          rating,
          comment: review,
          reviewedAt: new Date()
        };
        await order.save();
      }
    }
    
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/contacts', async (req, res) => {
  try {
    const { subject, message, user } = req.body;

    if (!subject || !message || !user || !user._id) {
      return res.status(400).json({ message: 'Subject, message, and user ID are required' });
    }
    console.log('Creating contact:', { subject, message, userId: user._id });

    const newContact = new Contact({
      userId: user._id,
      subject,
      messages: [
        {
          content: message,
          sender: 'user',
        },
      ],
    });

    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ message: 'Failed to create contact' });
  }
});

// Admin replies to a contact query (only once)
app.post('/contacts/:id/reply', authenticateAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.status !== 'open') {
      return res.status(400).json({ message: 'Already replied to this query' });
    }

    contact.messages.push({
      content: message,
      sender: 'admin'
    });
    contact.status = 'answered';
    await contact.save();

    res.json(contact);
  } catch (err) {
    console.error('Error replying to contact:', err);
    res.status(500).json({ message: 'Failed to reply to contact' });
  }
});

// User submits feedback (only after admin reply)
app.post('/contacts/:id/feedback', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }

    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.status !== 'answered') {
      return res.status(400).json({ message: 'Feedback only allowed after admin reply' });
    }

    contact.feedback = {
      rating,
      comment: comment || '',
      submittedAt: new Date()
    };
    contact.status = 'closed';
    await contact.save();

    res.json(contact);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

app.get('/contacts/admin', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status && ['open', 'answered', 'closed'].includes(status)) {
      filter.status = status;
    }

    const contacts = await Contact.find(filter);

    console.log(contacts)

    res.json(contacts);
  } catch (err) {
    console.error('Error fetching admin contacts:', err);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Get user's contact history
app.get('/contacts/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const contacts = await Contact.find({ userId })
      .populate('userId', 'username email')
      .sort({ updatedAt: -1 });

    res.status(200).json(contacts);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Coupon routes
app.get('/coupons/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Discount.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { maxUses: { $exists: false } },
        { maxUses: { $gt: 0 } }
      ]
    }).lean();

    const couponsWithRemaining = coupons.map(coupon => ({
      ...coupon,
      remainingUses: coupon.maxUses ? coupon.maxUses - coupon.usedCount : Infinity
    }));

    res.json(couponsWithRemaining);
  } catch (err) {
    console.error('Error in /coupons/active:', err);
    res.status(500).json({ 
      message: 'Server error while fetching active coupons',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/coupons/apply', async (req, res) => {
  try {
    const { couponCode, userId, cartItems, subtotal } = req.body;
    
    // Find the coupon
    const coupon = await Discount.findOne({ 
      code: couponCode,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired coupon' 
      });
    }

    // Check remaining uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ 
        success: false,
        message: 'This coupon has been fully redeemed' 
      });
    }

    // Check minimum order amount
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return res.status(400).json({ 
        success: false,
        message: `Minimum order amount of $${coupon.minOrder} required for this coupon`,
        minOrder: coupon.minOrder
      });
    }

    // Check product/category restrictions
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const applicableItems = cartItems.filter(item => 
        coupon.applicableProducts.includes(item.productId)
      );
      
      if (applicableItems.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'This coupon is not valid for any items in your cart'
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = subtotal * (coupon.value / 100);
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = coupon.value;
    } else if (coupon.type === 'freeShipping') {
      discountAmount = 5.99; // Example shipping fee
    }

    // For logged-in users, check if they have access to this coupon
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userHasCoupon = user.coupons.some(c => c.code === coupon.code);
        const isGeneralCoupon = coupon.userGroups?.includes('all-users');
        
        if (!userHasCoupon && !isGeneralCoupon) {
          return res.status(403).json({ 
            success: false,
            message: 'You do not have access to this coupon' 
          });
        }

        // Check if user has already used this single-use coupon
        if (coupon.singleUse && userHasCoupon) {
          const userCoupon = user.coupons.find(c => c.code === coupon.code);
          if (userCoupon?.used) {
            return res.status(400).json({ 
              success: false,
              message: 'This coupon has already been used' 
            });
          }
        }
      }
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        minOrder: coupon.minOrder,
        singleUse: coupon.singleUse,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Check coupon applicability
app.post('/coupons/check-applicability', async (req, res) => {
  try {
    const { couponCode, userId, cartItems, subtotal } = req.body;
    
    // Find the coupon
    const coupon = await Discount.findOne({ code: couponCode });
    if (!coupon) {
      return res.json({ 
        isApplicable: false,
        message: 'Coupon not found'
      });
    }

    // Check basic validity
    const now = new Date();
    if (!coupon.isActive || now < coupon.validFrom || now > coupon.validUntil) {
      return res.json({ 
        isApplicable: false,
        message: 'Coupon is not currently valid'
      });
    }

    // Check remaining uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.json({ 
        isApplicable: false,
        message: 'This coupon has been fully redeemed'
      });
    }

    // Check minimum order amount
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return res.json({ 
        isApplicable: false,
        message: `Minimum order of $${coupon.minOrder} required`
      });
    }

    // Check product restrictions
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = cartItems.some(item => 
        coupon.applicableProducts.includes(item.productId)
      );
      
      if (!hasApplicableProduct) {
        return res.json({ 
          isApplicable: false,
          message: 'No qualifying products in cart'
        });
      }
    }

    // Check category restrictions
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const productIds = cartItems.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      
      const hasApplicableCategory = products.some(product => 
        coupon.applicableCategories.includes(product.category)
      );
      
      if (!hasApplicableCategory) {
        return res.json({ 
          isApplicable: false,
          message: 'No qualifying categories in cart'
        });
      }
    }

    // For logged-in users, check if they have access
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userHasCoupon = user.coupons.some(c => c.code === coupon.code);
        const isGeneralCoupon = coupon.userGroups?.includes('all-users');
        
        if (!userHasCoupon && !isGeneralCoupon) {
          return res.json({ 
            isApplicable: false,
            message: 'You do not have access to this coupon'
          });
        }

        // Check if already used single-use coupon
        if (coupon.singleUse && userHasCoupon) {
          const userCoupon = user.coupons.find(c => c.code === coupon.code);
          if (userCoupon?.used) {
            return res.json({ 
              isApplicable: false,
              message: 'You have already used this coupon'
            });
          }
        }
      }
    }

    // If all checks pass
    res.json({ 
      isApplicable: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        minOrder: coupon.minOrder,
        singleUse: coupon.singleUse,
        maxDiscount: coupon.maxDiscount
      }
    });
  } catch (err) {
    console.error('Error checking coupon applicability:', err);
    res.status(500).json({ 
      isApplicable: false,
      message: 'Error checking coupon'
    });
  }
});

// For logged-in users to remove a coupon
app.post('/user/:userId/coupons/:couponCode/remove', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the coupon in user's list
    const userCoupon = user.coupons.find(c => c.code === req.params.couponCode);
    if (!userCoupon) {
      return res.status(404).json({ message: 'Coupon not found in user account' });
    }

    // For single-use coupons, mark as unused
    if (userCoupon.used) {
      userCoupon.used = false;
      await user.save();
    }

    res.json({ success: true });
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