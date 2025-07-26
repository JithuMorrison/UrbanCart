import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiDollarSign, FiShoppingBag, FiUsers, FiPieChart } from 'react-icons/fi';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:3000/admin/analytics?period=${period}`, {
        headers: { 'x-admin-auth': 'your-admin-secret' }
      });
      const data = await response.json();
      setAnalytics(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setLoading(false);
    }
  };

  const getTotal = (field) => {
    return analytics.reduce((sum, item) => sum + item[field], 0);
  };

  const getRevenueChartData = () => {
    const labels = analytics.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = analytics.map(item => item.totalRevenue);
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getOrdersChartData = () => {
    const labels = analytics.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = analytics.map(item => item.totalOrders);
    
    return {
      labels,
      datasets: [
        {
          label: 'Orders',
          data,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getUsersChartData = () => {
    const labels = analytics.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = analytics.map(item => item.newUsers);
    
    return {
      labels,
      datasets: [
        {
          label: 'New Users',
          data,
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const getCategoriesChartData = () => {
    if (analytics.length === 0) return { labels: [], datasets: [] };
    
    // Aggregate categories across all days
    const categoryMap = {};
    analytics.forEach(day => {
      day.categories.forEach(cat => {
        if (!categoryMap[cat.name]) {
          categoryMap[cat.name] = 0;
        }
        categoryMap[cat.name] += cat.sales;
      });
    });
    
    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    
    // Generate colors
    const backgroundColors = labels.map((_, i) => {
      const hue = (i * 137.508) % 360; // Golden angle approximation
      return `hsla(${hue}, 70%, 60%, 0.7)`;
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }
      ]
    };
  };

  const getProductsChartData = () => {
    if (analytics.length === 0) return { labels: [], datasets: [] };
    
    // Aggregate products across all days
    const productMap = {};
    analytics.forEach(day => {
      day.popularProducts.forEach(prod => {
        if (!productMap[prod.productId]) {
          productMap[prod.productId] = {
            name: 'Loading...',
            sales: 0
          };
        }
        productMap[prod.productId].sales += prod.sales;
      });
    });
    
    // Sort by sales and take top 5
    const sortedProducts = Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    
    const labels = sortedProducts.map(prod => prod.name);
    const data = sortedProducts.map(prod => prod.sales);
    
    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data,
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Last Week
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Last Month
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold">${getTotal('totalRevenue').toFixed(2)}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiDollarSign className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold">{getTotal('totalOrders')}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiShoppingBag className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">New Users</p>
              <h3 className="text-2xl font-bold">{getTotal('newUsers')}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiUsers className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Avg. Order Value</p>
              <h3 className="text-2xl font-bold">
                ${(getTotal('totalRevenue') / getTotal('totalOrders') || 0).toFixed(2)}
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiBarChart2 className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-2">
        <button 
          onClick={() => setSelectedMetric('revenue')}
          className={`px-4 py-2 rounded-lg ${selectedMetric === 'revenue' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Revenue
        </button>
        <button 
          onClick={() => setSelectedMetric('orders')}
          className={`px-4 py-2 rounded-lg ${selectedMetric === 'orders' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Orders
        </button>
        <button 
          onClick={() => setSelectedMetric('users')}
          className={`px-4 py-2 rounded-lg ${selectedMetric === 'users' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Users
        </button>
        <button 
          onClick={() => setSelectedMetric('categories')}
          className={`px-4 py-2 rounded-lg ${selectedMetric === 'categories' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Categories
        </button>
        <button 
          onClick={() => setSelectedMetric('products')}
          className={`px-4 py-2 rounded-lg ${selectedMetric === 'products' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Products
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : analytics.length === 0 ? (
        <div className="text-center py-8">
          <FiBarChart2 className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No analytics data available</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {selectedMetric === 'revenue' && 'Revenue Trend'}
            {selectedMetric === 'orders' && 'Orders Trend'}
            {selectedMetric === 'users' && 'New Users Trend'}
            {selectedMetric === 'categories' && 'Sales by Category'}
            {selectedMetric === 'products' && 'Top Selling Products'}
          </h2>
          
          <div className="h-96">
            {selectedMetric === 'revenue' && <Line data={getRevenueChartData()} />}
            {selectedMetric === 'orders' && <Line data={getOrdersChartData()} />}
            {selectedMetric === 'users' && <Line data={getUsersChartData()} />}
            {selectedMetric === 'categories' && <Pie data={getCategoriesChartData()} />}
            {selectedMetric === 'products' && <Bar data={getProductsChartData()} />}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <div className="space-y-4">
            {analytics.slice(0, 3).map(day => (
              <div key={day._id} className="border-b pb-4">
                <h3 className="font-medium mb-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-gray-600">{day.totalOrders} orders</p>
                <p className="text-gray-600">${day.totalRevenue.toFixed(2)} revenue</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Categories</h2>
          <div className="space-y-4">
            {getCategoriesChartData().labels.slice(0, 5).map((label, i) => (
              <div key={i} className="border-b pb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{label}</span>
                  <span>${getCategoriesChartData().datasets[0].data[i].toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{
                      width: `${(getCategoriesChartData().datasets[0].data[i] / Math.max(...getCategoriesChartData().datasets[0].data) * 100)}%`,
                      backgroundColor: getCategoriesChartData().datasets[0].backgroundColor[i]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;