const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error: ', err));

const orderSchema = new mongoose.Schema({order:
    [{
        productName: { type: String, required: true },
        quantityOrdered: { type: Number, required: true },
        price: { type: Number, required: true }
  }],
  orderDate: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    orders: [orderSchema], // Array of orders
    cart: [
      {
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        discount: { type: Number, default: 0 } // Discount is optional
      }
    ] // Array of cart items
  });

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  image: {type: String},
  category: {type: String},
});

const Order = mongoose.model('Order',userSchema);
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

app.post('/user', async (req, res) => {
  const { username, password, email, orders, cart } = req.body;
  const newUser = new User({ username, password, email,orders,cart });

  try {
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: 'Error creating user', error: err });
  }
});

app.post('/product', async (req, res) => {
  const { productName, quantity, price, discount,image,category } = req.body;
  const newProduct = new Product({ productName, quantity, price, discount, image, category });

  try {
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: 'Error creating product', error: err });
  }
});

app.post('/order', async (req, res) => {
    const { order } = req.body;
    const neworder = new Order({ order });
  
    try {
      await neworder.save();
      res.status(201).json(neworder);
    } catch (err) {
      res.status(400).json({ message: 'Error creating product', error: err });
    }
  });


app.post('/users', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ email: username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
        if (user.password !== password) {
        return res.status(400).json({ message: 'Invalid credentials' });
        }
        const { password: _, ...userData } = user.toObject();
        res.status(200).json(userData);
    } catch (err) {
      res.status(400).json({ message: 'Error fetching users', error: err });
    }
  });
  
app.get('/products', async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (err) {
      res.status(400).json({ message: 'Error fetching products', error: err });
    }
  });
  
app.get('/orders', async (req, res) => {
    try {
      const orders = await Order.find();
      res.status(200).json(orders);
    } catch (err) {
      res.status(400).json({ message: 'Error fetching orders', error: err });
    }
  });  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
