import { useState } from "react";
import { useApp } from "../../../contexts/AppContext";

interface RequestModalProps {
  onClose: () => void;
  collectionId: string;
}

export function RequestModal({ onClose, collectionId }: RequestModalProps) {
  const { setActiveRequest, saveRequest } = useApp();
  const [newRequest, setNewRequest] = useState({
    name: "",
    method: "GET" as const,
    url: "",
  });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-white mb-4">New Request</h3>
        <form onSubmit={handleCreateRequest}>
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
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
