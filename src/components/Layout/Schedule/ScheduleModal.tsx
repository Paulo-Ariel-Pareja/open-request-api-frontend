import { useEffect, useState } from "react";
import { useApp } from "../../../contexts/AppContext";
import { Clock, Save, Search, X } from "lucide-react";
import { Collection, Schedule } from "../../../types";

interface RequestModalProps {
  onClose: () => void;
  onSave: (schedule: Schedule) => void;
  editingSchedule?: Schedule | null;
}

export function ScheduleModal({
  onClose,
  editingSchedule,
  onSave,
}: RequestModalProps) {
  const { collections, searchCollections } = useApp();
  const [saving, setSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    description: "",
    collections: [] as string[],
    interval: 60,
    enabled: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [collectionSearchResults, setCollectionSearchResults] = useState<
    Collection[]
  >([]);
  const [showCollectionSearch, setShowCollectionSearch] = useState(false);

  useEffect(() => {
    if (editingSchedule) {
      setScheduleForm(editingSchedule);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (editingSchedule) {
        handleUpdateSchedule({
          preventDefault: () => {},
        } as React.FormEvent);
      } else {
        handleCreateSchedule({
          preventDefault: () => {},
        } as React.FormEvent);
      }
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const schedule: Schedule = {
        id: Date.now().toString(),
        ...scheduleForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSave(schedule);
      setScheduleForm({
        name: "",
        description: "",
        collections: [],
        interval: 60,
        enabled: true,
      });
      setShowCollectionSearch(false);
      setCollectionSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error creating schedule:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      setSaving(true);
      const updatedSchedule: Schedule = {
        ...editingSchedule,
        ...scheduleForm,
        updatedAt: new Date().toISOString(),
      };

      onSave(updatedSchedule);
      setScheduleForm({
        name: "",
        description: "",
        collections: [],
        interval: 60,
        enabled: true,
      });
      setShowCollectionSearch(false);
      setCollectionSearchQuery("");
      onClose();
    } catch (error) {
      console.error("Error updating schedule:", error);
    } finally {
      setSaving(false);
    }
  };

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        const results = await searchCollections(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchCollections]);

  // Collection search for scheduler
  useEffect(() => {
    const performCollectionSearch = async () => {
      if (collectionSearchQuery.trim()) {
        const results = await searchCollections(collectionSearchQuery);
        setCollectionSearchResults(results);
      } else {
        setCollectionSearchResults(collections);
      }
    };

    const debounceTimer = setTimeout(performCollectionSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [collectionSearchQuery, searchCollections, collections]);

  const toggleCollectionInSchedule = (collectionId: string) => {
    const newCollections = scheduleForm.collections.includes(collectionId)
      ? scheduleForm.collections.filter((id) => id !== collectionId)
      : [...scheduleForm.collections, collectionId];

    setScheduleForm({ ...scheduleForm, collections: newCollections });
  };

  const removeCollectionFromSchedule = (collectionId: string) => {
    setScheduleForm({
      ...scheduleForm,
      collections: scheduleForm.collections.filter((id) => id !== collectionId),
    });
  };

  const getSelectedCollectionNames = () => {
    return collections
      .filter((c) => scheduleForm.collections.includes(c._id))
      .map((c) => c.name);
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
              <Clock size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {editingSchedule ? "Edit Schedule" : "New Schedule"}
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
                value={scheduleForm.name}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={scheduleForm.description}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-16 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={scheduleForm.interval}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    interval: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Collections ({scheduleForm.collections.length} selected)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCollectionSearch(!showCollectionSearch)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <Search size={12} />
                  <span>Browse Collections</span>
                </button>
              </div>

              {/* Selected Collections */}
              {scheduleForm.collections.length > 0 && (
                <div className="mb-3 p-3 bg-gray-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-2">
                    Selected Collections:
                  </div>
                  <div className="space-y-1">
                    {getSelectedCollectionNames().map((name, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-white">{name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            removeCollectionFromSchedule(
                              scheduleForm.collections[index]
                            )
                          }
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Search */}
              {showCollectionSearch && (
                <div className="border border-gray-600 rounded-lg p-3 bg-gray-700">
                  <div className="relative mb-3">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search collections..."
                      value={collectionSearchQuery}
                      onChange={(e) => setCollectionSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {collectionSearchResults.map((collection) => (
                      <div
                        key={collection._id}
                        className="flex items-center justify-between p-2 hover:bg-gray-600 rounded cursor-pointer"
                        onClick={() =>
                          toggleCollectionInSchedule(collection._id)
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={scheduleForm.collections.includes(
                              collection._id
                            )}
                            onChange={() =>
                              toggleCollectionInSchedule(collection._id)
                            }
                            className="w-4 h-4 text-cyan-400 bg-gray-600 border-gray-500 rounded focus:ring-cyan-400"
                          />
                          <div>
                            <div className="text-sm text-white">
                              {collection.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {collection.size} requests
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {collectionSearchResults.length === 0 &&
                      collectionSearchQuery && (
                        <div className="text-center text-gray-400 text-sm py-4">
                          No collections found
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={scheduleForm.enabled}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    enabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400"
              />
              <label htmlFor="enabled" className="text-sm text-gray-300">
                Enable schedule
              </label>
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
                editingSchedule ? handleUpdateSchedule : handleCreateSchedule
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
