import { useState, useEffect } from "react";
import { X, Save, Folder } from "lucide-react";
import { Collection } from "../../../types";

interface CollectionModalProps {
  collection?: Collection;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (
    collection: Omit<Collection, "_id" | "size" | "createdAt">
  ) => Promise<Collection>;
  onUpdate?: (updates: { name: string; description: string }) => Promise<void>;
}

export function CollectionModal({
  collection,
  isOpen,
  onClose,
  onSave,
  onUpdate,
}: CollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>(
    {}
  );

  useEffect(() => {
    if (isOpen && collection) {
      setName(collection.name);
      setDescription(collection.description || "");
      setErrors({});
    }
  }, [isOpen, collection]);

  useEffect(() => {
    validateForm();
  }, [name, description]);

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Collection name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Collection name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Collection name must be less than 100 characters";
    }

    if (description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (onUpdate) {
        await onUpdate({
          name: name.trim(),
          description: description.trim(),
        });
      }
      if (onSave) {
        await onSave({
          name: name.trim(),
          description: description.trim(),
        });
      }
      setName("");
      setDescription("");
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error create/update collection:", error);
      setErrors({
        name: "Failed to create/update collection. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  const hasChanges =
    name.trim() !== collection?.name ||
    description.trim() !== collection?.description;

  if (!isOpen) return null;

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
              <Folder size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {collection ? "Edit Collection" : "Create Collection"}
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
          {/* Collection Name */}
          <div>
            <label
              htmlFor="collection-name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Collection Name *
            </label>
            <input
              id="collection-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-cyan-500 focus:border-cyan-500"
              }`}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/100 characters
            </p>
          </div>

          {/* Collection Description */}
          <div>
            <label
              htmlFor="collection-description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter collection description (optional)"
              rows={3}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.description
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-cyan-500 focus:border-cyan-500"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/500 characters
            </p>
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
          <div className="text-sm text-gray-400">
            {hasChanges ? (
              <span className="text-yellow-400">• Unsaved changes</span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges || Object.keys(errors).length > 0}
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
