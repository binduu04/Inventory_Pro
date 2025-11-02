import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const CustomAlert = ({ 
  isOpen, 
  onClose, 
  type = 'success', // 'success', 'error', 'info', 'warning'
  title, 
  message,
  autoClose = true,
  autoCloseDelay = 5000 
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const alertStyles = {
    success: {
      bg: 'bg-white',
      border: 'border-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      iconBg: 'bg-green-100',
      titleColor: 'text-green-800',
      messageColor: 'text-black-700'
    },
    error: {
      bg: 'bg-white',
      border: 'border-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      iconBg: 'bg-red-100',
      titleColor: 'text-red-800',
      messageColor: 'text-black-700'
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-800',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
      titleColor: 'text-blue-800',
      messageColor: 'text-black-700'
    },
    warning: {
      bg: 'bg-white',
      border: 'border-yellow-800',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      iconBg: 'bg-yellow-100',
      titleColor: 'text-yellow-800',
      messageColor: 'text-black-700'
    }
  };

  const style = alertStyles[type] || alertStyles.success;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 max-w-md min-w-[320px]`}>
        <div className="flex items-start gap-3">
          <div className={`${style.iconBg} rounded-full p-1.5 flex-shrink-0`}>
            {style.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={`font-semibold text-sm ${style.titleColor} mb-1`}>
                {title}
              </h3>
            )}
            {message && (
              <p className={`text-sm ${style.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;