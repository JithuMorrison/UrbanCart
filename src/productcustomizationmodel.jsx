import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiImage, FiType, FiDroplet, FiList, FiToggleRight } from 'react-icons/fi';

const ProductCustomizationModal = ({ 
  product, 
  onClose, 
  onAddToCart,
  initialCustomizations = [],
  initialQuantity = 1
}) => {
  const [customizations, setCustomizations] = useState([]);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [price, setPrice] = useState(product.price);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only initialize if we have customization options and haven't already initialized
    if (product.customizationOptions && customizations.length === 0) {
      const initialized = product.customizationOptions.map(option => {
        const existing = initialCustomizations.find(c => c.name === option.name);
        return {
          name: option.name,
          type: option.type,
          value: existing ? existing.value : 
                option.default || 
                (option.type === 'checkbox' ? false : ''),
          priceAdjustment: existing ? existing.priceAdjustment : 0,
          optionData: option
        };
      });
      setCustomizations(initialized);
      
      // Calculate initial price
      const initialAdjustment = initialized.reduce((sum, c) => {
        return sum + (c.priceAdjustment || 0) + (c.optionData.priceAdjustment || 0);
      }, 0);
      setPrice(product.price + initialAdjustment);
    }
  }, [product, initialCustomizations]); // Only re-run when these change

  const handleCustomizationChange = (index, value) => {
    const updated = [...customizations];
    updated[index].value = value;
    
    // Calculate price adjustment for dropdowns
    if (updated[index].type === 'dropdown') {
      const selectedOption = updated[index].optionData.options.find(
        opt => opt.value === value
      );
      updated[index].priceAdjustment = selectedOption?.priceAdjustment || 0;
    }
    
    setCustomizations(updated);
    updatePrice(updated);
  };

  const updatePrice = (currentCustomizations) => {
    let adjustment = 0;
    currentCustomizations.forEach(c => {
      adjustment += c.priceAdjustment || 0;
      if (c.optionData.priceAdjustment) {
        adjustment += c.optionData.priceAdjustment;
      }
    });
    setPrice(product.price + adjustment);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      const missingRequired = customizations.filter(
        c => c.optionData.required && !c.value
      );
      
      if (missingRequired.length > 0) {
        throw new Error(`Please fill in: ${missingRequired.map(c => c.name).join(', ')}`);
      }
      
      // Prepare customizations for API
      const apiCustomizations = customizations
        .filter(c => c.value !== '')
        .map(c => ({
          name: c.name,
          value: c.value,
          priceAdjustment: c.priceAdjustment
        }));
      
      // Call parent handler
      await onAddToCart({
        productId: product._id,
        quantity,
        customizations: apiCustomizations,
        customPrice: price
      });
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCustomizationInput = (customization, index) => {
    const { type, optionData, value } = customization;
    
    switch (type) {
      case 'text':
        return (
          <div className="mt-1">
            <input
              type="text"
              value={value}
              onChange={(e) => handleCustomizationChange(index, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              maxLength={optionData.maxLength}
              minLength={optionData.minLength}
              required={optionData.required}
            />
            {optionData.description && (
              <p className="mt-1 text-sm text-gray-500">{optionData.description}</p>
            )}
          </div>
        );
        
      case 'dropdown':
        return (
          <div className="mt-1">
            <select
              value={value}
              onChange={(e) => handleCustomizationChange(index, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required={optionData.required}
            >
              <option value="">Select an option</option>
              {optionData.options.map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.display || opt.value} 
                  {opt.priceAdjustment ? ` (+$${opt.priceAdjustment.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => handleCustomizationChange(index, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2">
                {optionData.description || optionData.name}
                {optionData.priceAdjustment ? ` (+$${optionData.priceAdjustment.toFixed(2)})` : ''}
              </span>
            </label>
          </div>
        );
        
      case 'color':
        return (
          <div className="mt-1">
            <div className="flex flex-wrap gap-2">
              {optionData.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCustomizationChange(index, opt.value)}
                  className={`w-8 h-8 rounded-full border-2 ${value === opt.value ? 'border-blue-500' : 'border-transparent'}`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.display || opt.value}
                />
              ))}
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className="mt-1">
            <div className="flex flex-wrap gap-2">
              {optionData.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleCustomizationChange(index, opt.value)}
                  className={`p-1 border-2 rounded-md ${value === opt.value ? 'border-blue-500' : 'border-transparent'}`}
                >
                  <img 
                    src={opt.value} 
                    alt={opt.display || `Option ${i+1}`}
                    className="w-16 h-16 object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'text': return <FiType className="inline mr-1" />;
      case 'image': return <FiImage className="inline mr-1" />;
      case 'color': return <FiDroplet className="inline mr-1" />;
      case 'dropdown': return <FiList className="inline mr-1" />;
      case 'checkbox': return <FiToggleRight className="inline mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Customize {product.productName}</h2>
              <p className="text-gray-600">Personalize this product to your liking</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="mt-6 space-y-6">
            {customizations.map((customization, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-700">
                  {getTypeIcon(customization.type)}
                  {customization.name}
                  {customization.optionData.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {customization.priceAdjustment > 0 && (
                    <span className="ml-2 text-blue-600">
                      (+${customization.priceAdjustment.toFixed(2)})
                    </span>
                  )}
                </label>
                {renderCustomizationInput(customization, index)}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center">
              <label className="mr-2 text-sm font-medium text-gray-700">Quantity:</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center"
              />
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Base price: ${product.price.toFixed(2)}
              </div>
              <div className="text-lg font-bold">
                Total: ${(price * quantity).toFixed(2)}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 text-red-600 text-sm">{error}</div>
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add to Cart'}
              <FiCheck className="inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCustomizationModal;