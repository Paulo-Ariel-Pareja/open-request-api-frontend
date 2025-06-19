import { useState, useEffect } from "react";
import {
  Plus,
  Folder,
  Play,
  Globe,
  ChevronRight,
  ChevronDown,
  Edit2,
  Save,
  X,
  Trash2,
  Power,
  PowerOff,
  FolderPlus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Search,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useStorage } from "../../hooks/useStorage";
import { Collection, Environment, Schedule } from "../../types";

export function Sidebar() {
  const {
    activeRequest,
    setActiveRequest,
    sidebarCollapsed,
    activeTab,
    setActiveTab,
    activeEnvironments,
    setActiveEnvironments,
    // Data from context
    collections,
    collectionDetails,
    environments,
    collectionsLoading,
    environmentsLoading,
    loadCollectionDetails,
    searchCollections,
    saveCollection,
    updateCollection,
    deleteCollection,
    saveRequest,
    updateRequest,
    deleteRequest,
    saveEnvironment,
    toggleEnvironmentOnCache,
    updateEnvironment,
    deleteEnvironment,
  } = useApp();

  const { schedules, scheduleExecutions, saveSchedule, deleteSchedule } =
    useStorage();

  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set()
  );
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(
    new Set()
  );
  const [editingEnvironment, setEditingEnvironment] = useState<string | null>(
    null
  );
  const [editingEnvironmentData, setEditingEnvironmentData] =
    useState<Environment | null>(null);
  const [editingCollection, setEditingCollection] = useState<string | null>(
    null
  );
  const [editingCollectionData, setEditingCollectionData] =
    useState<Collection | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [editingScheduleData, setEditingScheduleData] =
    useState<Schedule | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const timeoutId = setTimeout(async () => {
        try {
          const results = await searchCollections(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, searchCollections]);

  const createNewCollection = async () => {
    try {
      const newCollection = await saveCollection({
        name: "New Collection",
        description: "",
      });
      setExpandedCollections((prev) => new Set([...prev, newCollection._id]));
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  const createNewRequestInCollection = async (collectionId: string) => {
    try {
      const newRequest = await saveRequest(collectionId, {
        name: "New Request",
        method: "GET",
        url: "",
        headers: {},
        body: "",
        bodyType: "none",
        preScript: "",
        postScript: "",
        tests: "",
      });

      setActiveRequest(newRequest);
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const createNewEnvironment = async () => {
    try {
      await saveEnvironment({
        name: "New Environment",
        variables: {},
      });
    } catch (error) {
      console.error("Error creating environment:", error);
    }
  };

  const createNewSchedule = () => {
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      name: "New Schedule",
      description: "",
      collections: [],
      interval: 60,
      enabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSchedule(newSchedule);
    setEditingSchedule(newSchedule.id);
    setEditingScheduleData(newSchedule);
  };

  const toggleCollection = async (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
      // Load collection details when expanding
      try {
        await loadCollectionDetails(collectionId);
      } catch (error) {
        console.error("Error loading collection details:", error);
      }
    }
    setExpandedCollections(newExpanded);
  };

  const toggleSchedule = (scheduleId: string) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(scheduleId)) {
      newExpanded.delete(scheduleId);
    } else {
      newExpanded.add(scheduleId);
    }
    setExpandedSchedules(newExpanded);
  };

  const toggleEnvironment = async (environment: Environment) => {
    toggleEnvironmentOnCache(environment._id);
  };

  const toggleScheduleEnabled = (schedule: Schedule) => {
    const updatedSchedule = { ...schedule, enabled: !schedule.enabled };
    saveSchedule(updatedSchedule);
  };

  const startEditingEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment._id);
    setEditingEnvironmentData({ ...environment });
  };

  const cancelEditingEnvironment = () => {
    setEditingEnvironment(null);
    setEditingEnvironmentData(null);
  };

  const saveEditingEnvironment = async () => {
    if (editingEnvironmentData) {
      try {
        const { _id, name, variables } = editingEnvironmentData;
        await updateEnvironment(_id, {
          name,
          variables,
        });
        setEditingEnvironment(null);
        setEditingEnvironmentData(null);
      } catch (error) {
        console.error("Error updating environment:", error);
      }
    }
  };

  const updateEditingEnvironmentVariable = (
    key: string,
    value: string,
    oldKey?: string
  ) => {
    if (editingEnvironmentData) {
      const newVariables = { ...editingEnvironmentData.variables };

      if (oldKey && oldKey !== key) {
        delete newVariables[oldKey];
      }

      if (key.trim()) {
        newVariables[key] = value;
      }

      setEditingEnvironmentData({
        ...editingEnvironmentData,
        variables: newVariables,
      });
    }
  };

  const removeEditingEnvironmentVariable = (key: string) => {
    if (editingEnvironmentData) {
      const newVariables = { ...editingEnvironmentData.variables };
      delete newVariables[key];
      setEditingEnvironmentData({
        ...editingEnvironmentData,
        variables: newVariables,
      });
    }
  };

  const addEditingEnvironmentVariable = () => {
    if (editingEnvironmentData) {
      const newKey = `variable_${
        Object.keys(editingEnvironmentData.variables).length + 1
      }`;
      setEditingEnvironmentData({
        ...editingEnvironmentData,
        variables: {
          ...editingEnvironmentData.variables,
          [newKey]: "",
        },
      });
    }
  };

  // Collection editing functions
  const startEditingCollection = (collection: Collection) => {
    setEditingCollection(collection._id);
    setEditingCollectionData({ ...collection });
  };

  const cancelEditingCollection = () => {
    setEditingCollection(null);
    setEditingCollectionData(null);
  };

  const saveEditingCollection = async () => {
    if (editingCollectionData) {
      try {
        await updateCollection(editingCollectionData._id, {
          name: editingCollectionData.name,
          description: editingCollectionData.description,
        });
        setEditingCollection(null);
        setEditingCollectionData(null);
      } catch (error) {
        console.error("Error updating collection:", error);
      }
    }
  };

  // Schedule editing functions
  const startEditingSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule.id);
    setEditingScheduleData({ ...schedule });
  };

  const cancelEditingSchedule = () => {
    setEditingSchedule(null);
    setEditingScheduleData(null);
  };

  const saveEditingSchedule = () => {
    if (editingScheduleData) {
      saveSchedule(editingScheduleData);
      setEditingSchedule(null);
      setEditingScheduleData(null);
    }
  };

  const toggleCollectionInSchedule = (collectionId: string) => {
    if (editingScheduleData) {
      const collections = editingScheduleData.collections.includes(collectionId)
        ? editingScheduleData.collections.filter((id) => id !== collectionId)
        : [...editingScheduleData.collections, collectionId];

      setEditingScheduleData({
        ...editingScheduleData,
        collections,
      });
    }
  };

  const deleteRequestFromCollection = async (
    collectionId: string,
    requestId: string
  ) => {
    try {
      await deleteRequest(collectionId, requestId);
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const getScheduleExecutions = (scheduleId: string) => {
    return scheduleExecutions.filter((exec) => exec.scheduleId === scheduleId);
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle size={14} className="text-green-400" />;
      case "error":
        return <XCircle size={14} className="text-red-400" />;
      case "partial":
        return <AlertCircle size={14} className="text-yellow-400" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const displayCollections = searchQuery.trim() ? searchResults : collections;

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 space-y-4">
          <button
            onClick={() => setActiveTab("collections")}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              activeTab === "collections"
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-cyan-400 hover:bg-gray-700"
            }`}
            title="Collections"
          >
            <Folder size={18} />
          </button>

          <button
            onClick={() => setActiveTab("environments")}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              activeTab === "environments"
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-cyan-400 hover:bg-gray-700"
            }`}
            title="Environments"
          >
            <Globe size={18} />
          </button>

          <button
            onClick={() => setActiveTab("schedules")}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              activeTab === "schedules"
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-cyan-400 hover:bg-gray-700"
            }`}
            title="Schedules"
          >
            <Play size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-200 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab("collections")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "collections"
                ? "text-cyan-400 border-cyan-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            <Folder size={16} />
            <span>Collections</span>
          </button>

          <button
            onClick={() => setActiveTab("environments")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "environments"
                ? "text-cyan-400 border-cyan-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            <Globe size={16} />
            <span>Environments</span>
          </button>

          <button
            onClick={() => setActiveTab("schedules")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2 ${
              activeTab === "schedules"
                ? "text-cyan-400 border-cyan-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            <Play size={16} />
            <span>Schedules</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "collections" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">
                Collections
              </h3>
              <button
                onClick={createNewCollection}
                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="New Collection"
              >
                <FolderPlus size={16} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                  </div>
                )}
              </div>
              {searchQuery.trim() && (
                <div className="mt-2 text-xs text-gray-400">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""} found
                </div>
              )}
            </div>

            {collectionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : displayCollections.length === 0 ? (
              <div className="text-center py-12">
                {searchQuery.trim() ? (
                  <>
                    <Search size={48} className="text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-400 mb-2">
                      No Collections Found
                    </h4>
                    <p className="text-gray-500 text-sm">
                      No collections match your search criteria
                    </p>
                  </>
                ) : (
                  <>
                    <FolderPlus
                      size={48}
                      className="text-gray-600 mx-auto mb-4"
                    />
                    <h4 className="text-lg font-medium text-gray-400 mb-2">
                      No Collections Yet
                    </h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Create your first collection to organize your API requests
                    </p>
                    <button
                      onClick={createNewCollection}
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2 mx-auto"
                    >
                      <FolderPlus size={16} />
                      <span>Create Collection</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {displayCollections.map((collection) => (
                  <div
                    key={collection._id}
                    className="border border-gray-700 rounded-lg"
                  >
                    {editingCollection === collection._id ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={editingCollectionData?.name || ""}
                            onChange={(e) =>
                              setEditingCollectionData((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className="text-lg font-medium bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                            placeholder="Collection name"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEditingCollection}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEditingCollection}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <textarea
                            value={editingCollectionData?.description || ""}
                            onChange={(e) =>
                              setEditingCollectionData((prev) =>
                                prev
                                  ? { ...prev, description: e.target.value }
                                  : null
                              )
                            }
                            placeholder="Collection description"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => toggleCollection(collection._id)}
                          className="p-3 cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            {expandedCollections.has(collection._id) ? (
                              <ChevronDown
                                size={16}
                                className="text-gray-400"
                              />
                            ) : (
                              <ChevronRight
                                size={16}
                                className="text-gray-400"
                              />
                            )}
                            <Folder size={16} className="text-cyan-400" />
                            <span className="text-gray-300 font-medium">
                              {collection.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({collection.size})
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                createNewRequestInCollection(collection._id);
                              }}
                              className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                              title="Add Request"
                            >
                              <Plus size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingCollection(collection);
                              }}
                              className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCollection(collection._id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {expandedCollections.has(collection._id) && (
                          <div className="border-t border-gray-700 p-2 space-y-1">
                            {(() => {
                              const details = collectionDetails.get(
                                collection._id
                              );
                              if (!details) {
                                return (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">
                                      Loading requests...
                                    </p>
                                  </div>
                                );
                              }

                              if (details.requests.length === 0) {
                                return (
                                  <div className="text-center py-6 text-gray-500 text-sm">
                                    <FileText
                                      size={24}
                                      className="mx-auto mb-2 opacity-50"
                                    />
                                    <p>No requests in this collection</p>
                                    <button
                                      onClick={() =>
                                        createNewRequestInCollection(
                                          collection._id
                                        )
                                      }
                                      className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 mx-auto"
                                    >
                                      <Plus size={12} />
                                      <span>Add your first request</span>
                                    </button>
                                  </div>
                                );
                              }

                              return details.requests.map((request) => (
                                <div
                                  key={request._id}
                                  onClick={() => setActiveRequest(request)}
                                  className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between group ${
                                    activeRequest?._id === request._id
                                      ? "bg-cyan-500/20 border border-cyan-500/30"
                                      : "hover:bg-gray-600"
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                        request.method === "GET"
                                          ? "bg-green-500/20 text-green-400"
                                          : request.method === "POST"
                                          ? "bg-blue-500/20 text-blue-400"
                                          : request.method === "PUT"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : request.method === "DELETE"
                                          ? "bg-red-500/20 text-red-400"
                                          : "bg-gray-500/20 text-gray-400"
                                      }`}
                                    >
                                      {request.method}
                                    </span>
                                    <span className="text-gray-300 text-sm">
                                      {request.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteRequestFromCollection(
                                        collection._id,
                                        request._id
                                      );
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all"
                                    title="Delete request"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "environments" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">
                Environments
              </h3>
              <button
                onClick={createNewEnvironment}
                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="New Environment"
              >
                <Plus size={16} />
              </button>
            </div>

            {environmentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : environments.length === 0 ? (
              <div className="text-center py-12">
                <Globe size={48} className="text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">
                  No Environments Yet
                </h4>
                <p className="text-gray-500 text-sm mb-4">
                  Create environments to manage variables across different
                  stages
                </p>
                <button
                  onClick={createNewEnvironment}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Create Environment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {environments.map((environment) => (
                  <div
                    key={environment._id}
                    className="border border-gray-700 rounded-lg"
                  >
                    {editingEnvironment === environment._id ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={editingEnvironmentData?.name || ""}
                            onChange={(e) =>
                              setEditingEnvironmentData((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className="text-lg font-medium bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                            placeholder="Environment name"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEditingEnvironment}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEditingEnvironment}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-300">
                              Variables
                            </h4>
                            <button
                              onClick={addEditingEnvironmentVariable}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                            >
                              <Plus size={12} />
                              <span>Add Variable</span>
                            </button>
                          </div>

                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {Object.entries(
                              editingEnvironmentData?.variables || {}
                            ).map(([key, value], index) => (
                              <div
                                key={index}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="text"
                                  value={key}
                                  onChange={(e) =>
                                    updateEditingEnvironmentVariable(
                                      e.target.value,
                                      value,
                                      key
                                    )
                                  }
                                  placeholder="Variable name"
                                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) =>
                                    updateEditingEnvironmentVariable(
                                      key,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Variable value"
                                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                                />
                                <button
                                  onClick={() =>
                                    removeEditingEnvironmentVariable(key)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleEnvironment(environment)}
                              className={`p-1 rounded transition-colors ${
                                environment.isActive
                                  ? "text-green-400 hover:text-green-300"
                                  : "text-gray-400 hover:text-gray-300"
                              }`}
                              title={
                                environment.isActive ? "Deactivate" : "Activate"
                              }
                            >
                              {environment.isActive ? (
                                <Power size={16} />
                              ) : (
                                <PowerOff size={16} />
                              )}
                            </button>
                            <h4 className="text-lg font-medium text-gray-300">
                              {environment.name}
                            </h4>
                            {environment.isActive && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                startEditingEnvironment(environment)
                              }
                              className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteEnvironment(environment._id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="text-sm text-gray-400">
                          {Object.keys(environment.variables).length}{" "}
                          variable(s)
                        </div>

                        {Object.keys(environment.variables).length > 0 && (
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(environment.variables).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center space-x-2 text-xs"
                                >
                                  <span className="text-cyan-400 font-mono">
                                    {key}:
                                  </span>
                                  <span className="text-gray-300 truncate">
                                    {value}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "schedules" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Schedules</h3>
              <button
                onClick={createNewSchedule}
                className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="New Schedule"
              >
                <Plus size={16} />
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={48} className="text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">
                  No Schedules Yet
                </h4>
                <p className="text-gray-500 text-sm mb-4">
                  Create automated schedules to run your collections
                  periodically
                </p>
                <button
                  onClick={createNewSchedule}
                  className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Create Schedule</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-gray-700 rounded-lg"
                  >
                    {editingSchedule === schedule.id ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={editingScheduleData?.name || ""}
                            onChange={(e) =>
                              setEditingScheduleData((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            className="text-lg font-medium bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-cyan-400 focus:outline-none"
                            placeholder="Schedule name"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={saveEditingSchedule}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEditingSchedule}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <textarea
                            value={editingScheduleData?.description || ""}
                            onChange={(e) =>
                              setEditingScheduleData((prev) =>
                                prev
                                  ? { ...prev, description: e.target.value }
                                  : null
                              )
                            }
                            placeholder="Schedule description"
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Interval (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingScheduleData?.interval || 60}
                            onChange={(e) =>
                              setEditingScheduleData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      interval: parseInt(e.target.value) || 60,
                                    }
                                  : null
                              )
                            }
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Collections to Run
                          </label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {collections.map((collection) => (
                              <label
                                key={collection._id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    editingScheduleData?.collections.includes(
                                      collection._id
                                    ) || false
                                  }
                                  onChange={() =>
                                    toggleCollectionInSchedule(collection._id)
                                  }
                                  className="w-4 h-4 text-cyan-400 bg-gray-800 border-gray-600 rounded focus:ring-cyan-400"
                                />
                                <span className="text-sm text-gray-300">
                                  {collection.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({collection.size} requests)
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => toggleSchedule(schedule.id)}
                          className="p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              {expandedSchedules.has(schedule.id) ? (
                                <ChevronDown
                                  size={16}
                                  className="text-gray-400"
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className="text-gray-400"
                                />
                              )}
                              <Clock size={16} className="text-purple-400" />
                              <h4 className="text-lg font-medium text-gray-300">
                                {schedule.name}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  schedule.enabled
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {schedule.enabled ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleScheduleEnabled(schedule);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  schedule.enabled
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-gray-400 hover:text-green-400"
                                }`}
                                title={schedule.enabled ? "Disable" : "Enable"}
                              >
                                {schedule.enabled ? (
                                  <Power size={14} />
                                ) : (
                                  <PowerOff size={14} />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingSchedule(schedule);
                                }}
                                className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSchedule(schedule.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-400 space-y-1">
                            <div>Interval: {schedule.interval} minutes</div>
                            <div>
                              Collections: {schedule.collections.length}
                            </div>
                            {schedule.lastRun && (
                              <div className="flex items-center space-x-2">
                                <span>
                                  Last run:{" "}
                                  {new Date(schedule.lastRun).toLocaleString()}
                                </span>
                                {schedule.lastResult &&
                                  getExecutionStatusIcon(schedule.lastResult)}
                              </div>
                            )}
                          </div>
                        </div>

                        {expandedSchedules.has(schedule.id) && (
                          <div className="border-t border-gray-700 p-4">
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                                <Calendar size={14} />
                                <span>Execution History</span>
                              </h5>

                              {getScheduleExecutions(schedule.id).length ===
                              0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                  <Calendar
                                    size={24}
                                    className="mx-auto mb-2 opacity-50"
                                  />
                                  <p>No executions yet</p>
                                  <p className="text-xs mt-1">
                                    Enable the schedule to start running
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {getScheduleExecutions(schedule.id)
                                    .slice(0, 10)
                                    .map((execution) => (
                                      <div
                                        key={execution.id}
                                        className={`p-3 rounded-lg border ${
                                          execution.status === "success"
                                            ? "bg-green-900/20 border-green-500/30"
                                            : execution.status === "error"
                                            ? "bg-red-900/20 border-red-500/30"
                                            : "bg-yellow-900/20 border-yellow-500/30"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center space-x-2">
                                            {getExecutionStatusIcon(
                                              execution.status
                                            )}
                                            <span className="text-sm font-medium text-gray-300">
                                              {new Date(
                                                execution.startTime
                                              ).toLocaleString()}
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-400">
                                            {Math.round(
                                              (new Date(
                                                execution.endTime
                                              ).getTime() -
                                                new Date(
                                                  execution.startTime
                                                ).getTime()) /
                                                1000
                                            )}
                                            s
                                          </span>
                                        </div>

                                        <div className="text-xs text-gray-400 space-y-1">
                                          <div>
                                            {execution.successfulRequests}/
                                            {execution.totalRequests} requests
                                            successful
                                          </div>
                                          {execution.error && (
                                            <div className="text-red-400 font-mono">
                                              {execution.error}
                                            </div>
                                          )}
                                        </div>

                                        {execution.collections.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                            {execution.collections.map(
                                              (collection) => (
                                                <div
                                                  key={collection.id}
                                                  className="text-xs"
                                                >
                                                  <div className="flex items-center space-x-2">
                                                    {collection.status ===
                                                    "success" ? (
                                                      <CheckCircle
                                                        size={12}
                                                        className="text-green-400"
                                                      />
                                                    ) : (
                                                      <XCircle
                                                        size={12}
                                                        className="text-red-400"
                                                      />
                                                    )}
                                                    <span className="text-gray-300">
                                                      {collection.name}
                                                    </span>
                                                    <span className="text-gray-500">
                                                      (
                                                      {
                                                        collection.requests.filter(
                                                          (r) =>
                                                            r.status ===
                                                            "success"
                                                        ).length
                                                      }
                                                      /
                                                      {
                                                        collection.requests
                                                          .length
                                                      }
                                                      )
                                                    </span>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
