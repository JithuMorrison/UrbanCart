import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './header'
import Homepg from './homepg'
import Footer from './footer'
import UserDashboard from './userdash'
import AdminDashboard from './admindash'
import LoginPage from './login';
import RegisterPage from './register';
import Cart from './cart';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Homepg />} />
        <Route path="/userdash" element={<UserDashboard />} />
        <Route path="/admindash" element={<AdminDashboard />} />
        <Route path='/login' element={<LoginPage/>} />
        <Route path='/register' element={<RegisterPage/>} />
        <Route path='/cart' element={<Cart/>} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
