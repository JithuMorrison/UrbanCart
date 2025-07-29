import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiDollarSign, FiShoppingBag, FiUsers, FiPieChart } from 'react-icons/fi';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3000/admin/analytics?period=${period}`, {
        headers: { 
          'x-user-id': localStorage.getItem('userId'),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for summary cards
  const getTotalRevenue = () => {
    return analytics.reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
  };

  const getTotalOrders = () => {
    return analytics.reduce((sum, day) => sum + (day.totalOrders || 0), 0);
  };

  const getTotalNewUsers = () => {
    return analytics.reduce((sum, day) => sum + (day.newUsers || 0), 0);
  };

  const getAvgOrderValue = () => {
    const totalOrders = getTotalOrders();
    return totalOrders > 0 ? getTotalRevenue() / totalOrders : 0;
  };

  // Chart data functions
  const getRevenueChartData = () => {
    const labels = analytics.map(day => 
      new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = analytics.map(day => day.totalRevenue || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue ($)',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          tension: 0.1
        }
      ]
    };
  };

  const getOrdersChartData = () => {
    const labels = analytics.map(day => 
      new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = analytics.map(day => day.totalOrders || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Orders',
          data,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
          tension: 0.1
        }
      ]
    };
  };

  const getUsersChartData = () => {
    const labels = analytics.map(day => 
      new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    const data = analytics.map(day => day.newUsers || 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'New Users',
          data,
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
          tension: 0.1
        }
      ]
    };
  };

  const getCategoriesChartData = () => {
    // Aggregate categories across all days
    const categoryMap = {};
    analytics.forEach(day => {
      day.categories?.forEach(cat => {
        if (cat && cat.name) {
          categoryMap[cat.name] = (categoryMap[cat.name] || 0) + (cat.sales || 0);
        }
      });
    });
    
    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    
    // Generate colors
    const backgroundColors = labels.map((_, i) => {
      const hue = (i * 137.508) % 360;
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
    // Aggregate products across all days
    const productMap = {};
    analytics.forEach(day => {
      day.popularProducts?.forEach(prod => {
        if (prod && prod.productId) {
          const id = prod.productId._id || prod.productId;
          if (!productMap[id]) {
            productMap[id] = {
              name: prod.productName || 'Unknown Product',
              sales: 0
            };
          }
          productMap[id].sales += prod.sales || 0;
        }
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

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += selectedMetric === 'revenue' 
                ? `$${context.parsed.y.toFixed(2)}` 
                : context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Last Week
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Last Month
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold">${getTotalRevenue().toFixed(2)}</h3>
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
              <h3 className="text-2xl font-bold">{getTotalOrders()}</h3>
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
              <h3 className="text-2xl font-bold">{getTotalNewUsers()}</h3>
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
                ${getAvgOrderValue().toFixed(2)}
              </h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiBarChart2 className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setSelectedMetric('revenue')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMetric === 'revenue' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Revenue
        </button>
        <button 
          onClick={() => setSelectedMetric('orders')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMetric === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Orders
        </button>
        <button 
          onClick={() => setSelectedMetric('users')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMetric === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Users
        </button>
        <button 
          onClick={() => setSelectedMetric('categories')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMetric === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Categories
        </button>
        <button 
          onClick={() => setSelectedMetric('products')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedMetric === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Products
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading analytics...</p>
        </div>
      ) : analytics.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <FiBarChart2 className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No analytics data available for the selected period</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {selectedMetric === 'revenue' && 'Revenue Trend'}
              {selectedMetric === 'orders' && 'Orders Trend'}
              {selectedMetric === 'users' && 'New Users Trend'}
              {selectedMetric === 'categories' && 'Sales by Category'}
              {selectedMetric === 'products' && 'Top Selling Products'}
            </h2>
            
            <div className="h-96">
              {selectedMetric === 'revenue' && (
                <Line data={getRevenueChartData()} options={chartOptions} />
              )}
              {selectedMetric === 'orders' && (
                <Line data={getOrdersChartData()} options={chartOptions} />
              )}
              {selectedMetric === 'users' && (
                <Line data={getUsersChartData()} options={chartOptions} />
              )}
              {selectedMetric === 'categories' && (
                <Pie data={getCategoriesChartData()} options={chartOptions} />
              )}
              {selectedMetric === 'products' && (
                <Bar data={getProductsChartData()} options={chartOptions} />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Days</h2>
              <div className="space-y-4">
                {analytics.slice().reverse().slice(0, 3).map((day, index) => (
                  <div key={index} className="border-b pb-4">
                    <h3 className="font-medium mb-2">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <p className="text-gray-600">
                      <span className="font-medium">{day.totalOrders || 0}</span> orders
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">${(day.totalRevenue || 0).toFixed(2)}</span> revenue
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">{day.newUsers || 0}</span> new users
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Top Categories</h2>
              <div className="space-y-4">
                {Object.entries(
                  analytics.reduce((acc, day) => {
                    day.categories?.forEach(cat => {
                      if (cat && cat.name) {
                        acc[cat.name] = (acc[cat.name] || 0) + (cat.sales || 0);
                      }
                    });
                    return acc;
                  }, {})
                )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, sales], i) => (
                  <div key={i} className="border-b pb-4">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{name}</span>
                      <span>${sales.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{
                          width: `${(sales / 
                            Math.max(...Object.values(
                              analytics.reduce((acc, day) => {
                                day.categories?.forEach(cat => {
                                  if (cat && cat.name) {
                                    acc[cat.name] = (acc[cat.name] || 0) + (cat.sales || 0);
                                  }
                                });
                                return acc;
                              }, {})
                            )) * 100)}%`,
                          backgroundColor: `hsla(${(i * 137.508) % 360}, 70%, 60%, 0.7)`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;