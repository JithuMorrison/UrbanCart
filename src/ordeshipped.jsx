const OrderShipped = ({ order, user }) => {
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
        .tracking { background-color: #eef2ff; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your order has shipped!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${user.firstName},</p>
          <p>Your order #${order._id} has been shipped and is on its way to you.</p>
          
          <div class="tracking">
            <h3>Tracking Information</h3>
            <p><strong>Carrier:</strong> ${order.carrier}</p>
            <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
            <p>You can track your package using the carrier's website.</p>
          </div>
          
          <div class="order-details">
            <h3>Expected Delivery Date:</h3>
            <p>${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            
            <h3>Shipping Address:</h3>
            <p>${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}</p>
          </div>
          
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

export default OrderShipped;