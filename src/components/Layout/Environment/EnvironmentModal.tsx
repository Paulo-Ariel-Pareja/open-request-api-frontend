import { useEffect, useState } from "react";
import { useApp } from "../../../contexts/AppContext";
import { Globe, Plus, Save, Trash2, X } from "lucide-react";
import { Environment } from "../../../types";

interface EnvironmentModalProps {
  editingEnvironment: Environment | null;
  onClose: () => void;
}

export function EnvironmentModal({
  onClose,
  editingEnvironment,
}: EnvironmentModalProps) {
  const { saveEnvironment, updateEnvironment } = useApp();
  const [saving, setSaving] = useState(false);
  const [environmentForm, setEnvironmentForm] = useState({
    name: "",
    variables: [{ key: "", value: "" }],
  });

  useEffect(() => {
    if (editingEnvironment) {
      setEnvironmentForm({
        name: editingEnvironment.name,
        variables: Object.entries(editingEnvironment.variables).map(
          ([key, value]) => ({
            key,
            value,
          })
        ),
      });
    }
  }, []);

  const updateEnvironmentVariable = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newVariables = [...environmentForm.variables];
    newVariables[index][field] = value;
    setEnvironmentForm({ ...environmentForm, variables: newVariables });
  };

  const addEnvironmentVariable = () => {
    setEnvironmentForm({
      ...environmentForm,
      variables: [...environmentForm.variables, { key: "", value: "" }],
    });
  };

  const removeEnvironmentVariable = (index: number) => {
    const newVariables = environmentForm.variables.filter(
      (_, i) => i !== index
    );
    if (newVariables.length === 0) {
      newVariables.push({ key: "", value: "" });
    }
    setEnvironmentForm({ ...environmentForm, variables: newVariables });
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const variables: Record<string, string> = {};
      environmentForm.variables.forEach((variable) => {
        if (variable.key.trim()) {
          variables[variable.key] = variable.value;
        }
      });

      await saveEnvironment({
        name: environmentForm.name,
        variables,
      });

      setEnvironmentForm({ name: "", variables: [{ key: "", value: "" }] });
      onClose();
    } catch (error) {
      console.error("Error creating environment:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnvironment) return;
    setSaving(true);
    try {
      const variables: Record<string, string> = {};
      environmentForm.variables.forEach((variable) => {
        if (variable.key.trim()) {
          variables[variable.key] = variable.value;
        }
      });

      await updateEnvironment(editingEnvironment._id, {
        name: environmentForm.name,
        variables,
      });

      setEnvironmentForm({ name: "", variables: [{ key: "", value: "" }] });
      editingEnvironment = null;
      onClose();
    } catch (error) {
      console.error("Error updating environment:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (editingEnvironment) {
        handleUpdateEnvironment({
          preventDefault: () => {},
        } as React.FormEvent);
      } else {
        handleCreateEnvironment({
          preventDefault: () => {},
        } as React.FormEvent);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {editingEnvironment ? "Edit Environment" : "New Environment"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={environmentForm.name}
                onChange={(e) =>
                  setEnvironmentForm({
                    ...environmentForm,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Variables
                </label>
                <button
                  type="button"
                  onClick={addEnvironmentVariable}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <Plus size={12} />
                  <span>Add Variable</span>
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {environmentForm.variables.map((variable, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={variable.key}
                      onChange={(e) =>
                        updateEnvironmentVariable(index, "key", e.target.value)
                      }
                      placeholder="Variable name"
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                    <input
                      type="text"
                      value={variable.value}
                      onChange={(e) =>
                        updateEnvironmentVariable(
                          index,
                          "value",
                          e.target.value
                        )
                      }
                      placeholder="Variable value"
                      className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvironmentVariable(index)}
                      className="p-1 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-500 bg-gray-900 p-2 rounded">
            💡 <strong>Tip:</strong> Press{" "}
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd>{" "}
            to cancel,
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs ml-1">
              Ctrl+Enter
            </kbd>{" "}
            to save
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={
                editingEnvironment
                  ? handleUpdateEnvironment
                  : handleCreateEnvironment
              }
              disabled={saving}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Save size={16} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
