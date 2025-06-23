import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useApp } from "../../../contexts/AppContext";
import { Environment } from "../../../types";
import { EnvironmentModal } from "./EnvironmentModal";

export function EnvironmentTab() {
  const {
    environments,
    environmentsLoading,
    deleteEnvironment,
    toggleEnvironmentOnCache,
  } = useApp();

  const [showNewEnvironmentForm, setShowNewEnvironmentForm] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);

  const startEditingEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment);
    setShowNewEnvironmentForm(true);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-20rem)]">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={() => {
            setShowNewEnvironmentForm(true);
          }}
          className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center justify-center space-x-2 text-sm"
        >
          <Plus size={16} />
          <span>New Environment</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {environmentsLoading ? (
          <div className="p-4 text-center text-gray-400">
            Loading environments...
          </div>
        ) : (
          <div className="space-y-2">
            {environments.map((environment) => (
              <div key={environment._id} className="p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleEnvironmentOnCache(environment._id)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        environment.isActive
                          ? "bg-green-500 border-green-500"
                          : "border-gray-500"
                      }`}
                    >
                      {environment.isActive && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </button>
                    <span className="text-white font-medium">
                      {environment.name}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEditingEnvironment(environment)}
                      className="p-1 text-gray-400 hover:text-cyan-400"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => deleteEnvironment(environment._id)}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {Object.keys(environment.variables).length} variables
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Environment Form Modal */}
      {showNewEnvironmentForm && (
        <EnvironmentModal
          editingEnvironment={editingEnvironment}
          onClose={() => {
            setShowNewEnvironmentForm(false);
            setEditingEnvironment(null);
          }}
        />
      )}
    </div>
  );
}
