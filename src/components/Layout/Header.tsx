import { useState } from "react";
import { Menu, Globe } from "lucide-react";
import { useApp } from "../../contexts/AppContext";

export function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, activeEnvironments } =
    useApp();
  const [hoveredEnv, setHoveredEnv] = useState<string | null>(null);

  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex">
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
          <span>Open Request API</span>
        </h1>
      </div>

      <div className="flex items-center space-x-4 ml-24">
        {activeEnvironments.length > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 px-3 py-1">
              <span className="text-green-400 text-sm font-medium">
                Environments activated:
              </span>
            </div>
            {activeEnvironments.map((env) => (
              <div
                key={env._id}
                className="relative flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg cursor-help"
                onMouseEnter={() => setHoveredEnv(env._id)}
                onMouseLeave={() => setHoveredEnv(null)}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">
                  {env.name}
                </span>

                {/* Tooltip */}
                {hoveredEnv === env._id && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3 w-[calc(100vh-15rem)]">
                    <div className="text-xs font-medium text-gray-300 mb-2">
                      Environment Variables:
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {Object.keys(env.variables).length === 0 ? (
                        <div className="text-xs text-gray-500 italic">
                          No variables defined
                        </div>
                      ) : (
                        Object.entries(env.variables).map(([key, value]) => (
                          <div key={key} className="flex items-start space-x-2 text-xs">
                            <span className="text-cyan-400 font-mono font-medium min-w-0 flex-shrink-0">
                              {key}:
                            </span>
                            <span className="text-gray-300 break-all font-mono">
                              {value || '""'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    {Object.keys(env.variables).length > 0 && (
                      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
                        💡 Use {`{{variableName}}`} in your requests
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}