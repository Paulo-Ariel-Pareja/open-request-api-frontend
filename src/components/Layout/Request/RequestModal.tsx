import { useState } from "react";
import { useApp } from "../../../contexts/AppContext";
import { Globe, Save, X } from "lucide-react";

interface RequestModalProps {
  onClose: () => void;
  collectionId: string;
}

export function RequestModal({ onClose, collectionId }: RequestModalProps) {
  const { setActiveRequest, saveRequest } = useApp();
  const [saving, setSaving] = useState(false);
  const [newRequest, setNewRequest] = useState({
    name: "",
    method: "GET" as const,
    url: "",
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleCreateRequest({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const savedRequest = await saveRequest(collectionId, {
        ...newRequest,
        headers: {},
        body: "",
        bodyType: "none",
        preScript: "",
        postScript: "",
        tests: "",
      });
      setActiveRequest(savedRequest);
      setNewRequest({ name: "", method: "GET", url: "" });
      onClose();
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setSaving(false);
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
            <h2 className="text-xl font-semibold text-white">New Request</h2>
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
          {/* HERE OLD CONTENT */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newRequest.name}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Method
              </label>
              <select
                value={newRequest.method}
                onChange={(e) =>
                  setNewRequest({
                    ...newRequest,
                    method: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                URL
              </label>
              <input
                type="text"
                value={newRequest.url}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, url: e.target.value })
                }
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
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
              onClick={handleCreateRequest}
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
