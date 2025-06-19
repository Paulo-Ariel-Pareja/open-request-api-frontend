import React from 'react';
import { Menu, Globe, Download, Upload, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, activeEnvironments, requests, collections, environments } = useApp();

  const exportData = () => {
    return JSON.stringify({
      requests,
      collections,
      environments,
    });
  };
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <span>API Tester</span>
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {activeEnvironments.length > 0 && (
          <div className="flex items-center space-x-2">
            {activeEnvironments.map((env, index) => (
              <div key={env._id} className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">
                  {env.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}