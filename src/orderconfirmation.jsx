const OrderConfirmation = ({ order, user }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .order-details { background-color: white; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank you for your order, ${user.firstName}!</h1>
        </div>
        
        <div class="content">
          <p>Your order has been confirmed and is being processed. Here are your order details:</p>
          
          <div class="order-details">
            <h2>Order #${order._id}</h2>
            <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            
            <h3>Shipping Address:</h3>
            <p>${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}</p>
          </div>
          
          <p>You can track your order status at any time by visiting our website.</p>
          <p>If you have any questions, please contact our customer support.</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} TrendyShop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default OrderConfirmation;