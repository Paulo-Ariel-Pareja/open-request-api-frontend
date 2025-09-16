import { useState, useEffect } from 'react';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import { useTabs } from '../../contexts/TabContext';

export function TabRestoreNotification() {
  const { hasStoredTabs, clearAllTabs } = useTabs();
  const [showNotification, setShowNotification] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  useEffect(() => {
    // Solo mostrar la notificación una vez por sesión y si hay tabs almacenados
    if (hasStoredTabs && !hasShownOnce) {
      setShowNotification(true);
      setHasShownOnce(true);
      
      // Auto-hide después de 5 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [hasStoredTabs, hasShownOnce]);

  const handleClearTabs = () => {
    clearAllTabs();
    setShowNotification(false);
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 max-w-sm z-50 animate-slide-in">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <RotateCcw size={20} className="text-cyan-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white mb-1">
            Tabs Restored
          </h4>
          <p className="text-xs text-gray-300 mb-3">
            Your previous tabs have been restored from your last session.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleDismiss}
              className="px-2 py-1 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Got it
            </button>
            <button
              onClick={handleClearTabs}
              className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded hover:bg-gray-500 flex items-center space-x-1"
            >
              <Trash2 size={12} />
              <span>Start Fresh</span>
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}