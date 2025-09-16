import { useState } from 'react';
import { MoreVertical, Trash2, X } from 'lucide-react';
import { useTabs } from '../../contexts/TabContext';

export function TabOptions() {
  const [showMenu, setShowMenu] = useState(false);
  const { clearAllTabs, tabs } = useTabs();

  const handleClearAllTabs = () => {
    if (confirm('Are you sure you want to close all tabs and clear stored tabs? This action cannot be undone.')) {
      clearAllTabs();
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-3 text-white bg-cyan-500 hover:bg-cyan-600 border-l border-gray-700"
        title="Tab options"
      >
        <MoreVertical size={14} />
      </button>

      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 min-w-[180px] mt-1">
            <div className="py-1">
              <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-600">
                {tabs.length} tab{tabs.length !== 1 ? 's' : ''} open
              </div>
              <button
                onClick={handleClearAllTabs}
                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
              >
                <Trash2 size={14} />
                <span>Clear All Tabs</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}